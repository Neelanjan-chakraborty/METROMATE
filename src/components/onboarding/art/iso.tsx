import React from 'react';
import { G, Path, Polygon, Rect } from 'react-native-svg';
import { shade, tint } from './shapes';

/** Isometric projection for scene 2: grid cell (x, y) at height z to artboard units. x runs down-right, y down-left. */
export const ISO_U = 21;
export const ISO_OX = 180;
export const ISO_OY = 168;

export function iso(x: number, y: number, z = 0): [number, number] {
  return [ISO_OX + (x - y) * 0.866 * ISO_U, ISO_OY + (x + y) * 0.5 * ISO_U - z * ISO_U];
}

const pts = (a: [number, number][]) => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** A flat tile on the ground (or at height z). */
export function IsoTile({ x, y, w, d, z = 0, fill, opacity = 1 }: { x: number; y: number; w: number; d: number; z?: number; fill: string; opacity?: number }) {
  return <Polygon points={pts([iso(x, y, z), iso(x + w, y, z), iso(x + w, y + d, z), iso(x, y + d, z)])} fill={fill} opacity={opacity} />;
}

/** A box with a lit top, a right face and a left face. `h` is its height in cells. */
export function IsoBox({ x, y, w, d, h, z = 0, fill, windows = true, seed = 1 }: { x: number; y: number; w: number; d: number; h: number; z?: number; fill: string; windows?: boolean; seed?: number }) {
  const top = tint(fill, 0.35);
  const right = fill;
  const left = shade(fill, 0.18);
  const z1 = z + h;
  let wins: React.ReactElement[] = [];
  if (windows && h >= 1) {
    const rows = Math.max(1, Math.floor(h * 1.6));
    for (let r = 0; r < rows; r++) {
      const zz = z + 0.35 + r * ((h - 0.5) / rows);
      for (let c = 0; c < Math.max(1, Math.floor(w * 1.3)); c++) {
        const fx = x + 0.25 + c * ((w - 0.4) / Math.max(1, Math.floor(w * 1.3)));
        const a = iso(fx, y + d, zz);
        const b = iso(fx + 0.22, y + d, zz);
        const e = iso(fx + 0.22, y + d, zz + 0.3);
        const f = iso(fx, y + d, zz + 0.3);
        wins.push(<Polygon key={`${r}-${c}`} points={pts([a, b, e, f])} fill={(r + c + seed) % 3 === 0 ? '#FFE3A3' : tint(fill, 0.6)} opacity={0.9} />);
      }
    }
    wins = wins.slice(0, 18);
  }
  return (
    <G>
      <Polygon points={pts([iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, z1), iso(x, y + d, z1)])} fill={right} />
      <Polygon points={pts([iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, z1), iso(x + w, y, z1)])} fill={left} />
      <Polygon points={pts([iso(x, y, z1), iso(x + w, y, z1), iso(x + w, y + d, z1), iso(x, y + d, z1)])} fill={top} />
      {wins}
    </G>
  );
}

/** A small round tree on the ground at grid position (x, y). */
export function IsoTree({ x, y, r = 7, a = '#8FD6B1', b = '#6BBF97' }: { x: number; y: number; r?: number; a?: string; b?: string }) {
  const [sx, sy] = iso(x, y, 0);
  return (
    <G>
      <Rect x={sx - 1} y={sy - r * 0.8} width={2} height={r * 0.9} fill="#8B7FF0" opacity={0.8} />
      <Path d={`M${sx - r} ${sy - r * 1.2} a${r} ${r} 0 1 1 ${r * 2} 0 a${r} ${r} 0 1 1 ${-r * 2} 0 Z`} fill={a} />
      <Path d={`M${sx - r * 0.1} ${sy - r * 1.2} a${r * 0.7} ${r * 0.7} 0 1 1 ${r * 1.4} 0 a${r * 0.7} ${r * 0.7} 0 1 1 ${-r * 1.4} 0 Z`} fill={b} />
    </G>
  );
}

/** Polyline through grid points at height z, as artboard points. */
export function isoLine(points: readonly (readonly [number, number, number?])[]): [number, number][] {
  return points.map(([x, y, z]) => iso(x, y, z ?? 0));
}
