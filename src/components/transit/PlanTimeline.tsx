import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowRight, Bus, ChevronDown, ChevronUp, Flag, Footprints, MapPin, Repeat, TrainFront } from 'lucide-react-native';
import { useHomeScale } from '../home/scale';
import { NAVY, SLATE, VIOLET } from '../route/primitives';
import { AGENCY_LOOK, agencyFull, dayOffset, formatClockMinutes, formatSpan } from '../../lib/transit/format';
import { corridorLabel } from '../../lib/routeView';
import { useT } from '../../i18n/useT';
import type { BusLeg, MetroLeg, TransitLeg, TransitPlan, WalkLeg } from '../../lib/transit/planner';
import type { Corridor } from '../../types';

const GREY = '#B8BED6';

interface Props {
  plan: TransitPlan;
  fromName: string;
  toName: string;
  corridors: Map<string, Corridor>;
  stationName: (id: string) => string;
}

const time = (m: number) => formatClockMinutes(m);
const plusDay = (m: number) => (dayOffset(m) > 0 ? ' +1' : '');

/** A vertical journey: start, then walk / bus / metro legs, then arrival. Bus = scheduled, metro and walking = estimates. */
export function PlanTimeline({ plan, fromName, toName, corridors, stationName }: Props) {
  const { z } = useHomeScale();
  const { t } = useT();
  const first = plan.legs[0];
  return (
    <View>
      <Node z={z} kind="start" bottomColor={colorOf(first, corridors)} title={fromName} sub={t('route.transit.leaveAt', { time: `${time(plan.departAt)}${plusDay(plan.departAt)}` })} />
      {plan.legs.map((leg, i) => (
        <Block key={i} z={z} leg={leg} corridors={corridors} stationName={stationName} />
      ))}
      <Node z={z} kind="end" topColor={colorOf(plan.legs[plan.legs.length - 1], corridors)} title={toName} sub={t('route.transit.arriveAt', { time: `${time(plan.arriveAt)}${plusDay(plan.arriveAt)}` })} />
    </View>
  );
}

function colorOf(leg: TransitLeg, corridors: Map<string, Corridor>): string {
  if (leg.mode === 'walk') return GREY;
  if (leg.mode === 'bus') return AGENCY_LOOK[leg.agency].color;
  return corridors.get(leg.corridorId)?.color ?? VIOLET;
}

function Rail({ z, color, dashed, children, pad = 0 }: { z: (n: number) => number; color: string; dashed?: boolean; children: React.ReactNode; pad?: number }) {
  const w = z(34);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
      <View style={{ width: w, alignItems: 'center' }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, width: dashed ? 0 : z(5), left: (w - z(5)) / 2, borderRadius: z(3), backgroundColor: dashed ? 'transparent' : color, borderLeftWidth: dashed ? z(3) : 0, borderStyle: 'dashed', borderColor: color }} />
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingVertical: pad }}>{children}</View>
    </View>
  );
}

function Node({ z, kind, title, sub, topColor, bottomColor }: { z: (n: number) => number; kind: 'start' | 'end'; title: string; sub: string; topColor?: string; bottomColor?: string }) {
  const { t } = useT();
  const w = z(34);
  const ring = kind === 'start' ? '#4F35E8' : '#E5484D';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', minHeight: z(54) }} accessible accessibilityLabel={t(kind === 'start' ? 'route.transit.start.a11y' : 'route.transit.end.a11y', { title, sub })}>
      <View style={{ width: w, alignItems: 'center', justifyContent: 'center' }}>
        {topColor ? <View style={{ position: 'absolute', top: 0, height: '50%', width: z(5), left: (w - z(5)) / 2, backgroundColor: topColor, borderRadius: z(3) }} /> : null}
        {bottomColor ? <View style={{ position: 'absolute', bottom: 0, height: '50%', width: z(5), left: (w - z(5)) / 2, backgroundColor: bottomColor, borderRadius: z(3) }} /> : null}
        <View style={{ width: z(24), height: z(24), borderRadius: z(12), backgroundColor: '#FFFFFF', borderWidth: z(5), borderColor: ring }} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: z(6) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6) }}>
          {kind === 'start' ? <Flag size={z(14)} color={ring} strokeWidth={2.2} /> : <MapPin size={z(14)} color={ring} strokeWidth={2.2} />}
          <Text style={{ fontSize: z(17), fontWeight: '800', color: NAVY, flexShrink: 1 }} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Text style={{ fontSize: z(12.5), color: SLATE, marginTop: 1 }}>{sub}</Text>
      </View>
    </View>
  );
}

function Block({ z, leg, corridors, stationName }: { z: (n: number) => number; leg: TransitLeg; corridors: Map<string, Corridor>; stationName: (id: string) => string }) {
  if (leg.mode === 'walk') return <WalkRow z={z} leg={leg} />;
  if (leg.mode === 'bus') return <BusCard z={z} leg={leg} />;
  return <MetroCard z={z} leg={leg} corridor={corridors.get(leg.corridorId)} stationName={stationName} />;
}

