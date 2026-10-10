import React, { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { mixColor, windowIsLit, windowThreshold, headerBackdrop, type HeroLook } from '../../lib/skyPalette';
import { Clouds, Stars, TrainArt } from '../home/Hero';
import {
  DECK_Y,
  FAR_MS,
  FAR_PERIOD,
  HERO_H,
  HERO_W,
  MID_MS,
  MID_PERIOD,
  NEAR_MS,
  NEAR_PERIOD,
  NEAR_WIDTH,
  PILLAR_SPACING,
  STATION_CYCLE,
  STREAK_MS,
  STREAK_PERIOD,
  TRAIN_X,
  pillarXs,
  stationCentres,
} from './heroGeometry';

/*
 * Animated header for the Stations screen. A fast metro runs along a viaduct at a fixed place on screen
 * while the world slides past it in layers moving at different speeds (far skyline slowest, station
 * canopies and pillars at train speed, light streaks fastest), so it reads as speed. A new station canopy
 * goes by about every second. The sky, sun/moon, stars, clouds, lit windows and train lights follow the
 * real time of day, exactly like the Home hero (lib/skyPalette.ts).
 *
 * Original vector artwork. The stations are generic canopies, not any specific GMRC station. Everything
 * that moves is a native-driven translate of a periodic strip, so nothing re-renders per frame. With
 * reduced motion, or when the screen is not focused, it stands still with the train at a station.
 */

const useNative = Platform.OS !== 'web';
const BG = '#F7F7FF';
const LIT = '#FFE08A';
const LAMP = '#FFE9A8';

interface Props {
  height: number;
  look: HeroLook;
  animate: boolean;
  /** Canopy name-board colours, cycled along the line (corridor colours). */
  accents: string[];
}

export function StationsHero({ height, look, animate, accents }: Props) {
  const [w, setW] = useState(HERO_W);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const scale = w / HERO_W;
  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, { height, overflow: 'hidden', backgroundColor: look.skyTop }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Sky look={look} scale={scale} />
      <Stars look={look} height={height} animate={animate} />
      <Clouds look={look} scale={scale} animate={animate} />
      <Scroller widthVb={FAR_PERIOD * 2} period={FAR_PERIOD} ms={FAR_MS} scale={scale} animate={animate}>
        <FarLayer look={look} scale={scale} />
      </Scroller>
      <Scroller widthVb={MID_PERIOD * 2} period={MID_PERIOD} ms={MID_MS} scale={scale} animate={animate}>
        <MidLayer look={look} scale={scale} />
      </Scroller>
      <Scroller widthVb={NEAR_WIDTH} period={NEAR_PERIOD} ms={NEAR_MS} scale={scale} animate={animate}>
        <NearLayer look={look} scale={scale} accents={accents} />
      </Scroller>
      <TrainLayer look={look} scale={scale} animate={animate} />
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
        bottom: 0,
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
  // Map the Home hero's body arc (y 82 at noon .. 132 at the horizon) onto this shorter header.
  const by = b ? 14 + ((b.y - 82) / 50) * 44 : 0;
  return (
    <View style={[styles.anchor, { height: HERO_H * scale }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${HERO_W} ${HERO_H}`} preserveAspectRatio="xMidYMax slice">
        <Defs>
          <LinearGradient id="sh-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={look.skyTop} />
            <Stop offset="1" stopColor={look.skyBottom} />
          </LinearGradient>
          <RadialGradient id="sh-glow" cx="0.78" cy="0.72" rx="0.6" ry="0.6">
            <Stop offset="0" stopColor={look.glow} stopOpacity={look.glowOpacity} />
            <Stop offset="1" stopColor={look.glow} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={HERO_W} height={HERO_H} fill="url(#sh-sky)" />
        <Rect width={HERO_W} height={HERO_H} fill="url(#sh-glow)" />
        {b ? (
          b.kind === 'sun' ? (
            <G opacity={b.opacity}>
              <Circle cx={b.x} cy={by} r={20} fill={b.color} opacity={0.18} />
              <Circle cx={b.x} cy={by} r={12} fill={b.color} opacity={0.3} />
              <Circle cx={b.x} cy={by} r={7} fill={b.color} />
            </G>
          ) : (
            <G opacity={b.opacity}>
              <Circle cx={b.x} cy={by} r={17} fill="#CFCBFF" opacity={0.12} />
              <Circle cx={b.x} cy={by} r={6} fill={b.color} />
              <Circle cx={b.x + 2.6} cy={by - 1.3} r={5.3} fill={mixColor(look.skyTop, look.skyBottom, by / HERO_H)} />
            </G>
          )
        ) : null}
      </Svg>
    </View>
  );
});

// ------------------------------------------------------------ far skyline

// Deterministic skyline, one period wide: [x, top, width].
const FAR_TOWERS: [number, number, number][] = Array.from({ length: 13 }, (_, i) => {
  const x = i * 33 + windowThreshold(i, 1, 21) * 8;
  return [x, 46 + Math.round(windowThreshold(i, 2, 21) * 32), 15 + Math.round(windowThreshold(i, 3, 21) * 12)];
});

const FarLayer = memo(function FarLayer({ look, scale }: { look: HeroLook; scale: number }) {
  const { litD, unlitD } = useMemo(() => {
    let lit = '';
    let unlit = '';
    for (let copy = 0; copy < 2; copy++) {
      FAR_TOWERS.forEach(([x0, y, w], ti) => {
        const x = x0 + copy * FAR_PERIOD;
        const cols = Math.max(1, Math.floor((w - 4) / 4.6));
        let row = 0;
        for (let ry = y + 6; ry < DECK_Y - 4; ry += 8, row++) {
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
  const unlitColor = mixColor('#FFFFFF', '#0B0A2E', look.night);
  return (
    <Frame widthVb={FAR_PERIOD * 2} scale={scale}>
      <Defs>
        <LinearGradient id="sh-far" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={look.farTop} />
          <Stop offset="1" stopColor={look.farBottom} />
        </LinearGradient>
      </Defs>
      {[0, 1].map((copy) =>
        FAR_TOWERS.map(([x, y, w]) => <Rect key={`${copy}-${x}`} x={x + copy * FAR_PERIOD} y={y} width={w} height={DECK_Y + 4 - y} rx={2} fill="url(#sh-far)" />),
      )}
      {/* a domed hall in the haze, as on the Home hero */}
      {[0, 1].map((copy) => (
        <G key={`d${copy}`} transform={`translate(${copy * FAR_PERIOD} 0)`}>
          <Rect x={300} y={DECK_Y - 22} width={44} height={22} rx={1.5} fill={look.domeBase} opacity={0.9} />
          <Path d={`M308 ${DECK_Y - 22} Q322 ${DECK_Y - 48} 336 ${DECK_Y - 22} Z`} fill={look.domeTop} opacity={0.9} />
          <Rect x={321} y={DECK_Y - 54} width={2} height={8} fill={look.domeTop} opacity={0.9} />
        </G>
      ))}
      <Path d={unlitD} fill={unlitColor} opacity={0.3} />
      <Path d={litD} fill={LIT} opacity={0.9} />
    </Frame>
  );
});

// ------------------------------------------------------------ mid scenery

const TREES: [number, number, number][] = Array.from({ length: 9 }, (_, i) => [
  i * 49 + windowThreshold(i, 4, 33) * 14,
  DECK_Y - 4 + Math.round(windowThreshold(i, 5, 33) * 4),
  8 + Math.round(windowThreshold(i, 6, 33) * 7),
]);
const SHOPS: [number, number][] = [[20, 24], [150, 30], [270, 22], [372, 28]];

const MidLayer = memo(function MidLayer({ look, scale }: { look: HeroLook; scale: number }) {
  const night = look.night;
  const treeA = mixColor('#A9DEC3', '#1F3B58', night * 0.85);
  const treeB = mixColor('#8FD0AE', '#183049', night * 0.85);
  const shop = mixColor(look.nearTop, look.nearBottom, 0.5);
  return (
    <Frame widthVb={MID_PERIOD * 2} scale={scale}>
      {[0, 1].map((copy) => (
        <G key={copy} transform={`translate(${copy * MID_PERIOD} 0)`}>
          {SHOPS.map(([x, w], i) => (
            <Rect key={`s${i}`} x={x} y={DECK_Y - 16 - (i % 2) * 5} width={w} height={22 + (i % 2) * 5} rx={1.5} fill={shop} />
          ))}
          {TREES.map(([x, y, r], i) => (
            <G key={`t${i}`}>
              <Circle cx={x} cy={y} r={r} fill={i % 2 ? treeB : treeA} />
              <Circle cx={x + r * 0.5} cy={y + r * 0.4} r={r * 0.7} fill={i % 2 ? treeA : treeB} />
            </G>
          ))}
        </G>
      ))}
    </Frame>
  );
});

// --------------------------------------------------------- viaduct + stations

const NearLayer = memo(function NearLayer({ look, scale, accents }: { look: HeroLook; scale: number; accents: string[] }) {
  const night = look.night;
  const glow = night * 0.9;
  const deckTop = mixColor('#D2CFEC', '#4A4A92', night * 0.75);
  const deckBottom = mixColor('#B9B5DE', '#34347A', night * 0.75);
  const pillar = mixColor('#C6C3E5', '#3C3C84', night * 0.75);
  const roof = mixColor('#8C83D8', '#4C4CA4', night * 0.9);
  const roofTop = mixColor('#A79FE6', '#6969C2', night * 0.9);
  const post = mixColor('#9B94DC', '#4A4A9A', night * 0.9);
  const glass = mixColor('#FFFFFF', '#9FA6F2', night);
  const tower = mixColor('#C9C5F0', '#3E3E8C', night * 0.9);
  const towerGlass = mixColor('#EEF0FF', '#2A2A66', night * 0.85);
  const centres = useMemo(() => stationCentres(), []);
  const pillars = useMemo(() => pillarXs(), []);
  const palette = accents.length ? accents : ['#4F35E8'];
  return (
    <Frame widthVb={NEAR_WIDTH} scale={scale}>
      <Defs>
        <LinearGradient id="sh-deck" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={deckTop} />
          <Stop offset="1" stopColor={deckBottom} />
        </LinearGradient>
      </Defs>
      {pillars.map((x) => (
        <G key={x}>
          <Path d={`M${x - 5} ${DECK_Y + 6} H${x + 5} L${x + 7} ${HERO_H} H${x - 7} Z`} fill={pillar} />
          <Rect x={x - 9} y={DECK_Y + 5} width={18} height={3.4} rx={1.4} fill={deckBottom} />
        </G>
      ))}
      <Rect x={0} y={DECK_Y} width={NEAR_WIDTH} height={6} fill="url(#sh-deck)" />
      {night > 0.25
        ? pillars.map((x) => (
            <G key={`l${x}`}>
              <Circle cx={x + PILLAR_SPACING / 2} cy={DECK_Y - 1.6} r={3.4} fill={LAMP} opacity={night * 0.28} />
              <Circle cx={x + PILLAR_SPACING / 2} cy={DECK_Y - 1.6} r={1} fill={LAMP} opacity={night * 0.95} />
            </G>
          ))
        : null}
      {centres.map((cx, i) => {
        const v = i % STATION_CYCLE;
        const accent = palette[v % palette.length];
        const towerSide = v % 2 === 0 ? 1 : -1;
        const tx = cx + towerSide * 92;
        return (
          <G key={cx}>
            {/* lift tower at the platform end (upright) */}
            <Rect x={tx - 8} y={DECK_Y - 46} width={16} height={47} rx={2} fill={tower} />
            <Rect x={tx - 5.5} y={DECK_Y - 42} width={11} height={38} rx={1.2} fill={towerGlass} opacity={0.95} />
            <Rect x={tx - 3} y={DECK_Y - 28} width={6} height={10} rx={1.2} fill="#6A55F0" opacity={0.85} />
            <Rect x={tx - 10} y={DECK_Y - 49} width={20} height={3.6} rx={1.8} fill={roofTop} />
            {glow > 0.05 ? <Rect x={tx - 5.5} y={DECK_Y - 42} width={11} height={38} rx={1.2} fill={LAMP} opacity={glow * 0.28} /> : null}
            {/* canopy: glazed screens, posts, roof */}
            {[-62, -31, 0, 31].map((px) => (
              <Rect key={`g${px}`} x={cx + px + 2} y={DECK_Y - 32} width={27} height={12} fill={glass} opacity={0.22} />
            ))}
            {[-64, -32, 0, 32, 64].map((px) => (
              <Rect key={px} x={cx + px - 1.2} y={DECK_Y - 36} width={2.4} height={36} rx={0.8} fill={post} />
            ))}
            <Rect x={cx - 74} y={DECK_Y - 38} width={148} height={2.6} fill={roof} />
            <Rect x={cx - 78} y={DECK_Y - 43} width={156} height={5.4} rx={2.7} fill={roofTop} />
            {/* hanging information boards */}
            {[-44, 10].map((bx) => (
              <G key={bx}>
                <Rect x={cx + bx + 7} y={DECK_Y - 35} width={1} height={2} fill={post} />
                <Rect x={cx + bx} y={DECK_Y - 34} width={15} height={6.4} rx={1.4} fill={mixColor('#2A3563', '#0F1536', night)} />
                <Rect x={cx + bx + 1.8} y={DECK_Y - 32.4} width={8} height={1.2} rx={0.6} fill="#FFC857" opacity={0.95} />
                <Rect x={cx + bx + 11} y={DECK_Y - 32.2} width={2.4} height={2.4} rx={0.6} fill="#5BE0A3" />
              </G>
            ))}
            {/* raised station name board with the line colour */}
            <Rect x={cx - 15} y={DECK_Y - 52} width={2} height={9.6} fill={post} />
            <Rect x={cx + 13} y={DECK_Y - 52} width={2} height={9.6} fill={post} />
            <Rect x={cx - 24} y={DECK_Y - 61} width={48} height={13} rx={4} fill={accent} />
            <Circle cx={cx - 15} cy={DECK_Y - 54.5} r={4.4} fill="#FFFFFF" />
            <Rect x={cx - 17.1} y={DECK_Y - 57} width={4.2} height={4.8} rx={1.2} fill="none" stroke={accent} strokeWidth={1} />
            <Rect x={cx - 8} y={DECK_Y - 57.6} width={26} height={1.8} rx={0.9} fill="#FFFFFF" opacity={0.95} />
            <Rect x={cx - 8} y={DECK_Y - 53.6} width={17} height={1.8} rx={0.9} fill="#FFFFFF" opacity={0.6} />
            {glow > 0.05
              ? [-48, -16, 16, 48].map((lx) => <Rect key={lx} x={cx + lx - 7} y={DECK_Y - 35} width={14} height={1.6} rx={0.8} fill={LAMP} opacity={glow} />)
              : null}
          </G>
        );
      })}
    </Frame>
  );
});

// -------------------------------------------------------------------- train

/** The train stands at a fixed place; it rocks very slightly as it runs. */
function TrainLayer({ look, scale, animate }: { look: HeroLook; scale: number; animate: boolean }) {
  const [rock] = useState(() => new Animated.Value(0));
  useEffect(() => {
    rock.setValue(0);
    if (!animate) {
      rock.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rock, { toValue: 1, duration: 170, easing: Easing.inOut(Easing.sin), useNativeDriver: useNative }),
        Animated.timing(rock, { toValue: 0, duration: 230, easing: Easing.inOut(Easing.sin), useNativeDriver: useNative }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, rock]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: HERO_W * scale,
        height: HERO_H * scale,
        transform: [{ translateY: rock.interpolate({ inputRange: [0, 1], outputRange: [0, -0.7 * scale] }) }],
      }}
    >
      <Frame widthVb={HERO_W} scale={scale}>
        <G transform={`translate(${TRAIN_X} ${DECK_Y})`}>
          <TrainArt look={look} idPrefix="sh-tr" />
        </G>
      </Frame>
    </Animated.View>
  );
}

// ------------------------------------------------------------- speed streaks

// [x, y, length]: kept above the train and below the deck so they never cross the carriages.
const STREAKS: [number, number, number][] = [
  [10, 72, 58], [96, 58, 40], [180, 76, 70], [262, 64, 46], [330, 73, 62], [388, 54, 36],
  [40, 113, 66], [150, 118, 48], [236, 114, 72], [330, 120, 54], [400, 112, 40],
];

const Streaks = memo(function Streaks({ look, scale }: { look: HeroLook; scale: number }) {
  const color = mixColor('#FFFFFF', '#B7B9F0', look.night);
  const opacity = 0.5 - look.night * 0.2;
  return (
    <Frame widthVb={STREAK_PERIOD * 2} scale={scale}>
      {[0, 1].map((copy) =>
        STREAKS.map(([x, y, len], i) => (
          <Rect key={`${copy}-${i}`} x={x + copy * STREAK_PERIOD} y={y} width={len} height={1.1} rx={0.55} fill={color} opacity={opacity} />
        )),
      )}
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
          <RadialGradient id="sh-left" cx="0.22" cy="0.3" rx="0.5" ry="0.42">
            <Stop offset="0" stopColor={back} stopOpacity={0.8} />
            <Stop offset="0.6" stopColor={back} stopOpacity={0.45} />
            <Stop offset="1" stopColor={back} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="sh-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={BG} stopOpacity={0} />
            <Stop offset="0.84" stopColor={BG} stopOpacity={0} />
            <Stop offset="1" stopColor={BG} stopOpacity={0.92} />
          </LinearGradient>
        </Defs>
        <Rect width={100} height={100} fill="url(#sh-left)" />
        <Rect width={100} height={100} fill="url(#sh-fade)" />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  anchor: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
