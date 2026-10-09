import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ChevronRight, Info, LocateFixed } from 'lucide-react-native';
import { Card, Muted, Notice, Screen, SectionTitle } from '../../components/ui';
import { OfflineBadge } from '../../components/OfflineBadge';
import { StationPicker } from '../../components/StationPicker';
import { LocationCard } from '../../components/live/LocationCard';
import { JourneyPanel } from '../../components/live/JourneyPanel';
import { RecordCard } from '../../components/live/RecordCard';
import { useReady } from '../../state/useReady';
import { useLocation, type Precision } from '../../hooks/useLocation';
import { findRoute } from '../../lib/routing';
import { describeLocation, describeSignalLoss, type LocationText } from '../../lib/liveText';
import { isHeadingAway, isUndergroundLink, locate, signalState, trackJourney } from '../../lib/locator';
import { resolvePosition } from '../../lib/position';
import { colors, radius, space, type } from '../../theme';

type Target = 'from' | 'to' | null;

export default function LiveScreen() {
  const { network, dataset, stationPoints, links, stationCoords, recordStationFix, clearStationCoord, clearStationCoords } = useReady();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const [precision, setPrecision] = useState<Precision>('precise');
  const loc = useLocation(true, precision);

  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [picker, setPicker] = useState<Target>(null);
  const [manualIdx, setManualIdx] = useState<number | null>(null);
  const [demoIdx, setDemoIdx] = useState<number | null>(null);
  const [wake, setWake] = useState(true);

  // Pre-fill from "Track live" on the route screen, once per set of params.
  const paramKey = `${params.from ?? ''}|${params.to ?? ''}`;
  const [appliedKey, setAppliedKey] = useState('');
  if (paramKey !== appliedKey) {
    setAppliedKey(paramKey);
    if (params.from && network.stations.has(params.from)) setFromId(params.from);
    if (params.to && network.stations.has(params.to)) setToId(params.to);
    setManualIdx(null);
    setDemoIdx(null);
  }

  const nameOf = (id: string) => network.stations.get(id)?.name ?? id;

  // ---- where am I?
  const signal = signalState(loc.now, loc.fix?.timestamp ?? null);
  const located = useMemo(() => (loc.fix ? locate(loc.fix, stationPoints, links) : null), [loc.fix, stationPoints, links]);

  const text: LocationText | null = useMemo(() => {
    if (!loc.fix || !located) return null;
    if (signal === 'lost') {
      const age = Math.round((loc.now - loc.fix.timestamp) / 1000);
      let lastKnown: string | null = null;
      let underground = false;
      const st = (id: string) => network.stations.get(id);
      if (located.kind === 'at-station' || located.kind === 'near-station') {
        lastKnown = `${located.kind === 'at-station' ? 'at' : 'near'} ${nameOf(located.stationId)}`;
        underground = st(located.stationId)?.stationType === 'underground';
      } else if (located.kind === 'between') {
        lastKnown = `between ${nameOf(located.fromId)} and ${nameOf(located.toId)}`;
        underground = isUndergroundLink(st(located.fromId), st(located.toId));
      }
      return describeSignalLoss(age, lastKnown, underground);
    }
    return describeLocation(located, nameOf, loc.fix.accuracyM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.fix, loc.now, located, signal, network]);

  // ---- journey
  const routeOutcome = useMemo(() => (fromId && toId ? findRoute(network, fromId, toId) : null), [network, fromId, toId]);
  const route = routeOutcome && routeOutcome.ok ? routeOutcome : null;
  const routeIds = route?.stationIds ?? null;

  const gps = useMemo(() => (loc.fix && routeIds ? trackJourney(loc.fix, routeIds, stationPoints) : null), [loc.fix, routeIds, stationPoints]);
  const headingAway = useMemo(() => {
    if (!routeIds || signal !== 'live') return false;
    const hist = loc.history.map((f) => trackJourney(f, routeIds, stationPoints).progress).filter((p): p is number => p !== null);
    return isHeadingAway(hist);
  }, [loc.history, routeIds, stationPoints, signal]);
  const position = useMemo(
    () => (routeIds ? resolvePosition(routeIds, gps, signal, manualIdx, demoIdx) : null),
    [routeIds, gps, signal, manualIdx, demoIdx],
  );

  // ---- demo ride: steps through the stations; never uses the phone's location
  const demoRunning = demoIdx !== null;
  const lastIdx = routeIds ? routeIds.length - 1 : 0;
  useEffect(() => {
    if (!demoRunning) return;
    const t = setInterval(() => setDemoIdx((i) => (i === null ? null : Math.min(lastIdx, i + 1))), 2500);
    return () => clearInterval(t);
  }, [demoRunning, lastIdx]);

  // ---- arrival alert (foreground only)
  const alertKey = wake && position && (position.arriving || position.arrived) && route ? `${route.originId}>${route.destinationId}:${position.arrived ? 'arrived' : 'arriving'}` : null;
  const alertedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!alertKey) {
      alertedRef.current = null;
      return;
    }
    if (alertedRef.current !== alertKey) {
      alertedRef.current = alertKey;
      Vibration.vibrate([0, 500, 250, 500, 250, 500]);
    }
  }, [alertKey]);

  const undergroundOnRoute = useMemo(() => (routeIds ?? []).filter((id) => network.stations.get(id)?.stationType === 'underground'), [routeIds, network]);

  const coverage = {
    known: stationPoints.size,
    total: dataset.stations.length,
    recorded: [...stationPoints.values()].filter((p) => p.source === 'recorded').length,
  };
  const canUseAsStart = located && (located.kind === 'at-station' || located.kind === 'near-station') ? located.stationId : null;

  const confirmClearAll = () => {
    const run = () => void clearStationCoords();
    if (Platform.OS === 'web') return run();
    Alert.alert('Remove all recorded positions?', 'Station positions go back to the built-in map pins.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={type.title} accessibilityRole="header">
              Live
            </Text>
            <Muted>Your place on the metro, from this phone’s GPS. Works offline.</Muted>
          </View>
          <OfflineBadge />
        </View>

        <LocationCard
          permission={loc.permission}
          canAskAgain={loc.canAskAgain}
          servicesEnabled={loc.servicesEnabled}
          onRequest={() => void loc.request()}
          precision={precision}
          onPrecision={setPrecision}
          signal={signal}
          fix={loc.fix}
          text={text}
          error={loc.error}
          coverage={coverage}
        />

        <View>
          <SectionTitle>Track a journey</SectionTitle>
          <Card style={{ gap: space.md }}>
            <StationRow label="From" value={fromId ? nameOf(fromId) : null} placeholder="Choose starting station" dot={colors.origin} onPress={() => setPicker('from')} />
            <StationRow label="To" value={toId ? nameOf(toId) : null} placeholder="Choose destination" dot={colors.destination} onPress={() => setPicker('to')} />
            {canUseAsStart && canUseAsStart !== fromId ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Use ${nameOf(canUseAsStart)} as my start`}
                onPress={() => {
                  setFromId(canUseAsStart);
                  setManualIdx(null);
                }}
                style={styles.useHere}
              >
                <LocateFixed size={16} color={colors.primary} />
                <Text style={styles.useHereText}>I’m at {nameOf(canUseAsStart)}: use as start</Text>
              </Pressable>
            ) : null}
            {routeOutcome && !routeOutcome.ok ? <Notice tone="warn">{routeOutcome.message}</Notice> : null}
            {!routeOutcome ? <Muted>Pick your start and destination to follow your progress stop by stop.</Muted> : null}
          </Card>
        </View>

        {route ? (
          <>
            {undergroundOnRoute.length > 0 ? (
              <Notice title="Underground section on this route">
                GPS can’t reach underground stations ({undergroundOnRoute.map(nameOf).join(', ')}). Expect the signal to drop there; use “I’m here” check-ins if you want to keep tracking.
              </Notice>
            ) : null}
            <JourneyPanel
              route={route}
              stations={network.stations}
              position={position}
              headingAway={headingAway}
              offRouteM={gps?.status === 'off-route' ? gps.offRouteM : null}
              wake={wake}
              onWake={setWake}
              demoRunning={demoRunning}
              onDemo={() => {
                setManualIdx(null);
                setDemoIdx(demoRunning ? null : 0);
              }}
              onCheckIn={(idx) => {
                setDemoIdx(null);
                setManualIdx(idx);
              }}
              onClearCheckIn={() => setManualIdx(null)}
              gpsActive={loc.permission === 'granted'}
            />
          </>
        ) : null}

        <RecordCard
          fix={loc.fix}
          stations={network.stations}
          coords={stationCoords}
          suggestedId={located?.kind === 'at-station' ? located.stationId : null}
          onRecord={(id) => (loc.fix ? recordStationFix(id, loc.fix) : Promise.resolve(null))}
          onClearOne={(id) => void clearStationCoord(id)}
          onClearAll={confirmClearAll}
        />

        <Card style={{ gap: space.sm }}>
          <View style={styles.infoHead}>
            <Info size={18} color={colors.primary} />
            <Text style={type.h3}>How live location works here</Text>
          </View>
          {[
            'GPS works with no internet. MetroMate compares your phone’s position with the stored station map on the device.',
            'Mobile-network (cell tower) positioning is done by the phone’s operating system, not by MetroMate: the app can’t read cell tower IDs. “Battery saver” asks for balanced accuracy so the OS may use cell or Wi‑Fi location, which is less accurate. Fixes are labelled by accuracy.',
            'Underground (Kankaria East, Kalupur, Gheekanta, Shahpur) GPS is unavailable. MetroMate then says “signal lost” and shows your last position instead of guessing.',
            'This tracks YOU, not other trains. There is no live train feed, and MetroMate never shows a train’s position or arrival time.',
            'Tracking and alerts work only while the app is open. Station pins are from an unofficial map (estimated).',
          ].map((t) => (
            <View key={t} style={{ flexDirection: 'row', gap: 6 }}>
              <ChevronRight size={14} color={colors.faint} style={{ marginTop: 3 }} />
              <Text style={[type.small, { flex: 1 }]}>{t}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      <StationPicker
        visible={picker !== null}
        title={picker === 'from' ? 'Starting station' : 'Destination'}
        onClose={() => setPicker(null)}
        onSelect={(id) => {
          if (picker === 'from') setFromId(id);
          else setToId(id);
          setManualIdx(null);
          setDemoIdx(null);
        }}
      />
    </Screen>
  );
}

function StationRow({ label, value, placeholder, dot, onPress }: { label: string; value: string | null; placeholder: string; dot: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} station: ${value ?? 'not chosen'}. Tap to change`}
      onPress={onPress}
      style={({ pressed }) => [styles.stationRow, pressed && { backgroundColor: colors.primarySoft }]}
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

const styles = StyleSheet.create({
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stationRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  dot: { width: 12, height: 12, borderRadius: 6 },
  useHere: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
  useHereText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
