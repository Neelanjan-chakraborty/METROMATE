import React from 'react';
import { Platform, Pressable, StyleSheet, Text, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ob } from './palette';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'text';
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  /** Light tap feedback where the phone supports it. */
  haptic?: boolean;
}

/** Spring-press button. Primary is violet on white text; text variant is a quiet link-style action. 48 dp tall at least. */
export function OnboardingButton({ label, onPress, variant = 'primary', textStyle, accessibilityLabel, haptic = true }: Props) {
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => {
        if (haptic && Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        onPress();
      }}
      onPressIn={() => s.set(withSpring(0.97, { damping: 18, stiffness: 320 }))}
      onPressOut={() => s.set(withSpring(1, { damping: 14, stiffness: 260 }))}
      hitSlop={6}
    >
      <Animated.View style={[styles.base, primary ? styles.primary : variant === 'ghost' ? styles.ghost : styles.text, style]}>
        <Text style={[styles.label, { color: primary ? ob.white : ob.violet }, variant === 'text' && { fontSize: 15 }, textStyle]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, paddingHorizontal: 22, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: ob.violet, shadowColor: ob.violet, shadowOpacity: 0.32, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 6 },
  ghost: { backgroundColor: ob.lavender },
  text: { minHeight: 48, backgroundColor: 'transparent' },
  label: { fontSize: 17, textAlign: 'center' },
});
