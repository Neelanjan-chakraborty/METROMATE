import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Clock, MapPin, Repeat, Ticket, TrainFront, type LucideIcon } from 'lucide-react-native';
import { useHomeScale } from '../home/scale';
import { CARD_LINE, NAVY, SLATE, VIOLET, cardShadow } from './primitives';
import { corridorLabel, overview } from '../../lib/routeView';
import { useT } from '../../i18n/useT';
import type { Corridor, RouteResult, Station } from '../../types';

interface Props {
  route: RouteResult;
  stations: Map<string, Station>;
  corridors: Map<string, Corridor>;
  /** Estimated whole minutes in the train, or null. */
  minutes: number | null;
  /** Fare text for the tile ("₹20") or null when GMRC's fare is not stored. */
  fare: string | null;
}

/** From / To, a proportional line overview, and four icon tiles (time, stops, changes, fare). */
export function RouteSummary({ route, stations, corridors, minutes, fare }: Props) {
  const { z } = useHomeScale();
  const { t, tn, lang } = useT();
  const from = stations.get(route.originId);
  const to = stations.get(route.destinationId);
  const first = corridors.get(route.segments[0].corridorId);
  const last = corridors.get(route.segments[route.segments.length - 1].corridorId);
  const bars = overview(route);
  const changes = route.interchanges.length;

  return (
    <View style={[styles.card, { borderRadius: z(24), padding: z(16), gap: z(16) }, cardShadow]}>
      <View style={{ flexDirection: 'row', gap: z(12) }}>
        <End z={z} lang={lang} label={t('route.summary.from')} name={from?.name ?? route.originId} color={first?.color ?? VIOLET} line={corridorLabel(first, t)} dot="#4F35E8" />
        <View style={{ width: 1, backgroundColor: CARD_LINE }} />
        <End z={z} lang={lang} label={t('route.summary.to')} name={to?.name ?? route.destinationId} color={last?.color ?? VIOLET} line={corridorLabel(last, t)} dot="#E5484D" pin />
      </View>

      <View accessible accessibilityLabel={t('route.summary.a11y.journey', { parts: bars.map((b) => tn('route.summary.a11y.part', b.stops, { line: corridors.get(b.corridorId)?.shortName ?? '' })).join(t('route.summary.a11y.then')) })}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.node, { width: z(16), height: z(16), borderRadius: z(8), borderColor: '#4F35E8' }]} />
          {bars.map((b, i) => (
            <React.Fragment key={i}>
              <View style={{ flex: b.share, height: z(6), borderRadius: z(3), backgroundColor: corridors.get(b.corridorId)?.color ?? VIOLET }} />
              {i < bars.length - 1 ? (
                <View style={[styles.node, { width: z(24), height: z(24), borderRadius: z(12), borderColor: '#F59E0B', backgroundColor: '#FEF3C7' }]}>
                  <Repeat size={z(12)} color="#B45309" strokeWidth={2.4} />
                </View>
              ) : null}
            </React.Fragment>
          ))}
          <View style={[styles.node, { width: z(16), height: z(16), borderRadius: z(8), borderColor: '#E5484D' }]} />
        </View>
        <View style={{ flexDirection: 'row', marginTop: z(6), paddingHorizontal: z(8) }}>
          {bars.map((b, i) => (
            <Text key={i} style={{ flex: b.share, textAlign: 'center', fontSize: z(12), color: SLATE, fontWeight: '600' }} numberOfLines={1}>
              {tn('route.stops', b.stops)}
            </Text>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: z(8) }}>
        <Tile z={z} Icon={Clock} tint="#4F35E8" bg="#EFEDFF" value={minutes !== null ? `~${minutes}` : '—'} unit={minutes !== null ? t('route.unit.min') : undefined} label={minutes !== null ? t('route.summary.estimated') : t('route.summary.timeNa')} a11y={minutes !== null ? t('route.summary.a11y.time', { minutes }) : t('route.summary.a11y.timeNa')} />
        <Tile z={z} Icon={TrainFront} tint="#0E9F6E" bg="#E4F7EF" value={String(route.stopCount)} label={tn('route.summary.stops', route.stopCount)} a11y={tn('route.stops', route.stopCount)} />
        <Tile z={z} Icon={Repeat} tint="#B45309" bg="#FEF3C7" value={changes === 0 ? '0' : String(changes)} label={tn('route.summary.changes', changes)} a11y={changes === 0 ? t('route.summary.a11y.noChange') : tn('route.summary.a11y.changes', changes)} />
        <Tile z={z} Icon={Ticket} tint="#0F6FC4" bg="#E3F1FC" value={fare ?? t('route.summary.na')} label={t('route.summary.fare')} a11y={fare ? t('route.summary.a11y.fare', { fare }) : t('route.lib.fareUnavailable')} />
      </View>
    </View>
  );
}

function End({ z, lang, label, name, color, line, dot, pin }: { z: (n: number) => number; lang: string; label: string; name: string; color: string; line: string; dot: string; pin?: boolean }) {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: z(4) }} accessible accessibilityLabel={`${label.toLowerCase()} ${name}, ${line}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6) }}>
        {pin ? <MapPin size={z(13)} color={dot} strokeWidth={2.4} /> : <View style={{ width: z(11), height: z(11), borderRadius: z(6), borderWidth: z(3), borderColor: dot }} />}
        <Text style={{ fontSize: z(11), fontWeight: '800', color: SLATE, letterSpacing: lang === 'en' ? 1 : 0 }}>{label}</Text>
      </View>
      <Text style={{ fontSize: z(21), fontWeight: '800', color: NAVY, letterSpacing: -0.4, lineHeight: z(25) }} numberOfLines={2}>
        {name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), alignSelf: 'flex-start', paddingHorizontal: z(9), minHeight: z(24), borderRadius: z(12), backgroundColor: `${color}1A`, maxWidth: '100%' }}>
        <View style={{ width: z(8), height: z(8), borderRadius: z(4), backgroundColor: color }} />
        <Text style={{ fontSize: z(12), fontWeight: '600', color: NAVY, flexShrink: 1 }} numberOfLines={1}>
          {line}
        </Text>
      </View>
    </View>
  );
}

function Tile({ z, Icon, tint, bg, value, unit, label, a11y }: { z: (n: number) => number; Icon: LucideIcon; tint: string; bg: string; value: string; unit?: string; label: string; a11y: string }) {
  return (
    <View accessible accessibilityLabel={a11y} style={{ flex: 1, alignItems: 'center', gap: z(5), paddingVertical: z(11), borderRadius: z(16), backgroundColor: '#F8F8FD', borderWidth: 1, borderColor: CARD_LINE }}>
      <View style={{ width: z(30), height: z(30), borderRadius: z(15), backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={z(16)} color={tint} strokeWidth={2.1} />
      </View>
      <Text style={{ fontSize: z(value.length > 6 ? 14 : 19), fontWeight: '800', color: NAVY, textAlign: 'center' }} numberOfLines={2}>
        {value}
        {unit ? <Text style={{ fontSize: z(11.5), fontWeight: '700', color: SLATE }}> {unit}</Text> : null}
      </Text>
      <Text style={{ fontSize: z(11.5), color: SLATE, textAlign: 'center', paddingHorizontal: z(2) }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE },
  node: { borderWidth: 4, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
});
