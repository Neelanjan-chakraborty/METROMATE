import { loadBundledDataset } from '../../dataset';
import { buildStationPoints } from '../../locator';
import { agenciesOf, routesAtStop } from '../transitIndex';
import { feedExpired, loadTransit, transitIfLoaded } from '../transitData';
import { placeName, resolvePlace, searchPlaces, searchStops } from '../places';
import { busStopId, gtfsStopId, isBusId } from '../types';

const ds = loadBundledDataset();
const stations = new Map(ds.stations.map((s) => [s.id, s]));
const points = buildStationPoints(ds.stations, []);
const ix = loadTransit();

describe('transit index', () => {
  it('loads once and is cached', () => {
    expect(loadTransit()).toBe(ix);
    expect(transitIfLoaded()).toBe(ix);
  });

  it('pattern-at-stop CSR covers every stop entry exactly once', () => {
    const entries = ix.data.patterns.stops.reduce((s, p) => s + p.length, 0);
    expect(ix.psOff[ix.data.stops.id.length]).toBe(entries);
    for (let k = 0; k < 2000; k++) {
      const stop = k % ix.data.stops.id.length;
      for (let e = ix.psOff[stop]; e < ix.psOff[stop + 1]; e++) expect(ix.data.patterns.stops[ix.psPattern[e]][ix.psPos[e]]).toBe(stop);
    }
  });

  it('walking links are symmetric and match the data', () => {
    expect(ix.wOff[ix.data.stops.id.length]).toBe(ix.data.links.stopStop.length * 2);
    const [a, b, m] = ix.data.links.stopStop[0];
    const fromA = [...Array(ix.wOff[a + 1] - ix.wOff[a]).keys()].map((i) => [ix.wTo[ix.wOff[a] + i], ix.wM[ix.wOff[a] + i]]);
    const fromB = [...Array(ix.wOff[b + 1] - ix.wOff[b]).keys()].map((i) => [ix.wTo[ix.wOff[b] + i], ix.wM[ix.wOff[b] + i]]);
    expect(fromA).toContainEqual([b, m]);
    expect(fromB).toContainEqual([a, m]);
  });

  it('station <-> stop links are mirrored and sorted by distance', () => {
    const grms = ix.stationStops.get('GRMS')!;
    expect(grms.length).toBeGreaterThan(0);
    for (let i = 1; i < grms.length; i++) expect(grms[i].m).toBeGreaterThanOrEqual(grms[i - 1].m);
    expect(ix.stopStations.get(grms[0].stop)!.some((x) => x.station === 'GRMS')).toBe(true);
    expect(ix.stationStops.has('GNLU')).toBe(false);
  });

  it('knows which agencies and routes serve a stop', () => {
    const stop = ix.stopByGtfs.get('AMC_6161')!; // P.D.P.U. Cross Road
    expect(agenciesOf(ix.data, stop)).toContain('AMTS');
    expect(routesAtStop(ix, stop).length).toBeGreaterThan(0);
  });

  it('expiry follows the feed end date', () => {
    expect(feedExpired(ix, '2026-10-10')).toBe(false);
    expect(feedExpired(ix, '2027-03-29')).toBe(false);
    expect(feedExpired(ix, '2027-03-30')).toBe(true);
  });
});

describe('ids', () => {
  it('namespaces bus stops, leaving metro ids alone', () => {
    expect(busStopId('AMC_1')).toBe('bus:AMC_1');
    expect(gtfsStopId('bus:AMC_1')).toBe('AMC_1');
    expect(isBusId('bus:AMC_1')).toBe(true);
    expect(isBusId('APMC')).toBe(false);
    expect(isBusId(null)).toBe(false);
  });
});

describe('place search', () => {
  it('finds a bus stop by name (any word), case-insensitively, and never returns stops for an empty query', () => {
    const hits = searchStops(ix, 'memnagar');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.name.toLowerCase().includes('memnagar'))).toBe(true);
    expect(searchStops(ix, '')).toEqual([]);
    expect(searchStops(ix, 'xyzzy nothing')).toEqual([]);
  });

  it('shows two same-named stops on opposite sides of a road once', () => {
    for (const h of searchStops(ix, 'rto', 50)) expect(typeof h.id).toBe('string');
    const all = searchStops(ix, 'a', 200);
    const keys = all.map((h) => h.name);
    // identical names are allowed only when the stops are far apart
    const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
    for (const name of new Set(dup)) {
      const stops = all.filter((h) => h.name === name).map((h) => h.stop);
      for (let i = 1; i < stops.length; i++) {
        const dLat = (ix.data.stops.lat[stops[i]] - ix.data.stops.lat[stops[0]]) * 111195;
        const dLon = (ix.data.stops.lon[stops[i]] - ix.data.stops.lon[stops[0]]) * 111195 * 0.92;
        expect(Math.hypot(dLat, dLon)).toBeGreaterThan(300);
      }
    }
  });

  it('merges stations and stops, metro first on a tie, and scopes work', () => {
    const all = searchPlaces(ds.stations, ds.landmarks, ix, 'gandhigram', 'all');
    expect(all[0].kind).toBe('station');
    expect(all.some((h) => h.kind === 'stop')).toBe(true);
    expect(searchPlaces(ds.stations, ds.landmarks, ix, 'gandhigram', 'metro').every((h) => h.kind === 'station')).toBe(true);
    expect(searchPlaces(ds.stations, ds.landmarks, ix, 'gandhigram', 'bus').every((h) => h.kind === 'stop')).toBe(true);
  });

  it('returns only stations while bus data is not loaded', () => {
    const hits = searchPlaces(ds.stations, ds.landmarks, null, 'gandhigram', 'all');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.kind === 'station')).toBe(true);
  });

  it('resolves ids to places and names (stops only when loaded)', () => {
    const stopId = busStopId('AMC_6161');
    const p = resolvePlace(stopId, stations, points, ix)!;
    expect(p.kind).toBe('stop');
    expect(p.name).toBe('P.D.P.U. Cross Road');
    expect(resolvePlace('APMC', stations, points, null)!.kind).toBe('station');
    expect(resolvePlace(stopId, stations, points, null)).toBeNull();
    expect(resolvePlace('bus:NOPE', stations, points, ix)).toBeNull();
    expect(placeName(stopId, stations, ix)).toBe('P.D.P.U. Cross Road');
    expect(placeName(stopId, stations, null)).toBeNull();
    expect(placeName('APMC', stations, null)).toBe('APMC');
  });
});
