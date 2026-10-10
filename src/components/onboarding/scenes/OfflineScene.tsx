import React from 'react';
import { Circle, ClipPath, G, Path, Rect } from 'react-native-svg';
import Animated, { useAnimatedProps, useAnimatedStyle, useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { BusStopSign, Cloud, StationEntrance, Tree } from '../art/shapes';
import { Backdrop, Layer, NodeDot, RouteStroke, Sprite, useBoard, useLoopProgress, usePopFloat, useSceneClock, useSway } from '../motion/kit';
import { buildTrack, roundedPolyline, stage, stageOut, toPathD, type Pt } from '../motion/pathMath';
import { ob } from '../palette';
import type { SceneProps } from './types';

/*
 * Scene 4: a phone holding the stylised network map, with small scenes floating around it (a station
 * entrance, a bus stop, an interchange, a saved place) and a Wi-Fi mark that turns into "offline".
 * The map in the phone is a drawing of a generic network: no real stations or lines are named.
 */

const PHONE = { x: 100, y: 78, w: 160, h: 300 };
const SCR = { x: PHONE.x + 9, y: PHONE.y + 22, w: PHONE.w - 18, h: PHONE.h - 44 };

const LINE_A: Pt[] = roundedPolyline([[SCR.x + 14, SCR.y + 38], [SCR.x + 14, SCR.y + 96], [SCR.x + 60, SCR.y + 140], [SCR.x + 120, SCR.y + 140]], 18, 8);
const LINE_B: Pt[] = roundedPolyline([[SCR.x + 120, SCR.y + 24], [SCR.x + 120, SCR.y + 70], [SCR.x + 84, SCR.y + 104], [SCR.x + 30, SCR.y + 104]], 18, 8);
const LINE_BUS: Pt[] = roundedPolyline([[SCR.x + 36, SCR.y + 170], [SCR.x + 72, SCR.y + 150], [SCR.x + 100, SCR.y + 176], [SCR.x + 126, SCR.y + 160]], 12, 8);
const TA = buildTrack(LINE_A);
const TB = buildTrack(LINE_B);
const TC = buildTrack(LINE_BUS);
/** Stations on the phone's map: position, line colour, and when (on the map's build) each one lights. */
const NODES: [number, number, string, number][] = [
  [SCR.x + 14, SCR.y + 38, ob.violet, 0.12],
  [SCR.x + 14, SCR.y + 96, ob.violet, 0.36],
  [SCR.x + 120, SCR.y + 140, ob.violet, 0.66],
  [SCR.x + 120, SCR.y + 24, ob.red, 0.24],
  [SCR.x + 30, SCR.y + 104, ob.red, 0.8],
  [SCR.x + 100, SCR.y + 176, ob.blue, 0.86],
];

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** A map sheet folded in three panels; it unfolds and flies into the phone. */
function FoldedMap({ t }: { t: SharedValue<number> }) {
  const { scale } = useBoard();
  const style = useAnimatedStyle(() => {
    const s = stageOut(t.value, 0.0, 0.34);
    const out = 1 - stageOut(t.value, 0.34, 0.56);
    return { opacity: s * out, transform: [{ translateX: (1 - s) * -60 * scale + (1 - out) * 70 * scale }, { translateY: (1 - s) * 40 * scale - (1 - out) * 110 * scale }, { scale: 0.85 + 0.15 * s - (1 - out) * 0.5 }, { rotate: `${(1 - s) * -10 + (1 - out) * 6}deg` }] };
  });
  return (
    <Sprite x={-8} y={300} w={110} h={70} animated={style}>
      <G>
        <Path d="M4 14 L38 6 L38 62 L4 70 Z" fill="#FFFFFF" />
        <Path d="M38 6 L72 14 L72 70 L38 62 Z" fill="#F1EEFF" />
        <Path d="M72 14 L106 6 L106 62 L72 70 Z" fill="#FFFFFF" />
        <Path d="M10 40 L30 34 M46 24 L64 30 M80 44 L98 38" stroke={ob.violet} strokeWidth={3} strokeLinecap="round" />
        <Path d="M12 56 L32 50 M82 28 L100 22" stroke={ob.blue} strokeWidth={2.4} strokeLinecap="round" />
        <Circle cx={38} cy={34} r={3.4} fill="#FFFFFF" stroke={ob.indigo} strokeWidth={2} />
        <Circle cx={72} cy={44} r={3.4} fill="#FFFFFF" stroke={ob.indigo} strokeWidth={2} />
      </G>
    </Sprite>
  );
}

/** Wi-Fi mark that fades into the offline mark: arcs, a dot, then a slash through them. */
function Connectivity({ t, style }: { t: SharedValue<number>; style: object }) {
  const arcs = useAnimatedProps(() => ({ opacity: 1 - stageOut(t.value, 0.5, 0.64) * 0.55 }));
  const slash = useAnimatedProps(() => ({ strokeDashoffset: 34 * (1 - stageOut(t.value, 0.56, 0.7)) }));
  return (
    <Sprite x={246} y={34} w={80} h={64} animated={style}>
      <Rect x={2} y={2} width={76} height={56} rx={22} fill="#FFFFFF" stroke={ob.lavenderDeep} strokeWidth={1.2} />
      <AnimatedPath d="M20 28 a26 26 0 0 1 40 0 M27 35 a16 16 0 0 1 26 0 M34 42 a7 7 0 0 1 12 0" stroke={ob.indigo} strokeWidth={4} strokeLinecap="round" fill="none" animatedProps={arcs} />
      <Circle cx={40} cy={47} r={3.2} fill={ob.indigo} />
      <AnimatedPath d="M24 14 L56 48" stroke={ob.red} strokeWidth={4.4} strokeLinecap="round" strokeDasharray="40 40" animatedProps={slash} />
      <Circle cx={66} cy={50} r={9} fill={ob.mint} />
      <Path d="M62 50 l3 3 l6 -7" stroke="#FFFFFF" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Sprite>
  );
}

function MiniCard({ x, y, size = 64, bg, style, children }: { x: number; y: number; size?: number; bg: string; style: object; children: React.ReactNode }) {
  return (
    <Sprite x={x} y={y} w={size} h={size} animated={style}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill={bg} />
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="none" stroke="#FFFFFF" strokeWidth={3} />
      <ClipPath id={`mc-${x}-${y}`}>
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - 3} />
      </ClipPath>
      <G clipPath={`url(#mc-${x}-${y})`}>{children}</G>
    </Sprite>
  );
}

