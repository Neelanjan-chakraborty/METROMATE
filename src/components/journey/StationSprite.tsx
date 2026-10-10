import React, { memo } from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { COLORS, type LandmarkKind } from './sceneConfig';

/* Miniature stations and landmarks, seen from above in 2.5D. Original vector drawing. */

export type StationState = 'done' | 'current' | 'next' | 'upcoming';

export const STATION_BOX = 110;

interface StationProps {
  heading: number;
  underground: boolean;
  interchange: boolean;
  state: StationState;
  isOrigin: boolean;
  isDestination: boolean;
  /** Corridor colour, used for the canopy ridge. */
  color: string;
}

/** Station structure centred in a STATION_BOX square. The track runs along the sprite's vertical axis. */
export const StationSprite = memo(function StationSprite({ heading, underground, interchange, state, isOrigin, isDestination, color }: StationProps) {
  const done = state === 'done';
  const canopy = done ? '#E3DFFA' : '#EEEBFF';
  const platform = done ? '#E8E5FA' : '#F7F6FF';
  const c = STATION_BOX / 2;
  return (
    <Svg width={STATION_BOX} height={STATION_BOX} viewBox={`${-c} ${-c} ${STATION_BOX} ${STATION_BOX}`}>
      <G rotation={heading}>
        {/* shadow */}
        <Rect x={-14} y={-21} width={30} height={46} rx={5} fill={COLORS.deckShadow} opacity={0.22} />
        {underground ? (
          <G>
            <Rect x={-15} y={-22} width={30} height={44} rx={6} fill="none" stroke="#8A8FBE" strokeWidth={1.1} strokeDasharray="3 3" opacity={0.8} />
            {/* entrance kiosk with stair */}
            <Rect x={19} y={-9} width={17} height={18} rx={3} fill="#D8D2F4" stroke="#B9B3E2" strokeWidth={0.8} />
            <Rect x={21} y={-6} width={13} height={4} rx={1} fill="#F5F3FF" />
            {[0, 1, 2, 3].map((i) => (
              <Rect key={i} x={22 + i * 3} y={0.5} width={1.6} height={6} fill="#B9B3E2" />
            ))}
            <Path d="M15 0 H19" stroke="#B9B3E2" strokeWidth={2.4} />
          </G>
        ) : (
          <G>
            {/* side platforms with safety lines */}
            <Rect x={-15} y={-20} width={9} height={40} rx={1.6} fill={platform} stroke={COLORS.deckEdge} strokeWidth={0.8} />
            <Rect x={6} y={-20} width={9} height={40} rx={1.6} fill={platform} stroke={COLORS.deckEdge} strokeWidth={0.8} />
            <Rect x={-7.2} y={-20} width={1} height={40} fill="#F5C84C" opacity={0.9} />
            <Rect x={6.2} y={-20} width={1} height={40} fill="#F5C84C" opacity={0.9} />
            {/* canopy */}
            <Rect x={-17} y={-15} width={34} height={30} rx={5} fill={canopy} opacity={0.93} stroke="#CFCBEE" strokeWidth={0.8} />
            <Rect x={-1} y={-15} width={2} height={30} fill={color} opacity={0.55} />
            {[-9, -3, 3, 9].map((y) => (
              <Rect key={y} x={-17} y={y} width={34} height={0.8} fill="#CFCBEE" opacity={0.9} />
            ))}
            {/* entrance block with stair, linked by a footbridge */}
            <Rect x={17} y={-1.4} width={9} height={2.8} fill="#D4D6EE" />
            <Rect x={25} y={-10} width={17} height={20} rx={3} fill="#E0DCF6" stroke="#C4C0E8" strokeWidth={0.8} />
            <Rect x={27} y={-7} width={13} height={4.4} rx={1.2} fill="#FFFFFF" opacity={0.85} />
            {[0, 1, 2, 3].map((i) => (
              <Rect key={i} x={28 + i * 3} y={0.5} width={1.6} height={7} fill="#BDB8E6" />
            ))}
          </G>
        )}
        {interchange ? (
          <G>
            {/* a second canopy crossing the first: change here */}
            <Rect x={-30} y={-5.5} width={60} height={11} rx={4} fill="#E4E0FB" opacity={0.9} stroke="#CFCBEE" strokeWidth={0.8} />
            <Rect x={-30} y={-0.5} width={60} height={1.2} fill="#F59E0B" opacity={0.7} />
          </G>
        ) : null}
      </G>
      {/* markers stay upright */}
      {interchange ? (
        <G>
          <Circle cx={-27} cy={-27} r={8.2} fill="#F59E0B" stroke="#FFFFFF" strokeWidth={1.6} />
          <Path d="M-31 -29 H-23 M-25 -31.6 L-22.4 -29 L-25 -26.4 M-23 -25 H-31 M-29 -22.4 L-31.6 -25 L-29 -27.6" stroke="#FFFFFF" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      ) : null}
      {isDestination ? (
        <G>
          <Rect x={25} y={-44} width={1.8} height={20} rx={0.9} fill="#14163F" />
          <Polygon points="26.8,-44 40,-39.5 26.8,-35" fill="#D92D20" />
          <Circle cx={26} cy={-23.5} r={2.6} fill="#14163F" />
        </G>
      ) : null}
      {isOrigin && !isDestination ? (
        <G>
          <Rect x={25} y={-44} width={1.8} height={20} rx={0.9} fill="#14163F" />
          <Polygon points="26.8,-44 40,-39.5 26.8,-35" fill="#22B573" />
          <Circle cx={26} cy={-23.5} r={2.6} fill="#14163F" />
        </G>
      ) : null}
      {done ? (
        <G>
          <Circle cx={0} cy={-31} r={6.2} fill={COLORS.progress} stroke="#FFFFFF" strokeWidth={1.5} />
          <Path d="M-3 -31 L-0.8 -28.8 L3.2 -33.2" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      ) : null}
    </Svg>
  );
});

