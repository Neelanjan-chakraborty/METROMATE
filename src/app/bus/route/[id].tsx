import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, CalendarClock, Map as MapIcon, Repeat, Route as RouteIcon } from 'lucide-react-native';
import { Button, Notice, Screen } from '../../../components/ui';
import { BusCard, BusTopBar, Divider, ScheduledTag, SectionHead } from '../../../components/bus/BusUi';
import { useNow } from '../../../components/bus/useNow';
import { useHomeScale } from '../../../components/home/scale';
import { departuresAt, waitText } from '../../../lib/transit/departures';
import { agencyLabel, dayOffset, formatClockMinutes, isoDate, minutesOfDay } from '../../../lib/transit/format';
import { buildRouteIndex, headwayBands, typicalOffsets } from '../../../lib/transit/routeIndex';
import { feedExpired, useTransit } from '../../../lib/transit/transitData';
import type { TransitIndex } from '../../../lib/transit/transitIndex';
import { busStopId } from '../../../lib/transit/types';
import { useT } from '../../../i18n/useT';
import { bus } from '../../../theme/bus';

const clock = (m: number) => `${formatClockMinutes(m)}${dayOffset(m) > 0 ? ' +1' : ''}`;
const SHOWN_STOPS = 8;

export default function BusRouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const state = useTransit(true);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/bus'));
  if (state.status !== 'ready') {
    return (
      <Screen edges={[]}>
        <BusTopBar title={state.status === 'error' ? t('bus.unavailable.title') : t('bus.loading.route')} onBack={goBack} />
        {state.status === 'error' ? (
          <View style={{ padding: 16 }}>
            <Notice tone="warn" title={t('bus.loadError.title')}>
              {t('bus.loadError.body')}
            </Notice>
          </View>
        ) : null}
      </Screen>
    );
  }
  return <Route id={id} transit={state.transit} goBack={goBack} />;
}