export function OfflineScene({ reduced }: SceneProps) {
  const { t, loop } = useSceneClock(reduced, 3000, 12000);
  const pulse = useLoopProgress(loop, 4);
  const mapFade = useDerivedValue<number>(() => stage(t.value, 0.3, 0.62));
  // the floating cards settle in one after another, then drift very gently, each on its own phase
  const cardA = usePopFloat(t, 0.28, 0.48, loop, 2, 0, 2);
  const cardB = usePopFloat(t, 0.36, 0.56, loop, 2, 0.33, 2);
  const cardC = usePopFloat(t, 0.44, 0.64, loop, 2, 0.66, 2);
  const cardD = usePopFloat(t, 0.52, 0.72, loop, 2, 0.5, 2);
  const wifi = usePopFloat(t, 0.36, 0.52, loop, 3, 0.15, 1.6);
  const sway = useSway(loop, 3, 0.2, 1.4);

  return (
    <>
      <Backdrop>
        <Rect x={-60} y={0} width={480} height={440} fill="#E9E7FF" />
        <Circle cx={180} cy={240} r={190} fill="#F1EEFF" />
        <Circle cx={180} cy={240} r={130} fill="#F6F4FF" />
        <Cloud x={-10} y={70} s={0.9} opacity={0.8} />
        <Cloud x={262} y={290} s={0.8} opacity={0.7} />
      </Backdrop>

      <Layer t={t} from={0.0} to={0.26} dy={12}>
        {/* phone body */}
        <Rect x={PHONE.x + 4} y={PHONE.y + 8} width={PHONE.w} height={PHONE.h} rx={30} fill={ob.violet} opacity={0.12} />
        <Rect x={PHONE.x} y={PHONE.y} width={PHONE.w} height={PHONE.h} rx={28} fill={ob.indigo} />
        <Rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} rx={18} fill="#FFFFFF" />
        <Rect x={PHONE.x + PHONE.w / 2 - 20} y={PHONE.y + 8} width={40} height={6} rx={3} fill="#4B4793" />
        {/* map background: soft blocks and a river */}
        <Rect x={SCR.x + 8} y={SCR.y + 8} width={SCR.w - 16} height={SCR.h - 70} rx={12} fill="#F1EEFF" />
        <Path d={`M${SCR.x + 8} ${SCR.y + 70} q30 -18 60 0 t60 -4`} stroke="#CDE9F7" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.9} />
        {[[16, 20, 22, 14], [48, 12, 18, 20], [86, 18, 24, 12], [20, 150, 26, 14], [96, 120, 22, 18]].map(([bx, by, bw, bh], i) => (
          <Rect key={i} x={SCR.x + bx} y={SCR.y + by} width={bw} height={bh} rx={3} fill="#E3DFFA" />
        ))}
      </Layer>

      {/* the network drawn on the phone: lines draw themselves (once), stations light as they are reached */}
      <Layer t={t} from={0.0} to={0.01} dy={0}>
        <RouteStroke d={toPathD(LINE_A)} length={TA.total} draw={mapFade} from={0} to={0.7} color={ob.violet} width={4.4} />
        <RouteStroke d={toPathD(LINE_B)} length={TB.total} draw={mapFade} from={0.15} to={0.85} color={ob.red} width={4.4} />
        <RouteStroke d={toPathD(LINE_BUS)} length={TC.total} draw={mapFade} from={0.3} to={1} color={ob.blue} width={3.4} />
      </Layer>
      {NODES.map(([nx, ny, c, at], i) => (
        <NodeDot key={i} x={nx} y={ny} size={4.6} color={c} lit={mapFade} at={at} span={0.1} />
      ))}
      {/* interchange where the two lines cross */}
      <NodeDot x={SCR.x + 66} y={SCR.y + 104} size={6} color="#FFFFFF" lit={mapFade} at={0.55} span={0.1} pulse={pulse} ring={ob.indigo} />

      {/* saved route cards sliding into place */}
      <Layer t={t} from={0.62} to={0.92} dy={14}>
        <G>
          <Rect x={SCR.x + 6} y={SCR.y + SCR.h - 58} width={SCR.w - 12} height={22} rx={9} fill="#FFFFFF" stroke={ob.lavenderDeep} strokeWidth={1.2} />
          <Circle cx={SCR.x + 20} cy={SCR.y + SCR.h - 47} r={4.6} fill={ob.mint} />
          <Rect x={SCR.x + 30} y={SCR.y + SCR.h - 49.4} width={34} height={4.8} rx={2.4} fill={ob.violet} />
          <Rect x={SCR.x + 68} y={SCR.y + SCR.h - 49.4} width={22} height={4.8} rx={2.4} fill={ob.blue} />
          <Path d={`M${SCR.x + SCR.w - 26} ${SCR.y + SCR.h - 42} c-5 -6 -5 -9 0 -9 c5 0 5 3 0 9 Z`} fill={ob.red} />
          <Rect x={SCR.x + 6} y={SCR.y + SCR.h - 30} width={SCR.w - 12} height={22} rx={9} fill="#FFFFFF" stroke={ob.lavenderDeep} strokeWidth={1.2} />
          <Path d={`M${SCR.x + 20} ${SCR.y + SCR.h - 24} l2 4.6 l5 .6 l-3.6 3.4 l1 5 l-4.4 -2.5 l-4.4 2.5 l1 -5 l-3.6 -3.4 l5 -.6 Z`} fill={ob.sunriseGold} transform="translate(0 -3) scale(0.9)" />
          <Rect x={SCR.x + 36} y={SCR.y + SCR.h - 21.4} width={28} height={4.8} rx={2.4} fill={ob.violet} opacity={0.8} />
          <Rect x={SCR.x + 68} y={SCR.y + SCR.h - 21.4} width={30} height={4.8} rx={2.4} fill={ob.blue} opacity={0.8} />
        </G>
      </Layer>

      <FoldedMap t={t} />
      <Connectivity t={t} style={wifi} />

      {/* floating mini-scenes around the phone */}
      <MiniCard x={34} y={100} bg="#CFE5FF" style={cardA}>
        <Rect x={0} y={42} width={64} height={22} fill="#BFE8D3" />
        <G transform="translate(8 8) scale(0.75)">
          <StationEntrance x={0} y={52} w={56} />
        </G>
      </MiniCard>
      <MiniCard x={36} y={208} bg="#E3F7EF" style={cardB}>
        <Rect x={0} y={44} width={64} height={20} fill="#3A3780" />
        <G transform="translate(10 6) scale(0.95)">
          <BusStopSign x={22} y={46} />
        </G>
        <Rect x={34} y={20} width={22} height={14} rx={4} fill={ob.blue} />
        <Rect x={36} y={23} width={18} height={6} rx={1.6} fill="#CFE5FF" />
      </MiniCard>
      <MiniCard x={262} y={176} bg="#F6D3E8" style={cardC}>
        <Path d="M10 46 H54" stroke={ob.violet} strokeWidth={5} strokeLinecap="round" />
        <Path d="M32 8 V46" stroke={ob.red} strokeWidth={5} strokeLinecap="round" />
        <Circle cx={32} cy={46} r={8} fill="#FFFFFF" stroke={ob.indigo} strokeWidth={3} />
        <Circle cx={32} cy={24} r={3.4} fill="#FFFFFF" stroke={ob.red} strokeWidth={2} />
      </MiniCard>
      <MiniCard x={264} y={292} bg="#FFF1D8" style={cardD}>
        <Path d="M32 52 c-14 -15 -15 -22 -15 -27 a15 15 0 0 1 30 0 c0 5 -1 12 -15 27 Z" fill={ob.red} />
        <Circle cx={32} cy={25} r={6} fill="#FFFFFF" />
      </MiniCard>
      <Sprite x={52} y={320} w={40} h={46} origin="bottom" animated={sway}>
        <Tree x={20} y={44} r={11} />
      </Sprite>
    </>
  );
}
