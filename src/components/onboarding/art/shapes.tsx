import React from 'react';
import { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { mixColor, windowThreshold } from '../../../lib/skyPalette';
import { ob } from '../palette';

/*
 * Original vector parts for the onboarding city. Everything is flat shapes in a small palette, drawn in
 * artboard units with y pointing down; `y` is usually the ground line a thing stands on. Windows are one
 * batched path per building so scenes stay light.
 */

export const shade = (c: string, k: number) => mixColor(c, '#25216F', k);
export const tint = (c: string, k: number) => mixColor(c, '#FFFFFF', k);

/** A grid of small windows as one path; `seed` varies which are lit. Returns [lit, unlit] path data. */
export function windowGrid(x: number, y: number, w: number, h: number, seed: number, opts: { gx?: number; gy?: number; pw?: number; ph?: number; lit?: number } = {}) {
  const { gx = 8, gy = 9, pw = 3.6, ph = 4.6, lit = 0.35 } = opts;
  const cols = Math.max(1, Math.floor((w - 4) / gx));
  const rows = Math.max(1, Math.floor((h - 8) / gy));
  const ox = x + (w - (cols - 1) * gx - pw) / 2;
  let a = '';
  let b = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = `M${(ox + c * gx).toFixed(1)} ${(y + 6 + r * gy).toFixed(1)}h${pw}v${ph}h${-pw}z`;
      if (windowThreshold(seed, r, c) < lit) a += d;
      else b += d;
    }
  }
  return { lit: a, unlit: b };
}

interface BuildingProps {
  x: number;
  /** Ground line. */
  y: number;
  w: number;
  h: number;
  fill: string;
  seed?: number;
  /** 'flat' | 'slant' | 'tank' | 'spire' */
  roof?: 'flat' | 'slant' | 'tank' | 'spire';
  /** Fraction of windows that glow (sunrise gold). */
  lit?: number;
  winColor?: string;
}

export function Building({ x, y, w, h, fill, seed = 1, roof = 'flat', lit = 0.3, winColor }: BuildingProps) {
  const g = windowGrid(x, y - h, w, h, seed, { lit });
  const dark = shade(fill, 0.12);
  return (
    <G>
      <Rect x={x} y={y - h} width={w} height={h} rx={1.5} fill={fill} />
      <Rect x={x + w * 0.72} y={y - h} width={w * 0.28} height={h} fill={dark} opacity={0.5} />
      {roof === 'slant' ? <Path d={`M${x} ${y - h} L${x + w} ${y - h - 7} V${y - h} Z`} fill={dark} /> : null}
      {roof === 'tank' ? (
        <G>
          <Rect x={x + w * 0.3} y={y - h - 8} width={w * 0.34} height={8} rx={2} fill={dark} />
          <Rect x={x + w * 0.44} y={y - h - 12} width={1.6} height={4} fill={dark} />
        </G>
      ) : null}
      {roof === 'spire' ? <Path d={`M${x + w / 2 - 3} ${y - h} L${x + w / 2} ${y - h - 16} L${x + w / 2 + 3} ${y - h} Z`} fill={dark} /> : null}
      <Path d={g.unlit} fill={tint(fill, 0.55)} opacity={0.55} />
      <Path d={g.lit} fill={winColor ?? '#FFE3A3'} />
    </G>
  );
}

/** A domed hall with side minarets: the skyline's landmark. */
export function DomeHall({ x, y, w = 70, h = 34, fill, accent }: { x: number; y: number; w?: number; h?: number; fill: string; accent: string }) {
  const cx = x + w / 2;
  const arches: React.ReactElement[] = [];
  const n = Math.floor(w / 11);
  for (let i = 0; i < n; i++) {
    const ax = x + 8 + i * ((w - 16) / Math.max(1, n - 1));
    arches.push(<Path key={i} d={`M${ax - 3} ${y} V${y - 8} a3 3 0 0 1 6 0 V${y} Z`} fill={shade(fill, 0.18)} />);
  }
  return (
    <G>
      <Rect x={x} y={y - h * 0.5} width={w} height={h * 0.5} fill={fill} />
      {arches}
      <Rect x={x + w * 0.2} y={y - h * 0.62} width={w * 0.6} height={h * 0.14} fill={shade(fill, 0.08)} />
      <Path d={`M${cx - w * 0.22} ${y - h * 0.62} Q${cx} ${y - h * 1.35} ${cx + w * 0.22} ${y - h * 0.62} Z`} fill={accent} />
      <Rect x={cx - 1} y={y - h * 1.5} width={2} height={h * 0.2} fill={accent} />
      <Circle cx={cx} cy={y - h * 1.52} r={2} fill={accent} />
      {[x - 2, x + w - 4].map((mx) => (
        <G key={mx}>
          <Rect x={mx} y={y - h * 0.95} width={6} height={h * 0.95} fill={fill} />
          <Path d={`M${mx - 1} ${y - h * 0.95} Q${mx + 3} ${y - h * 1.25} ${mx + 7} ${y - h * 0.95} Z`} fill={accent} />
        </G>
      ))}
    </G>
  );
}

