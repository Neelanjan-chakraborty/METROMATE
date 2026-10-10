import { loadBundledDataset } from '../dataset';
import { buildNetwork, findRoute } from '../routing';
import {
  ARRIVING_M,
  accumulatorAccuracyM,
  buildLinks,
  buildStationPoints,
  classifyAccuracy,
  isHeadingAway,
  isUndergroundLink,
  locate,
  mergeStationFix,
  signalState,
  trackJourney,
  type Fix,
  type StationPoint,
} from '../locator';
import { haversineM, projectOnSegment } from '../geo';
import type { RouteResult } from '../../types';

const ds = loadBundledDataset();
const net = buildNetwork(ds);
const points = buildStationPoints(ds.stations, []);
const links = buildLinks(ds.connections);
const P = (id: string) => points.get(id)!;
const fixAt = (id: string, accuracyM: number | null = 10): Fix => ({ lat: P(id).lat, lon: P(id).lon, accuracyM, timestamp: 0 });
const lerp = (a: string, b: string, t: number, accuracyM: number | null = 10): Fix => ({
  lat: P(a).lat + (P(b).lat - P(a).lat) * t,
  lon: P(a).lon + (P(b).lon - P(a).lon) * t,
  accuracyM,
  timestamp: 0,
});
const route = (a: string, b: string) => {
  const r = findRoute(net, a, b);
  if (!r.ok) throw new Error('no route');
  return r as RouteResult;
};

