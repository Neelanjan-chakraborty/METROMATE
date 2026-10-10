import { buildTransit, gtfsMinutes, parseCsv, type BuildInput } from '../gtfsBuild';
import type { TransitData } from '../types';

const csv = (rows: string[][]) => rows.map((r) => r.join(',')).join('\n') + '\n';

function fixture(over: Record<string, string> = {}): BuildInput {
  const files: Record<string, string> = {
    'agency.txt': csv([['agency_id', 'agency_name', 'agency_url'], ['AMTS', 'City buses', 'https://a'], ['AJL', 'Janmarg', 'https://j'], ['GTSL', 'Gandhinagar', 'https://g']]),
    'calendar.txt': csv([['service_id', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'start_date', 'end_date'], ['"1,2,3"', '1', '1', '1', '1', '1', '1', '1', '20260930', '20270329']]),
    'feed_info.txt': csv([['feed_publisher_name', 'feed_publisher_url', 'feed_start_date', 'feed_end_date'], ['Pub', 'https://p', '20260930', '20270329']]),
    'routes.txt': csv([['route_id', 'agency_id', 'route_short_name', 'route_long_name'], ['R1', 'AMTS', '1', 'A to C'], ['R2', 'AJL', '2', 'A to C brts']]),
    'stops.txt': csv([
      ['stop_id', 'stop_name', 'stop_lat', 'stop_lon'],
      ['A', 'Alpha (Metro Station)', '23.00000', '72.50000'],
      ['B', 'Bravo', '23.00100', '72.50000'],
      ['C', 'Charlie', '23.00200', '72.50000'],
      ['Z', 'Far away', '23.30000', '72.80000'],
    ]),
    'trips.txt': csv([
      ['route_id', 'service_id', 'trip_id', 'trip_headsign', 'direction_id', 'shape_id'],
      ['R1', '"1,2,3"', 'T1', 'C', '0', ''],
      ['R1', '"1,2,3"', 'T2', 'C', '0', ''],
      ['R1', '"1,2,3"', 'T3', 'C', '0', ''], // exact duplicate of T1
      ['R1', '"1,2,3"', 'T4', 'C', '0', ''], // runs past midnight
      ['R1', '"1,2,3"', 'T5', 'C', '0', ''], // absurd duration
      ['R2', '"1,2,3"', 'T6', 'C', '0', ''],
    ]),
    'stop_times.txt': csv([
      ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence', 'timepoint'],
      ...[['T1', '08:00:00', '08:05:00', '08:10:00'], ['T3', '08:00:00', '08:05:00', '08:10:00'], ['T2', '08:30:00', '08:36:00', '08:42:00'], ['T4', '23:50:00', '24:00:00', '24:10:00'], ['T5', '01:00:00', '10:00:00', '26:00:00'], ['T6', '09:00:00', '09:04:00', '09:08:00']].flatMap(([t, a, b, c]) => [
        [t, a, a, 'A', '1', '1'],
        [t, b, b, 'B', '2', '0'],
        [t, c, c, 'C', '3', '1'],
      ]),
      ['T6', '09:20:00', '09:20:00', 'Z', '4', '0'],
    ]),
    'areas.txt': csv([['area_id', 'area_name'], ['BRTS_AREA_1', 'Alpha'], ['BRTS_AREA_2', 'Charlie']]),
    'stop_areas.txt': csv([['area_id', 'stop_id'], ['BRTS_AREA_1', 'A'], ['BRTS_AREA_2', 'C']]),
    'fare_products.txt': csv([['fare_product_id', 'fare_product_name', 'rider_category_id', 'amount', 'currency'], ['BRTS_ADULT_10', 'a', 'BRTS_ADULT', '10', 'INR'], ['BRTS_CHILD_5', 'c', 'BRTS_CHILD', '5', 'INR'], ['BRTS_LUGGAGE_8', 'l', '', '8', 'INR']]),
    'fare_leg_rules.txt': csv([
      ['from_area_id', 'to_area_id', 'fare_product_id'],
      ['BRTS_AREA_1', 'BRTS_AREA_2', 'BRTS_ADULT_10'],
      ['BRTS_AREA_1', 'BRTS_AREA_2', 'BRTS_CHILD_5'],
      ['BRTS_AREA_1', 'BRTS_AREA_2', 'BRTS_LUGGAGE_8'],
      ['BRTS_AREA_2', 'BRTS_AREA_1', 'BRTS_ADULT_10'],
      ['BRTS_AREA_2', 'BRTS_AREA_1', 'BRTS_CHILD_5'],
    ]),
    ...over,
  };
  return { files, stations: [{ id: 'ALPH', latitude: 23.0003, longitude: 72.5 }, { id: 'FAR', latitude: 23.1, longitude: 72.6 }, { id: 'NONE', latitude: null, longitude: null }], sources: [{ name: 'fixture.zip', sha256: 'abc' }] };
}

