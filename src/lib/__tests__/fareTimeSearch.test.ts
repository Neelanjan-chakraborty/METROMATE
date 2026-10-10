import { loadBundledDataset } from '../dataset';
import { getFare, FARE_UNAVAILABLE_MESSAGE } from '../fareCalculator';
import { getJourneyTime, getServiceInfo } from '../journeyTime';
import { buildNetwork, findRoute } from '../routing';
import { searchStations, normalize } from '../search';
import type { FareTable, RouteResult } from '../../types';

const ds = loadBundledDataset();
const net = buildNetwork(ds);
const route = (a: string, b: string) => {
  const r = findRoute(net, a, b);
  if (!r.ok) throw new Error('no route');
  return r as RouteResult;
};

describe('fares', () => {
  it('never invents a fare: the bundled dataset has none', () => {
    const f = getFare(ds.fares, 'MTRS', 'MAHM');
    expect(f).toEqual({ status: 'unavailable', message: FARE_UNAVAILABLE_MESSAGE });
    expect(FARE_UNAVAILABLE_MESSAGE).toBe('Fare unavailable offline');
  });

  it('returns a fare only for an exact verified pair; the reverse direction only if symmetry was proven', () => {
    const table: FareTable = {
      ...ds.fares,
      status: 'available',
      pairs: [
        {
          fromStationId: 'MTRS',
          toStationId: 'MAHM',
          amountInr: 40,
          fareType: 'Single journey (test fixture)',
          validFrom: null,
          sourceUrl: 'https://example.invalid/fixture',
          verifiedAt: '2026-01-01',
          verificationStatus: 'verified',
        },
        {
          fromStationId: 'APMC',
          toStationId: 'MAHM',
          amountInr: 99,
          fareType: 'x',
          validFrom: null,
          sourceUrl: 'https://example.invalid/fixture',
          verifiedAt: '2026-01-01',
          verificationStatus: 'unverified',
        },
      ],
    };
    expect(getFare(table, 'MTRS', 'MAHM')).toMatchObject({ status: 'available', amountInr: 40 });
    // not proven symmetric -> the reverse journey has no verified fare
    expect(getFare(table, 'MAHM', 'MTRS').status).toBe('unavailable');
    expect(getFare({ ...table, symmetric: true }, 'MAHM', 'MTRS')).toMatchObject({ status: 'available', amountInr: 40 });
    expect(getFare(table, 'MTRS', 'KORD').status).toBe('unavailable');
    // unverified pairs are ignored
    expect(getFare(table, 'APMC', 'MAHM').status).toBe('unavailable');
  });
});

describe('journey time and service info', () => {
  it('does not calculate a journey time without verified per-station times', () => {
    const r = getJourneyTime(net, route('MTRS', 'MAHM'));
    expect(r.status).toBe('unavailable');
  });

  it('sums times only when every hop has a verified value', () => {
    const timed = buildNetwork({
      stations: ds.stations,
      corridors: ds.corridors,
      connections: ds.connections.map((c) => ({ ...c, estimatedTravelMinutes: 2 })),
    });
    const r = findRoute(timed, 'MAHM', 'SEBD');
    if (!r.ok) throw new Error('route');
    expect(getJourneyTime(timed, r)).toMatchObject({ status: 'estimated', minutes: 2 });
  });

  it('lists the published timetable lines a route uses, in order', () => {
    const lines = getServiceInfo(ds.timetable, route('TLTG', 'MAHM')).map((s) => s.line.id);
    expect(lines).toEqual(['line-1', 'line-2', 'line-3']);
    expect(getServiceInfo(ds.timetable, route('KOBG', 'GIFC')).map((s) => s.line.id)).toEqual(['line-3', 'line-4']);
    expect(getServiceInfo(ds.timetable, route('MAHM', 'INFC')).map((s) => s.line.id)).toEqual(['line-3']);
  });

  it('flags the timetable as static, not live', () => {
    expect(ds.timetable.isLive).toBe(false);
  });
});

describe('station search', () => {
  const top = (q: string) => searchStations(ds.stations, ds.landmarks, q)[0]?.station.id;

  it('matches names regardless of case and spacing', () => {
    expect(top('MOTERA')).toBe('MTRS');
    expect(top('rajivnagar')).toBe('RNMS');
    expect(top('Rajiv Nagar')).toBe('RNMS');
    expect(top('sector 10a')).toBe('SEAO');
  });

  it('matches common aliases', () => {
    expect(top('secretariat')).toBe('SVAL');
    expect(top('PDPU')).toBe('PDEU');
    expect(top('kalupur railway')).toBe('KPMS');
    expect(top('amraiwadi')).toBe('ARVD');
    expect(top('koba gam')).toBe('KOBG');
  });

  it('resolves landmark names to their station and says so', () => {
    const hit = searchStations(ds.stations, ds.landmarks, 'akshardham temple')[0];
    expect(hit.station.id).toBe('AKDM');
    const law = searchStations(ds.stations, ds.landmarks, 'law university')[0];
    expect(law.station.id).toBe('GNLU');
    expect(law.matchedOn).toBe('alias');
  });

  it('lists all stations A–Z for an empty query and nothing for junk', () => {
    expect(searchStations(ds.stations, ds.landmarks, '', 100)).toHaveLength(54);
    expect(searchStations(ds.stations, ds.landmarks, 'zzzzqq')).toHaveLength(0);
  });

  it('normalises accents and punctuation', () => {
    expect(normalize('  Sector-10A! ')).toBe('sector 10a');
  });
});
