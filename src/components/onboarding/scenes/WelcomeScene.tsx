import React from 'react';
import { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { BirdArt, BusArt, Building, Cloud, DomeHall, Lamp, MetroTrainArt, Passenger, Road, SkyGradient, Sun, Temple, Tree, Viaduct } from '../art/shapes';
import { Backdrop, Layer, LogoSprite, RouteStroke, Sprite, StationNode, Vehicle, useLoopProgress, useSceneClock, useSway } from '../motion/kit';
import { buildTrack, toPathD } from '../motion/pathMath';
import { ob } from '../palette';
import type { SceneProps } from './types';


const GROUND = 394;
const DECK = 262;
const DECK_TRACK = buildTrack([[-120, DECK - 18], [480, DECK - 18]]);
const ROAD_TRACK = buildTrack([[480, 372], [-140, 372]]);
const BIRD_A = buildTrack([[-30, 120], [120, 96], [260, 130], [400, 100]]);
const BIRD_B = buildTrack([[-60, 150], [90, 128], [230, 150], [380, 120]]);
const BIRD_C = buildTrack([[-90, 90], [60, 70], [200, 96], [350, 74]]);
const ROUTE = [[-40, DECK - 2.6], [400, DECK - 2.6]] as const;
const ROUTE_D = toPathD(ROUTE as unknown as [number, number][]);
const NODES = [36, 128, 232, 324];

const FAR = [
  [-50, 56, 270], [-24, 40, 252], [4, 34, 262], [34, 60, 256], [86, 36, 248], [112, 52, 262], [146, 70, 270], [188, 38, 250], [216, 44, 256], [250, 66, 262], [278, 34, 248], [304, 56, 258], [336, 40, 268], [372, 52, 262],
];
const MID = [
  [-40, 44, 96, 4], [8, 52, 70, 5], [60, 38, 112, 6], [100, 54, 84, 7], [150, 40, 100, 8], [192, 48, 76, 9], [236, 42, 120, 10], [282, 54, 90, 11], [330, 44, 104, 12], [378, 50, 80, 13],
];
const NEAR = [
  [-34, 46, 130, 21, 'slant'], [16, 56, 104, 22, 'flat'], [76, 42, 142, 23, 'tank'], [250, 50, 120, 24, 'flat'], [306, 60, 98, 25, 'slant'], [370, 46, 126, 26, 'spire'],
] as const;

export function WelcomeScene({ active, reduced }: SceneProps) {
  const { t, loop } = useSceneClock(active, reduced, 4200, 16000);
  const trainP = useLoopProgress(loop, 2, 0.05);
  const busP = useLoopProgress(loop, 1, 0.1);
  const birdA = useLoopProgress(loop, 1, 0);
  const birdB = useLoopProgress(loop, 1, 0.37);
  const birdC = useLoopProgress(loop, 1, 0.71);
  const pulse = useLoopProgress(loop, 2);
  const swayA = useSway(loop, 2, 0, 2.6);
  const swayB = useSway(loop, 2, 0.3, 2.2);
  const swayC = useSway(loop, 3, 0.6, 2.8);

  return (
    <>
      <Backdrop depth={0.34}>
        <SkyGradient id="w-sky" top="#F6D3E8" bottom="#FFE9D6" h={330} />
        <Sun x={262} y={196} r={16} color={ob.sunriseGold} />
        <Cloud x={-20} y={96} s={1.2} opacity={0.7} />
        <Cloud x={228} y={74} s={0.9} opacity={0.8} />
        <Cloud x={120} y={150} s={0.7} opacity={0.6} />
      </Backdrop>

      <Layer t={t} from={0.0} to={0.2} dy={26} depth={0.26}>
        {FAR.map(([x, w, top], i) => (
          <Rect key={i} x={x} y={top} width={w} height={340 - top} rx={2} fill="#E3DBF6" />
        ))}
        <DomeHall x={20} y={300} w={74} h={34} fill="#D6CCF3" accent="#C7B8F0" />
        <Temple x={290} y={304} fill="#D6CCF3" accent="#C7B8F0" />
      </Layer>

      <Layer t={t} from={0.1} to={0.32} dy={30} depth={0.16}>
        {MID.map(([x, w, h, seed], i) => (
          <Building key={i} x={x} y={340} w={w} h={h} fill={i % 3 === 0 ? '#CFC6F1' : i % 3 === 1 ? '#C3B9EE' : '#D8CFF5'} seed={seed} lit={0.22} />
        ))}
      </Layer>

      <Layer t={t} from={0.22} to={0.46} dy={34} depth={0.08}>
        {NEAR.map(([x, w, h, seed, roof], i) => (
          <Building key={i} x={x} y={352} w={w} h={h} fill={i === 3 ? '#9FE0C8' : i % 2 ? '#A396E9' : '#B5ABEF'} seed={seed} roof={roof} lit={0.4} />
        ))}
      </Layer>

      {/* river and the arch bridge the metro crosses */}
      <Layer t={t} from={0.3} to={0.52} dy={20} depth={0.04}>
        <Defs>
          <LinearGradient id="w-water" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#CDE9F7" />
            <Stop offset="1" stopColor="#A9D8F0" />
          </LinearGradient>
        </Defs>
        <Rect x={86} y={318} width={194} height={56} fill="url(#w-water)" />
        {[0, 1, 2, 3].map((i) => (
          <Path key={i} d={`M${104 + i * 44} ${332 + (i % 2) * 14} q8 -4 16 0 t16 0`} stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.75} />
        ))}
        <Rect x={80} y={316} width={8} height={58} fill="#CFC8F2" />
        <Rect x={278} y={316} width={8} height={58} fill="#CFC8F2" />
        {/* tied arch above the viaduct */}
        <Path d={`M100 ${DECK} Q183 ${DECK - 100} 266 ${DECK}`} stroke={ob.violet} strokeWidth={4.4} strokeLinecap="round" fill="none" opacity={0.95} />
        {[118, 140, 162, 183, 204, 226, 248].map((hx) => {
          const f = (hx - 100) / 166;
          const ay = DECK - 100 * 2 * f * (1 - f) * 1;
          return <Path key={hx} d={`M${hx} ${ay} V${DECK}`} stroke={ob.violet} strokeWidth={1.4} opacity={0.7} />;
        })}
      </Layer>

      <Layer t={t} from={0.34} to={0.58} dy={14} depth={0.03}>
        <Viaduct x1={-60} x2={420} y={DECK} ground={GROUND - 22} pier={72} deck="#E2DDFB" dark="#B9B0F7" rail={ob.violet} />
        <Road x1={-60} x2={420} y={372} h={22} />
        <Rect x={-60} y={394} width={480} height={46} fill="#CDEFDF" />
        <Rect x={-60} y={394} width={480} height={4} fill="#B4E3CF" />
      </Layer>

      <Layer t={t} from={0.48} to={0.7} dy={10}>
        <Lamp x={52} y={394} h={34} />
        <Lamp x={196} y={394} h={30} />
        <Lamp x={318} y={394} h={34} />
        <Passenger x={110} y={418} s={1.15} color={ob.indigo} bag={ob.mint} step={0} />
        <Passenger x={124} y={418} s={1.05} color={ob.violet} step={1} />
        <Passenger x={262} y={420} s={1.15} color={ob.indigoSoft} bag={ob.red} step={1} />
      </Layer>

      {/* route line along the viaduct, with station nodes that light in turn */}
      <Layer t={t} from={0.0} to={0.01}>
        <RouteStroke d={ROUTE_D} length={DECK_TRACK.total * 0.74} draw={t} from={0.4} to={0.82} color={ob.violet} width={3.6} opacity={0.95} />
        {NODES.map((x, i) => (
          <StationNode key={x} x={x} y={DECK - 2.6} size={5.4} color={i % 2 ? ob.mint : ob.violet} lit={t} at={0.52 + i * 0.1} span={0.05} pulse={pulse} />
        ))}
      </Layer>

      <Vehicle track={DECK_TRACK} p={trainP} w={150} h={34} level>
        <MetroTrainArt glow="#FFE3A3" />
      </Vehicle>
      <Vehicle track={ROAD_TRACK} p={busP} w={68} h={34} level>
        <BusArt />
      </Vehicle>

      <Sprite x={10} y={GROUND - 50} w={46} h={52} origin="bottom" animated={swayA}>
        <Tree x={23} y={50} r={13} />
      </Sprite>
      <Sprite x={292} y={GROUND - 44} w={42} h={46} origin="bottom" animated={swayB}>
        <Tree x={21} y={44} r={11} a="#9ADDBE" b="#74C7A0" />
      </Sprite>
      <Sprite x={170} y={GROUND - 28} w={26} h={30} origin="bottom" animated={swayC}>
        <Tree x={13} y={28} r={8} a="#A5E3C7" b="#7DCDA9" />
      </Sprite>

      {[[BIRD_A, birdA], [BIRD_B, birdB], [BIRD_C, birdC]].map(([tr, p], i) => (
        <Vehicle key={i} track={tr as ReturnType<typeof buildTrack>} p={p as never} w={16} h={8} level>
          <BirdArt color={ob.indigoSoft} up={i === 1} />
        </Vehicle>
      ))}

      <LogoSprite x={150} y={28} size={60} animate={active ? 'float' : 'none'} />
    </>
  );
}