describe('csv helpers', () => {
  it('parses quoted commas, doubled quotes and a BOM', () => {
    expect(parseCsv('﻿a,b\n"1,2","x ""y"""\n')).toEqual([{ a: '1,2', b: 'x "y"' }]);
  });
  it('reads times past 24:00 as minutes since the service day began', () => {
    expect(gtfsMinutes('08:30:00')).toBe(510);
    expect(gtfsMinutes('25:15:00')).toBe(1515);
    expect(gtfsMinutes('nope')).toBeNull();
  });
});

describe('buildTransit (fixture)', () => {
  let d: TransitData;
  beforeAll(() => {
    d = buildTransit(fixture());
  });

  it('keeps used stops, namespacing is left to the app, ids stay GTFS ids', () => {
    expect(d.stops.id).toEqual(['A', 'B', 'C', 'Z']);
    expect(d.stops.name[0]).toBe('Alpha (Metro Station)');
  });

  it('groups trips into patterns with distinct vectors and ascending starts', () => {
    const r1 = d.patterns.route.findIndex((r) => d.routes.id[r] === 'R1');
    expect(d.patterns.stops[r1]).toEqual([0, 1, 2]);
    expect(d.patterns.vectors[r1]).toEqual([[0, 5, 10], [0, 6, 12], [0, 10, 20]]);
    expect(d.patterns.startT[r1]).toEqual([480, 510, 1430]);
    expect(d.patterns.startV[r1].map((v) => d.patterns.vectors[r1][v][2])).toEqual([10, 12, 20]);
  });

  it('removes exact duplicate trips and drops absurd durations, reporting both', () => {
    expect(d.meta.counts.trips).toBe(4); // T1, T2, T4, T6; T3 is a duplicate, T5 is dropped
    expect(d.meta.report.join('\n')).toMatch(/duplicate trips removed: 1/);
    expect(d.meta.report.join('\n')).toMatch(/dropped 1 trip/);
  });

  it('keeps trips that pass midnight as minutes beyond 1440', () => {
    const r1 = d.patterns.route.findIndex((r) => d.routes.id[r] === 'R1');
    const last = d.patterns.startT[r1][2] + d.patterns.vectors[r1][d.patterns.startV[r1][2]][2];
    expect(last).toBe(1450);
  });

  it('records which agencies serve each stop (bit mask)', () => {
    expect(d.stops.agencies[0]).toBe(0b011); // AMTS + AJL
    expect(d.stops.agencies[3]).toBe(0b010); // AJL only
  });

  it('builds the BRTS fare matrix with adult and child fares, no luggage', () => {
    expect(d.fares.areas).toEqual(['Alpha', 'Charlie']);
    expect(d.fares.adult).toEqual([10]);
    expect(d.fares.child).toEqual([5]);
    expect(d.fares.matrix).toBe('-0' + '0-');
    expect(d.stops.area).toEqual([0, -1, 1, -1]);
  });

  it('links stations to nearby stops (flagging "metro" names) and stops to stops', () => {
    expect(d.links.stationStop.map((l) => [l.station, d.stops.id[l.stop], l.named])).toEqual([
      ['ALPH', 'A', true],
      ['ALPH', 'B', false],
      ['ALPH', 'C', false],
    ]);
    expect(d.links.stationStop[0].m).toBeLessThan(60);
    expect(d.links.stopStop.map(([a, b]) => [d.stops.id[a], d.stops.id[b]])).toEqual([['A', 'B'], ['A', 'C'], ['B', 'C']]);
    expect(d.meta.report.join('\n')).toMatch(/without: FAR/);
  });

  it('carries provenance and warns that the feed is unofficial', () => {
    expect(d.meta.source.validFrom).toBe('2026-09-30');
    expect(d.meta.source.validTo).toBe('2027-03-29');
    expect(d.meta.source.files[0]).toEqual({ name: 'fixture.zip', sha256: 'abc' });
    expect(d.meta.source.notes.join(' ')).toMatch(/not an official publication/);
  });

  it('is deterministic', () => {
    expect(JSON.stringify(buildTransit(fixture()))).toBe(JSON.stringify(d));
  });

  it('refuses a feed whose calendar the planner cannot assume', () => {
    const two = 'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\nA,1,1,1,1,1,1,1,20260930,20270329\nB,1,1,1,1,1,1,1,20260930,20270329\n';
    expect(() => buildTransit(fixture({ 'calendar.txt': two }))).toThrow(/exactly one calendar/);
    const weekdays = 'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\nA,1,1,1,1,1,0,0,20260930,20270329\n';
    expect(() => buildTransit(fixture({ 'calendar.txt': weekdays }))).toThrow(/every day/);
    expect(() => buildTransit(fixture({ 'calendar_dates.txt': 'service_id,date,exception_type\nA,20261101,2\n' }))).toThrow(/exceptions/);
  });
});
