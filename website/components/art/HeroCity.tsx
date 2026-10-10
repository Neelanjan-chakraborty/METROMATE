'use client';

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import type { ReactNode } from 'react';
import { CALM } from '@/components/motion';
import { art, shade, tint, rand, Building, DomeHall, Tree, SlimTree, Cloud, Sun, Lamp, Person, MetroCar, Train, Bus, StationEntrance, BusStop, Node } from './kit';

/*
 * The hero landscape: an Ahmedabad–Gandhinagar riverfront in cross-section. A violet metro glides along an
 * elevated viaduct over the river, a blue city bus runs on the street below, and a cutaway shows the
 * underground platform beneath. Two compositions share every layer: a wide 1200 × 560 artboard (≥ 640 px)
 * and a taller 420 × 520 one for phones, so the metro, bus and route links are never cropped.
 *
 * Only a handful of groups move: the metro and the bus (slow linear loops that start in view and wrap
 * off-canvas), the route lines (drawn once), and three parallax layers (sky, far skyline, mid city).
 */

type BuildingSpec = { x: number; w: number; h: number; fill: string; seed: number; roof?: 'flat' | 'tank' | 'slant' | 'dome'; lit?: number };
type TowerSpec = { x: number; w: number; h: number; fill: string; crown: 'slant' | 'step' | 'spire' };

interface Layout {
  id: string;
  W: number;
  H: number;
  sun: [number, number, number];
  clouds: [number, number, number][];
  farBase: number;
  kite: [number, number];
  birds: [number, number];
  midBase: number;
  dome: { x: number; w: number };
  mid: BuildingSpec[];
  towers: TowerSpec[];
  deckY: number;
  station: { x: number; w: number };
  river: { top: number; bottom: number; end: number };
  parkY: number;
  streetH: number;
  cutY: number;
  near: BuildingSpec[];
  trees: [number, number][];
  slim: number[];
  lamps: number[];
  people: { x: number; color: string; bag?: string; step?: 0 | 1; s?: number }[];
  entrance: number;
  busStop: number;
  tunnel: { x1: number; y: number; h: number };
  platform: { x: number; w: number };
  fg: [number, number][];
  metroNodes: number[];
  busNodes: number[];
  train: { scale: number; park: number; duration: number };
  bus: { scale: number; park: number; duration: number };
  /** Walk link from the elevated station's stair to the bus stop. */
  walk: string;
}

/** Slightly richer fills than the base palette, so the mid city reads clearly against the hazy skyline. */
const C = {
  stone: '#EBE1D2',
  peach: '#FFD9C4',
  lav: '#DCD4EE',
  coral: '#FBC7BF',
  sage: '#CBDFCD',
  haze1: '#EFE8F2',
  haze2: '#E4DBEE',
  water: '#CBE2EB',
  waterFar: '#B5D4E1',
  park: '#E1EBE0',
  road: '#686178',
};

