import type { ShapesData, TransitData } from './types.ts';

/*
 * Matches the feed's road shapes to bus patterns. The feed does not say which shape a trip follows (the
 * trips' shape_id is empty), so a pattern is matched to the shape that its stops lie on: at least 90 % of
 * its stops within 80 m of one shape, and the stops must follow the shape in order (a monotone sweep, so a
 * looping shape cannot jump back). The shape is clipped to the first..last stop, simplified (Douglas-Peucker)
 * and stored once however many patterns share it. Patterns with no good match get no line.
 * Pure (no file access); written without TS-only runtime syntax so Node can run it directly.
 */

export const MATCH_RADIUS_M = 80;
export const MATCH_FRACTION = 0.9;
export const SIMPLIFY_M = 10;

type LL = [number, number];

const M_PER_DEG = 111_195;

const dist = (a: LL, b: LL): number => {
  const dLat = (a[0] - b[0]) * M_PER_DEG;
  const dLon = (a[1] - b[1]) * M_PER_DEG * Math.cos(((a[0] + b[0]) / 2) * (Math.PI / 180));
  return Math.hypot(dLat, dLon);
};

export function parseShapes(text: string): Map<string, LL[]> {
  const lines = text.split(/\r?\n/);
  const head = lines[0].replace(/^﻿/, '').split(',');
  const id = head.indexOf('shape_id');
  const lat = head.indexOf('shape_pt_lat');
  const lon = head.indexOf('shape_pt_lon');
  const seq = head.indexOf('shape_pt_sequence');
  const raw = new Map<string, [number, number, number][]>();
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const c = lines[i].split(',');
    const k = c[id];
    let list = raw.get(k);
    if (!list) raw.set(k, (list = []));
    list.push([Number(c[seq]), Number(c[lat]), Number(c[lon])]);
  }
  const out = new Map<string, LL[]>();
  for (const [k, v] of raw) {
    v.sort((a, b) => a[0] - b[0]);
    out.set(k, v.map((p) => [p[1], p[2]] as LL));
  }
  return out;
}

/** Douglas-Peucker in metres (local flat frame). Keeps the first and last point. */
export function simplify(pts: LL[], tolM: number): LL[] {
  if (pts.length < 3) return pts.slice();
  const k = Math.cos(pts[0][0] * (Math.PI / 180));
  const xy = pts.map((p) => [p[1] * M_PER_DEG * k, p[0] * M_PER_DEG]);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const dx = xy[b][0] - xy[a][0];
    const dy = xy[b][1] - xy[a][1];
    const len = Math.hypot(dx, dy) || 1e-9;
    let best = -1;
    let bi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (xy[i][0] - xy[a][0]) - dx * (xy[i][1] - xy[a][1])) / len;
      if (d > best) {
        best = d;
        bi = i;
      }
    }
    if (best > tolM) {
      keep[bi] = 1;
      stack.push([a, bi], [bi, b]);
    }
  }
  return pts.filter((_, i) => keep[i] === 1);
}

/**
 * Walks the stops along the shape in order. Returns the slice from the first to the last stop and how many
 * stops sat on the shape, or null if the stops do not follow it in order.
 */
export function sweep(shape: LL[], stops: LL[]): { slice: LL[]; onShape: number } | null {
  let prev = 0;
  let first = -1;
  let last = -1;
  let on = 0;
  for (const s of stops) {
    let found = -1;
    let bestD = Infinity;
    for (let j = prev; j < shape.length; j++) {
      const d = dist(shape[j], s);
      if (d <= MATCH_RADIUS_M) {
        if (d < bestD) {
          bestD = d;
          found = j;
        } else if (found >= 0 && d > bestD + MATCH_RADIUS_M) break; // moved clearly past the closest point
      } else if (found >= 0 && d > MATCH_RADIUS_M * 2) break;
    }
    if (found < 0) continue; // an off-shape stop is tolerated (counted below)
    if (first < 0) first = found;
    last = found;
    prev = found;
    on++;
  }
  if (first < 0 || last <= first) return null;
  return { slice: shape.slice(first, last + 1), onShape: on };
}

/** Encodes a polyline as [lat0, lon0, dLat, dLon, ...] in integer 1e-5 degrees. */
export function encodeLine(pts: LL[]): number[] {
  const out: number[] = [];
  let pa = 0;
  let po = 0;
  pts.forEach((p, i) => {
    const a = Math.round(p[0] * 1e5);
    const o = Math.round(p[1] * 1e5);
    out.push(i === 0 ? a : a - pa, i === 0 ? o : o - po);
    pa = a;
    po = o;
  });
  return out;
}

