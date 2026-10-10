import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Text, Vibration, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Maximize2, Wifi } from 'lucide-react-native';
import { Notice, Screen } from '../../components/ui';
import { colors } from '../../theme';
import { StationPicker } from '../../components/StationPicker';
import { Hero } from '../../components/home/Hero';
import { HomeHeader, type HeaderBadge } from '../../components/home/HomeSections';
import { useHeroState } from '../../components/home/useHeroClock';
import { useHomeScale } from '../../components/home/scale';
import { HowItWorks, TrackSection, WhereAmICard } from '../../components/live/LiveSections';
import { JourneyScreen } from '../../components/journey/JourneyScreen';
import { RecordCard } from '../../components/live/RecordCard';
import { useApp } from '../../state/AppProvider';
import { useReady } from '../../state/useReady';
import { useLocation, type Precision } from '../../hooks/useLocation';
import { findRoute } from '../../lib/routing';
import { findFarePair } from '../../lib/fareCalculator';
import { cardFromSignalLoss, describeLocationCard, describeSignalLoss, walkingDirectionsUrl, type LocationCardText } from '../../lib/liveText';
import { isHeadingAway, isUndergroundLink, locate, signalState, trackJourney } from '../../lib/locator';
import { resolvePosition } from '../../lib/position';

type Target = 'from' | 'to' | null;

