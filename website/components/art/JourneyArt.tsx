'use client';

import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { art, Building, Bus, Cloud, DomeHall, House, Interchange, MetroCar, Pin, shade, SlimTree, Sun, tint, Tree } from './kit';
import { easeInOut, makeRoute, type Pt, type Route } from './journeyGeometry';

/*
 * "One journey, clearly connected": home → metro (violet) → interchange → bus (blue) → campus.
 * Every moving part is driven by one 0..1 `progress` value (the section's scroll position). With `live` off the
 * scene is the finished journey, still: both lines drawn, every stop lit, the train and bus parked on their legs.
 */

export const TIMELINE = {
  pin: [0.02, 0.1],
  metro: [0.13, 0.46],
  change: [0.46, 0.56],
  bus: [0.55, 0.8],
  arrive: [0.76, 0.9],
} as const;

/** Which of the four steps is current at a given progress. */
export const stepAt = (v: number) => (v < 0.12 ? 0 : v < 0.46 ? 1 : v < 0.8 ? 2 : 3);

const GROUND = 540;

interface Layout {
  id: string;
  vb: [number, number, number, number];
  ground: number;
  A: Pt;
  I: Pt;
  F: Pt;
  metro: Route;
  bus: Route;
  metroStops: Pt[];
  busStops: Pt[];
  /** Where the still scene parks the train and the bus (share of their legs). */
  park: [number, number];
  sun: [number, number, number];
  clouds: [number, number, number, number][];
  skyline: { x: number; w: number; h: number; deep?: boolean; roof?: 'flat' | 'tank' | 'slant' }[];
  dome: [number, number];
  trees: { x: number; r?: number; slim?: number; soft?: boolean }[];
  house: [number, number];
  homeChip: Pt;
  walkHome: string;
  walkCampus?: string;
  campus: [number, number];
  campusChip: Pt;
  changeChip: Pt;
  /** Hide in-scene labels on narrow screens (the wide scene gets too small to read them). */
  chipsWideOnly: boolean;
}

const wideF: Pt = [810, 450];
const WIDE: Layout = {
  id: 'wide',
  vb: [0, 110, 1000, 490],
  ground: GROUND,
  A: [150, 450],
  I: [540, 350],
  F: wideF,
  metro: makeRoute([[150, 450], [290, 450], [420, 350], [540, 350]], 30),
  bus: makeRoute([[540, 350], [600, 350], [700, 450], wideF], 30),
  metroStops: [[222, 450], [355, 400], [475, 350]],
  busStops: [[650, 400]],
  park: [0.62, 0.42],
  sun: [880, 196, 21],
  clouds: [[96, 168, 1.15, 0.9], [300, 150, 0.75, 0.75], [700, 176, 0.6, 0.65]],
  skyline: [
    { x: 196, w: 46, h: 150, roof: 'tank' },
    { x: 246, w: 36, h: 96, deep: true },
    { x: 404, w: 52, h: 232, roof: 'slant' },
    { x: 460, w: 40, h: 128, deep: true },
    { x: 566, w: 58, h: 176, roof: 'tank' },
    { x: 628, w: 38, h: 250, deep: true },
    { x: 672, w: 50, h: 120 },
  ],
  dome: [300, 84],
  trees: [{ x: 176, slim: 44 }, { x: 40, r: 15 }, { x: 520, slim: 38 }, { x: 548, r: 11, soft: true }, { x: 760, slim: 40 }],
  house: [92, 2.2],
  homeChip: [86, 404],
  walkHome: 'M104 540 C134 540 150 520 150 466',
  walkCampus: 'M810 466 C810 516 836 536 872 540',
  campus: [838, 1],
  campusChip: [904, 372],
  changeChip: [540, 300],
  chipsWideOnly: true,
};

