import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/* Original vector artwork for the Live screen. No photographs, no third-party artwork. */

/**
 * "Improve station positions": a platform scene with a train and two travellers, and a phone
 * showing a map with a location pin in front of it.
 */
export function PositionArt({ width, height, radius }: { width: number; height: number; radius: number }) {
  return (
    <View style={{ width, height, borderRadius: radius, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height} viewBox="0 0 115 108" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="pa-bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#EAE8FB" />
            <Stop offset="1" stopColor="#D9D6F4" />
          </LinearGradient>
          <LinearGradient id="pa-phone" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#4F46C8" />
            <Stop offset="1" stopColor="#2B2790" />
          </LinearGradient>
          <LinearGradient id="pa-screen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F6F6FE" />
            <Stop offset="1" stopColor="#E7E8F8" />
          </LinearGradient>
          <RadialGradient id="pa-pulse" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
            <Stop offset="0" stopColor="#34C58A" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#34C58A" stopOpacity="0" />
          </RadialGradient>
          <ClipPath id="pa-clip">
            <Rect x={0} y={0} width={115} height={108} />
          </ClipPath>
        </Defs>
        <Rect x={0} y={0} width={115} height={108} fill="url(#pa-bg)" />

        {/* platform scene */}
        <G clipPath="url(#pa-clip)">
          {/* distant skyline */}
          {[[2, 36, 9], [12, 28, 8], [21, 40, 10], [88, 34, 9], [98, 26, 8], [107, 38, 10]].map(([x, y, w]) => (
            <Rect key={x} x={x} y={y} width={w} height={70 - y} rx={1.4} fill="#C9C6EE" opacity={0.7} />
          ))}
          {/* canopy and lamp */}
          <Path d="M0 12 H40" stroke="#B9B5E6" strokeWidth={3.4} strokeLinecap="round" />
          <Rect x={30} y={13} width={2} height={44} fill="#C3BFEA" />
          <Circle cx={31} cy={9} r={4} fill="#DCD9F6" />
          {/* train at the platform */}
          <Rect x={0} y={44} width={34} height={40} rx={5} fill="#F3F2FD" />
          <Rect x={4} y={50} width={14} height={30} rx={2} fill="#B9C1EA" />
          <Rect x={20} y={50} width={11} height={30} rx={2} fill="#C9CEF0" />
          <Rect x={0} y={64} width={34} height={3.6} fill="#6A55F0" />
          {/* platform floor */}
          <Rect x={0} y={84} width={115} height={24} fill="#CFCBF0" />
          <Rect x={0} y={84} width={115} height={2.6} fill="#BDB8E8" />
          {/* travellers */}
          <G>
            <Circle cx={21} cy={61} r={3} fill="#7E6BE8" />
            <Path d="M17 66 Q21 63.5 25 66 L25.6 80 H16.4 Z" fill="#5446D6" />
            <Rect x={18} y={80} width={2.6} height={8} fill="#3B3697" />
            <Rect x={21.6} y={80} width={2.6} height={8} fill="#3B3697" />
          </G>
          <G>
            <Circle cx={103} cy={63} r={2.8} fill="#9AA6F0" />
            <Path d="M99.4 67.6 Q103 65.6 106.6 67.6 L107 80 H99 Z" fill="#7C86E6" />
            <Rect x={100.4} y={80} width={2.2} height={7} fill="#4F58B8" />
            <Rect x={103.4} y={80} width={2.2} height={7} fill="#4F58B8" />
          </G>
        </G>

        {/* phone */}
        <G transform="translate(74 54) rotate(8) translate(-24 -52)">
          <Rect x={2} y={4} width={48} height={102} rx={9} fill="#000000" opacity={0.12} />
          <Rect x={0} y={0} width={48} height={102} rx={9} fill="url(#pa-phone)" />
          <Rect x={3} y={3} width={42} height={96} rx={7} fill="url(#pa-screen)" />
          <Rect x={16} y={5} width={16} height={3.4} rx={1.7} fill="#2B2790" />
          {/* map: blocks, roads, park */}
          <G>
            {[[6, 12, 16, 14], [26, 12, 15, 14], [6, 30, 12, 16], [22, 30, 19, 16], [6, 52, 16, 14], [26, 52, 15, 14], [6, 70, 14, 18], [24, 70, 17, 18]].map(([x, y, w, h]) => (
              <Rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx={2} fill="#FFFFFF" opacity={0.95} />
            ))}
            <Path d="M24 10 V92 M4 28 H44 M4 49 H44 M4 68 H44" stroke="#D9DCF2" strokeWidth={1.6} />
            <Path d="M4 80 Q20 60 44 56" stroke="#FFFFFF" strokeWidth={3.2} fill="none" strokeLinecap="round" />
            <Ellipse cx={24} cy={48} rx={14} ry={11} fill="#BFE9D2" opacity={0.85} />
          </G>
          {/* location pin with pulse */}
          <Circle cx={24} cy={46} r={15} fill="url(#pa-pulse)" />
          <Ellipse cx={24} cy={54} rx={5} ry={1.6} fill="#2B2790" opacity={0.25} />
          <Path d="M24 53 C18 45 17 42 17 38.5 A7 7 0 0 1 31 38.5 C31 42 30 45 24 53 Z" fill="#4F35E8" />
          <Circle cx={24} cy={38.5} r={2.8} fill="#FFFFFF" />
        </G>
      </Svg>
    </View>
  );
}
