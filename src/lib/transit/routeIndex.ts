import { normalize } from '../search';
import type { TransitIndex } from './transitIndex';
import type { AgencyId } from './types';

/**
 * Bus routes as the Bus tab shows them: grouped by agency, with directions, scheduled first/last departure,
 * trips per day and how often buses leave in each part of the day. Everything is computed from the scheduled
 * trip starts in the timetable feed; none of it is live.
 */

export interface RouteDir {
  dir: number;
  /** The pattern (stop sequence) with the most trips in this direction. */
  pattern: number;
  /** Name of the last stop of the main pattern (the feed has no headsigns, so this is derived). */
  headsign: string;
  origin: string;
  stops: number;
  trips: number;
}

export interface RouteInfo {
  index: number;
  id: string;
  short: string;
  long: string;
  agency: AgencyId;
  patterns: number[];
  dirs: RouteDir[];
  trips: number;
  /** Earliest and latest scheduled departure from a pattern's first stop, minutes since the service day began. */
  first: number | null;
  last: number | null;
}

export interface RouteIndex {
  routes: RouteInfo[];
  byAgency: Record<AgencyId, RouteInfo[]>;
  byId: Map<string, number>;
  norm: string[];
}

const cache = new WeakMap<TransitIndex, RouteIndex>();

const natural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

export function buildRouteIndex(ix: TransitIndex): RouteIndex {
  const hit = cache.get(ix);
  if (hit) return hit;
  const d = ix.data;
  const patternsOf: number[][] = d.routes.id.map(() => []);
  d.patterns.route.forEach((r, p) => patternsOf[r].push(p));
  const routes: RouteInfo[] = d.routes.id.map((id, r) => {
    const pats = patternsOf[r];
    const byDir = new Map<number, number[]>();
    for (const p of pats) (byDir.get(d.patterns.dir[p]) ?? byDir.set(d.patterns.dir[p], []).get(d.patterns.dir[p])!).push(p);
    const dirs: RouteDir[] = [...byDir.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([dir, ps]) => {
        const main = ps.reduce((best, p) => (d.patterns.startT[p].length > d.patterns.startT[best].length ? p : best), ps[0]);
        const stops = d.patterns.stops[main];
        return {
          dir,
          pattern: main,
          headsign: d.stops.name[stops[stops.length - 1]],
          origin: d.stops.name[stops[0]],
          stops: stops.length,
          trips: ps.reduce((s, p) => s + d.patterns.startT[p].length, 0),
        };
      });
    let first: number | null = null;
    let last: number | null = null;
    let trips = 0;
    for (const p of pats) {
      const t = d.patterns.startT[p];
      trips += t.length;
      if (t.length) {
        first = first === null ? t[0] : Math.min(first, t[0]);
        last = last === null ? t[t.length - 1] : Math.max(last, t[t.length - 1]);
      }
    }
    return { index: r, id, short: d.routes.short[r], long: d.routes.long[r], agency: d.agencies[d.routes.agency[r]].id, patterns: pats, dirs, trips, first, last };
  });
  const byAgency: Record<AgencyId, RouteInfo[]> = { AJL: [], AMTS: [], GTSL: [] };
  for (const r of routes) byAgency[r.agency].push(r);
  for (const k of Object.keys(byAgency) as AgencyId[]) byAgency[k].sort((a, b) => natural(a.short, b.short));
  const out: RouteIndex = { routes, byAgency, byId: new Map(routes.map((r) => [r.id, r.index])), norm: routes.map((r) => normalize(`${r.short} ${r.long}`)) };
  cache.set(ix, out);
  return out;
}

// ---------------------------------------------------------------- headways

export interface HeadwayBand {
  label: string;
  fromMin: number;
  toMin: number;
  trips: number;
  /** Median / shortest / longest gap between consecutive departures in the band, minutes; null with fewer than two. */
  median: number | null;
  min: number | null;
  max: number | null;
}

const BANDS: [string, number, number][] = [
  ['Early 04:00–07:00', 240, 420],
  ['Morning 07:00–10:00', 420, 600],
  ['Midday 10:00–16:00', 600, 960],
  ['Evening 16:00–20:00', 960, 1200],
  ['Night 20:00 onwards', 1200, 1740],
];

/** How often scheduled buses leave a pattern's first stop in each part of the day. */
export function headwayBands(ix: TransitIndex, pattern: number): HeadwayBand[] {
  const starts = ix.data.patterns.startT[pattern];
  return BANDS.map(([label, a, b]) => {
    const inBand = starts.filter((t) => t >= a && t < b);
    const gaps: number[] = [];
    for (let i = 1; i < inBand.length; i++) gaps.push(inBand[i] - inBand[i - 1]);
    gaps.sort((x, y) => x - y);
    return { label, fromMin: a, toMin: b, trips: inBand.length, median: gaps.length ? gaps[Math.floor(gaps.length / 2)] : null, min: gaps.length ? gaps[0] : null, max: gaps.length ? gaps[gaps.length - 1] : null };
  });
}

// ------------------------------------------------------------------ search

/** Routes by number or by place name in the route's name. Number matches rank first. */
export function searchRoutes(ri: RouteIndex, query: string, limit = 40): RouteInfo[] {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(' ');
  const scored: { r: RouteInfo; score: number }[] = [];
  ri.routes.forEach((r, i) => {
    const n = ri.norm[i];
    if (!tokens.every((t) => n.includes(t))) return;
    const short = normalize(r.short);
    let score = 40;
    if (short === q) score = 100;
    else if (short.startsWith(q)) score = 80;
    else if (n.startsWith(q)) score = 60;
    scored.push({ r, score });
  });
  scored.sort((a, b) => b.score - a.score || natural(a.r.short, b.r.short));
  return scored.slice(0, limit).map((s) => s.r);
}

/**
 * Minutes after a trip's first departure at each stop of the pattern, using the vector shared by the most
 * trips (the typical run). Scheduled offsets; not live.
 */
export function typicalOffsets(ix: TransitIndex, pattern: number): number[] {
  const vecs = ix.data.patterns.vectors[pattern];
  const startV = ix.data.patterns.startV[pattern];
  const counts = new Map<number, number>();
  for (const v of startV) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = startV.length ? startV[0] : 0;
  let bc = -1;
  for (const [v, c] of counts) {
    if (c > bc || (c === bc && v < best)) {
      best = v;
      bc = c;
    }
  }
  return vecs[best] ?? [];
}
