import React, { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { headerBackdrop, mixColor, windowIsLit, windowThreshold, type HeroLook } from '../../lib/skyPalette';
import { Clouds, Stars } from '../home/Hero';
import { busLook } from './busLook';
import {
  BUS_LEN,
  BUS_X,
  DASH_MS,
  DASH_PERIOD,
  DASH_WIDTH,
  FAR_MS,
  FAR_PERIOD,
  FAR_WIDTH,
  HERO_H,
  HERO_W,
  LIFT,
  MID_MS,
  MID_PERIOD,
  MID_WIDTH,
  NEAR_MS,
  NEAR_PERIOD,
  NEAR_WIDTH,
  ROAD_Y,
  SCENES,
  SCENE_W,
  SIGNS,
  STREAK_MS,
  STREAK_PERIOD,
  WHEEL_BOTTOM,
  dashXs,
  poleXs,
  signX,
} from './busHeroGeometry';
import { bus } from '../../theme/bus';

/*
 * Animated header for the Bus tab. A red bus lettered "GSRTC" drives at a fixed place on screen while the
 * world slides past it in layers at different speeds: a city, open fields, a village and a town, with
 * roadside boards naming real places from the bus data. The sky, sun/moon, stars, clouds and lit windows
 * follow the real time of day like the other heroes (lib/skyPalette.ts), warmed towards red.
 *
 * Original vector artwork. The "GSRTC" lettering is decorative: the timetables in the app cover AMTS, BRTS
 * and Gandhinagar buses, not GSRTC, and the Bus screen says so. Everything that moves is a native-driven
 * transform of a periodic strip, so nothing re-renders per frame. With reduced motion, or when the screen is
 * not focused, it stands still.
 */

const useNative = Platform.OS !== 'web';
const LIT = '#FFE08A';
const LAMP = '#FFE9A8';
const FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;
const BG = bus.bg;

interface Props {
  height: number;
  /** The shared sky look for the current (or previewed) time; this component warms it. */
  look: HeroLook;
  animate: boolean;
}

export function BusHero({ height, look: base, animate }: Props) {
  const look = useMemo(() => busLook(base), [base]);
  const [w, setW] = useState(HERO_W);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const scale = w / HERO_W;
  return (
    <View pointerEvents="none" onLayout={onLayout} style={[StyleSheet.absoluteFill, { height, overflow: 'hidden', backgroundColor: look.skyTop }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Sky look={look} scale={scale} />
      <Stars look={look} height={height} animate={animate} />
      <Clouds look={look} scale={scale} animate={animate} />
      <Scroller widthVb={FAR_WIDTH} period={FAR_PERIOD} ms={FAR_MS} scale={scale} animate={animate}>
        <FarLayer look={look} scale={scale} />
      </Scroller>
      <Scroller widthVb={MID_WIDTH} period={MID_PERIOD} ms={MID_MS} scale={scale} animate={animate}>
        <MidLayer look={look} scale={scale} />
      </Scroller>
      <Road look={look} scale={scale} />
      <Scroller widthVb={NEAR_WIDTH} period={NEAR_PERIOD} ms={NEAR_MS} scale={scale} animate={animate}>
        <NearLayer look={look} scale={scale} />
      </Scroller>
      <Scroller widthVb={DASH_WIDTH} period={DASH_PERIOD} ms={DASH_MS} scale={scale} animate={animate}>
        <Dashes look={look} scale={scale} />
      </Scroller>
      <BusLayer look={look} scale={scale} animate={animate} />
      <Scroller widthVb={STREAK_PERIOD * 2} period={STREAK_PERIOD} ms={STREAK_MS} scale={scale} animate={animate}>
        <Streaks look={look} scale={scale} />
      </Scroller>
      <Veil look={look} />
    </View>
  );
}

// -------------------------------------------------------------- scrolling

/** Slides its (periodic) child left by one period per loop, anchored to the bottom of the hero. */
function Scroller({ widthVb, period, ms, scale, animate, children }: { widthVb: number; period: number; ms: number; scale: number; animate: boolean; children: React.ReactNode }) {
  const [p] = useState(() => new Animated.Value(0));
  useEffect(() => {
    p.setValue(0);
    if (!animate) {
      p.stopAnimation();
      return;
    }
    const loop = Animated.loop(Animated.timing(p, { toValue: 1, duration: ms, easing: Easing.linear, useNativeDriver: useNative }));
    loop.start();
    return () => loop.stop();
  }, [animate, ms, p]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        bottom: LIFT * scale,
        width: widthVb * scale,
        height: HERO_H * scale,
        transform: [{ translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, -period * scale] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function Frame({ widthVb, scale, children }: { widthVb: number; scale: number; children: React.ReactNode }) {
  return (
    <Svg width={widthVb * scale} height={HERO_H * scale} viewBox={`0 0 ${widthVb} ${HERO_H}`}>
      {children}
    </Svg>
  );
}

// -------------------------------------------------------------------- sky

const Sky = memo(function Sky({ look, scale }: { look: HeroLook; scale: number }) {
  const b = look.body;
  // The shared body arc runs y 82 (noon) to 132 (horizon); map it into this hero's sky.
  const by = b ? 14 + ((b.y - 82) / 50) * 50 : 0;
  return (
    <View style={[styles.anchor, { height: (HERO_H + LIFT) * scale }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${HERO_W} ${HERO_H + LIFT}`} preserveAspectRatio="xMidYMax slice">
        <Defs>
          <LinearGradient id="bh-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={look.skyTop} />
            <Stop offset="1" stopColor={look.skyBottom} />
          </LinearGradient>
          <RadialGradient id="bh-glow" cx="0.78" cy="0.72" rx="0.6" ry="0.6">
            <Stop offset="0" stopColor={look.glow} stopOpacity={look.glowOpacity} />
            <Stop offset="1" stopColor={look.glow} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={HERO_W} height={HERO_H + LIFT} fill="url(#bh-sky)" />
        <Rect width={HERO_W} height={HERO_H + LIFT} fill="url(#bh-glow)" />
        {b ? (
          b.kind === 'sun' ? (
            <G opacity={b.opacity}>
              <Circle cx={b.x} cy={by} r={20} fill={b.color} opacity={0.18} />
              <Circle cx={b.x} cy={by} r={12} fill={b.color} opacity={0.3} />
              <Circle cx={b.x} cy={by} r={7} fill={b.color} />
            </G>
          ) : (
            <G opacity={b.opacity}>
              <Circle cx={b.x} cy={by} r={17} fill="#FFD0D0" opacity={0.12} />
              <Circle cx={b.x} cy={by} r={6} fill={b.color} />
              <Circle cx={b.x + 2.6} cy={by - 1.3} r={5.3} fill={mixColor(look.skyTop, look.skyBottom, by / HERO_H)} />
            </G>
          )
        ) : null}
      </Svg>
    </View>
  );
});

// ------------------------------------------------------------ far layer

// Deterministic skyline in the first half of the period: [x, top, width].
const FAR_TOWERS: [number, number, number][] = Array.from({ length: 13 }, (_, i) => {
  const x = i * 33 + windowThreshold(i, 1, 21) * 8;
  return [x, 40 + Math.round(windowThreshold(i, 2, 21) * 34), 15 + Math.round(windowThreshold(i, 3, 21) * 12)];
});
/** Hills in the second half: [x0, x1, peak]. */
const HILLS: [number, number, number][] = [
  [430, 600, 62],
  [560, 740, 52],
  [700, 860, 66],
];

const FarLayer = memo(function FarLayer({ look, scale }: { look: HeroLook; scale: number }) {
  const { litD, unlitD } = useMemo(() => {
    let lit = '';
    let unlit = '';
    for (let copy = 0; copy < 2; copy++) {
      FAR_TOWERS.forEach(([x0, y, w], ti) => {
        const x = x0 + copy * FAR_PERIOD;
        const cols = Math.max(1, Math.floor((w - 4) / 4.6));
        let row = 0;
        for (let ry = y + 6; ry < ROAD_Y - 6; ry += 8, row++) {
          for (let c = 0; c < cols; c++) {
            const d = `M${(x + 2.4 + c * 4.6).toFixed(1)} ${ry}h2.2v3.2h-2.2z`;
            if (windowIsLit(ti, row, c, look.windowsLit)) lit += d;
            else unlit += d;
          }
        }
      });
    }
    return { litD: lit, unlitD: unlit };
  }, [look.windowsLit]);
  const unlitColor = mixColor('#FFFFFF', '#2A0F18', look.night);
  const hill = mixColor(look.farTop, '#9DBF9A', 0.35 * (1 - look.night));
  return (
    <Frame widthVb={FAR_WIDTH} scale={scale}>
      <Defs>
        <LinearGradient id="bh-far" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={look.farTop} />
          <Stop offset="1" stopColor={look.farBottom} />
        </LinearGradient>
      </Defs>
      {[0, 1].map((copy) => (
        <G key={copy} transform={`translate(${copy * FAR_PERIOD} 0)`}>
          {FAR_TOWERS.map(([x, y, w]) => (
            <Rect key={x} x={x} y={y} width={w} height={ROAD_Y + 2 - y} rx={2} fill="url(#bh-far)" />
          ))}
          {/* a domed hall in the haze */}
          <Rect x={330} y={ROAD_Y - 24} width={44} height={24} rx={1.5} fill={look.domeBase} opacity={0.9} />
          <Path d={`M338 ${ROAD_Y - 24} Q352 ${ROAD_Y - 50} 366 ${ROAD_Y - 24} Z`} fill={look.domeTop} opacity={0.9} />
          {HILLS.map(([a, b, peak], i) => (
            <Path key={i} d={`M${a} ${ROAD_Y + 2} Q${(a + b) / 2} ${ROAD_Y + 2 - peak * 1.6} ${b} ${ROAD_Y + 2} Z`} fill={hill} opacity={0.85} />
          ))}
        </G>
      ))}
      <Path d={unlitD} fill={unlitColor} opacity={0.3} />
      <Path d={litD} fill={LIT} opacity={0.9} />
    </Frame>
  );
});

// ------------------------------------------------------------ mid scenery

const GROUND_Y = ROAD_Y - 4;

const MidLayer = memo(function MidLayer({ look, scale }: { look: HeroLook; scale: number }) {
  const night = look.night;
  const tone = (day: string, dark: string, k = 0.8) => mixColor(day, dark, night * k);
  const c = useMemo(
    () => ({
      treeA: tone('#7FBF85', '#1B3A33'),
      treeB: tone('#5FA96C', '#15302A'),
      trunk: tone('#7A5A44', '#2B2230'),
      wall: tone('#F1D8B8', '#5A4A5C'),
      wall2: tone('#E9B9A0', '#52414F'),
      roof: tone('#B5543C', '#4A2A36'),
      tile: tone('#C9694C', '#55303C'),
      stone: tone('#F3E6D4', '#6A5A6C'),
      stoneDark: tone('#E0C9AE', '#54465A'),
      crop1: tone('#9CCB74', '#27432F'),
      crop2: tone('#7DB567', '#1F3A28'),
      crop3: tone('#B7D98A', '#2F4C34'),
      hay: tone('#E3C26B', '#5C4C3A'),
      tank: tone('#D7DCE8', '#4C4A66'),
      shop: tone('#EBD7C2', '#5B4A5E'),
      building: [tone('#E6C9C0', '#4E3A4C'), tone('#DCC4B0', '#463646'), tone('#CFB9C4', '#3F3045')],
    }),
    [night], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const glow = look.windowsLit;
  return (
    <Frame widthVb={MID_WIDTH} scale={scale}>
      {[0, 1].map((copy) => (
        <G key={copy} transform={`translate(${copy * MID_PERIOD} 0)`}>
          {SCENES.map((kind, si) => (
            <G key={kind} transform={`translate(${si * SCENE_W} 0)`}>
              {kind === 'city' ? <City c={c} lit={glow} seed={si} /> : kind === 'fields' ? <Fields c={c} /> : kind === 'village' ? <Village c={c} night={night} /> : <Town c={c} lit={glow} />}
            </G>
          ))}
        </G>
      ))}
    </Frame>
  );
});

type Palette = {
  treeA: string;
  treeB: string;
  trunk: string;
  wall: string;
  wall2: string;
  roof: string;
  tile: string;
  stone: string;
  stoneDark: string;
  crop1: string;
  crop2: string;
  crop3: string;
  hay: string;
  tank: string;
  shop: string;
  building: string[];
};

const Tree = ({ x, y, r, c, alt }: { x: number; y: number; r: number; c: Palette; alt?: boolean }) => (
  <G>
    <Rect x={x - 1} y={y} width={2} height={GROUND_Y - y + 2} fill={c.trunk} />
    <Circle cx={x} cy={y} r={r} fill={alt ? c.treeB : c.treeA} />
    <Circle cx={x + r * 0.5} cy={y + r * 0.35} r={r * 0.68} fill={alt ? c.treeA : c.treeB} />
  </G>
);

function City({ c, lit, seed }: { c: Palette; lit: number; seed: number }) {
  const blocks = Array.from({ length: 7 }, (_, i) => {
    const w = 34 + Math.round(windowThreshold(i, 11, seed + 5) * 22);
    const h = 28 + Math.round(windowThreshold(i, 12, seed + 5) * 34);
    return { x: 6 + i * 60 + Math.round(windowThreshold(i, 13, seed + 5) * 10), w, h, fill: c.building[i % 3] };
  });
  return (
    <G>
      {blocks.map((b, i) => (
        <G key={i}>
          <Rect x={b.x} y={GROUND_Y - b.h} width={b.w} height={b.h + 2} rx={1.5} fill={b.fill} />
          {Array.from({ length: Math.floor((b.h - 6) / 8) }, (_, r) =>
            Array.from({ length: Math.max(1, Math.floor((b.w - 6) / 8)) }, (_, k) => (
              <Rect key={`${r}-${k}`} x={b.x + 4 + k * 8} y={GROUND_Y - b.h + 5 + r * 8} width={4.4} height={4.6} rx={0.8} fill={windowIsLit(i, r, k, lit) ? LIT : '#FFFFFF'} opacity={windowIsLit(i, r, k, lit) ? 0.95 : 0.3} />
            )),
          )}
        </G>
      ))}
      <Tree x={30} y={GROUND_Y - 8} r={8} c={c} />
      <Tree x={236} y={GROUND_Y - 7} r={7} c={c} alt />
      <Tree x={410} y={GROUND_Y - 8} r={8} c={c} />
    </G>
  );
}

function Fields({ c }: { c: Palette }) {
  return (
    <G>
      {[
        [GROUND_Y - 10, c.crop1],
        [GROUND_Y - 6, c.crop2],
        [GROUND_Y - 2, c.crop3],
      ].map(([y, fill], i) => (
        <Rect key={i} x={0} y={y as number} width={SCENE_W} height={5} fill={fill as string} />
      ))}
      {/* wind turbines */}
      {[96, 330].map((x) => (
        <G key={x}>
          <Path d={`M${x - 1.6} ${GROUND_Y - 8} L${x - 0.7} ${GROUND_Y - 62} H${x + 0.7} L${x + 1.6} ${GROUND_Y - 8} Z`} fill="#F4F4F8" />
          <Path d={`M${x} ${GROUND_Y - 62} L${x - 3} ${GROUND_Y - 96} L${x + 1.2} ${GROUND_Y - 62} Z`} fill="#F4F4F8" />
          <Path d={`M${x} ${GROUND_Y - 62} L${x + 28} ${GROUND_Y - 48} L${x - 0.6} ${GROUND_Y - 60} Z`} fill="#F4F4F8" />
          <Path d={`M${x} ${GROUND_Y - 62} L${x - 25} ${GROUND_Y - 46} L${x + 0.4} ${GROUND_Y - 60} Z`} fill="#F4F4F8" />
          <Circle cx={x} cy={GROUND_Y - 62} r={2.2} fill="#D9DCE8" />
        </G>
      ))}
      {/* farm shed */}
      <Rect x={190} y={GROUND_Y - 20} width={36} height={22} fill={c.wall2} />
      <Path d={`M186 ${GROUND_Y - 20} L208 ${GROUND_Y - 32} L230 ${GROUND_Y - 20} Z`} fill={c.roof} />
      <Rect x={203} y={GROUND_Y - 11} width={10} height={13} fill={c.roof} opacity={0.7} />
      <Tree x={30} y={GROUND_Y - 18} r={11} c={c} />
      <Tree x={150} y={GROUND_Y - 14} r={9} c={c} alt />
      <Tree x={270} y={GROUND_Y - 16} r={10} c={c} />
      <Tree x={398} y={GROUND_Y - 18} r={11} c={c} alt />
    </G>
  );
}

function Village({ c, night }: { c: Palette; night: number }) {
  const door = mixColor('#6B4A3A', '#2B2230', night * 0.8);
  return (
    <G>
      {/* temple: plinth, hall, stepped shikhara, flag */}
      <Rect x={286} y={GROUND_Y - 6} width={64} height={8} fill={c.stoneDark} />
      <Rect x={294} y={GROUND_Y - 24} width={48} height={19} fill={c.stone} />
      <Rect x={310} y={GROUND_Y - 16} width={16} height={11} fill={door} opacity={0.8} />
      <Path d={`M298 ${GROUND_Y - 24} L318 ${GROUND_Y - 54} L338 ${GROUND_Y - 24} Z`} fill={c.stone} />
      <Path d={`M303 ${GROUND_Y - 32} H333 M308 ${GROUND_Y - 41} H328`} stroke={c.stoneDark} strokeWidth={1.2} />
      <Rect x={317} y={GROUND_Y - 64} width={1.6} height={11} fill={c.stoneDark} />
      <Path d={`M318.6 ${GROUND_Y - 64} L329 ${GROUND_Y - 61} L318.6 ${GROUND_Y - 58} Z`} fill={bus.red} />
      {/* huts */}
      {[18, 92, 168].map((x, i) => (
        <G key={x}>
          <Rect x={x} y={GROUND_Y - 16} width={44} height={18} fill={i % 2 ? c.wall : c.wall2} />
          <Path d={`M${x - 5} ${GROUND_Y - 16} L${x + 22} ${GROUND_Y - 34} L${x + 49} ${GROUND_Y - 16} Z`} fill={i % 2 ? c.tile : c.roof} />
          <Rect x={x + 17} y={GROUND_Y - 10} width={9} height={12} rx={1} fill={door} />
          <Rect x={x + 5} y={GROUND_Y - 11} width={6} height={6} fill={door} opacity={0.5} />
        </G>
      ))}
      {/* water tank on legs */}
      <Path d={`M240 ${GROUND_Y + 2} L243 ${GROUND_Y - 30} M254 ${GROUND_Y + 2} L251 ${GROUND_Y - 30}`} stroke={c.stoneDark} strokeWidth={1.8} />
      <Rect x={236} y={GROUND_Y - 46} width={22} height={16} rx={4} fill={c.tank} />
      <Rect x={236} y={GROUND_Y - 41} width={22} height={1.6} fill={c.stoneDark} opacity={0.6} />
      {/* haystacks, banyan, trees */}
      {[148, 372].map((x) => (
        <Path key={x} d={`M${x - 10} ${GROUND_Y + 2} Q${x} ${GROUND_Y - 22} ${x + 10} ${GROUND_Y + 2} Z`} fill={c.hay} />
      ))}
      <G>
        <Rect x={394} y={GROUND_Y - 26} width={3} height={28} fill={c.trunk} />
        <Circle cx={396} cy={GROUND_Y - 30} r={16} fill={c.treeB} />
        <Circle cx={408} cy={GROUND_Y - 24} r={11} fill={c.treeA} />
        <Circle cx={384} cy={GROUND_Y - 24} r={11} fill={c.treeA} />
      </G>
      <Tree x={70} y={GROUND_Y - 22} r={9} c={c} alt />
      <Tree x={218} y={GROUND_Y - 14} r={8} c={c} />
    </G>
  );
}

function Town({ c, lit }: { c: Palette; lit: number }) {
  const awnings = [bus.red, '#2E7D5B', '#C98A1B', '#3F6FB5', bus.red];
  return (
    <G>
      {Array.from({ length: 5 }, (_, i) => {
        const x = 14 + i * 76;
        const h = 24 + (i % 3) * 8;
        return (
          <G key={i}>
            <Rect x={x} y={GROUND_Y - h} width={66} height={h + 2} fill={i % 2 ? c.shop : c.wall} />
            <Rect x={x} y={GROUND_Y - h} width={66} height={4} fill={c.stoneDark} />
            <Rect x={x + 6} y={GROUND_Y - 14} width={54} height={5} rx={1} fill={awnings[i]} />
            <Rect x={x + 8} y={GROUND_Y - 8} width={20} height={9} fill="#2A3A5E" opacity={0.55} />
            <Rect x={x + 36} y={GROUND_Y - 8} width={20} height={9} fill="#2A3A5E" opacity={0.55} />
            {h > 28 ? Array.from({ length: 3 }, (_, k) => <Rect key={k} x={x + 8 + k * 20} y={GROUND_Y - h + 8} width={9} height={7} rx={1} fill={windowIsLit(i, 3, k, lit) ? LIT : '#FFFFFF'} opacity={windowIsLit(i, 3, k, lit) ? 0.95 : 0.35} />) : null}
          </G>
        );
      })}
      <Tree x={402} y={GROUND_Y - 12} r={9} c={c} alt />
    </G>
  );
}

// ------------------------------------------------------------------- road

const Road = memo(function Road({ look, scale }: { look: HeroLook; scale: number }) {
  const night = look.night;
  const top = mixColor('#6E6670', '#26212E', night * 0.85);
  const bottom = mixColor('#4F4954', '#17131F', night * 0.85);
  const shoulder = mixColor('#C9B79A', '#43394A', night * 0.85);
  const grass = mixColor('#9CCB8C', '#1F3A2E', night * 0.85);
  return (
    <View style={[styles.anchor, { height: (HERO_H + LIFT) * scale }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${HERO_W} ${HERO_H + LIFT}`} preserveAspectRatio="xMidYMax slice">
        <Defs>
          <LinearGradient id="bh-road" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={GROUND_Y} width={HERO_W} height={ROAD_Y - GROUND_Y} fill={grass} />
        <Rect x={0} y={ROAD_Y - 2} width={HERO_W} height={3} fill={shoulder} />
        <Rect x={0} y={ROAD_Y} width={HERO_W} height={HERO_H + LIFT - ROAD_Y} fill="url(#bh-road)" />
        <Rect x={0} y={ROAD_Y + 2.5} width={HERO_W} height={1.4} fill="#FFFFFF" opacity={0.7} />
      </Svg>
    </View>
  );
});

const Dashes = memo(function Dashes({ look, scale }: { look: HeroLook; scale: number }) {
  return (
    <Frame widthVb={DASH_WIDTH} scale={scale}>
      {dashXs().map((x) => (
        <Rect key={x} x={x} y={HERO_H - 5} width={24} height={2} rx={1} fill="#FFFFFF" opacity={0.75 - look.night * 0.25} />
      ))}
    </Frame>
  );
});

// ------------------------------------------------------------- roadside

const NearLayer = memo(function NearLayer({ look, scale }: { look: HeroLook; scale: number }) {
  const night = look.night;
  const pole = mixColor('#8D8794', '#3C3446', night * 0.85);
  const wire = mixColor('#6F6A78', '#2B2433', night * 0.85);
  const bush = mixColor('#6FB07A', '#193328', night * 0.85);
  const poles = useMemo(() => poleXs(), []);
  return (
    <Frame widthVb={NEAR_WIDTH} scale={scale}>
      {poles.slice(0, -1).map((x, i) => (
        <Path key={`w${x}`} d={`M${x + 1} ${ROAD_Y - 30} Q${x + 43} ${ROAD_Y - 24} ${poles[i + 1] + 1} ${ROAD_Y - 30}`} stroke={wire} strokeWidth={0.8} fill="none" />
      ))}
      {poles.map((x, i) => (
        <G key={x}>
          <Rect x={x} y={ROAD_Y - 32} width={2} height={34} fill={pole} />
          <Rect x={x - 5} y={ROAD_Y - 32} width={12} height={1.6} fill={pole} />
          {night > 0.25 && i % 2 === 0 ? (
            <G>
              <Circle cx={x - 4} cy={ROAD_Y - 29.5} r={5} fill={LAMP} opacity={night * 0.25} />
              <Circle cx={x - 4} cy={ROAD_Y - 30} r={1.3} fill={LAMP} opacity={night} />
            </G>
          ) : null}
          <Circle cx={x + 44} cy={ROAD_Y - 1} r={3.4 + (i % 3)} fill={bush} />
          <Circle cx={x + 49} cy={ROAD_Y} r={2.6 + (i % 2)} fill={bush} opacity={0.9} />
        </G>
      ))}
      {SIGNS.map((s) => (
        <Signboard key={s.name} x={signX(s.scene)} name={s.name} night={night} />
      ))}
    </Frame>
  );
});

/** A green roadside board with a place name. Decorative. */
function Signboard({ x, name, night }: { x: number; name: string; night: number }) {
  const w = 22 + name.length * 5.6;
  const post = mixColor('#9A949F', '#463E4F', night * 0.85);
  const board = mixColor('#1F8F5A', '#10523A', night * 0.7);
  return (
    <G>
      <Rect x={x + 6} y={ROAD_Y - 30} width={2.2} height={32} fill={post} />
      <Rect x={x + w - 8} y={ROAD_Y - 30} width={2.2} height={32} fill={post} />
      <Rect x={x} y={ROAD_Y - 54} width={w} height={26} rx={3} fill={board} stroke="#FFFFFF" strokeWidth={1.2} />
      <SvgText x={x + w / 2} y={ROAD_Y - 38} fontFamily={FONT} fontSize={10.5} fontWeight="800" fill="#FFFFFF" textAnchor="middle">
        {name}
      </SvgText>
      <Path d={`M${x + 8} ${ROAD_Y - 33} H${x + w - 8} m-4 -2.6 l4 2.6 l-4 2.6`} stroke="#FFFFFF" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

// -------------------------------------------------------------------- bus

const WHEELS = [26, 92];
const WHEEL_R = 6.4;
const WHEEL_CY = WHEEL_BOTTOM - WHEEL_R;
/** Milliseconds per wheel turn at the near speed: circumference over speed. */
const WHEEL_MS = Math.round(((2 * Math.PI * WHEEL_R) / ((NEAR_PERIOD / NEAR_MS) * 1000)) * 1000);

/** The bus stands at a fixed place; the body rocks very slightly and the wheels turn. */
function BusLayer({ look, scale, animate }: { look: HeroLook; scale: number; animate: boolean }) {
  const [rock] = useState(() => new Animated.Value(0));
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    rock.setValue(0);
    spin.setValue(0);
    if (!animate) {
      rock.stopAnimation();
      spin.stopAnimation();
      return;
    }
    const r = Animated.loop(
      Animated.sequence([
        Animated.timing(rock, { toValue: 1, duration: 190, easing: Easing.inOut(Easing.sin), useNativeDriver: useNative }),
        Animated.timing(rock, { toValue: 0, duration: 260, easing: Easing.inOut(Easing.sin), useNativeDriver: useNative }),
      ]),
    );
    const s = Animated.loop(Animated.timing(spin, { toValue: 1, duration: WHEEL_MS, easing: Easing.linear, useNativeDriver: useNative }));
    r.start();
    s.start();
    return () => {
      r.stop();
      s.stop();
    };
  }, [animate, rock, spin]);
  const d = WHEEL_R * 2 * scale;
  return (
    <>
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          bottom: LIFT * scale,
          width: HERO_W * scale,
          height: HERO_H * scale,
          transform: [{ translateY: rock.interpolate({ inputRange: [0, 1], outputRange: [0, -0.8 * scale] }) }],
        }}
      >
        <Frame widthVb={HERO_W} scale={scale}>
          <G transform={`translate(${BUS_X} ${WHEEL_BOTTOM})`}>
            <BusArt look={look} />
          </G>
        </Frame>
      </Animated.View>
      {WHEELS.map((wx) => (
        <Animated.View
          key={wx}
          style={{
            position: 'absolute',
            left: (BUS_X + wx - WHEEL_R) * scale,
            bottom: (LIFT + HERO_H - WHEEL_CY - WHEEL_R) * scale,
            width: d,
            height: d,
            transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
          }}
        >
          <Svg width={d} height={d} viewBox={`${-WHEEL_R} ${-WHEEL_R} ${WHEEL_R * 2} ${WHEEL_R * 2}`}>
            <Circle r={WHEEL_R} fill="#1E1B22" />
            <Circle r={WHEEL_R * 0.62} fill="#B9B5C0" />
            <Circle r={WHEEL_R * 0.3} fill="#5B5662" />
            {[0, 72, 144, 216, 288].map((a) => (
              <Line key={a} x1={0} y1={0} x2={Math.cos((a * Math.PI) / 180) * WHEEL_R * 0.6} y2={Math.sin((a * Math.PI) / 180) * WHEEL_R * 0.6} stroke="#5B5662" strokeWidth={0.9} />
            ))}
          </Svg>
        </Animated.View>
      ))}
    </>
  );
}

/** The bus on the road line at y = 0 (tyre bottoms), facing right (x 0..120). The lettering is decorative. */
function BusArt({ look }: { look: HeroLook }) {
  const night = look.night;
  const body = mixColor('#D32F2F', '#A32024', night * 0.5);
  const skirt = mixColor('#A61F23', '#7A171B', night * 0.5);
  const glass = mixColor('#BFE3F5', '#FFE9A8', look.trainLight);
  const frame = mixColor('#8E1B1B', '#5E1214', night * 0.5);
  const light = look.trainLight;
  return (
    <G>
      <Defs>
        <LinearGradient id="bh-beam" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFE9A8" stopOpacity="0.75" />
          <Stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="bh-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mixColor(body, '#FFFFFF', 0.12)} />
          <Stop offset="1" stopColor={body} />
        </LinearGradient>
      </Defs>
      {light > 0.05 ? <Path d="M117 -10 L172 -26 L172 6 Z" fill="url(#bh-beam)" opacity={light * 0.75} /> : null}
      {/* chassis and body */}
      <Rect x={1} y={-9} width={BUS_LEN - 2} height={7} fill={skirt} />
      <Rect x={0} y={-35} width={BUS_LEN - 2} height={29} rx={5} fill="url(#bh-body)" />
      <Path d={`M${BUS_LEN - 4} -35 H${BUS_LEN - 12} L${BUS_LEN - 2} -17 V-6 H${BUS_LEN - 4} Z`} fill="url(#bh-body)" />
      {/* white roof cap and AC pod */}
      <Rect x={2} y={-37} width={BUS_LEN - 18} height={3.4} rx={1.7} fill="#FFFFFF" />
      <Rect x={26} y={-40} width={30} height={3.6} rx={1.8} fill="#F1EAEA" />
      {/* windows */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Rect key={i} x={7 + i * 15.4} y={-31} width={12.4} height={11} rx={2} fill={glass} stroke={frame} strokeWidth={0.7} />
      ))}
      <Path d={`M97.4 -31 H${BUS_LEN - 15} L${BUS_LEN - 4} -18 H97.4 Z`} fill={glass} stroke={frame} strokeWidth={0.7} />
      
      {/* white stripe and lettering */}
      <Rect x={0} y={-17} width={BUS_LEN - 4} height={2} fill="#FFFFFF" opacity={0.95} />
      <SvgText x={56} y={-9.2} fontFamily={FONT} fontSize={9.4} fontWeight="800" letterSpacing={1.6} fill="#FFFFFF" textAnchor="middle">
        GSRTC
      </SvgText>
      {/* door, destination board, lights */}
      <Rect x={84} y={-31} width={11} height={20} rx={1.6} fill={mixColor(glass, '#FFFFFF', 0.2)} stroke={frame} strokeWidth={0.7} opacity={0.95} />
      <Rect x={BUS_LEN - 15} y={-37} width={11} height={2.6} rx={1} fill="#FFC857" />
      <Rect x={BUS_LEN - 3.4} y={-12} width={3.4} height={4.4} rx={1.2} fill={mixColor('#FFF4C2', '#FFE9A8', light)} />
      <Rect x={0} y={-12} width={2.2} height={4.4} rx={1} fill="#FF5A5A" />
      <Rect x={BUS_LEN - 8} y={-5} width={9} height={3} rx={1.2} fill="#2A2530" />
      {/* wheel arches (the wheels themselves are separate, so they can turn) */}
      {WHEELS.map((wx) => (
        <Path key={wx} d={`M${wx - WHEEL_R - 2.4} -2 A${WHEEL_R + 2.4} ${WHEEL_R + 2.4} 0 0 1 ${wx + WHEEL_R + 2.4} -2 Z`} fill="#2A2530" />
      ))}
    </G>
  );
}

// ------------------------------------------------------------- speed streaks

const STREAKS: [number, number, number][] = [
  [10, 40, 56], [118, 30, 38], [200, 52, 66], [290, 36, 44], [360, 58, 52],
  [40, 68, 60], [160, 78, 42], [250, 70, 70], [340, 82, 48], [402, 62, 34],
];

const Streaks = memo(function Streaks({ look, scale }: { look: HeroLook; scale: number }) {
  const color = mixColor('#FFFFFF', '#E6B7C0', look.night);
  const opacity = 0.42 - look.night * 0.18;
  return (
    <Frame widthVb={STREAK_PERIOD * 2} scale={scale}>
      {[0, 1].map((copy) => STREAKS.map(([x, y, len], i) => <Rect key={`${copy}-${i}`} x={x + copy * STREAK_PERIOD} y={y} width={len} height={1.1} rx={0.55} fill={color} opacity={opacity} />))}
    </Frame>
  );
});

// --------------------------------------------------------------- readability

/** A soft veil behind the title (left) and a fade into the page background (bottom). */
const Veil = memo(function Veil({ look }: { look: HeroLook }) {
  const back = headerBackdrop(look);
  return (
    <View style={[StyleSheet.absoluteFill]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="bh-left" cx="0.22" cy="0.28" rx="0.5" ry="0.4">
            <Stop offset="0" stopColor={back} stopOpacity={0.8} />
            <Stop offset="0.6" stopColor={back} stopOpacity={0.45} />
            <Stop offset="1" stopColor={back} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="bh-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={BG} stopOpacity={0} />
            <Stop offset="0.88" stopColor={BG} stopOpacity={0} />
            <Stop offset="1" stopColor={BG} stopOpacity={0.9} />
          </LinearGradient>
        </Defs>
        <Rect width={100} height={100} fill="url(#bh-left)" />
        <Rect width={100} height={100} fill="url(#bh-fade)" />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  anchor: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
