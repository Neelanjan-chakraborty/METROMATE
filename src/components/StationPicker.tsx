import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Bus, Search, TrainFront, X } from 'lucide-react-native';
import { colors, radius, space, type } from '../theme';
import { searchPlaces, type PlaceHit, type PlaceScope } from '../lib/transit/places';
import { useTransit } from '../lib/transit/transitData';
import { AGENCY_LOOK, agencyLabel } from '../lib/transit/format';
import { useReady } from '../state/useReady';
import { useT } from '../i18n/useT';
import { CorridorDot, Muted } from './ui';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** Receives a metro station id, or `bus:<stop id>` for a bus stop. */
  onSelect: (placeId: string) => void;
  /** Search bus stops too (default). Pass false for screens that only understand metro stations. */
  allowBus?: boolean;
}

export function StationPicker({ visible, title, onClose, onSelect, allowBus = true }: Props) {
  return (
    <Modal visible={visible} animationType={Platform.OS === 'web' ? 'none' : 'slide'} onRequestClose={onClose} presentationStyle="fullScreen">
      {/* The body mounts only while visible, so the search box starts empty every time. */}
      {visible ? <PickerBody title={title} onClose={onClose} onSelect={onSelect} allowBus={allowBus} /> : null}
    </Modal>
  );
}

function PickerBody({ title, onClose, onSelect, allowBus }: Omit<Props, 'visible'>) {
  const { dataset } = useReady();
  const { t, tn, lang } = useT();
  const indic = lang !== 'en';
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<PlaceScope>('all');
  const bus = useTransit(!!allowBus);
  const transit = bus.status === 'ready' ? bus.transit : null;
  const corridorById = useMemo(() => new Map(dataset.corridors.map((c) => [c.id, c])), [dataset]);
  const hits = useMemo(() => searchPlaces(dataset.stations, dataset.landmarks, allowBus ? transit : null, query, allowBus ? scope : 'metro', 60), [dataset, transit, query, scope, allowBus]);

  const renderItem = ({ item }: { item: PlaceHit }) => {
    if (item.kind === 'stop') {
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.picker.stop.a11y', { name: item.name, agencies: item.agencies.map((a) => agencyLabel(a, t)).join(` ${t('lib.and')} `) })}
          onPress={() => {
            onSelect(item.id);
            onClose();
          }}
          style={({ pressed }) => [styles.row, styles.stopRow, pressed && { backgroundColor: colors.primarySoft }]}
        >
          <View style={styles.busIcon}>
            <Bus size={18} color="#0F6FC4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.h3}>{item.name}</Text>
            <View style={styles.corridors}>
              {item.agencies.map((a) => (
                <View key={a} style={[styles.agency, { backgroundColor: AGENCY_LOOK[a].soft }]}>
                  <Text style={[styles.agencyText, { color: AGENCY_LOOK[a].color }, indic && styles.indicTiny]}>{agencyLabel(a, t)}</Text>
                </View>
              ))}
              <Text style={[type.tiny, indic && styles.indicTiny]}>{tn('lib.routes', item.routes)}</Text>
            </View>
          </View>
        </Pressable>
      );
    }
    const note =
      item.matchedOn === 'alias'
        ? t('home.picker.alias', { name: item.matchedText })
        : item.matchedOn === 'landmark'
          ? t('home.picker.landmark', { place: item.matchedText })
          : null;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.station.isInterchange ? t('home.picker.stationInterchange.a11y', { name: item.station.name }) : item.station.name}
        onPress={() => {
          onSelect(item.station.id);
          onClose();
        }}
        style={({ pressed }) => [styles.row, styles.stopRow, pressed && { backgroundColor: colors.primarySoft }]}
      >
        <View style={styles.metroIcon}>
          <TrainFront size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={type.h3}>{item.station.name}</Text>
          <View style={styles.corridors}>
            {item.station.corridorIds.map((cid) => {
              const c = corridorById.get(cid);
              return c ? (
                <View key={cid} style={styles.corridorTag}>
                  <CorridorDot color={c.color} size={8} />
                  <Text style={[type.tiny, indic && styles.indicTiny]}>{c.shortName}</Text>
                </View>
              ) : null;
            })}
            {item.station.isInterchange ? <Text style={[type.tiny, indic && styles.indicTiny, { color: colors.warn, fontWeight: '700' }]}>{t('home.picker.interchange')}</Text> : null}
          </View>
          {note ? <Text style={[type.tiny, indic && styles.indicTiny, { marginTop: 2 }]}>{note}</Text> : null}
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
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={10} style={styles.close}>
              <X size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.searchBox}>
            <Search size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={allowBus ? t('home.picker.searchAll') : t('home.picker.searchMetro')}
              placeholderTextColor={colors.faint}
              style={styles.input}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel={allowBus ? t('home.picker.searchAll.a11y') : t('home.picker.searchMetro.a11y')}
            />
            {query ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('home.picker.clear.a11y')} onPress={() => setQuery('')} hitSlop={10}>
                <X size={16} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          {allowBus ? (
            <View style={styles.scopes} accessibilityRole="radiogroup">
              {(['all', 'metro', 'bus'] as PlaceScope[]).map((sc) => (
                <Pressable key={sc} accessibilityRole="radio" accessibilityState={{ selected: scope === sc, checked: scope === sc }} aria-checked={scope === sc} accessibilityLabel={t(`home.picker.scope.${sc}.a11y`)} onPress={() => setScope(sc)} hitSlop={{ top: 5, bottom: 5 }} style={[styles.scope, scope === sc && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Text style={[styles.scopeText, indic && styles.indicScope, scope === sc && { color: colors.white }]}>{t(`home.picker.scope.${sc}`)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {allowBus && bus.status === 'loading' && scope !== 'metro' ? <Muted style={{ marginHorizontal: space.lg, marginBottom: space.xs }}>{t('home.picker.loadingBus')}</Muted> : null}
          {allowBus && bus.status === 'error' ? <Muted style={{ marginHorizontal: space.lg, marginBottom: space.xs }}>{t('home.picker.busError')}</Muted> : null}
          <FlatList
            data={hits}
            keyExtractor={(h) => (h.kind === 'stop' ? h.id : h.station.id)}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <View style={{ padding: space.xl }}>
                <Text style={[type.h3, { textAlign: 'center' }]}>{allowBus ? t('home.picker.empty.both') : t('home.picker.empty.metro')}</Text>
                <Muted style={{ textAlign: 'center', marginTop: 4 }}>
                  {allowBus && !query ? t('home.picker.typeName') : t('home.picker.tryShorter')}
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
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 10, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) },
  row: { paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 56, justifyContent: 'center' },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  busIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#E3F1FC', alignItems: 'center', justifyContent: 'center' },
  metroIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  agency: { paddingHorizontal: 8, minHeight: 20, borderRadius: 10, justifyContent: 'center' },
  /** Hindi and Gujarati need a taller line than the 12 dp default. */
  indicTiny: { lineHeight: 18 },
  indicScope: { lineHeight: 20 },
  agencyText: { fontSize: 11, fontWeight: '800' },
  scopes: { flexDirection: 'row', gap: space.sm, marginHorizontal: space.lg, marginBottom: space.sm },
  scope: { minHeight: 34, paddingVertical: 2, paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', backgroundColor: colors.white },
  scopeText: { fontSize: 13, fontWeight: '700', color: colors.text },
  corridors: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: 3, flexWrap: 'wrap' },
  corridorTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.lg },
});
