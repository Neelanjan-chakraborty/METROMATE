import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ExternalLink, Flag, MapPin, Navigation } from 'lucide-react-native';
import { Button, Card, CorridorDot, IconButton, Muted, Notice, Pill, Screen, SectionTitle, VerifyBadge } from '../../components/ui';
import { OfflineBadge } from '../../components/OfflineBadge';
import { useReady } from '../../state/useReady';
import { StationThumb } from '../../components/stations/StationThumb';
import { stationPhoto } from '../../components/stations/photos';
import { formatDate, mapsSearchUrl } from '../../lib/format';
import { colors, radius, space, type } from '../../theme';

export default function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dataset, network } = useReady();
  const [facilitiesOpen, setFacilitiesOpen] = useState(false);

  const station = id ? network.stations.get(id) : undefined;
  const corridors = useMemo(() => new Map(dataset.corridors.map((c) => [c.id, c])), [dataset]);

  const back = <IconButton icon={ChevronLeft} label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/stations'))} color={colors.text} />;

  if (!station) {
    return (
      <Screen>
        <View style={styles.topBar}>{back}</View>
        <View style={{ padding: space.lg }}>
          <Notice tone="warn" title="Station not found">
            This station is not in the offline data.
          </Notice>
        </View>
      </Screen>
    );
  }

  const gates = dataset.gates.filter((g) => g.stationId === station.id);
  const landmarks = dataset.landmarks.filter((l) => l.nearestStationId === station.id);
  const source = dataset.sources.find((s) => s.id === station.sourceMetadata.sourceId);

  const photo = stationPhoto(station.id);
  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        {back}
        <Text style={[type.h2, { flex: 1 }]} numberOfLines={1} accessibilityRole="header">
          {station.name}
        </Text>
        <OfflineBadge />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={{ gap: space.md }}>
          <View style={{ gap: space.xs }}>
            <StationThumb station={station} color={corridors.get(station.corridorIds[0])?.color ?? colors.primary} width={2} height={1} radius={radius.md} fluid />
            {photo ? (
              <Pressable accessibilityRole="link" accessibilityLabel={`Photo credit: ${photo.credit}, ${photo.license}. Opens Wikimedia Commons`} onPress={() => openUrl(photo.pageUrl)}>
                <Text style={type.tiny}>
                  Photo: {photo.credit} · {photo.license} · Wikimedia Commons
                </Text>
              </Pressable>
            ) : (
              <Text style={type.tiny}>Illustration. Not a photo of this station.</Text>
            )}
          </View>
          <View style={styles.pills}>
            {station.corridorIds.map((cid) => {
              const c = corridors.get(cid);
              return c ? <Pill key={cid} label={c.shortName} color={colors.text} bg="#EEF0F5" /> : null;
            })}
            {station.isInterchange ? <Pill label="Interchange" color={colors.warn} bg={colors.interchangeSoft} /> : null}
            <Pill label={`Phase ${station.phase}`} color={colors.muted} bg="#EEF0F5" />
            {station.stationType !== 'unknown' ? (
              <Pill label={station.stationType === 'underground' ? 'Underground' : 'Elevated'} color={colors.muted} bg="#EEF0F5" />
            ) : null}
          </View>
          {station.aliases.length > 0 ? <Muted>Also known as: {station.aliases.join(', ')}</Muted> : null}
          {station.interchangeNote ? <Notice>{station.interchangeNote}</Notice> : null}
          {station.serviceNote ? <Notice tone="warn">{station.serviceNote}</Notice> : null}
          {station.stationType === 'underground' ? <Notice>GPS does not work underground, so Live tracking will show “signal lost” here.</Notice> : null}
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Start here" icon={Flag} variant="secondary" compact style={{ flex: 1 }} onPress={() => router.navigate({ pathname: '/', params: { from: station.id } })} />
            <Button label="Go here" icon={Navigation} compact style={{ flex: 1 }} onPress={() => router.navigate({ pathname: '/', params: { to: station.id } })} />
          </View>
        </Card>

        <View>
          <SectionTitle>Neighbouring stations</SectionTitle>
          <Card style={{ gap: space.md }}>
            {station.corridorIds.map((cid) => {
              const c = corridors.get(cid)!;
              const edges = (network.edges.get(station.id) ?? []).filter((e) => e.corridorId === cid);
              return (
                <View key={cid} style={{ gap: space.sm }}>
                  <View style={styles.corridorHead}>
                    <CorridorDot color={c.color} />
                    <Text style={type.h3}>{c.name}</Text>
                  </View>
                  {edges.map((e) => (
                    <Pressable
                      key={e.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${e.direction}: next station ${network.stations.get(e.toStationId)?.name}`}
                      onPress={() => router.push({ pathname: '/station/[id]', params: { id: e.toStationId } })}
                      style={styles.neighbour}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={type.tiny}>{e.direction}</Text>
                        <Text style={type.h3}>{network.stations.get(e.toStationId)?.name}</Text>
                      </View>
                      <ChevronRight size={18} color={colors.faint} />
                    </Pressable>
                  ))}
                  {edges.length === 1 ? <Muted>This is the end of the {c.shortName} line in one direction.</Muted> : null}
                </View>
              );
            })}
          </Card>
        </View>

        <View>
          <SectionTitle>Gates &amp; platforms</SectionTitle>
          <Card style={{ gap: space.sm }}>
            {gates.length === 0 ? (
              <Muted>
                {station.serviceNote
                  ? 'GMRC’s table of operational entry/exit gates does not list this station.'
                  : 'Entry and exit gate information is not available for this station.'}
              </Muted>
            ) : (
              <>
                <Muted>
                  GMRC lists {gates.length} operational entry/exit {gates.length === 1 ? 'gate' : 'gates'}. GMRC publishes gate numbers only: which street or landmark each gate faces is not verified, so check the signs inside the station.
                </Muted>
                {gates.map((g) => (
                  <View key={g.id} style={styles.gateRow}>
                    <View style={styles.gateNo}>
                      <Text style={styles.gateNoText}>{g.gateNumber}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={type.h3}>Gate {g.gateNumber}</Text>
                      {g.accessibilityNotes ? <Text style={type.small}>{g.accessibilityNotes}</Text> : null}
                      {(g.nearbyConnectionNotes ?? []).map((n) => (
                        <Text key={n} style={type.small}>
                          {n} <Text style={{ color: colors.warn }}>(unofficial map, unverified)</Text>
                        </Text>
                      ))}
                      <Text style={type.tiny}>Direction: not verified yet</Text>
                    </View>
                  </View>
                ))}
                {gates.some((g) => g.notes) ? <Muted>{[...new Set(gates.map((g) => g.notes).filter(Boolean))].join(' ')}</Muted> : null}
              </>
            )}
            <View style={styles.divider} />
            {station.platforms.length === 0 ? (
              <Muted>Platform numbers and boarding sides are not verified yet. Trains here are signed “Towards …” the terminal of each line.</Muted>
            ) : (
              station.platforms.map((p) => (
                <Text key={p.id} style={type.small}>
                  {p.label}
                </Text>
              ))
            )}
          </Card>
        </View>

        <View>
          <SectionTitle>Lifts &amp; accessibility</SectionTitle>
          <Card style={{ gap: space.sm }}>
            {station.lifts.length > 0 ? (
              <Muted>
                GMRC lists {station.lifts.length} {station.lifts.length === 1 ? 'lift' : 'lifts'} with ramp for wheelchair users at the entrances:{' '}
                {station.lifts.map((l) => `Lift ${String(l.lift).padStart(2, '0')} near Gate ${l.nearGate}`).join(', ')}. Whether a lift is working today, and step-free access inside the station, are not published, so MetroMate does not claim this station is step-free.
              </Muted>
            ) : (
              <Muted>No lift information is published for {station.name}, so MetroMate does not claim it is step-free.</Muted>
            )}
            <Pressable onPress={() => setFacilitiesOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: facilitiesOpen }} style={styles.toggle}>
              <Text style={[type.small, { color: colors.primary, fontWeight: '700', flex: 1 }]}>Facilities GMRC lists across the network</Text>
              {facilitiesOpen ? <ChevronUp size={18} color={colors.primary} /> : <ChevronDown size={18} color={colors.primary} />}
            </Pressable>
            {facilitiesOpen ? (
              <View style={{ gap: 4 }}>
                <Muted>Network-wide, not confirmed for this station:</Muted>
                <Text style={type.small}>{dataset.facilities.general.join(' · ')}</Text>
                <Text style={[type.small, { fontWeight: '700', color: colors.text, marginTop: 4 }]}>For differently abled passengers</Text>
                <Text style={type.small}>{dataset.facilities.accessibility.join(' · ')}</Text>
              </View>
            ) : null}
          </Card>
        </View>

        <View>
          <SectionTitle>Nearby places</SectionTitle>
          <Card style={{ gap: space.md }}>
            {landmarks.length === 0 ? (
              <Muted>No nearby places are recorded for this station yet.</Muted>
            ) : (
              landmarks.map((l) => (
                <View key={l.id} style={{ gap: 2 }}>
                  <View style={styles.corridorHead}>
                    <MapPin size={16} color={colors.muted} />
                    <Text style={type.h3}>{l.name}</Text>
                  </View>
                  <Muted>
                    {l.walkingDistanceMeters !== null ? `About ${l.walkingDistanceMeters} m on foot. ` : 'Walking distance and time not verified yet. '}
                    {l.recommendedGateId ? '' : 'No verified exit gate.'}
                  </Muted>
                  <VerifyBadge status={l.verificationStatus} />
                </View>
              ))
            )}
            {station.nearbyConnections.filter((c) => c.gateNumber === null).map((c) => (
              <Muted key={c.note}>
                {c.note} (unofficial map, unverified)
              </Muted>
            ))}
            <Notice>
              {station.latitude !== null
                ? `Station position: ${station.latitude.toFixed(5)}, ${station.longitude!.toFixed(5)} (${station.coordinateStatus}; from an unofficial map pin, so it may be off by a block).`
                : 'Station coordinates are not available.'}{' '}
              MetroMate does not provide turn-by-turn walking directions.
            </Notice>
            <Button label="Search in Maps (needs internet)" icon={ExternalLink} variant="secondary" compact onPress={() => openUrl(mapsSearchUrl(station.name))} />
          </Card>
        </View>

        <Card style={{ gap: space.sm }}>
          <View style={styles.rowBetween}>
            <Text style={type.h3}>Source &amp; freshness</Text>
            <VerifyBadge status={station.sourceMetadata.verificationStatus} />
          </View>
          <Muted>{source?.name ?? station.sourceMetadata.sourceId}</Muted>
          <Muted>Checked {formatDate(station.sourceMetadata.verifiedAt)} · GMRC source page updated {formatDate(dataset.info.sourcePageLastUpdated)}</Muted>
          <Muted>{station.sourceMetadata.notes}</Muted>
          {station.sourceMetadata.sourceUrl ? (
            <Pressable onPress={() => openUrl(station.sourceMetadata.sourceUrl!)} accessibilityRole="link" style={styles.link}>
              <ExternalLink size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Open GMRC website (needs internet)</Text>
            </Pressable>
          ) : null}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.sm, paddingTop: space.xs },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2, maxWidth: 720, width: '100%', alignSelf: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  corridorHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  neighbour: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    paddingHorizontal: space.md,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
  },
  gateRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  gateNo: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  gateNoText: { fontWeight: '800', color: colors.primaryDark },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 4 },
  toggle: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
});
