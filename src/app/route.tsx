import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftRight, Bus, ChevronLeft, ChevronRight, LocateFixed, Map as MapIcon, Share2, Star } from 'lucide-react-native';
import { Button, Notice, Screen } from '../components/ui';
import { Hero } from '../components/home/Hero';
import { useHeroState } from '../components/home/useHeroClock';
import { useHomeScale } from '../components/home/scale';
import { JourneyTimeline } from '../components/route/JourneyTimeline';
import { RouteSummary } from '../components/route/RouteSummary';
import { ServiceCard } from '../components/route/ServiceCard';
import { GoodToKnowAccordion, ScheduleAccordion, TicketAccordion } from '../components/route/RouteDetails';
import { CARD_LINE, ExpandAlert, NAVY, RoundButton, SLATE, VIOLET, cardShadow } from '../components/route/primitives';
import { TransitScreen } from '../components/transit/TransitScreen';
import { isBusId } from '../lib/transit/types';
import { useReady } from '../state/useReady';
import { findRoute } from '../lib/routing';
import { getFare } from '../lib/fareCalculator';
import { getJourneyTime } from '../lib/journeyTime';
import { linesForRoute } from '../lib/serviceNow';
import { shareSummary, stopMinutes, warningTitle } from '../lib/routeView';
import { formatDate } from '../lib/format';
import { colors } from '../theme';

/** Metro-only routes keep the metro screen; bus stops or a chosen time go to the multimodal planner. */
export default function RouteScreen() {
  const { from, to, mode } = useLocalSearchParams<{ from?: string; to?: string; mode?: string }>();
  return mode === 'transit' || isBusId(from) || isBusId(to) ? <TransitScreen /> : <MetroRouteScreen />;
}