const MARK = '\u0001';

function WalkRow({ z, leg }: { z: (n: number) => number; leg: WalkLeg }) {
  const { t } = useT();
  const min = Math.max(1, Math.round(leg.arrive - leg.depart));
  // The duration is bold; the sentence around it comes from the translation.
  const [before, after] = t('route.transit.walk.text', { duration: MARK, dist: t('route.m', { n: Math.round(leg.meters) }), place: leg.to.name }).split(MARK);
  return (
    <Rail z={z} color={GREY} dashed pad={z(6)}>
      <View accessible accessibilityLabel={t('route.transit.walk.a11y', { minutes: min, meters: Math.round(leg.meters), place: leg.to.name })} style={{ flexDirection: 'row', alignItems: 'center', gap: z(8), minHeight: z(30) }}>
        <View style={{ width: z(28), height: z(28), borderRadius: z(14), backgroundColor: '#EEF1F6', alignItems: 'center', justifyContent: 'center' }}>
          <Footprints size={z(15)} color="#475569" strokeWidth={2} />
        </View>
        <Text style={{ flex: 1, fontSize: z(13), color: '#475569' }}>
          {before}
          <Text style={{ fontWeight: '800', color: NAVY }}>{t('route.min', { n: min })}</Text>
          {after}
        </Text>
        <Text style={{ fontSize: z(11), color: SLATE }}>{t('route.transit.approx')}</Text>
      </View>
    </Rail>
  );
}