/** Portrait composition for phones: the route arches over the skyline from home (left) to campus (right). */
const tallF: Pt = [322, 404];
const TALL: Layout = {
  id: 'tall',
  vb: [0, 64, 400, 536],
  ground: 560,
  A: [92, 478],
  I: [222, 290],
  F: tallF,
  metro: makeRoute([[92, 478], [92, 392], [170, 290], [222, 290]], 26),
  bus: makeRoute([[222, 290], [322, 290], tallF], 26),
  metroStops: [[92, 424], [190, 290]],
  busStops: [],
  park: [0.58, 0.3],
  sun: [336, 124, 16],
  clouds: [[24, 118, 0.85, 0.9], [190, 96, 0.6, 0.7]],
  skyline: [
    { x: 118, w: 40, h: 140, roof: 'tank' },
    { x: 160, w: 30, h: 86, deep: true },
    { x: 196, w: 44, h: 226, roof: 'slant' },
    { x: 242, w: 32, h: 120, deep: true },
  ],
  dome: [128, 0],
  trees: [{ x: 18, r: 11 }, { x: 116, slim: 34 }, { x: 250, slim: 30 }, { x: 236, r: 8, soft: true }],
  house: [50, 1.7],
  homeChip: [44, 448],
  walkHome: 'M60 560 C82 558 92 534 92 494',
  campus: [268, 0.8],
  campusChip: [210, 418],
  changeChip: [222, 248],
  chipsWideOnly: false,
};

const span = (r: readonly [number, number], share: number) => r[0] + (r[1] - r[0]) * share;

interface SceneProps {
  progress: MotionValue<number>;
  live: boolean;
  /** `tall` is the still, portrait composition used on phones. */
  variant?: 'wide' | 'tall';
  className?: string;
}

