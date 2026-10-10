'use client';

import { motion } from 'framer-motion';
import { DrawPath, CALM } from '@/components/motion';
import { art, tint, shade, Train, Bus, BusStop, Viaduct, Road, SlimTree, Person, Pin, Node, Interchange, Building, Cloud } from './kit';
import { useStillMotion } from '../motion';

/*
 * Miniature artwork for the "Little things" rail. Each piece is a 280 × 200 vignette drawn on the card's own
 * tint, so the SVG has no background of its own. Route lines draw in once when the card scrolls into view;
 * with reduced motion every piece is a complete, still picture.
 */

const font = { fontFamily: "'Inter Variable', Inter, ui-sans-serif, sans-serif" };
const svgProps = { viewBox: '0 0 280 200', className: 'block h-auto w-full overflow-visible', 'aria-hidden': true } as const;

/** Card 1: two stations joined by one highlighted violet route over a quiet street plan. */
export function RouteArt() {
  const route = 'M44 150 H104 Q112 150 118 144 L164 98 Q170 92 178 92 H236';
  return (
    <svg {...svgProps}>
      {/* a quiet street plan */}
      {[
        [14, 18, 58, 46],
        [84, 18, 70, 34],
        [180, 14, 84, 52],
        [14, 82, 46, 40],
        [196, 116, 70, 62],
        [70, 168, 92, 26],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx={9} fill="#FFFFFF" opacity={0.55} />
      ))}
      <path d="M-6 64 C60 76 120 54 160 70 S240 108 290 96" stroke={art.water} strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.8} />
      {/* other lines, quietened */}
      <path d="M150 -4 V64 Q150 72 158 78 L196 112 V204" stroke={art.lavenderDeep} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M-4 118 H70 Q78 118 84 112 L128 68 H290" stroke={art.lavenderDeep} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
      <circle cx={196} cy={112} r={4} fill="#FFFFFF" stroke={art.lavenderDeep} strokeWidth={2.4} />
      <circle cx={84} cy={112} r={4} fill="#FFFFFF" stroke={art.lavenderDeep} strokeWidth={2.4} />
      {/* the route */}
      <DrawPath d={route} stroke={art.violetSoft} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} duration={1.8} />
      <DrawPath d={route} stroke={art.violet} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" duration={1.8} />
      <Node x={78} y={150} r={4} />
      <Node x={141} y={121} r={4} />
      <Node x={206} y={92} r={4} />
      {/* from */}
      <circle cx={44} cy={150} r={13} fill={art.violet} opacity={0.14} />
      <Node x={44} y={150} r={6.5} filled />
      <circle cx={44} cy={150} r={2.4} fill="#FFFFFF" />
      {/* to */}
      <Interchange x={236} y={92} r={6.5} />
      <Pin x={236} y={80} s={1.15} color={art.coralDeep} />
      <g style={font}>
        <rect x={20} y={164} width={52} height={22} rx={11} fill="#FFFFFF" />
        <text x={46} y={179} textAnchor="middle" fontSize={11} fontWeight={600} fill={art.ink}>
          From
        </text>
        <rect x={214} y={102} width={44} height={22} rx={11} fill={art.ink} />
        <text x={236} y={117} textAnchor="middle" fontSize={11} fontWeight={600} fill="#FFFFFF">
          To
        </text>
      </g>
    </svg>
  );
}

