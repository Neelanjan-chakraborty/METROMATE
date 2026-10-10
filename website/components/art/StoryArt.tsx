'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { DrawPath } from '@/components/motion';
import { art, tint, shade, Building, DomeHall, Tree, SlimTree, Cloud, Sun, Train, BusStop, Road, Person, Node, Interchange, NoSignal, Lamp } from './kit';

/*
 * Large illustrations for the "Built around the way you move" stories. Each is a single lightweight SVG drawn
 * in the shared kit's palette. Looping motion (a floating card, a lift, a train gliding along) only mounts while
 * the picture is on screen, and none of it runs with reduced motion: then each one is a complete still scene.
 */

const font = { fontFamily: "'Inter Variable', Inter, ui-sans-serif, sans-serif" };

/** True while the illustration is in view and the visitor has not asked for reduced motion. */
function useLive() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { margin: '0px 0px -10% 0px' });
  const reduced = useReducedMotion();
  return [ref, inView && !reduced] as const;
}

/** A gentle ±px bob, only while live. */
function Float({ live, children, amp = 6, duration = 7, delay = 0 }: { live: boolean; children: ReactNode; amp?: number; duration?: number; delay?: number }) {
  return (
    <motion.g animate={live ? { y: [0, -amp, 0, amp * 0.5, 0] } : { y: 0 }} transition={live ? { duration, delay, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 }}>
      {children}
    </motion.g>
  );
}

function Tag({ x, y, children, dark, w, anchor = 'start' }: { x: number; y: number; children: string; dark?: boolean; w: number; anchor?: 'start' | 'middle' }) {
  const left = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g style={font}>
      <rect x={left} y={y} width={w} height={28} rx={14} fill={dark ? art.ink : '#FFFFFF'} stroke={dark ? 'none' : art.lavenderMid} />
      <text x={left + w / 2} y={y + 18.5} textAnchor="middle" fontSize={14} fontWeight={600} fill={dark ? '#FFFFFF' : art.ink}>
        {children}
      </text>
    </g>
  );
}

// ------------------------------------------------------------------------------------------- A. the network

