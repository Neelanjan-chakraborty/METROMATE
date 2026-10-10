/*
 * Shared vector parts for every illustration on the site, so the hero, the cards and the feature scenes read
 * as one hand. Flat shapes in a warm desaturated palette, drawn in SVG user units with y pointing down; `y` is
 * usually the ground line a thing stands on. These are plain SVG elements (no hooks), usable inside any <svg>
 * and inside framer-motion groups.
 */

/** Illustration palette: warm paper, lavender shadows, muted sage, peach light, MetroMate violet. */
export const art = {
  paper: '#FDFCF8',
  ink: '#292524',
  inkSoft: '#57534E',
  violet: '#5140E8',
  violetMid: '#8B80EE',
  violetSoft: '#C9C2F6',
  lavender: '#EFEDF4',
  lavenderMid: '#E2DEEF',
  lavenderDeep: '#CFC8E6',
  shadow: '#D9D3EA',
  sage: '#E8EFE8',
  sageMid: '#CFE0CF',
  leaf: '#A9CBB2',
  leafDeep: '#86B394',
  coral: '#FFB7B2',
  coralDeep: '#F0928B',
  peach: '#FFE3D1',
  sun: '#FFC98F',
  sunGlow: '#FFE9CF',
  water: '#D7E8EF',
  waterDeep: '#B9D6E2',
  road: '#5B5466',
  roadLine: '#F4F1EA',
  metroRed: '#D94343',
  busBlue: '#2783F5',
  glass: '#3D3A6B',
  window: '#FFE7BD',
  stone: '#EDE6DA',
  stoneDeep: '#DCD2C3',
} as const;