/** Card 2: a metro entrance pavilion with an escalator inside, a gate-number totem and a way-finding sign. */
export function EntranceArt() {
  const ground = 172;
  return (
    <svg {...svgProps}>
      <circle cx={232} cy={34} r={18} fill={art.sunGlow} />
      <circle cx={232} cy={34} r={10} fill={art.sun} opacity={0.85} />
      {/* the city behind */}
      <Cloud x={24} y={22} s={0.8} />
      <Building x={8} y={ground} w={46} h={92} fill={art.sageMid} seed={3} lit={0} />
      <Building x={186} y={ground} w={40} h={118} fill={art.sageMid} seed={5} lit={0} roof="tank" />
      <Building x={238} y={ground} w={50} h={74} fill={tint(art.sageMid, 0.25)} seed={7} lit={0} />
      {/* pavement */}
      <rect x={-10} y={ground} width={300} height={40} fill={art.sageMid} />
      <rect x={-10} y={ground - 1} width={300} height={3} fill="#FFFFFF" opacity={0.6} />
      {/* pavilion */}
      <path d={`M78 ${ground} V100 H194 V${ground} Z`} fill="#D8E6F3" />
      <path d={`M78 100 H194`} stroke="#FFFFFF" strokeWidth={2} />
      {[107, 136, 165].map((x) => (
        <rect key={x} x={x} y={100} width={1.6} height={ground - 100} fill="#FFFFFF" opacity={0.75} />
      ))}
      {/* escalator inside */}
      <path d={`M92 ${ground} L170 112 H190 V${ground} Z`} fill={art.lavenderMid} opacity={0.9} />
      <path d={`M92 ${ground} L170 112`} stroke={art.lavenderDeep} strokeWidth={6} strokeLinecap="round" />
      {Array.from({ length: 8 }, (_, i) => {
        const t = (i + 0.5) / 8;
        const x = 92 + 78 * t;
        const y = ground - 60 * t;
        return <path key={i} d={`M${x} ${y} h7`} stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={0.9} />;
      })}
      <DrawPath d={`M88 ${ground - 18} L168 ${112 - 16} H184`} stroke={art.inkSoft} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" duration={1.4} delay={0.2} />
      {/* roof */}
      <path d="M68 102 Q136 76 204 102 Z" fill={art.violet} />
      <rect x={70} y={100} width={132} height={5} rx={2} fill={art.violetSoft} />
      {/* station roundel */}
      <circle cx={136} cy={74} r={10} fill="#FFFFFF" stroke={art.violet} strokeWidth={2.4} />
      <path d="M131.6 78 V70 L136 74.5 L140.4 70 V78" stroke={art.violet} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* gate totem */}
      <rect x={228} y={92} width={2.4} height={ground - 92} fill={art.inkSoft} />
      <rect x={210} y={66} width={39} height={52} rx={9} fill={art.ink} />
      <g style={font}>
        <text x={229.5} y={80} textAnchor="middle" fontSize={8.5} fontWeight={700} letterSpacing={1.4} fill={tint(art.sun, 0.2)}>
          GATE
        </text>
        <text x={229.5} y={109} textAnchor="middle" fontSize={27} fontWeight={700} fill="#FFFFFF">
          2
        </text>
      </g>
      {/* way-finding sign */}
      <rect x={34} y={104} width={2.4} height={ground - 104} fill={art.inkSoft} />
      <path d="M14 86 H52 L60 96 L52 106 H14 Z" fill="#FFFFFF" />
      <g style={font}>
        <text x={19} y={100} fontSize={10.5} fontWeight={700} fill={art.ink}>
          Exit
        </text>
      </g>
      <DrawPath d="M42 96 H52 M48 92 L52 96 L48 100" stroke={art.violet} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" duration={0.9} delay={0.9} />
      <SlimTree x={266} y={ground} h={46} fill={art.leafDeep} />
      <Person x={62} y={ground} s={1.25} color={art.ink} bag={art.coral} step={1} />
    </svg>
  );
}

