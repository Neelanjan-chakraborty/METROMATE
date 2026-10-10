import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/* All artwork here is original vector drawing: no photographs, no GMRC or third-party artwork. */

// ------------------------------------------------------- shortcut-card art

const VIOLET = '#4F35E8';

/** Very faint folded-map and route motif for the "Metro map" card. */
export function MapCardArt() {
  return (
    <View pointerEvents="none" style={styles.cardArt}>
      <Svg width={80} height={74} viewBox="50 0 80 74">
        <Path d="M58 8 L82 15 L82 64 L58 57 Z" fill={VIOLET} opacity={0.04} />
        <Path d="M82 15 L106 8 L106 57 L82 64 Z" fill={VIOLET} opacity={0.08} />
        <Path d="M106 8 L128 15 L128 64 L106 57 Z" fill={VIOLET} opacity={0.045} />
        <Path d="M62 50 L76 36 L92 42 L108 24 L124 30" stroke={VIOLET} strokeOpacity={0.14} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {[[62, 50], [76, 36], [92, 42], [108, 24], [124, 30]].map(([cx, cy]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3.4} fill="#FFFFFF" stroke={VIOLET} strokeOpacity={0.2} strokeWidth={1.5} />
        ))}
      </Svg>
    </View>
  );
}

/** Very faint platform canopy and train motif for the "Stations" card. */
export function StationCardArt() {
  return (
    <View pointerEvents="none" style={styles.cardArt}>
      <Svg width={80} height={74} viewBox="50 0 80 74">
        <Path d="M48 18 H130" stroke={VIOLET} strokeOpacity={0.1} strokeWidth={4.5} strokeLinecap="round" />
        {[62, 88, 114].map((x) => (
          <Rect key={x} x={x - 1.5} y={20} width={3} height={40} rx={1.5} fill={VIOLET} opacity={0.09} />
        ))}
        <Rect x={48} y={58} width={82} height={3} rx={1.5} fill={VIOLET} opacity={0.14} />
        <Rect x={66} y={34} width={62} height={20} rx={6} fill={VIOLET} opacity={0.08} />
        {[0, 1, 2, 3].map((i) => (
          <Rect key={i} x={72 + i * 13} y={39} width={9} height={7} rx={2} fill="#FFFFFF" opacity={0.7} />
        ))}
      </Svg>
    </View>
  );
}

/** Soft gradient and gentle highlights behind the primary button. */
export function ButtonArt({ radius }: { radius: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
        <Defs>
          <LinearGradient id="btn-grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#6046F6" />
            <Stop offset="1" stopColor="#4A2EDF" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={40} fill="url(#btn-grad)" />
        <Circle cx={88} cy={4} r={22} fill="#FFFFFF" opacity={0.07} />
        <Circle cx={10} cy={44} r={20} fill="#FFFFFF" opacity={0.05} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  cardArt: { position: 'absolute', right: -2, top: 0, bottom: 0, width: 80, justifyContent: 'center', alignItems: 'flex-end' },
});
