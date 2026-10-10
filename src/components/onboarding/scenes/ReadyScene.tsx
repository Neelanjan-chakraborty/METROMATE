import React from 'react';
import { Circle, G, Path, Rect } from 'react-native-svg';
import { useDerivedValue } from 'react-native-reanimated';
import { Building, BusArt, BusStopSign, Cloud, Crossing, DomeHall, Lamp, MetroTrainArt, Passenger, Road, SkyGradient, StationEntrance, Sun, Temple, Tree, Viaduct } from '../art/shapes';
import { Backdrop, Layer, RouteStroke, Sprite, StationNode, Vehicle, useLoopProgress, useSceneClock, useSway } from '../motion/kit';
import { buildTrack, distanceOfNearest, roundedPolyline, stage, toPathD, type Pt } from '../motion/pathMath';
import { ob } from '../palette';
import type { SceneProps } from './types';

/*
 * Scene 5: a calm panorama to finish on. A violet route loops through a few destinations above the
 * city (home, a café, a college, work, drawn as plain icons); the metro and the bus travel in parallel
 * below it, passing a station entrance and a pedestrian crossing. The route draws once and rests.
 */

const GROUND = 394;
const DECK = 262;
// A closed loop: home → café → college → work → back, drawn with rounded corners.
const LOOP: Pt[] = roundedPolyline([[56, 172], [56, 108], [128, 108], [128, 146], [212, 146], [212, 104], [304, 104], [304, 172], [180, 172], [56, 172]], 18, 8);
const LOOP_T = buildTrack(LOOP);
const LOOP_D = toPathD(LOOP);
const METRO_TRACK = buildTrack([[-120, DECK - 18], [480, DECK - 18]]);
const BUS_TRACK = buildTrack([[-90, 371], [450, 371]]);
/** Destinations on the loop: `x, y` is the node on the route, `bx, by` the plain icon badge beside it. */
const STOPS: { x: number; y: number; bx: number; by: number; color: string; icon: 'home' | 'cup' | 'book' | 'bag' }[] = [
  { x: 56, y: 140, bx: 92, by: 150, color: ob.mint, icon: 'home' },
  { x: 92, y: 108, bx: 92, by: 82, color: ob.violet, icon: 'cup' },
  { x: 170, y: 146, bx: 170, by: 120, color: ob.blue, icon: 'book' },
  { x: 304, y: 138, bx: 270, by: 128, color: ob.red, icon: 'bag' },
];

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

