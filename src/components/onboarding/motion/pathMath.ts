/**
 * Geometry for vehicles that follow a drawn route. A route is a polyline in artboard units; `buildTrack`
 * measures it once and `pointAt` finds the position and heading at any distance along it. `pointAt` is a
 * worklet, so animations can call it on the UI thread every frame without touching JavaScript.
 */
export type Pt = readonly [number, number];

export interface Track {
  /** Flat [x0, y0, x1, y1, ...]. */
  xy: number[];
  /** Cumulative distance at each point (cum[0] = 0). */
  cum: number[];
  total: number;
}

export function buildTrack(points: readonly Pt[]): Track {
  const xy: number[] = [];
  const cum: number[] = [];
  let total = 0;
  points.forEach(([x, y], i) => {
    if (i > 0) total += Math.hypot(x - points[i - 1][0], y - points[i - 1][1]);
    xy.push(x, y);
    cum.push(total);
  });
  return { xy, cum, total };
}

/** Position and heading (radians, 0 = pointing right) at distance `d` along the track; clamped to its ends. */
export function pointAt(track: Track, d: number): [number, number, number] {
  'worklet';
  const { xy, cum, total } = track;
  const n = cum.length;
  if (n === 1) return [xy[0], xy[1], 0];
  const dist = d < 0 ? 0 : d > total ? total : d;
  let i = 1;
  while (i < n - 1 && cum[i] < dist) i++;
  const seg = cum[i] - cum[i - 1];
  const f = seg === 0 ? 0 : (dist - cum[i - 1]) / seg;
  const x0 = xy[(i - 1) * 2];
  const y0 = xy[(i - 1) * 2 + 1];
  const x1 = xy[i * 2];
  const y1 = xy[i * 2 + 1];
  return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, Math.atan2(y1 - y0, x1 - x0)];
}

/** Rounds the corners of a polyline with quadratic curves, sampled into short straight pieces. */
export function roundedPolyline(points: readonly Pt[], radius: number, steps = 8): Pt[] {
  if (points.length < 3 || radius <= 0) return points.map((p) => [p[0], p[1]] as Pt);
  const out: Pt[] = [[points[0][0], points[0][1]]];
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const l1 = Math.hypot(cx - px, cy - py);
    const l2 = Math.hypot(nx - cx, ny - cy);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const ax = cx + ((px - cx) / l1) * r;
    const ay = cy + ((py - cy) / l1) * r;
    const bx = cx + ((nx - cx) / l2) * r;
    const by = cy + ((ny - cy) / l2) * r;
    out.push([ax, ay]);
    for (let s = 1; s < steps; s++) {
      const u = s / steps;
      const w0 = (1 - u) * (1 - u);
      const w1 = 2 * (1 - u) * u;
      const w2 = u * u;
      out.push([w0 * ax + w1 * cx + w2 * bx, w0 * ay + w1 * cy + w2 * by]);
    }
    out.push([bx, by]);
  }
  out.push([points[points.length - 1][0], points[points.length - 1][1]]);
  return out;
}

/** The part of a track between two distances, as points (for drawing a route only up to where it has got to). */
export function sliceTrack(track: Track, from: number, to: number): Pt[] {
  const a = Math.max(0, Math.min(track.total, from));
  const b = Math.max(a, Math.min(track.total, to));
  const out: Pt[] = [];
  const [ax, ay] = pointAt(track, a);
  out.push([ax, ay]);
  for (let i = 0; i < track.cum.length; i++) if (track.cum[i] > a && track.cum[i] < b) out.push([track.xy[i * 2], track.xy[i * 2 + 1]]);
  const [bx, by] = pointAt(track, b);
  out.push([bx, by]);
  return out;
}

export function toPathD(pts: readonly Pt[]): string {
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
}

/** Distance along the track of the point nearest to (x, y): used to place station nodes on a route. */
export function distanceOfNearest(track: Track, x: number, y: number): number {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < track.cum.length - 1; i++) {
    const x0 = track.xy[i * 2];
    const y0 = track.xy[i * 2 + 1];
    const dx = track.xy[(i + 1) * 2] - x0;
    const dy = track.xy[(i + 1) * 2 + 1] - y0;
    const len2 = dx * dx + dy * dy;
    const f = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
    const d = Math.hypot(x - (x0 + dx * f), y - (y0 + dy * f));
    if (d < bd) {
      bd = d;
      best = track.cum[i] + Math.sqrt(len2) * f;
    }
  }
  return best;
}

/** 0..1 ramp of `t` between `a` and `b` (clamped, linear). A worklet: used inside animated styles. */
export function stage(t: number, a: number, b: number): number {
  'worklet';
  if (t <= a) return 0;
  if (t >= b) return 1;
  return (t - a) / (b - a);
}

/** Smooth ease-out of `stage`, for reveals that should settle softly. */
export function stageOut(t: number, a: number, b: number): number {
  'worklet';
  const s = t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a);
  return 1 - (1 - s) * (1 - s) * (1 - s);
}
