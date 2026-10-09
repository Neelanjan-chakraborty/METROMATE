import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowUpDown, ChevronRight, Database, History, List, Map as MapIcon, Navigation, Star, TrainFront } from 'lucide-react-native';
import { Button, Card, EmptyState, Muted, Notice, Screen, SectionTitle } from '../../components/ui';
import { JourneyRow } from '../../components/JourneyRow';
import { OfflineBadge } from '../../components/OfflineBadge';
import { StationPicker } from '../../components/StationPicker';
import { useReady } from '../../state/useReady';
import { colors, radius, space, type } from '../../theme';
import { formatDate } from '../../lib/format';

type Target = 'from' | 'to' | null;

export default function Home() {
  const { dataset, network, favourites, recents, storage } = useReady();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [picker, setPicker] = useState<Target>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from a station detail screen ("Start here" / "Go here"), applied once per set of params.
  const paramKey = `${params.from ?? ''}|${params.to ?? ''}`;
  const [appliedKey, setAppliedKey] = useState('');
  if (paramKey !== appliedKey) {
    setAppliedKey(paramKey);
    if (params.from && network.stations.has(params.from)) setFromId(params.from);
    if (params.to && network.stations.has(params.to)) setToId(params.to);
  }

  const name = (id: string | null) => (id ? network.stations.get(id)?.name ?? id : null);

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
    setError(null);
  };

  const find = () => {
    if (!fromId || !toId) {
      setError('Choose both a starting station and a destination.');
      return;
    }
    if (fromId === toId) {
      setError('Your start and destination are the same station.');
      return;
    }
    setError(null);
    router.push({ pathname: '/route', params: { from: fromId, to: toId } });
  };

  const open = (a: string, b: string) => router.push({ pathname: '/route', params: { from: a, to: b } });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <TrainFront size={24} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.title} accessibilityRole="header">
              MetroMate
            </Text>
            <Muted>Your offline metro companion</Muted>
          </View>
          <OfflineBadge />
        </View>

        <Card style={{ gap: space.md }}>
          <Text style={type.h2}>Where to?</Text>
          <View style={styles.pickerGroup}>
            <StationButton label="From" value={name(fromId)} placeholder="Choose starting station" dot={colors.origin} onPress={() => setPicker('from')} style={styles.stationTop} />
            <StationButton label="To" value={name(toId)} placeholder="Choose destination" dot={colors.destination} onPress={() => setPicker('to')} style={styles.stationBottom} />
            <Pressable accessibilityRole="button" accessibilityLabel="Swap start and destination" onPress={swap} style={styles.swap}>
              <ArrowUpDown size={18} color={colors.primary} />
            </Pressable>
          </View>
          {error ? <Notice tone="warn">{error}</Notice> : null}
          <Button label="Find route" icon={Navigation} onPress={find} />
        </Card>

        <View style={styles.quickRow}>
          <QuickLink icon={MapIcon} label="Network map" onPress={() => router.push('/map')} />
          <QuickLink icon={List} label="Station directory" onPress={() => router.push('/stations')} />
        </View>

        <View>
          <SectionTitle>Favourite routes</SectionTitle>
          <Card style={{ paddingVertical: space.sm }}>
            {favourites.length === 0 ? (
              <EmptyState icon={Star} title="No favourites yet" body="Open a route and tap the star to keep it here, even without internet." />
            ) : (
              favourites.slice(0, 4).map((f, i) => (
                <View key={f.id} style={i > 0 && styles.divider}>
                  <JourneyRow fromName={name(f.fromId) ?? f.fromId} toName={name(f.toId) ?? f.toId} onOpen={() => open(f.fromId, f.toId)} onReverse={() => open(f.toId, f.fromId)} />
                </View>
              ))
            )}
          </Card>
          {favourites.length > 4 ? (
            <Pressable onPress={() => router.push('/saved')} style={styles.more} accessibilityRole="button">
              <Text style={styles.moreText}>See all {favourites.length} favourites</Text>
              <ChevronRight size={16} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>

        <View>
          <SectionTitle>Recent journeys</SectionTitle>
          <Card style={{ paddingVertical: space.sm }}>
            {recents.length === 0 ? (
              <EmptyState icon={History} title="No recent journeys" body="Routes you look up appear here." />
            ) : (
              recents.slice(0, 5).map((r, i) => (
                <View key={r.id} style={i > 0 && styles.divider}>
                  <JourneyRow fromName={name(r.fromId) ?? r.fromId} toName={name(r.toId) ?? r.toId} onOpen={() => open(r.fromId, r.toId)} onReverse={() => open(r.toId, r.fromId)} />
                </View>
              ))
            )}
          </Card>
        </View>

        {storage === 'memory' ? (
          <Notice tone="warn" title="Saved routes won’t be kept">
            The on-device database could not be opened, so favourites and recents last only until you close the app.
          </Notice>
        ) : null}

        <Pressable onPress={() => router.push('/data')} style={styles.dataLink} accessibilityRole="button" accessibilityLabel="About the data and its sources">
          <Database size={16} color={colors.muted} />
          <Text style={type.small}>
            Offline GMRC data · source page updated {formatDate(dataset.info.sourcePageLastUpdated)} · Data &amp; sources
          </Text>
        </Pressable>
      </ScrollView>

      <StationPicker
        visible={picker !== null}
        title={picker === 'from' ? 'Starting station' : 'Destination'}
        onClose={() => setPicker(null)}
        onSelect={(id) => {
          if (picker === 'from') setFromId(id);
          else setToId(id);
          setError(null);
        }}
      />
    </Screen>
  );
}

function StationButton({ label, value, placeholder, dot, onPress, style }: { label: string; value: string | null; placeholder: string; dot: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} station: ${value ?? 'not chosen'}. Tap to change`}
      onPress={onPress}
      style={({ pressed }) => [styles.stationBtn, style, pressed && { backgroundColor: colors.primarySoft }]}
    >
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <View style={{ flex: 1 }}>
        <Text style={type.tiny}>{label}</Text>
        <Text style={value ? type.h3 : [type.body, { color: colors.faint }]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.faint} />
    </Pressable>
  );
}

function QuickLink({ icon: Icon, label, onPress }: { icon: typeof MapIcon; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.quick, pressed && { opacity: 0.8 }]}>
      <Icon size={20} color={colors.primary} />
      <Text style={[type.h3, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  logo: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  pickerGroup: { gap: 0 },
  stationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingRight: 64,
    minHeight: 64,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stationTop: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  stationBottom: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md, borderTopWidth: 0 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  swap: {
    position: 'absolute',
    right: space.md,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: { flexDirection: 'row', gap: space.md },
  quick: {
    flex: 1,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: space.sm, minHeight: 40 },
  moreText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  dataLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, flexWrap: 'wrap' },
});
