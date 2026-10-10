import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ExternalLink, Info, Map as MapIcon } from 'lucide-react-native';
import { Button, Notice, Screen } from '../../components/ui';
import { StationHero } from '../../components/station/StationHero';
import { ActionButtons, AmenitiesSection, BusesSection, GatesSection, LineCards, NeighbourStrip, NearbySection, type LineCardData } from '../../components/station/StationSections';
import { StationTimingsAccordion } from '../../components/route/RouteDetails';
import { Accordion, CARD_LINE, ExpandAlert, NAVY, SLATE, VIOLET, cardShadow } from '../../components/route/primitives';
import { useHeroState } from '../../components/home/useHeroClock';
import { useHomeScale } from '../../components/home/scale';
import { useReady } from '../../state/useReady';
import { formatDate, mapsSearchUrl } from '../../lib/format';
import { nearbyBusStops } from '../../lib/transit/nearby';
import { useTransit } from '../../lib/transit/transitData';
import { useT } from '../../i18n/useT';
import type { Language, MessageKey } from '../../i18n';
import type { VerificationStatus } from '../../types';
import { lineHeightFor, spacingFor } from '../../components/station/lineHeight';
import { gateFeatures, hopEstimate, neighboursOn, stationAmenities, stationService } from '../../lib/stationView';

