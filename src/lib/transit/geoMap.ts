import { flatMetres, pointSegmentDistance, type Projector } from '../geoProject';
import { buildRouteIndex } from './routeIndex';
import { decodeLine } from './shapeBuild';
import type { TransitLeg, TransitPlan } from './planner';
import type { TransitIndex } from './transitIndex';
import { AGENCY_IDS, gtfsStopId, isBusId, type AgencyId, type ShapesData } from './types';

/**
 * Geometry for the Bus & metro map. Bus lines are drawn on the road shape the build matched to a pattern
 * (see shapeBuild.ts), or as straight segments between its stops when no shape matched. The two kinds are
 * kept in separate paths so the map can draw them differently and say which is which.
 */

export type LL = [number, number];

/** Map-unit spacing used when drawing at a given zoom: coarser at low zoom. Discrete steps so results can be cached. */
export const LOD_STEPS = [6, 3, 1.5, 0.6] as const;
export function lodFor(scale: number): number {
  return scale < 0.8 ? LOD_STEPS[0] : scale < 1.3 ? LOD_STEPS[1] : scale < 2 ? LOD_STEPS[2] : LOD_STEPS[3];
}

const decodedCache = new WeakMap<ShapesData, LL[][]>();
export function decodedLines(shapes: ShapesData): LL[][] {
  let d = decodedCache.get(shapes);
  if (!d) {
    d = shapes.lines.map((l) => decodeLine(l) as LL[]);
    decodedCache.set(shapes, d);
  }
  return d;
}

/** A pattern's points on the ground and whether they follow a matched road shape. */
export function patternLatLon(ix: TransitIndex, shapes: ShapesData | null, p: number): { pts: LL[]; matched: boolean } {
  const li = shapes ? shapes.pattern[p] : -1;
  if (shapes && li >= 0) {
    const line = decodedLines(shapes)[li];
    return { pts: shapes.rev[p] ? [...line].reverse() : line, matched: true };
  }
  const s = ix.data.stops;
  return { pts: ix.data.patterns.stops[p].map((i) => [s.lat[i], s.lon[i]] as LL), matched: false };
}

/** Projects points, dropping any closer than `minSep` map units to the previous kept point (the last point is always kept). */
export function projectLOD(pts: readonly LL[], proj: Projector, minSep: number): number[] {
  const out: number[] = [];
  let lx = 0;
  let ly = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = proj.project(pts[i][0], pts[i][1]);
    const last = i === pts.length - 1;
    if (i === 0 || last || Math.hypot(x - lx, y - ly) >= minSep) {
      if (last && i > 0 && out.length >= 4 && Math.hypot(x - lx, y - ly) < minSep / 2) {
        out[out.length - 2] = x;
        out[out.length - 1] = y;
      } else out.push(x, y);
      lx = x;
      ly = y;
    }
  }
  return out;
}

/** SVG path data for a flat [x0,y0,x1,y1,…] list (one decimal is plenty at map scale). */
export function pathD(xy: readonly number[]): string {
  let d = '';
  for (let i = 0; i < xy.length; i += 2) d += `${i === 0 ? 'M' : 'L'}${xy[i].toFixed(1)} ${xy[i + 1].toFixed(1)}`;
  return d;
}

export interface Drawable {
  key: string;
  agency: AgencyId;
  route: number;
  pattern: number;
  matched: boolean;
}

export interface LayerPaths {
  /** Lines on a matched road shape. */
  solid: string;
  /** Lines drawn straight between stops because no road shape matched. */
  dashed: string;
  solidCount: number;
  dashedCount: number;
}

export interface RoutePaths extends LayerPaths {
  stops: { x: number; y: number; stop: number; name: string; terminal: boolean }[];
}

export interface HitRoute {
  route: number;
  distance: number;
}

