import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { ob } from './palette';

function Dot({ i, progress }: { i: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const d = Math.min(1, Math.abs(progress.value - i));
    return { width: interpolate(d, [0, 1], [28, 8]), backgroundColor: interpolateColor(d, [0, 1], [ob.violet, ob.lavenderDeep]) };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

/** Five pills; the one for the current step stretches and turns violet as the pager moves. */
export function PageIndicator({ count, progress, label }: { count: number; progress: SharedValue<number>; label: string }) {
  return (
    <View style={styles.row} accessible accessibilityRole="progressbar" accessibilityLabel={label}>
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} i={i} progress={progress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 20 },
  dot: { height: 8, borderRadius: 4 },
});
