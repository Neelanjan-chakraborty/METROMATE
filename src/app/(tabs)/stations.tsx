import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Search, X } from 'lucide-react-native';
import { CorridorDot, Muted, Screen } from '../../components/ui';
import { OfflineBadge } from '../../components/OfflineBadge';
import { useReady } from '../../state/useReady';
import { searchStations, type SearchHit } from '../../lib/search';
import { colors, radius, space, type } from '../../theme';

export default function StationsScreen() {
  const { dataset } = useReady();
  const [query, setQuery] = useState('');
  const [corridor, setCorridor] = useState<string | null>(null);
  const corridorById = useMemo(() => new Map(dataset.corridors.map((c) => [c.id, c])), [dataset]);

  const hits = useMemo(() => {
    const all = searchStations(dataset.stations, dataset.landmarks, query, 100);
    return corridor ? all.filter((h) => h.station.corridorIds.includes(corridor)) : all;
  }, [dataset, query, corridor]);

  const renderItem = ({ item }: { item: SearchHit }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.station.name}. Open station details`}
      onPress={() => router.push({ pathname: '/station/[id]', params: { id: item.station.id } })}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.primarySoft }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={type.h3}>{item.station.name}</Text>
        <View style={styles.tags}>
          {item.station.corridorIds.map((cid) => (
            <View key={cid} style={styles.tag}>
              <CorridorDot color={corridorById.get(cid)?.color ?? colors.muted} size={8} />
              <Text style={type.tiny}>{corridorById.get(cid)?.shortName ?? cid}</Text>
            </View>
          ))}
          {item.station.isInterchange ? <Text style={[type.tiny, { color: colors.warn, fontWeight: '700' }]}>Interchange</Text> : null}
        </View>
        {item.matchedOn === 'landmark' ? <Text style={type.tiny}>Nearest station to {item.matchedText} (from the station name; unverified)</Text> : null}
        {item.matchedOn === 'alias' ? <Text style={type.tiny}>Also known as “{item.matchedText}”</Text> : null}
      </View>
      <ChevronRight size={18} color={colors.faint} />
    </Pressable>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={type.title} accessibilityRole="header">
            Stations
          </Text>
          <Muted>{dataset.stations.length} stations · works offline</Muted>
        </View>
        <OfflineBadge />
      </View>
      <View style={styles.searchBox}>
        <Search size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search station, alias or place"
          placeholderTextColor={colors.faint}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search stations"
        />
        {query ? (
          <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={10}>
            <X size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.chips}>
        <Chip label="All" active={corridor === null} onPress={() => setCorridor(null)} />
        {dataset.corridors.map((c) => (
          <Chip key={c.id} label={c.shortName} dot={c.color} active={corridor === c.id} onPress={() => setCorridor(corridor === c.id ? null : c.id)} />
        ))}
      </View>
      <FlatList
        data={hits}
        keyExtractor={(h) => h.station.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: space.xl }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <View style={{ padding: space.xl }}>
            <Text style={[type.h3, { textAlign: 'center' }]}>No matching station</Text>
            <Muted style={{ textAlign: 'center', marginTop: 4 }}>Try a shorter name or a different spelling.</Muted>
          </View>
        }
      />
    </Screen>
  );
}

function Chip({ label, active, onPress, dot }: { label: string; active: boolean; onPress: () => void; dot?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter: ${label}`}
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      {dot ? <CorridorDot color={active ? colors.white : dot} size={8} /> : null}
      <Text style={[styles.chipText, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, paddingBottom: space.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    paddingHorizontal: space.md,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 60, backgroundColor: colors.white },
  tags: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: 3, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
