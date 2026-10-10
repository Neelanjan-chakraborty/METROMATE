'use client';

import { motion } from 'framer-motion';
import { art, Building, Bus, BusStop, DomeHall, Interchange, Road, SlimTree, tint, Train, Tree, Viaduct } from './kit';
import { useStillMotion } from '../motion';

/*
 * A small evening city for the dark closing section: muted lavender towers with a few warm windows, a violet
 * metro on its viaduct and a blue bus on the street below, joined at one interchange. The vehicles drift
 * slowly across (linear loops, 26–34 s per pass); with reduced motion they stand still at the station.
 * Purely decorative.
 */

const W = 1440;
const H = 300;
const GROUND = 266;
const DECK = 196;

const dusk = {
  far: '#3A3448',
  farDeep: '#332E40',
  mid: '#4A4360',
  midDeep: '#433C57',
  near: '#575073',
  deck: '#5B5478',
  deckDark: '#463F60',
  leaf: '#4E6A5B',
  leafDeep: '#3F584B',
};

const FAR = [
  [20, 54, 112], [96, 42, 158], [196, 48, 132], [262, 60, 176], [380, 46, 120], [462, 60, 196], [590, 44, 140],
  [700, 56, 186], [790, 42, 116], [950, 58, 204], [1040, 44, 128], [1130, 60, 170], [1250, 46, 188], [1330, 58, 124],
] as const;

const MID = [
  [52, 60, 118], [150, 48, 92], [316, 66, 104], [520, 52, 128], [640, 44, 86], [1000, 62, 112], [1180, 54, 96], [1380, 60, 110],
] as const;

export function MiniCity({ className = '' }: { className?: string }) {
  const reduced = useStillMotion();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="mc-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#292524" stopOpacity={0} />
          <stop offset="1" stopColor="#3B3550" stopOpacity={0.9} />
        </linearGradient>
      </defs>
      <rect x={0} y={60} width={W} height={H - 60} fill="url(#mc-glow)" />
      {/* a low warm moon */}
      <circle cx={1180} cy={70} r={13} fill={art.peach} opacity={0.8} />

      {/* far skyline */}
      <g opacity={0.6}>
        {FAR.map(([x, w, h], i) => (
          <Building key={x} x={x} y={GROUND} w={w} h={h} fill={i % 3 === 1 ? dusk.farDeep : dusk.far} seed={i + 2} lit={0.05} roof={i % 4 === 0 ? 'tank' : i % 5 === 2 ? 'slant' : 'flat'} />
        ))}
      </g>

      {/* mid-rise layer, behind the viaduct */}
      {MID.map(([x, w, h], i) => (
        <Building key={x} x={x} y={GROUND} w={w} h={h} fill={i % 2 ? dusk.midDeep : dusk.mid} seed={i + 40} lit={0.12} roof={i % 3 === 0 ? 'tank' : 'flat'} />
      ))}
      <DomeHall x={720} y={GROUND} w={96} fill={dusk.mid} accent={dusk.near} />

      {/* viaduct with the violet line */}
      <Viaduct x1={-20} x2={W + 20} y={DECK} ground={GROUND} pier={96} deck={dusk.deck} dark={dusk.deckDark} rail={art.violetMid} />
      <rect x={-20} y={DECK - 1.2} width={W + 40} height={2.6} fill={art.violet} />
      {/* the interchange: a stop on each line, joined by the short walk between them */}
      <Interchange x={870} y={DECK} r={6} />

      {/* the metro */}
      <motion.g
        initial={false}
        animate={reduced ? { x: 640 } : { x: [-260, W + 60] }}
        transition={reduced ? { duration: 0 } : { duration: 34, repeat: Infinity, ease: 'linear' }}
      >
        <Train x={0} y={DECK - 30} scale={1} />
      </motion.g>

      {/* station: an interchange where the bus line meets the metro */}
      <rect x={826} y={DECK + 8} width={88} height={GROUND - DECK - 8} rx={3} fill={dusk.near} />
      <rect x={836} y={DECK + 20} width={68} height={22} rx={2} fill={art.window} opacity={0.75} />
      <path d={`M870 ${DECK + 46} V${GROUND - 8}`} stroke={art.violetSoft} strokeWidth={2} strokeDasharray="0.1 6" strokeLinecap="round" />

      {/* trees */}
      {[40, 240, 470, 990, 1220, 1400].map((x, i) =>
        i % 2 ? <SlimTree key={x} x={x} y={GROUND} h={30} fill={dusk.leaf} /> : <Tree key={x} x={x} y={GROUND} r={10} a={dusk.leaf} b={dusk.leafDeep} />,
      )}

      {/* street with the blue bus line */}
      <Road x1={0} x2={W} y={GROUND} h={22} />
      <rect x={0} y={GROUND - 1.8} width={W} height={2.4} fill={art.busBlue} opacity={0.85} />
      <BusStop x={940} y={GROUND - 2} />
      <circle cx={870} cy={GROUND - 0.6} r={5} fill="#FFFFFF" stroke={art.busBlue} strokeWidth={2.6} />
      <motion.g
        initial={false}
        animate={reduced ? { x: 960 } : { x: [W + 40, -120] }}
        transition={reduced ? { duration: 0 } : { duration: 26, repeat: Infinity, ease: 'linear', delay: 3 }}
      >
        <g transform={`translate(0 ${GROUND - 26}) scale(-1 1)`}>
          <Bus x={-68} y={0} scale={1} />
        </g>
      </motion.g>
      <rect x={0} y={GROUND + 22} width={W} height={H - GROUND - 22} fill={tint('#292524', 0.02)} />
    </svg>
  );
}
