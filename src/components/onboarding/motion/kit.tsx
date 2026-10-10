import React, { createContext, memo, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { BOARD_H, BOARD_W, OVERSCAN, VIEWBOX, ob } from '../palette';
import { MetroMateLogo } from '../../brand/MetroMateLogo';
import { pointAt, stage, stageOut, type Track } from './pathMath';

/*
 * Motion kit for the onboarding scenes. A scene is a "board" of 360 x 440 artboard units (plus 60 units of
 * overscan each side) scaled to the phone.
 *
 * Performance rules every scene follows:
 *  - Static artwork is drawn once in a few `Layer`s. A layer's entrance is a native opacity/translate; its
 *    Svg never re-renders after mount.
 *  - Anything that moves for a long time (vehicles, pulses, clouds, the progress line) is a plain view moved
 *    by transforms on the UI thread. No Svg attribute is animated in a loop, so nothing is redrawn per frame.
 *  - The only Svg attribute animation (a route drawing itself) runs once, during the entrance.
 *  - A scene assembles the first time it slides into view and then stays put; visiting it again never
 *    replays or resets it. Loops run only while the page is the one on screen.
 */

interface BoardCtx {
  /** Screen pixels per artboard unit. */
  scale: number;
  /** Width of one pager page, for parallax. */
  pageW: number;
  /** Page position of the pager (float) and this scene's index. */
  progress: SharedValue<number>;
  index: number;
}
const Ctx = createContext<BoardCtx | null>(null);
export const useBoard = (): BoardCtx => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBoard outside <Board>');
  return v;
};

export function Board({ scale, pageW, progress, index, children }: BoardCtx & { children: ReactNode }) {
  const value = useMemo(() => ({ scale, pageW, progress, index }), [scale, pageW, progress, index]);
  return (
    <Ctx.Provider value={value}>
      <View style={{ width: (BOARD_W + OVERSCAN * 2) * scale, height: BOARD_H * scale, alignSelf: 'center' }}>{children}</View>
    </Ctx.Provider>
  );
}

// --------------------------------------------------------------------------------- clock

export const LOOP_REST = 0.32;

/**
 * The two clocks of a scene.
 *  - `t` (0 → 1) assembles the scene once: it starts as soon as the page begins to slide into view and never
 *    resets afterwards.
 *  - `loop` (0 → 1, repeating) drives vehicles and pulses, only while the page is the one on screen; pausing keeps
 *    its position, so resuming continues smoothly instead of jumping.
 * Both are started and paused on the UI thread from the pager position, so paging never re-renders a scene.
 * With reduced motion both are fixed: the scene is complete and still.
 */
export function useSceneClock(reduced: boolean, buildMs: number, loopMs: number) {
  const { progress, index } = useBoard();
  const t = useSharedValue(reduced ? 1 : 0);
  const played = useSharedValue(reduced ? 1 : 0);
  const loop = useSharedValue(LOOP_REST);

  useAnimatedReaction(
    () => {
      const d = Math.abs(progress.value - index);
      return d < 0.5 ? 2 : d < 0.92 ? 1 : 0;
    },
    (state, prev) => {
      if (reduced) return;
      if (state > 0 && played.value === 0) {
        played.value = 1;
        t.value = withTiming(1, { duration: buildMs, easing: Easing.linear });
      }
      const on = state === 2;
      const was = prev === 2;
      if (on === was && prev !== null) return;
      if (!on) {
        cancelAnimation(loop);
        return;
      }
      const from = loop.value;
      loop.value = withSequence(
        withTiming(1, { duration: Math.max(1, loopMs * (1 - from)), easing: Easing.linear }),
        withTiming(0, { duration: 0 }),
        withRepeat(withTiming(1, { duration: loopMs, easing: Easing.linear }), -1, false),
      );
    },
    [reduced, buildMs, loopMs, index],
  );

  useEffect(() => {
    if (!reduced) return;
    cancelAnimation(t);
    cancelAnimation(loop);
    played.set(1);
    t.set(1);
    loop.set(LOOP_REST);
  }, [reduced, t, loop, played]);
  useEffect(() => () => cancelAnimation(loop), [loop]);
  return { t, loop };
}

