import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import { colors, radius } from '../theme';
import { useApp } from '../state/AppProvider';
import { useT } from '../i18n/useT';

/**
 * Connection status. Route planning, search and saved journeys never need a
 * connection, so "offline" is presented as a normal, working state.
 */
export function OfflineBadge() {
  const { online } = useApp();
  const { t } = useT();
  if (online === null) return null;
  const Icon = online ? Wifi : WifiOff;
  const fg = online ? colors.ok : colors.offline;
  const bg = online ? colors.okSoft : colors.offlineSoft;
  return (
    <View
      style={[styles.badge, { backgroundColor: bg }]}
      accessibilityRole="text"
      accessibilityLabel={online ? t('common.online.a11y') : t('common.offline.a11y')}
    >
      <Icon size={14} color={fg} />
      <Text style={[styles.text, { color: fg }]}>{online ? t('common.online') : t('common.offlineAll')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  text: { fontSize: 12, fontWeight: '700' },
});
