import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftRight, ChevronDown, ChevronLeft, ChevronUp, Clock, LocateFixed, Map as MapIcon, Star, Ticket } from 'lucide-react-native';
import { Button, Card, IconButton, Muted, Notice, Pill, Screen, SectionTitle, VerifyBadge } from '../components/ui';
import { RouteTimeline } from '../components/RouteTimeline';
import { OfflineBadge } from '../components/OfflineBadge';
import { useReady } from '../state/useReady';
import { findRoute } from '../lib/routing';
import { getFare } from '../lib/fareCalculator';
import { getJourneyTime, getServiceInfo } from '../lib/journeyTime';
import { formatDate, plural } from '../lib/format';
import { colors, radius, space, type } from '../theme';

export default function RouteScreen() {
  const { from, to } = useLocalSearchParams<{ from?: string; to?: string }>();
  const { dataset, network, isFavourite, toggleFavourite, recordRecent } = useReady();

  const outcome = useMemo(() => findRoute(network, from, to), [network, from, to]);
  const ok = outcome.ok;

  useEffect(() => {
    if (ok && from && to) recordRecent(from, to).catch(() => undefined);
  }, [ok, from, to, recordRecent]);

  const corridors = useMemo(() => new Map(dataset.corridors.map((c) => [c.id, c])), [dataset]);
  const fav = from && to ? isFavourite(from, to) : false;

  const header = (
    <View style={styles.topBar}>
      <IconButton icon={ChevronLeft} label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} color={colors.text} />
      <Text style={[type.h2, { flex: 1 }]} accessibilityRole="header">
        Route
      </Text>
      <OfflineBadge />
      {ok ? <IconButton icon={Star} label={fav ? 'Remove from favourites' : 'Save to favourites'} onPress={() => toggleFavourite(from!, to!)} color={fav ? colors.interchange : colors.muted} filled={fav} /> : null}
    </View>
  );

  if (!outcome.ok) {
    return (
      <Screen>
        {header}
        <ScrollView contentContainerStyle={styles.scroll}>
          <Notice tone="warn" title="No route to show">
            {outcome.message}
          </Notice>
          <Button label="Choose different stations" onPress={() => router.replace('/')} />
        </ScrollView>
      </Screen>
    );
  }

  const route = outcome;
  const origin = network.stations.get(route.originId)!;
  const destination = network.stations.get(route.destinationId)!;
  const fare = getFare(dataset.fares, route.originId, route.destinationId);
  const time = getJourneyTime(network, route, dataset.fares);
  const services = getServiceInfo(dataset.timetable, route);

  return (
    <Screen>
      {header}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={{ gap: space.md }}>
          <View style={styles.endpoints}>
            <View style={{ flex: 1 }}>
              <Text style={type.tiny}>From</Text>
              <Text style={type.h2}>{origin.name}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={type.tiny}>To</Text>
              <Text style={[type.h2, { textAlign: 'right' }]}>{destination.name}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <Stat label="Stops" value={String(route.stopCount)} />
            <Stat label="Changes" value={String(route.interchanges.length)} />
            <Stat label="In-between" value={String(route.intermediateCount)} />
          </View>

          <View style={styles.infoRow}>
            <Ticket size={18} color={colors.muted} />
            <View style={{ flex: 1 }}>
              {fare.status === 'available' ? (
                <>
                  <Text style={type.h3}>
                    ₹{fare.amountInr}
                    {fare.distanceKm !== null ? ` · ${fare.distanceKm} km` : ''}
                  </Text>
                  <Muted>
                    {fare.fareType}
                    {fare.validFrom ? ` · valid from ${formatDate(fare.validFrom)}` : ''}. Other ticket types may cost differently.
                    {dataset.fares.coverage?.capturedAt ? ` Fares checked ${formatDate(dataset.fares.coverage.capturedAt)}; they can change.` : ''}
                  </Muted>
                </>
              ) : (
                <>
                  <Text style={type.h3}>{fare.message}</Text>
                  <Muted>No verified GMRC fare is stored for this pair of stations. Check the ticket window or the GMRC app. MetroMate never guesses a fare from the number of stops.</Muted>
                </>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <Clock size={18} color={colors.muted} />
            <View style={{ flex: 1 }}>
              {time.status === 'estimated' ? (
                <>
                  <Text style={type.h3}>
                    About {plural(time.minutes, 'min')}
                    {time.source === 'gmrc-calculator' ? ' (GMRC estimate)' : ' in the train (estimate)'}
                  </Text>
                  <Muted>{time.note}</Muted>
                </>
              ) : (
                <>
                  <Text style={type.h3}>Journey time: not available offline</Text>
                  <Muted>GMRC publishes end-to-end times per line (see “Published train timings” below) but not per station, so none is calculated.</Muted>
                </>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              label="Reverse"
              icon={ArrowLeftRight}
              variant="secondary"
              compact
              style={{ flex: 1 }}
              onPress={() => router.replace({ pathname: '/route', params: { from: route.destinationId, to: route.originId } })}
            />
            <Button label="Map" icon={MapIcon} variant="secondary" compact style={{ flex: 1 }} onPress={() => router.push({ pathname: '/map', params: { from: route.originId, to: route.destinationId } })} />
            <Button label="Track" icon={LocateFixed} compact style={{ flex: 1 }} onPress={() => router.push({ pathname: '/live', params: { from: route.originId, to: route.destinationId } })} />
          </View>
        </Card>

        {route.warnings.map((w) => (
          <Notice key={w} tone="warn">
            {w}
          </Notice>
        ))}

        <View>
          <SectionTitle>Your journey</SectionTitle>
          <Card>
            <RouteTimeline route={route} stations={network.stations} corridors={corridors} onStationPress={(id) => router.push({ pathname: '/station/[id]', params: { id } })} />
            <View style={styles.exitNote}>
              <Text style={type.small}>
                <Text style={{ fontWeight: '700', color: colors.text }}>Exit guidance: </Text>
                Gate and exit directions for {destination.name} are not verified yet. Follow the exit signs inside the station.
              </Text>
            </View>
          </Card>
        </View>

        <PublishedTimings services={services} stations={network.stations} timetable={dataset.timetable} />

        <TicketRules rules={dataset.fareRules} />

        <Card style={{ gap: space.sm }}>
          <View style={styles.rowBetween}>
            <Text style={type.h3}>Data confidence</Text>
            <VerifyBadge status="verified" />
          </View>
          <Muted>
            Network layout transcribed from the GMRC route map (checked {formatDate(origin.sourceMetadata.verifiedAt)}). Route chosen for fewest stops, then fewest changes — GMRC does not publish
            per-station travel times, so a shortest-time route can’t be calculated. Not a live train status.
          </Muted>
          <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
            {Array.from(new Set(route.segments.map((s) => s.corridorId))).map((cid) => (
              <Pill key={cid} label={corridors.get(cid)?.shortName ?? cid} color={colors.text} bg="#EEF0F5" />
            ))}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={type.tiny}>{label}</Text>
    </View>
  );
}

function PublishedTimings({
  services,
  stations,
  timetable,
}: {
  services: ReturnType<typeof getServiceInfo>;
  stations: Map<string, { name: string }>;
  timetable: { validFrom: string; sourcePageLastUpdated: string; notes: string[] };
}) {
  const [open, setOpen] = useState(false);
  const name = (id: string) => stations.get(id)?.name ?? id;
  return (
    <Card style={{ gap: space.sm }}>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityLabel="Published train timings" accessibilityState={{ expanded: open }} style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={type.h3}>Published train timings</Text>
          <Muted>Static GMRC schedule, effective {formatDate(timetable.validFrom)}. Not live.</Muted>
        </View>
        {open ? <ChevronUp size={20} color={colors.muted} /> : <ChevronDown size={20} color={colors.muted} />}
      </Pressable>
      {open ? (
        <View style={{ gap: space.md }}>
          {services.map(({ line }) => (
            <View key={line.id} style={styles.lineBox}>
              <Text style={type.h3}>{line.label}</Text>
              <Muted>
                Whole line: {line.endToEndMinutes} min · {line.distanceKm} km (published end-to-end figure, not your journey time)
              </Muted>
              <Text style={[type.small, { color: colors.text, marginTop: 4 }]}>
                First train: {line.firstTrain.map((t) => `${t.time} from ${name(t.stationId)}`).join(' · ')}
              </Text>
              <Text style={[type.small, { color: colors.text }]}>
                Last train: {line.lastTrain.map((t) => `${t.time} from ${name(t.stationId)}`).join(' · ')}
              </Text>
              <Text style={[type.small, { color: colors.text, marginTop: 4, fontWeight: '700' }]}>Frequency</Text>
              {line.frequency.map((f) => (
                <Text key={f.label} style={type.small}>
                  • {f.label}: {f.kind === 'bus-only' ? 'bus services only' : `${f.kind === 'average' ? 'average ' : 'every '}${f.minutes} min`}
                </Text>
              ))}
            </View>
          ))}
          {timetable.notes.map((n) => (
            <Muted key={n}>{n}</Muted>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function TicketRules({ rules }: { rules: { rules: string[]; products: string[]; media: string[]; phaseRestriction: { text: string; notes: string } } }) {
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ gap: space.sm }}>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityLabel="Ticket rules" accessibilityState={{ expanded: open }} style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={type.h3}>Ticket rules from GMRC</Text>
          <Muted>Fare media, products and key rules. No fare amounts.</Muted>
        </View>
        {open ? <ChevronUp size={20} color={colors.muted} /> : <ChevronDown size={20} color={colors.muted} />}
      </Pressable>
      {open ? (
        <View style={{ gap: 6 }}>
          <Text style={[type.small, { fontWeight: '700', color: colors.text }]}>Ticket products</Text>
          <Muted>{rules.products.join(' · ')}</Muted>
          <Text style={[type.small, { fontWeight: '700', color: colors.text, marginTop: 6 }]}>Fare media</Text>
          <Muted>{rules.media.join(' · ')}</Muted>
          <Text style={[type.small, { fontWeight: '700', color: colors.text, marginTop: 6 }]}>Rules</Text>
          {rules.rules.map((r) => (
            <Text key={r} style={type.small}>
              • {r}
            </Text>
          ))}
          <Notice tone="warn" title="Phase-1 / Phase-2 travel">
            {rules.phaseRestriction.text} ({rules.phaseRestriction.notes})
          </Notice>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.sm, paddingTop: space.xs },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2, maxWidth: 720, width: '100%', alignSelf: 'center' },
  endpoints: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, backgroundColor: colors.primarySoft, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.primaryDark },
  infoRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', gap: space.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  exitNote: { marginTop: space.md, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  lineBox: { backgroundColor: colors.bg, borderRadius: radius.md, padding: space.md, gap: 2 },
});
