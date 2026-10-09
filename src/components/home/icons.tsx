import React from 'react';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

/**
 * MetroMate's own train mark: a rounded front-on metro car with a windscreen, two lights and
 * little legs on the rails. Same stroke weight and round caps as the rest of the icon set.
 */
export function MetroTrainIcon({ size = 24, color = '#FFFFFF', strokeWidth = 1.8 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4.5} y={2.5} width={15} height={14.5} rx={4} />
      <Rect x={7.5} y={5.8} width={9} height={4.6} rx={1.4} />
      <Circle cx={8.6} cy={13.6} r={0.9} fill={color} stroke="none" />
      <Circle cx={15.4} cy={13.6} r={0.9} fill={color} stroke="none" />
      <Line x1={8} y1={17} x2={6} y2={21.5} />
      <Line x1={16} y1={17} x2={18} y2={21.5} />
      <Line x1={5} y1={21.5} x2={19} y2={21.5} />
    </Svg>
  );
}