function Route({ id, transit, goBack }: { id: string | undefined; transit: TransitIndex; goBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { z } = useHomeScale();
  const { t, tn } = useT();
  const now = useNow();
  const ri = useMemo(() => buildRouteIndex(transit), [transit]);
  const index = id !== undefined && /^\d+$/.test(id) ? Number(id) : -1;
  const r = ri.routes[index];
  const [dirIx, setDirIx] = useState(0);
  const [all, setAll] = useState(false);

  if (!r || r.dirs.length === 0) {
    return (
      <Screen edges={[]}>
        <BusTopBar title={r ? `${r.short}` : t('bus.route.notFound')} subtitle={r?.long} onBack={goBack} />
        <View style={{ padding: 16, gap: 16 }}>
          <Notice tone="warn" title={r ? t('bus.route.noTrips.title') : t('bus.route.notFound')}>
            {r ? t('bus.route.noTrips.body') : t('bus.route.notInData')}
          </Notice>
          <Button label={t('bus.backToBuses')} onPress={() => router.replace('/bus')} />
        </View>
      </Screen>
    );
  }

  const d = transit.data;
    const dir = r.dirs[Math.min(dirIx, r.dirs.length - 1)];
  const stops = d.patterns.stops[dir.pattern];
  const offsets = typicalOffsets(transit, dir.pattern);
  const bands = headwayBands(transit, dir.pattern, t);
  const nowMin = minutesOfDay(now);
  const expired = feedExpired(transit, isoDate(now));
  const next = departuresAt(transit, stops[0], nowMin, 80)
    .filter((x) => x.route === r.index && x.headsign === dir.headsign)
    .slice(0, 4);
  const maxTrips = Math.max(1, ...bands.map((b) => b.trips));
  const shown = all ? stops : stops.slice(0, SHOWN_STOPS);
  const ride = offsets.length ? offsets[offsets.length - 1] : null;

  return (
    <Screen edges={[]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + z(32) }} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <BusTopBar title={`${agencyLabel(r.agency, t)} ${r.short}`} subtitle={r.long} onBack={goBack}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: z(8), marginTop: z(12) }}>
              <ScheduledTag light />
              <Chip z={z} text={tn('bus.tripsADay', r.trips)} />
              {r.first !== null && r.last !== null ? <Chip z={z} text={`${clock(r.first)} – ${clock(r.last)}`} /> : null}
            </View>
          </BusTopBar>

          <View style={{ gap: z(14), marginTop: z(14) }}>
            {expired ? (
              <View style={{ marginHorizontal: 16 }}>
                <Notice tone="warn" title={t('bus.expired.title')}>
                  {t('bus.expired.body', { date: d.meta.source.validTo })}
                </Notice>
              </View>
            ) : null}

            {r.dirs.length > 1 ? (
              <View style={{ flexDirection: 'row', marginHorizontal: 16, padding: 3, borderRadius: z(24), backgroundColor: bus.soft, gap: 3 }} accessibilityRole="tablist">
                {r.dirs.map((x, i) => (
                  <Pressable key={x.dir} accessibilityRole="tab" accessibilityState={{ selected: i === dirIx }} accessibilityLabel={t('bus.towards.a11y', { place: x.headsign })} onPress={() => setDirIx(i)} style={{ flex: 1, minHeight: z(44), borderRadius: z(21), paddingHorizontal: z(10), alignItems: 'center', justifyContent: 'center', backgroundColor: i === dirIx ? bus.red : 'transparent' }}>
                    <Text style={{ fontSize: z(10.5), color: i === dirIx ? 'rgba(255,255,255,0.85)' : bus.inkSoft }}>{t('bus.towards.label')}</Text>
                    <Text style={{ fontSize: z(13), fontWeight: '800', color: i === dirIx ? '#FFFFFF' : bus.ink }} numberOfLines={1}>
                      {x.headsign}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <BusCard style={{ paddingVertical: z(10) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8) }}>
                  <Text style={{ flex: 1, fontSize: z(14.5), fontWeight: '700', color: bus.ink }} numberOfLines={1}>
                    {dir.origin}
                  </Text>
                  <ArrowRight size={z(16)} color={bus.red} />
                  <Text style={{ flex: 1, fontSize: z(14.5), fontWeight: '700', color: bus.ink, textAlign: 'right' }} numberOfLines={1}>
                    {dir.headsign}
                  </Text>
                </View>
              </BusCard>
            )}

            <View style={{ flexDirection: 'row', gap: z(10), marginHorizontal: 16 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('bus.showOnMap.a11y')} onPress={() => router.navigate({ pathname: '/map', params: { route: r.id } })} style={({ pressed }) => [{ flex: 1, minHeight: z(48), paddingVertical: z(6), paddingHorizontal: z(8), borderRadius: z(24), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(7), backgroundColor: bus.red, opacity: pressed ? 0.88 : 1 }]}>
                <MapIcon size={z(18)} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={{ flexShrink: 1, textAlign: 'center', fontSize: z(15), fontWeight: '800', color: '#FFFFFF' }}>{t('bus.showOnMap')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t('bus.planTrip.a11y', { origin: dir.origin })} onPress={() => router.navigate({ pathname: '/', params: { from: busStopId(d.stops.id[stops[0]]) } })} style={({ pressed }) => [{ flex: 1, minHeight: z(48), paddingVertical: z(6), paddingHorizontal: z(8), borderRadius: z(24), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(7), backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: bus.red, opacity: pressed ? 0.88 : 1 }]}>
                <Repeat size={z(18)} color={bus.red} strokeWidth={2.2} />
                <Text style={{ flexShrink: 1, textAlign: 'center', fontSize: z(15), fontWeight: '800', color: bus.red }}>{t('bus.planTrip')}</Text>
              </Pressable>
            </View>

            <BusCard>
              <SectionHead icon={CalendarClock} title={t('bus.next.from', { origin: dir.origin })} />
              {next.length === 0 ? (
                <Text style={{ fontSize: z(14), color: bus.inkSoft }}>{t('bus.next.none')}</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: z(8) }}>
                  {next.map((x, i) => (
                    <View key={x.time} style={{ minWidth: z(78), alignItems: 'center', paddingVertical: z(8), paddingHorizontal: z(10), borderRadius: z(14), backgroundColor: i === 0 ? bus.red : bus.soft }}>
                      <Text style={{ fontSize: z(18), fontWeight: '800', color: i === 0 ? '#FFFFFF' : bus.dark }}>{clock(x.time)}</Text>
                      <Text style={{ fontSize: z(11), color: i === 0 ? 'rgba(255,255,255,0.9)' : bus.inkSoft }}>{waitText(x.time - nowMin, t)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </BusCard>

            <BusCard>
              <SectionHead title={t('bus.howOften')} right={ride !== null ? <Text style={{ flexShrink: 1, textAlign: 'right', fontSize: z(12.5), color: bus.inkSoft }}>{t('bus.wholeRoute', { n: Math.round(ride) })}</Text> : undefined} />
              {bands.map((b, i) => (
                <View key={b.id}>
                  {i ? <Divider /> : null}
                  <View style={{ paddingVertical: z(9), gap: z(5) }} accessible accessibilityLabel={`${b.label}. ${b.trips === 0 ? t('bus.noBuses') : b.median === null ? tn('bus.buses', 1) : t('bus.band.every.a11y', { min: b.median, buses: tn('bus.buses', b.trips) })}`}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 1, fontSize: z(13.5), fontWeight: '600', color: bus.ink }}>{b.label}</Text>
                      <Text style={{ fontSize: z(14), fontWeight: '800', color: b.trips ? bus.red : bus.inkSoft }}>{b.trips === 0 ? t('bus.noBuses') : b.median === null ? tn('bus.buses', 1) : t('bus.every', { n: b.median })}</Text>
                    </View>
                    <View style={{ height: z(6), borderRadius: z(3), backgroundColor: bus.soft }}>
                      <View style={{ height: z(6), borderRadius: z(3), width: `${Math.max(b.trips ? 6 : 0, Math.round((b.trips / maxTrips) * 100))}%`, backgroundColor: bus.red }} />
                    </View>
                    {b.trips > 1 && b.min !== null && b.max !== null && b.min !== b.max ? <Text style={{ fontSize: z(11.5), color: bus.inkSoft }}>{t('bus.band.gaps', { buses: tn('bus.buses', b.trips), min: b.min, max: b.max })}</Text> : null}
                  </View>
                </View>
              ))}
            </BusCard>

            <BusCard>
              <SectionHead icon={RouteIcon} title={tn('bus.stops', stops.length)} right={<Text style={{ flexShrink: 1, textAlign: 'right', fontSize: z(12), color: bus.inkSoft }}>{t('bus.minAfterLeaving')}</Text>} />
              {shown.map((s, i) => (
                <Pressable key={`${s}-${i}`} accessibilityRole="button" accessibilityLabel={offsets[i] !== undefined ? t('bus.stopItem.a11y', { name: d.stops.name[s], n: offsets[i] }) : t('bus.stopItem.a11yNoTime', { name: d.stops.name[s] })} onPress={() => router.push({ pathname: '/bus/stop/[id]', params: { id: d.stops.id[s] } })} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'stretch', gap: z(12), opacity: pressed ? 0.85 : 1 }]}>
                  <View style={{ width: z(18), alignItems: 'center' }}>
                    <View style={{ flex: 1, width: 3, backgroundColor: i === 0 ? 'transparent' : bus.red, opacity: 0.35 }} />
                    <View style={{ width: z(i === 0 || i === stops.length - 1 ? 14 : 9), height: z(i === 0 || i === stops.length - 1 ? 14 : 9), borderRadius: z(8), backgroundColor: i === 0 || i === stops.length - 1 ? bus.red : '#FFFFFF', borderWidth: 2, borderColor: bus.red }} />
                    <View style={{ flex: 1, width: 3, backgroundColor: i === stops.length - 1 ? 'transparent' : bus.red, opacity: 0.35 }} />
                  </View>
                  <View style={{ flex: 1, minHeight: z(40), flexDirection: 'row', alignItems: 'center', gap: z(8), paddingVertical: z(4) }}>
                    <Text style={{ flex: 1, fontSize: z(14.5), fontWeight: i === 0 || i === stops.length - 1 ? '800' : '500', color: bus.ink }} numberOfLines={2}>
                      {d.stops.name[s]}
                    </Text>
                    {offsets[i] !== undefined ? <Text style={{ fontSize: z(12.5), color: bus.inkSoft }}>{i === 0 ? t('bus.start') : `+${offsets[i]}`}</Text> : null}
                  </View>
                </Pressable>
              ))}
              {stops.length > SHOWN_STOPS ? (
                <Pressable accessibilityRole="button" onPress={() => setAll((v) => !v)} style={{ alignSelf: 'center', marginTop: z(8), paddingHorizontal: z(16), paddingVertical: z(6), minHeight: 44, borderRadius: z(22), backgroundColor: bus.soft, justifyContent: 'center' }}>
                  <Text style={{ textAlign: 'center', fontSize: z(13.5), fontWeight: '800', color: bus.dark }}>{all ? t('bus.showFewer') : t('bus.showAll', { n: stops.length })}</Text>
                </Pressable>
              ) : null}
            </BusCard>

            <Text style={{ marginHorizontal: 20, fontSize: z(11.5), color: bus.inkSoft }}>
              {t('bus.route.footnote')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Chip({ z, text }: { z: (n: number) => number; text: string }) {
  return (
    <View style={{ height: z(26), paddingHorizontal: z(10), borderRadius: z(13), backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center' }}>
      <Text style={{ fontSize: z(12), fontWeight: '700', color: '#FFFFFF' }}>{text}</Text>
    </View>
  );
}