/** Lit underground platform, shown in the cutaway (the surface sprite only shows the entrance). */
export const UndergroundPlatform = memo(function UndergroundPlatform({ heading }: { heading: number }) {
  const c = STATION_BOX / 2;
  return (
    <Svg width={STATION_BOX} height={STATION_BOX} viewBox={`${-c} ${-c} ${STATION_BOX} ${STATION_BOX}`}>
      <G rotation={heading}>
        <Rect x={-20} y={-27} width={40} height={54} rx={7} fill="#0E1038" opacity={0.55} />
        <Rect x={-18} y={-25} width={36} height={50} rx={6} fill="#23266A" stroke="#6B70D8" strokeWidth={1} />
        <Rect x={-16} y={-23} width={9} height={46} rx={2} fill="#343A9C" />
        <Rect x={7} y={-23} width={9} height={46} rx={2} fill="#343A9C" />
        <Rect x={-7.2} y={-23} width={1} height={46} fill="#F5C84C" opacity={0.85} />
        <Rect x={6.2} y={-23} width={1} height={46} fill="#F5C84C" opacity={0.85} />
        {[-18, -9, 0, 9, 18].map((y) => (
          <G key={y}>
            <Circle cx={-11.5} cy={y} r={2.4} fill="#CFC9FF" opacity={0.2} />
            <Circle cx={-11.5} cy={y} r={0.9} fill="#F1EEFF" />
            <Circle cx={11.5} cy={y} r={2.4} fill="#CFC9FF" opacity={0.2} />
            <Circle cx={11.5} cy={y} r={0.9} fill="#F1EEFF" />
          </G>
        ))}
      </G>
    </Svg>
  );
});

/** Name tag shown beside a station. */
export const LABEL_H = 20;
const LABEL_FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' : undefined;
export const labelWidth = (name: string) => Math.round(name.length * 5.9 + 20);

export const StationLabel = memo(function StationLabel({ name, state }: { name: string; state: StationState }) {
  const w = labelWidth(name);
  const strong = state === 'next' || state === 'current';
  return (
    <Svg width={w} height={LABEL_H} viewBox={`0 0 ${w} ${LABEL_H}`}>
      <Rect x={0.5} y={1} width={w - 1} height={LABEL_H - 3} rx={8} fill="#FFFFFF" opacity={0.93} stroke={strong ? COLORS.progress : '#D9DCF0'} strokeWidth={strong ? 1.4 : 0.9} />
      <SvgText x={w / 2} y={13.4} fontFamily={LABEL_FONT} fontSize={10.4} fontWeight={strong ? '800' : '700'} fill={state === 'done' ? '#78839D' : COLORS.navy} textAnchor="middle">
        {name}
      </SvgText>
    </Svg>
  );
});

