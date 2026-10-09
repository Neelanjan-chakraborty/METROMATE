import React, { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import { mixColor, windowIsLit, windowThreshold, type HeroLook } from '../../lib/skyPalette';

/*
 * Animated Home hero. Original vector artwork, drawn in a 430 x 172 viewBox.
 * Layers, bottom to top:
 *   Scene   - sky, sun/moon, skyline with lit windows, domed hall, trees, viaduct, lamps
 *   Stars   - two groups that twinkle out of phase (night only)
 *   Clouds  - drift slowly across the sky (daytime only)
 *   Train   - glides along the viaduct on the native animation thread, with a pause between runs
 * Everything that changes with the clock comes from `look` (see lib/skyPalette.ts).
 */

export const VB_W = 430;
export const VB_H = 172;
const SLOPE = -64 / 280; // viaduct rises 64 for every 280 to the right
const deckY = (x: number) => 161 + (x - 150) * SLOPE;
const DECK_ANGLE = -12.87; // atan(64/280)

// Train run: starts hidden below-left behind the card, exits past the right edge.
const DX_START = -380;
const DX_END = 250;
export const TRAVEL_MS = 15_000;
export const PAUSE_MS = 4_000;
/** Progress (0..1) at which the train sits fully on screen: used when motion is reduced. */
const P_STATIC = -DX_START / (DX_END - DX_START);

const useNative = Platform.OS !== 'web';

const FAR_TOWERS: [number, number, number][] = [
  [4, 70, 20], [26, 44, 17], [46, 82, 24], [74, 56, 15], [92, 78, 22],
  [196, 74, 17], [216, 48, 20], [240, 80, 15], [262, 58, 19],
  [292, 72, 17], [314, 52, 21], [340, 84, 16], [362, 60, 20], [388, 76, 18], [410, 56, 22],
];
const NEAR_TOWERS: [number, number, number][] = [[0, 98, 24], [24, 86, 20], [168, 92, 20], [188, 80, 16]];

const LIT = '#FFE08A';
const LAMP = '#FFE9A8';

interface Props {
  height: number;
  look: HeroLook;
  /** Moving things run only while true (screen focused, app active, reduce-motion off). */
  animate: boolean;
}

export function Hero({ height, look, animate }: Props) {
  const [box, setBox] = useState({ w: VB_W, h: height });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  // Same fit as preserveAspectRatio="xMaxYMax slice": uniform scale, anchored bottom-right.
  const scale = Math.max(box.w / VB_W, box.h / VB_H);
  return (
    <View pointerEvents="none" onLayout={onLayout} style={[StyleSheet.absoluteFill, { height, overflow: 'hidden' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Scene look={look} height={height} />
      <Stars look={look} height={height} animate={animate} />
      <Clouds look={look} scale={scale} animate={animate} />
      <TrainLayer look={look} height={height} scale={scale} animate={animate} />
    </View>
  );
}

// ------------------------------------------------------------------ scene

const Scene = memo(function Scene({ look, height }: { look: HeroLook; height: number }) {
  const night = look.night;

  // Window grids are drawn as two paths (lit / unlit) instead of hundreds of rects.
  const { litD, unlitD } = useMemo(() => {
    let lit = '';
    let unlit = '';
    const towers = [...FAR_TOWERS, ...NEAR_TOWERS];
    for (const [x, y, w] of towers) {
      const cols = Math.max(1, Math.floor((w - 5) / 5.2));
      let row = 0;
      for (let ry = y + 8; ry < 140; ry += 9, row++) {
        for (let c = 0; c < cols; c++) {
          const wx = x + 3 + c * 5.2;
          const d = `M${wx.toFixed(1)} ${ry}h2.6v3.6h-2.6z`;
          if (windowIsLit(x, row, c, look.windowsLit)) lit += d;
          else unlit += d;
        }
      }
    }
    return { litD: lit, unlitD: unlit };
  }, [look.windowsLit]);

  const arches = useMemo(() => Array.from({ length: 12 }, (_, i) => 46 + i * 11.6), []);
  const archColor = mixColor(look.domeBase, '#000000', 0.1);
  const treeA = mixColor('#A9DEC3', '#1F3B58', night * 0.85);
  const treeB = mixColor('#8FD0AE', '#183049', night * 0.85);
  const deckTop = mixColor('#D2CFEC', '#4A4A92', night * 0.75);
  const deckBottom = mixColor('#B9B5DE', '#34347A', night * 0.75);
  const pillar = mixColor('#C6C3E5', '#3C3C84', night * 0.75);
  const unlitColor = mixColor('#FFFFFF', '#0B0A2E', night);
  const pillars = [250, 330, 410];
  const lamps = useMemo(() => Array.from({ length: 15 }, (_, i) => 154 + i * 19), []);
  const b = look.body;

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMaxYMax slice">
      <Defs>
        <LinearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={look.skyTop} />
          <Stop offset="1" stopColor={look.skyBottom} />
        </LinearGradient>
        <RadialGradient id="sc-glow" cx="0.9" cy="0.62" rx="0.62" ry="0.62">
          <Stop offset="0" stopColor={look.glow} stopOpacity={look.glowOpacity} />
          <Stop offset="1" stopColor={look.glow} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="sc-far" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={look.farTop} />
          <Stop offset="1" stopColor={look.farBottom} />
        </LinearGradient>
        <LinearGradient id="sc-near" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={look.nearTop} />
          <Stop offset="1" stopColor={look.nearBottom} />
        </LinearGradient>
        <LinearGradient id="sc-deck" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={deckTop} />
          <Stop offset="1" stopColor={deckBottom} />
        </LinearGradient>
        <LinearGradient id="sc-fade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F7F7FF" stopOpacity="0" />
          <Stop offset="0.84" stopColor="#F7F7FF" stopOpacity="0" />
          <Stop offset="1" stopColor="#F7F7FF" stopOpacity="0.92" />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#sc-sky)" />
      <Rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#sc-glow)" />

      {FAR_TOWERS.map(([x, y, w]) => (
        <Rect key={`f${x}`} x={x} y={y} width={w} height={156 - y} rx={2.5} fill="url(#sc-far)" />
      ))}
      {/* sun / moon sit in front of the distant skyline, behind the nearer towers */}
      {b ? (
        b.kind === 'sun' ? (
          <G opacity={b.opacity}>
            <Circle cx={b.x} cy={b.y} r={26} fill={b.color} opacity={0.18} />
            <Circle cx={b.x} cy={b.y} r={16} fill={b.color} opacity={0.3} />
            <Circle cx={b.x} cy={b.y} r={9} fill={b.color} />
          </G>
        ) : (
          <G opacity={b.opacity}>
            <Circle cx={b.x} cy={b.y} r={22} fill="#CFCBFF" opacity={0.12} />
            <Circle cx={b.x} cy={b.y} r={7.5} fill={b.color} />
            {/* crescent: carve a disc in the sky colour */}
            <Circle cx={b.x + 3.2} cy={b.y - 1.6} r={6.6} fill={mixColor(look.skyTop, look.skyBottom, b.y / VB_H)} />
          </G>
        )
      ) : null}

      {NEAR_TOWERS.map(([x, y, w]) => (
        <Rect key={`n${x}`} x={x} y={y} width={w} height={156 - y} rx={2.5} fill="url(#sc-near)" />
      ))}
      <Path d={unlitD} fill={unlitColor} opacity={0.3} />
      <Path d={litD} fill={LIT} opacity={0.95} />

      {/* domed hall */}
      <G>
        <Rect x={40} y={128} width={150} height={28} rx={2} fill={look.domeBase} />
        {arches.map((x, i) => (
          <Path key={x} d={`M${x} 154 V140 A3.2 3.2 0 0 1 ${x + 6.4} 140 V154 Z`} fill={windowIsLit(99, i, 0, look.windowsLit * 0.8) ? LIT : archColor} opacity={windowIsLit(99, i, 0, look.windowsLit * 0.8) ? 0.9 : 1} />
        ))}
        <Rect x={92} y={110} width={46} height={20} fill={mixColor(look.domeBase, look.domeTop, 0.4)} />
        <Path d="M89 112 A26 26 0 0 1 141 112 Z" fill={look.domeTop} />
        <Rect x={114} y={80} width={2} height={12} rx={1} fill={look.domeTop} />
        <Circle cx={115} cy={79} r={2.6} fill={look.domeTop} />
        <Path d="M46 130 A9 9 0 0 1 64 130 Z" fill={look.domeTop} opacity={0.85} />
        <Path d="M166 130 A9 9 0 0 1 184 130 Z" fill={look.domeTop} opacity={0.85} />
      </G>

      {/* trees */}
      <G>
        <Circle cx={10} cy={146} r={17} fill={treeA} />
        <Circle cx={30} cy={154} r={13} fill={treeB} />
        <Circle cx={-6} cy={154} r={15} fill={treeB} />
        <Circle cx={196} cy={156} r={13} fill={treeA} />
        <Circle cx={212} cy={160} r={10} fill={treeB} />
      </G>

      {/* viaduct */}
      <Polygon points={`150,${deckY(150)} 430,${deckY(430)} 430,${deckY(430) + 6} 150,${deckY(150) + 6}`} fill="url(#sc-deck)" />
      {pillars.map((x) => {
        const y = deckY(x) + 6;
        return (
          <G key={x}>
            <Polygon points={`${x - 6},${y} ${x + 6},${y} ${x + 8},${VB_H} ${x - 8},${VB_H}`} fill={pillar} />
            <Rect x={x - 11} y={y - 1} width={22} height={4} rx={1.6} fill={deckBottom} />
          </G>
        );
      })}
      {night > 0.25
        ? lamps.map((x) => (
            <G key={x}>
              <Circle cx={x} cy={deckY(x) - 1.6} r={3.6} fill={LAMP} opacity={night * 0.28} />
              <Circle cx={x} cy={deckY(x) - 1.6} r={1.1} fill={LAMP} opacity={night * 0.95} />
            </G>
          ))
        : null}

      <Rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#sc-fade)" />
    </Svg>
  );
});

// ------------------------------------------------------------------- stars

const STARS = Array.from({ length: 30 }, (_, i) => ({
  x: 8 + windowThreshold(i, 1, 7) * 414,
  y: 5 + windowThreshold(i, 2, 7) * 78,
  r: 0.55 + windowThreshold(i, 3, 7) * 0.95,
  group: i % 2,
}));

function Stars({ look, height, animate }: { look: HeroLook; height: number; animate: boolean }) {
  const [a] = useState(() => new Animated.Value(1));
  const [b] = useState(() => new Animated.Value(0.7));
  useEffect(() => {
    if (!animate || look.stars <= 0.02) {
      a.setValue(1);
      b.setValue(0.7);
      return;
    }
    const twinkle = (v: Animated.Value, lo: number, ms: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: lo, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: useNative }),
          Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: useNative }),
        ]),
      );
    const la = twinkle(a, 0.35, 1700);
    const lb = twinkle(b, 0.35, 2300);
    la.start();
    lb.start();
    return () => {
      la.stop();
      lb.stop();
    };
  }, [animate, look.stars > 0.02, a, b]); // eslint-disable-line react-hooks/exhaustive-deps
  if (look.stars <= 0.02) return null;
  return (
    <>
      {[a, b].map((v, g) => (
        <Animated.View key={g} style={[StyleSheet.absoluteFill, { opacity: v }]}>
          <Svg width="100%" height={height} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMaxYMax slice">
            {STARS.filter((s) => s.group === g).map((s, i) => (
              <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={look.stars} />
            ))}
          </Svg>
        </Animated.View>
      ))}
    </>
  );
}