export function JourneyArt({ progress, live: liveProp, variant = 'wide', className = '' }: SceneProps) {
  const L = variant === 'tall' ? TALL : WIDE;
  const live = liveProp && variant === 'wide';
  const { A, I, F } = L;
  const metroDraw = useTransform(progress, [TIMELINE.metro[0], TIMELINE.metro[1]], [0, 1]);
  const metroOn = useTransform(progress, [TIMELINE.metro[0], TIMELINE.metro[0] + 0.004], [0, 1]);
  const busDraw = useTransform(progress, [TIMELINE.bus[0], TIMELINE.bus[1]], [0, 1]);
  const busOn = useTransform(progress, [TIMELINE.bus[0], TIMELINE.bus[0] + 0.004], [0, 1]);
  const metroDim = useTransform(progress, [TIMELINE.change[0], TIMELINE.bus[0] + 0.06], [1, 0.55]);

  const pinY = useTransform(progress, [TIMELINE.pin[0], TIMELINE.pin[1]], [-36, 0]);
  const pinO = useTransform(progress, [TIMELINE.pin[0], TIMELINE.pin[0] + 0.04], [0, 1]);

  const pulseS = useTransform(progress, [TIMELINE.change[0], TIMELINE.change[1]], [0.6, 2.2]);
  const pulseO = useTransform(progress, [TIMELINE.change[0], TIMELINE.change[0] + 0.02, TIMELINE.change[1]], [0, 0.55, 0]);
  const changeChip = useTransform(progress, [TIMELINE.change[0] - 0.03, TIMELINE.change[0]], [0, 1]);

  const campusO = useTransform(progress, [TIMELINE.arrive[0], TIMELINE.arrive[0] + 0.06], [0, 1]);
  const campusS = useTransform(progress, [TIMELINE.arrive[0], TIMELINE.arrive[1]], [0.86, 1]);
  const arrivedO = useTransform(progress, [TIMELINE.arrive[1] - 0.04, TIMELINE.arrive[1]], [0, 1]);

  const [vx, vy, vw, vh] = L.vb;
  const G = L.ground;
  const chipCls = L.chipsWideOnly ? 'max-sm:hidden' : '';
  return (
    <svg viewBox={L.vb.join(' ')} className={`block h-auto w-full ${className}`} role="img" aria-label="Illustration: a journey from home by metro to an interchange, then by bus to a campus.">
      <defs>
        <linearGradient id={`jd-sky-${L.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F3F0FA" />
          <stop offset="0.75" stopColor="#FBF7F1" />
        </linearGradient>
      </defs>
      <rect x={vx} y={vy} width={vw} height={vh} fill={`url(#jd-sky-${L.id})`} />
      <Sun x={L.sun[0]} y={L.sun[1]} r={L.sun[2]} />
      {L.clouds.map(([x, y, sc, o]) => (
        <Cloud key={x} x={x} y={y} s={sc} opacity={o} />
      ))}

      {/* distant skyline */}
      <g opacity={0.8}>
        {L.skyline.map((b, i) => (
          <Building key={b.x} x={b.x} y={G} w={b.w} h={b.h} fill={b.deep ? art.lavenderDeep : art.lavenderMid} seed={3 + i * 2} lit={0.06} roof={b.roof} />
        ))}
        {L.dome[1] ? <DomeHall x={L.dome[0]} y={G} w={L.dome[1]} fill={art.lavenderMid} accent={art.lavenderDeep} /> : null}
      </g>

      {/* ground */}
      <rect x={vx} y={G} width={vw} height={vy + vh - G} fill={art.sageMid} />
      <rect x={vx} y={G} width={vw} height={5} fill={tint(art.sageMid, 0.5)} />
      {L.trees.map((t) => (t.slim ? <SlimTree key={t.x} x={t.x} y={G} h={t.slim} /> : <Tree key={t.x} x={t.x} y={G} r={t.r} {...(t.soft ? { a: art.sageMid, b: art.leaf } : {})} />))}

      {/* home */}
      <House x={L.house[0]} y={G} s={L.house[1]} />
      <Chip x={L.homeChip[0]} y={L.homeChip[1]} label="Home" className={chipCls} />

      {/* walk links */}
      <path d={L.walkHome} fill="none" stroke={art.inkSoft} strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" strokeDasharray="0.1 8" />
      {L.walkCampus ? <path d={L.walkCampus} fill="none" stroke={art.inkSoft} strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" strokeDasharray="0.1 8" /> : null}

      {/* destination: campus */}
      <motion.g style={live ? { opacity: campusO, scale: campusS, transformBox: 'fill-box', transformOrigin: '50% 100%' } : undefined}>
        <g transform={`translate(${L.campus[0]} ${G}) scale(${L.campus[1]}) translate(-838 -${GROUND})`}>
          <Campus />
        </g>
        <Chip x={L.campusChip[0]} y={L.campusChip[1]} label="Campus" className={chipCls} />
      </motion.g>

      {/* the planned route, faint, before it is travelled */}
      <path d={L.metro.d} fill="none" stroke={art.lavenderDeep} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 11" />
      <path d={L.bus.d} fill="none" stroke={art.lavenderDeep} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 11" />

      {/* travelled lines */}
      <motion.g style={live ? { opacity: metroOn } : undefined}>
        <motion.path d={L.metro.d} fill="none" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" style={live ? { pathLength: metroDraw } : undefined} />
        <motion.path d={L.metro.d} fill="none" stroke={art.violet} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" style={live ? { pathLength: metroDraw, opacity: metroDim } : undefined} />
      </motion.g>
      <motion.g style={live ? { opacity: busOn } : undefined}>
        <motion.path d={L.bus.d} fill="none" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" style={live ? { pathLength: busDraw } : undefined} />
        <motion.path d={L.bus.d} fill="none" stroke={art.busBlue} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" style={live ? { pathLength: busDraw } : undefined} />
      </motion.g>

      {/* stops light up as the line reaches them */}
      <LitNode at={A} color={art.violet} on={TIMELINE.metro[0]} progress={progress} live={live} big />
      {L.metroStops.map((p) => (
        <LitNode key={p.join()} at={p} color={art.violet} on={span(TIMELINE.metro, L.metro.shareAt(p))} progress={progress} live={live} />
      ))}
      {L.busStops.map((p) => (
        <LitNode key={p.join()} at={p} color={art.busBlue} on={span(TIMELINE.bus, L.bus.shareAt(p))} progress={progress} live={live} />
      ))}
      <LitNode at={F} color={art.busBlue} on={TIMELINE.bus[1]} progress={progress} live={live} big />

      {/* interchange */}
      {live ? <motion.circle cx={I[0]} cy={I[1]} r={14} fill="none" stroke={art.violet} strokeWidth={3} style={{ scale: pulseS, opacity: pulseO, transformBox: 'fill-box', transformOrigin: '50% 50%' }} /> : null}
      <Interchange x={I[0]} y={I[1]} r={10} />
      <motion.g style={live ? { opacity: changeChip } : undefined}>
        <Chip x={L.changeChip[0]} y={L.changeChip[1]} label="Change to bus" accent className={chipCls} />
      </motion.g>

      {/* vehicles */}
      <Rider route={L.metro} range={TIMELINE.metro} progress={progress} live={live} parked={L.park[0]} fade={[TIMELINE.metro[0], TIMELINE.change[0] + 0.02, TIMELINE.change[0] + 0.07]}>
        <g transform="translate(-41.5 -12.4) scale(0.83)">
          <MetroCar />
          <g transform="translate(50 0)">
            <MetroCar front />
          </g>
          <rect x={47} y={12} width={6} height={8} rx={2} fill={art.lavenderDeep} />
        </g>
      </Rider>
      <Rider route={L.bus} range={TIMELINE.bus} end={1 - 52 / L.bus.length} progress={progress} live={live} parked={L.park[1]} fade={[TIMELINE.bus[0] - 0.02, 2, 3]}>
        <Bus x={-31} y={-16} scale={0.92} />
      </Rider>

      {/* destination pin */}
      <motion.g style={live ? { y: pinY, opacity: pinO } : undefined}>
        <Pin x={F[0]} y={F[1] - 14} s={1.5} />
      </motion.g>
      <motion.g style={live ? { opacity: arrivedO } : undefined}>
        <circle cx={F[0]} cy={F[1]} r={18} fill="none" stroke={art.busBlue} strokeOpacity={0.35} strokeWidth={2} />
      </motion.g>
    </svg>
  );
}

/** A campus building with a pediment, columns and steps; the journey's destination. */
function Campus() {
  const x = 838;
  const w = 136;
  const top = GROUND - 92;
  const cols = 6;
  return (
    <g>
      <Tree x={990} y={GROUND} r={13} />
      <rect x={x} y={top} width={w} height={92} rx={2} fill={art.stone} />
      <rect x={x + w * 0.72} y={top} width={w * 0.28} height={92} fill={art.stoneDeep} opacity={0.6} />
      <rect x={x - 6} y={top - 8} width={w + 12} height={9} rx={2} fill={art.peach} />
      <path d={`M${x - 10} ${top - 8} L${x + w / 2} ${top - 44} L${x + w + 10} ${top - 8} Z`} fill={art.coral} />
      <path d={`M${x + 14} ${top - 13} L${x + w / 2} ${top - 36} L${x + w - 14} ${top - 13} Z`} fill={tint(art.coral, 0.35)} />
      <circle cx={x + w / 2} cy={top - 21} r={6} fill="#FFFFFF" stroke={art.coralDeep} strokeWidth={2} />
      {Array.from({ length: cols }, (_, i) => (
        <rect key={i} x={x + 10 + i * ((w - 26) / (cols - 1))} y={top + 6} width={6} height={72} rx={2} fill="#FFFFFF" opacity={0.92} />
      ))}
      <rect x={x + w / 2 - 11} y={GROUND - 30} width={22} height={30} rx={11} fill={shade(art.stone, 0.32)} />
      <rect x={x - 8} y={GROUND - 8} width={w + 16} height={4} rx={1.5} fill={art.stoneDeep} />
      <rect x={x - 14} y={GROUND - 4} width={w + 28} height={4} rx={1.5} fill={shade(art.stoneDeep, 0.08)} />
      <rect x={x + w - 6} y={top - 74} width={1.6} height={30} fill={art.inkSoft} />
      <path d={`M${x + w - 4.4} ${top - 74} h14 l-3 5 l3 5 h-14 Z`} fill={art.violet} />
    </g>
  );
}

/** A small rounded label in the scene. */
function Chip({ x, y, label, accent = false, className = '' }: { x: number; y: number; label: string; accent?: boolean; className?: string }) {
  const w = label.length * 9.4 + 30;
  return (
    <g className={className} aria-hidden>
      <rect x={x - w / 2} y={y - 17} width={w} height={34} rx={17} fill={accent ? art.ink : '#FFFFFF'} stroke={accent ? 'none' : art.lavenderMid} strokeWidth={1.5} />
      <text x={x} y={y + 5.5} textAnchor="middle" fontSize={16} fontWeight={600} fill={accent ? art.paper : art.ink} style={{ fontFamily: 'var(--font-sans)' }}>
        {label}
      </text>
    </g>
  );
}

/** A stop on a line: grey until the line reaches it, then it lights in the line's colour with a small pop. */
function LitNode({ at, color, on, progress, live, big = false }: { at: Pt; color: string; on: number; progress: MotionValue<number>; live: boolean; big?: boolean }) {
  const o = useTransform(progress, [on - 0.005, on + 0.01], [0, 1]);
  const s = useTransform(progress, [on - 0.005, on + 0.012, on + 0.03], [0.4, 1.25, 1]);
  const r = big ? 9 : 6.5;
  return (
    <g>
      <circle cx={at[0]} cy={at[1]} r={r} fill="#FFFFFF" stroke={art.lavenderDeep} strokeWidth={big ? 4 : 3} />
      <motion.g style={live ? { opacity: o, scale: s, transformBox: 'fill-box', transformOrigin: '50% 50%' } : undefined}>
        <circle cx={at[0]} cy={at[1]} r={r} fill="#FFFFFF" stroke={color} strokeWidth={big ? 4.4 : 3.4} />
        <circle cx={at[0]} cy={at[1]} r={big ? 3.8 : 2.6} fill={color} />
      </motion.g>
    </g>
  );
}

/**
 * A vehicle that rides its route between `range[0]` and `range[1]` of the progress, eased at both ends.
 * `fade` = [fade-in start, fade-out start, fade-out end]. Still scenes park it at share `parked`.
 */
function Rider({ route, range, progress, live, parked, fade, end = 1, children }: { route: Route; end?: number; range: readonly [number, number]; progress: MotionValue<number>; live: boolean; parked: number; fade: [number, number, number]; children: ReactNode }) {
  const ref = useRef<SVGGElement>(null);
  const opacity = useTransform(progress, [fade[0], fade[0] + 0.03, fade[1], fade[2]], [0, 1, 1, 0]);
  const tf = useCallback(
    (v: number) => {
      const share = live ? end * easeInOut(Math.min(1, Math.max(0, (v - range[0]) / (range[1] - range[0])))) : parked;
      const p = route.at(share);
      return `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.angle.toFixed(2)})`;
    },
    [live, parked, range, route, end],
  );
  useMotionValueEvent(progress, 'change', (v) => {
    if (live) ref.current?.setAttribute('transform', tf(v));
  });
  useEffect(() => {
    ref.current?.setAttribute('transform', tf(progress.get()));
  }, [tf, progress]);
  return (
    <motion.g style={live ? { opacity } : undefined}>
      <g ref={ref} transform={tf(progress.get())}>
        {children}
      </g>
    </motion.g>
  );
}
