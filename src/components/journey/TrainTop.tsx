import React, { memo } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

/**
 * A metro train seen from directly above, nose pointing up (north) at rotation 0: three carriages,
 * roof equipment, a pantograph, a lit driver's cab with headlights and a chevron showing the direction
 * of travel. Original vector drawing. The caller rotates it to the track heading.
 */
export const TRAIN_W = 30;
export const TRAIN_H = 78;

interface Props {
  /** 0..1: how strongly the headlights shine (dusk, night, tunnels). */
  beam?: number;
  /** Dashed halo: this position is an estimate, not a GPS fix. */
  estimated?: boolean;
}

export const TrainTop = memo(function TrainTop({ beam = 0, estimated = false }: Props) {
  const cars = [0, 1, 2];
  return (
    <Svg width={TRAIN_W} height={TRAIN_H} viewBox="-15 -39 30 78">
      <Defs>
        <LinearGradient id="tt-roof" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.55" stopColor="#F1EFFF" />
          <Stop offset="1" stopColor="#DAD6F4" />
        </LinearGradient>
        <LinearGradient id="tt-beam" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#FFF1B8" stopOpacity="0.85" />
          <Stop offset="1" stopColor="#FFF1B8" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {beam > 0.05 ? <Polygon points="-4,-31 4,-31 12,-39 -12,-39" fill="url(#tt-beam)" opacity={beam} /> : null}
      {estimated ? <Rect x={-12.5} y={-35} width={25} height={70} rx={9} fill="none" stroke="#4F35E8" strokeWidth={1.2} strokeDasharray="3 3" opacity={0.7} /> : null}
      {/* ground shadow */}
      <G opacity={0.24}>
        <Rect x={-3.5} y={-24} width={11} height={60} rx={4} fill="#14163F" />
      </G>
      {cars.map((i) => {
        const y0 = -29 + i * 20;
        const isHead = i === 0;
        return (
          <G key={i}>
            {isHead ? (
              <Path d={`M-5.6 ${y0 + 18} V${y0 + 5} Q-5.6 ${y0 - 3} 0 ${y0 - 3.5} Q5.6 ${y0 - 3} 5.6 ${y0 + 5} V${y0 + 18} Z`} fill="url(#tt-roof)" stroke="#C9C5EA" strokeWidth={0.7} />
            ) : (
              <Rect x={-5.6} y={y0} width={11.2} height={18} rx={2.6} fill="url(#tt-roof)" stroke="#C9C5EA" strokeWidth={0.7} />
            )}
            {/* roof equipment */}
            <Rect x={-3.6} y={y0 + (isHead ? 7 : 3)} width={7.2} height={4} rx={1.2} fill="#D3CFEF" />
            <Rect x={-3.6} y={y0 + (isHead ? 12.5 : 9)} width={7.2} height={4} rx={1.2} fill="#D3CFEF" />
            {i === 1 ? (
              <G stroke="#8D88BE" strokeWidth={0.9} strokeLinecap="round">
                <Path d={`M-3 ${y0 + 6} L0 ${y0 + 2.5} L3 ${y0 + 6}`} fill="none" />
                <Path d={`M-3 ${y0 + 6} L0 ${y0 + 9.5} L3 ${y0 + 6}`} fill="none" />
              </G>
            ) : null}
            {/* livery stripe */}
            <Rect x={-0.7} y={y0 + (isHead ? 0 : 0)} width={1.4} height={18} fill="#6A55F0" opacity={0.85} />
            {/* highlight */}
            <Rect x={-5} y={y0 + 1.5} width={1} height={15} rx={0.5} fill="#FFFFFF" opacity={0.8} />
            {i < 2 ? <Rect x={-2.2} y={y0 + 18} width={4.4} height={2} fill="#3A3F6B" /> : null}
          </G>
        );
      })}
      {/* leading cab: windscreen, lights, direction chevron */}
      <Path d="M-4.2 -26 Q0 -29 4.2 -26 L3.4 -22 H-3.4 Z" fill="#243059" />
      <Path d="M-3.2 -25.2 Q0 -27.2 1.8 -26.2" stroke="#FFFFFF" strokeWidth={0.5} fill="none" opacity={0.55} />
      <Circle cx={-3.4} cy={-30.6} r={1.1} fill="#FFD66B" />
      <Circle cx={3.4} cy={-30.6} r={1.1} fill="#FFD66B" />
      <Polygon points="0,-20 4,-14.5 0,-16.2 -4,-14.5" fill="#4F35E8" />
      {/* tail cab */}
      <Rect x={-3.8} y={29.4} width={7.6} height={2.4} rx={1} fill="#243059" />
      <Circle cx={-3.4} cy={32.6} r={0.9} fill="#FF5A47" />
      <Circle cx={3.4} cy={32.6} r={0.9} fill="#FF5A47" />
    </Svg>
  );
});
