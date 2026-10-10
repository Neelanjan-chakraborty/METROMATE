import React from 'react';
import { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useDerivedValue } from 'react-native-reanimated';
import { BirdArt, BusArt, Building, Cloud, DomeHall, Lamp, MetroCarArt, Passenger, Road, SkyGradient, Sun, Temple, Tree, Viaduct } from '../art/shapes';
import { Backdrop, Layer, LogoSprite, NodeDot, Sprite, Vehicle, WipeReveal, useFloat, useLoopProgress, useSceneClock, useSway } from '../motion/kit';
import { buildTrack, stageOut } from '../motion/pathMath';
import { ob } from '../palette';
import type { SceneProps } from './types';

/*
 * Scene 1: the city at sunrise. The skyline settles in layer by layer, the violet line draws along the viaduct
 * and its stations light in turn; then a metro and a bus keep crossing at an easy pace.
 */

const GROUND = 394;
const DECK = 262;
const RAIL_Y = DECK - 2.6;
// Tracks run well past the overscan, so vehicles enter and leave out of sight.
const DECK_TRACK = buildTrack([[-200, DECK - 18], [560, DECK - 18]]);
const ROAD_TRACK = buildTrack([[500, 372], [-160, 372]]);
const BIRD_A = buildTrack([[-90, 118], [120, 98], [260, 126], [450, 100]]);
const BIRD_B = buildTrack([[-110, 146], [90, 128], [230, 148], [440, 122]]);
const NODES = [52, 132, 236, 312];
const LINE_FROM = 0.42;
const LINE_TO = 0.86;
/** Build time at which the eased line reaches x, so each station lights exactly as the line arrives. */
const reachAt = (x: number) => LINE_FROM + (LINE_TO - LINE_FROM) * (1 - Math.cbrt(1 - (x + 60) / 480));

const FAR = [
  [-50, 56, 270], [-24, 40, 252], [4, 34, 262], [34, 60, 256], [86, 36, 248], [112, 52, 262], [146, 70, 270], [188, 38, 250], [216, 44, 256], [250, 66, 262], [278, 34, 248], [304, 56, 258], [336, 40, 268], [372, 52, 262],
];
const MID = [
  [-40, 44, 96, 4], [8, 52, 70, 5], [60, 38, 112, 6], [100, 54, 84, 7], [150, 40, 100, 8], [192, 48, 76, 9], [236, 42, 120, 10], [282, 54, 90, 11], [330, 44, 104, 12], [378, 50, 80, 13],
];
const NEAR = [
  [-34, 46, 130, 21, 'slant'], [16, 56, 104, 22, 'flat'], [76, 42, 142, 23, 'tank'], [250, 50, 120, 24, 'flat'], [306, 60, 98, 25, 'slant'], [370, 46, 126, 26, 'spire'],
] as const;