/** A transit map card floating over a pale skyline: N–S red line, E–W blue line, the short violet GIFT City branch. */
export function NetworkMapArt() {
  const [ref, live] = useLive();
  const ground = 452;
  const red = 'M206 314 V214 V170 L246 130 V64 L222 40';
  const blue = 'M30 240 H120 L146 214 H330 L360 244 H414';
  const violet = 'M246 92 H300 L330 122 H372';
  const route = 'M80 240 H120 L146 214 H206 V170 L246 130 V92 H300 L330 122 H372';
  return (
    <svg ref={ref} viewBox="0 0 600 480" className="block h-auto w-full" role="img" aria-label="Illustration: a network map floating over the city, with the north–south line, the east–west line crossing it at Old High Court, and the GIFT City branch leaving from GNLU, one journey highlighted across all three.">
      <defs>
        <linearGradient id="nm-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.14" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.86" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <mask id="nm-city" maskUnits="userSpaceOnUse" x={0} y={0} width={600} height={480}>
          <rect x={0} y={0} width={600} height={480} fill="url(#nm-fade)" />
        </mask>
      </defs>
      <Sun x={540} y={40} r={16} />
      <Cloud x={24} y={70} s={1.1} />
      <Cloud x={500} y={170} s={0.8} opacity={0.8} />
      {/* pale city */}
      <g mask="url(#nm-city)">
        <Building x={18} y={ground} w={54} h={150} fill={art.lavenderMid} seed={11} lit={0.06} roof="tank" />
        <Building x={76} y={ground} w={40} h={96} fill={tint(art.lavenderDeep, 0.3)} seed={12} lit={0.05} />
        <DomeHall x={120} y={ground} w={84} fill={art.lavenderMid} accent={art.lavenderDeep} />
        <Building x={214} y={ground} w={46} h={128} fill={tint(art.lavenderDeep, 0.25)} seed={13} lit={0.05} roof="slant" />
        <Building x={340} y={ground} w={48} h={170} fill={art.lavenderMid} seed={14} lit={0.06} />
        <Building x={394} y={ground} w={58} h={112} fill={tint(art.lavenderDeep, 0.3)} seed={15} lit={0.05} roof="tank" />
        <Building x={458} y={ground} w={44} h={144} fill={art.lavenderMid} seed={16} lit={0.05} roof="dome" />
        <Building x={508} y={ground} w={74} h={88} fill={tint(art.lavenderDeep, 0.3)} seed={17} lit={0.05} />
        {[10, 110, 300, 330, 590].map((x, i) => (
          <Tree key={x} x={x} y={ground} r={i % 2 ? 11 : 14} a={art.sageMid} b={art.leaf} />
        ))}
        <rect x={0} y={ground} width={600} height={4} rx={2} fill={art.sageMid} />
      </g>
      <Float live={live} amp={6} duration={8}>
        <g transform="translate(80 52) rotate(-3 220 165)">
          <rect x={4} y={10} width={440} height={330} rx={26} fill={art.shadow} opacity={0.6} />
          <rect x={0} y={0} width={440} height={330} rx={26} fill="#FFFFFF" />
          {/* faint grid */}
          <path d="M0 110 H440 M0 220 H440 M110 0 V330 M330 0 V330" stroke={art.lavender} strokeWidth={1.4} />
          <path d="M186 0 C176 80 222 140 200 200 S236 280 226 330" stroke={art.water} strokeWidth={16} fill="none" opacity={0.75} />
          <g style={font}>
            <text x={24} y={36} fontSize={13} fontWeight={700} letterSpacing={1.6} fill={art.inkSoft}>
              AHMEDABAD · GANDHINAGAR
            </text>
          </g>
          {/* lines */}
          <DrawPath d={blue} stroke={art.busBlue} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" duration={1.6} />
          <DrawPath d={red} stroke={art.metroRed} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" duration={1.8} delay={0.15} />
          <DrawPath d={violet} stroke={art.violet} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" duration={1.1} delay={0.6} />
          {/* the highlighted journey */}
          <DrawPath d={route} stroke={art.violetSoft} strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.55} duration={2.4} delay={1.2} />
          {/* stations */}
          {[290, 266, 242, 190].map((y) => (
            <Node key={y} x={206} y={y} r={4.2} color={art.metroRed} />
          ))}
          <Node x={226} y={150} r={4.2} color={art.metroRed} />
          <Node x={246} y={112} r={4.2} color={art.metroRed} />
          <Node x={246} y={72} r={4.2} color={art.metroRed} />
          <Node x={206} y={314} r={5} color={art.metroRed} filled />
          <Node x={222} y={40} r={5} color={art.metroRed} filled />
          {[56, 86, 166, 238, 268, 298].map((x) => (
            <Node key={x} x={x} y={x < 120 ? 240 : 214} r={4.2} color={art.busBlue} />
          ))}
          <Node x={388} y={244} r={4.2} color={art.busBlue} />
          <Node x={30} y={240} r={5} color={art.busBlue} filled />
          <Node x={414} y={244} r={5} color={art.busBlue} filled />
          <Node x={316} y={108} r={4.2} />
          <Node x={372} y={122} r={5} filled />
          <Interchange x={206} y={214} r={7.5} />
          <Interchange x={246} y={92} r={7.5} />
          {/* journey ends */}
          <circle cx={80} cy={240} r={8} fill={art.violet} />
          <circle cx={80} cy={240} r={3} fill="#FFFFFF" />
          <Tag x={86} y={174} w={112}>
            Old High Court
          </Tag>
          <Tag x={260} y={52} w={60} dark>
            GNLU
          </Tag>
          {/* legend */}
          <g style={font} fontSize={12.5} fontWeight={600} fill={art.inkSoft}>
            {[
              ['North–South', art.metroRed],
              ['East–West', art.busBlue],
              ['GIFT City', art.violet],
            ].map(([label, c], i) => (
              <g key={label} transform={`translate(26 ${276 + i * 20})`}>
                <rect x={0} y={-5} width={18} height={6} rx={3} fill={c} />
                <text x={24} y={1}>
                  {label}
                </text>
              </g>
            ))}
          </g>
        </g>
      </Float>
    </svg>
  );
}

