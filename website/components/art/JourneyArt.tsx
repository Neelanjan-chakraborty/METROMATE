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
export const stepAt = (v: number) => (v < 0.12 ? 0 : v < 0.46 ? 1 : v < 0.75 ? 2 : 3);

const GROUND = 540;
const A: Pt = [150, 450];
const I: Pt = [540, 350];
const F: Pt = [800, 450];
const METRO = makeRoute([A, [290, 450], [420, 350], I], 30);
const BUS = makeRoute([I, [620, 350], [740, 450], F], 30);

const METRO_STOPS: Pt[] = [[222, 450], [355, 400], [475, 350]];
const BUS_STOPS: Pt[] = [[680, 400]];

const span = (r: readonly [number, number], share: number) => r[0] + (r[1] - r[0]) * share;

interface SceneProps {
  progress: MotionValue<number>;
  live: boolean;
}

export function JourneyArt({ progress, live }: SceneProps) {
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

  return (
    <svg viewBox="0 0 1000 600" className="block h-auto w-full" role="img" aria-label="Illustration: a journey from home by metro to an interchange, then by bus to a campus.">
      <defs>
        <linearGradient id="jd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F3F0FA" />
          <stop offset="0.75" stopColor="#FBF7F1" />
        </linearGradient>
      </defs>
      <rect width="1000" height="600" fill="url(#jd-sky)" />
      <Sun x={860} y={112} r={24} />
      <Cloud x={120} y={86} s={1.25} />
      <Cloud x={580} y={58} s={0.85} opacity={0.75} />
      <Cloud x={700} y={150} s={0.6} opacity={0.6} />

      {/* distant skyline */}
      <g opacity={0.9}>
        <Building x={196} y={GROUND} w={46} h={150} fill={art.lavenderMid} seed={3} lit={0.06} roof="tank" />
        <Building x={246} y={GROUND} w={36} h={96} fill={art.lavenderDeep} seed={4} lit={0.05} />
        <DomeHall x={300} y={GROUND} w={84} fill={art.lavenderMid} accent={art.lavenderDeep} />
        <Building x={404} y={GROUND} w={52} h={232} fill={art.lavenderMid} seed={7} lit={0.07} roof="slant" />
        <Building x={460} y={GROUND} w={40} h={128} fill={art.lavenderDeep} seed={8} lit={0.05} />
        <Building x={566} y={GROUND} w={58} h={176} fill={art.lavenderMid} seed={9} lit={0.06} roof="tank" />
        <Building x={628} y={GROUND} w={38} h={250} fill={art.lavenderDeep} seed={11} lit={0.05} />
        <Building x={672} y={GROUND} w={50} h={120} fill={art.lavenderMid} seed={12} lit={0.06} />
      </g>

      {/* ground */}
      <rect x={0} y={GROUND} width={1000} height={60} fill={art.sageMid} />
      <rect x={0} y={GROUND} width={1000} height={5} fill={tint(art.sageMid, 0.5)} />
      <SlimTree x={176} y={GROUND} h={44} />
      <Tree x={40} y={GROUND} r={15} />
      <SlimTree x={520} y={GROUND} h={38} />
      <Tree x={548} y={GROUND} r={11} a={art.sageMid} b={art.leaf} />
      <SlimTree x={760} y={GROUND} h={40} />

      {/* home */}
      <House x={92} y={GROUND} s={2.2} />
      <Chip x={92} y={430} label="Home" />

      {/* walk links */}
      <path d="M104 540 C134 540 150 520 150 466" fill="none" stroke={art.inkSoft} strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" strokeDasharray="0.1 8" />
      <path d="M800 466 C800 518 832 538 872 540" fill="none" stroke={art.inkSoft} strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" strokeDasharray="0.1 8" />

      {/* destination: campus */}
      <motion.g style={live ? { opacity: campusO, scale: campusS, transformBox: 'fill-box', transformOrigin: '50% 100%' } : undefined}>
        <Campus />
        <Chip x={904} y={372} label="Campus" />
      </motion.g>

      {/* the planned route, faint, before it is travelled */}
      <path d={METRO.d} fill="none" stroke={art.lavenderDeep} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 11" />
      <path d={BUS.d} fill="none" stroke={art.lavenderDeep} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 11" />

      {/* travelled lines */}
      <motion.g style={live ? { opacity: metroOn } : undefined}>
        <motion.path d={METRO.d} fill="none" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" style={live ? { pathLength: metroDraw } : undefined} />
        <motion.path d={METRO.d} fill="none" stroke={art.violet} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" style={live ? { pathLength: metroDraw, opacity: metroDim } : undefined} />
      </motion.g>
      <motion.g style={live ? { opacity: busOn } : undefined}>
        <motion.path d={BUS.d} fill="none" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" style={live ? { pathLength: busDraw } : undefined} />
        <motion.path d={BUS.d} fill="none" stroke={art.busBlue} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" style={live ? { pathLength: busDraw } : undefined} />
      </motion.g>

      {/* stops light up as the line reaches them */}
      <LitNode at={A} color={art.violet} on={TIMELINE.metro[0]} progress={progress} live={live} big />
      {METRO_STOPS.map((p) => (
        <LitNode key={p.join()} at={p} color={art.violet} on={span(TIMELINE.metro, METRO.shareAt(p))} progress={progress} live={live} />
      ))}
      {BUS_STOPS.map((p) => (
        <LitNode key={p.join()} at={p} color={art.busBlue} on={span(TIMELINE.bus, BUS.shareAt(p))} progress={progress} live={live} />
      ))}
      <LitNode at={F} color={art.busBlue} on={TIMELINE.bus[1]} progress={progress} live={live} big />

      {/* interchange */}
      {live ? <motion.circle cx={I[0]} cy={I[1]} r={14} fill="none" stroke={art.violet} strokeWidth={3} style={{ scale: pulseS, opacity: pulseO, transformBox: 'fill-box', transformOrigin: '50% 50%' }} /> : null}
      <Interchange x={I[0]} y={I[1]} r={10} />
      <motion.g style={live ? { opacity: changeChip } : undefined}>
        <Chip x={I[0]} y={300} label="Change to bus" accent />
      </motion.g>

      {/* vehicles */}
      <Rider route={METRO} range={TIMELINE.metro} progress={progress} live={live} parked={0.62} fade={[TIMELINE.metro[0], TIMELINE.change[0] + 0.02, TIMELINE.change[0] + 0.07]}>
        <g transform="translate(-34 -9.6) scale(0.64)">
          <MetroCar />
          <g transform="translate(50 0)">
            <MetroCar front />
          </g>
          <rect x={47} y={12} width={6} height={8} rx={2} fill={art.lavenderDeep} />
        </g>
      </Rider>
      <Rider route={BUS} range={TIMELINE.bus} progress={progress} live={live} parked={0.42} fade={[TIMELINE.bus[0] - 0.02, 2, 3]}>
        <Bus x={-25} y={-14} scale={0.74} />
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

/** A small rounded label in the scene (hidden on narrow screens where it would be too small to read). */
function Chip({ x, y, label, accent = false }: { x: number; y: number; label: string; accent?: boolean }) {
  const w = label.length * 9.4 + 30;
  return (
    <g className="max-sm:hidden" aria-hidden>
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
function Rider({ route, range, progress, live, parked, fade, children }: { route: Route; range: readonly [number, number]; progress: MotionValue<number>; live: boolean; parked: number; fade: [number, number, number]; children: ReactNode }) {
  const ref = useRef<SVGGElement>(null);
  const opacity = useTransform(progress, [fade[0], fade[0] + 0.03, fade[1], fade[2]], [0, 1, 1, 0]);
  const tf = useCallback(
    (v: number) => {
      const share = live ? easeInOut(Math.min(1, Math.max(0, (v - range[0]) / (range[1] - range[0])))) : parked;
      const p = route.at(share);
      return `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.angle.toFixed(2)})`;
    },
    [live, parked, range, route],
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
