import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Map as MapIcon, Search, WifiOff, X } from 'lucide-react-native';
import { StationCard } from '../../components/stations/StationCard';
import { StationsHero } from '../../components/stations/StationsHero';
import { useHeroState } from '../../components/home/useHeroClock';
import { useHomeScale } from '../../components/home/scale';
import { useReady } from '../../state/useReady';
import { searchStations, type SearchHit } from '../../lib/search';
import { stationCardInfo } from '../../lib/stationCards';
import { colors } from '../../theme';
import { useT } from '../../i18n/useT';
import type { Language, T } from '../../i18n';
import { lineHeightFor } from '../../components/station/lineHeight';

const NAVY = colors.text;
const SLATE = colors.slate;
const VIOLET = colors.primary;
const CARD_LINE = '#E8EAF6';
const CHIP_ORDER = ['ns', 'ew', 'gift'];

function matchNote(hit: SearchHit, t: T): string | null {
  if (hit.matchedOn === 'landmark') return t('stations.match.landmark', { name: hit.matchedText });
  if (hit.matchedOn === 'alias') return t('stations.match.alias', { name: hit.matchedText });
  return null;
}

export default function StationsScreen() {
  const { dataset } = useReady();
  const insets = useSafeAreaInsets();
  const { z } = useHomeScale();
  const { t, tn, lang } = useT();
  const { sky } = useLocalSearchParams<{ sky?: string }>();
  const { look, animate } = useHeroState(sky);
  const [query, setQuery] = useState('');
  const [corridor, setCorridor] = useState<string | null>(null);
  const corridorById = useMemo(() => new Map(dataset.corridors.map((c) => [c.id, c])), [dataset]);
  const gatesByStation = useMemo(() => {
    const m = new Map<string, typeof dataset.gates>();
    for (const g of dataset.gates) m.set(g.stationId, [...(m.get(g.stationId) ?? []), g]);
    return m;
  }, [dataset]);

  const hits = useMemo(() => {
    const all = searchStations(dataset.stations, dataset.landmarks, query, 100);
    return corridor ? all.filter((h) => h.station.corridorIds.includes(corridor)) : all;
  }, [dataset, query, corridor]);

  const st = useMemo(() => makeStyles(z), [z]);
  const chipCorridors = useMemo(() => [...dataset.corridors].sort((a, b) => CHIP_ORDER.indexOf(a.id) - CHIP_ORDER.indexOf(b.id)), [dataset]);
  // Canopy name boards in the line colours: the chosen line, or all lines in turn.
  const heroAccents = useMemo(() => {
    const chosen = corridor ? corridorById.get(corridor) : null;
    return chosen ? [chosen.color] : chipCorridors.map((c) => c.color);
  }, [corridor, corridorById, chipCorridors]);

  const renderItem = useCallback(
    ({ item }: { item: SearchHit }) => (
      <StationCard
        station={item.station}
        info={stationCardInfo(item.station, gatesByStation.get(item.station.id) ?? [], dataset.landmarks, corridorById, t)}
        matchNote={matchNote(item, t)}
      />
    ),
    [gatesByStation, dataset.landmarks, corridorById, t],
  );

  return (
    <View style={[st.screen]}>
      <View style={{ height: insets.top + z(120) }}>
        <StationsHero height={insets.top + z(120)} look={look} animate={animate} accents={heroAccents} />
        <View style={[st.header, { paddingTop: insets.top + z(12) }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[st.title, { color: look.ink, lineHeight: lineHeightFor(lang, z(31), 1.25) }]} accessibilityRole="header" numberOfLines={1}>
              {t('stations.title')}
            </Text>
            <Text style={[st.sub, { color: look.inkSoft, lineHeight: lineHeightFor(lang, z(13)) }]}>{tn('stations.sub', dataset.stations.length)}</Text>
          </View>
          <View style={st.pill} accessibilityLabel={t('stations.offlineReady.a11y')}>
            <WifiOff size={z(14)} color="#0F6B3E" strokeWidth={2} />
            <Text style={[st.pillText, { lineHeight: lineHeightFor(lang, z(12)) }]}>{t('stations.offlineReady')}</Text>
          </View>
        </View>
      </View>

      <View style={st.searchRow}>
        <View style={st.searchBox}>
          <Search size={z(20)} color={VIOLET} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('stations.search.placeholder')}
            placeholderTextColor="#8E98B8"
            style={st.input}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel={t('stations.search.a11y')}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('stations.search.clear')} onPress={() => setQuery('')} hitSlop={14}>
              <X size={z(18)} color={SLATE} />
            </Pressable>
          ) : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('stations.mapButton.a11y')} onPress={() => router.navigate('/map')} style={st.mapBtn}>
          <MapIcon size={z(22)} color={VIOLET} strokeWidth={1.9} />
        </Pressable>
      </View>

      <View style={{ marginTop: z(12) }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips} accessibilityRole="radiogroup">
          <Chip st={st} t={t} lang={lang} label={t('stations.filter.all')} active={corridor === null} onPress={() => setCorridor(null)} />
          {chipCorridors.map((c) => (
            <Chip key={c.id} st={st} t={t} lang={lang} label={c.shortName} dot={c.color} active={corridor === c.id} onPress={() => setCorridor(corridor === c.id ? null : c.id)} />
          ))}
        </ScrollView>
      </View>
      <Text style={[st.legend, { lineHeight: lineHeightFor(lang, z(11.5)) }]}>{t('stations.legend')}</Text>

      <FlatList
        data={hits}
        keyExtractor={(h) => h.station.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={7}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{ paddingBottom: z(24), paddingTop: z(4) }}
        ItemSeparatorComponent={() => <View style={{ height: z(12) }} />}
        ListEmptyComponent={
          <View style={{ padding: z(24) }}>
            <Text style={[st.empty, { fontWeight: '700', lineHeight: lineHeightFor(lang, z(15)) }]}>{t('stations.empty.title')}</Text>
            <Text style={[st.empty, { color: SLATE, marginTop: 4, lineHeight: lineHeightFor(lang, z(15)) }]}>{t('stations.empty.body')}</Text>
          </View>
        }
      />
    </View>
  );
}