/** A stepped shikhara temple tower with a little flag. */
export function Temple({ x, y, fill, accent }: { x: number; y: number; fill: string; accent: string }) {
  return (
    <G>
      <Rect x={x} y={y - 12} width={30} height={12} fill={shade(fill, 0.1)} />
      <Rect x={x + 3} y={y - 22} width={24} height={10} fill={fill} />
      <Path d={`M${x + 5} ${y - 22} L${x + 15} ${y - 54} L${x + 25} ${y - 22} Z`} fill={fill} />
      <Path d={`M${x + 8} ${y - 31} H${x + 22} M${x + 10.5} ${y - 40} H${x + 19.5}`} stroke={shade(fill, 0.2)} strokeWidth={1.4} />
      <Rect x={x + 14.4} y={y - 64} width={1.4} height={11} fill={accent} />
      <Path d={`M${x + 15.8} ${y - 64} L${x + 24} ${y - 61.5} L${x + 15.8} ${y - 59} Z`} fill={ob.red} />
    </G>
  );
}

export function Tree({ x, y, r = 10, a = '#8FD6B1', b = '#6BBF97', trunk = '#8B7FF0' }: { x: number; y: number; r?: number; a?: string; b?: string; trunk?: string }) {
  return (
    <G>
      <Rect x={x - 1.2} y={y - r * 0.9} width={2.4} height={r * 1.1} rx={1} fill={trunk} opacity={0.8} />
      <Circle cx={x} cy={y - r * 1.5} r={r} fill={a} />
      <Circle cx={x + r * 0.5} cy={y - r * 1.15} r={r * 0.7} fill={b} />
      <Circle cx={x - r * 0.55} cy={y - r * 1.05} r={r * 0.6} fill={b} opacity={0.85} />
    </G>
  );
}

export function Lamp({ x, y, h = 30, color = ob.indigoSoft, glow }: { x: number; y: number; h?: number; color?: string; glow?: string }) {
  return (
    <G>
      <Rect x={x - 0.9} y={y - h} width={1.8} height={h} rx={0.9} fill={color} />
      <Path d={`M${x} ${y - h} h7`} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={x + 4.5} y={y - h + 1} width={5} height={2.4} rx={1.2} fill={glow ?? '#FFE3A3'} />
    </G>
  );
}

export function Cloud({ x, y, s = 1, fill = '#FFFFFF', opacity = 0.85 }: { x: number; y: number; s?: number; fill?: string; opacity?: number }) {
  return (
    <G opacity={opacity} transform={`translate(${x} ${y}) scale(${s})`}>
      <Rect x={0} y={8} width={44} height={10} rx={5} fill={fill} />
      <Circle cx={14} cy={9} r={8} fill={fill} />
      <Circle cx={27} cy={6} r={10} fill={fill} />
    </G>
  );
}

/** A passer-by as a small stylised silhouette (no face): head, coat, two legs, optionally a bag. */
export function Passenger({ x, y, s = 1, color = ob.indigo, step = 0, bag }: { x: number; y: number; s?: number; color?: string; step?: 0 | 1; bag?: string }) {
  const l = step ? 3 : -2;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Circle cx={0} cy={-19} r={3.1} fill={color} />
      <Path d="M-4 -15 Q0 -17.5 4 -15 L4.6 -6 H-4.6 Z" fill={color} />
      <Path d={`M-2.6 -6 L${-2.6 + l * 0.5} 0 M2.6 -6 L${2.6 - l * 0.5} 0`} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      {bag ? <Rect x={3} y={-13} width={4.2} height={5.2} rx={1.2} fill={bag} /> : null}
    </G>
  );
}

/** Elevated viaduct: deck with parapet, rail line, piers with caps. y = top of the deck. */
export function Viaduct({ x1, x2, y, ground, pier = 64, deck = ob.lavenderDeep, dark = ob.violetSoft, rail = ob.violet }: { x1: number; x2: number; y: number; ground: number; pier?: number; deck?: string; dark?: string; rail?: string }) {
  const piers: React.ReactElement[] = [];
  for (let px = x1 + pier / 2; px < x2; px += pier) {
    piers.push(
      <G key={px}>
        <Path d={`M${px - 4.5} ${y + 7} H${px + 4.5} L${px + 5.5} ${ground} H${px - 5.5} Z`} fill={dark} />
        <Rect x={px - 9} y={y + 5} width={18} height={4.4} rx={1.6} fill={deck} />
      </G>,
    );
  }
  return (
    <G>
      {piers}
      <Rect x={x1} y={y} width={x2 - x1} height={7} fill={deck} />
      <Rect x={x1} y={y + 5.6} width={x2 - x1} height={2} fill={dark} />
      <Rect x={x1} y={y - 2.4} width={x2 - x1} height={2.4} fill={tint(deck, 0.4)} />
      <Rect x={x1} y={y - 0.4} width={x2 - x1} height={1.2} fill={rail} opacity={0.9} />
    </G>
  );
}