function MetroRouteScreen() {
  const { from, to, sky } = useLocalSearchParams<{ from?: string; to?: string; sky?: string }>();
  const { dataset, network, stationPoints, isFavourite, toggleFavourite, recordRecent } = useReady();
  const insets = useSafeAreaInsets();
  const { z } = useHomeScale();
  const { look, focused, animate } = useHeroState(sky);

  const outcome = useMemo(() => findRoute(network, from, to), [network, from, to]);
  const ok = outcome.ok;

  useEffect(() => {
    if (ok && from && to) recordRecent(from, to).catch(() => undefined);
  }, [ok, from, to, recordRecent]);

  const corridors = useMemo(() => new Map(dataset.corridors.map((c) => [c.id, c])), [dataset]);
  const gateCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of dataset.gates) m.set(g.stationId, (m.get(g.stationId) ?? 0) + 1);
    return m;
  }, [dataset]);
  const fav = from && to ? isFavourite(from, to) : false;
  const nameOf = (id: string) => network.stations.get(id)?.name ?? id;
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const bar = (
    <View style={[styles.topBar, { top: insets.top + z(8) }]}>
      <RoundButton z={z} label="Back" onPress={goBack}>
        <ChevronLeft size={z(22)} color={NAVY} />
      </RoundButton>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: z(25), fontWeight: '800', color: look.ink, letterSpacing: -0.5 }} accessibilityRole="header" numberOfLines={1}>
          Your Route
        </Text>
        <Text style={{ fontSize: z(13.5), color: look.inkSoft }} numberOfLines={1}>
          Ahmedabad Metro
        </Text>
      </View>
      {ok ? (
        <RoundButton z={z} label={fav ? 'Remove from favourites' : 'Save to favourites'} onPress={() => toggleFavourite(from!, to!)}>
          <Star size={z(20)} color={fav ? colors.interchange : VIOLET} fill={fav ? colors.interchange : 'none'} />
        </RoundButton>
      ) : null}
    </View>
  );
  const heroH = insets.top + z(124);
  const hero = (
    <View style={{ height: heroH }}>
      <Hero height={heroH} look={look} animate={animate} mode="arrive" />
      {bar}
    </View>
  );

  if (!outcome.ok) {
    return (
      <Screen edges={[]}>
        {focused ? <StatusBar style={look.statusBar} /> : null}
        {hero}
        <View style={{ padding: 16, gap: 16 }}>
          <Notice tone="warn" title="No route to show">
            {outcome.message}
          </Notice>
          <Button label="Choose different stations" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const route = outcome;
  const fare = getFare(dataset.fares, route.originId, route.destinationId);
  const time = getJourneyTime(network, route, dataset.fares);
  const lines = linesForRoute(dataset.timetable, route);
  const calc = time.status === 'estimated' && time.source === 'gmrc-calculator' ? time.minutes : null;
  const perStop = stopMinutes(route, (id) => stationPoints.get(id) ?? null, dataset.timetable.lines, calc);
  const totalMin = perStop ? Math.round(perStop[perStop.length - 1]) : time.status === 'estimated' ? Math.round(time.minutes) : null;
  const fareText = fare.status === 'available' ? `₹${fare.amountInr}` : null;
  const toTrack = () => router.push({ pathname: '/live', params: { from: route.originId, to: route.destinationId } });
  const share = () => {
    Share.share({ message: shareSummary(route, network.stations, corridors) }).catch(() => undefined);
  };

  return (
    <Screen edges={[]}>
      {focused ? <StatusBar style={look.statusBar} /> : null}
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + z(104) }} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          {hero}
          <View style={{ gap: z(14), marginTop: z(-14) }}>
            <RouteSummary route={route} stations={network.stations} corridors={corridors} minutes={totalMin} fare={fareText} />

            {route.warnings.map((w) => (
              <View key={w} style={{ marginHorizontal: 16 }}>
                <ExpandAlert title={warningTitle(w)} text={w} />
              </View>
            ))}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Compare with bus and BRTS options"
              onPress={() => router.replace({ pathname: '/route', params: { from: route.originId, to: route.destinationId, mode: 'transit' } })}
              style={({ pressed }) => [{ marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: z(12), padding: z(12), borderRadius: z(16), backgroundColor: '#E3F1FC', opacity: pressed ? 0.9 : 1 }]}
            >
              <Bus size={z(20)} color="#0F6FC4" strokeWidth={2} />
              <Text style={{ flex: 1, fontSize: z(14), fontWeight: '700', color: '#0B4F8A' }}>Compare with bus & BRTS options</Text>
              <ChevronRight size={z(18)} color="#0F6FC4" />
            </Pressable>

            <ServiceCard lines={lines} corridors={corridors} nameOf={nameOf} onTrack={toTrack} />

            <View style={[styles.timeline, { marginHorizontal: 16, borderRadius: z(24), padding: z(14) }, cardShadow]}>
              <Text style={{ fontSize: z(18), fontWeight: '800', color: NAVY, marginBottom: z(8), marginLeft: z(2) }} accessibilityRole="header">
                Your journey
              </Text>
              <JourneyTimeline
                route={route}
                stations={network.stations}
                corridors={corridors}
                minutes={perStop}
                exitsOf={(id) => gateCount.get(id) ?? null}
                onStation={(id) => router.push({ pathname: '/station/[id]', params: { id } })}
              />
              {perStop ? <Text style={{ fontSize: z(11.5), color: SLATE, marginTop: z(8), marginLeft: z(2) }}>Minutes are estimates and leave out waiting and changing trains.</Text> : null}
            </View>

            <View style={{ gap: z(10), marginHorizontal: 16 }}>
              <ScheduleAccordion lines={lines} timetable={dataset.timetable} corridors={corridors} nameOf={nameOf} />
              <TicketAccordion
                rules={dataset.fareRules}
                fareText={fare.status === 'available' ? `₹${fare.amountInr}${fare.distanceKm !== null ? ` · ${fare.distanceKm} km` : ''}` : fare.message}
                fareNote={
                  fare.status === 'available'
                    ? `${fare.fareType}${fare.validFrom ? ` · valid from ${formatDate(fare.validFrom)}` : ''}. Other ticket types may cost differently.`
                    : 'No verified GMRC fare is stored for this pair. Check the ticket window or the GMRC app; MetroMate never guesses a fare from the number of stops.'
                }
              />
              <GoodToKnowAccordion
                destination={nameOf(route.destinationId)}
                towards={Array.from(new Set(route.segments.map((s) => nameOf(s.directionTerminalId))))}
                checkedOn={network.stations.get(route.originId)?.sourceMetadata.verifiedAt ?? dataset.timetable.validFrom}
                hasMinutes={perStop !== null}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 10), paddingHorizontal: 16 }]}>
        <View style={{ flexDirection: 'row', gap: z(10), maxWidth: 560, width: '100%', alignSelf: 'center', alignItems: 'center' }}>
          <RoundButton z={z} size={52} label="Reverse route" onPress={() => router.replace({ pathname: '/route', params: { from: route.destinationId, to: route.originId } })}>
            <ArrowLeftRight size={z(21)} color={VIOLET} />
          </RoundButton>
          <RoundButton z={z} size={52} label="Show on the map" onPress={() => router.push({ pathname: '/map', params: { from: route.originId, to: route.destinationId } })}>
            <MapIcon size={z(21)} color={VIOLET} />
          </RoundButton>
          <RoundButton z={z} size={52} label="Share this route" onPress={share}>
            <Share2 size={z(20)} color={VIOLET} />
          </RoundButton>
          <Pressable accessibilityRole="button" accessibilityLabel="Start live tracking" onPress={toTrack} style={({ pressed }) => [styles.primary, { height: z(52), borderRadius: z(26), opacity: pressed ? 0.9 : 1 }]}>
            <LocateFixed size={z(19)} color="#FFFFFF" />
            <Text style={{ fontSize: z(15.5), fontWeight: '800', color: '#FFFFFF' }}>Start tracking</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeline: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE },
  actionBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 10, backgroundColor: 'rgba(247,247,255,0.94)', borderTopWidth: 1, borderTopColor: CARD_LINE },
  primary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: VIOLET, shadowColor: VIOLET, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
});