export function WelcomeScene({ reduced }: SceneProps) {
  const { t, loop } = useSceneClock(reduced, 2600, 18000);
  const trainP = useLoopProgress(loop, 2, 0.08);
  const busP = useLoopProgress(loop, 1, 0.1);
  const birdA = useLoopProgress(loop, 1, 0);
  const birdB = useLoopProgress(loop, 1, 0.5);
  const pulse = useLoopProgress(loop, 3);
  const swayA = useSway(loop, 3, 0, 1.4);
  const swayB = useSway(loop, 3, 0.3, 1.2);
  const cloudA = useFloat(loop, 1, 0, 14, 'x');
  const cloudB = useFloat(loop, 1, 0.4, 10, 'x');
  // The line along the viaduct is revealed from the left as the scene builds.
  const lineEdge = useDerivedValue<number>(() => -60 + 480 * stageOut(t.value, LINE_FROM, LINE_TO));
  // Vehicles glide in only once the scene is built.
  const traffic = useDerivedValue<number>(() => stageOut(t.value, 0.8, 1));

  return (
    <>
      <Backdrop>
        <SkyGradient id="w-sky" top="#F6D3E8" bottom="#FFEBDD" h={340} />
        <Sun x={262} y={196} r={16} color={ob.sunriseGold} />
      </Backdrop>
      <Sprite x={-30} y={84} w={60} h={28} animated={cloudA}>
        <Cloud x={2} y={5} s={1.2} opacity={0.75} />
      </Sprite>
      <Sprite x={220} y={62} w={46} h={22} animated={cloudB}>
        <Cloud x={2} y={4} s={0.9} opacity={0.85} />
      </Sprite>

      <Layer t={t} from={0.0} to={0.34} dy={8} depth={0.05}>
        {FAR.map(([x, w, top], i) => (
          <Rect key={i} x={x} y={top} width={w} height={340 - top} rx={2} fill="#E6DEF6" />
        ))}
        <DomeHall x={20} y={300} w={74} h={34} fill="#D9D0F4" accent="#C9BBF1" />
        <Temple x={290} y={304} fill="#D9D0F4" accent="#C9BBF1" />
      </Layer>

      <Layer t={t} from={0.08} to={0.42} dy={10} depth={0.035}>
        {MID.map(([x, w, h, seed], i) => (
          <Building key={i} x={x} y={340} w={w} h={h} fill={i % 3 === 0 ? '#CFC6F1' : i % 3 === 1 ? '#C6BCEF' : '#D8CFF5'} seed={seed} lit={0.16} />
        ))}
      </Layer>

      <Layer t={t} from={0.16} to={0.5} dy={12} depth={0.02}>
        {NEAR.map(([x, w, h, seed, roof], i) => (
          <Building key={i} x={x} y={352} w={w} h={h} fill={i === 3 ? '#9FE0C8' : i % 2 ? '#A396E9' : '#B5ABEF'} seed={seed} roof={roof} lit={0.3} />
        ))}
      </Layer>

      {/* river with soft banks, and the arch bridge the metro crosses */}
      <Layer t={t} from={0.24} to={0.56} dy={8}>
        <Defs>
          <LinearGradient id="w-water" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#D6EEFA" />
            <Stop offset="1" stopColor="#A9D8F0" />
          </LinearGradient>
        </Defs>
        <Path d="M70 374 C78 340 92 326 120 322 C150 318 214 318 246 322 C274 326 288 340 296 374 Z" fill="url(#w-water)" />
        <Path d="M112 334 q10 -4 20 0 M196 330 q10 -4 20 0 M150 348 q12 -5 24 0 M232 352 q9 -4 18 0" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.7} />
        <Path d={`M100 ${DECK} Q183 ${DECK - 100} 266 ${DECK}`} stroke={ob.violet} strokeWidth={4.4} strokeLinecap="round" fill="none" />
        {[118, 140, 162, 183, 204, 226, 248].map((hx) => {
          const f = (hx - 100) / 166;
          const ay = DECK - 100 * 2 * f * (1 - f);
          return <Path key={hx} d={`M${hx} ${ay} V${DECK}`} stroke={ob.violet} strokeWidth={1.4} opacity={0.6} />;
        })}
      </Layer>

      <Layer t={t} from={0.3} to={0.6} dy={6}>
        <Viaduct x1={-60} x2={420} y={DECK} ground={GROUND - 22} pier={72} deck="#E6E2FC" dark="#BFB6F7" rail={ob.violetSoft} />
        <Road x1={-60} x2={420} y={372} h={22} />
        <Rect x={-60} y={394} width={480} height={46} fill="#CDEFDF" />
        <Rect x={-60} y={394} width={480} height={3} fill="#B8E5D1" />
      </Layer>

      <Layer t={t} from={0.46} to={0.76} dy={6}>
        <Lamp x={52} y={394} h={34} />
        <Lamp x={196} y={394} h={30} />
        <Lamp x={318} y={394} h={34} />
        <Passenger x={110} y={418} s={1.15} color={ob.indigo} bag={ob.mint} step={0} />
        <Passenger x={124} y={418} s={1.05} color={ob.violet} step={1} />
        <Passenger x={262} y={420} s={1.15} color={ob.indigoSoft} bag={ob.red} step={1} />
      </Layer>

      {/* the violet line along the viaduct; its stations light as the line reaches them */}
      <WipeReveal edgeX={lineEdge}>
        <Rect x={-60} y={RAIL_Y - 1.8} width={480} height={3.6} rx={1.8} fill={ob.violet} />
      </WipeReveal>
      {NODES.map((x, i) => (
        <NodeDot key={x} x={x} y={RAIL_Y} size={5.4} color={i % 2 ? ob.mint : ob.violet} lit={t} at={reachAt(x)} span={0.06} pulse={pulse} />
      ))}

      <Vehicle track={DECK_TRACK} p={trainP} w={50} h={34} visible={traffic} level>
        <MetroCarArt front glow="#FFE3A3" />
      </Vehicle>
      <Vehicle track={DECK_TRACK} p={trainP} w={50} h={34} visible={traffic} level lag={50}>
        <MetroCarArt />
      </Vehicle>
      <Vehicle track={DECK_TRACK} p={trainP} w={50} h={34} visible={traffic} level lag={100}>
        <MetroCarArt />
      </Vehicle>
      <Vehicle track={ROAD_TRACK} p={busP} w={68} h={34} visible={traffic} level>
        <BusArt />
      </Vehicle>

      <Sprite x={10} y={GROUND - 50} w={46} h={52} origin="bottom" animated={swayA}>
        <Tree x={23} y={50} r={13} />
      </Sprite>
      <Sprite x={292} y={GROUND - 44} w={42} h={46} origin="bottom" animated={swayB}>
        <Tree x={21} y={44} r={11} a="#9ADDBE" b="#74C7A0" />
      </Sprite>

      <Vehicle track={BIRD_A} p={birdA} w={16} h={8} level>
        <BirdArt color={ob.indigoSoft} />
      </Vehicle>
      <Vehicle track={BIRD_B} p={birdB} w={14} h={7} level>
        <BirdArt color={ob.violetMid} up />
      </Vehicle>

      <LogoSprite x={150} y={28} size={60} />
    </>
  );
}