// ------------------------------------------------------------------ clouds

const CLOUDS = [
  { y: 52, w: 92, ms: 95_000, phase: 0.15 },
  { y: 76, w: 64, ms: 120_000, phase: 0.55 },
  { y: 40, w: 78, ms: 80_000, phase: 0.8 },
];

function Clouds({ look, scale, animate }: { look: HeroLook; scale: number; animate: boolean }) {
  if (look.cloudOpacity <= 0.03) return null;
  return (
    <>
      {CLOUDS.map((c, i) => (
        <Cloud key={i} def={c} color={look.cloud} opacity={look.cloudOpacity * 0.75} scale={scale} animate={animate} />
      ))}
    </>
  );
}

function Cloud({ def, color, opacity, scale, animate }: { def: (typeof CLOUDS)[number]; color: string; opacity: number; scale: number; animate: boolean }) {
  const [p] = useState(() => new Animated.Value(def.phase));
  const span = (VB_W + def.w * 2) * scale;
  useEffect(() => {
    if (!animate) {
      p.stopAnimation();
      return;
    }
    // continue from the current position, then loop the full width
    const first = Animated.timing(p, { toValue: 1, duration: def.ms * (1 - def.phase), easing: Easing.linear, useNativeDriver: useNative });
    const loop = Animated.loop(Animated.timing(p, { toValue: 1, duration: def.ms, easing: Easing.linear, useNativeDriver: useNative }));
    let cancelled = false;
    first.start(({ finished }) => {
      if (finished && !cancelled) loop.start();
    });
    return () => {
      cancelled = true;
      first.stop();
      loop.stop();
    };
  }, [animate, def.ms, def.phase, p]);
  const w = def.w * scale;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: def.y * scale,
        left: -def.w * scale,
        width: w,
        height: w * 0.36,
        opacity: opacity,
        transform: [{ translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, span] }) }],
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 36">
        <G fill={color}>
          <Circle cx={26} cy={22} r={13} />
          <Circle cx={46} cy={15} r={16} />
          <Circle cx={68} cy={21} r={13} />
          <Rect x={14} y={22} width={68} height={12} rx={6} />
        </G>
      </Svg>
    </Animated.View>
  );
}