// ----------------------------------------------------------------- landmarks

export const LANDMARK_BOX = 76;

/** 2.5D landmark drawn beside a station: soft shadow, then roof. Shapes are illustrative. */
export const LandmarkSprite = memo(function LandmarkSprite({ kind }: { kind: LandmarkKind }) {
  const c = LANDMARK_BOX / 2;
  const sh = '#9EA3CB';
  return (
    <Svg width={LANDMARK_BOX} height={LANDMARK_BOX} viewBox={`${-c} ${-c} ${LANDMARK_BOX} ${LANDMARK_BOX}`} opacity={0.96}>
      {kind === 'stadium' ? (
        <G>
          <Rect x={-26} y={-18} width={56} height={42} rx={21} fill={sh} opacity={0.35} />
          <Rect x={-30} y={-24} width={56} height={42} rx={21} fill="#D6D9F2" stroke="#BFC3E6" strokeWidth={1} />
          <Rect x={-24} y={-18} width={44} height={30} rx={15} fill="#C5E8D3" stroke="#FFFFFF" strokeWidth={1.4} />
          <Rect x={-8} y={-10} width={12} height={14} fill="none" stroke="#FFFFFF" strokeWidth={1} opacity={0.9} />
        </G>
      ) : null}
      {kind === 'temple' ? (
        <G>
          <Polygon points="-18,24 20,24 26,30 -12,30" fill={sh} opacity={0.35} />
          <Rect x={-22} y={-4} width={44} height={28} rx={3} fill="#EADFD2" stroke="#D6C7B6" strokeWidth={1} />
          <Polygon points="0,-30 12,-4 -12,-4" fill="#E4CDB4" />
          <Polygon points="0,-30 12,-4 0,-6" fill="#D1B494" />
          <Circle cx={0} cy={8} r={6} fill="#F6EEE4" />
          <Circle cx={-16} cy={0} r={3.4} fill="#E4CDB4" />
          <Circle cx={16} cy={0} r={3.4} fill="#E4CDB4" />
        </G>
      ) : null}
      {kind === 'hall' ? (
        <G>
          <Rect x={-24} y={-12} width={54} height={36} rx={4} fill={sh} opacity={0.3} />
          <Rect x={-28} y={-16} width={54} height={36} rx={4} fill="#E0DDF4" stroke="#C8C4E8" strokeWidth={1} />
          <Circle cx={-1} cy={2} r={14} fill="#F0EEFC" stroke="#CFCBEE" strokeWidth={1} />
          <Circle cx={-1} cy={2} r={8} fill="#D8D3F3" />
          <Circle cx={-1} cy={2} r={2.6} fill="#FFFFFF" />
        </G>
      ) : null}
      {kind === 'secretariat' ? (
        <G>
          <Rect x={-26} y={-6} width={56} height={30} rx={2} fill={sh} opacity={0.3} />
          <Rect x={-30} y={-12} width={56} height={14} rx={2} fill="#DCE1F4" stroke="#C3CAE9" strokeWidth={1} />
          <Rect x={-30} y={6} width={56} height={14} rx={2} fill="#E5E1F4" stroke="#CDC8E8" strokeWidth={1} />
          <Rect x={-8} y={-12} width={12} height={32} rx={2} fill="#C7CCF0" />
          <Rect x={-4} y={-4} width={4} height={16} fill="#FFFFFF" opacity={0.7} />
        </G>
      ) : null}
      {kind === 'campus' ? (
        <G>
          <Rect x={-26} y={-8} width={56} height={34} rx={3} fill={sh} opacity={0.28} />
          <Rect x={-30} y={-14} width={22} height={18} rx={2} fill="#E2DEF4" stroke="#CDC8E8" strokeWidth={1} />
          <Rect x={2} y={-14} width={26} height={18} rx={2} fill="#DDE5F4" stroke="#C6CFE9" strokeWidth={1} />
          <Rect x={-14} y={8} width={28} height={14} rx={2} fill="#E8E2D6" stroke="#D4CDBB" strokeWidth={1} />
          <Rect x={-6} y={-2} width={12} height={8} fill="#CDEADB" />
        </G>
      ) : null}
      {kind === 'towers' ? (
        <G>
          <Polygon points="-14,-8 -4,-8 8,14 -2,14" fill={sh} opacity={0.35} />
          <Polygon points="6,-14 16,-14 26,10 16,10" fill={sh} opacity={0.35} />
          <Rect x={-18} y={-22} width={18} height={30} rx={2} fill="#C7CCF0" stroke="#B3B9E6" strokeWidth={1} />
          <Rect x={-14} y={-18} width={10} height={10} fill="#FFFFFF" opacity={0.55} />
          <Rect x={4} y={-28} width={20} height={34} rx={2} fill="#D4CBEE" stroke="#BFB4E3" strokeWidth={1} />
          <Rect x={8} y={-24} width={12} height={12} fill="#FFFFFF" opacity={0.55} />
        </G>
      ) : null}
      {kind === 'court' ? (
        <G>
          <Rect x={-24} y={-8} width={56} height={30} rx={2} fill={sh} opacity={0.3} />
          <Rect x={-28} y={-14} width={56} height={30} rx={2} fill="#E9E4D9" stroke="#D3CCBB" strokeWidth={1} />
          {[-22, -12, -2, 8, 18].map((x) => (
            <Rect key={x} x={x} y={-12} width={3.4} height={26} fill="#F8F4EC" />
          ))}
          <Polygon points="-28,-14 28,-14 0,-24" fill="#D9D1C0" />
        </G>
      ) : null}
      {kind === 'railway' ? (
        <G>
          <Rect x={-30} y={-12} width={62} height={32} rx={3} fill={sh} opacity={0.25} />
          <Rect x={-34} y={-18} width={62} height={32} rx={3} fill="#E3E1F2" stroke="#CBC9E6" strokeWidth={1} />
          {[-8, -2, 4].map((y) => (
            <Rect key={y} x={-30} y={y} width={54} height={2.2} fill="#9A9EC8" opacity={0.8} />
          ))}
          <Rect x={-30} y={-14} width={54} height={5} fill="#C8C4E8" />
        </G>
      ) : null}
      {kind === 'market' ? (
        <G>
          <Rect x={-28} y={-6} width={58} height={30} rx={2} fill={sh} opacity={0.28} />
          {[-30, -12, 6].map((x) => (
            <Rect key={x} x={x} y={-12} width={16} height={30} rx={2} fill="#E8DFD0" stroke="#D3C8B4" strokeWidth={1} />
          ))}
          {[-30, -12, 6].map((x) => (
            <Rect key={`r${x}`} x={x + 7} y={-12} width={1.6} height={30} fill="#CBBFA8" />
          ))}
        </G>
      ) : null}
      {kind === 'tvtower' ? (
        <G>
          <Polygon points="-4,-2 4,-2 18,24 10,24" fill={sh} opacity={0.35} />
          <Circle cx={0} cy={0} r={12} fill="#DCE1F4" stroke="#C3CAE9" strokeWidth={1} />
          <Circle cx={0} cy={0} r={6} fill="#C7CCF0" />
          <Circle cx={0} cy={0} r={2} fill="#4F35E8" />
          <Path d="M0 0 L0 -26" stroke="#9AA0D2" strokeWidth={1.6} />
        </G>
      ) : null}
      {kind === 'factory' ? (
        <G>
          <Rect x={-26} y={-4} width={56} height={28} rx={2} fill={sh} opacity={0.28} />
          <Rect x={-30} y={-10} width={56} height={28} rx={2} fill="#E4E1F0" stroke="#CDCAE4" strokeWidth={1} />
          {[-24, -10, 4].map((x) => (
            <Polygon key={x} points={`${x},-10 ${x + 12},-10 ${x + 12},2 ${x},-4`} fill="#D3D0E8" />
          ))}
          <Rect x={16} y={-22} width={6} height={14} rx={2} fill="#B9BCDD" />
        </G>
      ) : null}
    </Svg>
  );
});
