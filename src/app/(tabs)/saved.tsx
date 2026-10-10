import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Database, History, RotateCcw, Star, Trash2 } from 'lucide-react-native';
import { Button, Card, EmptyState, Muted, Notice, Screen, SectionTitle } from '../../components/ui';
import { JourneyRow } from '../../components/JourneyRow';
import { OfflineBadge } from '../../components/OfflineBadge';
import { useReady } from '../../state/useReady';
import { formatDate } from '../../lib/format';
import { isBusId } from '../../lib/transit/types';
import { placeName } from '../../lib/transit/places';
import { useTransit } from '../../lib/transit/transitData';
import { colors, space, type } from '../../theme';

export default function SavedScreen() {
  const { dataset, network, favourites, recents, removeFavourite, clearRecents, resetLocalData, storage } = useReady();
  const [done, setDone] = useState<string | null>(null);
  const hasBus = [...favourites, ...recents].some((r) => isBusId(r.fromId) || isBusId(r.toId));
  const bus = useTransit(hasBus);
  const transit = bus.status === 'ready' ? bus.transit : null;
  const name = (id: string) => placeName(id, network.stations, transit) ?? (isBusId(id) ? 'Bus stop' : id);
  const open = (a: string, b: string) => router.push({ pathname: '/route', params: isBusId(a) || isBusId(b) ? { from: a, to: b, mode: 'transit' } : { from: a, to: b } });

  const confirmReset = () => {
    const run = async () => {
      await resetLocalData();
      setDone('Local data reset. Favourites and recent journeys were cleared and the bundled dataset restored.');
    };
    if (Platform.OS === 'web') {
      void run();
      return;
    }
    Alert.alert('Reset local data?', 'This clears your favourites and recent journeys and restores the bundled offline dataset.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => void run() },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={type.title} accessibilityRole="header">
              Saved
            </Text>
            <Muted>Stored on this device. No account needed.</Muted>
          </View>
          <OfflineBadge />
        </View>

        <View>
          <SectionTitle>Favourite routes</SectionTitle>
          <Card style={{ paddingVertical: space.sm }}>
            {favourites.length === 0 ? (
              <EmptyState icon={Star} title="No favourites yet" body="Open a route and tap the star to save it." />
            ) : (
              favourites.map((f, i) => (
                <View key={f.id} style={i > 0 && styles.divider}>
                  <JourneyRow
                    fromName={name(f.fromId)}
                    toName={name(f.toId)}
                    onOpen={() => open(f.fromId, f.toId)}
                    onReverse={() => open(f.toId, f.fromId)}
                    onRemove={() => removeFavourite(f.id)}
                    removeLabel="Remove favourite"
                  />
                </View>
              ))
            )}
          </Card>
        </View>

        <View>
          <SectionTitle
            right={recents.length > 0 ? <Button label="Clear history" icon={Trash2} variant="danger" compact onPress={() => void clearRecents()} /> : undefined}
          >
            Recent journeys
          </SectionTitle>
          <Card style={{ paddingVertical: space.sm }}>
            {recents.length === 0 ? (
              <EmptyState icon={History} title="No recent journeys" body="Routes you look up appear here." />
            ) : (
              recents.map((r, i) => (
                <View key={r.id} style={i > 0 && styles.divider}>
                  <JourneyRow fromName={name(r.fromId)} toName={name(r.toId)} onOpen={() => open(r.fromId, r.toId)} onReverse={() => open(r.toId, r.fromId)} />
                </View>
              ))
            )}
          </Card>
        </View>

        <View>
          <SectionTitle>Data &amp; storage</SectionTitle>
          <Card style={{ gap: space.sm }}>
            <Row label="Offline dataset" value={dataset.info.version} />
            <Row label="GMRC source page updated" value={formatDate(dataset.info.sourcePageLastUpdated)} />
            <Row label="Timetable effective" value={formatDate(dataset.timetable.validFrom)} />
            <Row label="Stored in" value={storage === 'sqlite' ? 'On-device SQLite database' : 'Memory only (database unavailable)'} />
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
              <Button label="Data & sources" icon={Database} variant="secondary" compact style={{ flex: 1 }} onPress={() => router.push('/data')} />
              <Button label="Reset local data" icon={RotateCcw} variant="danger" compact style={{ flex: 1 }} onPress={confirmReset} />
            </View>
          </Card>
          {done ? (
            <View style={{ marginTop: space.sm }}>
              <Notice>{done}</Notice>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={type.small}>{label}</Text>
      <Text style={[type.small, { color: colors.text, fontWeight: '700', flexShrink: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
});
