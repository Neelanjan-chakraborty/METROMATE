/*
 * Route geometry for the journey illustration, computed in plain JS so the server render and the client agree:
 * a polyline with filleted corners is sampled densely, and `at(t)` returns the point and heading at a share
 * of the route's length. The same samples draw the SVG path, so vehicles sit exactly on their lines.
 */

export type Pt = readonly [number, number];

export interface Route {
  d: string;
  length: number;
  /** Point and heading (degrees) at share `t` (0..1) of the route's length. */
  at: (t: number) => { x: number; y: number; angle: number };
  /** Share of the route's length closest to a point (used to light stations as the line reaches them). */
  shareAt: (p: Pt) => number;
}

export function makeRoute(points: Pt[], radius = 26): Route {
  const pts: [number, number][] = [[points[0][0], points[0][1]]];
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const l1 = Math.hypot(px - cx, py - cy);
    const l2 = Math.hypot(nx - cx, ny - cy);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const t1: Pt = [cx + ((px - cx) / l1) * r, cy + ((py - cy) / l1) * r];
    const t2: Pt = [cx + ((nx - cx) / l2) * r, cy + ((ny - cy) / l2) * r];
    // quadratic fillet t1 → (corner) → t2
    for (let k = 0; k <= 10; k++) {
      const s = k / 10;
      const a = (1 - s) * (1 - s);
      const b = 2 * (1 - s) * s;
      const c = s * s;
      pts.push([a * t1[0] + b * cx + c * t2[0], a * t1[1] + b * cy + c * t2[1]]);
    }
  }
  const last = points[points.length - 1];
  pts.push([last[0], last[1]]);

  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const length = cum[cum.length - 1];
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

  const at = (t: number) => {
    const target = Math.min(1, Math.max(0, t)) * length;
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid;
      else hi = mid;
    }
    const seg = cum[hi] - cum[lo] || 1;
    const f = (target - cum[lo]) / seg;
    const [x0, y0] = pts[lo];
    const [x1, y1] = pts[hi];
    return { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f, angle: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI };
  };

  const shareAt = ([x, y]: Pt) => {
    let best = 0;
    let bestD = Infinity;
    pts.forEach(([px, py], i) => {
      const dd = (px - x) ** 2 + (py - y) ** 2;
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    });
    return cum[best] / length;
  };

  return { d, length, at, shareAt };
}

/** Smooth start and stop for a vehicle crossing its leg. */
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
