import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, type LucideIcon } from 'lucide-react-native';
import { Gradient } from '../route/primitives';
import { useHomeScale } from '../home/scale';
import { AGENCY_LOOK, agencyLabel } from '../../lib/transit/format';
import { useT } from '../../i18n/useT';
import type { AgencyId } from '../../lib/transit/types';
import { bus } from '../../theme/bus';

/** Small pieces shared by the Bus tab and the bus route / stop screens. All red-themed. */

export const busShadow = { shadowColor: '#7A1C1C', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 3 } as const;

/** Route number in the agency's colour: BRTS red, AMTS blue, Gandhinagar green. */
export function RouteBadge({ agency, short, size = 1 }: { agency: AgencyId; short: string; size?: number }) {
  const { z } = useHomeScale();
  const { t } = useT();
  const look = AGENCY_LOOK[agency];
  const long = short.length > 4;
  return (
    <View style={{ minWidth: z(46 * size), height: z(34 * size), paddingHorizontal: z(8), borderRadius: z(10 * size), backgroundColor: look.color, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={t('bus.routeBadge.a11y', { agency: agencyLabel(agency, t), short })}>
      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: z((long ? 12 : 15) * size), letterSpacing: -0.2 }} numberOfLines={1}>
        {short}
      </Text>
    </View>
  );
}

/** "Scheduled · not live": on every screen that shows bus times. */
export function ScheduledTag({ light }: { light?: boolean }) {
  const { z } = useHomeScale();
  const { t } = useT();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: z(5), minHeight: z(26), paddingVertical: z(3), paddingHorizontal: z(10), borderRadius: z(13), backgroundColor: light ? 'rgba(255,255,255,0.18)' : bus.soft }}
      accessible
      accessibilityLabel={t('bus.scheduled.a11y')}
    >
      <Clock size={z(13)} color={light ? '#FFFFFF' : bus.dark} strokeWidth={2.2} />
      <Text style={{ flexShrink: 1, fontSize: z(12), fontWeight: '700', color: light ? '#FFFFFF' : bus.dark }}>{t('bus.scheduled')}</Text>
    </View>
  );
}

export function BusCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { z } = useHomeScale();
  return <View style={[{ marginHorizontal: 16, borderRadius: z(22), padding: z(14), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: bus.line }, busShadow, style]}>{children}</View>;
}

export function SectionHead({ icon: Icon, title, right }: { icon?: LucideIcon; title: string; right?: React.ReactNode }) {
  const { z } = useHomeScale();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8), marginBottom: z(10) }}>
      {Icon ? <Icon size={z(19)} color={bus.red} strokeWidth={2} /> : null}
      <Text style={{ flex: 1, fontSize: z(17), fontWeight: '800', color: bus.ink }} accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}

/** Red top bar with a back button, a title and an optional line under it. */
export function BusTopBar({ title, subtitle, onBack, right, children }: { title: string; subtitle?: string; onBack: () => void; right?: React.ReactNode; children?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { z } = useHomeScale();
  const { t, lang } = useT();
  return (
    <View style={{ paddingTop: insets.top + z(10), paddingBottom: z(16), paddingHorizontal: 16, overflow: 'hidden' }}>
      <Gradient id="bus-top" vertical stops={[{ at: 0, color: bus.red }, { at: 1, color: bus.dark }]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(12) }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={onBack} hitSlop={8} style={({ pressed }) => [styles.back, { width: z(42), height: z(42), borderRadius: z(21), opacity: pressed ? 0.8 : 1 }]}>
          <ChevronLeft size={z(24)} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: z(22), fontWeight: '800', color: '#FFFFFF', letterSpacing: lang === 'en' ? -0.4 : 0 }} numberOfLines={2} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontSize: z(13), color: 'rgba(255,255,255,0.85)', marginTop: 1 }} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

/** A tappable row used in lists: leading badge, two lines of text, optional trailing element. */
export function ListRow({ lead, title, sub, trail, onPress, label }: { lead?: React.ReactNode; title: string; sub?: string; trail?: React.ReactNode; onPress?: () => void; label: string }) {
  const { z } = useHomeScale();
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: z(12), paddingVertical: z(10), opacity: pressed ? 0.85 : 1 }]}>
      {lead}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: z(15), fontWeight: '700', color: bus.ink }} numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text style={{ fontSize: z(12.5), color: bus.inkSoft, marginTop: 1 }} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
      {trail}
    </Pressable>
  );
}

export const Divider = () => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: bus.line }} />;

const styles = StyleSheet.create({
  back: { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
