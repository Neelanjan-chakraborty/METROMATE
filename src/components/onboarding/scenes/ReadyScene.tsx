import React from 'react';
import { Circle, G, Path, Rect } from 'react-native-svg';
import { useDerivedValue } from 'react-native-reanimated';
import { Building, BusArt, BusStopSign, Cloud, Crossing, DomeHall, Lamp, MetroTrainArt, Passenger, Road, SkyGradient, StationEntrance, Sun, Temple, Tree, Viaduct } from '../art/shapes';
import { Backdrop, Comet, Layer, NodeDot, RouteStroke, Sprite, Vehicle, useLoopProgress, useSceneClock, useSway } from '../motion/kit';
import { buildTrack, distanceOfNearest, smoothClosed, stage, toPathD, type Pt } from '../motion/pathMath';
import { ob } from '../palette';
import type { SceneProps } from './types';

/*
 * Scene 5: a calm panorama to finish on. A violet route loops through a few destinations above the
 * city (home, a café, a college, work, drawn as plain icons); the metro and the bus travel in parallel
 * below it, passing a station entrance and a pedestrian crossing. The route draws once; then a soft marker
 * keeps circling it.
 */

const GROUND = 394;
const DECK = 262;
/** Destinations on the loop: `x, y` is the node on the route, `bx, by` the plain icon badge beside it. */
const STOPS: { x: number; y: number; bx: number; by: number; color: string; icon: 'home' | 'cup' | 'book' | 'bag' }[] = [
  { x: 58, y: 162, bx: 58, by: 128, color: ob.mint, icon: 'home' },
  { x: 116, y: 112, bx: 116, by: 80, color: ob.violet, icon: 'cup' },
  { x: 190, y: 150, bx: 190, by: 180, color: ob.blue, icon: 'book' },
  { x: 284, y: 114, bx: 284, by: 82, color: ob.red, icon: 'bag' },
];
// A smooth closed loop through the four destinations: home → café → college → work → back home.
const LOOP: Pt[] = smoothClosed([...STOPS.map((s) => [s.x, s.y] as Pt), [306, 174], [214, 202], [104, 204]], 14);
const LOOP_T = buildTrack(LOOP);
const LOOP_D = toPathD(LOOP);
const DRAW_FROM = 0.36;
const DRAW_TO = 0.8;
/** Build time at which the eased line reaches a stop (fraction `f` of the loop), so each node lights as it arrives. */
const reachAt = (f: number) => DRAW_FROM + (DRAW_TO - DRAW_FROM) * (1 - Math.cbrt(1 - f));
const STOP_AT = STOPS.map((s) => reachAt(Math.min(0.999, distanceOfNearest(LOOP_T, s.x, s.y) / LOOP_T.total)));
const METRO_TRACK = buildTrack([[-200, DECK - 18], [560, DECK - 18]]);
const BUS_TRACK = buildTrack([[-160, 371], [520, 371]]);
const WALK = buildTrack([[194, 383], [226, 383]]);

function Icon({ kind, x, y, color }: { kind: 'home' | 'cup' | 'book' | 'bag'; x: number; y: number; color: string }) {
  const common = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <G transform={`translate(${x - 8} ${y - 8})`}>
      {kind === 'home' ? <Path d="M2 8 L8 2.5 L14 8 M4 7 V13.5 H12 V7" {...common} /> : null}
      {kind === 'cup' ? <Path d="M3 5 H11 V10 a3 3 0 0 1 -3 3 H6 a3 3 0 0 1 -3 -3 Z M11 6.5 H12.5 a1.6 1.6 0 0 1 0 3.2 H11" {...common} /> : null}
      {kind === 'book' ? <Path d="M2.5 3.5 H7.5 a1.5 1.5 0 0 1 1.5 1.5 V13 a1.5 1.5 0 0 0 -1.5 -1.5 H2.5 Z M9 5 a1.5 1.5 0 0 1 1.5 -1.5 H13.5 V11.5 H10.5 A1.5 1.5 0 0 0 9 13" {...common} /> : null}
      {kind === 'bag' ? <Path d="M3 6 H13 V13.5 H3 Z M6 6 V4.4 a2 2 0 0 1 4 0 V6" {...common} /> : null}
    </G>
  );
}

