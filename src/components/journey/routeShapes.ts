import { pathBetween, type RouteGeometry } from '../../lib/journeyModel';
import { SCALE, WORLD_PAD } from './sceneConfig';

export interface Pt {
  x: number;
  y: number;
}

export interface WorldMap {
  toWorld: (x: number, y: number) => Pt;
  width: number;
  height: number;
}

/** Maps route metres to world pixels, keeping everything positive with a generous border. */
export function makeWorld(geom: RouteGeometry): WorldMap {
  const { minX, minY, maxX, maxY } = geom.bounds;
  return {
    toWorld: (x, y) => ({ x: (x - minX) * SCALE + WORLD_PAD, y: (y - minY) * SCALE + WORLD_PAD }),
    width: (maxX - minX) * SCALE + WORLD_PAD * 2,
    height: (maxY - minY) * SCALE + WORLD_PAD * 2,
  };
}

export const polyD = (pts: Pt[], dx = 0, dy = 0) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${(p.x - dx).toFixed(1)} ${(p.y - dy).toFixed(1)}`).join(' ');

export interface HopShapes {
  bbox: { x: number; y: number; w: number; h: number };
  all: Pt[];
  elevated: Pt[][];
  tunnel: Pt[][];
  lenPx: number;
}

const PAD = 26;

function seg(geom: RouteGeometry, world: WorldMap, s0: number, s1: number): Pt[] {
  return pathBetween(geom, s0, s1).map((p) => world.toWorld(p.x, p.y));
}

/** Drawn pieces of one hop: the elevated stretches and the underground stretches (portals at mid-hop). */
export function hopShapes(geom: RouteGeometry, world: WorldMap, hopIdx: number): HopShapes {
  const hop = geom.hops[hopIdx];
  const all = seg(geom, world, hop.startM, hop.endM);
  let elevated: Pt[][] = [];
  let tunnel: Pt[][] = [];
  if (hop.kind === 'elevated') elevated = [all];
  else if (hop.kind === 'tunnel') tunnel = [all];
  else if (hop.tunnelRange) {
    // The portal's real position is unknown: it is drawn at the middle of the hop.
    const mid = hop.startM + 0.5 * hop.lengthM;
    if (hop.tunnelRange[0] === 0) {
      tunnel = [seg(geom, world, hop.startM, mid)];
      elevated = [seg(geom, world, mid, hop.endM)];
    } else {
      elevated = [seg(geom, world, hop.startM, mid)];
      tunnel = [seg(geom, world, mid, hop.endM)];
    }
  }
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const x = Math.min(...xs) - PAD;
  const y = Math.min(...ys) - PAD;
  return { bbox: { x, y, w: Math.max(...xs) + PAD - x, h: Math.max(...ys) + PAD - y }, all, elevated, tunnel, lenPx: hop.lengthM * SCALE };
}

/** Polyline of the first `fraction` of a hop (for the "completed" glow). */
export function hopPrefix(geom: RouteGeometry, world: WorldMap, hopIdx: number, fraction: number): Pt[] {
  const hop = geom.hops[hopIdx];
  return seg(geom, world, hop.startM, hop.startM + Math.max(0, Math.min(1, fraction)) * hop.lengthM);
}

/** Points every `every` px along a polyline (for pillars and tunnel lights). */
export function samplesAlong(pts: Pt[], every: number): Pt[] {
  const out: Pt[] = [];
  let carry = every / 2;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    let t = carry;
    while (t < d) {
      out.push({ x: a.x + ((b.x - a.x) * t) / d, y: a.y + ((b.y - a.y) * t) / d });
      t += every;
    }
    carry = t - d;
  }
  return out;
}
