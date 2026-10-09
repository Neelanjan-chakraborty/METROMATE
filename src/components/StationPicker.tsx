import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { colors, radius, space, type } from '../theme';
import { searchStations, type SearchHit } from '../lib/search';
import { useReady } from '../state/useReady';
import { CorridorDot, Muted } from './ui';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSelect: (stationId: string) => void;
}

export function StationPicker({ visible, title, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} animationType={Platform.OS === 'web' ? 'none' : 'slide'} onRequestClose={onClose} presentationStyle="fullScreen">
      {/* The body mounts only while visible, so the search box starts empty every time. */}
      {visible ? <PickerBody title={title} onClose={onClose} onSelect={onSelect} /> : null}
    </Modal>
  );
}

function PickerBody({ title, onClose, onSelect }: Omit<Props, 'visible'>) {
  const { dataset } = useReady();
  const [query, setQuery] = useState('');
  const corridorById = useMemo(() => new Map(dataset.corridors.map((c) => [c.id, c])), [dataset]);
  const hits = useMemo(() => searchStations(dataset.stations, dataset.landmarks, query, 60), [dataset, query]);

  const renderItem = ({ item }: { item: SearchHit }) => {
    const note =
      item.matchedOn === 'alias'
        ? `Also known as “${item.matchedText}”`
        : item.matchedOn === 'landmark'
          ? `Nearest station to ${item.matchedText} (from the station name; unverified)`
          : null;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.station.name}${item.station.isInterchange ? ', interchange' : ''}`}
        onPress={() => {
          onSelect(item.station.id);
          onClose();
        }}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.primarySoft }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={type.h3}>{item.station.name}</Text>
          <View style={styles.corridors}>
            {item.station.corridorIds.map((cid) => {
              const c = corridorById.get(cid);
              return c ? (
                <View key={cid} style={styles.corridorTag}>
                  <CorridorDot color={c.color} size={8} />
                  <Text style={type.tiny}>{c.shortName}</Text>
                </View>
              ) : null;
            })}
            {item.station.isInterchange ? <Text style={[type.tiny, { color: colors.warn, fontWeight: '700' }]}>Interchange</Text> : null}
          </View>
          {note ? <Text style={[type.tiny, { marginTop: 2 }]}>{note}</Text> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={type.h2} accessibilityRole="header">
              {title}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10} style={styles.close}>
              <X size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.searchBox}>
            <Search size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search station or place (e.g. GIFT City)"
              placeholderTextColor={colors.faint}
              style={styles.input}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel="Search stations"
            />
            {query ? (
              <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={10}>
                <X size={16} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          <FlatList
            data={hits}
            keyExtractor={(h) => h.station.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <View style={{ padding: space.xl }}>
                <Text style={[type.h3, { textAlign: 'center' }]}>No matching station</Text>
                <Muted style={{ textAlign: 'center', marginTop: 4 }}>
                  Try a shorter name, or an alternative spelling such as “Amraiwadi” or “PDPU”.
                </Muted>
              </View>
            }
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.lg, paddingBottom: space.sm },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 10 },
  row: { paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 56, justifyContent: 'center' },
  corridors: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: 3, flexWrap: 'wrap' },
  corridorTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.lg },
});