const DESKTOP: Layout = {
  id: 'hd',
  W: 1200,
  H: 560,
  sun: [930, 116, 30],
  clouds: [
    [96, 84, 1.25],
    [600, 56, 0.8],
    [1104, 214, 0.65],
  ],
  farBase: 352,
  kite: [476, 104],
  birds: [700, 120],
  midBase: 358,
  dome: { x: 70, w: 96 },
  mid: [
    { x: -6, w: 52, h: 82, fill: C.lav, seed: 2 },
    { x: 186, w: 44, h: 104, fill: C.peach, seed: 3, roof: 'tank' },
    { x: 232, w: 58, h: 66, fill: C.stone, seed: 4 },
    { x: 316, w: 42, h: 136, fill: C.coral, seed: 5 },
    { x: 360, w: 64, h: 84, fill: C.lav, seed: 6, roof: 'slant' },
    { x: 466, w: 66, h: 76, fill: C.peach, seed: 8, roof: 'tank' },
    { x: 566, w: 40, h: 150, fill: C.stone, seed: 9 },
    { x: 608, w: 58, h: 92, fill: C.lav, seed: 10 },
    { x: 702, w: 52, h: 120, fill: C.coral, seed: 11, roof: 'tank' },
    { x: 756, w: 64, h: 72, fill: C.sage, seed: 12 },
    { x: 850, w: 62, h: 98, fill: C.peach, seed: 13, roof: 'slant' },
    { x: 1134, w: 72, h: 104, fill: C.lav, seed: 15, roof: 'tank' },
  ],
  towers: [
    { x: 940, w: 46, h: 220, fill: '#D7D0EC', crown: 'slant' },
    { x: 992, w: 54, h: 268, fill: '#E4DDF2', crown: 'spire' },
    { x: 1062, w: 44, h: 190, fill: '#F0E1D5', crown: 'step' },
  ],
  deckY: 250,
  station: { x: 226, w: 236 },
  river: { top: 366, bottom: 416, end: 880 },
  parkY: 446,
  streetH: 38,
  cutY: 494,
  near: [
    { x: 912, w: 60, h: 52, fill: C.peach, seed: 21, lit: 0.3 },
    { x: 974, w: 46, h: 76, fill: C.stone, seed: 22, roof: 'tank', lit: 0.25 },
    { x: 1064, w: 66, h: 46, fill: C.coral, seed: 23, lit: 0.3 },
    { x: 1132, w: 74, h: 64, fill: C.lav, seed: 24, lit: 0.25 },
  ],
  trees: [
    [36, 14],
    [150, 11],
    [200, 9],
    [540, 12],
    [700, 14],
    [760, 10],
    [1040, 9],
  ],
  slim: [30, 176, 300, 446, 556, 690, 836],
  lamps: [102, 496, 650, 800],
  people: [
    { x: 244, color: art.inkSoft, step: 1 },
    { x: 590, color: art.violet, bag: art.coral },
    { x: 780, color: shade(art.coralDeep, 0.25), step: 1, s: 0.95 },
  ],
  entrance: 836,
  busStop: 614,
  tunnel: { x1: 600, y: 510, h: 40 },
  platform: { x: 792, w: 220 },
  fg: [
    [8, 20],
    [1192, 22],
  ],
  metroNodes: [96, 344, 760, 1150],
  busNodes: [614, 1100],
  train: { scale: 1.4, park: 232, duration: 26 },
  bus: { scale: 1.2, park: 650, duration: 22 },
  walk: 'M492 438 Q556 404 606 436',
};

const MOBILE: Layout = {
  id: 'hm',
  W: 420,
  H: 500,
  sun: [334, 62, 20],
  clouds: [
    [16, 56, 0.8],
    [196, 26, 0.6],
  ],
  farBase: 266,
  kite: [252, 96],
  birds: [150, 120],
  midBase: 272,
  dome: { x: 20, w: 70 },
  mid: [
    { x: 100, w: 36, h: 78, fill: C.peach, seed: 3, roof: 'tank' },
    { x: 138, w: 44, h: 56, fill: C.stone, seed: 4 },
    { x: 184, w: 32, h: 100, fill: C.coral, seed: 5 },
    { x: 218, w: 46, h: 64, fill: C.lav, seed: 6, roof: 'slant' },
    { x: 266, w: 34, h: 86, fill: C.sage, seed: 7 },
  ],
  towers: [
    { x: 302, w: 34, h: 160, fill: '#D7D0EC', crown: 'slant' },
    { x: 340, w: 40, h: 198, fill: '#E4DDF2', crown: 'spire' },
    { x: 384, w: 34, h: 136, fill: '#F0E1D5', crown: 'step' },
  ],
  deckY: 200,
  station: { x: 16, w: 160 },
  river: { top: 278, bottom: 316, end: 360 },
  parkY: 344,
  streetH: 32,
  cutY: 386,
  near: [{ x: 364, w: 60, h: 46, fill: C.peach, seed: 21, lit: 0.3 }],
  trees: [
    [10, 10],
    [118, 9],
    [244, 8],
  ],
  slim: [46, 150, 240],
  lamps: [70],
  people: [{ x: 216, color: art.violet, bag: art.coral }],
  entrance: 282,
  busStop: 202,
  tunnel: { x1: 36, y: 410, h: 44 },
  platform: { x: 210, w: 176 },
  fg: [
    [4, 15],
    [416, 15],
  ],
  metroNodes: [96, 336],
  busNodes: [202],
  train: { scale: 1, park: 20, duration: 24 },
  bus: { scale: 0.95, park: 232, duration: 20 },
  walk: 'M200 336 Q190 322 186 334',
};