/** Position along a track from the looping clock: `cycles` whole trips per loop (so the loop wraps seamlessly), offset by `phase`. */
export function useLoopProgress(loop: SharedValue<number>, cycles = 1, phase = 0) {
  return useDerivedValue(() => {
    const v = (loop.value * cycles + phase) % 1;
    return v < 0 ? v + 1 : v;
  });
}

// -------------------------------------------------------------------------------- layers

interface LayerProps {
  /** Scene timeline; the layer settles in between `from` and `to`. */
  t: SharedValue<number>;
  from?: number;
  to?: number;
  /** Starts this many units lower and rises into place (keep it small: 6–14). */
  dy?: number;
  /** Parallax: a small positive depth (≤ 0.1) makes the layer lag a swipe slightly, like something far away. */
  depth?: number;
  children: ReactNode;
}

/** A static Svg layer with a one-off native entrance (fade + rise) and optional gentle parallax. */
export const Layer = memo(function Layer({ t, from = 0, to = 0.3, dy = 10, depth = 0, children }: LayerProps) {
  const { scale, pageW, progress, index } = useBoard();
  const style = useAnimatedStyle(() => {
    const s = stageOut(t.value, from, to);
    return {
      opacity: s,
      transform: [{ translateY: (1 - s) * dy * scale }, { translateX: depth === 0 ? 0 : (progress.value - index) * depth * pageW }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" viewBox={VIEWBOX}>
        {children}
      </Svg>
    </Animated.View>
  );
});

/** A layer that is always fully drawn (sky, ground). */
export const Backdrop = memo(function Backdrop({ depth = 0, children }: { depth?: number; children: ReactNode }) {
  const { pageW, progress, index } = useBoard();
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: depth === 0 ? 0 : (progress.value - index) * depth * pageW }] }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" viewBox={VIEWBOX}>
        {children}
      </Svg>
    </Animated.View>
  );
});

// ------------------------------------------------------------------------------- sprites

interface SpriteProps {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Animated style(s) from the caller. */
  animated?: ViewStyle | object | (ViewStyle | object)[];
  /** Pivot for transforms, e.g. 'bottom' for a tree. */
  origin?: string;
  children: ReactNode;
}

/** A small independent Svg at a fixed place on the board, so it can move on its own without redrawing. */
export function Sprite({ x, y, w, h, animated, origin, children }: SpriteProps) {
  const { scale } = useBoard();
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: (x + OVERSCAN) * scale, top: y * scale, width: w * scale, height: h * scale }, origin ? ({ transformOrigin: origin } as ViewStyle) : null, animated as ViewStyle]}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

const wave = (loop: number, cycles: number, phase: number) => {
  'worklet';
  return Math.sin((loop * cycles + phase) * Math.PI * 2);
};

/** Gentle sway about the base (trees). */
export function useSway(loop: SharedValue<number>, cycles: number, phase: number, degrees: number) {
  return useAnimatedStyle(() => ({ transform: [{ rotate: `${wave(loop.value, cycles, phase) * degrees}deg` }] }));
}

/** Gentle float: vertical by default, horizontal for drifting clouds. */
export function useFloat(loop: SharedValue<number>, cycles: number, phase: number, units: number, axis: 'y' | 'x' = 'y') {
  const { scale } = useBoard();
  return useAnimatedStyle(() => {
    const v = wave(loop.value, cycles, phase) * units * scale;
    return { transform: axis === 'y' ? [{ translateY: v }] : [{ translateX: v }] };
  });
}

/** Soft entrance for a small element: fade with a slight scale-up, eased (no bounce). */
export function usePop(t: SharedValue<number>, from: number, to: number) {
  return useAnimatedStyle(() => {
    const s = stageOut(t.value, from, to);
    return { opacity: s, transform: [{ scale: 0.86 + 0.14 * s }] };
  });
}

