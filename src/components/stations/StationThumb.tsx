import React, { memo, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { mixColor } from '../../lib/skyPalette';
import { stationPhoto } from './photos';

/*
 * Station thumbnail. When a free-licensed photo has been fetched (scripts/fetch-station-thumbs.mjs) the
 * bundled, pre-compressed WebP is shown. Otherwise a small original illustration is drawn: an elevated
 * station on a viaduct, or an underground entrance, tinted with the line colour. The illustration is
 * generic (the skyline varies by station id only so rows look different); it is not a picture of the
 * station and the detail screen says so.
 */

export interface ThumbStation {
  id: string;
  name: string;
  stationType: 'elevated' | 'underground' | 'unknown';
}

interface Props {
  station: ThumbStation;
  color: string;
  width: number;
  height: number;
  radius: number;
  /** Fill the parent's width at this width/height ratio instead of a fixed size. */
  fluid?: boolean;
}

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Does this station have a bundled photo? */
export function hasStationPhoto(id: string): boolean {
  return stationPhoto(id) !== null;
}

export const StationThumb = memo(function StationThumb({ station, color, width, height, radius, fluid }: Props) {
  const photo = stationPhoto(station.id);
  const box = fluid ? { width: '100%' as const, aspectRatio: width / height } : { width, height };
  return (
    <View style={[styles.box, box, { borderRadius: radius }]} accessible={false} importantForAccessibility="no-hide-descendants">
      {photo ? (
        <Image source={photo.source} style={styles.fill} resizeMode="cover" fadeDuration={120} accessibilityIgnoresInvertColors />
      ) : (
        <Illustration station={station} color={color} />
      )}
    </View>
  );
});

function Illustration({ station, color }: { station: ThumbStation; color: string }) {
  const art = useMemo(() => {
    const r = rng(station.id);
    const tint = (c: string, t: number) => mixColor(c, color, t);
    const blocks = Array.from({ length: 6 }, (_, i) => {
      const w = 12 + r() * 12;
      return { x: i * 21 - 4 + r() * 6, w, h: 18 + r() * 34, c: tint('#C9D8EC', 0.08 + r() * 0.1) };
    });
    const trees = Array.from({ length: 3 }, () => ({ x: 6 + r() * 108, y: 80 + r() * 4, s: 5 + r() * 3 }));
    const roofW = 54 + r() * 14;
    return { blocks, trees, roofW, sky: tint('#CBE2F8', 0.1), ground: tint('#B7CFA0', 0.04) };
  }, [station.id, color]);

  const underground = station.stationType === 'underground';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 100" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={`sky-${station.id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={art.sky} />
          <Stop offset="1" stopColor="#F2F7FD" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={100} fill={`url(#sky-${station.id})`} />
      {art.blocks.map((b, i) => (
        <Rect key={i} x={b.x} y={74 - b.h} width={b.w} height={b.h} fill={b.c} />
      ))}
      <Rect y={74} width={120} height={26} fill={art.ground} />
      {art.trees.map((t, i) => (
        <G key={i}>
          <Rect x={t.x - 0.8} y={t.y} width={1.6} height={6} fill="#7A6A55" />
          <Circle cx={t.x} cy={t.y - 1} r={t.s} fill="#5E9A62" />
        </G>
      ))}
      {underground ? <Underground color={color} /> : <Elevated color={color} roofW={art.roofW} />}
    </Svg>
  );
}

function Elevated({ color, roofW }: { color: string; roofW: number }) {
  const x0 = 60 - roofW / 2;
  return (
    <G>
      {[18, 44, 76, 102].map((x) => (
        <Rect key={x} x={x - 2.4} y={58} width={4.8} height={30} rx={1.4} fill="#D9DEEA" />
      ))}
      <Rect x={0} y={54} width={120} height={6} fill="#EEF0F7" />
      <Rect x={0} y={59} width={120} height={1.6} fill={color} opacity={0.85} />
      {/* station: glass box, canopy roof, lift tower */}
      <Rect x={x0 + 4} y={38} width={roofW - 8} height={16} fill="#BFD9F0" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Rect key={i} x={x0 + 5 + i * ((roofW - 10) / 5)} y={38} width={0.9} height={16} fill="#FFFFFF" opacity={0.8} />
      ))}
      <Path d={`M${x0 - 3} 38 L${x0 + 6} 31 H${x0 + roofW - 6} L${x0 + roofW + 3} 38 Z`} fill={color} />
      <Rect x={x0 - 3} y={37.4} width={roofW + 6} height={1.6} fill="#FFFFFF" opacity={0.7} />
      <Rect x={x0 + roofW + 4} y={34} width={9} height={20} rx={1.5} fill="#DDE3F1" />
      <Rect x={x0 + roofW + 6} y={37} width={5} height={9} rx={0.8} fill="#9FC3E4" />
      {/* train passing below the canopy */}
      <Rect x={6} y={46} width={30} height={8} rx={2.4} fill="#FFFFFF" />
      <Rect x={8} y={48} width={26} height={2.6} rx={1.2} fill="#496FD8" />
      <Rect x={6} y={52} width={30} height={1.4} fill={color} />
    </G>
  );
}

function Underground({ color }: { color: string }) {
  return (
    <G>
      {/* sunken entrance with a canopy and a station sign */}
      <Rect x={26} y={52} width={68} height={22} fill="#E5E9F4" />
      <Rect x={34} y={58} width={52} height={16} fill="#6C7690" />
      <Path d="M38 74 L44 62 H76 L82 74 Z" fill="#454E68" />
      {[0, 1, 2, 3].map((i) => (
        <Path key={i} d={`M${46 + i * 7} 74 L${48 + i * 6.4} 63`} stroke="#8993AC" strokeWidth={0.9} />
      ))}
      <Path d="M22 52 L30 44 H90 L98 52 Z" fill={color} />
      <Rect x={22} y={51.2} width={76} height={1.8} fill="#FFFFFF" opacity={0.7} />
      <Circle cx={60} cy={36} r={7} fill="#FFFFFF" stroke={color} strokeWidth={1.6} />
      <Path d="M56 40 V32.5 L60 37 L64 32.5 V40" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <Rect x={59} y={42} width={2} height={3} fill="#9AA3BA" />
    </G>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#DCE8F6' },
  fill: { width: '100%', height: '100%' },
});