// ---------------------------------------------------------------------------------- parts

/** One silhouette path for a hazy skyline layer (stepped blocks with the odd taller tower). */
function skyline(W: number, base: number, seed: number, scale: number) {
  let d = `M-10 ${base + 40} V${base - 30}`;
  let x = -10;
  let i = 0;
  while (x < W + 10) {
    const w = (14 + rand(seed + i * 1.7) * 34) * scale;
    let h = (22 + rand(seed + i * 3.1) * 50) * scale;
    if (rand(seed + i * 5.3) > 0.82) h += 46 * scale;
    if (rand(seed + i * 2.2) > 0.7) d += ` V${(base - h + 6).toFixed(1)} L${(x + w / 2).toFixed(1)} ${(base - h).toFixed(1)} L${(x + w).toFixed(1)} ${(base - h + 6).toFixed(1)}`;
    else d += ` V${(base - h).toFixed(1)} H${(x + w).toFixed(1)}`;
    x += w;
    i++;
  }
  return `${d} V${base + 40} Z`;
}

/** A modern glass tower, a nod to Gandhinagar's GIFT City skyline. */
function Tower({ x, w, h, fill, crown, y }: TowerSpec & { y: number }) {
  const top = y - h;
  const body =
    crown === 'slant'
      ? `M${x} ${y} V${top + 14} L${x + w} ${top} V${y} Z`
      : crown === 'step'
        ? `M${x} ${y} V${top + 12} H${x + w * 0.22} V${top} H${x + w} V${y} Z`
        : `M${x} ${y} V${top + 4} Q${x + w / 2} ${top - 6} ${x + w} ${top + 4} V${y} Z`;
  let bands = '';
  for (let bx = x + 5; bx < x + w * 0.68 - 2; bx += 7) bands += `M${bx} ${top + 18}v${h - 24}h2.2v${-(h - 24)}z`;
  return (
    <g>
      {crown === 'spire' ? <rect x={x + w / 2 - 0.9} y={top - 26} width={1.8} height={24} rx={0.9} fill={shade(fill, 0.2)} /> : null}
      <path d={body} fill={fill} />
      <rect x={x + w * 0.7} y={top + (crown === 'slant' ? 4 : 2)} width={w * 0.3} height={h - 4} fill={shade(fill, 0.12)} opacity={0.5} />
      <path d={bands} fill="#FFFFFF" opacity={0.55} />
      <rect x={x} y={top + 22} width={w} height={2} fill={art.violetSoft} opacity={0.9} />
    </g>
  );
}