/** Card 3: a metro pulls into an elevated interchange while a city bus waits at the stop below. */
export function InterchangeArt() {
  const reduced = useStillMotion();
  const ground = 162;
  const walk = 'M168 96 V132 Q168 150 150 150 H112';
  return (
    <svg {...svgProps}>
      <defs>
        <mask id="ct-walk-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={280} height={200}>
          <DrawPath d={walk} stroke="#FFFFFF" strokeWidth={8} fill="none" strokeLinecap="round" duration={1.4} delay={1.6} />
        </mask>
      </defs>
      <circle cx={40} cy={34} r={20} fill={art.sunGlow} />
      <circle cx={40} cy={34} r={11} fill={art.sun} opacity={0.85} />
      <Building x={20} y={ground} w={44} h={70} fill={tint(art.coral, 0.55)} seed={2} lit={0} roof="slant" />
      <Building x={236} y={ground} w={48} h={96} fill={tint(art.coral, 0.6)} seed={4} lit={0} />
      {/* station canopy over the viaduct */}
      <path d="M108 52 Q184 26 260 52 V57 H108 Z" fill={art.coralDeep} />
      <rect x={114} y={57} width={2.4} height={30} fill={art.inkSoft} opacity={0.45} />
      <rect x={252} y={57} width={2.4} height={30} fill={art.inkSoft} opacity={0.45} />
      <Viaduct x1={-10} x2={290} y={88} ground={ground} pier={108} deck={art.stone} dark={art.stoneDeep} rail={art.violetSoft} />
      <motion.g
        initial={{ x: -90, opacity: 0.4 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={reduced ? { duration: 0 } : { duration: 3.4, ease: CALM, delay: 0.2 }}
      >
        <Train x={116} y={62} scale={0.88} />
      </motion.g>
      {/* stair tower down to the street */}
      <rect x={158} y={95} width={22} height={ground - 95} rx={3} fill={tint(art.coral, 0.35)} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M162 ${106 + i * 14} h14`} stroke={art.coralDeep} strokeWidth={2} strokeLinecap="round" opacity={0.55} />
      ))}
      <Road x1={-10} x2={290} y={ground} h={22} />
      <rect x={-10} y={ground + 22} width={300} height={20} fill={art.stone} />
      {/* walk link */}
      <path d={walk} stroke={art.violet} strokeWidth={3.2} strokeDasharray="0.5 7" strokeLinecap="round" fill="none" mask="url(#ct-walk-mask)" />
      <circle cx={168} cy={96} r={4.4} fill="#FFFFFF" stroke={art.violet} strokeWidth={2.4} />
      <Bus x={22} y={ground - 31} scale={1} />
      <BusStop x={104} y={ground - 1} />
      <Person x={138} y={ground - 1} s={1} color={art.ink} bag={art.violetSoft} step={1} />
    </svg>
  );
}

/** Card 4: a folded network map with a saved route card tucked on top. */
export function SavedArt() {
  // a map folded into four panels; every second panel sits in shadow and the crease points zig-zag
  const xs = [26, 76, 126, 176, 226];
  const top = [36, 26, 36, 26, 36];
  const bot = [150, 160, 150, 160, 150];
  const yAt = (arr: number[], x: number) => {
    const i = Math.min(3, Math.max(0, Math.floor((x - 26) / 50)));
    const t = (x - xs[i]) / 50;
    return arr[i] + (arr[i + 1] - arr[i]) * t;
  };
  // a line drawn on the flat map, mapped onto the folded panels: v is 0..1 down the sheet
  const fold = (pts: [number, number][]) => pts.map(([x, v], i) => `${i ? 'L' : 'M'}${x} ${(yAt(top, x) + (yAt(bot, x) - yAt(top, x)) * v).toFixed(1)}`).join(' ');
  const xsDense = (a: number, b: number, v: (x: number) => number) => {
    const out: [number, number][] = [];
    for (const x of [a, ...xs.filter((k) => k > a && k < b), b]) out.push([x, v(x)]);
    return out;
  };
  return (
    <svg {...svgProps}>
      <ellipse cx={128} cy={168} rx={104} ry={8} fill={art.stoneDeep} opacity={0.45} />
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M${xs[i]} ${top[i]} L${xs[i + 1]} ${top[i + 1]} L${xs[i + 1]} ${bot[i + 1]} L${xs[i]} ${bot[i]} Z`}
          fill={i % 2 ? art.lavender : '#FFFFFF'}
        />
      ))}
      {/* river */}
      <path d={fold(xsDense(26, 226, (x) => 0.55 + Math.sin(x / 30) * 0.08))} stroke={art.water} strokeWidth={7} fill="none" strokeLinecap="round" />
      {/* lines on the map */}
      <DrawPath d={fold(xsDense(26, 226, () => 0.38))} stroke={art.busBlue} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" duration={1.4} />
      <DrawPath d={`M118 ${yAt(top, 118) + 4} L118 ${yAt(bot, 118) - 4}`} stroke={art.metroRed} strokeWidth={3.2} fill="none" strokeLinecap="round" duration={1.2} delay={0.2} />
      <DrawPath d={fold(xsDense(118, 200, (x) => 0.2 - (x - 118) * 0.0012))} stroke={art.violet} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" duration={1.2} delay={0.4} />
      <circle cx={118} cy={yAt(top, 118) + (yAt(bot, 118) - yAt(top, 118)) * 0.38} r={4.4} fill="#FFFFFF" stroke={art.ink} strokeWidth={2} />
      {/* crease shading */}
      {[1, 3].map((i) => (
        <path key={i} d={`M${xs[i]} ${top[i]} L${xs[i] + 10} ${top[i] + 2} L${xs[i] + 10} ${bot[i] - 2} L${xs[i]} ${bot[i]} Z`} fill={shade(art.lavender, 0.06)} opacity={0.6} />
      ))}
      {/* saved route card */}
      <g transform="translate(140 92) rotate(-4)">
        <rect x={0} y={0} width={124} height={74} rx={14} fill={shade('#FFFFFF', 0.06)} transform="translate(2 5)" opacity={0.45} />
        <rect x={0} y={0} width={124} height={74} rx={14} fill="#FFFFFF" />
        <path d="M14 14 h12 v16 l-6 -4.4 l-6 4.4 Z" fill={art.violet} />
        <g style={font}>
          <text x={34} y={25} fontSize={11} fontWeight={700} fill={art.ink}>
            Home → Work
          </text>
        </g>
        <path d="M18 50 H104" stroke={art.violetSoft} strokeWidth={4} strokeLinecap="round" />
        <circle cx={18} cy={50} r={5} fill={art.violet} />
        <circle cx={61} cy={50} r={3.6} fill="#FFFFFF" stroke={art.violet} strokeWidth={2} />
        <circle cx={104} cy={50} r={5} fill="#FFFFFF" stroke={art.violet} strokeWidth={2.4} />
        <rect x={14} y={60} width={44} height={4} rx={2} fill={art.lavenderMid} />
      </g>
    </svg>
  );
}
