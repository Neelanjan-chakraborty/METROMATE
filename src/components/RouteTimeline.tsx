import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, Info, Repeat } from 'lucide-react-native';
import { colors, radius, space, type } from '../theme';
import type { Corridor, RouteResult, Station } from '../types';

interface Props {
  route: RouteResult;
  stations: Map<string, Station>;
  corridors: Map<string, Corridor>;
  onStationPress: (id: string) => void;
}

const COLLAPSE_OVER = 3;

type Kind = 'origin' | 'destination' | 'interchange' | 'stop';

export function RouteTimeline({ route, stations, corridors, onStationPress }: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const name = (id: string) => stations.get(id)?.name ?? id;
  const last = route.segments.length - 1;

  return (
    <View>
      {route.segments.map((seg, si) => {
        const corridor = corridors.get(seg.corridorId);
        const color = corridor?.color ?? colors.primary;
        const terminal = name(seg.directionTerminalId);
        // Interior stops exclude both ends of the segment.
        const interior = seg.stationIds.slice(1, -1);
        const collapsed = interior.length > COLLAPSE_OVER && !expanded[si];
        const first = seg.stationIds[0];
        const end = seg.stationIds[seg.stationIds.length - 1];
        const isFinal = si === last;

        return (
          <View key={`${seg.corridorId}-${si}`}>
            {si === 0 ? null : (
              <View style={styles.changeBlock}>
                <Repeat size={16} color={colors.warn} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.h3, { color: colors.warn }]}>Change trains at {name(first)}</Text>
                  <Text style={type.small}>Switch to the {corridor?.shortName ?? seg.corridorId} line.</Text>
                </View>
              </View>
            )}

            <View style={[styles.instruction, { borderLeftColor: color }]}>
              <Text style={type.h3} accessibilityRole="header">
                {si === 0 ? 'Board' : 'Then board'} the train towards {terminal}
              </Text>
              <Text style={type.small}>
                {corridor?.name ?? seg.corridorId} · {seg.stops} {seg.stops === 1 ? 'stop' : 'stops'}
              </Text>
              <View style={styles.platformNote}>
                <Info size={13} color={colors.muted} />
                <Text style={type.tiny}>Platform not verified yet. Look for signs saying “Towards {terminal}”.</Text>
              </View>
            </View>

            {/* first station of the first segment only; later segments start at the interchange already drawn */}
            {si === 0 ? (
              <StationRow id={first} name={name(first)} kind="origin" color={color} first onPress={onStationPress} />
            ) : null}

            {collapsed ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Show ${interior.length} stops in between`}
                onPress={() => setExpanded((e) => ({ ...e, [si]: true }))}
                style={styles.row}
              >
                <Rail color={color} dotKind="hidden" />
                <View style={styles.rowBody}>
                  <Text style={[type.small, { color: colors.primary, fontWeight: '700' }]}>
                    {interior.length} stops in between · tap to show
                  </Text>
                </View>
                <ChevronDown size={18} color={colors.primary} />
              </Pressable>
            ) : (
              interior.map((id) => <StationRow key={id} id={id} name={name(id)} kind="stop" color={color} onPress={onStationPress} />)
            )}
            {!collapsed && interior.length > COLLAPSE_OVER ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hide stops in between"
                onPress={() => setExpanded((e) => ({ ...e, [si]: false }))}
                style={styles.row}
              >
                <Rail color={color} dotKind="hidden" />
                <View style={styles.rowBody}>
                  <Text style={[type.small, { color: colors.primary, fontWeight: '700' }]}>Hide stops</Text>
                </View>
                <ChevronUp size={18} color={colors.primary} />
              </Pressable>
            ) : null}

            <StationRow
              id={end}
              name={name(end)}
              kind={isFinal ? 'destination' : 'interchange'}
              color={color}
              last={isFinal}
              onPress={onStationPress}
            />
          </View>
        );
      })}
    </View>
  );
}

function StationRow({
  id,
  name,
  kind,
  color,
  first,
  last,
  onPress,
}: {
  id: string;
  name: string;
  kind: Kind;
  color: string;
  first?: boolean;
  last?: boolean;
  onPress: (id: string) => void;
}) {
  const badge =
    kind === 'origin'
      ? { text: 'START', fg: colors.origin, bg: colors.originSoft }
      : kind === 'destination'
        ? { text: 'DESTINATION', fg: colors.destination, bg: colors.destinationSoft }
        : kind === 'interchange'
          ? { text: 'CHANGE HERE', fg: colors.warn, bg: colors.interchangeSoft }
          : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}${badge ? ', ' + badge.text.toLowerCase() : ''}. Open station details`}
      onPress={() => onPress(id)}
      style={[styles.row, kind !== 'stop' && { minHeight: 56 }]}
    >
      <Rail color={color} dotKind={kind} noTop={first} noBottom={last || kind === 'interchange'} />
      <View style={styles.rowBody}>
        <Text style={kind === 'stop' ? type.body : [type.h3, { fontSize: 16 }]}>{name}</Text>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.text}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function Rail({ color, dotKind, noTop, noBottom }: { color: string; dotKind: Kind | 'hidden'; noTop?: boolean; noBottom?: boolean }) {
  const dot =
    dotKind === 'origin'
      ? { size: 18, bg: colors.origin, border: colors.white, ring: colors.origin }
      : dotKind === 'destination'
        ? { size: 18, bg: colors.destination, border: colors.white, ring: colors.destination }
        : dotKind === 'interchange'
          ? { size: 18, bg: colors.white, border: colors.interchange, ring: colors.interchange }
          : { size: 12, bg: colors.white, border: color, ring: color };
  return (
    <View style={styles.rail}>
      {!noTop ? <View style={[styles.lineTop, { backgroundColor: color }]} /> : null}
      {!noBottom ? <View style={[styles.lineBottom, { backgroundColor: color }]} /> : null}
      {dotKind === 'hidden' ? null : (
        <View
          style={{
            width: dot.size,
            height: dot.size,
            borderRadius: dot.size / 2,
            backgroundColor: dot.bg,
            borderWidth: dotKind === 'stop' ? 3 : dotKind === 'interchange' ? 4 : 3,
            borderColor: dotKind === 'origin' || dotKind === 'destination' ? colors.white : dot.border,
            ...(dotKind === 'origin' || dotKind === 'destination' ? { shadowColor: dot.ring, shadowOpacity: 0.5, shadowRadius: 4, elevation: 3 } : {}),
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', minHeight: 44 },
  rail: { width: 32, alignItems: 'center', justifyContent: 'center' },
  lineTop: { position: 'absolute', top: 0, height: '50%', width: 5, left: 13.5 },
  lineBottom: { position: 'absolute', bottom: 0, height: '50%', width: 5, left: 13.5 },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  instruction: {
    marginLeft: 32,
    marginVertical: space.sm,
    paddingLeft: space.md,
    paddingVertical: space.sm,
    borderLeftWidth: 4,
    gap: 2,
  },
  platformNote: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 4, paddingRight: space.lg },
  changeBlock: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    backgroundColor: colors.interchangeSoft,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.sm,
  },
});