// ------------------------------------------------------------------- train

function TrainLayer({ look, height, scale, animate }: { look: HeroLook; height: number; scale: number; animate: boolean }) {
  const [progress] = useState(() => new Animated.Value(animate ? 0 : P_STATIC));

  useEffect(() => {
    if (!animate) {
      progress.stopAnimation();
      progress.setValue(P_STATIC);
      return;
    }
    // Every run (first one, after returning to the tab, after each pause) begins at the foot of the
    // viaduct, below the journey card, and climbs the slope; it never appears part-way along.
    progress.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: TRAVEL_MS, easing: Easing.linear, useNativeDriver: useNative }),
        Animated.delay(PAUSE_MS),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: useNative }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [animate, progress]);

  const dx = progress.interpolate({ inputRange: [0, 1], outputRange: [DX_START * scale, DX_END * scale] });
  const dy = progress.interpolate({ inputRange: [0, 1], outputRange: [DX_START * SLOPE * scale, DX_END * SLOPE * scale] });

  const bodyTop = mixColor('#FFFFFF', '#D9D6F2', look.night);
  const bodyBottom = mixColor('#E6E3FA', '#9C98D0', look.night);
  const windowFill = mixColor('#243059', '#FFE9A8', look.trainLight);
  const light = look.trainLight;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: dx }, { translateY: dy }] }]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMaxYMax slice">
        <Defs>
          <LinearGradient id="tr-body" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={bodyTop} />
            <Stop offset="1" stopColor={bodyBottom} />
          </LinearGradient>
          <LinearGradient id="tr-beam" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFE9A8" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <G transform={`translate(190 ${deckY(190)}) rotate(${DECK_ANGLE})`}>
          {light > 0.05 ? <Polygon points="241,-7 330,-26 330,10" fill="url(#tr-beam)" opacity={light * 0.7} /> : null}
          <Rect x={-3} y={-3.4} width={246} height={3.6} rx={1.6} fill={mixColor('#8F8AC0', '#2B2B6B', look.night * 0.8)} />
          {[0, 56, 112].map((x) => (
            <G key={x}>
              <Rect x={x} y={-24} width={54} height={21} rx={3.4} fill="url(#tr-body)" stroke={mixColor('#D5D2F0', '#6C69B0', look.night)} strokeWidth={0.8} />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Rect key={i} x={x + 5 + i * 7.9} y={-20} width={6} height={8.5} rx={1.4} fill={windowFill} opacity={0.95} />
              ))}
              <Rect x={x} y={-9.5} width={54} height={2.6} fill="#6A55F0" />
              <Rect x={x + 26.5} y={-23} width={1} height={19} fill={mixColor('#D5D2F0', '#6C69B0', look.night)} />
            </G>
          ))}
          <Path d="M168 -24 H214 Q232 -22 240 -12 L242 -3.2 H168 Z" fill="url(#tr-body)" stroke={mixColor('#D5D2F0', '#6C69B0', look.night)} strokeWidth={0.8} />
          <Path d="M211 -20.6 H224 Q232 -19 236.6 -12 H211 Z" fill="#243059" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Rect key={i} x={173 + i * 7.9} y={-20} width={6} height={8.5} rx={1.4} fill={windowFill} opacity={0.95} />
          ))}
          <Rect x={168} y={-9.5} width={72} height={2.6} fill="#6A55F0" />
          <Circle cx={239.4} cy={-6} r={1.7} fill="#FFD66B" />
          {light > 0.05 ? <Circle cx={239.4} cy={-6} r={5} fill="#FFE9A8" opacity={light * 0.45} /> : null}
        </G>
      </Svg>
    </Animated.View>
  );
}