export function decodeLine(enc: number[]): LL[] {
  const out: LL[] = [];
  let a = 0;
  let o = 0;
  for (let i = 0; i < enc.length; i += 2) {
    a += enc[i];
    o += enc[i + 1];
    out.push([a / 1e5, o / 1e5]);
  }
  return out;
}

export interface ShapeBuildInput {
  transit: Pick<TransitData, 'stops' | 'patterns' | 'routes' | 'agencies'>;
  shapesText: string;
}

export function buildShapes(input: ShapeBuildInput): ShapesData {
  const { transit } = input;
  const shapes = parseShapes(input.shapesText);
  // coarse grid of shape points (cell ~ 220 m) -> shape ids
  const CELL = 0.002;
  const cell = (la: number, lo: number) => `${Math.floor(la / CELL)}|${Math.floor(lo / CELL)}`;
  const grid = new Map<string, Map<string, LL[]>>();
  for (const [id, pts] of shapes) {
    for (const p of pts) {
      const k = cell(p[0], p[1]);
      let g = grid.get(k);
      if (!g) grid.set(k, (g = new Map()));
      let l = g.get(id);
      if (!l) g.set(id, (l = []));
      l.push(p);
    }
  }

  const lines: number[][] = [];
  const lineKey = new Map<string, number>();
  const pattern: number[] = [];
  const rev: number[] = [];
  const byAgency: Record<string, { matched: number; total: number }> = {};
  let matched = 0;

  transit.patterns.stops.forEach((stopIdx, p) => {
    const ag = transit.agencies[transit.routes.agency[transit.patterns.route[p]]].id;
    (byAgency[ag] ??= { matched: 0, total: 0 }).total++;
    const stops = stopIdx.map((s) => [transit.stops.lat[s], transit.stops.lon[s]] as LL);

    // candidate shapes: those with a point within 80 m of enough stops
    const score = new Map<string, number>();
    for (const s of stops) {
      const cx = Math.floor(s[0] / CELL);
      const cy = Math.floor(s[1] / CELL);
      const hit = new Set<string>();
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const g = grid.get(`${cx + dx}|${cy + dy}`);
          if (!g) continue;
          for (const [id, pts] of g) if (!hit.has(id) && pts.some((q) => dist(q, s) <= MATCH_RADIUS_M)) hit.add(id);
        }
      }
      for (const id of hit) score.set(id, (score.get(id) ?? 0) + 1);
    }
    const cands = [...score.entries()].filter(([, n]) => n / stops.length >= MATCH_FRACTION).sort((a, b) => b[1] - a[1] || (shapes.get(a[0])!.length - shapes.get(b[0])!.length));

    let best: { slice: LL[]; reversed: boolean; on: number } | null = null;
    for (const [id] of cands.slice(0, 4)) {
      const shape = shapes.get(id)!;
      for (const reversed of [false, true]) {
        const r = sweep(reversed ? [...shape].reverse() : shape, stops);
        if (r && r.onShape / stops.length >= MATCH_FRACTION && (!best || r.onShape > best.on)) best = { slice: r.slice, reversed, on: r.onShape };
      }
      if (best) break;
    }
    if (!best) {
      pattern.push(-1);
      rev.push(0);
      return;
    }
    const simple = simplify(best.slice, SIMPLIFY_M);
    const fwd = encodeLine(simple);
    const bwd = encodeLine([...simple].reverse());
    const kf = fwd.join(',');
    const kb = bwd.join(',');
    // store each road once; a pattern running the other way shares it with the rev flag
    let idx = lineKey.get(kf);
    let flip = 0;
    if (idx === undefined) {
      idx = lineKey.get(kb);
      flip = idx === undefined ? 0 : 1;
    }
    if (idx === undefined) {
      idx = lines.length;
      lines.push(fwd);
      lineKey.set(kf, idx);
    }
    pattern.push(idx);
    rev.push(flip);
    matched++;
    byAgency[ag].matched++;
  });

  const report = [`road shape matched for ${matched} of ${transit.patterns.stops.length} patterns (${Object.entries(byAgency).map(([k, v]) => `${k} ${v.matched}/${v.total}`).join(', ')}); ${lines.length} distinct polylines`];
  return { meta: { schema: 1, tolM: SIMPLIFY_M, matched, total: transit.patterns.stops.length, byAgency, report }, lines, pattern, rev };
}