function BusCard({ z, leg }: { z: (n: number) => number; leg: BusLeg }) {
  const { t, tn } = useT();
  const [open, setOpen] = useState(false);
  const look = AGENCY_LOOK[leg.agency];
  return (
    <Rail z={z} color={look.color} pad={z(6)}>
      <View accessible={false} style={{ borderRadius: z(18), borderWidth: 1.5, borderColor: look.color, backgroundColor: '#FFFFFF', padding: z(12), gap: z(10) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
          <View style={{ minWidth: z(44), height: z(34), paddingHorizontal: z(9), borderRadius: z(10), backgroundColor: look.color, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: z(5) }}>
            <Bus size={z(15)} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={{ fontSize: z(15), fontWeight: '800', color: '#FFFFFF' }}>{leg.routeShort}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: z(13.5), fontWeight: '800', color: NAVY }} numberOfLines={1}>
              {agencyFull(leg.agency, t)}
            </Text>
            <Text style={{ fontSize: z(12.5), color: SLATE }} numberOfLines={2}>
              {t('route.transit.towards', { name: leg.headsign })}
            </Text>
          </View>
        </View>

        <Stop z={z} color={look.color} name={leg.from.name} at={leg.depart} label={t('route.transit.board')} />
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={t(open ? 'route.transit.bus.hideStops' : 'route.transit.bus.showStops', { stops: tn('route.stops', leg.stops), minutes: Math.round(leg.arrive - leg.depart) })} onPress={() => setOpen((o) => !o)} disabled={leg.via.length === 0} style={{ flexDirection: 'row', alignItems: 'center', gap: z(8), paddingLeft: z(20) }}>
          <Text style={{ fontSize: z(12.5), color: '#46508C', fontWeight: '600' }}>
            {tn('route.stops', leg.stops)} · {formatSpan(leg.arrive - leg.depart, t)}
          </Text>
          {leg.via.length > 0 ? open ? <ChevronUp size={z(15)} color={VIOLET} /> : <ChevronDown size={z(15)} color={VIOLET} /> : null}
        </Pressable>
        {open ? (
          <View style={{ paddingLeft: z(20), gap: z(3) }}>
            {leg.via.map((n, i) => (
              <Text key={i} style={{ fontSize: z(12.5), color: SLATE }} numberOfLines={1}>
                · {n}
              </Text>
            ))}
          </View>
        ) : null}
        <Stop z={z} color={look.color} name={leg.to.name} at={leg.arrive} label={t('route.transit.getOff')} />

        <View style={{ borderTopWidth: 1, borderTopColor: '#EEF0F8', paddingTop: z(8), gap: z(6) }}>
          <Text style={{ fontSize: z(12.5), color: NAVY }}>
            <Text style={{ fontWeight: '700' }}>{leg.waitMinutes < 1 ? t('route.transit.wait.under') : t('route.transit.wait.about', { n: Math.round(leg.waitMinutes) })}</Text> · {t('route.transit.scheduledNotLive')}
          </Text>
          {leg.nextDepartures.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), flexWrap: 'wrap' }}>
              <Text style={{ fontSize: z(12), color: SLATE }}>{t('route.transit.then')}</Text>
              {leg.nextDepartures.map((dep) => (
                <View key={dep} style={{ paddingHorizontal: z(8), minHeight: z(22), borderRadius: z(11), backgroundColor: look.soft, justifyContent: 'center' }}>
                  <Text style={{ fontSize: z(11.5), fontWeight: '700', color: look.color }}>
                    {time(dep)}
                    {plusDay(dep)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={{ fontSize: z(12.5), color: leg.fare ? NAVY : SLATE }}>
            {leg.fare ? t('route.transit.bus.fare', { adult: leg.fare.adult, child: leg.fare.child }) : t('route.transit.fare.none')}
          </Text>
        </View>
      </View>
    </Rail>
  );
}

function MetroCard({ z, leg, corridor, stationName }: { z: (n: number) => number; leg: MetroLeg; corridor?: Corridor; stationName: (id: string) => string }) {
  const { t, tn } = useT();
  const color = corridor?.color ?? VIOLET;
  const line = corridorLabel(corridor, t);
  return (
    <Rail z={z} color={color} pad={z(6)}>
      <View accessible={false} style={{ borderRadius: z(18), borderWidth: 1.5, borderColor: color, backgroundColor: '#FFFFFF', padding: z(12), gap: z(10) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
          <View style={{ minWidth: z(44), height: z(34), paddingHorizontal: z(9), borderRadius: z(10), backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: z(5) }}>
            <TrainFront size={z(15)} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={{ fontSize: z(13), fontWeight: '800', color: '#FFFFFF' }}>{t('route.line.metro')}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: z(13.5), fontWeight: '800', color: NAVY }} numberOfLines={1}>
              {line}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(4) }}>
              <ArrowRight size={z(12)} color={SLATE} />
              <Text style={{ fontSize: z(12.5), color: SLATE, flexShrink: 1 }} numberOfLines={1}>
                {t('route.transit.towards', { name: stationName(leg.towardsId) })}
              </Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: z(8), minHeight: z(22), borderRadius: z(11), backgroundColor: '#FFF4E5', justifyContent: 'center' }}>
            <Text style={{ fontSize: z(10.5), fontWeight: '800', color: '#B54708' }}>{t('route.transit.metro.estimated')}</Text>
          </View>
        </View>
        <Stop z={z} color={color} name={leg.from.name} at={leg.depart} label={t('route.transit.board')} approx />
        <Text style={{ fontSize: z(12.5), color: '#46508C', fontWeight: '600', paddingLeft: z(20) }}>
          {tn('route.stops', leg.stops)} · {formatSpan(leg.arrive - leg.depart, t)}
        </Text>
        <Stop z={z} color={color} name={leg.to.name} at={leg.arrive} label={t('route.transit.getOff')} approx />
        <View style={{ borderTopWidth: 1, borderTopColor: '#EEF0F8', paddingTop: z(8), gap: z(4) }}>
          <Text style={{ fontSize: z(12.5), color: NAVY }}>
            {leg.firstTrain ? <Text style={{ fontWeight: '700' }}>{t('route.transit.metro.firstWait')}</Text> : <Text style={{ fontWeight: '700' }}>{t('route.transit.wait.about', { n: Math.round(leg.waitMinutes) })}</Text>}
            {leg.headwayMinutes ? ` · ${t('route.transit.metro.trainsEvery', { n: leg.headwayMinutes })}` : ''}
          </Text>
          {leg.changeAssumed ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6) }}>
              <Repeat size={z(13)} color="#B54708" />
              <Text style={{ fontSize: z(12), color: '#7A3B06', flex: 1 }}>{t('route.transit.metro.change')}</Text>
            </View>
          ) : null}
          <Text style={{ fontSize: z(12), color: SLATE }}>{t('route.transit.metro.note')}</Text>
        </View>
      </View>
    </Rail>
  );
}

function Stop({ z, color, name, at, label, approx }: { z: (n: number) => number; color: string; name: string; at: number; label: string; approx?: boolean }) {
  const { t, lang } = useT();
  return (
    <View accessible accessibilityLabel={t(approx ? 'route.transit.stop.a11yApprox' : 'route.transit.stop.a11y', { label, name, time: time(at) })} style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
      <View style={{ width: z(10), height: z(10), borderRadius: z(5), backgroundColor: color }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: z(11), fontWeight: '800', color: SLATE, letterSpacing: lang === 'en' ? 0.6 : 0 }}>{label.toUpperCase()}</Text>
        <Text style={{ fontSize: z(15), fontWeight: '700', color: NAVY }} numberOfLines={2}>
          {name}
        </Text>
      </View>
      <Text style={{ fontSize: z(15.5), fontWeight: '800', color: NAVY }}>
        {approx ? '~' : ''}
        {time(at)}
        <Text style={{ fontSize: z(11), color: SLATE }}>{plusDay(at)}</Text>
      </Text>
    </View>
  );
}

export { Rail };
