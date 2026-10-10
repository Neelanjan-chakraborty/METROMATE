import React from 'react';
import { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useDerivedValue } from 'react-native-reanimated';
import { Building, BusArt, Cloud, Lamp, MetroCarArt, Passenger, SkyGradient, Tree, tint } from '../art/shapes';
import { Backdrop, Layer, NodeDot, Ripple, Sprite, Vehicle, WipeReveal, useLoopProgress, usePopFloat, useSceneClock, useSway } from '../motion/kit';
import { buildTrack, pointAt, roundedPolyline, stage, toPathD, type Pt } from '../motion/pathMath';
import { ob } from '../palette';
import type { SceneProps } from './types';

/*
 * Scene 3: a cutaway of the city. A train leaves an underground station, climbs out of a cutting onto an
 * elevated line (its three cars bend through the curve), and the route line advances with it while the next
 * stops light up. It eases into the destination, the stop alert ripples, and the trip starts again out of
 * sight. The marker is a stylised "you are here", not a live vehicle. A bus runs on the street above the tunnel.
 */

const SURFACE = 276;
const ROAD_Y = 262;
const DECK = 240;
const TRACK_PTS: Pt[] = roundedPolyline(
  [[-120, 340], [84, 340], [150, 306], [206, 258], [250, 222], [480, 222]],
  40,
  10,
);
const TRACK = buildTrack(TRACK_PTS);
/** The route line runs along the rails, a little below the train's centre. */
const RAIL: Pt[] = TRACK_PTS.map(([x, y]) => [x, y + 14] as Pt);
const RAIL_D = toPathD(RAIL);
const BUS_TRACK = buildTrack([[200, 257], [-100, 257]]);

/** Node positions as fractions of the track length, found by x so they sit on straight parts. */
const xToFrac = (x: number) => {
  let lo = 0;
  let hi = TRACK.total;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    // x increases along the track
    let k = 1;
    while (k < TRACK.cum.length - 1 && TRACK.cum[k] < mid) k++;
    const seg = TRACK.cum[k] - TRACK.cum[k - 1];
    const f = seg === 0 ? 0 : (mid - TRACK.cum[k - 1]) / seg;
    const px = TRACK.xy[(k - 1) * 2] + (TRACK.xy[k * 2] - TRACK.xy[(k - 1) * 2]) * f;
    if (px < x) lo = mid;
    else hi = mid;
  }
  return lo / TRACK.total;
};
const NODE_X = [42, 78, 268, 312];
const NODE_F = NODE_X.map(xToFrac);
const nodePt = (f: number): Pt => {
  const d = f * TRACK.total;
  let k = 1;
  while (k < TRACK.cum.length - 1 && TRACK.cum[k] < d) k++;
  const seg = TRACK.cum[k] - TRACK.cum[k - 1];
  const u = seg === 0 ? 0 : (d - TRACK.cum[k - 1]) / seg;
  return [TRACK.xy[(k - 1) * 2] + (TRACK.xy[k * 2] - TRACK.xy[(k - 1) * 2]) * u, TRACK.xy[(k - 1) * 2 + 1] + (TRACK.xy[k * 2 + 1] - TRACK.xy[(k - 1) * 2 + 1]) * u + 14];
};

/** The train stops with its front car a little past the destination node. */
const STOP_F = Math.min(1, NODE_F[3] + 22 / TRACK.total);
const smooth = (v: number) => {
  'worklet';
  return v * v * (3 - 2 * v);
};

