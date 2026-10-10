import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Info, TrainFront } from 'lucide-react-native';
import { useHomeScale } from '../home/scale';
import { Gradient } from './primitives';
import { bandPeriod, serviceNow, type ServiceNow } from '../../lib/serviceNow';
import { useT } from '../../i18n/useT';
import type { T } from '../../i18n/translate';
import type { Corridor, TimetableLine } from '../../types';

interface Props {
  lines: { line: TimetableLine; stationIds: string[] }[];
  corridors: Map<string, Corridor>;
  nameOf: (id: string) => string;
  onTrack: () => void;
}

/** Re-reads the clock every 30 s so "running now" and the current band stay right while the screen is open. */
function useNow(ms = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/**
 * The published timetable for the line the rider boards, shown as three labelled numbers: how often trains
 * run right now, and the first and last train. It is GMRC's static schedule, not a live feed, and says so.
 */
export function ServiceCard({ lines, corridors, nameOf, onTrack }: Props) {
  const { z } = useHomeScale();
  const { t, lang } = useT();
  const now = useNow();
  const [sel, setSel] = useState(0);
  const cur = lines[Math.min(sel, lines.length - 1)];
  const s = useMemo(() => (cur ? serviceNow(cur.line, cur.stationIds, now) : null), [cur, now]);
  if (!cur || !s) return null;
  const color = corridors.get(cur.line.corridorId)?.color ?? '#FFFFFF';

  const state = STATE[s.state](s, t);
  const band = s.band;
  const freq =
    band && band.kind !== 'bus-only'
      ? { top: t(band.kind === 'average' ? 'route.service.aboutEvery' : 'route.service.every'), big: String(band.minutes), unit: t('route.unit.min'), sub: bandPeriod(band, t) }
      : band
        ? { top: t('route.service.metroTrains'), big: t('route.service.busOnly'), unit: '', sub: t('route.service.inWindow') }
        : { top: t('route.service.trainsRun'), big: '—', unit: '', sub: s.state === 'running' ? t('route.service.seeTimetable') : t('route.service.notScheduled') };

  return (
    <View style={[styles.card, { borderRadius: z(24), padding: z(16), gap: z(14) }]} accessibilityLabel={t('route.service.a11y')}>
      <Gradient id="svc" stops={[{ at: 0, color: '#2B1FC4' }, { at: 1, color: '#5B3FEF' }]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
        <View style={{ width: z(38), height: z(38), borderRadius: z(12), backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <TrainFront size={z(21)} color="#4F35E8" strokeWidth={2} />
        </View>
        <Text style={{ fontSize: z(15), fontWeight: '800', color: '#FFFFFF', letterSpacing: lang === 'en' ? 0.6 : 0 }}>{t('route.service.title')}</Text>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), paddingHorizontal: z(10), minHeight: z(26), borderRadius: z(13), backgroundColor: 'rgba(255,255,255,0.16)', flexShrink: 1 }}>
          <View style={{ width: z(8), height: z(8), borderRadius: z(4), backgroundColor: state.dot }} />
          <Text style={{ fontSize: z(12), fontWeight: '700', color: '#FFFFFF', flexShrink: 1 }}>{state.text}</Text>
        </View>
      </View>

      {lines.length > 1 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: z(8) }} accessibilityRole="radiogroup">
          {lines.map((l, i) => (
            <Pressable
              key={l.line.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: i === sel, checked: i === sel }}
              aria-checked={i === sel}
              accessibilityLabel={t('route.service.timingsFor', { line: l.line.label })}
              hitSlop={8}
              onPress={() => setSel(i)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), minHeight: z(30), paddingHorizontal: z(12), borderRadius: z(15), backgroundColor: i === sel ? '#FFFFFF' : 'rgba(255,255,255,0.14)' }}
            >
              <View style={{ width: z(8), height: z(8), borderRadius: z(4), backgroundColor: corridors.get(l.line.corridorId)?.color ?? '#fff', borderWidth: 1, borderColor: '#FFFFFF' }} />
              <Text style={{ fontSize: z(12.5), fontWeight: '700', color: i === sel ? '#3A27C9' : '#FFFFFF' }}>{l.line.label.split(' — ')[0]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        <Stat z={z} top={freq.top} big={freq.big} unit={freq.unit} sub={freq.sub} grow={1.15} />
        <View style={styles.divider} />
        <Stat z={z} top={t('route.service.firstTrain')} big={s.first ?? '—'} sub={s.first ? t('route.service.daily') : undefined} />
        <View style={styles.divider} />
        <Stat z={z} top={t('route.service.lastTrain')} big={s.last ?? '—'} sub={s.last ? t('route.service.daily') : undefined} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
        <View style={{ flex: 1, gap: z(3) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6) }}>
            <View style={{ width: z(9), height: z(9), borderRadius: z(5), backgroundColor: color, borderWidth: 1.5, borderColor: '#FFFFFF' }} />
            <Text style={{ fontSize: z(12.5), color: '#E9E6FF', fontWeight: '600', flexShrink: 1 }} numberOfLines={1}>
              {t('route.service.towards', { name: nameOf(s.towardsTerminalId) })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(5) }}>
            <Info size={z(12)} color="#C9C3FF" />
            <Text style={{ fontSize: z(11.5), color: '#C9C3FF', flexShrink: 1 }} numberOfLines={2}>
              {t('route.service.scheduleNote', { name: nameOf(s.fromTerminalId) })}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('route.service.trackA11y')}
          onPress={onTrack}
          style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: z(8), minHeight: z(44), paddingHorizontal: z(14), borderRadius: z(14), borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.1)', opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={{ fontSize: z(14), fontWeight: '700', color: '#FFFFFF', flexShrink: 1 }}>{t('route.service.track')}</Text>
          <ArrowRight size={z(17)} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

const STATE: Record<ServiceNow['state'], (s: ServiceNow, t: T) => { text: string; dot: string }> = {
  running: (_s, t) => ({ text: t('route.service.running'), dot: '#34D399' }),
  'not-started': (s, t) => ({ text: s.first ? t('route.service.starts', { time: s.first }) : t('route.service.startsLater'), dot: '#FBBF24' }),
  ended: (_s, t) => ({ text: t('route.service.ended'), dot: '#CBD5E1' }),
};

function Stat({ z, top, big, unit, sub, grow = 1 }: { z: (n: number) => number; top: string; big: string; unit?: string; sub?: string | null; grow?: number }) {
  const small = big.length > 4;
  return (
    <View style={{ flex: grow, paddingHorizontal: z(4), gap: z(2) }} accessible accessibilityLabel={`${top} ${big}${unit ? ' ' + unit : ''}${sub ? ', ' + sub : ''}`}>
      <Text style={{ fontSize: z(12), color: '#D8D3FF', fontWeight: '600' }} numberOfLines={2}>
        {top}
      </Text>
      <Text style={{ fontSize: z(small ? 22 : 31), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, lineHeight: z(small ? 34 : 38) }} numberOfLines={1}>
        {big}
        {unit ? <Text style={{ fontSize: z(14), fontWeight: '700', color: '#C9F5E2' }}> {unit}</Text> : null}
      </Text>
      {sub ? (
        <Text style={{ fontSize: z(11.5), color: '#C9C3FF' }} numberOfLines={2}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, overflow: 'hidden', backgroundColor: '#3A27C9', shadowColor: '#3B2BB5', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.22)', marginHorizontal: 6 },
});
