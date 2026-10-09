import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Info, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { colors, radius, space, type } from '../theme';
import type { VerificationStatus } from '../types';

export function Screen({ children, edges = ['top'] }: { children: React.ReactNode; edges?: ('top' | 'bottom' | 'left' | 'right')[] }) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={type.h2} accessibilityRole="header">
        {children}
      </Text>
      {right}
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, icon: Icon, disabled, variant = 'primary', compact, style }: ButtonProps) {
  const palette = {
    primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
    secondary: { bg: colors.white, fg: colors.primary, border: colors.border },
    danger: { bg: colors.white, fg: colors.destination, border: colors.border },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {Icon ? <Icon size={compact ? 16 : 18} color={palette.fg} /> : null}
      <Text style={[styles.buttonLabel, compact && { fontSize: 14 }, { color: palette.fg }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon: Icon,
  label,
  onPress,
  color = colors.primary,
  filled,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Icon size={20} color={color} fill={filled ? color : 'none'} />
    </Pressable>
  );
}

export function Pill({
  label,
  color = colors.primary,
  bg = colors.primarySoft,
  icon: Icon,
  style,
}: {
  label: string;
  color?: string;
  bg?: string;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {Icon ? <Icon size={13} color={color} /> : null}
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function CorridorDot({ color, size = 10 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

const STATUS_LABEL: Record<VerificationStatus, string> = {
  verified: 'Verified from GMRC',
  unverified: 'Unverified',
  estimated: 'Estimate',
  unknown: 'Not verified yet',
};

export function VerifyBadge({ status }: { status: VerificationStatus }) {
  const map: Record<VerificationStatus, { fg: string; bg: string }> = {
    verified: { fg: colors.ok, bg: colors.okSoft },
    unverified: { fg: colors.warn, bg: colors.warnSoft },
    estimated: { fg: colors.warn, bg: colors.warnSoft },
    unknown: { fg: colors.muted, bg: '#EEF0F5' },
  };
  return <Pill label={STATUS_LABEL[status]} color={map[status].fg} bg={map[status].bg} />;
}

export function Notice({
  children,
  tone = 'info',
  title,
}: {
  children: React.ReactNode;
  tone?: 'info' | 'warn';
  title?: string;
}) {
  const warn = tone === 'warn';
  const Icon = warn ? TriangleAlert : Info;
  return (
    <View
      style={[
        styles.notice,
        warn ? { backgroundColor: colors.warnSoft, borderColor: colors.warnBorder } : { backgroundColor: colors.primarySoft, borderColor: '#D5D9FF' },
      ]}
      accessibilityRole="alert"
    >
      <Icon size={18} color={warn ? colors.warn : colors.primary} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        {title ? <Text style={[type.h3, { marginBottom: 2 }]}>{title}</Text> : null}
        <Text style={[type.small, { color: colors.text, lineHeight: 19 }]}>{children}</Text>
      </View>
    </View>
  );
}

export function Muted({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.small, style]}>{children}</Text>;
}

export function EmptyState({ title, body, icon: Icon }: { title: string; body: string; icon: LucideIcon }) {
  return (
    <View style={styles.empty}>
      <Icon size={28} color={colors.faint} />
      <Text style={[type.h3, { marginTop: space.sm }]}>{title}</Text>
      <Text style={[type.small, { textAlign: 'center', marginTop: 2 }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonCompact: { minHeight: 40, paddingHorizontal: space.md },
  buttonLabel: { fontSize: 16, fontWeight: '700' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  notice: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  empty: { alignItems: 'center', padding: space.xl },
});
