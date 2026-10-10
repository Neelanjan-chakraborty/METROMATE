import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, ChevronDown, ChevronUp, TrainFront } from 'lucide-react-native';
import { useHomeScale } from '../home/scale';
import { StopBanner } from './StopBanner';
import { NAVY, SLATE, VIOLET } from './primitives';
import { stopsOf, type StopView } from '../../lib/routeView';
import type { Corridor, RouteResult, Station } from '../../types';

/** Segments with more in-between stops than this start collapsed. */
const COLLAPSE_OVER = 4;

interface Props {
  route: RouteResult;
  stations: Map<string, Station>;
  corridors: Map<string, Corridor>;
  minutes: number[] | null;
  exitsOf: (id: string) => number | null;
  onStation: (id: string) => void;
}

/**
 * The journey as a vertical line: start, change and destination are photo banners; stops in between are
 * slim rows with their estimated minutes. Each stretch has a chip with the line, direction and stop count.
 */
export function JourneyTimeline({ route, stations, corridors, minutes, exitsOf, onStation }: Props) {
  const { z } = useHomeScale();
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const stops = stopsOf(route, minutes);
  const name = (id: string) => stations.get(id)?.name ?? id;
  const lineOf = (si: number) => corridors.get(route.segments[si]?.corridorId ?? '');
  const colorOf = (si: number) => lineOf(si)?.color ?? VIOLET;
  const lineName = (si: number) => {
    const c = lineOf(si);
    return c ? (/branch|line$/i.test(c.shortName) ? c.shortName : `${c.shortName} Line`) : 'Metro';
  };

  const rows: React.ReactNode[] = [];
  let i = 0;
  while (i < stops.length) {
    const s = stops[i];
    const st = stations.get(s.id);
    if (!st) {
      i++;
      continue;
    }
    if (s.kind !== 'stop') {
      const si = s.kind === 'interchange' ? s.segment + 1 : s.segment; // the line the rider is on after this stop
      const upper = s.kind === 'origin' ? null : colorOf(s.segment);
      const lower = s.kind === 'destination' ? null : colorOf(si);
      rows.push(
        <Row key={`k${s.id}${i}`} z={z} top={upper} bottom={lower} dot={s.kind} pad={z(7)}>
          <StopBanner
            station={st}
            kind={s.kind}
            lineColor={colorOf(si)}
            lineName={lineName(s.kind === 'destination' ? s.segment : si)}
            note={s.kind === 'interchange' ? `Switch to ${lineName(si)}` : null}
            minutes={s.minutes}
            exits={s.kind === 'interchange' ? null : exitsOf(s.id)}
            onPress={() => onStation(s.id)}
          />
        </Row>,
      );
      if (s.kind !== 'destination') {
        const seg = route.segments[si];
        rows.push(
          <Row key={`h${si}`} z={z} top={colorOf(si)} bottom={colorOf(si)} dot="none">
            <View style={[styles.segChip, { borderColor: colorOf(si), paddingHorizontal: z(10), height: z(32), borderRadius: z(16) }]} accessible accessibilityLabel={`${lineName(si)} towards ${name(seg.directionTerminalId)}, ${seg.stops} ${seg.stops === 1 ? 'stop' : 'stops'}`}>
              <TrainFront size={z(14)} color={colorOf(si)} strokeWidth={2.1} />
              <Text style={{ fontSize: z(12.5), fontWeight: '700', color: NAVY, flexShrink: 0 }} numberOfLines={1}>
                {lineName(si)}
              </Text>
              <ArrowRight size={z(12)} color={SLATE} />
              <Text style={{ fontSize: z(12.5), color: '#46508C', flexShrink: 1 }} numberOfLines={1}>
                {name(seg.directionTerminalId)}
              </Text>
              <Text style={{ fontSize: z(12), fontWeight: '800', color: colorOf(si), flexShrink: 0 }} numberOfLines={1}>
                · {seg.stops} {seg.stops === 1 ? 'stop' : 'stops'}
              </Text>
            </View>
          </Row>,
        );
      }
      i++;
      continue;
    }
    // A run of in-between stops in one segment.
    const run: StopView[] = [];
    while (i < stops.length && stops[i].kind === 'stop') run.push(stops[i++]);
    const si = run[0].segment;
    const collapsed = run.length > COLLAPSE_OVER && !open[si];
    if (collapsed) {
      rows.push(
        <Row key={`c${si}`} z={z} top={colorOf(si)} bottom={colorOf(si)} dot="none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Show ${run.length} stops in between`}
            accessibilityState={{ expanded: false }}
            onPress={() => setOpen((o) => ({ ...o, [si]: true }))}
            style={[styles.more, { height: z(40), borderRadius: z(14), paddingHorizontal: z(12) }]}
          >
            <Text style={{ fontSize: z(13.5), fontWeight: '700', color: VIOLET, flex: 1 }}>{run.length} stops in between</Text>
            <ChevronDown size={z(18)} color={VIOLET} />
          </Pressable>
        </Row>,
      );
    } else {
      run.forEach((r) =>
        rows.push(
          <Row key={`s${r.id}`} z={z} top={colorOf(si)} bottom={colorOf(si)} dot="stop" stopColor={colorOf(si)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${name(r.id)}${r.minutes !== null ? `, about ${r.minutes} minutes` : ''}. Open station details`}
              onPress={() => onStation(r.id)}
              style={[styles.stop, { minHeight: z(40) }]}
            >
              <Text style={{ flex: 1, fontSize: z(15.5), fontWeight: '600', color: NAVY }} numberOfLines={1}>
                {name(r.id)}
              </Text>
              {r.minutes !== null ? <Text style={{ fontSize: z(12.5), color: SLATE }}>{r.minutes} min</Text> : null}
            </Pressable>
          </Row>,
        ),
      );
      if (run.length > COLLAPSE_OVER)
        rows.push(
          <Row key={`x${si}`} z={z} top={colorOf(si)} bottom={colorOf(si)} dot="none">
            <Pressable accessibilityRole="button" accessibilityLabel="Hide stops in between" accessibilityState={{ expanded: true }} onPress={() => setOpen((o) => ({ ...o, [si]: false }))} style={[styles.stop, { minHeight: z(34) }]}>
              <Text style={{ flex: 1, fontSize: z(13), fontWeight: '700', color: VIOLET }}>Hide stops</Text>
              <ChevronUp size={z(16)} color={VIOLET} />
            </Pressable>
          </Row>,
        );
    }
  }
  return <View>{rows}</View>;
}

function Row({ z, top, bottom, dot, stopColor, pad = 0, children }: { z: (n: number) => number; top: string | null; bottom: string | null; dot: 'origin' | 'interchange' | 'destination' | 'stop' | 'none'; stopColor?: string; pad?: number; children: React.ReactNode }) {
  const w = z(34);
  const line = z(5);
  const D = { origin: ['#FFFFFF', '#4F35E8'], destination: ['#FFFFFF', '#E5484D'], interchange: ['#FFFFFF', '#F59E0B'] } as const;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
      <View style={{ width: w, alignItems: 'center', justifyContent: 'center' }}>
        {top ? <View style={{ position: 'absolute', top: 0, height: '50%', width: line, left: (w - line) / 2, backgroundColor: top, borderRadius: line / 2 }} /> : null}
        {bottom ? <View style={{ position: 'absolute', bottom: 0, height: '50%', width: line, left: (w - line) / 2, backgroundColor: bottom, borderRadius: line / 2 }} /> : null}
        {dot === 'none' ? null : dot === 'stop' ? (
          <View style={{ width: z(14), height: z(14), borderRadius: z(7), backgroundColor: '#FFFFFF', borderWidth: z(3.5), borderColor: stopColor ?? VIOLET }} />
        ) : (
          <View style={{ width: z(24), height: z(24), borderRadius: z(12), backgroundColor: D[dot][0], borderWidth: z(5), borderColor: D[dot][1], shadowColor: D[dot][1], shadowOpacity: 0.45, shadowRadius: 5, elevation: 3 }} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingVertical: pad }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  segChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1.5, marginVertical: 6, maxWidth: '100%' },
  more: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1EFFF', marginVertical: 4 },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 4 },
});
