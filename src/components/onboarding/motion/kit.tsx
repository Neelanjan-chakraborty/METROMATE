import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { BOARD_H, BOARD_W, OVERSCAN, VIEWBOX, ob } from '../palette';
import { MetroMateLogo, type MetroMateLogoProps } from '../../brand/MetroMateLogo';
import { pointAt, stage, stageOut, type Track } from './pathMath';

/*
 * Motion kit for the onboarding scenes. A scene is a "board" of 360 x 440 artboard units (plus overscan)
 * scaled to the phone. Static artwork lives in `Layer`s that fade/slide in on a shared timeline `t`; things
 * that move (vehicles, birds, swaying trees, pulses) are drawn by their own native-driven views so nothing
 * re-renders per frame. All values are shared values computed on the UI thread.
 */

interface BoardCtx {
  /** Screen pixels per artboard unit. */
  scale: number;
  /** Width of one pager page, for parallax. */
  pageW: number;
  /** Page position of the pager (float) and this scene's index, for parallax. */
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
  return (
    <Ctx.Provider value={{ scale, pageW, progress, index }}>
      <View style={{ width: (BOARD_W + OVERSCAN * 2) * scale, height: BOARD_H * scale, alignSelf: 'center' }}>{children}</View>
    </Ctx.Provider>
  );
}

/** Artboard x/y (units) to board pixels. */
export const px = (units: number, scale: number) => units * scale;

// -------------------------------------------------------------------------------- layers

interface LayerProps {
  /** Scene timeline 0..1; the layer fades in between `from` and `to`. */
  t: SharedValue<number>;
  from?: number;
  to?: number;
  /** Starts this many units lower and rises into place. */
  dy?: number;
  /** Parallax depth: positive layers lag behind a swipe (far), negative ones lead (near). 0 = none. */
  depth?: number;
  children: ReactNode;
}

export function Layer({ t, from = 0, to = 0.15, dy = 0, depth = 0, children }: LayerProps) {
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
}

/** A layer that is always fully drawn (sky, ground): same parallax, no reveal. */
export function Backdrop({ depth = 0, children }: { depth?: number; children: ReactNode }) {
  const { scale, pageW, progress, index } = useBoard();
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: depth === 0 ? 0 : (progress.value - index) * depth * pageW }] }));
  void scale;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" viewBox={VIEWBOX}>
        {children}
      </Svg>
    </Animated.View>
  );
}

// -------------------------------------------------------------------------------- sprites

interface SpriteProps {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Animated style from the caller (sway, float, pop-in…). */
  animated?: ViewStyle | object;
  /** Where in the sprite the transforms pivot, e.g. 'bottom' for a tree. */
  origin?: string;
  children: ReactNode;
}

