import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

/* All artwork here is original vector drawing: no photographs, no GMRC or third-party artwork. */

// ------------------------------------------------------------------ hero

const VB_W = 430;
const VB_H = 172;
// The viaduct deck rises from (150,161) at the left to (430,97) at the right.
const deckY = (x: number) => 161 - (x - 150) * (64 / 280);
const DECK_ANGLE = -12.87; // atan(64/280)

// [x, top, width]: far, pale blue-lavender towers
const FAR_TOWERS: [number, number, number][] = [
  [4, 70, 20], [26, 44, 17], [46, 82, 24], [74, 56, 15], [92, 78, 22],
  [196, 74, 17], [216, 48, 20], [240, 80, 15], [262, 58, 19],
  [292, 72, 17], [314, 52, 21], [340, 84, 16], [362, 60, 20], [388, 76, 18], [410, 56, 22],
];
const NEAR_TOWERS: [number, number, number][] = [[0, 98, 24], [24, 86, 20], [168, 92, 20], [188, 80, 16]];

function Tower({ x, y, w, top, bottom }: { x: number; y: number; w: number; top: string; bottom: string }) {
  const id = `tw-${x}-${y}`;
  const marks: React.ReactElement[] = [];
  for (let ry = y + 7; ry < 140; ry += 11) {
    marks.push(<Rect key={ry} x={x + 3} y={ry} width={w - 6} height={1.4} rx={0.7} fill="#FFFFFF" opacity={0.35} />);
  }
  return (
    <G>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x={x} y={y} width={w} height={156 - y} rx={2.5} fill={`url(#${id})`} />
      {marks}
    </G>
  );
}

export function HeroIllustration({ height, style }: { height: number; style?: StyleProp<ViewStyle> }) {
  const pillars = [250, 330, 410];
  const arches = Array.from({ length: 12 }, (_, i) => 46 + i * 11.6);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height }, style]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMaxYMax slice">
        <Defs>
          <LinearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F4F2FF" />
            <Stop offset="1" stopColor="#E7E4FB" />
          </LinearGradient>
          <RadialGradient id="hero-glow" cx="0.92" cy="0.42" rx="0.5" ry="0.7">
            <Stop offset="0" stopColor="#FFD9C8" stopOpacity="0.75" />
            <Stop offset="1" stopColor="#FFD9C8" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F7F7FF" stopOpacity="1" />
            <Stop offset="0.28" stopColor="#F7F7FF" stopOpacity="0" />
            <Stop offset="0.84" stopColor="#F7F7FF" stopOpacity="0" />
            <Stop offset="1" stopColor="#F7F7FF" stopOpacity="0.92" />
          </LinearGradient>
          <LinearGradient id="hero-body" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#E6E3FA" />
          </LinearGradient>
          <LinearGradient id="hero-deck" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#D2CFEC" />
            <Stop offset="1" stopColor="#B9B5DE" />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#hero-sky)" />
        <Rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#hero-glow)" />

        {FAR_TOWERS.map(([x, y, w]) => (
          <Tower key={`f${x}`} x={x} y={y} w={w} top="#D3D9F4" bottom="#E7E8F8" />
        ))}
        {NEAR_TOWERS.map(([x, y, w]) => (
          <Tower key={`n${x}`} x={x} y={y} w={w} top="#C6C9EE" bottom="#DAD9F3" />
        ))}

        {/* domed hall */}
        <G>
          <Rect x={40} y={128} width={150} height={28} rx={2} fill="#D8D4F3" />
          {arches.map((x) => (
            <Path key={x} d={`M${x} 154 V140 A3.2 3.2 0 0 1 ${x + 6.4} 140 V154 Z`} fill="#C9C4EC" />
          ))}
          <Rect x={92} y={110} width={46} height={20} fill="#D3CEF0" />
          <Path d="M89 112 A26 26 0 0 1 141 112 Z" fill="#C6C0EB" />
          <Path d="M96 112 A19 19 0 0 1 134 112 Z" fill="#D0CBF0" opacity={0.7} />
          <Rect x={114} y={80} width={2} height={12} rx={1} fill="#C6C0EB" />
          <Circle cx={115} cy={79} r={2.6} fill="#C6C0EB" />
          <Path d="M46 130 A9 9 0 0 1 64 130 Z" fill="#CDC8EE" />
          <Path d="M166 130 A9 9 0 0 1 184 130 Z" fill="#CDC8EE" />
        </G>

        {/* trees */}
        <G>
          <Circle cx={10} cy={146} r={17} fill="#A9DEC3" />
          <Circle cx={30} cy={154} r={13} fill="#8FD0AE" />
          <Circle cx={-6} cy={154} r={15} fill="#8FD0AE" />
          <Circle cx={196} cy={156} r={13} fill="#A9DEC3" />
          <Circle cx={212} cy={160} r={10} fill="#8FD0AE" />
        </G>

        {/* viaduct */}
        <Polygon points={`150,${deckY(150)} 430,${deckY(430)} 430,${deckY(430) + 6} 150,${deckY(150) + 6}`} fill="url(#hero-deck)" />
        {pillars.map((x) => {
          const y = deckY(x) + 6;
          return (
            <G key={x}>
              <Polygon points={`${x - 6},${y} ${x + 6},${y} ${x + 8},${VB_H} ${x - 8},${VB_H}`} fill="#C6C3E5" />
              <Rect x={x - 11} y={y - 1} width={22} height={4} rx={1.6} fill="#B9B5DE" />
            </G>
          );
        })}

        {/* train */}
        <G transform={`translate(190 ${deckY(190)}) rotate(${DECK_ANGLE})`}>
          <Rect x={-3} y={-3.4} width={246} height={3.6} rx={1.6} fill="#8F8AC0" />
          {[0, 56, 112].map((x) => (
            <G key={x}>
              <Rect x={x} y={-24} width={54} height={21} rx={3.4} fill="url(#hero-body)" stroke="#D5D2F0" strokeWidth={0.8} />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Rect key={i} x={x + 5 + i * 7.9} y={-20} width={6} height={8.5} rx={1.4} fill="#243059" opacity={0.9} />
              ))}
              <Rect x={x} y={-9.5} width={54} height={2.6} fill="#6A55F0" />
              <Rect x={x + 26.5} y={-23} width={1} height={19} fill="#D5D2F0" />
            </G>
          ))}
          <Path d="M168 -24 H214 Q232 -22 240 -12 L242 -3.2 H168 Z" fill="url(#hero-body)" stroke="#D5D2F0" strokeWidth={0.8} />
          <Path d="M211 -20.6 H224 Q232 -19 236.6 -12 H211 Z" fill="#243059" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Rect key={i} x={173 + i * 7.9} y={-20} width={6} height={8.5} rx={1.4} fill="#243059" opacity={0.9} />
          ))}
          <Rect x={168} y={-9.5} width={72} height={2.6} fill="#6A55F0" />
          <Circle cx={239.4} cy={-6} r={1.7} fill="#FFD66B" />
        </G>

        <Rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#hero-fade)" />
      </Svg>
    </View>
  );
}

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
