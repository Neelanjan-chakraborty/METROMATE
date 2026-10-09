/**
 * Illustrative city fabric for the live-tracking canvas: roads, blocks, towers, parks, trees and the
 * occasional flyover, generated deterministically per tile. It is decoration: MetroMate has no road or
 * building data, so none of this claims to match real streets. Only the route and the stations are
 * positioned from data, and the generator keeps the fabric clear of the route.
 */

export interface Shape {
  /** rect: x,y,w,h,r ; poly: pts ; circle: x,y,r ; line: pts + sw */
  k: 'rect' | 'poly' | 'circle' | 'line';
  fill?: string;
  stroke?: string;
  sw?: number;
  opacity?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  r?: number;
  pts?: string;
}

export const TILE = 288;

/** mulberry32 */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const tileSeed = (tx: number, ty: number) => (Math.imul(tx + 1013, 73856093) ^ Math.imul(ty + 7919, 19349663)) >>> 0;

const BUILD = ['#DAD7F3', '#E3DCF1', '#F0E2DB', '#D9E3F5', '#E6E4D8', '#E1D8EC'];
const TOWER = ['#C7CCF0', '#CFC9EE', '#D8CBE6'];
const SHADOW = '#9EA3CB';
const PARK = '#CDEADB';
const PARK_DARK = '#B6DEC8';
const ROAD = '#FFFFFF';
const ROAD_EDGE = '#DFE1F1';