export interface BusMapGeometry {
  proj: Projector;
  /** One drawable per distinct line: the main pattern of each direction of each route, de-duplicated. */
  drawables: Drawable[];
  layer(agency: AgencyId, minSep: number): LayerPaths;
  route(route: number, minSep: number): RoutePaths;
  stopsNear(x: number, y: number, radiusUnits: number, agencies: AgencyId[], limit?: number): number[];
  routesNear(x: number, y: number, radiusUnits: number, agencies: AgencyId[], limit?: number): HitRoute[];
}

function emptyLayer(): LayerPaths {
  return { solid: '', dashed: '', solidCount: 0, dashedCount: 0 };
}

export function createBusMapGeometry(ix: TransitIndex, shapes: ShapesData | null, proj: Projector): BusMapGeometry {
  const ri = buildRouteIndex(ix);
  const d = ix.data;

  const seen = new Set<string>();
  const drawables: Drawable[] = [];
  for (const r of ri.routes) {
    for (const dir of r.dirs) {
      const li = shapes ? shapes.pattern[dir.pattern] : -1;
      const key = li >= 0 ? `L${li}` : `S${dir.pattern}`;
      if (seen.has(key)) continue;
      seen.add(key);
      drawables.push({ key, agency: r.agency, route: r.index, pattern: dir.pattern, matched: li >= 0 });
    }
  }
  const byAgency = new Map<AgencyId, Drawable[]>(AGENCY_IDS.map((a) => [a, drawables.filter((x) => x.agency === a)]));

  const layers = new Map<string, LayerPaths>();
  const projected = new Map<string, number[]>();
  const full = (dr: Drawable): number[] => {
    let xy = projected.get(dr.key);
    if (!xy) {
      xy = projectLOD(patternLatLon(ix, shapes, dr.pattern).pts, proj, 0);
      projected.set(dr.key, xy);
    }
    return xy;
  };

  const collect = (items: { pattern: number }[], minSep: number): LayerPaths => {
    const out = emptyLayer();
    for (const it of items) {
      const { pts, matched } = patternLatLon(ix, shapes, it.pattern);
      const xy = projectLOD(pts, proj, minSep);
      if (xy.length < 4) continue;
      if (matched) {
        out.solid += pathD(xy);
        out.solidCount++;
      } else {
        out.dashed += pathD(xy);
        out.dashedCount++;
      }
    }
    return out;
  };

  return {
    proj,
    drawables,
    layer(agency, minSep) {
      const k = `${agency}|${minSep}`;
      let l = layers.get(k);
      if (!l) {
        l = collect(byAgency.get(agency) ?? [], minSep);
        layers.set(k, l);
      }
      return l;
    },
    route(route, minSep) {
      const info = ri.routes[route];
      const patterns = new Map<string, number>();
      for (const p of info.patterns) {
        const li = shapes ? shapes.pattern[p] : -1;
        const key = li >= 0 ? `L${li}` : `S${p}`;
        // keep the busiest pattern for each distinct line
        const prev = patterns.get(key);
        if (prev === undefined || d.patterns.startT[p].length > d.patterns.startT[prev].length) patterns.set(key, p);
      }
      const paths = collect([...patterns.values()].map((pattern) => ({ pattern })), minSep);
      // the first and last stop of each direction are the route's terminals
      const ends = new Set<number>();
      for (const dir of info.dirs) {
        const st = d.patterns.stops[dir.pattern];
        ends.add(st[0]);
        ends.add(st[st.length - 1]);
      }
      const stops = new Map<number, RoutePaths['stops'][number]>();
      for (const p of patterns.values()) {
        for (const s of d.patterns.stops[p]) {
          if (stops.has(s)) continue;
          const [x, y] = proj.project(d.stops.lat[s], d.stops.lon[s]);
          stops.set(s, { x, y, stop: s, name: d.stops.name[s], terminal: ends.has(s) });
        }
      }
      return { ...paths, stops: [...stops.values()] };
    },
    stopsNear(x, y, radiusUnits, agencies, limit = 5) {
      let mask = 0;
      for (const a of agencies) mask |= 1 << AGENCY_IDS.indexOf(a);
      const hits: { stop: number; dist: number }[] = [];
      for (let s = 0; s < d.stops.id.length; s++) {
        if ((d.stops.agencies[s] & mask) === 0) continue;
        const [sx, sy] = proj.project(d.stops.lat[s], d.stops.lon[s]);
        const dist = Math.hypot(sx - x, sy - y);
        if (dist <= radiusUnits) hits.push({ stop: s, dist });
      }
      return hits.sort((a, b) => a.dist - b.dist).slice(0, limit).map((h) => h.stop);
    },
    routesNear(x, y, radiusUnits, agencies, limit = 5) {
      const best = new Map<number, number>();
      for (const a of agencies) {
        for (const dr of byAgency.get(a) ?? []) {
          const xy = full(dr);
          let m = Infinity;
          for (let i = 0; i + 3 < xy.length; i += 2) {
            const dist = pointSegmentDistance(x, y, xy[i], xy[i + 1], xy[i + 2], xy[i + 3]);
            if (dist < m) m = dist;
          }
          if (m <= radiusUnits && m < (best.get(dr.route) ?? Infinity)) best.set(dr.route, m);
        }
      }
      return [...best.entries()]
        .map(([route, distance]) => ({ route, distance }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
    },
  };
}

// ---------------------------------------------------------------------------------------- journey legs

export interface LegLine {
  mode: TransitLeg['mode'];
  /** Flat projected [x,y,…] with the zoom's spacing applied. */
  xy: number[];
  /** True when drawn straight between known points rather than along a road shape (walks, unmatched bus, metro). */
  straight: boolean;
  agency?: AgencyId;
  corridorId?: string;
}

function nearestIndex(line: readonly LL[], p: LL): number {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < line.length; i++) {
    const dd = flatMetres(line[i][0], line[i][1], p[0], p[1]);
    if (dd < bd) {
      bd = dd;
      best = i;
    }
  }
  return best;
}

const chainLength = (pts: readonly LL[]): number => {
  let m = 0;
  for (let i = 1; i < pts.length; i++) m += flatMetres(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  return m;
};

/** The part of a bus pattern between two of its positions: the road shape between the two stops, else the stops themselves. */
export function busLegPoints(ix: TransitIndex, shapes: ShapesData | null, pattern: number, boardPos: number, alightPos: number): { pts: LL[]; matched: boolean } {
  const s = ix.data.stops;
  const stops = ix.data.patterns.stops[pattern].slice(boardPos, alightPos + 1).map((i) => [s.lat[i], s.lon[i]] as LL);
  const { pts: line, matched } = patternLatLon(ix, shapes, pattern);
  if (matched && stops.length >= 2) {
    const a = nearestIndex(line, stops[0]);
    const b = nearestIndex(line, stops[stops.length - 1]);
    if (a < b) {
      const slice = line.slice(a, b + 1);
      // a loop route can put both stops on the wrong lap; a wildly long slice means the straight chain is the honest drawing
      if (chainLength(slice) <= chainLength(stops) * 3 + 300) return { pts: [stops[0], ...slice, stops[stops.length - 1]], matched: true };
    }
  }
  return { pts: stops, matched: false };
}

export interface LegGeometryInput {
  ix: TransitIndex;
  shapes: ShapesData | null;
  stationPoint: (id: string) => { lat: number; lon: number } | null;
}

function refPoint(inp: LegGeometryInput, ref: { id: string }): LL | null {
  if (isBusId(ref.id)) {
    const i = inp.ix.stopByGtfs.get(gtfsStopId(ref.id));
    return i === undefined ? null : [inp.ix.data.stops.lat[i], inp.ix.data.stops.lon[i]];
  }
  const p = inp.stationPoint(ref.id);
  return p ? [p.lat, p.lon] : null;
}

/** Lines to draw for every leg of a plan; legs whose places have no coordinates are skipped. */
export function legsToLines(inp: LegGeometryInput, plan: TransitPlan, proj: Projector, minSep: number): LegLine[] {
  const out: LegLine[] = [];
  for (const leg of plan.legs) {
    if (leg.mode === 'bus') {
      const { pts, matched } = busLegPoints(inp.ix, inp.shapes, leg.pattern, leg.boardPos, leg.alightPos);
      out.push({ mode: 'bus', xy: projectLOD(pts, proj, minSep), straight: !matched, agency: leg.agency });
    } else if (leg.mode === 'metro') {
      const pts = leg.stationIds.map((id) => inp.stationPoint(id)).filter((p): p is NonNullable<typeof p> => !!p).map((p) => [p.lat, p.lon] as LL);
      if (pts.length >= 2) out.push({ mode: 'metro', xy: projectLOD(pts, proj, 0), straight: true, corridorId: leg.corridorId });
    } else {
      const a = refPoint(inp, leg.from);
      const b = refPoint(inp, leg.to);
      if (a && b) out.push({ mode: 'walk', xy: projectLOD([a, b], proj, 0), straight: true });
    }
  }
  return out.filter((l) => l.xy.length >= 4);
}

/** Bounding box (in map units) of a set of legs, or null when there is nothing to show. */
export function linesBounds(lines: readonly LegLine[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const l of lines) {
    for (let i = 0; i < l.xy.length; i += 2) {
      minX = Math.min(minX, l.xy[i]);
      maxX = Math.max(maxX, l.xy[i]);
      minY = Math.min(minY, l.xy[i + 1]);
      maxY = Math.max(maxY, l.xy[i + 1]);
    }
  }
  return minX === Infinity ? null : { minX, minY, maxX, maxY };
}

export interface LegEnd {
  x: number;
  y: number;
  kind: 'origin' | 'destination' | 'change';
  name: string;
}

/** Points to label on a journey: where it starts, ends and changes vehicle. */
export function legEnds(inp: LegGeometryInput, plan: TransitPlan, proj: Projector): LegEnd[] {
  const out: LegEnd[] = [];
  const add = (ref: { id: string; name: string }, kind: LegEnd['kind']) => {
    const p = refPoint(inp, ref);
    if (!p) return;
    const [x, y] = proj.project(p[0], p[1]);
    out.push({ x, y, kind, name: ref.name });
  };
  plan.legs.forEach((leg, i) => {
    if (i === 0) add(leg.from, 'origin');
    else if (leg.mode !== 'walk' && plan.legs[i - 1].mode !== 'walk') add(leg.from, 'change');
    if (i === plan.legs.length - 1) add(leg.to, 'destination');
  });
  return out;
}

// ------------------------------------------------------------------------------------------- metro layer

export interface MetroLayer {
  lines: { id: string; color: string; d: string }[];
  stations: { id: string; name: string; x: number; y: number; interchange: boolean; terminal: boolean; corridor: string }[];
}

/**
 * Metro lines drawn through the station pins. The pins are ESTIMATED (from unofficial map pins), so the
 * lines are approximate and the map says so.
 */
export function buildMetroLayer(
  corridors: readonly { id: string; color: string; sequence: string[]; forwardTerminalId: string; backwardTerminalId: string }[],
  stations: readonly { id: string; name: string; isInterchange: boolean; corridorIds: string[] }[],
  point: (id: string) => { lat: number; lon: number } | null,
  proj: Projector,
): MetroLayer {
  const byId = new Map(stations.map((s) => [s.id, s]));
  const lines: MetroLayer['lines'] = [];
  const out: MetroLayer['stations'] = [];
  const done = new Set<string>();
  for (const c of corridors) {
    const xy: number[] = [];
    for (const id of c.sequence) {
      const p = point(id);
      const st = byId.get(id);
      if (!p || !st) continue;
      const [x, y] = proj.project(p.lat, p.lon);
      xy.push(x, y);
      if (!done.has(id)) {
        done.add(id);
        out.push({ id, name: st.name, x, y, interchange: st.isInterchange, terminal: id === c.forwardTerminalId || id === c.backwardTerminalId, corridor: c.id });
      }
    }
    if (xy.length >= 4) lines.push({ id: c.id, color: c.color, d: pathD(xy) });
  }
  return { lines, stations: out };
}
