import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ChevronDown, Info, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme';
import { useHomeScale } from '../home/scale';
import { useT } from '../../i18n/useT';

export const NAVY = colors.text;
export const SLATE = colors.slate;
export const VIOLET = colors.primary;
export const CARD_LINE = '#E8EAF6';

export const cardShadow = { shadowColor: '#3B2BB5', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 3 } as const;

/** A gradient that fills its parent. `id` must be unique on the screen. */
export function Gradient({ id, stops, vertical }: { id: string; stops: { at: number; color: string; opacity?: number }[]; vertical?: boolean }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
            {stops.map((s) => (
              <Stop key={s.at} offset={s.at} stopColor={s.color} stopOpacity={s.opacity ?? 1} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width={100} height={100} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Collapsed-by-default section: an icon tile, a title and one short line; everything else is behind the tap. */
export function Accordion({ icon: Icon, tint, tintBg, title, subtitle, children, defaultOpen }: { icon: LucideIcon; tint: string; tintBg: string; title: string; subtitle: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const { z } = useHomeScale();
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <View style={[styles.acc, { borderRadius: z(20) }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setOpen((o) => !o)}
        style={[styles.accHead, { padding: z(14), gap: z(14) }]}
      >
        <View style={{ width: z(46), height: z(46), borderRadius: z(14), backgroundColor: tintBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={z(23)} color={tint} strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: z(16.5), fontWeight: '800', color: NAVY }}>{title}</Text>
          <Text style={{ fontSize: z(12.5), color: SLATE, marginTop: 1 }} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        <View style={open ? { transform: [{ rotate: '180deg' }] } : undefined}>
          <ChevronDown size={z(22)} color="#5A5FA8" strokeWidth={2} />
        </View>
      </Pressable>
      {open ? <View style={{ paddingHorizontal: z(14), paddingBottom: z(16), gap: z(12) }}>{children}</View> : null}
    </View>
  );
}

/** A one-line notice that opens to the full text. `tone` picks amber (warn) or violet (info). */
export function ExpandAlert({ title, text, tone = 'warn' }: { title: string; text: string; tone?: 'warn' | 'info' }) {
  const { z } = useHomeScale();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const warn = tone === 'warn';
  const fg = warn ? '#7A3B06' : '#2E1FA8';
  const Icon = warn ? TriangleAlert : Info;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${open ? text : t('route.expand.details')}`}
      accessibilityState={{ expanded: open }}
      aria-expanded={open}
      onPress={() => setOpen((o) => !o)}
      style={{ padding: z(12), borderRadius: z(16), backgroundColor: warn ? '#FFF4E5' : '#F1EFFF', borderWidth: 1, borderColor: warn ? '#F9D9A8' : '#D9D3FF', gap: z(8) }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
        <Icon size={z(18)} color={warn ? '#B54708' : VIOLET} />
        <Text style={{ flex: 1, fontSize: z(13.5), fontWeight: '700', color: fg }}>{title}</Text>
        <View style={open ? { transform: [{ rotate: '180deg' }] } : undefined}>
          <ChevronDown size={z(18)} color={warn ? '#B54708' : VIOLET} />
        </View>
      </View>
      {open ? <Text style={{ fontSize: z(12.5), color: fg }}>{text}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  acc: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, ...cardShadow, shadowOpacity: 0.05 },
  accHead: { flexDirection: 'row', alignItems: 'center' },
});

/** A white circular icon button with a soft shadow (back, favourite, share, …). */
export function RoundButton({ z, label, onPress, children, size = 42 }: { z: (n: number) => number; label: string; onPress: () => void; children: React.ReactNode; size?: number }) {
  const d = z(size);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [{ width: d, height: d, borderRadius: d / 2, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 }, cardShadow]}
    >
      {children}
    </Pressable>
  );
}
