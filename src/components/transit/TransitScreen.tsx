import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftRight, Bus, ChevronLeft, Clock, Footprints, Info, Share2, Star, TrainFront } from 'lucide-react-native';
import { Button, Notice, Screen } from '../ui';
import { Hero } from '../home/Hero';
import { useHeroState } from '../home/useHeroClock';
import { useHomeScale } from '../home/scale';
import { Accordion, CARD_LINE, NAVY, RoundButton, SLATE, VIOLET } from '../route/primitives';
import { PlanTimeline } from './PlanTimeline';
import { FareCard, NoteCard, PlanOptions, TransitSummary } from './PlanParts';
import { useReady } from '../../state/useReady';
import { formatDate } from '../../lib/format';
import { corridorLabel } from '../../lib/routeView';
import { useT } from '../../i18n/useT';
import { formatAtParam, formatClockMinutes, isoDate, minutesOfDay, parseAtParam, startOfDay } from '../../lib/transit/format';
import { placeName } from '../../lib/transit/places';
import { createPlanner, planTransit } from '../../lib/transit/planner';
import { transitShareText } from '../../lib/transit/share';
import { useTransit } from '../../lib/transit/transitData';
import { colors } from '../../theme';

/** Journey results for anything that involves a bus stop, or a chosen departure time. */
export function TransitScreen() {
  const { from, to, at, sky } = useLocalSearchParams<{ from?: string; to?: string; at?: string; sky?: string }>();
  const { dataset, network, stationPoints, isFavourite, toggleFavourite, recordRecent } = useReady();
  const insets = useSafeAreaInsets();
  const { z } = useHomeScale();
  const { look, focused, animate } = useHeroState(sky);
  const { t, lang } = useT();
  const bus = useTransit(true);
  const transit = bus.status === 'ready' ? bus.transit : null;

  const [stamp, setStamp] = useState(() => new Date());
  const atMin = parseAtParam(at);
  const nowMin = minutesOfDay(stamp);
  // A time earlier than now means tomorrow at that time.
  const tomorrow = atMin !== null && atMin < nowMin - 5;
  const date = useMemo(() => {
    const d = startOfDay(stamp);
    return tomorrow ? new Date(d.getTime() + 24 * 3_600_000) : d;
  }, [stamp, tomorrow]);
  const departAt = atMin ?? nowMin;

  const ctx = useMemo(() => (transit ? createPlanner({ ix: transit, stations: dataset.stations, corridors: dataset.corridors, timetable: dataset.timetable, stationPoint: (id) => stationPoints.get(id) ?? null }) : null), [transit, dataset, stationPoints]);
  const result = useMemo(() => (ctx && from && to ? planTransit(ctx, { from, to, departAt, date }, isoDate(stamp), t) : null), [ctx, from, to, departAt, date, stamp, t]);
  const [sel, setSel] = useState(0);
  // Earliest arrival first: that is the plan shown by default; fewer-change options follow.
  const plans = useMemo(() => [...(result?.plans ?? [])].sort((a, b) => a.arriveAt - b.arriveAt || a.rides - b.rides), [result]);
  const plan = plans[Math.min(sel, plans.length - 1)];

  // When the first vehicle is a while away, say how late the traveller can leave.
  const ride = plan?.legs.find((l) => l.mode !== 'walk');
  const lead = plan && plan.legs[0].mode === 'walk' ? plan.legs[0].arrive - plan.legs[0].depart : 0;
  const latest = plan && ride && ride.depart - lead - plan.departAt >= 10 ? Math.floor(ride.depart - lead) : null;

  const ok = result?.status === 'ok';
  useEffect(() => {
    if (ok && from && to) recordRecent(from, to).catch(() => undefined);
  }, [ok, from, to, recordRecent]);

  const corridors = useMemo(() => new Map(dataset.corridors.map((c) => [c.id, c])), [dataset]);
  const nameOf = (id: string) => placeName(id, network.stations, transit) ?? (id.startsWith('bus:') ? t('route.transit.busStop') : id);
  const stationName = (id: string) => network.stations.get(id)?.name ?? id;
  const corridorName = (id: string) => {
    const c = corridors.get(id);
    return c ? corridorLabel(c, t) : t('route.line.fallback');
  };
  const fav = from && to ? isFavourite(from, to) : false;
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const setTime = (m: number | null) => {
    setSel(0);
    router.setParams({ at: m === null ? '' : formatAtParam(m) });
  };

  const heroH = insets.top + z(124);
  const hero = (
    <View style={{ height: heroH }}>
      <Hero height={heroH} look={look} animate={animate} mode="arrive" />
      <View style={{ position: 'absolute', top: insets.top + z(8), left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <RoundButton z={z} label={t('common.back')} onPress={goBack}>
          <ChevronLeft size={z(22)} color={NAVY} />
        </RoundButton>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: z(25), fontWeight: '800', color: look.ink, letterSpacing: lang === 'en' ? -0.5 : 0, lineHeight: lang === 'en' ? undefined : z(36) }} accessibilityRole="header" numberOfLines={1}>
            {t('route.title')}
          </Text>
          <Text style={{ fontSize: z(13.5), color: look.inkSoft, lineHeight: lang === 'en' ? undefined : z(20) }} numberOfLines={1}>
            {t('route.transit.subtitle')}
          </Text>
        </View>
        {ok ? (
          <RoundButton z={z} label={fav ? t('route.fav.remove') : t('route.fav.add')} onPress={() => toggleFavourite(from!, to!)}>
            <Star size={z(20)} color={fav ? colors.interchange : VIOLET} fill={fav ? colors.interchange : 'none'} />
          </RoundButton>
        ) : null}
      </View>
    </View>
  );

  let body: React.ReactNode;
  if (bus.status === 'loading' || (bus.status === 'ready' && !result)) {
    body = (
      <View style={{ marginHorizontal: 16 }}>
        <Notice title={t('route.transit.loading.title')}>{t('route.transit.loading.body')}</Notice>
      </View>
    );
  } else if (bus.status === 'error') {
    body = (
      <View style={{ marginHorizontal: 16, gap: 12 }}>
        <Notice tone="warn" title={t('route.transit.error.title')}>
          {t('route.transit.error.body')}
        </Notice>
        <Button label={t('route.transit.backToPlan')} onPress={() => router.replace('/')} />
      </View>
    );
  } else if (result && result.status !== 'ok') {
    body = (
      <View style={{ marginHorizontal: 16, gap: 12 }}>
        <Notice tone="warn" title={result.status === 'expired' ? t('route.transit.expired.title') : t('route.none.title')}>
          {result.notes.join(' ')}
        </Notice>
        <Button label={t('route.transit.chooseOther')} onPress={() => router.replace('/')} />
      </View>
    );
  } else if (result && plan) {
    const valid = transit!.data.meta.source;
    body = (
      <>
        <TransitSummary
          plan={plan}
          fromName={nameOf(from!)}
          toName={nameOf(to!)}
          whenLabel={atMin === null ? t('route.transit.leavingNow') : t(tomorrow ? 'route.transit.departTomorrow' : 'route.transit.departAt', { time: formatAtParam(atMin) })}
          onStep={(d) => setTime((((departAt + d) % 1440) + 1440) % 1440)}
          onNow={() => {
            setStamp(new Date());
            setTime(null);
          }}
          canNow={atMin !== null}
        />
        {result.notes.map((n) => (
          <NoteCard key={n} text={n} tone="info" />
        ))}
        {latest !== null ? <NoteCard tone="info" text={t(ride!.mode === 'bus' ? 'route.transit.firstBus' : 'route.transit.firstTrain', { first: formatClockMinutes(ride!.depart), latest: formatClockMinutes(latest) })} /> : null}
        <PlanOptions plans={plans} selected={Math.min(sel, plans.length - 1)} onSelect={setSel} corridors={corridors} />
        <View style={{ marginHorizontal: 16, borderRadius: z(24), padding: z(14), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE }}>
          <Text style={{ fontSize: z(18), fontWeight: '800', color: NAVY, marginBottom: z(8), marginLeft: z(2) }} accessibilityRole="header">
            {t('route.journey.title')}
          </Text>
          <PlanTimeline plan={plan} fromName={nameOf(from!)} toName={nameOf(to!)} corridors={corridors} stationName={stationName} />
        </View>
        <FareCard plan={plan} />
        <View style={{ marginHorizontal: 16 }}>
          <Accordion icon={Info} tint="#B45309" tintBg="#FEF3C7" title={t('route.details.good.title')} subtitle={t('route.transit.good.subtitle')}>
            {plan.warnings.map((w) => (
              <Row key={w} z={z} Icon={Clock}>
                {w}
              </Row>
            ))}
            <Row z={z} Icon={Bus}>
              {t('route.transit.good.bus', { from: formatDate(valid.validFrom, lang), to: formatDate(valid.validTo, lang) })}
            </Row>
            <Row z={z} Icon={TrainFront}>
              {t('route.transit.good.metro')}
            </Row>
            <Row z={z} Icon={Footprints}>
              {t('route.transit.good.walk')}
            </Row>
          </Accordion>
        </View>
      </>
    );
  } else {
    body = null;
  }

  const share = () => {
    if (!plan || !from || !to) return;
    Share.share({ message: transitShareText(plan, nameOf(from), nameOf(to), corridorName, stationName, t) }).catch(() => undefined);
  };

  return (
    <Screen edges={[]}>
      {focused ? <StatusBar style={look.statusBar} /> : null}
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + z(104) }} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          {hero}
          <View style={{ gap: z(14), marginTop: z(-14) }}>{body}</View>
        </View>
      </ScrollView>
      {plan ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 10, paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 10), backgroundColor: 'rgba(247,247,255,0.94)', borderTopWidth: 1, borderTopColor: CARD_LINE }}>
          <View style={{ flexDirection: 'row', gap: z(10), maxWidth: 560, width: '100%', alignSelf: 'center', alignItems: 'center' }}>
            <RoundButton z={z} size={52} label={t('route.action.reverse')} onPress={() => router.replace({ pathname: '/route', params: { from: to!, to: from!, mode: 'transit', ...(atMin !== null ? { at: formatAtParam(atMin) } : {}) } })}>
              <ArrowLeftRight size={z(21)} color={VIOLET} />
            </RoundButton>
            <RoundButton z={z} size={52} label={t('route.action.share')} onPress={share}>
              <Share2 size={z(20)} color={VIOLET} />
            </RoundButton>
            <Pressable accessibilityRole="button" accessibilityLabel={t('route.transit.planNow.a11y')} onPress={() => { setStamp(new Date()); setTime(null); }} style={({ pressed }) => [{ flex: 1, minHeight: z(52), paddingHorizontal: z(10), paddingVertical: z(6), borderRadius: z(26), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: VIOLET, opacity: pressed ? 0.9 : 1 }]}>
              <Clock size={z(19)} color="#FFFFFF" />
              <Text style={{ fontSize: z(15.5), fontWeight: '800', color: '#FFFFFF', flexShrink: 1, textAlign: 'center' }}>{t('route.transit.planNow')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function Row({ z, Icon, children }: { z: (n: number) => number; Icon: typeof Info; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: z(12) }}>
      <View style={{ width: z(32), height: z(32), borderRadius: z(10), backgroundColor: '#F4F3FF', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={z(16)} color={VIOLET} strokeWidth={2} />
      </View>
      <Text style={{ flex: 1, fontSize: z(12.5), color: SLATE }}>{children}</Text>
    </View>
  );
}