describe('geo', () => {
  it('measures distances (1° of latitude ≈ 111 km)', () => {
    expect(haversineM({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeGreaterThan(111_000);
    expect(haversineM({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeLessThan(111_400);
  });

  it('projects a point onto a segment', () => {
    const a = { lat: 23, lon: 72 };
    const b = { lat: 23, lon: 72.01 };
    const mid = projectOnSegment({ lat: 23.001, lon: 72.005 }, a, b);
    expect(mid.t).toBeCloseTo(0.5, 2);
    expect(mid.distanceM).toBeGreaterThan(105);
    expect(mid.distanceM).toBeLessThan(115);
    expect(projectOnSegment({ lat: 23, lon: 71.9 }, a, b).t).toBe(0); // clamped
  });
});

describe('station points from the real dataset', () => {
  it('has coordinates for all 54 stations, all from the dataset', () => {
    expect(points.size).toBe(54);
    expect([...points.values()].every((p) => p.source === 'dataset')).toBe(true);
  });

  it('adjacent stations are plausibly 0.5–3 km apart', () => {
    for (const l of links) {
      const d = haversineM(P(l.fromId), P(l.toId));
      expect(d).toBeGreaterThan(500);
      expect(d).toBeLessThan(3000);
    }
  });

  it('prefers a precise recorded position over an estimated pin, but verified data over both', () => {
    const rec = [{ stationId: 'MTRS', lat: 23.1, lon: 72.6, accuracyM: 8 }];
    expect(buildStationPoints(ds.stations, rec).get('MTRS')).toMatchObject({ source: 'recorded', lat: 23.1 });
    const verified = ds.stations.map((s) => (s.id === 'MTRS' ? { ...s, coordinateStatus: 'verified' as const } : s));
    expect(buildStationPoints(verified, rec).get('MTRS')!.source).toBe('dataset');
    const coarse = [{ stationId: 'MTRS', lat: 23.1, lon: 72.6, accuracyM: 90 }];
    expect(buildStationPoints(ds.stations, coarse).get('MTRS')!.source).toBe('dataset');
  });
});

describe('classifyAccuracy / signalState', () => {
  it('classifies accuracy radii', () => {
    expect(classifyAccuracy(5)).toBe('precise');
    expect(classifyAccuracy(30)).toBe('precise');
    expect(classifyAccuracy(80)).toBe('good');
    expect(classifyAccuracy(800)).toBe('coarse');
    expect(classifyAccuracy(9000)).toBe('poor');
    expect(classifyAccuracy(null)).toBe('unknown');
  });

  it('flags a stale then lost signal and never invents one', () => {
    expect(signalState(1000, null)).toBe('none');
    expect(signalState(10_000, 5_000)).toBe('live');
    expect(signalState(30_000, 5_000)).toBe('stale');
    expect(signalState(100_000, 5_000)).toBe('lost');
  });
});

describe('locate', () => {
  it('reports "at station" for a good fix on a station', () => {
    expect(locate(fixAt('MTRS'), points, links)).toMatchObject({ kind: 'at-station', stationId: 'MTRS' });
  });

  it('still says at-station within the pin tolerance', () => {
    const f = { ...fixAt('PLDI'), lat: P('PLDI').lat + 0.001 }; // ~110 m north
    expect(locate(f, points, links)).toMatchObject({ kind: 'at-station', stationId: 'PLDI' });
  });

  it('reports between two stations with a fraction', () => {
    const r = locate(lerp('VDMS', 'RNIP', 0.5), points, links);
    expect(r.kind).toBe('between');
    if (r.kind === 'between') {
      expect([r.fromId, r.toId].sort()).toEqual(['RNIP', 'VDMS']);
      const t = r.fromId === 'VDMS' ? r.fraction : 1 - r.fraction;
      expect(t).toBeCloseTo(0.5, 1);
      expect(r.approximate).toBe(false);
    }
  });

  it('a coarse (cell/Wi-Fi class) fix on a station says only "near", flagged approximate', () => {
    const r = locate(fixAt('MTRS', 800), points, links);
    expect(r).toMatchObject({ kind: 'near-station', stationId: 'MTRS', approximate: true });
  });

  it('refuses to place a very inaccurate or invalid fix', () => {
    expect(locate(fixAt('MTRS', 6000), points, links)).toEqual({ kind: 'unreliable', reason: 'accuracy' });
    expect(locate({ lat: NaN, lon: 72, accuracyM: 5, timestamp: 0 }, points, links)).toEqual({ kind: 'unreliable', reason: 'invalid' });
  });

  it('says off-network far from every line, with the nearest station', () => {
    const r = locate({ lat: 19.07, lon: 72.87, accuracyM: 10, timestamp: 0 }, points, links);
    expect(r.kind).toBe('off-network');
  });

  it('reports no-reference when no station coordinates are known', () => {
    expect(locate(fixAt('MTRS'), new Map(), links)).toEqual({ kind: 'no-reference' });
  });

  it('falls back to near-station when only some stations have coordinates', () => {
    const only = new Map<string, StationPoint>([['MTRS', P('MTRS')]]);
    const f = { ...fixAt('MTRS'), lat: P('MTRS').lat + 0.006 }; // ~670 m away
    expect(locate(f, only, links)).toMatchObject({ kind: 'near-station', stationId: 'MTRS' });
  });
});

describe('underground links', () => {
  it('flags links touching the four underground stations', () => {
    const st = (id: string) => ds.stations.find((s) => s.id === id)!;
    expect(isUndergroundLink(st('KKES'), st('KPMS'))).toBe(true);
    expect(isUndergroundLink(st('ARPK'), st('KKES'))).toBe(true);
    expect(isUndergroundLink(st('SHHP'), st('OHCI'))).toBe(true);
    expect(isUndergroundLink(st('VDMS'), st('RNIP'))).toBe(false);
  });
});

describe('trackJourney', () => {
  const r = route('MAHM', 'APMC'); // 35 stations, indices 0..34
  const ids = r.stationIds;

  it('tracks a rider standing at a station', () => {
    const sector16 = ids.indexOf('SEAF');
    const j = trackJourney(fixAt('SEAF'), ids, points);
    expect(j).toMatchObject({ status: 'tracking', atStationId: 'SEAF', lastStationId: 'SEAF', nextStationId: ids[sector16 + 1], arrived: false });
    expect(j.stopsRemaining).toBe(ids.length - 1 - sector16);
  });

  it('interpolates progress between stations', () => {
    const i = ids.indexOf('GNLU');
    const j = trackJourney(lerp(ids[i], ids[i + 1], 0.5), ids, points);
    expect(j.status).toBe('tracking');
    expect(j.progress!).toBeCloseTo(i + 0.5, 1);
    expect(j.atStationId).toBeNull();
    expect(j.lastStationId).toBe(ids[i]);
    expect(j.nextStationId).toBe(ids[i + 1]);
    expect(j.stopsRemaining).toBe(ids.length - 1 - i);
  });

  it('says "arriving" shortly before the destination and "arrived" at it', () => {
    const n = ids.length;
    const dest = ids[n - 1];
    const prev = ids[n - 2];
    const d = haversineM(P(prev), P(dest));
    const t = 1 - (ARRIVING_M - 50) / d;
    const near = trackJourney(lerp(prev, dest, t), ids, points);
    expect(near.arriving).toBe(true);
    expect(near.arrived).toBe(false);
    expect(trackJourney(lerp(prev, dest, 0.2), ids, points).arriving).toBe(false);
    const done = trackJourney(fixAt(dest), ids, points);
    expect(done).toMatchObject({ arrived: true, arriving: false, stopsRemaining: 0, nextStationId: null });
  });

  it('reports off-route (no progress claimed) when far from the route', () => {
    const f = { ...fixAt('SEAF'), lat: P('APMC').lat - 0.06 }; // ~6.6 km south of the southern terminus
    const j = trackJourney(f, ids, points);
    expect(j.status).toBe('off-route');
    expect(j.progress).toBeNull();
    expect(j.offRouteM!).toBeGreaterThan(5000);
  });

  it('still works with partial coordinate coverage', () => {
    const sparse = new Map([...points].filter(([id]) => id === 'MAHM' || id === 'APMC' || id === 'GNLU'));
    const gnlu = ids.indexOf('GNLU');
    const j = trackJourney(fixAt('GNLU'), ids, sparse);
    expect(j).toMatchObject({ status: 'tracking', atStationId: 'GNLU' });
    expect(j.stopsRemaining).toBe(ids.length - 1 - gnlu);
    expect(trackJourney(fixAt('GNLU'), ids, new Map()).status).toBe('no-reference');
  });

  it('does not track on an unusable fix', () => {
    expect(trackJourney(fixAt('SEAF', 8000), ids, points).status).toBe('unreliable');
  });

  it('works along a route that changes lines', () => {
    const r2 = route('TLTG', 'GIFC');
    const j = trackJourney(fixAt('OHCI'), r2.stationIds, points);
    expect(j).toMatchObject({ status: 'tracking', atStationId: 'OHCI' });
    expect(trackJourney(fixAt('PDEU'), r2.stationIds, points).stopsRemaining).toBe(1);
  });
});

describe('heading away', () => {
  it('flags steadily decreasing progress only', () => {
    expect(isHeadingAway([5, 4.7, 4.3])).toBe(true);
    expect(isHeadingAway([5, 5.2, 5.4])).toBe(false);
    expect(isHeadingAway([5, 5.0, 4.98])).toBe(false);
    expect(isHeadingAway([5, 4.5])).toBe(false);
  });
});

describe('recording station positions', () => {
  it('rejects fixes that are too coarse or without accuracy', () => {
    expect(mergeStationFix(null, { lat: 23, lon: 72, accuracyM: 80 })).toBeNull();
    expect(mergeStationFix(null, { lat: 23, lon: 72, accuracyM: null })).toBeNull();
  });

  it('averages fixes, weighting the more accurate ones', () => {
    const a = mergeStationFix(null, { lat: 23.0, lon: 72.0, accuracyM: 10 })!;
    const b = mergeStationFix(a, { lat: 23.0002, lon: 72.0, accuracyM: 10 })!;
    expect(b.samples).toBe(2);
    expect(b.lat).toBeCloseTo(23.0001, 6);
    const c = mergeStationFix(b, { lat: 23.01, lon: 72.0, accuracyM: 50 })!; // poor fix barely moves it
    expect(c.lat).toBeLessThan(23.0006);
    expect(accumulatorAccuracyM(b)).toBeLessThan(accumulatorAccuracyM(a));
  });
});