export default function LiveScreen() {
  const { network, dataset, stationPoints, links, stationCoords, recordStationFix, clearStationCoord, clearStationCoords } = useReady();
  const params = useLocalSearchParams<{ from?: string; to?: string; sky?: string }>();
  const insets = useSafeAreaInsets();
  const { z } = useHomeScale();
  const { online } = useApp();
  const { look, focused, animate, reduceMotion } = useHeroState(params.sky);
  const [precision, setPrecision] = useState<Precision>('precise');
  const loc = useLocation(true, precision);

  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [picker, setPicker] = useState<Target>(null);
  const [manualIdx, setManualIdx] = useState<number | null>(null);
  const [demoIdx, setDemoIdx] = useState<number | null>(null);
  const [wake, setWake] = useState(true);
  const [tracking, setTracking] = useState(false);
  /** The full-screen live view is open (tracking can continue while it is minimised). */
  const [immersive, setImmersive] = useState(false);
  const [trackWarn, setTrackWarn] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // Pre-fill from "Track live" on the route screen, once per set of params.
  const paramKey = `${params.from ?? ''}|${params.to ?? ''}`;
  const [appliedKey, setAppliedKey] = useState('');
  if (paramKey !== appliedKey) {
    setAppliedKey(paramKey);
    const f = params.from && network.stations.has(params.from) ? params.from : null;
    const t = params.to && network.stations.has(params.to) ? params.to : null;
    if (f) setFromId(f);
    if (t) setToId(t);
    setManualIdx(null);
    setDemoIdx(null);
    // "Track" on the route screen has already chosen both ends, so start following straight away.
    setTracking(!!f && !!t && f !== t);
    setImmersive(!!f && !!t && f !== t);
    setTrackWarn(null);
    setNote(null);
  }

  const nameOf = (id: string) => network.stations.get(id)?.name ?? id;

  // ---- where am I?
  const signal = signalState(loc.now, loc.fix?.timestamp ?? null);
  const located = useMemo(() => (loc.fix ? locate(loc.fix, stationPoints, links) : null), [loc.fix, stationPoints, links]);

  const card: LocationCardText | null = useMemo(() => {
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
      return cardFromSignalLoss(describeSignalLoss(age, lastKnown, underground));
    }
    return describeLocationCard(located, nameOf, loc.fix.accuracyM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.fix, loc.now, located, signal, network]);

  // ---- journey
  const routeOutcome = useMemo(() => (fromId && toId ? findRoute(network, fromId, toId) : null), [network, fromId, toId]);
  const route = routeOutcome && routeOutcome.ok ? routeOutcome : null;
  const routeIds = tracking && route ? route.stationIds : null;

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
  const alertKey = wake && tracking && position && (position.arriving || position.arrived) && route ? `${route.originId}>${route.destinationId}:${position.arrived ? 'arrived' : 'arriving'}` : null;
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

  // Nearest station to the phone: the start for "Use my current location".
  const nearestStationId = useMemo(() => {
    if (!located || signal === 'lost') return null;
    switch (located.kind) {
      case 'at-station':
      case 'near-station':
        return located.stationId;
      case 'off-network':
        return located.nearestId;
      case 'between':
        return located.fraction < 0.5 ? located.fromId : located.toId;
      default:
        return null;
    }
  }, [located, signal]);

  const directionsUrl = useMemo(() => {
    const id = card?.nearestId;
    const pt = id ? stationPoints.get(id) : undefined;
    return pt ? walkingDirectionsUrl(pt.lat, pt.lon) : null;
  }, [card, stationPoints]);

  const stationsChanged = () => {
    setTracking(false);
    setImmersive(false);
    setTrackWarn(null);
    setNote(null);
    setManualIdx(null);
    setDemoIdx(null);
  };

  const toggleTracking = () => {
    if (tracking) return stationsChanged();
    if (!fromId || !toId) return setTrackWarn('Choose both a starting station and a destination.');
    if (fromId === toId) return setTrackWarn('Your start and destination are the same station.');
    if (routeOutcome && !routeOutcome.ok) return setTrackWarn(routeOutcome.message);
    setTrackWarn(null);
    setNote(null);
    setTracking(true);
    setImmersive(true);
  };

  const undergroundOnRoute = useMemo(() => (routeIds ?? []).filter((id) => network.stations.get(id)?.stationType === 'underground'), [routeIds, network]);

  const coverage = {
    known: stationPoints.size,
    total: dataset.stations.length,
    recorded: [...stationPoints.values()].filter((p) => p.source === 'recorded').length,
  };

  const confirmClearAll = () => {
    const run = () => void clearStationCoords();
    if (Platform.OS === 'web') return run();
    Alert.alert('Remove all recorded positions?', 'Station positions go back to the built-in map pins.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: run },
    ]);
  };

  const badge: HeaderBadge = {
    label: online === false ? 'Offline mode' : 'Offline ready',
    Icon: Wifi,
    accessibilityLabel: online === false ? 'Offline mode. Live location still works from stored station positions.' : 'Offline ready. Live location works without internet.',
  };
  const hint =
    note ??
    (tracking && route
      ? `Following ${nameOf(route.originId)} to ${nameOf(route.destinationId)}.`
      : 'Pick your start and destination to follow your progress stop by stop.');

  return (
    <Screen edges={[]}>
      {focused ? <StatusBar style={look.statusBar} /> : null}
      <ScrollView contentContainerStyle={{ paddingBottom: z(28) }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <View>
            <Hero height={z(128) + insets.top} look={look} animate={animate} mode="arrive" />
            <HomeHeader topInset={insets.top} ink={look.ink} inkSoft={look.inkSoft} tagline="Live · Track · Reach Faster" badge={badge} />
            <View style={{ height: z(21) }} />
          </View>

          <View style={{ gap: z(14) }}>
            <WhereAmICard
              permission={loc.permission}
              canAskAgain={loc.canAskAgain}
              servicesEnabled={loc.servicesEnabled}
              onRequest={() => void loc.request()}
              precision={precision}
              onPrecision={setPrecision}
              signal={signal}
              fix={loc.fix}
              card={card}
              directionsUrl={directionsUrl}
              error={loc.error}
              coverage={coverage}
            />

            <View>
              <TrackSection
                fromName={fromId ? nameOf(fromId) : null}
                toName={toId ? nameOf(toId) : null}
                onFrom={() => setPicker('from')}
                onTo={() => setPicker('to')}
                onSwap={() => {
                  setFromId(toId);
                  setToId(fromId);
                  stationsChanged();
                }}
                tracking={tracking}
                onToggle={toggleTracking}
                useLocationLabel={loc.permission === 'granted' && nearestStationId ? `Use ${nameOf(nearestStationId)}, the nearest station to me, as my start` : null}
                onUseLocation={() => {
                  if (!nearestStationId) return;
                  setFromId(nearestStationId);
                  stationsChanged();
                  setNote(`Starting from ${nameOf(nearestStationId)}, the nearest station to you.`);
                }}
                hint={hint}
                warn={trackWarn ?? (routeOutcome && !routeOutcome.ok && tracking ? routeOutcome.message : null)}
              />
            </View>

            {tracking && route && !immersive ? (
              <View style={{ marginHorizontal: z(16), gap: z(10) }}>
                {undergroundOnRoute.length > 0 ? (
                  <Notice title="Underground section on this route">
                    GPS can’t reach underground stations ({undergroundOnRoute.map(nameOf).join(', ')}). The live view then shows an estimate, clearly labelled, until GPS returns.
                  </Notice>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open the live journey view"
                  onPress={() => setImmersive(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: '#ECE9FF' }}
                >
                  <Maximize2 size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: '800', color: colors.text }}>Live journey view</Text>
                    <Text style={{ fontSize: 12, color: colors.slate }}>
                      {nameOf(route.originId)} to {nameOf(route.destinationId)} · tracking continues
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>Open</Text>
                </Pressable>
              </View>
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

            <HowItWorks />
          </View>
        </View>
      </ScrollView>

      <Modal visible={tracking && !!route && immersive} animationType={Platform.OS === 'web' ? 'none' : 'slide'} presentationStyle="fullScreen" statusBarTranslucent onRequestClose={() => setImmersive(false)}>
        {route ? (
          <JourneyScreen
            route={route}
            stations={network.stations}
            corridorColor={(id) => dataset.corridors.find((c) => c.id === id)?.color ?? colors.primary}
            stationPoints={stationPoints}
            timetableLines={dataset.timetable.lines}
            calculatorMinutes={findFarePair(dataset.fares, route.originId, route.destinationId)?.travelMinutes ?? null}
            position={position}
            fix={loc.fix}
            signal={signal}
            nowMs={loc.now}
            permission={loc.permission}
            canAskAgain={loc.canAskAgain}
            onRequestLocation={() => void loc.request()}
            online={online}
            offRouteM={gps?.status === 'off-route' ? gps.offRouteM : null}
            headingAway={headingAway}
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
            onMinimize={() => setImmersive(false)}
            onEnd={stationsChanged}
            look={look}
            animate={animate}
            reduceMotion={reduceMotion}
          />
        ) : null}
      </Modal>

      <StationPicker
        visible={picker !== null}
        title={picker === 'from' ? 'Starting station' : 'Destination'}
        allowBus={false}
        onClose={() => setPicker(null)}
        onSelect={(id) => {
          if (picker === 'from') setFromId(id);
          else setToId(id);
          stationsChanged();
        }}
      />
    </Screen>
  );
}
