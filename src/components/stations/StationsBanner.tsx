import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/*
 * Header artwork for the Stations screen: a soft daytime skyline, a cable-stayed bridge, trees and a metro
 * train on a viaduct, fading into the page background. Original vector drawing, static.
 * Drawn in a 430 x 112 viewBox, anchored to the bottom of the header; the sky colour fills any extra height above it.
 */

const BG = '#F7F7FF';

export const SKY_TOP = '#C7DEF6';

export const StationsBanner = memo(function StationsBanner() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: SKY_TOP }]}>
      <Svg width="100%" viewBox="0 0 430 112" style={styles.art}>
        <Defs>
          <LinearGradient id="stb-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={SKY_TOP} />
            <Stop offset="0.65" stopColor="#E7F0FA" />
            <Stop offset="1" stopColor="#F4F7FD" />
          </LinearGradient>
          <LinearGradient id="stb-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={BG} stopOpacity={0} />
            <Stop offset="1" stopColor={BG} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="stb-left" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#EEF4FB" stopOpacity={0.94} />
            <Stop offset="0.7" stopColor="#EEF4FB" stopOpacity={0.7} />
            <Stop offset="1" stopColor="#EEF4FB" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={430} height={112} fill="url(#stb-sky)" />

        <G fill="#FFFFFF" opacity={0.85}>
          <Circle cx={96} cy={22} r={7} />
          <Circle cx={107} cy={19} r={9} />
          <Circle cx={120} cy={23} r={6} />
          <Circle cx={286} cy={14} r={6} />
          <Circle cx={296} cy={12} r={8} />
        </G>

        <G fill="#BCD0E6" opacity={0.75}>
          <Rect x={300} y={26} width={11} height={62} />
          <Rect x={313} y={40} width={9} height={48} />
          <Rect x={325} y={20} width={8} height={68} />
          <Rect x={386} y={44} width={12} height={44} />
          <Rect x={150} y={52} width={14} height={36} />
        </G>

        <G>
          <Rect x={160} y={64} width={100} height={26} fill="#D8B898" />
          <Rect x={168} y={58} width={84} height={7} fill="#E6CBAA" />
          <Path d="M188 58 Q210 22 232 58 Z" fill="#C99768" />
          <Rect x={208} y={14} width={3.5} height={10} fill="#B88A5E" />
          <Path d="M196 58 Q210 38 224 58 Z" fill="#B9855A" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Rect key={i} x={170 + i * 10} y={68} width={4.4} height={14} rx={2.2} fill="#A98462" opacity={0.7} />
          ))}
          {[0, 1].map((i) => (
            <G key={i}>
              <Rect x={166 + i * 76} y={46} width={9} height={14} fill="#D8B898" />
              <Path d={`M${164 + i * 76} 46 Q${170.5 + i * 76} 34 ${177 + i * 76} 46 Z`} fill="#C99768" />
            </G>
          ))}
        </G>

        <Rect x={0} y={88} width={150} height={10} fill="#B8D2EE" />
        <Rect x={0} y={84} width={156} height={3} fill="#F0F4FA" />
        <Rect x={0} y={87} width={156} height={1.2} fill="#8FAAD0" />
        {[14, 50, 86, 122].map((x) => (
          <Rect key={x} x={x} y={87} width={3} height={8} fill="#9CB4D6" />
        ))}
        <Rect x={62} y={30} width={4} height={55} fill="#DCE5F3" />
        <Path d="M64 34 L14 84 M64 34 L36 84 M64 34 L92 84 M64 34 L114 84 M64 38 L2 84" stroke="#B5C6E0" strokeWidth={0.9} fill="none" />
        <Rect x={0} y={0} width={270} height={112} fill="url(#stb-left)" />

        <G>
          {[
            [24, 86, 9],
            [140, 90, 8],
            [268, 92, 9],
            [284, 94, 7],
            [412, 76, 10],
            [100, 92, 6],
          ].map(([x, y, r]) => (
            <G key={`${x}-${y}`}>
              <Rect x={x - 1} y={y} width={2} height={9} fill="#7A6A55" />
              <Circle cx={x} cy={y - 1} r={r} fill="#5E9A62" />
              <Circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.6} fill="#79B27B" />
            </G>
          ))}
        </G>

        <Path d="M120 112 L430 74 V84 L120 122 Z" fill="#E8EBF5" />
        <Path d="M120 112 L430 74" stroke="#CDD3E6" strokeWidth={1.6} fill="none" />
        {[216, 296, 376].map((x) => (
          <Rect key={x} x={x - 3.5} y={112 - (x - 120) * 0.1226 + 8} width={7} height={30} rx={1.5} fill="#DDE2F0" />
        ))}
        <G transform="translate(176 90) rotate(-7)">
          <Rect x={0} y={-6} width={232} height={22} rx={8} fill="#FFFFFF" stroke="#D9DFEF" strokeWidth={0.8} />
          <Rect x={3} y={-1} width={226} height={8} rx={2.5} fill="#3D5FC7" />
          {Array.from({ length: 12 }, (_, i) => (
            <Rect key={i} x={8 + i * 17.6} y={0.5} width={10.5} height={5} rx={1.6} fill="#BFD6F5" />
          ))}
          <Rect x={0} y={9} width={232} height={2.6} fill="#4F35E8" />
          <Path d="M208 -6 H222 Q232 -6 232 3 V10 Q232 16 224 16 H208 Z" fill="#2C3E86" />
          <Path d="M214 -2 H224 Q228 -2 228 3 V6 H214 Z" fill="#BFD6F5" />
        </G>

        <Rect y={70} width={430} height={42} fill="url(#stb-fade)" />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  art: { position: 'absolute', left: 0, right: 0, bottom: 0, aspectRatio: 430 / 112 },
});
