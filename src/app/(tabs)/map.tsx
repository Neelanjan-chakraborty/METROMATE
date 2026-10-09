import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Maximize, X, ZoomIn, ZoomOut } from 'lucide-react-native';
import { Card, CorridorDot, IconButton, Muted, Notice, Screen } from '../../components/ui';
import { MetroMap } from '../../components/MetroMap';
import { OfflineBadge } from '../../components/OfflineBadge';
import { useReady } from '../../state/useReady';
import { findRoute } from '../../lib/routing';
import { buildSchematic } from '../../lib/schematic';
import { colors, radius, space, type } from '../../theme';

const DEFAULT_SCALE = 0.9;

export default function MapScreen() {
  const { dataset, network } = useReady();
  const { from, to } = useLocalSearchParams<{ from?: string; to?: string }>();
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null);
  const hRef = useRef<ScrollView>(null);
  const vRef = useRef<ScrollView>(null);

  const schematic = useMemo(() => buildSchematic(dataset.corridors), [dataset.corridors]);
  const outcome = useMemo(() => (from && to ? findRoute(network, from, to) : null), [network, from, to]);
  const route = outcome && outcome.ok ? outcome : null;

  // Centre the view on the North–South spine, or on the highlighted journey's bounding box.
  useEffect(() => {
    if (!frame) return;
    let cx = schematic.spineX;
    let cy: number | null = null;
    if (route) {
      const pts = route.stationIds.map((id) => schematic.nodes.get(id)).filter((n): n is NonNullable<typeof n> => !!n);
      if (pts.length > 0) {
        cx = (Math.min(...pts.map((p) => p.x)) + Math.max(...pts.map((p) => p.x))) / 2;
        cy = (Math.min(...pts.map((p) => p.y)) + Math.max(...pts.map((p) => p.y))) / 2;
      }
    }
    const x = cx * scale - frame.w / 2;
    const y = cy === null ? 0 : cy * scale - frame.h / 2;
    const t = setTimeout(() => {
      hRef.current?.scrollTo({ x: Math.max(0, x), animated: false });
      vRef.current?.scrollTo({ y: Math.max(0, y), animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, [frame, route, schematic, scale]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={type.title} accessibilityRole="header">
            Network map
          </Text>
          <Muted>Original schematic, stored on your device. Tap a station for details.</Muted>
        </View>
        <OfflineBadge />
      </View>

      <View style={styles.legendWrap}>
        <Card style={styles.legend}>
          {dataset.corridors.map((c) => (
            <View key={c.id} style={styles.legendItem}>
              <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: c.color }} />
              <Text style={type.tiny}>{c.shortName}</Text>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={styles.interchangeKey} />
            <Text style={type.tiny}>Interchange</Text>
          </View>
          {route ? (
            <>
              <View style={styles.legendItem}>
                <CorridorDot color={colors.origin} />
                <Text style={type.tiny}>A start</Text>
              </View>
              <View style={styles.legendItem}>
                <CorridorDot color={colors.destination} />
                <Text style={type.tiny}>B destination</Text>
              </View>
            </>
          ) : null}
        </Card>
      </View>

      {outcome && !outcome.ok ? (
        <View style={{ paddingHorizontal: space.lg }}>
          <Notice tone="warn">{outcome.message}</Notice>
        </View>
      ) : null}
      {route ? (
        <View style={styles.journeyBanner}>
          <Text style={[type.small, { flex: 1, color: colors.primaryDark, fontWeight: '700' }]} numberOfLines={2}>
            Journey: {network.stations.get(route.originId)?.name} → {network.stations.get(route.destinationId)?.name}
          </Text>
          <IconButton icon={X} label="Clear highlighted journey" color={colors.primaryDark} onPress={() => router.setParams({ from: undefined, to: undefined })} />
        </View>
      ) : null}

      <View style={styles.mapFrame} onLayout={(e) => setFrame({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <ScrollView ref={hRef} horizontal nestedScrollEnabled showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
          <ScrollView ref={vRef} nestedScrollEnabled showsVerticalScrollIndicator>
            <MetroMap
              schematic={schematic}
              corridors={dataset.corridors}
              stations={dataset.stations}
              route={route}
              scale={scale}
              onStationPress={(id) => router.push({ pathname: '/station/[id]', params: { id } })}
            />
          </ScrollView>
        </ScrollView>
        <View style={styles.zoom}>
          <IconButton icon={ZoomIn} label="Zoom in" onPress={() => setScale((s) => Math.min(1.6, +(s + 0.15).toFixed(2)))} />
          <IconButton icon={ZoomOut} label="Zoom out" onPress={() => setScale((s) => Math.max(0.45, +(s - 0.15).toFixed(2)))} />
          <IconButton icon={Maximize} label="Reset zoom" onPress={() => setScale(DEFAULT_SCALE)} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, paddingBottom: space.sm },
  legendWrap: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, paddingVertical: space.sm, paddingHorizontal: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  interchangeKey: { width: 14, height: 14, borderRadius: 7, borderWidth: 4, borderColor: colors.interchange, backgroundColor: colors.white },
  journeyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    paddingLeft: space.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  mapFrame: { flex: 1, marginHorizontal: space.lg, marginBottom: space.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden' },
  zoom: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
});