/** The elevated station: slim columns, a soft vaulted canopy with a violet edge, and a stair tower down to the street. */
function SkyStation({ x, w, y, ground, ch }: { x: number; w: number; y: number; ground: number; ch: number }) {
  const cols = [x + 4, x + w * 0.33, x + w * 0.66, x + w - 6];
  const rise = w * 0.1;
  const tx = x + w + 8;
  const top = y - ch;
  return (
    <g>
      <path d={cols.map((c) => `M${c} ${top}h2.4v${ch}h-2.4z`).join('')} fill={art.lavenderDeep} />
      <path d={`M${x - 14} ${top} Q${x + w / 2} ${top - rise * 2} ${x + w + 14} ${top} V${top + 8} Q${x + w / 2} ${top + 8 - rise * 2} ${x - 14} ${top + 8} Z`} fill="#FFFFFF" />
      <path d={`M${x - 14} ${top + 8} Q${x + w / 2} ${top + 8 - rise * 2} ${x + w + 14} ${top + 8}`} fill="none" stroke={art.violet} strokeWidth={2.2} strokeLinecap="round" />
      <path d={`M${x - 14} ${top} Q${x + w / 2} ${top - rise * 2} ${x + w + 14} ${top}`} fill="none" stroke={art.lavenderDeep} strokeWidth={1.2} />
      <rect x={x - 6} y={y + 12} width={w + 12} height={11} rx={3} fill={C.stone} />
      <rect x={x + 8} y={y + 15.5} width={w - 16} height={3.2} rx={1.6} fill={art.window} />
      {/* stair tower */}
      <rect x={tx} y={y + 4} width={18} height={ground - y - 4} rx={3} fill={C.lav} />
      <rect x={tx + 4.5} y={y + 14} width={9} height={ground - y - 22} rx={2} fill="#D8E6F3" />
      <path d={`M${tx + 4.5} ${y + 24} H${tx + 13.5} M${tx + 4.5} ${(y + ground) / 2} H${tx + 13.5}`} stroke="#FFFFFF" strokeWidth={1.2} />
      <rect x={tx - 3} y={y + 1} width={24} height={5} rx={2.5} fill={art.lavenderDeep} />
    </g>
  );
}

/** A patang (kite), a nod to Ahmedabad's Uttarayan skies, with its string trailing down to the riverfront, plus a few birds. */
function SkyDetails({ kite, birds, s }: { kite: [number, number]; birds: [number, number]; s: number }) {
  const [kx, ky] = kite;
  const [bx, by] = birds;
  return (
    <g>
      <path d={`M${kx} ${ky + 12 * s} C${kx + 10 * s} ${ky + 60 * s} ${kx - 40 * s} ${ky + 110 * s} ${kx - 70 * s} ${ky + 190 * s}`} fill="none" stroke={art.inkSoft} strokeWidth={0.8} opacity={0.35} />
      <path d={`M${kx} ${ky - 11 * s} L${kx + 8 * s} ${ky} L${kx} ${ky + 12 * s} L${kx - 8 * s} ${ky} Z`} fill={art.coralDeep} />
      <path d={`M${kx} ${ky - 11 * s} L${kx + 8 * s} ${ky} L${kx} ${ky + 12 * s} Z`} fill={art.coral} />
      <path d={`M${kx - 3 * s} ${ky + 15 * s} l3 ${-3 * s} l3 ${3 * s} Z`} fill={art.violet} />
      <path
        d={[0, 1, 2].map((i) => `M${bx + i * 16 * s} ${by + (i % 2) * 7 * s} q${3 * s} ${-3 * s} ${6 * s} 0 q${3 * s} ${-3 * s} ${6 * s} 0`).join(' ')}
        fill="none"
        stroke={art.inkSoft}
        strokeWidth={1.3}
        strokeLinecap="round"
        opacity={0.45}
      />
    </g>
  );
}

/** Elevated viaduct with a deeper deck than the kit's (it carries a larger train); piers batched into one path. */
function HeroViaduct({ W, y, ground, pier }: { W: number; y: number; ground: number; pier: number }) {
  let piers = '';
  let caps = '';
  for (let px = pier * 0.42; px < W + 20; px += pier) {
    piers += `M${px - 6} ${y + 14} H${px + 6} L${px + 7.5} ${ground} H${px - 7.5} Z`;
    caps += `M${px - 13} ${y + 11} h26 v5 a2 2 0 0 1 -2 2 h-22 a2 2 0 0 1 -2 -2 Z`;
  }
  return (
    <g>
      <path d={piers} fill="#CFC6E5" />
      <path d={caps} fill={art.lavenderMid} />
      <rect x={-10} y={y} width={W + 20} height={12} fill="#F6F3FB" />
      <rect x={-10} y={y + 10} width={W + 20} height={2.4} fill={art.lavenderDeep} />
      <rect x={-10} y={y - 3} width={W + 20} height={3} fill="#FFFFFF" />
      <rect x={-10} y={y - 0.6} width={W + 20} height={1.2} fill={art.violetSoft} />
    </g>
  );
}

