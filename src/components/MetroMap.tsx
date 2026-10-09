import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';
import type { Corridor, RouteResult, Station } from '../types';
import type { Schematic } from '../lib/schematic';

interface Props {
  schematic: Schematic;
  corridors: Corridor[];
  stations: Station[];
  route: RouteResult | null;
  scale: number;
  onStationPress: (id: string) => void;
}

const FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;

/** Original, locally-rendered schematic of the network. No network access needed. */
export function MetroMap({ schematic, corridors, stations, route, scale, onStationPress }: Props) {
  const colorOf = useMemo(() => new Map(corridors.map((c) => [c.id, c.color])), [corridors]);
  const stationById = useMemo(() => new Map(stations.map((s) => [s.id, s])), [stations]);

  const onPath = useMemo(() => new Set(route?.stationIds ?? []), [route]);
  const pathEdges = useMemo(() => {
    const set = new Set<string>();
    if (route) {
      for (let i = 0; i < route.stationIds.length - 1; i++) {
        set.add(`${route.stationIds[i]}|${route.stationIds[i + 1]}`);
        set.add(`${route.stationIds[i + 1]}|${route.stationIds[i]}`);
      }
    }
    return set;
  }, [route]);

  const dim = (active: boolean) => (route && !active ? 0.3 : 1);

  return (
    <Svg
      width={schematic.width * scale}
      height={schematic.height * scale}
      viewBox={`0 0 ${schematic.width} ${schematic.height}`}
      accessibilityLabel="Schematic map of the Ahmedabad–Gandhinagar metro network"
    >
      {/* journey halo under the lines */}
      {schematic.links.map((l) => {
        const a = schematic.nodes.get(l.fromId);
        const b = schematic.nodes.get(l.toId);
        if (!a || !b || !pathEdges.has(`${l.fromId}|${l.toId}`)) return null;
        return <Line key={`h-${l.corridorId}-${l.fromId}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.primary} strokeOpacity={0.28} strokeWidth={18} strokeLinecap="round" />;
      })}

      {schematic.links.map((l) => {
        const a = schematic.nodes.get(l.fromId);
        const b = schematic.nodes.get(l.toId);
        if (!a || !b) return null;
        const active = pathEdges.has(`${l.fromId}|${l.toId}`);
        return (
          <Line
            key={`${l.corridorId}-${l.fromId}-${l.toId}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={colorOf.get(l.corridorId) ?? colors.muted}
            strokeWidth={active ? 8 : 6}
            strokeLinecap="round"
            opacity={dim(active)}
          />
        );
      })}

      {[...schematic.nodes.values()].map((n) => {
        const st = stationById.get(n.id);
        if (!st) return null;
        const active = onPath.has(n.id);
        const isOrigin = route?.originId === n.id;
        const isDest = route?.destinationId === n.id;
        const ring = colorOf.get(st.corridorIds[0]) ?? colors.muted;
        const o = dim(active);
        const labelWeight = active || !route ? (st.isInterchange ? '800' : '500') : '400';
        return (
          <G key={n.id} onPress={() => onStationPress(n.id)} opacity={o}>
            <Circle cx={n.x} cy={n.y} r={16} fill="transparent" />
            {st.isInterchange ? <Circle cx={n.x} cy={n.y} r={11} fill={colors.white} stroke={colors.interchange} strokeWidth={4} /> : null}
            {isOrigin || isDest ? (
              <>
                <Circle cx={n.x} cy={n.y} r={12} fill={isOrigin ? colors.origin : colors.destination} stroke={colors.white} strokeWidth={3} />
                <SvgText x={n.x} y={n.y + 4} fontFamily={FONT} fontSize={11} fontWeight="800" fill={colors.white} textAnchor="middle">
                  {isOrigin ? 'A' : 'B'}
                </SvgText>
              </>
            ) : st.isInterchange ? null : (
              <Circle cx={n.x} cy={n.y} r={6.5} fill={colors.white} stroke={ring} strokeWidth={3.5} />
            )}
            <SvgText
              x={n.label.x}
              y={n.label.y}
              fontFamily={FONT}
              fontSize={st.isInterchange ? 12.5 : 11.5}
              fontWeight={labelWeight}
              fill={isOrigin ? colors.origin : isDest ? colors.destination : colors.text}
              textAnchor={n.label.anchor}
              transform={n.label.rotate ? `rotate(${n.label.rotate} ${n.label.x} ${n.label.y})` : undefined}
            >
              {st.name}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