/** A small independent Svg at a fixed place in the board, so it can move on its own. */
export function Sprite({ x, y, w, h, animated, origin, children }: SpriteProps) {
  const { scale } = useBoard();
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: (x + OVERSCAN) * scale, top: y * scale, width: w * scale, height: h * scale }, origin ? ({ transformOrigin: origin } as ViewStyle) : null, animated]}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** Gentle sway about the base: for trees, flags, grass. */
export function useSway(loop: SharedValue<number>, cycles: number, phase: number, degrees: number) {
  return useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.sin((loop.value * cycles + phase) * Math.PI * 2) * degrees}deg` }] }));
}

/** Gentle vertical float: for small supporting elements. */
export function useFloat(loop: SharedValue<number>, cycles: number, phase: number, units: number) {
  const { scale } = useBoard();
  return useAnimatedStyle(() => ({ transform: [{ translateY: Math.sin((loop.value * cycles + phase) * Math.PI * 2) * units * scale }] }));
}

/** Pop-in: scale + fade between `from` and `to` on the timeline (a soft overshoot via an ease-out curve). */
export function usePop(t: SharedValue<number>, from: number, to: number) {
  return useAnimatedStyle(() => {
    const s = stageOut(t.value, from, to);
    const k = 0.7 + 0.3 * s + 0.08 * Math.sin(s * Math.PI);
    return { opacity: s, transform: [{ scale: k }] };
  });
}

// ------------------------------------------------------------------------------- vehicles

interface VehicleProps {
  track: Track;
  /** 0..1 along the track. */
  p: SharedValue<number>;
  w: number;
  h: number;
  /** Fades the vehicle in/out (0..1); default fully visible. */
  visible?: SharedValue<number>;
  /** Keep the vehicle level instead of tilting with the track. */
  level?: boolean;
  /** `children` are RN nodes (for sprites that animate inside) instead of Svg shapes. */
  raw?: boolean;
  children: ReactNode;
}

/** Moves art along a track. Faces right on rightward travel and mirrors itself on leftward travel. */
export function Vehicle({ track, p, w, h, visible, level, raw, children }: VehicleProps) {
  const { scale } = useBoard();
  const style = useAnimatedStyle(() => {
    const [x, y, a] = pointAt(track, p.value * track.total);
    const left = Math.cos(a) < 0;
    const ang = level ? 0 : left ? a + Math.PI : a;
    return {
      opacity: visible ? visible.value : 1,
      transform: [{ translateX: (x + OVERSCAN) * scale - (w * scale) / 2 }, { translateY: y * scale - (h * scale) / 2 }, { rotate: `${ang}rad` }, { scaleX: left ? -1 : 1 }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: w * scale, height: h * scale }, style]}>
      {raw ? (
        children
      ) : (
        <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
          {children}
        </Svg>
      )}
    </Animated.View>
  );
}

/** Position along a track from a looping clock: `cycles` trips per loop, offset by `phase`. */
export function useLoopProgress(loop: SharedValue<number>, cycles = 1, phase = 0) {
  return useDerivedValue(() => {
    const v = (loop.value * cycles + phase) % 1;
    return v < 0 ? v + 1 : v;
  });
}

// ------------------------------------------------------------------------------ route lines

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RouteStrokeProps {
  d: string;
  /** Length of the path in units (from the track). */
  length: number;
  /** The route is drawn as `draw` goes from `from` to `to`. */
  draw: SharedValue<number>;
  from?: number;
  to?: number;
  color: string;
  width?: number;
  opacity?: number;
}

/** A route line that draws itself. Place inside a `Layer`/`Backdrop` so it shares the artboard. */
export function RouteStroke({ d, length, draw, from = 0, to = 1, color, width = 5, opacity = 1 }: RouteStrokeProps) {
  const props = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - stage(draw.value, from, to)) }));
  return <AnimatedPath d={d} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={[length + 1, length + 1]} opacity={opacity} animatedProps={props} />;
}

interface NodeProps {
  x: number;
  y: number;
  size?: number;
  /** Colour the node takes when lit. */
  color: string;
  /** Timeline; the node lights between `at` and `at + span`. */
  lit: SharedValue<number>;
  at: number;
  span?: number;
  /** Optional 0..1 looping pulse that sends a ring outward once lit. */
  pulse?: SharedValue<number>;
  /** Only pulse while `lit` is between these values (e.g. "this is the next stop"); by default whenever lit. */
  pulseFrom?: number;
  pulseTo?: number;
  ring?: string;
}

/** A station marker: a white dot that fills with colour and (optionally) pulses once lit. */
export function StationNode({ x, y, size = 6, color, lit, at, span = 0.06, pulse, pulseFrom, pulseTo, ring = ob.indigo }: NodeProps) {
  const core = useAnimatedProps(() => {
    const s = stage(lit.value, at, at + span);
    return { fill: interpolateColor(s, [0, 1], [ob.white, color]), r: size * (0.9 + 0.25 * s) };
  });
  const halo = useAnimatedProps(() => {
    const s = stage(lit.value, at, at + span);
    const k = pulse ? pulse.value : 0;
    const window = pulseFrom === undefined || pulseTo === undefined ? 1 : lit.value >= pulseFrom && lit.value < pulseTo ? 1 : 0;
    return { r: size + 2 + k * size * 2, opacity: window * (pulseFrom === undefined ? s : 1) * (1 - k) * 0.55 };
  });
  return (
    <>
      <AnimatedCircle cx={x} cy={y} fill={color} animatedProps={halo} />
      <AnimatedCircle cx={x} cy={y} stroke={ring} strokeWidth={2.2} animatedProps={core} />
    </>
  );
}

// -------------------------------------------------------------------------------- clock

export const LOOP_REST = 0.32;

/**
 * The two clocks a scene runs on. `t` builds the scene (0 → 1, once, when the page becomes active); `loop`
 * repeats (vehicles, pulses, sway). Inactive pages hold still; with reduced motion the scene is shown
 * complete and still.
 */
export function useSceneClock(active: boolean, reduced: boolean, buildMs: number, loopMs: number) {
  const t = useSharedValue(1);
  const loop = useSharedValue(LOOP_REST);
  useEffect(() => {
    if (reduced) {
      cancelAnimation(t);
      cancelAnimation(loop);
      t.value = 1;
      loop.value = LOOP_REST;
      return;
    }
    if (active) {
      t.value = 0;
      t.value = withTiming(1, { duration: buildMs, easing: Easing.linear });
      loop.value = 0;
      loop.value = withRepeat(withTiming(1, { duration: loopMs, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(t);
      cancelAnimation(loop);
      t.value = 1;
    }
  }, [active, reduced, buildMs, loopMs, t, loop]);
  return { t, loop };
}

/** A 0 → 1 spring (with a little overshoot) that plays when the page becomes active, after `delayMs`. Fully 1 when reduced. */
export function useSpringIn(active: boolean, reduced: boolean, delayMs = 0) {
  const v = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    cancelAnimation(v);
    if (reduced) {
      v.value = 1;
      return;
    }
    if (active) {
      v.value = 0;
      const id = setTimeout(() => {
        v.value = withSpring(1, { damping: 11, stiffness: 150, mass: 0.9 });
      }, delayMs);
      return () => clearTimeout(id);
    }
    v.value = 1;
  }, [active, reduced, delayMs, v]);
  return v;
}

/** Scale/opacity style for a spring value (the logo's entrance). */
export function useSpringStyle(v: SharedValue<number>) {
  return useAnimatedStyle(() => ({ opacity: Math.min(1, v.value * 2.2), transform: [{ scale: 0.4 + 0.6 * v.value }] }));
}

/** The MetroMate logo placed on the artboard (an image, so it lives outside the Svg layers). */
export function LogoSprite({ x, y, size, animate }: { x: number; y: number; size: number; animate: MetroMateLogoProps['animate'] }) {
  const { scale } = useBoard();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: (x + OVERSCAN) * scale, top: y * scale }}>
      <MetroMateLogo size={size * scale} animate={animate} delayMs={150} />
    </View>
  );
}
