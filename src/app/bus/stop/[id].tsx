import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ChevronRight, CornerUpRight, Footprints, TrainFront } from 'lucide-react-native';
import { Button, Notice, Screen } from '../../../components/ui';
import { BusCard, BusTopBar, Divider, ListRow, RouteBadge, ScheduledTag, SectionHead } from '../../../components/bus/BusUi';
import { useNow } from '../../../components/bus/useNow';
import { useHomeScale } from '../../../components/home/scale';
import { useReady } from '../../../state/useReady';
import { departuresAt, groupDepartures, waitText } from '../../../lib/transit/departures';
import { agencyLabel, dayOffset, formatClockMinutes, isoDate, minutesOfDay } from '../../../lib/transit/format';
import { buildRouteIndex } from '../../../lib/transit/routeIndex';
import { agenciesOf, routesAtStop } from '../../../lib/transit/transitIndex';
import { feedExpired, useTransit } from '../../../lib/transit/transitData';
import { busStopId } from '../../../lib/transit/types';
import { useT } from '../../../i18n/useT';
import { bus } from '../../../theme/bus';

const clock = (m: number) => `${formatClockMinutes(m)}${dayOffset(m) > 0 ? ' +1' : ''}`;

export default function BusStopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const state = useTransit(true);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/bus'));
  if (state.status !== 'ready') {
    return (
      <Screen edges={[]}>
        <BusTopBar title={state.status === 'error' ? t('bus.unavailable.title') : t('bus.loading.stop')} onBack={goBack} />
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
  return <Stop id={id} transit={state.transit} goBack={goBack} />;
}

function Stop({ id, transit, goBack }: { id: string | undefined; transit: import('../../../lib/transit/transitIndex').TransitIndex; goBack: () => void }) {
  const { network } = useReady();
  const insets = useSafeAreaInsets();
  const { z } = useHomeScale();
  const { t, tn } = useT();
  const now = useNow();
  const stop = id ? transit.stopByGtfs.get(id) : undefined;
  const ri = useMemo(() => buildRouteIndex(transit), [transit]);

  const nowMin = minutesOfDay(now);
  const groups = useMemo(() => (stop === undefined ? [] : groupDepartures(departuresAt(transit, stop, nowMin, 60))), [transit, stop, nowMin]);

  if (stop === undefined) {
    return (
      <Screen edges={[]}>
        <BusTopBar title={t('bus.stop.notFound')} onBack={goBack} />
        <View style={{ padding: 16, gap: 16 }}>
          <Notice tone="warn" title={t('bus.stop.notFound')}>
            {t('bus.stop.notInData')}
          </Notice>
          <Button label={t('bus.backToBuses')} onPress={() => router.replace('/bus')} />
        </View>
      </Screen>
    );
  }

  const d = transit.data;
  const name = d.stops.name[stop];
  const agencies = agenciesOf(d, stop);
  // one badge per route number (a number can have several variants; the board above lists each direction)
  const byShort = new Map<string, (typeof ri.routes)[number]>();
  for (const r of routesAtStop(transit, stop).map((i) => ri.routes[i]).sort((a, b) => a.index - b.index)) if (!byShort.has(`${r.agency}|${r.short}`)) byShort.set(`${r.agency}|${r.short}`, r);
  const routes = [...byShort.values()].sort((a, b) => a.short.localeCompare(b.short, undefined, { numeric: true }));
  const metro = transit.stopStations.get(stop) ?? [];
  const expired = feedExpired(transit, isoDate(now));
  const place = busStopId(d.stops.id[stop]);

  return (
    <Screen edges={[]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + z(32) }} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <BusTopBar title={name} subtitle={t('bus.stop.subtitle', { agencies: agencies.map((a) => agencyLabel(a, t)).join(', ') })} onBack={goBack}>
            <View style={{ flexDirection: 'row', marginTop: z(12) }}>
              <ScheduledTag light />
            </View>
          </BusTopBar>

          <View style={{ gap: z(14), marginTop: z(14) }}>
            {expired ? (
              <View style={{ marginHorizontal: 16 }}>
                <Notice tone="warn" title={t('bus.expired.title')}>
                  {t('bus.expired.body', { date: transit.data.meta.source.validTo })}
                </Notice>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: z(10), marginHorizontal: 16 }}>
              <Action z={z} label={t('bus.planFrom')} onPress={() => router.navigate({ pathname: '/', params: { from: place } })} primary />
              <Action z={z} label={t('bus.planTo')} onPress={() => router.navigate({ pathname: '/', params: { to: place } })} />
            </View>

            <BusCard>
              <SectionHead title={t('bus.stop.next')} />
              {groups.length === 0 ? (
                <Text style={{ fontSize: z(14), color: bus.inkSoft }}>{t('bus.stop.noDepartures')}</Text>
              ) : (
                groups.slice(0, 8).map((g, i) => {
                  const first = g.times[0];
                  return (
                    <View key={`${g.route}-${g.headsign}`}>
                      {i ? <Divider /> : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t(g.times.length > 1 ? 'bus.dep.a11yThen' : 'bus.dep.a11y', {
                          agency: agencyLabel(g.agency, t),
                          short: g.short,
                          towards: t('bus.towards.a11y', { place: g.headsign }),
                          time: clock(first),
                          more: g.times.slice(1, 3).map(clock).join(', '),
                        })}
                        onPress={() => router.push({ pathname: '/bus/route/[id]', params: { id: String(g.route) } })}
                        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: z(12), paddingVertical: z(11), opacity: pressed ? 0.85 : 1 }]}
                      >
                        <RouteBadge agency={g.agency} short={g.short} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(4) }}>
                            <ArrowRight size={z(13)} color={bus.inkSoft} />
                            <Text style={{ flex: 1, fontSize: z(14.5), fontWeight: '700', color: bus.ink }} numberOfLines={1}>
                              {g.headsign}
                            </Text>
                          </View>
                          <Text style={{ fontSize: z(12.5), color: bus.inkSoft, marginTop: 2 }} numberOfLines={2}>
                            {g.times.length > 1 ? t('bus.dep.then', { times: g.times.slice(1, 4).map(clock).join(' · ') }) : t('bus.dep.last')}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: z(17), fontWeight: '800', color: bus.red }}>{clock(first)}</Text>
                          <Text style={{ fontSize: z(11.5), color: bus.inkSoft }}>{waitText(first - nowMin, t)}</Text>
                        </View>
                      </Pressable>
                    </View>
                  );
                })
              )}
              {groups.length > 8 ? <Text style={{ fontSize: z(12), color: bus.inkSoft, marginTop: z(6) }}>{tn('bus.stop.moreRoutes', groups.length - 8)}</Text> : null}
            </BusCard>

            {metro.length > 0 ? (
              <BusCard>
                <SectionHead icon={TrainFront} title={t('bus.metro.title')} />
                {metro.slice(0, 3).map((m, i) => (
                  <View key={m.station}>
                    {i ? <Divider /> : null}
                    <ListRow
                      label={t('bus.metro.a11y', { name: network.stations.get(m.station)?.name ?? m.station, m: Math.round(m.m / 10) * 10 })}
                      title={network.stations.get(m.station)?.name ?? m.station}
                      sub={t(m.named ? 'bus.metro.subNamed' : 'bus.metro.sub', { m: Math.round(m.m / 10) * 10 })}
                      lead={<Footprints size={z(20)} color={bus.red} />}
                      trail={<ChevronRight size={z(20)} color={bus.red} />}
                      onPress={() => router.push({ pathname: '/station/[id]', params: { id: m.station } })}
                    />
                  </View>
                ))}
              </BusCard>
            ) : null}

            <BusCard>
              <SectionHead title={tn('bus.routesHere', routes.length)} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: z(8) }}>
                {routes.map((r) => (
                  <Pressable key={r.index} accessibilityRole="button" hitSlop={6} accessibilityLabel={t('bus.routeChip.a11y', { short: r.short })} onPress={() => router.push({ pathname: '/bus/route/[id]', params: { id: String(r.index) } })}>
                    <RouteBadge agency={r.agency} short={r.short} />
                  </Pressable>
                ))}
              </View>
            </BusCard>

            <Text style={{ marginHorizontal: 20, fontSize: z(11.5), color: bus.inkSoft }}>
              {t('bus.stop.footnote')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Action({ z, label, onPress, primary }: { z: (n: number) => number; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [{ flex: 1, minHeight: z(48), paddingVertical: z(6), paddingHorizontal: z(8), borderRadius: z(24), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(7), backgroundColor: primary ? bus.red : '#FFFFFF', borderWidth: primary ? 0 : 1.5, borderColor: bus.red, opacity: pressed ? 0.88 : 1 }]}
    >
      <CornerUpRight size={z(18)} color={primary ? '#FFFFFF' : bus.red} strokeWidth={2.2} />
      <Text style={{ flexShrink: 1, textAlign: 'center', fontSize: z(15), fontWeight: '800', color: primary ? '#FFFFFF' : bus.red }}>{label}</Text>
    </Pressable>
  );
}

