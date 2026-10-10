import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpDown, Bus, ChevronRight, DoorOpen, MapPin, TrainFront, type LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme';
import { cardAccessibilityLabel, type StationCardInfo } from '../../lib/stationCards';
import { useT } from '../../i18n/useT';
import { lineHeightFor } from '../station/lineHeight';
import { useHomeScale } from '../home/scale';
import { StationThumb, type ThumbStation } from './StationThumb';

const NAVY = colors.text;
const SLATE = colors.slate;
const CARD_LINE = '#E8EAF6';
const CHIP_BG = '#F3F4FA';

const CONNECTION_ICON: Record<string, LucideIcon> = { rail: TrainFront, brts: Bus, bus: Bus, other: Bus };

interface Props {
  station: ThumbStation & { isInterchange: boolean };
  info: StationCardInfo;
  /** Extra line, e.g. "Also known as “Vasna”" when the search matched an alias. */
  matchNote?: string | null;
}

export const StationCard = memo(function StationCard({ station, info, matchNote }: Props) {
  const { z } = useHomeScale();
  const { t, tn, lang } = useT();
  const st = useMemo(() => makeStyles(z), [z]);
  const lh = (size: number) => lineHeightFor(lang, z(size));
  const ConnIcon = info.connection ? CONNECTION_ICON[info.connection.kind] : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={cardAccessibilityLabel(station.name, info, t, tn)}
      onPress={() => router.push({ pathname: '/station/[id]', params: { id: station.id } })}
      style={({ pressed }) => [st.card, pressed && { backgroundColor: '#F8F8FF' }]}
    >
      <StationThumb station={station} color={info.lineColor} width={z(108)} height={z(92)} radius={z(16)} />
      <View style={st.body}>
        <View style={st.titleRow}>
          <Text style={st.name} numberOfLines={1}>
            {station.name}
          </Text>
          {info.badges.map((b) => (
            <View key={b.code} style={[st.badge, { backgroundColor: b.color }]}>
              <Text style={st.badgeText}>{b.code}</Text>
            </View>
          ))}
          <ChevronRight size={z(20)} color={SLATE} strokeWidth={1.8} />
        </View>
        <View style={st.lineRow}>
          <View style={[st.dot, { backgroundColor: info.lineColor }]} />
          <Text style={[st.line, { lineHeight: lh(12.5) }]}>{info.lineName}</Text>
          {station.isInterchange ? <Text style={[st.interchange, { lineHeight: lh(11.5) }]}>{t('stations.interchange')}</Text> : null}
        </View>
        <View style={st.lineRow}>
          <MapPin size={z(14)} color="#6C93D8" strokeWidth={2.2} />
          <Text style={[st.place, { lineHeight: lh(12.5) }]} numberOfLines={2}>
            {matchNote ?? info.location}
          </Text>
        </View>
        <View style={st.chips}>
          <Chip st={st} lh={lh(12)} z={z} Icon={DoorOpen} label={info.exits === null ? t('stations.chip.exitsNa') : tn('stations.chip.exits', info.exits)} faded={info.exits === null} />
          {info.lifts > 0 ? <Chip st={st} lh={lh(12)} z={z} Icon={ArrowUpDown} label={tn('stations.chip.lifts', info.lifts)} /> : null}
          {info.connection && ConnIcon ? <Chip st={st} lh={lh(12)} z={z} Icon={ConnIcon} label={info.connection.label} dashed={!info.connection.verified} /> : null}
        </View>
      </View>
    </Pressable>
  );
});

type S = ReturnType<typeof makeStyles>;

function Chip({ st, lh, z, Icon, label, dashed, faded }: { st: S; lh: number | undefined; z: (n: number) => number; Icon: LucideIcon; label: string; dashed?: boolean; faded?: boolean }) {
  return (
    <View style={[st.chip, dashed && st.chipDashed, faded && { opacity: 0.6 }]}>
      <Icon size={z(14)} color="#4F4C9E" strokeWidth={1.9} />
      <Text style={[st.chipText, { lineHeight: lh }]}>{label}</Text>
    </View>
  );
}

function makeStyles(z: (n: number) => number) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      gap: z(12),
      marginHorizontal: z(16),
      padding: z(10),
      backgroundColor: '#FFFFFF',
      borderRadius: z(20),
      borderWidth: 1,
      borderColor: CARD_LINE,
      shadowColor: '#3B2BB5',
      shadowOpacity: 0.06,
      shadowRadius: z(12),
      shadowOffset: { width: 0, height: z(4) },
      elevation: 2,
    },
    body: { flex: 1, minWidth: 0, gap: z(3) },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: z(7) },
    name: { flex: 1, minWidth: 0, fontSize: z(17), fontWeight: '800', color: NAVY, letterSpacing: -0.3 },
    badge: { paddingHorizontal: z(8), height: z(19), borderRadius: z(10), alignItems: 'center', justifyContent: 'center' },
    badgeText: { color: '#FFFFFF', fontSize: z(11), fontWeight: '800', letterSpacing: 0.3 },
    lineRow: { flexDirection: 'row', alignItems: 'center', gap: z(7) },
    dot: { width: z(10), height: z(10), borderRadius: z(5) },
    line: { flexShrink: 1, fontSize: z(12.5), fontWeight: '500', color: '#46508C' },
    interchange: { fontSize: z(11.5), fontWeight: '700', color: colors.warn },
    place: { flex: 1, fontSize: z(12.5), color: SLATE },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: z(6), marginTop: z(3) },
    chip: { flexDirection: 'row', alignItems: 'center', gap: z(5), minHeight: z(25), paddingVertical: z(2), paddingHorizontal: z(8), borderRadius: z(8), flexShrink: 1, backgroundColor: CHIP_BG, borderWidth: 1, borderColor: CHIP_BG },
    chipDashed: { backgroundColor: '#FFFFFF', borderColor: '#B9BEDD', borderStyle: 'dashed' },
    chipText: { flexShrink: 1, fontSize: z(12), fontWeight: '500', color: '#3F4670' },
  });
}
