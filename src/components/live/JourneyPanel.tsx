import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { BellRing, Check, Play, Square } from 'lucide-react-native';
import { Button, Card, Muted, Notice, Pill } from '../ui';
import { colors, radius, space, type } from '../../theme';
import type { Position, PositionSource } from '../../lib/position';
import type { RouteResult, Station } from '../../types';

interface Props {
  route: RouteResult;
  stations: Map<string, Station>;
  position: Position | null;
  headingAway: boolean;
  offRouteM: number | null;
  wake: boolean;
  onWake: (v: boolean) => void;
  demoRunning: boolean;
  onDemo: () => void;
  onCheckIn: (idx: number) => void;
  onClearCheckIn: () => void;
  gpsActive: boolean;
}

const SOURCE: Record<PositionSource, { label: string; fg: string; bg: string }> = {
  gps: { label: 'From GPS', fg: colors.ok, bg: colors.okSoft },
  'last-seen': { label: 'Last seen by GPS', fg: colors.warn, bg: colors.warnSoft },
  checkin: { label: 'From your check-in', fg: colors.primary, bg: colors.primarySoft },
  demo: { label: 'DEMO — simulated, not your location', fg: colors.destination, bg: colors.destinationSoft },
};

export function JourneyPanel(p: Props) {
  const ids = p.route.stationIds;
  const name = (id: string) => p.stations.get(id)?.name ?? id;
  const pos = p.position;
  const lastIdx = pos ? ids.indexOf(pos.lastStationId) : -1;
  const nextName = pos?.nextStationId ? name(pos.nextStationId) : null;

  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.row}>
        <Text style={[type.h2, { flex: 1 }]}>
          {name(ids[0])} → {name(ids[ids.length - 1])}
        </Text>
        {pos ? <Pill label={SOURCE[pos.source].label} color={SOURCE[pos.source].fg} bg={SOURCE[pos.source].bg} /> : null}
      </View>

      {p.headingAway ? (
        <Notice tone="warn" title="Check your direction">
          Your position is moving back towards {name(ids[0])}. Make sure you boarded the train towards the right terminus.
        </Notice>
      ) : null}
      {!pos && p.offRouteM !== null ? (
        <Notice tone="warn" title="You don’t seem to be on this route">
          Your location is about {p.offRouteM >= 1000 ? `${(p.offRouteM / 1000).toFixed(1)} km` : `${p.offRouteM} m`} from the planned line. Use check-ins below if GPS is unreliable.
        </Notice>
      ) : null}

      {pos ? (
        <View style={styles.status} accessibilityLiveRegion="polite">
          {pos.arrived ? (
            <Text style={styles.big}>You’ve arrived at {name(pos.lastStationId)}</Text>
          ) : (
            <>
              <Text style={styles.big}>{pos.arriving ? `Arriving at ${nextName}` : `Next stop: ${nextName}`}</Text>
              <Muted>
                {pos.stopsRemaining} {pos.stopsRemaining === 1 ? 'stop' : 'stops'} to go
                {pos.distanceToNextM !== null ? ` · about ${pos.distanceToNextM >= 1000 ? (pos.distanceToNextM / 1000).toFixed(1) + ' km' : pos.distanceToNextM + ' m'} to the next station` : ''}
                {pos.approximate ? ' · approximate' : ''}
              </Muted>
            </>
          )}
        </View>
      ) : (
        <Muted>
          {p.gpsActive
            ? 'Waiting for a position on this route. You can also tap “I’m here” on a station below.'
            : 'Tap “I’m here” on the station you are at to start tracking by check-in.'}
        </Muted>
      )}

      <View style={styles.wakeRow}>
        <BellRing size={18} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={type.h3}>Alert me near {name(ids[ids.length - 1])}</Text>
          <Text style={type.tiny}>Vibrates when you’re close. Works only while MetroMate is open on screen.</Text>
        </View>
        <Switch value={p.wake} onValueChange={p.onWake} accessibilityLabel="Alert me near the destination" />
      </View>
      {p.wake && pos && (pos.arriving || pos.arrived) ? (
        <Notice tone="warn" title={pos.arrived ? 'You have arrived' : 'Your stop is next'}>
          {name(ids[ids.length - 1])}
        </Notice>
      ) : null}

      <View>
        {ids.map((id, idx) => {
          const passed = lastIdx >= 0 && idx < lastIdx;
          const here = pos?.atStationId === id;
          const isLast = idx === lastIdx && !here;
          const isNext = pos?.nextStationId === id;
          const st = p.stations.get(id);
          return (
            <View key={id} style={styles.stop}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.dot,
                    passed && { backgroundColor: colors.faint, borderColor: colors.faint },
                    (here || isLast) && { backgroundColor: colors.primary, borderColor: colors.primary },
                    isNext && { borderColor: colors.interchange, borderWidth: 4 },
                    idx === ids.length - 1 && { borderColor: colors.destination },
                  ]}
                />
                {idx < ids.length - 1 ? <View style={[styles.line, passed && { backgroundColor: colors.faint }]} /> : null}
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
                <Text style={[type.body, passed && { color: colors.faint }, (here || isNext) && { fontWeight: '800' }]}>{name(id)}</Text>
                {here ? <Pill label="YOU ARE HERE" color={colors.primary} bg={colors.primarySoft} /> : null}
                {isLast ? <Pill label="LAST PASSED" color={colors.primary} bg={colors.primarySoft} /> : null}
                {isNext ? <Pill label="NEXT" color={colors.warn} bg={colors.interchangeSoft} /> : null}
                {st?.stationType === 'underground' ? <Pill label="Underground" color={colors.muted} bg="#EEF0F5" /> : null}
              </View>
              {!passed && !here && idx > 0 ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`I'm at ${name(id)}`} onPress={() => p.onCheckIn(idx)} style={styles.checkIn} hitSlop={6}>
                  <Check size={14} color={colors.primary} />
                  <Text style={styles.checkInText}>I’m here</Text>
                </Pressable>
              ) : idx === 0 && !here && !passed ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`I'm at ${name(id)}`} onPress={() => p.onCheckIn(idx)} style={styles.checkIn} hitSlop={6}>
                  <Check size={14} color={colors.primary} />
                  <Text style={styles.checkInText}>I’m here</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button
          label={p.demoRunning ? 'Stop demo' : 'Run demo ride'}
          icon={p.demoRunning ? Square : Play}
          variant="secondary"
          compact
          style={{ flex: 1 }}
          onPress={p.onDemo}
        />
        {pos?.source === 'checkin' ? <Button label="Clear check-in" variant="secondary" compact style={{ flex: 1 }} onPress={p.onClearCheckIn} /> : null}
      </View>
      <Text style={type.tiny}>The demo steps through the stations automatically so you can see tracking without riding. It is simulated and never uses your location.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  status: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: space.md, gap: 4 },
  big: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  wakeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stop: { flexDirection: 'row', alignItems: 'center', minHeight: 40, gap: space.sm },
  rail: { width: 22, alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: colors.primary, backgroundColor: colors.white, zIndex: 1 },
  line: { position: 'absolute', top: '50%', bottom: -20, width: 3, backgroundColor: colors.primary, opacity: 0.35 },
  checkIn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, minHeight: 32, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  checkInText: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
