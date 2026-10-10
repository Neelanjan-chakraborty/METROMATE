import React, { useEffect } from 'react';
import { Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '../home/useHeroClock';

/** The MetroMate logo (the same artwork as the app icon), as one component so every place that shows it stays in step. */
const SOURCE = require('../../../assets/logo.png');

export interface MetroMateLogoProps {
  /** Width and height in dp. */
  size: number;
  /**
   * 'none': still. 'enter': springs in once when it appears. 'float': springs in, then drifts up and down very gently.
   * Motion is skipped when the phone asks for reduced motion.
   */
  animate?: 'none' | 'enter' | 'float';
  /** Soft violet shadow under the logo. */
  shadow?: boolean;
  /** Faded, for an inactive tab. */
  dim?: boolean;
  /** Delay before the entrance, in ms. */
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
}

/** Corner radius as a share of the size: matches the rounded-square shape of the app icon. */
export const LOGO_RADIUS = 0.24;

export function MetroMateLogo({ size, animate = 'none', shadow = true, dim = false, delayMs = 0, style }: MetroMateLogoProps) {
  const reduced = useReduceMotion();
  const enter = useSharedValue(animate === 'none' || reduced ? 1 : 0);
  const drift = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(enter);
    cancelAnimation(drift);
    if (animate === 'none' || reduced) {
      enter.set(1);
      drift.set(0);
      return;
    }
    enter.set(0);
    enter.set(withDelay(delayMs, withSpring(1, { damping: 11, stiffness: 150, mass: 0.9 })));
    if (animate === 'float') {
      drift.set(withDelay(delayMs + 600, withRepeat(withSequence(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })), -1, false)));
    }
  }, [animate, reduced, delayMs, enter, drift]);
  const motion = useAnimatedStyle(() => ({
    opacity: Math.min(1, enter.get() * 2.2),
    transform: [{ translateY: drift.get() * -size * 0.04 }, { scale: 0.45 + 0.55 * enter.get() }],
  }));
  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel="MetroMate"
      style={[styles.box, { width: size, height: size, borderRadius: size * LOGO_RADIUS }, shadow && styles.shadow, dim && { opacity: 0.55 }, style, motion]}
    >
      <Image source={SOURCE} style={{ width: size, height: size, borderRadius: size * LOGO_RADIUS }} resizeMode="cover" fadeDuration={0} accessibilityIgnoresInvertColors />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#2B2BC8' },
  shadow: { shadowColor: '#4F35E8', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
});