export function ReadyScene({ reduced }: SceneProps) {
  const { t, loop } = useSceneClock(reduced, 2800, 14000);
  const metroP = useLoopProgress(loop, 1, 0.12);
  const busP = useLoopProgress(loop, 1, 0.06);
  const traffic = useDerivedValue<number>(() => stage(t.value, 0.6, 0.85));
  const comet = useLoopProgress(loop, 2, 0);
  const cometVis = useDerivedValue<number>(() => stage(t.value, 0.84, 1));
  const pulse = useLoopProgress(loop, 4);
  const walkA = useLoopProgress(loop, 4, 0);
  const walkB = useLoopProgress(loop, 4, 0.5);
  const walkVisA = useDerivedValue<number>(() => traffic.value * Math.min(stage(walkA.value, 0, 0.15), 1 - stage(walkA.value, 0.85, 1)));
  const walkVisB = useDerivedValue<number>(() => traffic.value * Math.min(stage(walkB.value, 0, 0.15), 1 - stage(walkB.value, 0.85, 1)));
  const swayA = useSway(loop, 4, 0.1, 1.4);
  const swayB = useSway(loop, 4, 0.5, 1.2);

  return (
    <>
      <Backdrop>
        <SkyGradient id="r-sky" top="#FDE7DA" bottom="#FFF6EC" h={340} />
        <Sun x={298} y={226} r={14} color="#FFD27A" />
        <Cloud x={-16} y={60} s={1.1} opacity={0.85} />
        <Cloud x={226} y={30} s={0.9} opacity={0.9} />
      </Backdrop>

      <Layer t={t} from={0.0} to={0.3} dy={8} depth={0.04}>
        {[[-46, 40, 280], [-8, 56, 262], [52, 34, 272], [92, 50, 252], [150, 38, 268], [188, 56, 258], [250, 42, 270], [296, 52, 256], [350, 40, 276]].map(([x, w, top], i) => (
          <Rect key={i} x={x} y={top} width={w} height={340 - top} rx={2} fill="#EDE3F4" />
        ))}
        <DomeHall x={150} y={304} w={70} h={32} fill="#E2D6F4" accent="#D1C1F1" />
        <Temple x={30} y={306} fill="#E2D6F4" accent="#D1C1F1" />
      </Layer>

      <Layer t={t} from={0.08} to={0.38} dy={10} depth={0.025}>
        {[[-30, 44, 90, 31], [18, 40, 112, 32], [150, 48, 84, 33], [212, 56, 120, 34], [272, 42, 92, 35], [320, 54, 108, 36]].map(([x, w, h, seed], i) => (
          <Building key={i} x={x} y={340} w={w} h={h} fill={i % 2 ? '#CEC3F1' : '#DAD1F6'} seed={seed} lit={0.12} roof={i === 3 ? 'tank' : 'flat'} />
        ))}
        <Building x={86} y={352} w={60} h={96} fill="#A89CEB" seed={40} roof="spire" lit={0.26} />
        <Building x={246} y={352} w={46} h={74} fill="#9FE0C8" seed={41} lit={0.26} />
      </Layer>

      <Layer t={t} from={0.18} to={0.48} dy={6}>
        <Viaduct x1={-60} x2={420} y={DECK} ground={GROUND - 22} pier={78} deck="#E6E2FC" dark="#BFB6F7" rail={ob.violetSoft} />
        <Road x1={-60} x2={420} y={372} h={22} />
        <Rect x={-60} y={394} width={480} height={46} fill="#CDEFDF" />
        <Rect x={-60} y={394} width={480} height={3} fill="#B8E5D1" />
        <Crossing x={190} y={372} h={22} n={6} />
      </Layer>

      <Layer t={t} from={0.32} to={0.62} dy={6}>
        <StationEntrance x={44} y={394} w={60} />
        <BusStopSign x={268} y={396} />
        <Lamp x={140} y={394} h={32} />
        <Lamp x={330} y={394} h={34} />
        <Passenger x={116} y={420} s={1.2} color={ob.indigo} bag={ob.mint} step={0} />
        <Passenger x={132} y={421} s={1.1} color={ob.violet} step={1} />
        <Passenger x={288} y={421} s={1.15} color={ob.indigoSoft} bag={ob.red} step={1} />
      </Layer>

      {/* the route loop through four destinations: a soft shadow line, then the violet route drawing once */}
      <Layer t={t} from={DRAW_FROM} to={DRAW_TO} dy={0}>
        <Path d={LOOP_D} stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.7} />
      </Layer>
      <Layer t={t} from={0.0} to={0.01} dy={0}>
        <RouteStroke d={LOOP_D} length={LOOP_T.total} draw={t} from={DRAW_FROM} to={DRAW_TO} color={ob.violet} width={4.4} />
      </Layer>
      <Comet track={LOOP_T} p={comet} color={ob.violet} visible={cometVis} />
      {STOPS.map((s, i) => (
        <NodeDot key={i} x={s.x} y={s.y} size={5.6} color={s.color} lit={t} at={STOP_AT[i]} span={0.05} pulse={i === 3 ? pulse : undefined} ring={i === 3 ? ob.red : ob.indigo} />
      ))}
      {STOPS.map((s, i) => (
        <Layer key={i} t={t} from={STOP_AT[i]} to={Math.min(1, STOP_AT[i] + 0.16)} dy={6}>
          <Circle cx={s.bx} cy={s.by} r={13} fill="#FFFFFF" stroke={s.color} strokeWidth={2.2} />
          <Icon kind={s.icon} x={s.bx} y={s.by} color={s.color} />
        </Layer>
      ))}

      <Vehicle track={METRO_TRACK} p={metroP} w={150} h={34} visible={traffic} level>
        <MetroTrainArt glow="#FFE3A3" />
      </Vehicle>
      <Vehicle track={BUS_TRACK} p={busP} w={68} h={34} visible={traffic} level>
        <BusArt />
      </Vehicle>
      <Vehicle track={WALK} p={walkA} w={14} h={24} visible={walkVisA} level>
        <Passenger x={7} y={22} s={1.0} color={ob.indigo} step={0} bag={ob.mint} />
      </Vehicle>
      <Vehicle track={WALK} p={walkB} w={14} h={24} visible={walkVisB} level>
        <Passenger x={7} y={22} s={1.0} color={ob.violet} step={1} />
      </Vehicle>

      <Sprite x={-6} y={GROUND - 54} w={48} h={56} origin="bottom" animated={swayA}>
        <Tree x={24} y={54} r={13} />
      </Sprite>
      <Sprite x={316} y={GROUND - 46} w={44} h={48} origin="bottom" animated={swayB}>
        <Tree x={22} y={46} r={11} a="#9ADDBE" b="#74C7A0" />
      </Sprite>
    </>
  );
}