// -------------------------------------------------------------------------------------- B. station cutaway

/** A layered cutaway of an elevated station: street, gates, concourse with fare gates, stairs, lift, platform. */
export function StationCutawayArt() {
  const [ref, live] = useLive();
  const ground = 430;
  const path = 'M58 424 L134 342 H244 H360 L392 330 L448 230 H470';
  return (
    <svg ref={ref} viewBox="0 0 600 500" className="block h-auto w-full" role="img" aria-label="Illustration: a cutaway of an elevated metro station. Gate 1 stairs and the Gate 2 lift lead up from the street to the ticketing level with its fare gates, then on to the platform where a train waits. A bus stop and trees line the street.">
      <Cloud x={40} y={30} s={0.9} />
      <Cloud x={470} y={18} s={0.7} opacity={0.8} />
      {/* street */}
      <SlimTree x={584} y={ground} h={58} />
      <Road x1={0} x2={600} y={ground + 14} h={30} />
      <rect x={0} y={ground} width={600} height={14} fill={art.stone} />
      <rect x={0} y={ground + 44} width={600} height={40} fill={art.stone} />
      {/* columns under the station */}
      {[168, 300, 432].map((x) => (
        <path key={x} d={`M${x - 10} 352 H${x + 10} L${x + 12} ${ground} H${x - 12} Z`} fill={art.lavenderDeep} />
      ))}
      {/* roof */}
      <path d="M96 104 Q300 42 504 104 Z" fill={art.violet} />
      <path d="M96 104 Q300 42 504 104" fill="none" stroke={art.violetMid} strokeWidth={3} />
      <rect x={100} y={104} width={400} height={8} fill={art.violetSoft} />
      {/* platform level */}
      <rect x={110} y={112} width={380} height={112} fill={art.lavender} />
      <rect x={110} y={112} width={380} height={112} fill="url(#sc-light)" />
      <defs>
        <linearGradient id="sc-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.g animate={live ? { x: [0, 3, 0] } : { x: 0 }} transition={live ? { duration: 9, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}>
        <Train x={128} y={168} scale={1.7} />
      </motion.g>
      <rect x={110} y={222} width={380} height={4} fill={art.sun} />
      <rect x={110} y={226} width={380} height={12} fill={art.stoneDeep} />
      {/* platform sign */}
      <rect x={196} y={124} width={2} height={14} fill={art.inkSoft} />
      <rect x={296} y={124} width={2} height={14} fill={art.inkSoft} />
      <rect x={180} y={136} width={134} height={20} rx={5} fill={art.ink} />
      <g style={font}>
        <text x={247} y={150} textAnchor="middle" fontSize={11} fontWeight={700} letterSpacing={1.2} fill="#FFFFFF">
          PLATFORM 1
        </text>
      </g>
      {/* concourse level */}
      <rect x={110} y={238} width={380} height={104} fill="#FFFFFF" />
      <rect x={110} y={238} width={380} height={30} fill={art.lavender} opacity={0.55} />
      <rect x={100} y={342} width={400} height={12} fill={art.stoneDeep} />
      {/* ticket machine */}
      <rect x={150} y={282} width={30} height={60} rx={5} fill={art.lavenderDeep} />
      <rect x={155} y={288} width={20} height={16} rx={3} fill={art.glass} />
      <rect x={158} y={312} width={14} height={3} rx={1.5} fill={art.sun} />
      {/* fare gates */}
      {[0, 1, 2, 3].map((i) => {
        const x = 240 + i * 32;
        return (
          <g key={i}>
            <rect x={x} y={304} width={14} height={38} rx={4} fill={art.inkSoft} />
            <rect x={x + 2.5} y={300} width={9} height={6} rx={3} fill={i === 1 ? art.leafDeep : art.violetMid} />
            {i < 3 ? <path d={`M${x + 14} 320 h8 M${x + 18} 320 v-2`} stroke={art.violetSoft} strokeWidth={4} strokeLinecap="round" /> : null}
          </g>
        );
      })}
      {/* stairs up to the platform */}
      <path d="M380 342 L452 238 H476 V342 Z" fill={art.lavenderMid} />
      {Array.from({ length: 9 }, (_, i) => {
        const t = (i + 0.5) / 9;
        return <path key={i} d={`M${380 + 72 * t} ${342 - 104 * t} h10`} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />;
      })}
      <path d="M380 324 L452 220" stroke={art.inkSoft} strokeWidth={2.4} strokeLinecap="round" />
      {/* Gate 1 stairs from the street */}
      <path d={`M40 ${ground} L118 346 H140 V${ground} Z`} fill={tint(art.violetSoft, 0.35)} />
      {Array.from({ length: 8 }, (_, i) => {
        const t = (i + 0.5) / 8;
        return <path key={i} d={`M${40 + 78 * t} ${ground - 84 * t} h12`} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />;
      })}
      <path d={`M44 ${ground - 18} L122 328`} stroke={art.inkSoft} strokeWidth={2.4} strokeLinecap="round" />
      {/* lift shaft */}
      <rect x={502} y={112} width={44} height={ground - 112} rx={4} fill="#D8E6F3" />
      <rect x={502} y={112} width={44} height={ground - 112} rx={4} fill="none" stroke="#FFFFFF" strokeWidth={2} />
      <rect x={523} y={112} width={2} height={ground - 112} fill="#FFFFFF" opacity={0.8} />
      <motion.g animate={live ? { y: [0, -96, -96, -206, -206, 0, 0] } : { y: 0 }} transition={live ? { duration: 22, times: [0, 0.14, 0.36, 0.5, 0.72, 0.86, 1], repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}>
        <rect x={507} y={ground - 46} width={34} height={44} rx={4} fill={art.violet} />
        <rect x={512} y={ground - 40} width={24} height={20} rx={2} fill={art.window} opacity={0.9} />
      </motion.g>
      {/* gate signs */}
      <rect x={20} y={ground - 92} width={2} height={92} fill={art.inkSoft} />
      <rect x={4} y={ground - 120} width={64} height={28} rx={8} fill={art.ink} />
      <rect x={474} y={ground - 46} width={2} height={46} fill={art.inkSoft} />
      <rect x={442} y={ground - 74} width={64} height={28} rx={8} fill={art.ink} />
      <g style={font} fontSize={14} fontWeight={700} fill="#FFFFFF" textAnchor="middle">
        <text x={36} y={ground - 101}>
          Gate 1
        </text>
        <text x={474} y={ground - 55}>
          Gate 2
        </text>
      </g>
      {/* the way through, drawn */}
      <DrawPath d={path} stroke={art.violet} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.9} duration={2.6} delay={0.3} />
      <circle cx={470} cy={230} r={6} fill={art.violet} />
      <circle cx={470} cy={230} r={2.2} fill="#FFFFFF" />
      {/* people */}
      <Person x={208} y={342} s={1.2} color={art.ink} bag={art.coral} step={1} />
      <Person x={410} y={222} s={1.15} color={art.inkSoft} />
      <Person x={250} y={ground} s={1.2} color={art.inkSoft} bag={art.sun} />
      <BusStop x={330} y={ground} />
      <Lamp x={380} y={ground} h={40} />
      {/* labels */}
      <Tag x={204} y={258} w={98}>
        Fare gates
      </Tag>
      <Tag x={524} y={54} w={60} anchor="middle">
        Lift
      </Tag>
      <path d="M524 82 V108" stroke={art.inkSoft} strokeWidth={1.6} strokeDasharray="2 4" strokeLinecap="round" />
      <Tag x={330} y={ground - 70} w={86} anchor="middle">
        Bus stop
      </Tag>
    </svg>
  );
}

