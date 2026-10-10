import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bus, List, LocateFixed, Map as MapIcon, Settings as SettingsIcon, type LucideIcon } from 'lucide-react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { MetroMateLogo } from './brand/MetroMateLogo';
import { colors } from '../theme';
import { activeColorFor } from '../theme/bus';
import { useT } from '../i18n/useT';
import type { MessageKey } from '../i18n';

const ICONS: Record<string, (p: { color: string; size: number; focused: boolean }) => React.ReactElement> = {
  index: ({ size, focused }) => <MetroMateLogo size={size + 1} shadow={false} dim={!focused} />,
  live: lucide(LocateFixed),
  map: lucide(MapIcon),
  bus: lucide(Bus),
  stations: lucide(List),
  settings: lucide(SettingsIcon),
};

function lucide(Icon: LucideIcon) {
  return function LucideTab({ color, size }: { color: string; size: number; focused?: boolean }) {
    return <Icon color={color} size={size} strokeWidth={1.8} />;
  };
}

/** Persistent bottom navigation: white bar, outline icons, violet active item (red for Bus) with a small top indicator. */
export function MetroTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useT();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key].options;
        const labelKey = `common.tab.${route.name === 'index' ? 'plan' : route.name}` as MessageKey;
        const label = typeof options.title === 'string' ? t(labelKey) : route.name;
        const Icon = ICONS[route.name];
        const active = activeColorFor(route.name);
        const color = focused ? active : colors.slate;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={styles.item}
          >
            {focused ? <View style={[styles.indicator, { backgroundColor: active }]} /> : null}
            {Icon ? <Icon color={color} size={25} focused={focused} /> : null}
            <Text style={[styles.label, { color }, focused && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
    shadowColor: '#1B1450',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 54 },
  indicator: { position: 'absolute', top: -8, width: 34, height: 3.5, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: colors.primary },
  label: { fontSize: 12, fontWeight: '600' },
  labelActive: { fontWeight: '800' },
});
