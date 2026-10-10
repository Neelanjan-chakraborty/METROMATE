import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Database } from 'lucide-react-native';
import { Notice, Screen } from '../../components/ui';
import { StationPicker } from '../../components/StationPicker';
import { Hero } from '../../components/home/Hero';
import { useHeroState } from '../../components/home/useHeroClock';
import { HomeHeader, JourneyCard, QuickRoutes, RecentTrips, SectionHeader, ShortcutCards, type QuickItem, type TripItem } from '../../components/home/HomeSections';
import { useHomeScale } from '../../components/home/scale';
import { useReady } from '../../state/useReady';
import { findRoute } from '../../lib/routing';
import { isBusId } from '../../lib/transit/types';
import { placeName } from '../../lib/transit/places';
import { useTransit } from '../../lib/transit/transitData';
import { formatAtParam, minutesOfDay } from '../../lib/transit/format';
import { getFare } from '../../lib/fareCalculator';
import { getJourneyTime } from '../../lib/journeyTime';
import { formatDate, plural, relativeDay } from '../../lib/format';
import { colors } from '../../theme';
import { QUICK_SLOTS, type QuickSlot } from '../../types';

type Target = 'from' | 'to' | null;
const QUICK_LABEL: Record<QuickSlot, string> = { home: 'Home', campus: 'Campus', work: 'Work' };