function distToSeg(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

/** Distance in px from (x,y) to a polyline (flat [x0,y0,x1,y1,...], consecutive vertices joined). */
export function distToPolyline(x: number, y: number, poly: number[]): number {
  let best = Infinity;
  for (let i = 0; i + 3 < poly.length; i += 2) best = Math.min(best, distToSeg(x, y, poly[i], poly[i + 1], poly[i + 2], poly[i + 3]));
  return best;
}

/** Distance to a list of separate segments (flat [ax,ay,bx,by, ...]). */
export function distToSegments(x: number, y: number, segs: number[]): number {
  let best = Infinity;
  for (let i = 0; i + 3 < segs.length; i += 4) best = Math.min(best, distToSeg(x, y, segs[i], segs[i + 1], segs[i + 2], segs[i + 3]));
  return best;
}

/** The route's segments that can matter to a tile (within `margin` of its box), as flat segments. */
export function nearbyPolyline(poly: number[], tx: number, ty: number, margin: number): number[] {
  const x0 = tx * TILE - margin;
  const y0 = ty * TILE - margin;
  const x1 = (tx + 1) * TILE + margin;
  const y1 = (ty + 1) * TILE + margin;
  const out: number[] = [];
  for (let i = 0; i + 3 < poly.length; i += 2) {
    const ax = poly[i];
    const ay = poly[i + 1];
    const bx = poly[i + 2];
    const by = poly[i + 3];
    if (Math.max(ax, bx) < x0 || Math.min(ax, bx) > x1 || Math.max(ay, by) < y0 || Math.min(ay, by) > y1) continue;
    out.push(ax, ay, bx, by);
  }
  return out;
}

const GRID = 124;

/** Global road line positions: continuous across tiles because they depend only on the line index. */
function roadAt(k: number): number {
  const r = rng(Math.imul(k + 4099, 2654435761) >>> 0)();
  return k * GRID + (r - 0.5) * 46;
}
const roadWidth = (k: number) => (k % 4 === 0 ? 10 : 5.5);

/**
 * Shapes for one tile, in tile-local coordinates (0..TILE). The street grid, blocks, parks and trees are
 * generated per grid cell from global coordinates, so neighbouring tiles join seamlessly. `route` is the
 * route's segments in world px (flat [ax,ay,bx,by,...]), already filtered to this tile (see
 * nearbyPolyline); buildings and trees keep `clear` px away from it.
 */
export function tileShapes(tx: number, ty: number, route: number[], clear = 34): Shape[] {
  const ox = tx * TILE;
  const oy = ty * TILE;
  const shapes: Shape[] = [];
  const free = (gx: number, gy: number, pad = 0) => route.length < 4 || distToSegments(gx, gy, route) > clear + pad;
  const L = (gx: number, gy: number) => ({ x: gx - ox, y: gy - oy });

  const kx0 = Math.floor((ox - 30) / GRID) - 1;
  const kx1 = Math.ceil((ox + TILE + 30) / GRID) + 1;
  const ky0 = Math.floor((oy - 30) / GRID) - 1;
  const ky1 = Math.ceil((oy + TILE + 30) / GRID) + 1;

  // roads
  for (let k = kx0; k <= kx1; k++) {
    const x = roadAt(k) - ox;
    const w = roadWidth(k);
    shapes.push({ k: 'line', pts: `${x.toFixed(1)},-4 ${x.toFixed(1)},${TILE + 4}`, sw: w + 2.4, stroke: ROAD_EDGE });
    shapes.push({ k: 'line', pts: `${x.toFixed(1)},-4 ${x.toFixed(1)},${TILE + 4}`, sw: w, stroke: ROAD });
  }
  for (let l = ky0; l <= ky1; l++) {
    const y = roadAt(l + 9000) - oy;
    const w = roadWidth(l + 9000);
    shapes.push({ k: 'line', pts: `-4,${y.toFixed(1)} ${TILE + 4},${y.toFixed(1)}`, sw: w + 2.4, stroke: ROAD_EDGE });
    shapes.push({ k: 'line', pts: `-4,${y.toFixed(1)} ${TILE + 4},${y.toFixed(1)}`, sw: w, stroke: ROAD });
    // every ninth east-west road is a raised flyover with a soft shadow
    if (((l % 9) + 9) % 9 === 0) {
      shapes.push({ k: 'line', pts: `-4,${(y + 6).toFixed(1)} ${TILE + 4},${(y + 6).toFixed(1)}`, sw: 12, stroke: SHADOW, opacity: 0.3 });
      shapes.push({ k: 'line', pts: `-4,${y.toFixed(1)} ${TILE + 4},${y.toFixed(1)}`, sw: 12, stroke: '#CFD2EA' });
      shapes.push({ k: 'line', pts: `-4,${y.toFixed(1)} ${TILE + 4},${y.toFixed(1)}`, sw: 8.4, stroke: '#F6F6FD' });
      shapes.push({ k: 'line', pts: `-4,${y.toFixed(1)} ${TILE + 4},${y.toFixed(1)}`, sw: 0.9, stroke: '#C6C9E4' });
    }
  }

  // cells between roads
  for (let k = kx0; k < kx1; k++) {
    for (let l = ky0; l < ky1; l++) {
      const rand = rng(tileSeed(k, l));
      const x0 = roadAt(k) + roadWidth(k) / 2 + 5;
      const x1 = roadAt(k + 1) - roadWidth(k + 1) / 2 - 5;
      const y0 = roadAt(l + 9000) + roadWidth(l + 9000) / 2 + 5;
      const y1 = roadAt(l + 9001) - roadWidth(l + 9001) / 2 - 5;
      if (x1 - x0 < 20 || y1 - y0 < 20) continue;
      if (x1 < ox - 40 || x0 > ox + TILE + 40 || y1 < oy - 40 || y0 > oy + TILE + 40) continue;
      const cxm = (x0 + x1) / 2;
      const cym = (y0 + y1) / 2;
      const half = Math.max(x1 - x0, y1 - y0) / 2;

      if (rand() < 0.15 && free(cxm, cym, half - 14)) {
        const a = L(x0, y0);
        shapes.push({ k: 'rect', x: a.x, y: a.y, w: x1 - x0, h: y1 - y0, r: 12, fill: PARK });
        shapes.push({ k: 'rect', x: a.x + 7, y: a.y + 7, w: x1 - x0 - 14, h: y1 - y0 - 14, r: 9, fill: PARK_DARK, opacity: 0.5 });
        for (let t = 0; t < 5; t++) {
          const tx2 = x0 + 10 + rand() * (x1 - x0 - 20);
          const ty2 = y0 + 10 + rand() * (y1 - y0 - 20);
          const q = L(tx2, ty2);
          const r = 3.4 + rand() * 2.4;
          shapes.push({ k: 'circle', x: q.x + 1.5, y: q.y + 2, r, fill: SHADOW, opacity: 0.3 });
          shapes.push({ k: 'circle', x: q.x, y: q.y, r, fill: rand() < 0.5 ? '#A9DEC3' : '#8FD0AE' });
        }
        continue;
      }

      const count = 2 + Math.floor(rand() * 4);
      for (let b = 0; b < count; b++) {
        const w = 13 + rand() * 20;
        const h = 13 + rand() * 20;
        const gx = x0 + rand() * Math.max(1, x1 - x0 - w);
        const gy = y0 + rand() * Math.max(1, y1 - y0 - h);
        const tall = rand() < 0.14;
        const lift = tall ? 6 + rand() * 5 : 2 + rand() * 2;
        const fill = tall ? TOWER[Math.floor(rand() * TOWER.length)] : BUILD[Math.floor(rand() * BUILD.length)];
        const win = rand();
        if (gx + w > x1 + 1 || gy + h > y1 + 1) continue;
        if (gx + w + lift < ox - 4 || gx > ox + TILE + 4 || gy + h + lift * 1.3 < oy - 4 || gy > oy + TILE + 4) continue;
        if (!free(gx + w / 2, gy + h / 2, Math.max(w, h) / 2)) continue;
        const a = L(gx, gy);
        // extruded side faces, then the roof
        shapes.push({ k: 'poly', pts: `${a.x},${a.y + h} ${a.x + w},${a.y + h} ${a.x + w + lift},${a.y + h + lift * 1.3} ${a.x + lift},${a.y + h + lift * 1.3}`, fill: SHADOW, opacity: 0.42 });
        shapes.push({ k: 'rect', x: a.x, y: a.y, w, h, r: 2.2, fill });
        if (tall) shapes.push({ k: 'rect', x: a.x + w * 0.28, y: a.y + h * 0.28, w: w * 0.44, h: h * 0.44, r: 1.6, fill: '#FFFFFF', opacity: 0.55 });
        else if (win < 0.4) shapes.push({ k: 'rect', x: a.x + 2.5, y: a.y + 2.5, w: Math.max(3, w * 0.35), h: Math.max(3, h * 0.35), r: 1, fill: '#FFFFFF', opacity: 0.45 });
      }
      for (let t = 0; t < 3; t++) {
        const tx2 = x0 + rand() * (x1 - x0);
        const ty2 = y0 + rand() * (y1 - y0);
        const r = 3 + rand() * 2.4;
        const col = rand() < 0.5 ? '#A9DEC3' : '#8FD0AE';
        if (tx2 < ox - 6 || tx2 > ox + TILE + 6 || ty2 < oy - 6 || ty2 > oy + TILE + 6 || !free(tx2, ty2, 4)) continue;
        const q = L(tx2, ty2);
        shapes.push({ k: 'circle', x: q.x + 1.5, y: q.y + 2, r, fill: SHADOW, opacity: 0.3 });
        shapes.push({ k: 'circle', x: q.x, y: q.y, r, fill: col });
      }
    }
  }
  return shapes;
}