type S = ReturnType<typeof makeStyles>;

function Chip({ st, t, lang, label, active, onPress, dot }: { st: S; t: T; lang: Language; label: string; active: boolean; onPress: () => void; dot?: string }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active, checked: active }}
      aria-checked={active}
      accessibilityLabel={t('stations.filter.a11y', { label })}
      onPress={onPress}
      style={[st.chip, active && st.chipActive]}
    >
      {dot ? <View style={[st.chipDot, { backgroundColor: dot }]} /> : null}
      <Text style={[st.chipText, { lineHeight: lineHeightFor(lang, 12) }, active && { color: '#FFFFFF', fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(z: (n: number) => number) {
  const soft = { shadowColor: '#3B2BB5', shadowOpacity: 0.07, shadowRadius: z(12), shadowOffset: { width: 0, height: z(4) }, elevation: 3 } as const;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    header: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: z(20), gap: z(10) },
    title: { fontSize: z(31), fontWeight: '800', color: NAVY, letterSpacing: -0.6 },
    sub: { fontSize: z(13), color: '#5A6482', marginTop: z(1) },
    pill: { flexDirection: 'row', alignItems: 'center', gap: z(6), paddingHorizontal: z(11), minHeight: z(28), flexShrink: 0, borderRadius: 99, backgroundColor: '#E5F7EC', borderWidth: 1, borderColor: '#C4EBD3', marginTop: z(4) },
    pillText: { fontSize: z(12), fontWeight: '700', color: '#0F6B3E' },
    searchRow: { flexDirection: 'row', gap: z(10), marginHorizontal: z(16) },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: z(10), height: z(48), paddingHorizontal: z(14), borderRadius: z(16), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, ...soft },
    input: { flex: 1, minWidth: 0, fontSize: z(13.5), color: NAVY, paddingVertical: 0, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) },
    mapBtn: { width: z(48), height: z(48), borderRadius: z(16), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, alignItems: 'center', justifyContent: 'center', ...soft },
    chips: { paddingHorizontal: z(16), gap: z(7), alignItems: 'center' },
    chip: { flexDirection: 'row', alignItems: 'center', gap: z(5), minHeight: Math.max(44, z(36)), paddingHorizontal: z(10), borderRadius: 99, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, ...soft, shadowOpacity: 0.05 },
    chipActive: { backgroundColor: VIOLET, borderColor: VIOLET, shadowColor: VIOLET, shadowOpacity: 0.3 },
    chipDot: { width: z(9), height: z(9), borderRadius: z(5) },
    chipText: { fontSize: z(12), fontWeight: '500', color: NAVY },
    legend: { marginHorizontal: z(20), marginTop: z(10), marginBottom: z(6), fontSize: z(11.5), color: SLATE },
    empty: { textAlign: 'center', fontSize: z(15), color: NAVY },
  });
}