export default function Home() {
  const { dataset, network, recents, quickRoutes, setQuickRoute, clearQuickRoute, storage } = useReady();
  const params = useLocalSearchParams<{ from?: string; to?: string; sky?: string }>();
  const insets = useSafeAreaInsets();
  const { z } = useHomeScale();

  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [picker, setPicker] = useState<Target>(null);
  const [error, setError] = useState<string | null>(null);
  const [quickHint, setQuickHint] = useState<string | null>(null);
  /** Minutes since midnight to depart at, or null for "leave now". */
  const [leaveMin, setLeaveMin] = useState<number | null>(null);

  // Pre-fill from a station page ("Start here" / "Go here"), applied once per set of params.
  const paramKey = `${params.from ?? ''}|${params.to ?? ''}`;
  const [appliedKey, setAppliedKey] = useState('');
  if (paramKey !== appliedKey) {
    setAppliedKey(paramKey);
    if (params.from && (network.stations.has(params.from) || isBusId(params.from))) setFromId(params.from);
    if (params.to && (network.stations.has(params.to) || isBusId(params.to))) setToId(params.to);
  }

  // The bus data is parsed only when something on screen needs a bus stop's name.
  const needBus = isBusId(fromId) || isBusId(toId) || recents.slice(0, 3).some((r) => isBusId(r.fromId) || isBusId(r.toId)) || quickRoutes.some((q) => isBusId(q.fromId) || isBusId(q.toId));
  const bus = useTransit(needBus);
  const transit = bus.status === 'ready' ? bus.transit : null;
  const name = (id: string | null) => (id ? placeName(id, network.stations, transit) ?? (isBusId(id) ? 'Bus stop' : id) : null);
  /** Metro-to-metro "leave now" trips keep the metro route screen; anything with a bus stop or a chosen time uses the multimodal planner. */
  const openRoute = (a: string, b: string, at: number | null = null) => {
    if (isBusId(a) || isBusId(b) || at !== null) router.push({ pathname: '/route', params: { from: a, to: b, mode: 'transit', ...(at !== null ? { at: formatAtParam(at) } : {}) } });
    else router.push({ pathname: '/route', params: { from: a, to: b } });
  };

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
    setError(null);
  };

  const find = () => {
    if (!fromId || !toId) return setError('Choose both a start and a destination (a station or a bus stop).');
    if (fromId === toId) return setError('Your start and destination are the same place.');
    setError(null);
    openRoute(fromId, toId, leaveMin);
  };

  // ---- quick routes: tap to open a saved one, or save the stations chosen above into an empty slot
  const quickItems: QuickItem[] = QUICK_SLOTS.map((slot) => {
    const q = quickRoutes.find((r) => r.slot === slot);
    return { slot, label: QUICK_LABEL[slot], summary: q ? `${name(q.fromId)} → ${name(q.toId)}` : null };
  });
  const onQuick = (slot: QuickSlot) => {
    const q = quickRoutes.find((r) => r.slot === slot);
    if (q) {
      setQuickHint(null);
      return openRoute(q.fromId, q.toId);
    }
    if (!fromId || !toId || fromId === toId) {
      return setQuickHint(`To save ${QUICK_LABEL[slot]}, choose two different places above, then tap ${QUICK_LABEL[slot]} again.`);
    }
    void setQuickRoute(slot, fromId, toId).then(() => setQuickHint(`Saved ${name(fromId)} → ${name(toId)} as ${QUICK_LABEL[slot]}.`));
  };

  // ---- recent trips: real journeys from the on-device database
  const trips: TripItem[] = useMemo(() => {
    const corridors = new Map(dataset.corridors.map((c) => [c.id, c]));
    const out: TripItem[] = [];
    for (const r of recents.slice(0, 3)) {
      if (isBusId(r.fromId) || isBusId(r.toId)) {
        out.push({
          id: r.id,
          fromName: placeName(r.fromId, network.stations, transit) ?? 'Bus stop',
          toName: placeName(r.toId, network.stations, transit) ?? 'Bus stop',
          chips: [{ color: '#0F6FC4', label: 'Bus + metro' }],
          day: relativeDay(r.createdAt),
          metric: 'Plan',
        });
        continue;
      }
      const route = findRoute(network, r.fromId, r.toId);
      if (!route.ok) continue;
      const time = getJourneyTime(network, route, dataset.fares);
      const fare = getFare(dataset.fares, r.fromId, r.toId);
      const metric =
        time.status === 'estimated' ? `${time.minutes} min` : fare.status === 'available' && fare.travelMinutes !== null ? `${fare.travelMinutes} min` : plural(route.stopCount, 'stop');
      out.push({
        id: r.id,
        fromName: network.stations.get(r.fromId)?.name ?? r.fromId,
        toName: network.stations.get(r.toId)?.name ?? r.toId,
        chips: route.segments.map((s) => ({ color: corridors.get(s.corridorId)?.color ?? colors.primary, label: corridors.get(s.corridorId)?.shortName ?? s.corridorId })),
        day: relativeDay(r.createdAt),
        metric,
      });
    }
    return out;
  }, [recents, network, dataset, transit]);

  const openTrip = (id: number) => {
    const r = recents.find((x) => x.id === id);
    if (r) openRoute(r.fromId, r.toId);
  };

  // ---- living hero: sky, lights and train follow the real time (or ?sky=HH:MM for a preview)
  const { look, focused, animate } = useHeroState(params.sky);

  const heroHeight = z(176) + insets.top;

  return (
    <Screen edges={[]}>
      {focused ? <StatusBar style={look.statusBar} /> : null}
      <ScrollView contentContainerStyle={{ paddingBottom: z(28) }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <View>
            <Hero height={heroHeight} look={look} animate={animate} />
            <HomeHeader topInset={insets.top} ink={look.ink} inkSoft={look.inkSoft} />
            <View style={{ height: z(76) }} />
          </View>

          <JourneyCard
            fromName={name(fromId)}
            toName={name(toId)}
            onFrom={() => setPicker('from')}
            onTo={() => setPicker('to')}
            onSwap={swap}
            onFind={find}
            error={error}
            leaveAt={leaveMin === null ? null : formatAtParam(leaveMin)}
            onLeaveNow={() => setLeaveMin(null)}
            onLeaveAt={() => setLeaveMin((m) => m ?? Math.ceil((minutesOfDay(new Date()) + 5) / 5) * 5)}
            onLeaveStep={(d) => setLeaveMin((m) => (((m ?? minutesOfDay(new Date())) + d) % 1440 + 1440) % 1440)}
          />

          <ShortcutCards onMap={() => router.push('/map')} onStations={() => router.push('/stations')} />

          <SectionHeader title="Quick routes" onSeeAll={() => router.push('/saved')} />
          <QuickRoutes items={quickItems} onPress={onQuick} onClear={(slot) => void clearQuickRoute(slot).then(() => setQuickHint(`${QUICK_LABEL[slot]} shortcut removed.`))} />
          {quickHint ? <Text style={styles.hint}>{quickHint}</Text> : null}

          <SectionHeader title="Recent trips" onSeeAll={() => router.push('/saved')} />
          <RecentTrips trips={trips} onOpen={openTrip} />

          {storage === 'memory' ? (
            <View style={{ marginHorizontal: z(16), marginTop: z(16) }}>
              <Notice tone="warn" title="Saved routes won’t be kept">
                The on-device database could not be opened, so favourites, quick routes and recent trips last only until you close the app.
              </Notice>
            </View>
          ) : null}

          <Pressable onPress={() => router.push('/data')} style={styles.dataLink} accessibilityRole="button" accessibilityLabel="About the data and its sources">
            <Database size={15} color={colors.slate} />
            <Text style={styles.dataText}>
              Offline GMRC data · source page updated {formatDate(dataset.info.sourcePageLastUpdated)} · Data &amp; sources
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <StationPicker
        visible={picker !== null}
        title={picker === 'from' ? 'Start from' : 'Go to'}
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

const styles = StyleSheet.create({
  hint: { marginHorizontal: 20, marginTop: 10, fontSize: 13.5, color: colors.primaryDark, fontWeight: '600' },
  dataLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, marginTop: 14, paddingHorizontal: 16, flexWrap: 'wrap' },
  dataText: { fontSize: 12.5, color: colors.slate, textAlign: 'center' },
});