/** A violet three-car metro with a hairline lavender outline so the white body reads against pale buildings. */
function HeroTrain({ scale }: { scale: number }) {
  return (
    <g transform={`scale(${scale})`}>
      <path d="M1.5 1.6 H137.5 Q148.6 2.6 150.4 15 V28.6 H1.5 Z" fill={art.lavenderDeep} />
      <Train />
    </g>
  );
}

/** Water with a curved near bank (the river narrows into the distance), a promenade and soft highlights. */
function River({ L }: { L: Layout }) {
  const { top, bottom, end } = L.river;
  const W = L.W;
  const bank = `M-10 ${bottom} C${end * 0.45} ${bottom + 2} ${end * 0.72} ${bottom - 4} ${end * 0.86} ${top + (bottom - top) * 0.42} S${end} ${top + 2} ${end + 30} ${top}`;
  const hl = [
    [0.08, 0.35, 0.16],
    [0.3, 0.62, 0.12],
    [0.52, 0.3, 0.1],
    [0.66, 0.55, 0.07],
    [0.18, 0.78, 0.09],
  ];
  return (
    <g>
      {/* far promenade */}
      <rect x={-10} y={L.midBase - 4} width={W + 20} height={top - L.midBase + 6} fill={C.stone} />
      <rect x={-10} y={L.midBase - 4} width={W + 20} height={1.6} fill={art.stoneDeep} />
      {/* ground beyond the river's bend */}
      <rect x={-10} y={top} width={W + 20} height={L.parkY - top + 2} fill={C.park} />
      {/* water */}
      <path d={`${bank} V${top} H-10 Z`} fill={C.water} />
      <path d={`M-10 ${top} H${end + 30} V${top + 3} H-10 Z`} fill={C.waterFar} />
      <path
        d={hl.map(([fx, fy, fw]) => `M${(end * fx).toFixed(1)} ${(top + (bottom - top) * fy).toFixed(1)} h${(end * fw).toFixed(1)}`).join(' ')}
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.75}
      />
      <path d={`M${end * 0.78} ${top + 9} h${end * 0.07} M${end * 0.8} ${top + 16} h${end * 0.04}`} stroke={art.sun} strokeWidth={2.2} strokeLinecap="round" opacity={0.8} />
      {/* near promenade along the bank */}
      <path d={bank} fill="none" stroke={C.stone} strokeWidth={8} />
      <path d={bank} fill="none" stroke={art.stoneDeep} strokeWidth={1.4} transform="translate(0 3.6)" />
    </g>
  );
}

/** Street, curbs and the bus line. */
function Street({ L }: { L: Layout }) {
  const y = L.parkY + 2;
  const W = L.W;
  return (
    <g>
      <rect x={-10} y={L.parkY - 2} width={W + 20} height={4} fill={C.stone} />
      <rect x={-10} y={y} width={W + 20} height={L.streetH} fill={C.road} />
      <path d={`M-10 ${y + L.streetH / 2} H${W + 10}`} stroke={art.roadLine} strokeWidth={1.4} strokeDasharray="13 15" opacity={0.6} />
      <rect x={-10} y={y + L.streetH} width={W + 20} height={L.cutY - y - L.streetH} fill={C.stone} />
      <rect x={-10} y={y + L.streetH} width={W + 20} height={1.6} fill={art.stoneDeep} />
    </g>
  );
}