export function ReadyScene({ active, reduced }: SceneProps) {
  const { t, loop } = useSceneClock(active, reduced, 3600, 12000);
  const metroP = useLoopProgress(loop, 1, 0.12);
  const busP = useLoopProgress(loop, 1, 0.06);
  const pulse = useLoopProgress(loop, 3);
  // The route loop draws once per cycle, rests complete, then fades before the next pass.
  const draw = useDerivedValue<number>(() => (reduced ? 1 : stage(loop.value, 0.04, 0.62)));
  const walkA = useLoopProgress(loop, 3, 0);
  const walkB = useLoopProgress(loop, 3, 0.5);
  const walkTrack = buildTrack([[196, 383], [222, 383]]);
  const swayA = useSway(loop, 2, 0.1, 2.4);
  const swayB = useSway(loop, 3, 0.5, 2.2);

  return (
    <>
      <Backdrop depth={0.3}>
        <SkyGradient id="r-sky" top="#FDE7DA" bottom="#FFF6EC" h={340} />
        <Sun x={298} y={212} r={14} color="#FFD27A" />
        <Cloud x={-16} y={60} s={1.1} opacity={0.85} />
        <Cloud x={176} y={214} s={0.8} opacity={0.7} />
        <Cloud x={236} y={50} s={0.9} opacity={0.9} />
      </Backdrop>

      <Layer t={t} from={0.0} to={0.2} dy={24} depth={0.22}>
        {[[-46, 40, 280], [-8, 56, 262], [52, 34, 272], [92, 50, 252], [150, 38, 268], [188, 56, 258], [250, 42, 270], [296, 52, 256], [350, 40, 276]].map(([x, w, top], i) => (
          <Rect key={i} x={x} y={top} width={w} height={340 - top} rx={2} fill="#EADFF3" />
        ))}
        <DomeHall x={150} y={304} w={70} h={32} fill="#DFD2F3" accent="#CDBBF0" />
        <Temple x={30} y={306} fill="#DFD2F3" accent="#CDBBF0" />
      </Layer>

      <Layer t={t} from={0.1} to={0.34} dy={28} depth={0.12}>
        {[[-30, 44, 90, 31], [18, 40, 112, 32], [150, 48, 84, 33], [212, 56, 120, 34], [272, 42, 92, 35], [320, 54, 108, 36]].map(([x, w, h, seed], i) => (
          <Building key={i} x={x} y={340} w={w} h={h} fill={i % 2 ? '#CBBFF0' : '#D8CEF5'} seed={seed} lit={0.14} roof={i === 3 ? 'tank' : 'flat'} />
        ))}
        <Building x={86} y={352} w={60} h={96} fill="#A89CEB" seed={40} roof="spire" lit={0.3} />
        <Building x={246} y={352} w={46} h={74} fill="#9FE0C8" seed={41} lit={0.3} />
      </Layer>

      <Layer t={t} from={0.2} to={0.46} dy={16} depth={0.04}>
        <Viaduct x1={-60} x2={420} y={DECK} ground={GROUND - 22} pier={78} deck="#E2DDFB" dark="#B9B0F7" />
        <Road x1={-60} x2={420} y={372} h={22} />
        <Rect x={-60} y={394} width={480} height={46} fill="#CDEFDF" />
        <Rect x={-60} y={394} width={480} height={4} fill="#B4E3CF" />
        <Crossing x={190} y={372} h={22} n={6} />
      </Layer>

      <Layer t={t} from={0.36} to={0.6} dy={10}>
        <StationEntrance x={44} y={394} w={60} />
        <BusStopSign x={268} y={396} />
        <Lamp x={140} y={394} h={32} />
        <Lamp x={330} y={394} h={34} />
        <Passenger x={116} y={420} s={1.2} color={ob.indigo} bag={ob.mint} step={0} />
        <Passenger x={132} y={421} s={1.1} color={ob.violet} step={1} />
        <Passenger x={288} y={421} s={1.15} color={ob.indigoSoft} bag={ob.red} step={1} />
      </Layer>

      {/* the route loop through four destinations */}
      <Layer t={t} from={0.0} to={0.01}>
        <RouteStroke d={LOOP_D} length={LOOP_T.total} draw={draw} from={0} to={1} color={ob.violet} width={4.6} />
        {STOPS.map((s, i) => {
          const f = distanceOfNearest(LOOP_T, s.x, s.y) / LOOP_T.total;
          return <StationNode key={i} x={s.x} y={s.y} size={5.4} color={s.color} lit={draw} at={Math.max(0, Math.min(0.95, f - 0.02))} span={0.04} pulse={pulse} />;
        })}
      </Layer>
      <Layer t={t} from={0.5} to={0.7}>
        {STOPS.map((s, i) => (
          <G key={i}>
            <Circle cx={s.bx} cy={s.by} r={13} fill="#FFFFFF" stroke={s.color} strokeWidth={2.2} />
            <Icon kind={s.icon} x={s.bx} y={s.by} color={s.color} />
          </G>
        ))}
      </Layer>

      <Vehicle track={METRO_TRACK} p={metroP} w={150} h={34} level>
        <MetroTrainArt glow="#FFE3A3" />
      </Vehicle>
      <Vehicle track={BUS_TRACK} p={busP} w={68} h={34} level>
        <BusArt />
      </Vehicle>
      {[walkA, walkB].map((p, i) => (
        <Vehicle key={i} track={walkTrack} p={p} w={14} h={24} level>
          <Passenger x={7} y={22} s={1.0} color={i ? ob.violet : ob.indigo} step={i ? 1 : 0} bag={i ? undefined : ob.mint} />
        </Vehicle>
      ))}

      <Sprite x={-6} y={GROUND - 54} w={48} h={56} origin="bottom" animated={swayA}>
        <Tree x={24} y={54} r={13} />
      </Sprite>
      <Sprite x={316} y={GROUND - 46} w={44} h={48} origin="bottom" animated={swayB}>
        <Tree x={22} y={46} r={11} a="#9ADDBE" b="#74C7A0" />
      </Sprite>
    </>
  );
}