export default function StationScreen() {
  const { id, sky } = useLocalSearchParams<{ id: string; sky?: string }>();
  const { dataset, network, stationPoints } = useReady();
  const insets = useSafeAreaInsets();
  const { z } = useHomeScale();
  const { t, lang } = useT();
  const { look, focused } = useHeroState(sky);
  const bus = useTransit(true);

  const station = id ? network.stations.get(id) : undefined;
  const corridors = useMemo(() => new Map(dataset.corridors.map((c) => [c.id, c])), [dataset]);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/stations'));

  if (!station) {
    return (
      <Screen>
        <View style={{ padding: 16, gap: 16 }}>
          <Notice tone="warn" title={t('station.notFound.title')}>
            {t('station.notFound.body')}
          </Notice>
          <Button label={t('station.notFound.back')} onPress={goBack} />
        </View>
      </Screen>
    );
  }

  const nameOf = (sid: string) => network.stations.get(sid)?.name ?? sid;
  const gates = dataset.gates.filter((g) => g.stationId === station.id);
  const own = station.corridorIds.map((cid) => corridors.get(cid)).filter((c): c is NonNullable<typeof c> => !!c);
  const color = own[0]?.color ?? VIOLET;
  const underground = station.stationType === 'underground';
  const typeLabel = station.stationType === 'unknown' ? null : t(underground ? 'station.type.underground' : 'station.type.elevated');
  const coordStatusLabel = (v: VerificationStatus) => t(`station.coord.${v}` as MessageKey);
  const service = stationService(dataset.timetable, station.id, new Date());
  const amenities = stationAmenities(station, gates, dataset.facilities, t);
  const gateList = gateFeatures(station, gates);
  const tabs = own.map((c) => neighboursOn(c, station.id));
  const coord = (sid: string) => stationPoints.get(sid) ?? null;
  const landmarks = dataset.landmarks.filter((l) => l.nearestStationId === station.id);
  const links = station.nearbyConnections.filter((c) => c.gateNumber === null);
  const lineCards: LineCardData[] = own.map((c) => ({
    id: c.id,
    name: /branch|line$/i.test(c.shortName) ? c.shortName : t('station.line.named', { name: c.shortName }),
    color: c.color,
    ends: `${nameOf(c.backwardTerminalId)} ⇄ ${nameOf(c.forwardTerminalId)}`,
    phase: station.phase,
    type: typeLabel,
  }));
  // Directions a train from this station can head, for the platform signs.
  const towards = own.flatMap((c) => {
    const n = neighboursOn(c, station.id);
    return [n.prev, n.next].filter((x): x is NonNullable<typeof x> => !!x).map((x) => ({ name: nameOf(x.towardsId), color: c.color }));
  });
  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };
  const source = dataset.sources.find((s) => s.id === station.sourceMetadata.sourceId);

  return (
    <Screen edges={[]}>
      {focused ? <StatusBar style="light" /> : null}
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + z(32) }} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <StationHero station={station} color={color} service={service} typeLabel={typeLabel} onBack={goBack} onMaps={() => openUrl(mapsSearchUrl(station.name))} />
          <View style={{ gap: z(14), marginTop: z(14) }}>
            <ActionButtons onStart={() => router.navigate({ pathname: '/', params: { from: station.id } })} onGo={() => router.navigate({ pathname: '/', params: { to: station.id } })} />
            <LineCards lines={lineCards} />

            {station.interchangeNote ? (
              <View style={{ marginHorizontal: 16 }}>
                <ExpandAlert tone="info" title={t('station.interchange.title')} text={station.interchangeNote} />
              </View>
            ) : null}
            {station.serviceNote ? (
              <View style={{ marginHorizontal: 16 }}>
                <ExpandAlert title={t('station.serviceNote.title')} text={station.serviceNote} />
              </View>
            ) : null}
            {underground ? (
              <View style={{ marginHorizontal: 16 }}>
                <ExpandAlert tone="info" title={t('station.gps.title')} text={t('station.gps.body')} />
              </View>
            ) : null}

            <NeighbourStrip
              tabs={tabs}
              nameOf={nameOf}
              minutesOf={(a, b) => hopEstimate(a, b, coord, dataset.timetable.lines)}
              here={{ id: station.id, name: station.name }}
              onOpen={(sid) => router.push({ pathname: '/station/[id]', params: { id: sid } })}
              onMap={() => router.push('/map')}
            />

            <GatesSection gates={gateList} underground={underground} lineColor={color} night={look.night} towards={towards} hasServiceNote={!!station.serviceNote} />

            <AmenitiesSection data={amenities} />

            <BusesSection stops={bus.status === 'ready' ? nearbyBusStops(bus.transit, station.id, 4) : []} loading={bus.status === 'loading'} onPlan={(stopId) => router.navigate({ pathname: '/', params: { from: stopId } })} />

            <NearbySection places={landmarks} links={links} onMaps={() => openUrl(mapsSearchUrl(station.name))} />

            <View style={{ gap: z(10), marginHorizontal: 16 }}>
              <StationTimingsAccordion lines={service.lines} timetable={dataset.timetable} corridors={corridors} nameOf={nameOf} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('station.map.a11y')}
                onPress={() => router.push('/map')}
                style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: z(14), padding: z(14), borderRadius: z(20), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, opacity: pressed ? 0.9 : 1 }, cardShadow, { shadowOpacity: 0.05 }]}
              >
                <View style={{ width: z(46), height: z(46), borderRadius: z(14), backgroundColor: '#E3F1FC', alignItems: 'center', justifyContent: 'center' }}>
                  <MapIcon size={z(23)} color="#0F6FC4" strokeWidth={1.9} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: z(16.5), fontWeight: '800', color: NAVY, lineHeight: lineHeightFor(lang, z(16.5), 1.3) }}>{t('station.map.title')}</Text>
                  <Text style={{ fontSize: z(12.5), color: SLATE, lineHeight: lineHeightFor(lang, z(12.5)) }}>{t('station.map.sub')}</Text>
                </View>
                <ChevronRight size={z(22)} color="#5A5FA8" />
              </Pressable>
              <Accordion icon={Info} tint="#475569" tintBg="#EEF1F6" title={t('station.about.title')} subtitle={t('station.about.sub')}>
                <Fact z={z} lang={lang} label={t('station.about.source')} value={source?.name ?? station.sourceMetadata.sourceId} />
                <Fact z={z} lang={lang} label={t('station.about.checked')} value={t('station.about.checkedValue', { date: formatDate(station.sourceMetadata.verifiedAt, lang), pageDate: formatDate(dataset.info.sourcePageLastUpdated, lang) })} />
                <Fact
                  z={z}
                  lang={lang}
                  label={t('station.about.position')}
                  value={
                    station.latitude !== null
                      ? t('station.about.positionValue', { coords: `${station.latitude.toFixed(5)}, ${station.longitude!.toFixed(5)}`, status: coordStatusLabel(station.coordinateStatus) })
                      : t('station.about.na')
                  }
                />
                {station.aliases.length > 0 ? <Fact z={z} lang={lang} label={t('station.about.alias')} value={station.aliases.join(', ')} /> : null}
                <Fact z={z} lang={lang} label={t('station.about.notes')} value={station.sourceMetadata.notes} />
                {station.sourceMetadata.sourceUrl ? (
                  <Pressable onPress={() => openUrl(station.sourceMetadata.sourceUrl!)} accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}>
                    <ExternalLink size={z(14)} color={VIOLET} />
                    <Text style={{ flexShrink: 1, color: VIOLET, fontWeight: '700', fontSize: z(13), lineHeight: lineHeightFor(lang, z(13)) }}>{t('station.about.website')}</Text>
                  </Pressable>
                ) : null}
              </Accordion>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Fact({ z, lang, label, value }: { z: (n: number) => number; lang: Language; label: string; value: string }) {
  return (
    <View style={{ gap: 1 }}>
      <Text style={{ fontSize: z(11), fontWeight: '800', color: SLATE, letterSpacing: spacingFor(lang, 0.6), lineHeight: lineHeightFor(lang, z(11)) }}>{label.toUpperCase()}</Text>
      <Text style={{ fontSize: z(13), color: NAVY, lineHeight: lineHeightFor(lang, z(13)) }}>{value}</Text>
    </View>
  );
}