/** The cutaway: lavender earth strata, a rounded tunnel bore, a lit platform and stairs from the street. */
function Underground({ L }: { L: Layout }) {
  const { W, H, cutY } = L;
  const { x1, y, h } = L.tunnel;
  const p = L.platform;
  const floor = y + h - 10;
  const strata = [0.34, 0.66].map((f, i) => {
    const sy = cutY + (H - cutY) * f;
    return `M-10 ${sy} C${W * 0.25} ${sy - 6 + i * 3} ${W * 0.55} ${sy + 7} ${W + 10} ${sy - 2}`;
  });
  let pebbles = '';
  for (let i = 0; i < Math.round(W / 40); i++) {
    const px = rand(i * 7 + 3) * W;
    const py = cutY + 10 + rand(i * 11 + 5) * (H - cutY - 16);
    if (px > x1 - 10 && py > y - 8 && py < y + h + 8) continue;
    const r = 1.4 + rand(i * 3) * 2;
    pebbles += `M${(px - r).toFixed(1)} ${py.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`;
  }
  const sx = L.entrance + 6;
  const stairEnd = p.x + 10;
  const n = 7;
  let steps = `M${sx - 8} ${cutY}`;
  for (let i = 0; i < n; i++) steps += ` h${((stairEnd - sx) / n).toFixed(1)} v${((floor - 3 - cutY) / n).toFixed(1)}`;
  return (
    <g>
      <rect x={-10} y={cutY} width={W + 20} height={H - cutY + 10} fill={art.lavender} />
      <rect x={-10} y={cutY} width={W + 20} height={6} fill={art.sageMid} />
      <path d={strata.join(' ')} fill="none" stroke={art.lavenderMid} strokeWidth={10} strokeLinecap="round" opacity={0.8} />
      <path d={pebbles} fill={art.lavenderDeep} opacity={0.7} />
      {/* bore */}
      <rect x={x1 - 6} y={y - 6} width={W - x1 + 40} height={h + 12} rx={(h + 12) / 2} fill={art.lavenderMid} />
      <rect x={x1} y={y} width={W - x1 + 30} height={h} rx={h / 2} fill="#F6F1FA" />
      <ellipse cx={p.x + p.w / 2} cy={floor - 8} rx={p.w * 0.62} ry={h * 0.62} fill={`url(#${L.id}-glow)`} />
      <rect x={x1 + 8} y={floor} width={W - x1 + 20} height={2} rx={1} fill={art.lavenderDeep} />
      <rect x={p.x} y={floor - 3} width={p.w} height={5} rx={2} fill={art.stoneDeep} />
      {/* parked underground train at the platform */}
      <g transform={`translate(${p.x + p.w - 112} ${floor - 27.5})`}>
        <MetroCar />
        <g transform="translate(50 0)">
          <MetroCar front />
        </g>
      </g>
      {/* stairs down from the street entrance to the platform */}
      <path d={`M${sx - 8} ${cutY} H${sx + 14} L${stairEnd + 14} ${floor - 3} H${stairEnd - 8} Z`} fill={art.lavenderMid} />
      <path d={steps} fill="none" stroke={art.stoneDeep} strokeWidth={1.6} strokeLinejoin="round" />
      <path d={`M${x1 + 30} ${y + 8} H${W + 10}`} stroke={art.window} strokeWidth={2} strokeDasharray="10 34" strokeLinecap="round" />
      <Person x={p.x + 30} y={floor - 3} s={0.8} color={art.inkSoft} bag={art.sun} step={1} />
    </g>
  );
}

/** A vehicle that loops at constant speed from `from` to `to`, starting at `park` so it is in view on first paint. */
function Loop({ from, to, park, duration, reduced, children }: { from: number; to: number; park: number; duration: number; reduced: boolean | null; children: ReactNode }) {
  if (reduced) return <g transform={`translate(${park} 0)`}>{children}</g>;
  const span = Math.abs(to - from);
  const t1 = Math.abs(to - park) / span;
  return (
    <motion.g initial={{ x: park }} animate={{ x: [park, to, from, park] }} transition={{ duration, times: [0, t1, t1 + 0.0004, 1], ease: 'linear', repeat: Infinity }}>
      {children}
    </motion.g>
  );
}

