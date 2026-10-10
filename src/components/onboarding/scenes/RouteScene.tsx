import React from 'react';
import { Circle, G, Path, Polygon, Rect } from 'react-native-svg';
import { BusArt, MetroTrainArt } from '../art/shapes';
import { IsoBox, IsoTile, IsoTree, iso, isoLine } from '../art/iso';
import { Backdrop, Layer, RouteStroke, Sprite, StationNode, Vehicle, useFloat, useLoopProgress, useSceneClock } from '../motion/kit';
import { buildTrack, pointAt, stage, toPathD, type Pt } from '../motion/pathMath';
import { ob } from '../palette';
import type { SceneProps } from './types';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

/*
 * Scene 2: an isometric city block. Home station → elevated metro → interchange → street-level bus →
 * destination, drawn as one route that builds itself. Everything here is generic geometry: no fares,
 * times or places.
 */

const METRO_Z = 2.3;
const METRO_PTS = isoLine([[1.5, 3, METRO_Z], [6, 3, METRO_Z]]);
const BUS_PTS = isoLine([[6, 3, 0.05], [6, 7.5, 0.05], [7.1, 7.5, 0.05]]);
const METRO = buildTrack(METRO_PTS as Pt[]);
const BUS = buildTrack(BUS_PTS as Pt[]);
const START = iso(1.5, 3, METRO_Z);
const SWITCH = iso(6, 3, METRO_Z);
const SWITCH_GROUND = iso(6, 3, 0.05);
const DEST = iso(7.5, 7.5, 0);

const BLOCKS: { x: number; y: number; fill: string }[] = [];
for (const bx of [0.5, 3.5, 6.5]) for (const by of [0.5, 3.5, 6.5]) BLOCKS.push({ x: bx, y: by, fill: '#F4F1FF' });

const BUILDINGS = [
  { x: 3.8, y: 0.8, w: 1.2, d: 1.2, h: 2.4, fill: '#B9B0F7' },
  { x: 5.0, y: 1.6, w: 0.8, d: 0.8, h: 1.4, fill: '#CFC8F2' },
  { x: 6.8, y: 0.8, w: 1.4, d: 1.2, h: 1.8, fill: '#A89CEB' },
  { x: 7.2, y: 2.0, w: 0.9, d: 0.5, h: 0.8, fill: '#D6CFF7' },
  { x: 0.8, y: 4.0, w: 1.4, d: 1.3, h: 1.6, fill: '#C3B9EE' },
  { x: 1.3, y: 5.5, w: 1.0, d: 0.8, h: 2.8, fill: '#8F83DE' },
  { x: 3.9, y: 4.0, w: 1.3, d: 1.1, h: 1.2, fill: '#D6CFF7' },
  { x: 4.0, y: 5.2, w: 1.0, d: 0.7, h: 2.0, fill: '#B5ABEF' },
  { x: 6.8, y: 4.0, w: 1.4, d: 1.0, h: 2.2, fill: '#A89CEB' },
  { x: 1.0, y: 7.0, w: 1.2, d: 1.2, h: 1.0, fill: '#E0D9F7' },
  { x: 3.8, y: 7.0, w: 1.4, d: 1.2, h: 1.8, fill: '#C3B9EE' },
];
const TREES: [number, number][] = [[2.2, 0.9], [3.3, 2.2], [5.6, 0.8], [8.3, 3.2], [2.3, 4.6], [5.4, 4.5], [0.7, 6.6], [3.2, 8.2], [5.5, 8.2], [8.2, 5.4]];

function arrowAt(track: ReturnType<typeof buildTrack>, f: number, color: string, size = 5): React.ReactElement {
  const [x, y, a] = pointAt(track, track.total * f);
  const c = Math.cos(a);
  const s = Math.sin(a);
  const p = (dx: number, dy: number): [number, number] => [x + dx * c - dy * s, y + dx * s + dy * c];
  const pts = [p(size, 0), p(-size * 0.6, -size * 0.8), p(-size * 0.6, size * 0.8)];
  return <Polygon key={`${f}`} points={pts.map((q) => q.join(',')).join(' ')} fill={color} />;
}