/** Soft entrance that then floats: one transform, so the two never fight over the same style. */
export function usePopFloat(t: SharedValue<number>, from: number, to: number, loop: SharedValue<number>, cycles: number, phase: number, units: number) {
  const { scale } = useBoard();
  return useAnimatedStyle(() => {
    const s = stageOut(t.value, from, to);
    return { opacity: s, transform: [{ translateY: (wave(loop.value, cycles, phase) * units + (1 - s) * 8) * scale }, { scale: 0.9 + 0.1 * s }] };
  });
}

// ------------------------------------------------------------------------------ vehicles

interface VehicleProps {
  track: Track;
  /** 0..1 along the track. */
  p: SharedValue<number>;
  w: number;
  h: number;
  /** 0..1 opacity; default fully visible. */
  visible?: SharedValue<number>;
  /** Keep level instead of tilting with the track. */
  level?: boolean;
  /** Distance (units) behind the given position: lets several cars follow one another. */
  lag?: number;
  children: ReactNode;
}

/** Moves art along a track; faces right on rightward travel and mirrors on leftward travel. */
export function Vehicle({ track, p, w, h, visible, level, lag = 0, children }: VehicleProps) {
  const { scale } = useBoard();
  const style = useAnimatedStyle(() => {
    const [x, y, a] = pointAt(track, p.value * track.total - lag);
    const left = Math.cos(a) < 0;
    const ang = level ? 0 : left ? a + Math.PI : a;
    return {
      opacity: visible ? visible.value : 1,
      transform: [{ translateX: (x + OVERSCAN) * scale - (w * scale) / 2 }, { translateY: y * scale - (h * scale) / 2 }, { rotate: `${ang}rad` }, { scaleX: left ? -1 : 1 }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: w * scale, height: h * scale }, style]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

// ----------------------------------------------------------------------------- route lines

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface RouteStrokeProps {
  d: string;
  /** Length of the path in units. */
  length: number;
  /** Drawn while `draw` goes from `from` to `to`. Use the build clock `t`, so it animates once and then never again. */
  draw: SharedValue<number>;
  from?: number;
  to?: number;
  color: string;
  width?: number;
  opacity?: number;
}

/** A route line that draws itself once. */
export function RouteStroke({ d, length, draw, from = 0, to = 1, color, width = 5, opacity = 1 }: RouteStrokeProps) {
  const props = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - stageOut(draw.value, from, to)) }));
  return <AnimatedPath d={d} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={[length + 1, length + 1]} opacity={opacity} animatedProps={props} />;
}

/**
 * Reveals its (static) contents from the left up to `edgeX` (artboard units) with two counter-moving transforms,
 * so a long route line can grow every frame without its Svg ever being redrawn. Use for paths whose x only grows.
 */
