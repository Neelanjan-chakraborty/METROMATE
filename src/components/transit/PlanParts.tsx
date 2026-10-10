import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Bus, ChevronLeft, ChevronRight, Clock, Footprints, Repeat, Ticket, TrainFront, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { useHomeScale } from '../home/scale';
import { CARD_LINE, NAVY, SLATE, VIOLET, cardShadow } from '../route/primitives';
import { AGENCY_LOOK, dayOffset, formatClockMinutes, formatSpan } from '../../lib/transit/format';
import { useT } from '../../i18n/useT';
import type { T } from '../../i18n/translate';
import type { TransitPlan } from '../../lib/transit/planner';
import type { Corridor } from '../../types';

const time = (m: number) => `${formatClockMinutes(m)}${dayOffset(m) > 0 ? ' +1' : ''}`;

// ---------------------------------------------------------------- summary

export function TransitSummary({ plan, fromName, toName, whenLabel, onStep, onNow, canNow }: { plan: TransitPlan; fromName: string; toName: string; whenLabel: string; onStep: (d: number) => void; onNow: () => void; canNow: boolean }) {
  const { z } = useHomeScale();
  const { t, tn, lang } = useT();
  const first = plan.legs[0];
  const span = plan.arriveAt - (first.mode === 'walk' ? first.depart : first.depart);
  const modes = new Set(plan.legs.map((l) => l.mode));
  return (
    <View style={[{ marginHorizontal: 16, borderRadius: z(24), padding: z(16), gap: z(14), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE }, cardShadow]}>
      <View style={{ flexDirection: 'row', gap: z(12) }}>
        <End z={z} lang={lang} label={t('route.summary.from')} name={fromName} dot="#4F35E8" />
        <View style={{ width: 1, backgroundColor: CARD_LINE }} />
        <End z={z} lang={lang} label={t('route.summary.to')} name={toName} dot="#E5484D" />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8) }} accessible accessibilityLabel={t('route.transit.a11y.times', { leave: time(plan.departAt), arrive: time(plan.arriveAt), span: formatSpan(span, t) })}>
        <Big z={z} top={t('route.transit.leave')} value={time(plan.departAt)} />
        <Text style={{ fontSize: z(22), color: SLATE }}>→</Text>
        <Big z={z} top={t('route.transit.arriveAbout')} value={time(plan.arriveAt)} accent />
        <View style={{ flex: 1 }} />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: z(11.5), color: SLATE }}>{t('route.transit.total')}</Text>
          <Text style={{ fontSize: z(19), fontWeight: '800', color: NAVY }}>{formatSpan(span, t)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: z(8) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), minHeight: z(34), paddingHorizontal: z(12), borderRadius: z(17), backgroundColor: '#F1EFFF' }}>
          <Clock size={z(14)} color={VIOLET} strokeWidth={2.1} />
          <Text style={{ fontSize: z(13), fontWeight: '700', color: VIOLET }}>{whenLabel}</Text>
        </View>
        <Step z={z} label={t('route.transit.earlier')} onPress={() => onStep(-15)} Icon={ChevronLeft} />
        <Step z={z} label={t('route.transit.later')} onPress={() => onStep(15)} Icon={ChevronRight} />
        {canNow ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('route.transit.leaveNow')} onPress={onNow} hitSlop={6} style={{ minHeight: z(34), paddingHorizontal: z(12), borderRadius: z(17), borderWidth: 1, borderColor: '#D9D3FF', justifyContent: 'center' }}>
            <Text style={{ fontSize: z(13), fontWeight: '700', color: VIOLET }}>{t('route.transit.now')}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: z(8) }}>
        <Tile z={z} Icon={Repeat} tint="#B45309" bg="#FEF3C7" value={String(plan.transfers)} label={tn('route.summary.changes', plan.transfers)} a11y={tn('route.transit.a11y.changes', plan.transfers)} />
        <Tile z={z} Icon={Footprints} tint="#475569" bg="#EEF1F6" value={plan.walkMeters >= 1000 ? t('route.km', { n: (plan.walkMeters / 1000).toFixed(1) }) : t('route.m', { n: plan.walkMeters })} label={t('route.transit.walking')} a11y={t('route.transit.a11y.walk', { n: plan.walkMeters })} />
        <Tile z={z} Icon={modes.has('metro') && !modes.has('bus') ? TrainFront : Bus} tint="#0F6FC4" bg="#E3F1FC" value={String(plan.rides)} label={tn('route.transit.rides', plan.rides)} a11y={tn('route.transit.a11y.rides', plan.rides)} />
        <Tile
          z={z}
          Icon={Ticket}
          tint="#0F6FC4"
          bg="#E3F1FC"
          value={plan.fare.knownInr !== null ? `₹${plan.fare.knownInr}` : t('route.summary.na')}
          label={plan.fare.knownInr !== null && plan.fare.partial ? t('route.transit.brtsOnly') : t('route.summary.fare')}
          a11y={plan.fare.knownInr !== null ? t(plan.fare.partial ? 'route.transit.a11y.farePartial' : 'route.transit.a11y.fare', { n: plan.fare.knownInr }) : t('route.lib.fareUnavailable')}
        />
      </View>
    </View>
  );
}

