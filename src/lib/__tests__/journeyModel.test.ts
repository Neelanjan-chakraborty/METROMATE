import { loadBundledDataset } from '../dataset';
import { buildNetwork, findRoute } from '../routing';
import { buildStationPoints } from '../locator';
import { buildGeometry, distanceAtProgress, isUndergroundAt, pathBetween, pointAtDistance, projectRoute, tunnelHopIndexes } from '../journeyModel';
import type { RouteResult } from '../../types';

const ds = loadBundledDataset();
const net = buildNetwork(ds);
const points = buildStationPoints(ds.stations, []);
const coord = (id: string) => points.get(id) ?? null;
const underground = (id: string) => ds.stations.find((s) => s.id === id)?.stationType === 'underground';
const route = (a: string, b: string) => {
  const r = findRoute(net, a, b);
  if (!r.ok) throw new Error(r.message);
  return r as RouteResult;
};

describe('buildGeometry', () => {
  it('builds a path through every station, increasing along the route', () => {
    const r = route('APMC', 'MAHM');
    const g = buildGeometry(r.stationIds, coord, underground)!;
    expect(g).not.toBeNull();
    expect(g.stations).toHaveLength(r.stationIds.length);
    for (let i = 1; i < g.stations.length; i++) expect(g.stations[i].distM).toBeGreaterThan(g.stations[i - 1].distM);
    expect(g.hops).toHaveLength(r.stationIds.length - 1);
    // roughly the published 41.7 km; pins are estimates and corners are straight-line, so allow slack
    expect(g.totalM / 1000).toBeGreaterThan(30);
    expect(g.totalM / 1000).toBeLessThan(50);
  });

  it('keeps each station within a few tens of metres of its pin (corners are only slightly rounded)', () => {
    const r = route('TLTG', 'VTLG');
    const proj = projectRoute(r.stationIds, coord)!;
    const g = buildGeometry(r.stationIds, coord, underground)!;
    g.stations.forEach((s, i) => expect(Math.hypot(s.x - proj[i].x, s.y - proj[i].y)).toBeLessThan(40));
  });

  it('returns null rather than guessing when a station position is missing', () => {
    const r = route('APMC', 'GRMS');
    expect(buildGeometry(r.stationIds, (id) => (id === 'PLDI' ? null : coord(id)), underground)).toBeNull();
    expect(buildGeometry(['APMC'], coord, underground)).toBeNull();
  });

  it('marks tunnels from the dataset: Shahpur to Kankaria East underground, portals at either end', () => {
    const r = route('OHCI', 'ARPK');
    const g = buildGeometry(r.stationIds, coord, underground)!;
    const kinds = g.hops.map((h) => h.kind);
    expect(kinds).toEqual(['portal', 'tunnel', 'tunnel', 'tunnel', 'portal']);
    expect(tunnelHopIndexes(g)).toEqual([0, 1, 2, 3, 4]);
    // portal position is an approximation at the hop's midpoint
    expect(g.hops[0].tunnelRange).toEqual([0.5, 1]);
    expect(g.hops[4].tunnelRange).toEqual([0, 0.5]);
    expect(isUndergroundAt(g, 0.2)).toBe(false);
    expect(isUndergroundAt(g, 0.8)).toBe(true);
    expect(isUndergroundAt(g, 2.5)).toBe(true);
    expect(isUndergroundAt(g, 4.2)).toBe(true);
    expect(isUndergroundAt(g, 4.8)).toBe(false);
  });

  it('an all-elevated route has no tunnel', () => {
    const g = buildGeometry(route('TLTG', 'SPSD').stationIds, coord, underground)!;
    expect(tunnelHopIndexes(g)).toEqual([]);
  });
});

describe('position helpers', () => {
  const r = route('GNLU', 'GIFC');
  const g = buildGeometry(r.stationIds, coord, underground)!;
  it('maps fractional progress to distance and back to a point on the path', () => {
    expect(distanceAtProgress(g, 0)).toBe(g.stations[0].distM);
    expect(distanceAtProgress(g, g.stations.length - 1)).toBe(g.stations[g.stations.length - 1].distM);
    const mid = distanceAtProgress(g, 0.5);
    expect(mid).toBeGreaterThan(g.stations[0].distM);
    expect(mid).toBeLessThan(g.stations[1].distM);
    const p = pointAtDistance(g, mid);
    expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
  });
  it('heading is continuous (no 360° jumps) along the whole path', () => {
    const big = buildGeometry(route('TLTG', 'VTLG').stationIds, coord, underground)!;
    for (let i = 1; i < big.path.length; i++) expect(Math.abs(big.path[i].heading - big.path[i - 1].heading)).toBeLessThan(120);
  });
  it('clamps distances outside the path', () => {
    expect(pointAtDistance(g, -50).s).toBe(0);
    expect(pointAtDistance(g, g.totalM + 500).s).toBe(g.totalM);
  });
});

describe('pathBetween', () => {
  it('returns the stretch between two distances with interpolated ends', () => {
    const g = buildGeometry(route('TLTG', 'SPSD').stationIds, coord, underground)!;
    const a = g.stations[1].distM;
    const b = g.stations[2].distM;
    const pts = pathBetween(g, a, b);
    expect(pts[0].s).toBeCloseTo(a, 6);
    expect(pts[pts.length - 1].s).toBeCloseTo(b, 6);
    for (let i = 1; i < pts.length; i++) expect(pts[i].s).toBeGreaterThanOrEqual(pts[i - 1].s);
    expect(pathBetween(g, b, a)[0].s).toBeCloseTo(a, 6);
  });
});