// ----------------------------------------------------------------------------------- C. metro meets bus

/** A plan view: the violet metro line, a dashed walk link at the highlighted change point, then the blue bus route. */
export function ConnectionArt() {
  const [ref, live] = useLive();
  const metro = 'M-10 110 H200 Q222 110 238 126 L282 170 Q306 194 336 194 H610';
  const bus = 'M-10 404 H140 Q162 404 178 388 L240 326 Q256 310 280 310 H610';
  const walk = 'M404 204 C404 250 432 258 432 298';
  const chevron = (x: number, y: number, rot = 0, key?: string) => (
    <path key={key} d="M-3 -5 L3 0 L-3 5" transform={`translate(${x} ${y}) rotate(${rot})`} stroke="#FFFFFF" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  );
  return (
    <svg ref={ref} viewBox="0 0 600 470" className="block h-auto w-full" role="img" aria-label="Illustration: a violet metro line reaches a station, a short dashed walk leads to a nearby bus stop, and a blue bus route continues from there. Arrows show the direction of the journey.">
      <defs>
        <mask id="cn-walk" maskUnits="userSpaceOnUse" x={0} y={0} width={600} height={470}>
          <DrawPath d={walk} stroke="#FFFFFF" strokeWidth={14} fill="none" strokeLinecap="round" duration={1.2} delay={1.4} />
        </mask>
      </defs>
      {/* city blocks */}
      {[
        [24, 20, 150, 66],
        [222, 20, 160, 70],
        [420, 20, 156, 140],
        [24, 140, 150, 220],
        [300, 222, 80, 60],
        [470, 222, 106, 64],
        [24, 430, 120, 40],
        [300, 340, 276, 100],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx={16} fill="#FFFFFF" opacity={0.6} />
      ))}
      <rect x={196} y={156} width={66} height={130} rx={18} fill={art.sageMid} opacity={0.8} />
      <Tree x={218} y={226} r={10} />
      <Tree x={240} y={268} r={8} />
      <path d="M-10 300 C80 290 120 330 160 300" stroke={art.water} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.7} />
      {/* connection halo */}
      <circle cx={418} cy={250} r={86} fill={art.violet} opacity={0.07} />
      <circle cx={418} cy={250} r={56} fill={art.violet} opacity={0.07} />
      {/* bus route */}
      <path d={bus} stroke="#FFFFFF" strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <DrawPath d={bus} stroke={art.busBlue} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" duration={2} delay={0.8} />
      {/* metro line */}
      <path d={metro} stroke="#FFFFFF" strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <DrawPath d={metro} stroke={art.violet} strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" duration={2} />
      {/* direction arrows */}
      {[60, 150].map((x) => chevron(x, 110, 0, `m${x}`))}
      {chevron(260, 148, 45, 'md')}
      {[500, 570].map((x) => chevron(x, 194, 0, `m2${x}`))}
      {[60].map((x) => chevron(x, 404, 0, `b${x}`))}
      {chevron(209, 357, -45, 'bd')}
      {[500, 560].map((x) => chevron(x, 310, 0, `b2${x}`))}
      {/* moving vehicles (plan view) */}
      <motion.g
        animate={live ? { x: [0, 130], opacity: [0, 1, 1, 0] } : { x: 70, opacity: 1 }}
        transition={live ? { duration: 16, repeat: Infinity, ease: 'linear', opacity: { duration: 16, times: [0, 0.12, 0.85, 1], repeat: Infinity } } : { duration: 0 }}
      >
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <rect x={-4 + k * 28} y={102} width={25} height={16} rx={6} fill={shade(art.violet, 0.12)} stroke="#FFFFFF" strokeWidth={2} />
            <rect x={2 + k * 28} y={107.5} width={13} height={5} rx={2.5} fill={art.violetSoft} />
          </g>
        ))}
      </motion.g>
      <motion.g
        animate={live ? { x: [0, 90], opacity: [0, 1, 1, 0] } : { x: 30, opacity: 1 }}
        transition={live ? { duration: 14, delay: 3, repeat: Infinity, ease: 'linear', opacity: { duration: 14, delay: 3, times: [0, 0.15, 0.85, 1], repeat: Infinity } } : { duration: 0 }}
      >
        <rect x={468} y={301} width={40} height={18} rx={6} fill={shade(art.busBlue, 0.15)} stroke="#FFFFFF" strokeWidth={2} />
        <rect x={474} y={306} width={22} height={8} rx={3} fill="#D6E8FF" />
      </motion.g>
      {/* walk link */}
      <path d={walk} stroke={art.ink} strokeWidth={4} strokeDasharray="0.5 9" strokeLinecap="round" fill="none" mask="url(#cn-walk)" />
      {/* metro station */}
      <rect x={378} y={182} width={52} height={24} rx={12} fill="#FFFFFF" stroke={art.ink} strokeWidth={4} />
      {/* bus stop */}
      <circle cx={432} cy={310} r={13} fill="#FFFFFF" stroke={art.ink} strokeWidth={4} />
      <circle cx={432} cy={310} r={4.5} fill={art.busBlue} />
      <g style={font}>
        <Tag x={404} y={140} w={78} anchor="middle" dark>
          Metro
        </Tag>
        <Tag x={432} y={336} w={92} anchor="middle" dark>
          Bus stop
        </Tag>
        <rect x={448} y={236} width={118} height={30} rx={15} fill={art.violet} />
        <text x={507} y={256} textAnchor="middle" fontSize={14} fontWeight={700} fill="#FFFFFF">
          Change here
        </text>
      </g>
      {/* legend */}
      <g style={font} fontSize={13} fontWeight={600} fill={art.inkSoft}>
        <rect x={34} y={436} width={22} height={7} rx={3.5} fill={art.violet} />
        <text x={62} y={443}>
          Metro
        </text>
        <rect x={120} y={436} width={22} height={7} rx={3.5} fill={art.busBlue} />
        <text x={148} y={443}>
          Bus
        </text>
        <path d="M196 439.5 H220" stroke={art.ink} strokeWidth={3.4} strokeDasharray="0.5 6" strokeLinecap="round" />
        <text x={228} y={443}>
          Walk
        </text>
      </g>
    </svg>
  );
}