function Layer({ y, children }: { y: MotionValue<number> | null; children: ReactNode }) {
  return y ? <motion.g style={{ y }}>{children}</motion.g> : <g>{children}</g>;
}

function Scene({ L, reduced, py }: { L: Layout; reduced: boolean | null; py: { sky: MotionValue<number>; far: MotionValue<number>; mid: MotionValue<number> } | null }) {
  const { W, H, deckY, parkY } = L;
  const ts = L.train.scale;
  const trainY = deckY - 2 - 28 * ts;
  const bs = L.bus.scale;
  const busY = parkY + 2 + L.streetH - 3 - 31.8 * bs;
  const metro = `M-10 ${deckY + 5} H${W + 10}`;
  const busLine = `M-10 ${parkY} H${W + 10}`;
  const draw = (delay: number, duration = 2.6) =>
    reduced ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration, delay, ease: CALM } };
  const fade = (delay: number) => (reduced ? {} : { initial: { opacity: 0 }, animate: { opacity: [0, 1] }, transition: { duration: 0.9, delay, ease: CALM } });

  return (
    <>
      <defs>
        <linearGradient id={`${L.id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EDE8F8" />
          <stop offset="0.55" stopColor="#FBF1EC" />
          <stop offset="1" stopColor="#FFDFC8" />
        </linearGradient>
        <radialGradient id={`${L.id}-glow`}>
          <stop offset="0" stopColor={art.sun} stopOpacity={0.55} />
          <stop offset="1" stopColor={art.sun} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${L.id}-sky)`} />

      {/* sky: sun and clouds, the slowest parallax layer */}
      <Layer y={py?.sky ?? null}>
        <Sun x={L.sun[0]} y={L.sun[1]} r={L.sun[2]} />
        {L.clouds.map(([x, y, s]) => (
          <Cloud key={x} x={x} y={y} s={s} opacity={0.85} />
        ))}
        <SkyDetails kite={L.kite} birds={L.birds} s={W < 600 ? 0.8 : 1} />
      </Layer>

      {/* distant hazy skyline */}
      <Layer y={py?.far ?? null}>
        <path d={skyline(W, L.farBase - 10, 41, W < 600 ? 0.9 : 1.15)} fill={C.haze1} />
        <path d={skyline(W, L.farBase, 7, W < 600 ? 0.8 : 1)} fill={C.haze2} />
      </Layer>

      {/* mid city: heritage dome, mid-rise blocks, GIFT City towers */}
      <Layer y={py?.mid ?? null}>
        {L.towers.map((t) => (
          <Tower key={t.x} {...t} y={L.midBase} />
        ))}
        <DomeHall x={L.dome.x} y={L.midBase} w={L.dome.w} fill={C.stone} accent={art.coralDeep} />
        {L.mid.map((b) => (
          <Building key={b.x} x={b.x} y={L.midBase} w={b.w} h={b.h} fill={b.fill} seed={b.seed} roof={b.roof} lit={b.lit ?? 0.12} />
        ))}
      </Layer>

      <River L={L} />
      {L.slim.map((x) => (
        <SlimTree key={x} x={x} y={L.midBase - 3} h={W < 600 ? 20 : 28} fill={art.leafDeep} />
      ))}

      {/* viaduct, elevated station and the metro */}
      <HeroViaduct W={W} y={deckY} ground={parkY} pier={W < 600 ? 104 : 150} />
      <SkyStation x={L.station.x} w={L.station.w} y={deckY} ground={parkY} ch={Math.round(30 * ts + 12)} />

      {/* low-rise street frontage, park trees, lamps and people */}
      {L.near.map((b) => (
        <Building key={b.x} x={b.x} y={parkY - 2} w={b.w} h={b.h} fill={b.fill} seed={b.seed} roof={b.roof} lit={b.lit ?? 0.2} />
      ))}
      {L.trees.map(([x, r]) => (
        <Tree key={x} x={x} y={parkY - 3} r={r} a="#9CC5A7" b="#79A988" />
      ))}
      {L.lamps.map((x) => (
        <Lamp key={x} x={x} y={parkY - 2} h={W < 600 ? 22 : 28} />
      ))}
      {L.people.map((p) => (
        <Person key={p.x} x={p.x} y={parkY - 2} s={p.s ?? (W < 600 ? 0.8 : 0.95)} color={p.color} bag={p.bag} step={p.step} />
      ))}
      <StationEntrance x={L.entrance} y={parkY - 2} w={W < 600 ? 48 : 58} />
      <BusStop x={L.busStop} y={parkY - 2} />

      <Street L={L} />
      <Underground L={L} />

      {/* route lines: metro along the viaduct, bus along the curb, a walking link between them */}
      <g fill="none" strokeLinecap="round">
                <motion.path d={metro} stroke={art.violet} strokeWidth={3.4} {...draw(0.5)} />
        <motion.path d={busLine} stroke={art.busBlue} strokeWidth={2.6} {...draw(1.3, 2.4)} />
        <motion.path d={L.walk} stroke={art.coralDeep} strokeWidth={2} strokeDasharray="0.1 5.5" {...fade(2.6)} />
      </g>
      <motion.g {...fade(1.6)}>
        {L.metroNodes.map((x) => (
          <Node key={x} x={x} y={deckY + 5} r={W < 600 ? 4.2 : 4.8} />
        ))}
        {L.busNodes.map((x) => (
          <Node key={x} x={x} y={parkY} r={W < 600 ? 3.8 : 4.2} color={art.busBlue} />
        ))}
      </motion.g>

      {/* the metro */}
      <g transform={`translate(0 ${trainY})`}>
        <Loop from={-160 * ts - 20} to={W + 20} park={L.train.park} duration={L.train.duration} reduced={reduced}>
          <HeroTrain scale={ts} />
        </Loop>
      </g>

      {/* the bus, driving right to left */}
      <g transform={`translate(0 ${busY})`}>
        <Loop from={W + 20} to={-72 * bs - 20} park={L.bus.park} duration={L.bus.duration} reduced={reduced}>
          <g transform={`translate(${68 * bs} 0) scale(-1 1)`}>
            <Bus scale={bs} />
          </g>
        </Loop>
      </g>

      {/* foreground trees framing the edges */}
      {L.fg.map(([x, r]) => (
        <Tree key={x} x={x} y={L.cutY + 2} r={r} a="#7FAE8D" b="#679A77" />
      ))}
    </>
  );
}

const LABEL =
  'Illustration: a violet metro crosses an elevated bridge over a riverfront city while a blue bus drives along the street below; a cutaway shows an underground metro platform. Route lines connect the stations.';

/** The hero illustration, with both compositions; Tailwind switches between them at the `sm` breakpoint. */
export function HeroCity() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const sky = useTransform(scrollY, [0, 900], [0, 30]);
  const far = useTransform(scrollY, [0, 900], [0, 20]);
  const mid = useTransform(scrollY, [0, 900], [0, 9]);
  const py = reduced ? null : { sky, far, mid };
  return (
    <>
      <svg viewBox={`0 44 ${DESKTOP.W} ${DESKTOP.H - 44}`} className="hidden h-auto w-full sm:block" role="img" aria-label={LABEL}>
        <Scene L={DESKTOP} reduced={reduced} py={py} />
      </svg>
      <svg viewBox={`0 0 ${MOBILE.W} ${MOBILE.H}`} className="block h-auto w-full sm:hidden" role="img" aria-label={LABEL}>
        <Scene L={MOBILE} reduced={reduced} py={py} />
      </svg>
    </>
  );
}