/** The little route card that floats over the city: start dot, metro segment, interchange, bus segment, pin. */
function RouteCard({ t, float }: { t: SharedValue<number>; float: object }) {
  return (
    <Sprite x={96} y={46} w={168} h={64} animated={float}>
      <Rect x={2} y={4} width={164} height={52} rx={22} fill={ob.violet} opacity={0.1} />
      <Rect x={1} y={1} width={166} height={52} rx={22} fill="#FFFFFF" stroke={ob.lavenderDeep} strokeWidth={1.2} />
      <Path d="M62 52 l8 9 l8 -9 Z" fill="#FFFFFF" />
      <Circle cx={26} cy={27} r={7} fill={ob.mint} />
      <Rect x={36} y={24.2} width={44} height={5.6} rx={2.8} fill={ob.violet} />
      <Circle cx={88} cy={27} r={8} fill="#FFFFFF" stroke={ob.indigo} strokeWidth={3} />
      <Rect x={98} y={24.2} width={34} height={5.6} rx={2.8} fill={ob.blue} />
      <Path d="M146 36 c-8 -9 -8 -14 0 -14 c8 0 8 5 0 14 Z" fill={ob.red} transform="translate(0 -1)" />
      <Circle cx={146} cy={22} r={2.6} fill="#FFFFFF" />
    </Sprite>
  );
}