const mix = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('')}`;
};
export const shade = (c: string, k: number) => mix(c, '#2B2540', k);
export const tint = (c: string, k: number) => mix(c, '#FFFFFF', k);

/** Deterministic pseudo-random in [0, 1) from a seed, so artwork never changes between renders. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

// ------------------------------------------------------------------------------- buildings

interface BuildingProps {
  x: number;
  /** Ground line. */
  y: number;
  w: number;
  h: number;
  fill: string;
  seed?: number;
  /** Share of windows that glow warm. */
  lit?: number;
  roof?: 'flat' | 'tank' | 'slant' | 'dome';
}

/** A soft building: body, a shaded side, a sparse window grid batched into two paths. */
export function Building({ x, y, w, h, fill, seed = 1, lit = 0.2, roof = 'flat' }: BuildingProps) {
  const cols = Math.max(1, Math.floor((w - 6) / 9));
  const rows = Math.max(1, Math.floor((h - 12) / 12));
  const ox = x + (w - (cols - 1) * 9 - 3.4) / 2;
  let litD = '';
  let dimD = '';
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const d = `M${(ox + c * 9).toFixed(1)} ${(y - h + 8 + r * 12).toFixed(1)}h3.4v4.6h-3.4z`;
      if (rand(seed * 31 + r * 7 + c) < lit) litD += d;
      else if (rand(seed * 17 + r * 3 + c * 5) < 0.55) dimD += d;
    }
  const side = shade(fill, 0.1);
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} rx={2} fill={fill} />
      <rect x={x + w * 0.7} y={y - h} width={w * 0.3} height={h} fill={side} opacity={0.45} />
      {roof === 'tank' ? <rect x={x + w * 0.25} y={y - h - 7} width={w * 0.32} height={7} rx={2} fill={side} /> : null}
      {roof === 'slant' ? <path d={`M${x} ${y - h} L${x + w} ${y - h - 8} V${y - h} Z`} fill={side} /> : null}
      {roof === 'dome' ? <path d={`M${x + w * 0.2} ${y - h} Q${x + w / 2} ${y - h - w * 0.55} ${x + w * 0.8} ${y - h} Z`} fill={side} /> : null}
      <path d={dimD} fill={tint(fill, 0.55)} opacity={0.5} />
      <path d={litD} fill={art.window} />
    </g>
  );
}

/** A domed hall with two minarets: a soft nod to the city's heritage skyline. */
export function DomeHall({ x, y, w = 70, fill, accent }: { x: number; y: number; w?: number; fill: string; accent: string }) {
  const h = w * 0.48;
  const cx = x + w / 2;
  return (
    <g>
      <rect x={x} y={y - h * 0.5} width={w} height={h * 0.5} fill={fill} />
      {Array.from({ length: Math.floor(w / 12) }, (_, i) => {
        const ax = x + 8 + i * ((w - 16) / Math.max(1, Math.floor(w / 12) - 1));
        return <path key={i} d={`M${ax - 3} ${y} V${y - 8} a3 3 0 0 1 6 0 V${y} Z`} fill={shade(fill, 0.14)} />;
      })}
      <path d={`M${cx - w * 0.24} ${y - h * 0.5} Q${cx} ${y - h * 1.35} ${cx + w * 0.24} ${y - h * 0.5} Z`} fill={accent} />
      <rect x={cx - 0.8} y={y - h * 1.48} width={1.6} height={h * 0.18} fill={accent} />
      {[x - 3, x + w - 3].map((mx) => (
        <g key={mx}>
          <rect x={mx} y={y - h * 0.95} width={6} height={h * 0.95} fill={fill} />
          <path d={`M${mx - 1} ${y - h * 0.95} Q${mx + 3} ${y - h * 1.25} ${mx + 7} ${y - h * 0.95} Z`} fill={accent} />
        </g>
      ))}
    </g>
  );
}

// ------------------------------------------------------------------------------ nature

export function Tree({ x, y, r = 10, a = art.leaf, b = art.leafDeep }: { x: number; y: number; r?: number; a?: string; b?: string }) {
  return (
    <g>
      <rect x={x - 1.1} y={y - r * 0.95} width={2.2} height={r * 0.95} rx={1} fill={art.inkSoft} opacity={0.55} />
      <circle cx={x} cy={y - r * 1.5} r={r} fill={a} />
      <circle cx={x + r * 0.5} cy={y - r * 1.15} r={r * 0.68} fill={b} />
      <circle cx={x - r * 0.55} cy={y - r * 1.05} r={r * 0.58} fill={b} opacity={0.8} />
    </g>
  );
}

/** A tall slender tree (ashoka-like), for rhythm along roads and banks. */
export function SlimTree({ x, y, h = 30, fill = art.leafDeep }: { x: number; y: number; h?: number; fill?: string }) {
  return (
    <g>
      <rect x={x - 0.8} y={y - h * 0.3} width={1.6} height={h * 0.3} fill={art.inkSoft} opacity={0.5} />
      <path d={`M${x} ${y - h} C${x + h * 0.22} ${y - h * 0.7} ${x + h * 0.2} ${y - h * 0.32} ${x} ${y - h * 0.25} C${x - h * 0.2} ${y - h * 0.32} ${x - h * 0.22} ${y - h * 0.7} ${x} ${y - h} Z`} fill={fill} />
    </g>
  );
}

export function Cloud({ x, y, s = 1, opacity = 0.9 }: { x: number; y: number; s?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <rect x={0} y={10} width={52} height={11} rx={5.5} fill="#FFFFFF" />
      <circle cx={16} cy={11} r={9} fill="#FFFFFF" />
      <circle cx={31} cy={8} r={11} fill="#FFFFFF" />
    </g>
  );
}

export function Sun({ x, y, r = 16 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 3} fill={art.sunGlow} opacity={0.55} />
      <circle cx={x} cy={y} r={r * 1.9} fill={art.sun} opacity={0.25} />
      <circle cx={x} cy={y} r={r} fill={art.sun} />
    </g>
  );
}

export function Lamp({ x, y, h = 28 }: { x: number; y: number; h?: number }) {
  return (
    <g>
      <rect x={x - 0.8} y={y - h} width={1.6} height={h} rx={0.8} fill={art.inkSoft} opacity={0.7} />
      <path d={`M${x} ${y - h} h6`} stroke={art.inkSoft} strokeOpacity={0.7} strokeWidth={1.6} strokeLinecap="round" />
      <rect x={x + 4} y={y - h + 0.8} width={4.6} height={2.2} rx={1.1} fill={art.window} />
    </g>
  );
}

// ------------------------------------------------------------------------------ people

/** A tiny commuter silhouette (no face), used sparingly for scale. */
export function Person({ x, y, s = 1, color = art.inkSoft, bag, step = 0 }: { x: number; y: number; s?: number; color?: string; bag?: string; step?: 0 | 1 }) {
  const l = step ? 3 : -2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={-19} r={3.1} fill={color} />
      <path d="M-4 -15 Q0 -17.5 4 -15 L4.6 -6 H-4.6 Z" fill={color} />
      <path d={`M-2.6 -6 L${-2.6 + l * 0.5} 0 M2.6 -6 L${2.6 - l * 0.5} 0`} stroke={color} strokeWidth={2.3} strokeLinecap="round" />
      {bag ? <rect x={3} y={-13} width={4.2} height={5.2} rx={1.2} fill={bag} /> : null}
    </g>
  );
}

// ---------------------------------------------------------------------------- transport

/** One metro car facing right, 50 × 30 (origin at its top-left). `front` adds the cab nose and headlight. */
export function MetroCar({ front = false, body = '#FFFFFF', stripe = art.violet }: { front?: boolean; body?: string; stripe?: string }) {
  return (
    <g>
      <path d={front ? 'M1 3 H37 Q47 4 49 15 V25 H1 Z' : 'M3 3 H47 V25 H3 Z'} fill={body} />
      <rect x={front ? 1 : 3} y={16.5} width={front ? 48 : 44} height={2.8} fill={stripe} />
      {[0, 1, 2, 3].slice(0, front ? 3 : 4).map((k) => (
        <rect key={k} x={7 + k * 10.5} y={7} width={7.4} height={6.6} rx={1.6} fill={art.glass} />
      ))}
      {front ? <path d="M38 7 H42 Q46 8 47.5 14 H38 Z" fill={art.glass} /> : null}
      <rect x={front ? 1 : 3} y={25} width={front ? 48 : 44} height={3} rx={1.3} fill={shade(stripe, 0.3)} />
      {front ? <circle cx={47.6} cy={19.6} r={1.7} fill={art.window} /> : null}
    </g>
  );
}

/** A three-car MetroMate-violet train facing right, 150 × 30. */
export function Train({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g>
        <MetroCar />
      </g>
      <g transform="translate(50 0)">
        <MetroCar />
      </g>
      <g transform="translate(100 0)">
        <MetroCar front />
      </g>
      <rect x={47} y={12} width={6} height={8} rx={2} fill={art.lavenderDeep} />
      <rect x={97} y={12} width={6} height={8} rx={2} fill={art.lavenderDeep} />
    </g>
  );
}

/** A blue city bus facing right, 68 × 32. */
export function Bus({ x = 0, y = 0, scale = 1, body = art.busBlue }: { x?: number; y?: number; scale?: number; body?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={1} y={4} width={62} height={23} rx={5} fill={body} />
      <path d="M58 4 H63 Q67 6 67.5 13 V27 H58 Z" fill={body} />
      {[4, 15.5, 27, 38.5].map((wx) => (
        <rect key={wx} x={wx} y={8} width={9} height={7.6} rx={1.8} fill="#D6E8FF" />
      ))}
      <path d="M52 8 H60 Q64.5 9 65.4 15 H52 Z" fill="#D6E8FF" />
      <rect x={1} y={18.5} width={66} height={2.2} fill="#FFFFFF" opacity={0.9} />
      <rect x={3} y={24} width={60} height={3.4} rx={1.4} fill={shade(body, 0.3)} />
      <circle cx={15} cy={28} r={3.8} fill={art.ink} />
      <circle cx={52} cy={28} r={3.8} fill={art.ink} />
      <circle cx={15} cy={28} r={1.4} fill="#C9C4CC" />
      <circle cx={52} cy={28} r={1.4} fill="#C9C4CC" />
      <rect x={66} y={20} width={2.2} height={3.4} rx={1} fill={art.window} />
    </g>
  );
}

/** Elevated viaduct: deck, parapet, rail line and tapered piers. `y` is the top of the deck. */
export function Viaduct({ x1, x2, y, ground, pier = 70, deck = art.lavenderMid, dark = art.lavenderDeep, rail = art.violetSoft }: { x1: number; x2: number; y: number; ground: number; pier?: number; deck?: string; dark?: string; rail?: string }) {
  const piers = [];
  for (let px = x1 + pier / 2; px < x2; px += pier)
    piers.push(
      <g key={px}>
        <path d={`M${px - 4.5} ${y + 7} H${px + 4.5} L${px + 5.5} ${ground} H${px - 5.5} Z`} fill={dark} />
        <rect x={px - 9} y={y + 5} width={18} height={4.2} rx={1.6} fill={deck} />
      </g>,
    );
  return (
    <g>
      {piers}
      <rect x={x1} y={y} width={x2 - x1} height={7} fill={deck} />
      <rect x={x1} y={y + 5.6} width={x2 - x1} height={1.8} fill={dark} />
      <rect x={x1} y={y - 2.2} width={x2 - x1} height={2.2} fill={tint(deck, 0.45)} />
      <rect x={x1} y={y - 0.4} width={x2 - x1} height={1.1} fill={rail} />
    </g>
  );
}

export function Road({ x1, x2, y, h = 20 }: { x1: number; x2: number; y: number; h?: number }) {
  const dashes = [];
  for (let dx = x1 + 6; dx < x2; dx += 28) dashes.push(<rect key={dx} x={dx} y={y + h / 2 - 0.7} width={13} height={1.4} rx={0.7} fill={art.roadLine} opacity={0.7} />);
  return (
    <g>
      <rect x={x1} y={y} width={x2 - x1} height={h} fill={art.road} />
      <rect x={x1} y={y - 1.8} width={x2 - x1} height={2.2} fill={tint(art.road, 0.4)} />
      {dashes}
    </g>
  );
}

/** A street-level metro entrance: canopy, glass front and the station roundel. */
export function StationEntrance({ x, y, w = 56, accent = art.violet }: { x: number; y: number; w?: number; accent?: string }) {
  return (
    <g>
      <rect x={x} y={y - 26} width={w} height={26} rx={3} fill={art.paper} />
      <rect x={x + 5} y={y - 20} width={w - 10} height={20} fill="#D8E6F3" />
      {[0.25, 0.5, 0.75].map((f) => (
        <rect key={f} x={x + 5 + (w - 10) * f - 0.6} y={y - 20} width={1.2} height={20} fill="#FFFFFF" opacity={0.85} />
      ))}
      <path d={`M${x - 5} ${y - 26} L${x + 4} ${y - 33} H${x + w - 4} L${x + w + 5} ${y - 26} Z`} fill={accent} />
      <circle cx={x + w / 2} cy={y - 43} r={7.5} fill="#FFFFFF" stroke={accent} strokeWidth={2} />
      <path d={`M${x + w / 2 - 3.2} ${y - 40} V${y - 46} L${x + w / 2} ${y - 42} L${x + w / 2 + 3.2} ${y - 46} V${y - 40}`} stroke={accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x={x + w / 2 - 1} y={y - 36} width={2} height={3.2} fill={accent} />
    </g>
  );
}

export function BusStop({ x, y, color = art.busBlue }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <rect x={x - 0.9} y={y - 30} width={1.8} height={30} rx={0.9} fill={art.inkSoft} />
      <rect x={x - 8} y={y - 40} width={16} height={12} rx={3} fill={color} />
      <rect x={x - 5} y={y - 37} width={10} height={4.2} rx={1.2} fill="#D6E8FF" />
    </g>
  );
}

/** A station node on a route line: white dot with a coloured ring; `filled` for a lit or terminal stop. */
export function Node({ x, y, r = 5, color = art.violet, filled = false }: { x: number; y: number; r?: number; color?: string; filled?: boolean }) {
  return <circle cx={x} cy={y} r={r} fill={filled ? color : '#FFFFFF'} stroke={color} strokeWidth={Math.max(1.6, r * 0.45)} />;
}

/** An interchange: a larger white node with a dark ring. */
export function Interchange({ x, y, r = 7 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 3} fill="#FFFFFF" opacity={0.7} />
      <circle cx={x} cy={y} r={r} fill="#FFFFFF" stroke={art.ink} strokeWidth={r * 0.42} />
    </g>
  );
}

/** A map pin (destination). */
export function Pin({ x, y, s = 1, color = art.metroRed }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 c-7 -8 -9.5 -11.5 -9.5 -15 a9.5 9.5 0 0 1 19 0 c0 3.5 -2.5 7 -9.5 15 Z" fill={color} />
      <circle cx={0} cy={-15} r={3.6} fill="#FFFFFF" />
    </g>
  );
}

/** A small house (home landmark). */
export function House({ x, y, s = 1, wall = art.peach, roof = art.coralDeep }: { x: number; y: number; s?: number; wall?: string; roof?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-12} y={-18} width={24} height={18} rx={1.5} fill={wall} />
      <path d="M-15 -17 L0 -30 L15 -17 Z" fill={roof} />
      <rect x={-3} y={-10} width={6} height={10} rx={1} fill={shade(wall, 0.25)} />
      <rect x={-9.5} y={-14} width={4.4} height={4.4} rx={0.8} fill={art.window} />
    </g>
  );
}

/** "No signal" mark: Wi-Fi arcs with a slash. */
export function NoSignal({ x, y, s = 1, color = art.inkSoft, slash = art.coralDeep }: { x: number; y: number; s?: number; color?: string; slash?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" strokeLinecap="round">
      <path d="M-14 -4 a20 20 0 0 1 28 0 M-9 1 a12 12 0 0 1 18 0 M-4 6 a5 5 0 0 1 8 0" stroke={color} strokeWidth={3} opacity={0.45} />
      <circle cx={0} cy={10} r={2.4} fill={color} stroke="none" opacity={0.6} />
      <path d="M-13 -12 L13 14" stroke={slash} strokeWidth={3.2} />
    </g>
  );
}