export function Road({ x1, x2, y, h = 22, color = ob.road, line = ob.roadLine, dashOffset = 0 }: { x1: number; x2: number; y: number; h?: number; color?: string; line?: string; dashOffset?: number }) {
  const dashes: React.ReactElement[] = [];
  for (let dx = x1 + dashOffset; dx < x2; dx += 30) dashes.push(<Rect key={dx} x={dx} y={y + h / 2 - 0.8} width={14} height={1.6} rx={0.8} fill={line} opacity={0.75} />);
  return (
    <G>
      <Rect x={x1} y={y} width={x2 - x1} height={h} fill={color} />
      <Rect x={x1} y={y - 2} width={x2 - x1} height={2.4} fill={tint(color, 0.35)} />
      {dashes}
    </G>
  );
}

export function BusStopSign({ x, y, color = ob.blue }: { x: number; y: number; color?: string }) {
  return (
    <G>
      <Rect x={x - 0.9} y={y - 30} width={1.8} height={30} rx={0.9} fill={ob.indigoSoft} />
      <Rect x={x - 8} y={y - 40} width={16} height={12} rx={3} fill={color} />
      <Rect x={x - 5} y={y - 37} width={10} height={4.4} rx={1.2} fill="#CFE5FF" />
      <Circle cx={x - 3} cy={y - 31} r={1.1} fill="#FFFFFF" />
      <Circle cx={x + 3} cy={y - 31} r={1.1} fill="#FFFFFF" />
    </G>
  );
}

/** A street-level station entrance: canopy, glass front, steps and the MetroMate-style roundel on top. */
export function StationEntrance({ x, y, w = 56, accent = ob.violet, glass = '#CFE5FF' }: { x: number; y: number; w?: number; accent?: string; glass?: string }) {
  return (
    <G>
      <Rect x={x} y={y - 26} width={w} height={26} rx={3} fill={tint(ob.lavender, 0.2)} />
      <Rect x={x + 5} y={y - 20} width={w - 10} height={20} fill={glass} />
      {[0.25, 0.5, 0.75].map((f) => (
        <Rect key={f} x={x + 5 + (w - 10) * f - 0.6} y={y - 20} width={1.2} height={20} fill="#FFFFFF" opacity={0.8} />
      ))}
      <Path d={`M${x - 5} ${y - 26} L${x + 4} ${y - 34} H${x + w - 4} L${x + w + 5} ${y - 26} Z`} fill={accent} />
      <Circle cx={x + w / 2} cy={y - 44} r={7.5} fill="#FFFFFF" stroke={accent} strokeWidth={2} />
      <Path d={`M${x + w / 2 - 3.2} ${y - 41} V${y - 47} L${x + w / 2} ${y - 43} L${x + w / 2 + 3.2} ${y - 47} V${y - 41}`} stroke={accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x={x + w / 2 - 1} y={y - 37} width={2} height={3.4} fill={accent} />
    </G>
  );
}

/** Zebra crossing seen side-on across a road strip. */
export function Crossing({ x, y, h = 22, n = 6 }: { x: number; y: number; h?: number; n?: number }) {
  return (
    <G>
      {Array.from({ length: n }, (_, i) => (
        <Rect key={i} x={x + i * 6} y={y + 1} width={3.6} height={h - 2} rx={0.8} fill="#FFFFFF" opacity={0.9} />
      ))}
    </G>
  );
}

/** Soft sun with a halo. */
export function Sun({ x, y, r = 14, color = '#FFC98F' }: { x: number; y: number; r?: number; color?: string }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r * 2.6} fill={color} opacity={0.14} />
      <Circle cx={x} cy={y} r={r * 1.8} fill={color} opacity={0.22} />
      <Circle cx={x} cy={y} r={r} fill={color} />
    </G>
  );
}

/** Vertical sky gradient. `id` must be unique in the Svg. */
export function SkyGradient({ id, top, bottom, y = 0, h = 440, x = -60, w = 480 }: { id: string; top: string; bottom: string; y?: number; h?: number; x?: number; w?: number }) {
  return (
    <G>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
    </G>
  );
}

// ------------------------------------------------------------------------------ vehicles