export function RouteScene({ active, reduced }: SceneProps) {
  const { t, loop } = useSceneClock(active, reduced, 5200, 9000);
  const pulse = useLoopProgress(loop, 3);
  const float = useFloat(loop, 2, 0, 2);
  const metroP = useDerivedValue(() => stage(t.value, 0.3, 0.58));
  const busP = useDerivedValue(() => stage(t.value, 0.62, 0.9));
  const metroVis = useDerivedValue<number>(() => (t.value > 0.28 && t.value < 0.62 ? 1 : 0));
  const busVis = useDerivedValue<number>(() => (t.value > 0.6 ? 1 : 0));

  return (
    <>
      <Backdrop depth={0.2}>
        <Rect x={-60} y={0} width={480} height={440} fill="#E9E7FF" />
        <Circle cx={180} cy={250} r={230} fill="#F1EEFF" />
        <Circle cx={180} cy={250} r={160} fill="#F6F4FF" />
      </Backdrop>

      <Layer t={t} from={0.0} to={0.16} dy={22} depth={0.08}>
        {/* slab edges */}
        <Polygon points={`${iso(0, 9).join(',')} ${iso(9, 9).join(',')} ${iso(9, 9)[0]},${iso(9, 9)[1] + 15} ${iso(0, 9)[0]},${iso(0, 9)[1] + 15}`} fill="#B9B0F7" />
        <Polygon points={`${iso(9, 0).join(',')} ${iso(9, 9).join(',')} ${iso(9, 9)[0]},${iso(9, 9)[1] + 15} ${iso(9, 0)[0]},${iso(9, 0)[1] + 15}`} fill="#9387E2" />
        <IsoTile x={0} y={0} w={9} d={9} fill="#DAD6F5" />
        {BLOCKS.map((b, i) => (
          <IsoTile key={i} x={b.x} y={b.y} w={2} d={2} fill={i === 4 ? '#D4F1E3' : b.fill} />
        ))}
        {/* street centre dashes */}
        <Path d={`M${iso(3, 0.3).join(' ')} L${iso(3, 8.7).join(' ')} M${iso(6, 0.3).join(' ')} L${iso(6, 8.7).join(' ')} M${iso(0.3, 3).join(' ')} L${iso(8.7, 3).join(' ')} M${iso(0.3, 6).join(' ')} L${iso(8.7, 6).join(' ')}`} stroke="#FFFFFF" strokeWidth={1.6} strokeDasharray="5 6" opacity={0.85} />
      </Layer>

      <Layer t={t} from={0.1} to={0.34} dy={26} depth={0.04}>
        {BUILDINGS.map((b, i) => (
          <IsoBox key={i} {...b} seed={i} />
        ))}
        {/* home: a small house with a pitched roof at the start */}
        <IsoBox x={0.9} y={0.9} w={1.2} d={1.1} h={0.9} fill="#F6D3E8" windows={false} />
        <Polygon points={`${iso(0.8, 0.8, 0.9).join(',')} ${iso(1.5, 0.8, 1.5).join(',')} ${iso(2.2, 0.8, 0.9).join(',')}`} fill={ob.red} opacity={0.0} />
        <Polygon points={`${iso(0.85, 2.1, 0.9).join(',')} ${iso(1.5, 2.1, 1.55).join(',')} ${iso(2.15, 2.1, 0.9).join(',')}`} fill="#F0838A" />
        <Polygon points={`${iso(2.15, 0.85, 0.9).join(',')} ${iso(2.15, 2.1, 0.9).join(',')} ${iso(1.5, 2.1, 1.55).join(',')} ${iso(1.5, 0.85, 1.55).join(',')}`} fill="#E36E78" />
        {/* destination: tall glass tower with a flag */}
        <IsoBox x={7.0} y={7.0} w={1.1} d={1.1} h={3.0} fill="#8F83DE" seed={4} />
        <IsoBox x={7.0} y={7.0} w={1.1} d={1.1} h={0.12} z={3.0} fill="#FFFFFF" windows={false} />
        {TREES.map(([x, y], i) => (
          <IsoTree key={i} x={x} y={y} r={6 + (i % 3)} />
        ))}
      </Layer>

      {/* elevated metro track along y = 3 with piers */}
      <Layer t={t} from={0.2} to={0.4} dy={14} depth={0.03}>
        {[1, 2.5, 4, 5.5, 7, 8.4].map((x) => {
          const [bx, by] = iso(x, 3, 0);
          const [tx, ty] = iso(x, 3, METRO_Z - 0.25);
          return <Path key={x} d={`M${bx - 3} ${by} L${tx - 3} ${ty} H${tx + 3} L${bx + 3} ${by} Z`} fill="#9387E2" />;
        })}
        <Polygon points={`${iso(0.4, 3.22, METRO_Z - 0.25).join(',')} ${iso(8.6, 3.22, METRO_Z - 0.25).join(',')} ${iso(8.6, 3.22, METRO_Z).join(',')} ${iso(0.4, 3.22, METRO_Z).join(',')}`} fill="#B9B0F7" />
        <Polygon points={`${iso(0.4, 2.78, METRO_Z).join(',')} ${iso(8.6, 2.78, METRO_Z).join(',')} ${iso(8.6, 3.22, METRO_Z).join(',')} ${iso(0.4, 3.22, METRO_Z).join(',')}`} fill="#E2DDFB" />
        {/* interchange structure: a small platform and stairs from the track down to the street */}
        <IsoBox x={5.55} y={2.55} w={0.9} d={0.9} h={0.18} z={0.05} fill="#FFFFFF" windows={false} />
        <Path d={`M${SWITCH[0]} ${SWITCH[1] + 4} L${SWITCH_GROUND[0]} ${SWITCH_GROUND[1]}`} stroke={ob.indigo} strokeWidth={2} opacity={0.5} />
      </Layer>

      {/* the route: violet on the elevated track, blue along the street */}
      <Layer t={t} from={0.0} to={0.01}>
                <RouteStroke d={toPathD(METRO_PTS as Pt[])} length={METRO.total} draw={t} from={0.16} to={0.52} color={ob.violet} width={5} />
        <RouteStroke d={toPathD(BUS_PTS as Pt[])} length={BUS.total} draw={t} from={0.54} to={0.86} color={ob.blue} width={5} />
        {arrowAt(METRO, 0.35, '#FFFFFF')}
        {arrowAt(METRO, 0.75, '#FFFFFF')}
        {arrowAt(BUS, 0.28, '#FFFFFF')}
        {arrowAt(BUS, 0.62, '#FFFFFF')}
        {arrowAt(BUS, 0.93, '#FFFFFF', 4)}
        <StationNode x={START[0]} y={START[1]} size={7} color={ob.mint} lit={t} at={0.0} span={0.1} pulse={pulse} />
        <StationNode x={SWITCH[0]} y={SWITCH[1]} size={7} color={ob.violet} lit={t} at={0.5} span={0.06} pulse={pulse} />
        <StationNode x={DEST[0]} y={DEST[1] + 2} size={7} color={ob.red} lit={t} at={0.88} span={0.08} pulse={pulse} />
      </Layer>

      <Vehicle track={METRO} p={metroP} w={150} h={34} visible={metroVis}>
        <G transform="scale(0.42)">
          <MetroTrainArt glow="#FFE3A3" />
        </G>
      </Vehicle>
      <Vehicle track={BUS} p={busP} w={68} h={34} visible={busVis}>
        <G transform="scale(0.55)">
          <BusArt />
        </G>
      </Vehicle>

      <RouteCard t={t} float={float} />
    </>
  );
}