// -------------------------------------------------------------------------------------------- D. offline

function SavedCard({ x, y, w, title, sub, accent, children }: { x: number; y: number; w: number; title: string; sub: string; accent: string; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={3} y={8} width={w} height={74} rx={18} fill={art.shadow} opacity={0.55} />
      <rect x={0} y={0} width={w} height={74} rx={18} fill="#FFFFFF" />
      <circle cx={30} cy={37} r={15} fill={tint(accent, 0.8)} />
      <circle cx={30} cy={37} r={6} fill={accent} />
      <g style={font}>
        <text x={56} y={33} fontSize={15} fontWeight={700} fill={art.ink}>
          {title}
        </text>
        <text x={56} y={53} fontSize={12.5} fontWeight={500} fill={art.inkSoft}>
          {sub}
        </text>
      </g>
      {children}
    </g>
  );
}

/** A phone holding saved routes and a compact map, surrounded by saved cards, with the signal gone. */
export function OfflineArt() {
  const [ref, live] = useLive();
  return (
    <svg ref={ref} viewBox="0 0 600 500" className="block h-auto w-full" role="img" aria-label="Illustration: a phone with saved quick routes and a compact network map, surrounded by saved station cards, while a crossed-out signal symbol shows there is no connection.">
      {/* phone */}
      <ellipse cx={300} cy={476} rx={110} ry={10} fill={art.shadow} opacity={0.6} />
      <rect x={206} y={34} width={188} height={430} rx={38} fill={art.ink} />
      <rect x={215} y={43} width={170} height={412} rx={30} fill={art.paper} />
      <rect x={272} y={53} width={56} height={14} rx={7} fill={art.ink} />
      <g style={font}>
        <text x={231} y={98} fontSize={18} fontWeight={700} fill={art.ink}>
          Saved
        </text>
        <rect x={304} y={82} width={66} height={22} rx={11} fill={art.sage} />
        <circle cx={316} cy={93} r={3.5} fill={art.leafDeep} />
        <text x={324} y={97.5} fontSize={11} fontWeight={600} fill={shade(art.leafDeep, 0.45)}>
          Offline
        </text>
      </g>
      {/* mini map */}
      <rect x={227} y={114} width={146} height={112} rx={16} fill={art.lavender} />
      <path d="M296 120 V218" stroke={art.metroRed} strokeWidth={4} strokeLinecap="round" />
      <path d="M233 176 H366" stroke={art.busBlue} strokeWidth={4} strokeLinecap="round" />
      <path d="M296 140 H330 L348 156" stroke={art.violet} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={296} cy={176} r={5} fill="#FFFFFF" stroke={art.ink} strokeWidth={2.4} />
      <circle cx={296} cy={140} r={5} fill="#FFFFFF" stroke={art.ink} strokeWidth={2.4} />
      {/* quick routes */}
      {[
        ['Home', art.coralDeep],
        ['Campus', art.leafDeep],
        ['Work', art.violet],
      ].map(([label, c], i) => (
        <g key={label} transform={`translate(227 ${242 + i * 56})`}>
          <rect x={0} y={0} width={146} height={46} rx={14} fill="#FFFFFF" stroke={art.lavenderMid} />
          <rect x={10} y={11} width={24} height={24} rx={8} fill={tint(c, 0.75)} />
          <circle cx={22} cy={23} r={5} fill={c} />
          <g style={font}>
            <text x={44} y={28} fontSize={13.5} fontWeight={700} fill={art.ink}>
              {label}
            </text>
          </g>
          <path d="M126 18 L132 23 L126 28" stroke={art.inkSoft} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      <rect x={270} y={438} width={60} height={5} rx={2.5} fill={art.ink} opacity={0.25} />
      {/* floating saved cards */}
      <Float live={live} duration={7.5}>
        <SavedCard x={24} y={92} w={206} title="Old High Court" sub="Interchange · saved" accent={art.violet} />
      </Float>
      <Float live={live} duration={8.5} delay={1.2}>
        <SavedCard x={8} y={300} w={204} title="Timetable" sub="Scheduled · on device" accent={art.busBlue} />
      </Float>
      <Float live={live} duration={9} delay={0.6}>
        <g transform="translate(404 270)">
          <rect x={4} y={10} width={172} height={128} rx={20} fill={art.shadow} opacity={0.55} />
          <rect x={0} y={0} width={172} height={128} rx={20} fill="#FFFFFF" />
          <path d="M57 0 V128 M115 0 V128" stroke={art.lavenderMid} strokeWidth={1.5} />
          <rect x={57} y={0} width={58} height={128} fill={art.lavender} opacity={0.6} />
          <DrawPath d="M86 14 V112" stroke={art.metroRed} strokeWidth={4} strokeLinecap="round" fill="none" duration={1.2} />
          <DrawPath d="M14 70 H158" stroke={art.busBlue} strokeWidth={4} strokeLinecap="round" fill="none" duration={1.2} delay={0.2} />
          <DrawPath d="M86 38 H124 L146 58" stroke={art.violet} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" duration={1} delay={0.5} />
          <circle cx={86} cy={70} r={5.5} fill="#FFFFFF" stroke={art.ink} strokeWidth={2.4} />
          <circle cx={86} cy={38} r={5.5} fill="#FFFFFF" stroke={art.ink} strokeWidth={2.4} />
        </g>
      </Float>
      <Float live={live} duration={6.5} delay={2}>
        <g>
          <circle cx={478} cy={142} r={54} fill="#FFFFFF" />
          <circle cx={478} cy={142} r={54} fill="none" stroke={art.lavenderMid} strokeWidth={2} />
          <NoSignal x={478} y={136} s={1.6} color={art.inkSoft} slash={art.coralDeep} />
        </g>
      </Float>
    </svg>
  );
}
