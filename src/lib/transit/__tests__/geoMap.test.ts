import { bboxOf, makeProjector } from '../../geoProject';
import { createBusMapGeometry, busLegPoints, patternLatLon, legsToLines, lodFor, LOD_STEPS, pathD, projectLOD, linesBounds, legEnds, type LL } from '../geoMap';
import { buildRouteIndex } from '../routeIndex';
import { createPlanner, planTransit } from '../planner';
import { loadTransit } from '../transitData';
import type { ShapesData } from '../types';
import { loadBundledDataset } from '../../dataset';
import { buildStationPoints } from '../../locator';

const shapes = require('../../../../data/transit/shapes.json') as ShapesData;
const ix = loadTransit();
const ri = buildRouteIndex(ix);
const s = ix.data.stops;
const bbox = bboxOf(s.lat.map((la, i) => [la, s.lon[i]] as const))!;
const proj = makeProjector(bbox, 1400, 16);
const geo = createBusMapGeometry(ix, shapes, proj);

describe('path helpers', () => {
  it('pathD writes M then L with one decimal', () => {
    expect(pathD([1, 2, 3.14159, 4])).toBe('M1.0 2.0L3.1 4.0');
    expect(pathD([])).toBe('');
  });
  it('projectLOD keeps the first and last point and thins close ones', () => {
    const pts: LL[] = Array.from({ length: 200 }, (_, i) => [23 + i * 1e-5, 72.5]);
    const full = projectLOD(pts, proj, 0);
    const thin = projectLOD(pts, proj, 3);
    expect(full).toHaveLength(400);
    expect(thin.length).toBeLessThan(full.length);
    expect(thin.slice(0, 2)).toEqual(full.slice(0, 2));
    expect(thin.slice(-2)).toEqual(full.slice(-2));
  });
  it('lodFor picks coarser spacing at lower zoom, one of the discrete steps', () => {
    expect(lodFor(0.5)).toBeGreaterThan(lodFor(1));
    expect(lodFor(1)).toBeGreaterThan(lodFor(1.5));
    expect(lodFor(1.5)).toBeGreaterThan(lodFor(2.4));
    for (const sc of [0.4, 0.9, 1.4, 2.4]) expect(LOD_STEPS).toContain(lodFor(sc));
  });
});

describe('bus layers', () => {
  it('draws every route direction once, matched ones solid', () => {
    const lit = ri.routes.filter((r) => r.dirs.length > 0);
    expect(geo.drawables.length).toBeGreaterThan(300);
    expect(geo.drawables.length).toBeLessThanOrEqual(lit.reduce((n, r) => n + r.dirs.length, 0));
    const keys = new Set(geo.drawables.map((d) => d.key));
    expect(keys.size).toBe(geo.drawables.length);
  });
  it('BRTS is nearly all on road shapes; Gandhinagar buses have none', () => {
    const brts = geo.layer('AJL', 3);
    expect(brts.solidCount).toBeGreaterThan(brts.dashedCount * 3);
    const gtsl = geo.layer('GTSL', 3);
    expect(gtsl.solidCount).toBe(0);
    expect(gtsl.dashedCount).toBeGreaterThan(0);
  });
  it('a coarser step makes shorter paths and the result is cached', () => {
    const fine = geo.layer('AMTS', 0.6);
    const coarse = geo.layer('AMTS', 6);
    expect(coarse.solid.length).toBeLessThan(fine.solid.length);
    expect(geo.layer('AMTS', 6)).toBe(coarse);
  });
  it('without shapes everything is dashed', () => {
    const plain = createBusMapGeometry(ix, null, proj);
    expect(plain.layer('AJL', 3).solidCount).toBe(0);
    expect(plain.layer('AJL', 3).dashedCount).toBeGreaterThan(50);
  });
  it('all path coordinates fall inside the map', () => {
    const nums = (geo.layer('AMTS', 3).solid.slice(0, 150_000) + geo.layer('GTSL', 3).dashed).match(/-?\d+\.\d/g)!.map(Number);
    for (const n of nums) {
      expect(n).toBeGreaterThanOrEqual(-1);
      expect(n).toBeLessThanOrEqual(Math.max(proj.width, proj.height) + 1);
    }
  });
});