export function WipeReveal({ edgeX, visible, children }: { edgeX: SharedValue<number>; visible?: SharedValue<number>; children: ReactNode }) {
  const { scale } = useBoard();
  const fullW = (BOARD_W + OVERSCAN * 2) * scale;
  const outer = useAnimatedStyle(() => ({ opacity: visible ? visible.value : 1, transform: [{ translateX: (edgeX.value + OVERSCAN) * scale - fullW }] }));
  const inner = useAnimatedStyle(() => ({ transform: [{ translateX: fullW - (edgeX.value + OVERSCAN) * scale }] }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, outer]}>
      <Animated.View style={[StyleSheet.absoluteFill, inner]}>
        <Svg width="100%" height="100%" viewBox={VIEWBOX}>
          {children}
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

// ------------------------------------------------------------------------------ station nodes

interface NodeProps {
  x: number;
  y: number;
  /** Radius in units. */
  size?: number;
  color: string;
  /** Timeline the node lights on (between `at` and `at + span`). */
  lit: SharedValue<number>;
  at: number;
  span?: number;
  /** A looping 0..1 value: sends a soft ring outward while the node is lit (and, if given, only between pulseFrom..pulseTo of `lit`). */
  pulse?: SharedValue<number>;
  pulseFrom?: number;
  pulseTo?: number;
  ring?: string;
}

/**
 * A station marker drawn as two native views: a white dot that fills with colour as it lights, and a soft ring
 * that breathes outward. Colour, scale and opacity animate on the UI thread; nothing is redrawn.
 */
export function NodeDot({ x, y, size = 6, color, lit, at, span = 0.06, pulse, pulseFrom, pulseTo, ring = ob.indigo }: NodeProps) {
  const { scale } = useBoard();
  const r = size * scale;
  const dot = useAnimatedStyle(() => {
    const s = stageOut(lit.value, at, at + span);
    return { backgroundColor: interpolateColor(s, [0, 1], [ob.white, color]), transform: [{ scale: 0.9 + 0.2 * s }] };
  });
  const halo = useAnimatedStyle(() => {
    if (!pulse) return { opacity: 0 };
    const s = stage(lit.value, at, at + span);
    const k = pulse.value;
    const inWindow = pulseFrom === undefined || pulseTo === undefined ? s : lit.value >= pulseFrom && lit.value < pulseTo ? 1 : 0;
    const ease = 1 - (1 - k) * (1 - k);
    return { opacity: inWindow * (1 - k) * 0.34, transform: [{ scale: 1 + ease * 1.4 }] };
  });
  const left = (x + OVERSCAN) * scale - r;
  const top = y * scale - r;
  return (
    <>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left, top, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: color }, halo]} />
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left, top, width: r * 2, height: r * 2, borderRadius: r, borderWidth: Math.max(1.5, 2.2 * scale), borderColor: ring }, dot]} />
    </>
  );
}

/** A soft glowing dot that travels a route (the "you are here" comet that keeps the route alive after it has drawn). */
export function Comet({ track, p, color, visible }: { track: Track; p: SharedValue<number>; color: string; visible?: SharedValue<number> }) {
  return (
    <Vehicle track={track} p={p} w={20} h={20} visible={visible} level>
      <Path d="M10 1 a9 9 0 1 1 0 18 a9 9 0 1 1 0 -18 Z" fill={color} opacity={0.18} />
      <Path d="M10 5 a5 5 0 1 1 0 10 a5 5 0 1 1 0 -10 Z" fill={color} opacity={0.35} />
      <Path d="M10 7 a3 3 0 1 1 0 6 a3 3 0 1 1 0 -6 Z" fill="#FFFFFF" />
    </Vehicle>
  );
}

/** Ripple rings (the stop alert): native views growing from one point, visible while `on` is 1. */
export function Ripple({ x, y, loop, on, color = ob.red, rings = 3 }: { x: number; y: number; loop: SharedValue<number>; on: SharedValue<number>; color?: string; rings?: number }) {
  return (
    <>
      {Array.from({ length: rings }, (_, i) => (
        <Ring key={i} x={x} y={y} loop={loop} on={on} color={color} offset={i / rings} />
      ))}
    </>
  );
}

function Ring({ x, y, loop, on, color, offset }: { x: number; y: number; loop: SharedValue<number>; on: SharedValue<number>; color: string; offset: number }) {
  const { scale } = useBoard();
  const R = 30 * scale;
  const style = useAnimatedStyle(() => {
    const k = (loop.value * 4 + offset) % 1;
    return { opacity: on.value * (1 - k) * 0.55, transform: [{ scale: 0.25 + k * 0.75 }] };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: (x + OVERSCAN) * scale - R, top: y * scale - R, width: R * 2, height: R * 2, borderRadius: R, borderWidth: 2, borderColor: color }, style]} />;
}

// ---------------------------------------------------------------------------------- logo

/** The MetroMate logo on the artboard: settles in when the walkthrough opens, then floats very gently. */
export const LogoSprite = memo(function LogoSprite({ x, y, size }: { x: number; y: number; size: number }) {
  const { scale } = useBoard();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: (x + OVERSCAN) * scale, top: y * scale }}>
      <MetroMateLogo size={size * scale} animate="float" delayMs={180} />
    </View>
  );
});