/** Three-car metro, facing right. 150 x 34. */
export function MetroTrainArt({ body = '#FFFFFF', stripe = ob.violet, glass = '#3A3780', glow }: { body?: string; stripe?: string; glass?: string; glow?: string }) {
  const cars = [0, 50, 100];
  return (
    <G>
      {cars.map((cx, i) => {
        const front = i === 2;
        return (
          <G key={cx}>
            <Path d={front ? `M${cx} 4 H${cx + 36} Q${cx + 46} 5 ${cx + 49} 16 V26 H${cx} Z` : `M${cx + 3} 4 H${cx + 47} V26 H${cx + 3} Z`} fill={body} />
            <Rect x={cx + (front ? 0 : 3)} y={17.5} width={front ? 49 : 44} height={3} fill={stripe} />
            {[0, 1, 2, 3].slice(0, front ? 3 : 4).map((k) => (
              <Rect key={k} x={cx + 7 + k * 10.5} y={8} width={7.4} height={7} rx={1.6} fill={glass} />
            ))}
            {front ? <Path d={`M${cx + 38} 8 H${cx + 42} Q${cx + 46} 9 ${cx + 47.5} 15 H${cx + 38} Z`} fill={glass} /> : null}
            <Rect x={cx + (front ? 0 : 3)} y={26} width={front ? 49 : 44} height={3.4} rx={1.4} fill={shade(stripe, 0.35)} />
            {[10, 36].map((wx) => (
              <Circle key={wx} cx={cx + wx} cy={30.4} r={2.6} fill={ob.indigo} />
            ))}
          </G>
        );
      })}
      {cars.slice(0, 2).map((cx) => (
        <Rect key={cx} x={cx + 47} y={14} width={6} height={9} rx={2} fill={shade(ob.lavenderDeep, 0.1)} />
      ))}
      {glow ? <Circle cx={149} cy={20} r={3.4} fill={glow} opacity={0.9} /> : <Circle cx={148.6} cy={21} r={1.6} fill="#FFE3A3" />}
    </G>
  );
}

/** City bus, facing right. 68 x 34. */
export function BusArt({ body = ob.blue, glass = '#CFE5FF', stripe = '#FFFFFF' }: { body?: string; glass?: string; stripe?: string }) {
  return (
    <G>
      <Rect x={1} y={5} width={62} height={24} rx={5} fill={body} />
      <Path d="M58 5 H63 Q67 7 67.5 14 V29 H58 Z" fill={body} />
      <Rect x={4} y={9} width={9} height={8} rx={1.8} fill={glass} />
      <Rect x={15.5} y={9} width={9} height={8} rx={1.8} fill={glass} />
      <Rect x={27} y={9} width={9} height={8} rx={1.8} fill={glass} />
      <Rect x={38.5} y={9} width={9} height={8} rx={1.8} fill={glass} />
      <Path d="M52 9 H60 Q64.5 10 65.4 16 H52 Z" fill={glass} />
      <Rect x={1} y={19.5} width={66} height={2.4} fill={stripe} opacity={0.95} />
      <Rect x={3} y={25.5} width={60} height={3.6} rx={1.4} fill={shade(body, 0.3)} />
      <Rect x={56} y={4} width={9} height={2.4} rx={1} fill="#FFC857" />
      <Circle cx={15} cy={29.5} r={4} fill={ob.indigo} />
      <Circle cx={15} cy={29.5} r={1.6} fill="#B9B5C0" />
      <Circle cx={52} cy={29.5} r={4} fill={ob.indigo} />
      <Circle cx={52} cy={29.5} r={1.6} fill="#B9B5C0" />
      <Rect x={66} y={22} width={2.4} height={3.6} rx={1} fill="#FFE3A3" />
    </G>
  );
}

/** A small bird: two wings in a flat V. 16 x 8. */
export function BirdArt({ color = ob.indigoSoft, up = false }: { color?: string; up?: boolean }) {
  return up ? <Path d="M1 2 Q5 6 8 5 Q11 6 15 2 Q11 7 8 7 Q5 7 1 2 Z" fill={color} /> : <Path d="M1 5 Q5 0 8 4 Q11 0 15 5 Q11 3 8 6 Q5 3 1 5 Z" fill={color} />;
}

/** The MetroMate train mark as flat Svg shapes (same drawing as the app's icon), for placing in art. */
export function TrainMark({ x, y, size, color = '#FFFFFF' }: { x: number; y: number; size: number; color?: string }) {
  const s = size / 24;
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4.5} y={2.5} width={15} height={14.5} rx={4} />
      <Rect x={7.5} y={5.8} width={9} height={4.6} rx={1.4} />
      <Circle cx={8.6} cy={13.6} r={0.9} fill={color} stroke="none" />
      <Circle cx={15.4} cy={13.6} r={0.9} fill={color} stroke="none" />
      <Path d="M8 17 L6 21.5 M16 17 L18 21.5 M5 21.5 H19" />
    </G>
  );
}