describe('a selected route', () => {
  it('has stops and marks the terminals of each direction', () => {
    const r = ri.byAgency.AMTS.find((x) => x.dirs.length === 2 && ix.data.patterns.stops[x.dirs[0].pattern][0] !== ix.data.patterns.stops[x.dirs[0].pattern].at(-1))!;
    const rp = geo.route(r.index, 1.5);
    expect(rp.stops.length).toBeGreaterThan(5);
    expect(rp.solidCount + rp.dashedCount).toBeGreaterThan(0);
    const st = ix.data.patterns.stops[r.dirs[0].pattern];
    const term = new Set(rp.stops.filter((x) => x.terminal).map((x) => x.stop));
    expect(term.has(st[0])).toBe(true);
    expect(term.has(st[st.length - 1])).toBe(true);
    expect(term.size).toBeLessThan(rp.stops.length / 2);
  });
});

describe('hit testing', () => {
  it('finds the stop under a tap and ignores far taps', () => {
    const i = ix.stopByGtfs.get('AMC_6161')!;
    const [x, y] = proj.project(s.lat[i], s.lon[i]);
    expect(geo.stopsNear(x + 2, y - 1, 8, ['AMTS'], 3)[0]).toBe(i);
    expect(geo.stopsNear(x + 500, y, 3, ['AMTS', 'AJL', 'GTSL'])).toEqual([]);
  });
  it('respects the visible agencies', () => {
    const j = ix.data.stops.agencies.findIndex((m) => m === 1 << 1); // BRTS-only stop
    expect(j).toBeGreaterThanOrEqual(0);
    const [x, y] = proj.project(s.lat[j], s.lon[j]);
    expect(geo.stopsNear(x, y, 4, ['AMTS'])).not.toContain(j);
    expect(geo.stopsNear(x, y, 4, ['AJL'])).toContain(j);
  });
  it('finds the route whose line passes under a tap', () => {
    const dr = geo.drawables.find((d) => d.agency === 'AJL' && d.matched)!;
    const { pts } = patternLatLon(ix, shapes, dr.pattern);
    const m = pts[Math.floor(pts.length / 2)];
    const [x, y] = proj.project(m[0], m[1]);
    const hits = geo.routesNear(x, y, 4, ['AJL'], 10);
    expect(hits.map((h) => h.route)).toContain(dr.route);
    expect(hits[0].distance).toBeLessThanOrEqual(4);
    expect(geo.routesNear(x + 400, y + 400, 2, ['AJL'])).toEqual([]);
  });
});

describe('journey legs', () => {
  const dataset = loadBundledDataset();
  const points = buildStationPoints(dataset.stations, []);
  const inp = { ix, shapes, stationPoint: (id: string) => points.get(id) ?? null };

  it('a bus leg between two stops on a matched shape follows the road', () => {
    const dr = geo.drawables.find((d) => d.agency === 'AJL' && d.matched)!;
    const n = ix.data.patterns.stops[dr.pattern].length;
    const leg = busLegPoints(ix, shapes, dr.pattern, 1, Math.min(n - 1, 6));
    expect(leg.matched).toBe(true);
    expect(leg.pts.length).toBeGreaterThan(2);
  });
  it('an unmatched pattern gives its stops, flagged straight', () => {
    const dr = geo.drawables.find((d) => !d.matched)!;
    const n = ix.data.patterns.stops[dr.pattern].length;
    const leg = busLegPoints(ix, shapes, dr.pattern, 0, n - 1);
    expect(leg.matched).toBe(false);
    expect(leg.pts).toHaveLength(n);
  });
  it('draws a real plan: every leg has a line and the ends are labelled', () => {
    const ctx = createPlanner({ ix, stations: dataset.stations, corridors: dataset.corridors, timetable: dataset.timetable, stationPoint: inp.stationPoint });
    const from = `bus:${s.id[ix.stopByGtfs.get('AMC_6161')!]}`;
    const to = dataset.stations.find((st) => /Vastral/i.test(st.name))!.id;
    const res = planTransit(ctx, { from, to, departAt: 9 * 60, date: new Date(2026, 9, 12) }, '2026-10-12');
    expect(res.status).toBe('ok');
    const plan = res.plans[0];
    const lines = legsToLines(inp, plan, proj, 1.5);
    expect(lines.length).toBeGreaterThanOrEqual(plan.legs.filter((l) => l.mode !== 'metro').length);
    const b = linesBounds(lines)!;
    expect(b.maxX).toBeGreaterThan(b.minX);
    const ends = legEnds(inp, plan, proj);
    expect(ends[0].kind).toBe('origin');
    expect(ends[ends.length - 1].kind).toBe('destination');
  });
});