function End({ z, lang, label, name, dot }: { z: (n: number) => number; lang: string; label: string; name: string; dot: string }) {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: z(4) }} accessible accessibilityLabel={`${label.toLowerCase()} ${name}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6) }}>
        <View style={{ width: z(11), height: z(11), borderRadius: z(6), borderWidth: z(3), borderColor: dot }} />
        <Text style={{ fontSize: z(11), fontWeight: '800', color: SLATE, letterSpacing: lang === 'en' ? 1 : 0 }}>{label}</Text>
      </View>
      <Text style={{ fontSize: z(19), fontWeight: '800', color: NAVY, letterSpacing: -0.3, lineHeight: z(23) }} numberOfLines={3}>
        {name}
      </Text>
    </View>
  );
}

function Big({ z, top, value, accent }: { z: (n: number) => number; top: string; value: string; accent?: boolean }) {
  return (
    <View>
      <Text style={{ fontSize: z(11.5), color: SLATE }}>{top}</Text>
      <Text style={{ fontSize: z(26), fontWeight: '800', color: accent ? VIOLET : NAVY, letterSpacing: -0.5 }}>{value}</Text>
    </View>
  );
}

function Step({ z, label, onPress, Icon }: { z: (n: number) => number; label: string; onPress: () => void; Icon: LucideIcon }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={{ width: z(34), height: z(34), borderRadius: z(17), backgroundColor: '#F1EFFF', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={z(18)} color={VIOLET} strokeWidth={2.2} />
    </Pressable>
  );
}

function Tile({ z, Icon, tint, bg, value, label, a11y }: { z: (n: number) => number; Icon: LucideIcon; tint: string; bg: string; value: string; label: string; a11y: string }) {
  return (
    <View accessible accessibilityLabel={a11y} style={{ flex: 1, alignItems: 'center', gap: z(5), paddingVertical: z(10), borderRadius: z(16), backgroundColor: '#F8F8FD', borderWidth: 1, borderColor: CARD_LINE }}>
      <View style={{ width: z(28), height: z(28), borderRadius: z(14), backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={z(15)} color={tint} strokeWidth={2.1} />
      </View>
      <Text style={{ fontSize: z(value.length > 8 ? 13 : 16), fontWeight: '800', color: NAVY, textAlign: 'center' }} numberOfLines={2}>
        {value}
      </Text>
      <Text style={{ fontSize: z(11), color: SLATE, textAlign: 'center', paddingHorizontal: z(2) }}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------- options

/** One small card per alternative (fewest rides vs earliest arrival); the selected one is outlined in violet. */
export function PlanOptions({ plans, selected, onSelect, corridors }: { plans: TransitPlan[]; selected: number; onSelect: (i: number) => void; corridors: Map<string, Corridor> }) {
  const { z } = useHomeScale();
  const { t, tn, lang } = useT();
  if (plans.length < 2) return null;
  const earliest = Math.min(...plans.map((p) => p.arriveAt));
  const fewest = Math.min(...plans.map((p) => p.rides));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: z(10) }} accessibilityRole="radiogroup">
      {plans.map((p, i) => {
        const on = i === selected;
        const tag = t(p.arriveAt === earliest ? 'route.transit.opt.earliest' : p.rides === fewest ? 'route.transit.opt.fewest' : 'route.transit.opt.option');
        return (
          <Pressable key={i} accessibilityRole="radio" accessibilityState={{ selected: on, checked: on }} aria-checked={on} accessibilityLabel={t('route.transit.opt.a11y', { tag, arrive: time(p.arriveAt), rides: tn('route.transit.a11y.rides', p.rides) })} onPress={() => onSelect(i)} style={{ width: z(150), padding: z(12), borderRadius: z(18), backgroundColor: on ? '#F1EFFF' : '#FFFFFF', borderWidth: on ? 2 : 1, borderColor: on ? VIOLET : CARD_LINE, gap: z(5) }}>
            <Text style={{ fontSize: z(11), fontWeight: '800', color: on ? VIOLET : SLATE, letterSpacing: lang === 'en' ? 0.5 : 0 }}>{tag.toUpperCase()}</Text>
            <Text style={{ fontSize: z(20), fontWeight: '800', color: NAVY }}>{time(p.arriveAt)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(4), flexWrap: 'wrap' }}>
              {p.legs
                .filter((l) => l.mode !== 'walk')
                .map((l, j) => (
                  <View key={j} style={{ paddingHorizontal: z(6), minHeight: z(20), borderRadius: z(10), backgroundColor: l.mode === 'bus' ? AGENCY_LOOK[l.agency].color : corridors.get(l.corridorId)?.color ?? VIOLET, justifyContent: 'center' }}>
                    <Text style={{ fontSize: z(10.5), fontWeight: '800', color: '#FFFFFF' }}>{l.mode === 'bus' ? l.routeShort : t('route.line.metro')}</Text>
                  </View>
                ))}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ------------------------------------------------------------------- notes

export function NoteCard({ text, tone = 'warn' }: { text: string; tone?: 'warn' | 'info' }) {
  const { z } = useHomeScale();
  const warn = tone === 'warn';
  return (
    <View style={{ marginHorizontal: 16, flexDirection: 'row', gap: z(10), padding: z(12), borderRadius: z(16), backgroundColor: warn ? '#FFF4E5' : '#F1EFFF', borderWidth: 1, borderColor: warn ? '#F9D9A8' : '#D9D3FF' }}>
      <TriangleAlert size={z(18)} color={warn ? '#B54708' : VIOLET} />
      <Text style={{ flex: 1, fontSize: z(13), color: warn ? '#7A3B06' : '#2E1FA8' }}>{text}</Text>
    </View>
  );
}

export function FareCard({ plan }: { plan: TransitPlan }) {
  const { z } = useHomeScale();
  const { t } = useT();
  const f = plan.fare;
  return (
    <View style={[{ marginHorizontal: 16, padding: z(14), borderRadius: z(20), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, gap: z(6) }, cardShadow, { shadowOpacity: 0.05 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
        <View style={{ width: z(38), height: z(38), borderRadius: z(12), backgroundColor: '#E3F1FC', alignItems: 'center', justifyContent: 'center' }}>
          <Ticket size={z(20)} color="#0F6FC4" strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: z(16), fontWeight: '800', color: NAVY }}>{f.knownInr !== null ? t('route.transit.fare.known', { adult: f.knownInr, child: f.knownChildInr ?? '' }) : t('route.transit.fare.none')}</Text>
          <Text style={{ fontSize: z(12.5), color: SLATE }}>{f.knownInr !== null ? t(f.partial ? 'route.transit.fare.partial' : 'route.transit.fare.brts') : t('route.transit.fare.noneStored')}</Text>
        </View>
      </View>
      {f.unavailable.length > 0 ? <Text style={{ fontSize: z(12), color: SLATE }}>{t('route.transit.fare.missing', { list: f.unavailable.map((u) => fareName(u, t)).join(', ') })}</Text> : null}
    </View>
  );
}

const fareName = (u: TransitPlan['fare']['unavailable'][number], t: T): string =>
  t(u === 'AMTS' ? 'route.transit.fare.name.AMTS' : u === 'GTSL' ? 'route.transit.fare.name.GTSL' : u === 'BRTS' ? 'route.transit.fare.name.BRTS' : 'route.transit.fare.name.metro');