export function TrackingScene({ reduced }: SceneProps) {
  const { t, loop } = useSceneClock(reduced, 2400, 12000);
  // One trip per loop: ease out of the tunnel, glide into the destination, ring the alert, then fade and start again unseen.
  const trainP = useDerivedValue<number>(() => STOP_F * smooth(stage(loop.value, 0.02, 0.72)));
  const trainVis = useDerivedValue<number>(() => stage(t.value, 0.5, 0.7) * (1 - stage(loop.value, 0.92, 0.985)));
  const alertOn = useDerivedValue<number>(() => stage(loop.value, 0.64, 0.7) * (1 - stage(loop.value, 0.88, 0.94)) * stage(t.value, 0.9, 1));
  // the stops dim back in reverse while the train fades, so nothing snaps when the trip restarts
  const nodeLit = useDerivedValue<number>(() => trainP.value * (1 - stage(loop.value, 0.9, 0.985)));
  // the progress line ends at the front of the train
  const lineEdge = useDerivedValue<number>(() => pointAt(TRACK, trainP.value * TRACK.total)[0] + 20);
  const busP = useLoopProgress(loop, 1, 0.2);
  const busVis = useDerivedValue<number>(() => Math.min(stage(busP.value, 0, 0.1), 1 - stage(busP.value, 0.9, 1)) * stage(t.value, 0.6, 0.8));
  const pulse = useLoopProgress(loop, 5);
  const pin = usePopFloat(t, 0.62, 0.86, loop, 4, 0, 1.6);
  const swayB = useSway(loop, 4, 0.4, 1.4);
  const [dx, dy] = nodePt(NODE_F[3]);

  return (
    <>
      <Backdrop>
        <SkyGradient id="t-sky" top="#DDEBFF" bottom="#F4F2FF" h={280} />
        <Cloud x={20} y={64} s={1.1} opacity={0.9} />
        <Cloud x={250} y={104} s={0.85} opacity={0.85} />
      </Backdrop>

      {/* city behind the street, and the elevated side */}
      <Layer t={t} from={0.0} to={0.3} dy={10} depth={0.04}>
        {[[-48, 40, 70, 3], [-6, 52, 96, 4], [52, 36, 58, 5], [92, 48, 84, 6], [146, 42, 64, 7], [190, 38, 108, 8], [236, 44, 80, 9], [282, 46, 120, 10], [330, 42, 70, 11]].map(([x, w, h, seed], i) => (
          <Building key={i} x={x} y={ROAD_Y} w={w} h={h} fill={i % 2 ? '#D3CBF3' : '#C8BFF0'} seed={seed} lit={0.14} />
        ))}
      </Layer>

      {/* the earth: layered strata, with the cutting and the tunnel carved out of it */}
      <Layer t={t} from={0.08} to={0.38} dy={8}>
        <Defs>
          <LinearGradient id="t-earth" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C9C1F8" />
            <Stop offset="0.55" stopColor="#ADA2F0" />
            <Stop offset="1" stopColor="#968AE6" />
          </LinearGradient>
        </Defs>
        <Rect x={-60} y={SURFACE} width={480} height={164} fill="url(#t-earth)" />
        <Rect x={-60} y={SURFACE} width={480} height={5} fill="#CFC8F2" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <Circle key={i} cx={-40 + i * 38 + (i % 3) * 6} cy={392 + (i % 4) * 10} r={1.8 + (i % 3) * 0.6} fill="#FFFFFF" opacity={0.18} />
        ))}
        <Path d="M-60 400 Q60 384 180 404 T420 392" stroke="#FFFFFF" strokeWidth={1.4} opacity={0.15} fill="none" />
        {/* tunnel bore, then the cutting that rises to the surface */}
        <Rect x={-60} y={314} width={154} height={52} rx={10} fill="#5B54B4" />
        <Rect x={-60} y={318} width={154} height={44} rx={8} fill="#6C66C2" />
        <Path d="M84 314 V366 H126 Q150 366 170 344 L218 288 Q226 276 214 276 H112 Q104 276 104 284 V300 Z" fill="#5B54B4" />
        <Path d="M84 318 V362 H124 Q146 362 166 340 L210 290 Q216 280 206 280 H116 Q108 280 108 288 V298 Z" fill="#6C66C2" />
        {/* underground station: platform, lights and the stairs up to the street */}
        <Rect x={0} y={352} width={90} height={5} rx={1.6} fill={ob.violetSoft} />
        {[10, 28, 46, 64, 82].map((lx) => (
          <Rect key={lx} x={lx} y={321} width={10} height={2.4} rx={1.2} fill="#FFE3A3" opacity={0.9} />
        ))}
        <Passenger x={26} y={352} s={0.9} color="#E9E7FF" step={0} />
        <Passenger x={44} y={352} s={0.9} color="#B9B0F7" step={1} bag={ob.mint} />
        {/* shaft from the platform to the street */}
        <Rect x={64} y={SURFACE} width={22} height={44} fill="#6C66C2" />
        <Path d="M66 316 L84 296 M66 306 L84 286" stroke="#B9B0F7" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
      </Layer>

      {/* street, bridge over the cutting, entrance */}
      <Layer t={t} from={0.18} to={0.46} dy={6}>
        <Rect x={-60} y={ROAD_Y} width={276} height={SURFACE - ROAD_Y} fill={ob.road} />
        <Rect x={-60} y={ROAD_Y - 2} width={276} height={2.4} fill={tint(ob.road, 0.4)} />
        {Array.from({ length: 10 }, (_, i) => (
          <Rect key={i} x={-52 + i * 30} y={ROAD_Y + 6} width={14} height={1.6} rx={0.8} fill={ob.roadLine} opacity={0.7} />
        ))}
        <Rect x={104} y={ROAD_Y - 6} width={112} height={3} rx={1.4} fill="#B9B0F7" />
        {[108, 140, 172, 204].map((bx) => (
          <Rect key={bx} x={bx} y={ROAD_Y - 6} width={2} height={7} fill="#B9B0F7" />
        ))}
        <G>
          <Rect x={60} y={ROAD_Y - 22} width={32} height={22} rx={3} fill="#FFFFFF" />
          <Path d={`M55 ${ROAD_Y - 22} L62 ${ROAD_Y - 29} H90 L97 ${ROAD_Y - 22} Z`} fill={ob.violet} />
          <Circle cx={76} cy={ROAD_Y - 38} r={6.5} fill="#FFFFFF" stroke={ob.violet} strokeWidth={1.8} />
          <Path d={`M72.8 ${ROAD_Y - 35.6} V${ROAD_Y - 40.6} L76 ${ROAD_Y - 37.4} L79.2 ${ROAD_Y - 40.6} V${ROAD_Y - 35.6}`} stroke={ob.violet} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Rect x={65} y={ROAD_Y - 16} width={22} height={16} fill="#CFE5FF" />
        </G>
        <Lamp x={10} y={ROAD_Y} h={30} />
        <Lamp x={98} y={ROAD_Y} h={28} />
      </Layer>

      {/* elevated side: ramp deck and viaduct with an elevated station */}
      <Layer t={t} from={0.26} to={0.54} dy={8}>
        <Path d={toPathD(RAIL.slice(Math.floor(RAIL.length * 0.5)).map(([x, y]) => [x, y + 4] as Pt))} stroke="#CFC8F2" strokeWidth={9} fill="none" strokeLinecap="butt" strokeLinejoin="round" />
        {[236, 262, 288, 314].map((pxx) => {
          const [, ry] = nodePt(xToFrac(pxx));
          return <Rect key={pxx} x={pxx - 4} y={ry + 8} width={8} height={SURFACE - ry - 8} fill="#B9B0F7" />;
        })}
        <Rect x={256} y={DECK - 54} width={64} height={4} rx={2} fill="#FFFFFF" />
        {[260, 286, 314].map((cx) => (
          <Rect key={cx} x={cx} y={DECK - 50} width={2} height={44} fill="#B9B0F7" />
        ))}
        <Rect x={256} y={DECK - 56} width={64} height={3} rx={1.5} fill={ob.violet} />
      </Layer>

      <Layer t={t} from={0.4} to={0.66} dy={6}>
        <Tree x={150} y={ROAD_Y} r={9} />
        <Tree x={236} y={SURFACE} r={8} a="#9ADDBE" b="#74C7A0" />
        <Lamp x={330} y={SURFACE} h={28} />
        <Passenger x={300} y={SURFACE} s={1} color={ob.indigo} step={1} bag={ob.mint} />
      </Layer>

      {/* faint full route, and the progress line that follows the train */}
      <Layer t={t} from={0.36} to={0.6} dy={0}>
        <Path d={RAIL_D} stroke={ob.violetSoft} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="1 7" opacity={0.9} />
      </Layer>
      <WipeReveal edgeX={lineEdge} visible={trainVis}>
        <Path d={RAIL_D} stroke={ob.violet} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </WipeReveal>
      <Ripple x={dx} y={dy} loop={loop} on={alertOn} color={ob.red} />
      {NODE_F.map((f, i) => {
        const [nx, ny] = nodePt(f);
        return (
          <NodeDot
            key={i}
            x={nx}
            y={ny}
            size={i === 3 ? 7.5 : 5.6}
            color={i === 3 ? ob.red : i < 2 ? ob.violet : ob.mint}
            ring={i === 3 ? ob.red : ob.indigo}
            lit={nodeLit}
            at={Math.max(0, f - 0.025)}
            span={0.025}
            pulse={i === 3 ? undefined : pulse}
            pulseFrom={i === 0 ? 0 : NODE_F[i - 1]}
            pulseTo={f - 0.025}
          />
        );
      })}

      <Vehicle track={TRACK} p={trainP} w={50} h={34} visible={trainVis} lag={100}>
        <MetroCarArt />
      </Vehicle>
      <Vehicle track={TRACK} p={trainP} w={50} h={34} visible={trainVis} lag={50}>
        <MetroCarArt />
      </Vehicle>
      <Vehicle track={TRACK} p={trainP} w={50} h={34} visible={trainVis}>
        <MetroCarArt front glow="#FFE3A3" />
      </Vehicle>
      <Vehicle track={BUS_TRACK} p={busP} w={68} h={34} visible={busVis} level>
        <BusArt />
      </Vehicle>

      {/* "you are here" + stop alert: a destination pin with a bell that rings when the train is close */}
      <Sprite x={dx - 16} y={dy - 70} w={32} h={44} animated={pin}>
        <Path d="M16 40 c-12 -13 -13 -20 -13 -24 a13 13 0 0 1 26 0 c0 4 -1 11 -13 24 Z" fill={ob.red} />
        <Circle cx={16} cy={16} r={5.4} fill="#FFFFFF" />
      </Sprite>
      <Sprite x={4} y={SURFACE - 40} w={30} h={36} origin="bottom" animated={swayB}>
        <Tree x={15} y={34} r={9} />
      </Sprite>
    </>
  );
}
