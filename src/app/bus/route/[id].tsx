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
import { departuresAt } from '../../../lib/transit/departures';
import { AGENCY_LOOK, dayOffset, formatClockMinutes, isoDate, minutesOfDay } from '../../../lib/transit/format';
import { buildRouteIndex, headwayBands, typicalOffsets } from '../../../lib/transit/routeIndex';
import { feedExpired, useTransit } from '../../../lib/transit/transitData';
import type { TransitIndex } from '../../../lib/transit/transitIndex';
import { busStopId } from '../../../lib/transit/types';
import { bus } from '../../../theme/bus';

const clock = (m: number) => `${formatClockMinutes(m)}${dayOffset(m) > 0 ? ' +1' : ''}`;
const SHOWN_STOPS = 8;

export default function BusRouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useTransit(true);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/bus'));
  if (state.status !== 'ready') {
    return (
      <Screen edges={[]}>
        <BusTopBar title={state.status === 'error' ? 'Bus data not available' : 'Loading route…'} onBack={goBack} />
        {state.status === 'error' ? (
          <View style={{ padding: 16 }}>
            <Notice tone="warn" title="Could not load bus data">
              The metro screens still work. Restart the app and try again.
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
  const now = useNow();
  const ri = useMemo(() => buildRouteIndex(transit), [transit]);
  const index = id !== undefined && /^\d+$/.test(id) ? Number(id) : -1;
  const r = ri.routes[index];
  const [dirIx, setDirIx] = useState(0);
  const [all, setAll] = useState(false);

  if (!r || r.dirs.length === 0) {
    return (
      <Screen edges={[]}>
        <BusTopBar title={r ? `${r.short}` : 'Route not found'} subtitle={r?.long} onBack={goBack} />
        <View style={{ padding: 16, gap: 16 }}>
          <Notice tone="warn" title={r ? 'No scheduled trips' : 'Route not found'}>
            {r ? 'The timetable feed lists this route but has no trips for it, so there is nothing to show.' : 'This route is not in the offline bus data.'}
          </Notice>
          <Button label="Back to buses" onPress={() => router.replace('/bus')} />
        </View>
      </Screen>
    );
  }

  const d = transit.data;
  const look = AGENCY_LOOK[r.agency];
  const dir = r.dirs[Math.min(dirIx, r.dirs.length - 1)];
  const stops = d.patterns.stops[dir.pattern];
  const offsets = typicalOffsets(transit, dir.pattern);
  const bands = headwayBands(transit, dir.pattern);
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
          <BusTopBar title={`${look.label} ${r.short}`} subtitle={r.long} onBack={goBack}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: z(8), marginTop: z(12) }}>
              <ScheduledTag light />
              <Chip z={z} text={`${r.trips} trips a day`} />
              {r.first !== null && r.last !== null ? <Chip z={z} text={`${clock(r.first)} – ${clock(r.last)}`} /> : null}
            </View>
          </BusTopBar>

          <View style={{ gap: z(14), marginTop: z(14) }}>
            {expired ? (
              <View style={{ marginHorizontal: 16 }}>
                <Notice tone="warn" title="Timetable may be out of date">
                  The bus timetable in the app ended on {d.meta.source.validTo}. Times below may no longer be right.
                </Notice>
              </View>
            ) : null}

            {r.dirs.length > 1 ? (
              <View style={{ flexDirection: 'row', marginHorizontal: 16, padding: 3, borderRadius: z(24), backgroundColor: bus.soft, gap: 3 }} accessibilityRole="tablist">
                {r.dirs.map((x, i) => (
                  <Pressable key={x.dir} accessibilityRole="tab" accessibilityState={{ selected: i === dirIx }} accessibilityLabel={`Towards ${x.headsign}`} onPress={() => setDirIx(i)} style={{ flex: 1, minHeight: z(44), borderRadius: z(21), paddingHorizontal: z(10), alignItems: 'center', justifyContent: 'center', backgroundColor: i === dirIx ? bus.red : 'transparent' }}>
                    <Text style={{ fontSize: z(10.5), color: i === dirIx ? 'rgba(255,255,255,0.85)' : bus.inkSoft }}>Towards</Text>
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
              <Pressable accessibilityRole="button" accessibilityLabel="Show this route on the map" onPress={() => router.navigate({ pathname: '/map', params: { route: r.id } })} style={({ pressed }) => [{ flex: 1, height: z(48), borderRadius: z(24), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(7), backgroundColor: bus.red, opacity: pressed ? 0.88 : 1 }]}>
                <MapIcon size={z(18)} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={{ fontSize: z(15), fontWeight: '800', color: '#FFFFFF' }}>Show on map</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Plan a trip from ${dir.origin}`} onPress={() => router.navigate({ pathname: '/', params: { from: busStopId(d.stops.id[stops[0]]) } })} style={({ pressed }) => [{ flex: 1, height: z(48), borderRadius: z(24), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(7), backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: bus.red, opacity: pressed ? 0.88 : 1 }]}>
                <Repeat size={z(18)} color={bus.red} strokeWidth={2.2} />
                <Text style={{ fontSize: z(15), fontWeight: '800', color: bus.red }}>Plan a trip</Text>
              </Pressable>
            </View>

            <BusCard>
              <SectionHead icon={CalendarClock} title={`Next from ${dir.origin}`} />
              {next.length === 0 ? (
                <Text style={{ fontSize: z(14), color: bus.inkSoft }}>No more scheduled departures in the next 24 hours.</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: z(8) }}>
                  {next.map((x, i) => (
                    <View key={x.time} style={{ minWidth: z(78), alignItems: 'center', paddingVertical: z(8), paddingHorizontal: z(10), borderRadius: z(14), backgroundColor: i === 0 ? bus.red : bus.soft }}>
                      <Text style={{ fontSize: z(18), fontWeight: '800', color: i === 0 ? '#FFFFFF' : bus.dark }}>{clock(x.time)}</Text>
                      <Text style={{ fontSize: z(11), color: i === 0 ? 'rgba(255,255,255,0.9)' : bus.inkSoft }}>{Math.max(0, Math.round(x.time - nowMin)) <= 0 ? 'now' : Math.round(x.time - nowMin) < 90 ? `in ${Math.round(x.time - nowMin)} min` : 'later'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </BusCard>

            <BusCard>
              <SectionHead title="How often" right={ride !== null ? <Text style={{ fontSize: z(12.5), color: bus.inkSoft }}>Whole route ≈ {Math.round(ride)} min</Text> : undefined} />
              {bands.map((b, i) => (
                <View key={b.label}>
                  {i ? <Divider /> : null}
                  <View style={{ paddingVertical: z(9), gap: z(5) }} accessible accessibilityLabel={`${b.label}. ${b.trips === 0 ? 'No buses' : b.median === null ? 'One bus' : `About every ${b.median} minutes, ${b.trips} buses`}`}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 1, fontSize: z(13.5), fontWeight: '600', color: bus.ink }}>{b.label}</Text>
                      <Text style={{ fontSize: z(14), fontWeight: '800', color: b.trips ? bus.red : bus.inkSoft }}>{b.trips === 0 ? 'No buses' : b.median === null ? '1 bus' : `every ~${b.median} min`}</Text>
                    </View>
                    <View style={{ height: z(6), borderRadius: z(3), backgroundColor: bus.soft }}>
                      <View style={{ height: z(6), borderRadius: z(3), width: `${Math.max(b.trips ? 6 : 0, Math.round((b.trips / maxTrips) * 100))}%`, backgroundColor: bus.red }} />
                    </View>
                    {b.trips > 1 && b.min !== null && b.max !== null && b.min !== b.max ? <Text style={{ fontSize: z(11.5), color: bus.inkSoft }}>{b.trips} buses · gaps {b.min}–{b.max} min</Text> : null}
                  </View>
                </View>
              ))}
            </BusCard>

            <BusCard>
              <SectionHead icon={RouteIcon} title={`${stops.length} stops`} right={<Text style={{ fontSize: z(12), color: bus.inkSoft }}>min after leaving</Text>} />
              {shown.map((s, i) => (
                <Pressable key={`${s}-${i}`} accessibilityRole="button" accessibilityLabel={`${d.stops.name[s]}${offsets[i] !== undefined ? `, about ${offsets[i]} minutes after leaving` : ''}. Open stop`} onPress={() => router.push({ pathname: '/bus/stop/[id]', params: { id: d.stops.id[s] } })} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'stretch', gap: z(12), opacity: pressed ? 0.85 : 1 }]}>
                  <View style={{ width: z(18), alignItems: 'center' }}>
                    <View style={{ flex: 1, width: 3, backgroundColor: i === 0 ? 'transparent' : bus.red, opacity: 0.35 }} />
                    <View style={{ width: z(i === 0 || i === stops.length - 1 ? 14 : 9), height: z(i === 0 || i === stops.length - 1 ? 14 : 9), borderRadius: z(8), backgroundColor: i === 0 || i === stops.length - 1 ? bus.red : '#FFFFFF', borderWidth: 2, borderColor: bus.red }} />
                    <View style={{ flex: 1, width: 3, backgroundColor: i === stops.length - 1 ? 'transparent' : bus.red, opacity: 0.35 }} />
                  </View>
                  <View style={{ flex: 1, minHeight: z(40), flexDirection: 'row', alignItems: 'center', gap: z(8), paddingVertical: z(4) }}>
                    <Text style={{ flex: 1, fontSize: z(14.5), fontWeight: i === 0 || i === stops.length - 1 ? '800' : '500', color: bus.ink }} numberOfLines={2}>
                      {d.stops.name[s]}
                    </Text>
                    {offsets[i] !== undefined ? <Text style={{ fontSize: z(12.5), color: bus.inkSoft }}>{i === 0 ? 'start' : `+${offsets[i]}`}</Text> : null}
                  </View>
                </Pressable>
              ))}
              {stops.length > SHOWN_STOPS ? (
                <Pressable accessibilityRole="button" onPress={() => setAll((v) => !v)} style={{ alignSelf: 'center', marginTop: z(8), paddingHorizontal: z(16), height: z(38), borderRadius: z(19), backgroundColor: bus.soft, justifyContent: 'center' }}>
                  <Text style={{ fontSize: z(13.5), fontWeight: '800', color: bus.dark }}>{all ? 'Show fewer stops' : `Show all ${stops.length} stops`}</Text>
                </Pressable>
              ) : null}
            </BusCard>

            <Text style={{ marginHorizontal: 20, fontSize: z(11.5), color: bus.inkSoft }}>
              Times are the published timetable (unofficial feed), not live positions. Minutes after leaving are the scheduled run of a typical trip.
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
