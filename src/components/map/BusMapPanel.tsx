import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Maximize, X, ZoomIn, ZoomOut } from 'lucide-react-native';
import { IconButton, Muted } from '../ui';
import { BusMap } from './BusMap';
import { bboxOf, makeProjector, unionBBox } from '../../lib/geoProject';
import { buildMetroLayer, createBusMapGeometry, legEnds, legsToLines, linesBounds, type LegLine } from '../../lib/transit/geoMap';
import { AGENCY_LOOK, formatClockMinutes, isoDate, minutesOfDay, parseAtParam, startOfDay } from '../../lib/transit/format';
import { createPlanner, planTransit } from '../../lib/transit/planner';
import { buildRouteIndex } from '../../lib/transit/routeIndex';
import { routesAtStop } from '../../lib/transit/transitIndex';
import { useBusShapes, useTransit } from '../../lib/transit/transitData';
import { AGENCY_IDS, type AgencyId } from '../../lib/transit/types';
import { placeName } from '../../lib/transit/places';
import { useReady } from '../../state/useReady';
import { colors, radius, space, type } from '../../theme';
import { bus } from '../../theme/bus';

/** Zoom steps. The level of detail of the drawn lines follows these (see lodFor). */
const SCALES = [0.3, 0.6, 1, 1.6, 2.4] as const;
const DEFAULT_SCALE_INDEX = 1;
/** Finger-sized tap tolerance, in screen pixels. */
const STOP_TAP_PX = 16;
const LINE_TAP_PX = 10;

type Picked = { kind: 'stop'; stop: number; x: number; y: number } | { kind: 'route'; route: number } | { kind: 'station'; id: string } | null;

interface Props {
  from?: string;
  to?: string;
  at?: string;
  /** GTFS route id to show, e.g. from the Bus tab. */
  route?: string;
}

/** The "Bus & metro" half of the Map tab. Waits for the bus data, then draws it. */
export function BusMapPanel(props: Props) {
  const tr = useTransit(true);
  const sh = useBusShapes(tr.status === 'ready');
  if (tr.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={[type.body, { fontWeight: '700' }]}>Bus data could not be loaded</Text>
        <Muted>The metro schematic still works. Restart the app and try again.</Muted>
      </View>
    );
  }
  if (tr.status !== 'ready' || sh.status !== 'ready') {
    return (
      <View style={styles.center}>
        <Text style={[type.body, { color: bus.dark, fontWeight: '700' }]}>Loading bus routes…</Text>
        <Muted>Reading the timetable stored on your phone.</Muted>
      </View>
    );
  }
  return <Ready {...props} transit={tr.transit} shapes={sh.shapes} />;
}

function Ready({ from, to, at, route: routeParam, transit, shapes }: Props & { transit: import('../../lib/transit/transitIndex').TransitIndex; shapes: import('../../lib/transit/types').ShapesData | null }) {
  const { dataset, network, stationPoints } = useReady();
  const ri = useMemo(() => buildRouteIndex(transit), [transit]);

  const proj = useMemo(() => {
    const d = transit.data.stops;
    let bb = bboxOf(d.lat.map((la, i) => [la, d.lon[i]] as const))!;
    const pts = [...stationPoints.values()].map((p) => [p.lat, p.lon] as const);
    const sb = bboxOf(pts);
    if (sb) bb = unionBBox(bb, sb);
    const pad = 0.01;
    return makeProjector({ minLat: bb.minLat - pad, maxLat: bb.maxLat + pad, minLon: bb.minLon - pad, maxLon: bb.maxLon + pad }, 1400, 0);
  }, [transit, stationPoints]);
  const geo = useMemo(() => createBusMapGeometry(transit, shapes, proj), [transit, shapes, proj]);
  const colorOf = useMemo(() => new Map(dataset.corridors.map((c) => [c.id, c.color])), [dataset.corridors]);
  const corridorColor = useCallback((id: string) => colorOf.get(id) ?? colors.muted, [colorOf]);
  const metro = useMemo(() => buildMetroLayer(dataset.corridors, dataset.stations, (id) => stationPoints.get(id) ?? null, proj), [dataset, stationPoints, proj]);

  const [layers, setLayers] = useState<Record<AgencyId, boolean>>({ AJL: true, AMTS: false, GTSL: true });
  const [picked, setPicked] = useState<Picked>(null);

  // A route chosen elsewhere (Bus tab) or by tapping the map.
  const paramRoute = routeParam ? ri.byId.get(routeParam) ?? null : null;
  const selectedRoute = picked?.kind === 'route' ? picked.route : paramRoute;
  const selectedInfo = selectedRoute === null ? null : ri.routes[selectedRoute];
  // A route on the map is always shown, even if its layer is switched off.
  const effLayers = useMemo(() => (selectedInfo ? { ...layers, [selectedInfo.agency]: true } : layers), [layers, selectedInfo]);

  // Journey from the planner.
  const [stamp] = useState(() => new Date());
  const journey = useMemo(() => {
    if (!from || !to) return null;
    const ctx = createPlanner({ ix: transit, stations: dataset.stations, corridors: dataset.corridors, timetable: dataset.timetable, stationPoint: (id) => stationPoints.get(id) ?? null });
    const atMin = parseAtParam(at);
    const nowMin = minutesOfDay(stamp);
    const tomorrow = atMin !== null && atMin < nowMin - 5;
    const d0 = startOfDay(stamp);
    const date = tomorrow ? new Date(d0.getTime() + 24 * 3_600_000) : d0;
    const res = planTransit(ctx, { from, to, departAt: atMin ?? nowMin, date }, isoDate(stamp));
    const plan = [...res.plans].sort((a, b) => a.arriveAt - b.arriveAt || a.rides - b.rides)[0];
    if (!plan) return { plan: null, lines: [] as LegLine[], ends: [] };
    const inp = { ix: transit, shapes, stationPoint: (id: string) => stationPoints.get(id) ?? null };
    return { plan, lines: legsToLines(inp, plan, proj, 1.5), ends: legEnds(inp, plan, proj) };
  }, [from, to, at, transit, shapes, dataset, stationPoints, proj, stamp]);
  const journeyShown = journey && journey.plan ? { lines: journey.lines, ends: journey.ends } : null;

  // ---- viewport: one state holds the zoom step and the map point at the middle of the frame
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null);
  const hRef = useRef<ScrollView>(null);
  const vRef = useRef<ScrollView>(null);
  const offset = useRef({ x: 0, y: 0 });
  const focusKey = `${from ?? ''}|${to ?? ''}|${at ?? ''}|${routeParam ?? ''}`;

  /** Fit a journey or route if one is asked for, else sit on the middle of the metro network. */
  const initialView = (f: { w: number; h: number }) => {
    let box: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
    if (journey && journey.lines.length) box = linesBounds(journey.lines);
    else if (paramRoute !== null) {
      const rp = geo.route(paramRoute, 3);
      if (rp.stops.length) box = { minX: Math.min(...rp.stops.map((p) => p.x)), maxX: Math.max(...rp.stops.map((p) => p.x)), minY: Math.min(...rp.stops.map((p) => p.y)), maxY: Math.max(...rp.stops.map((p) => p.y)) };
    }
    if (box) {
      const w = Math.max(box.maxX - box.minX, 40);
      const h = Math.max(box.maxY - box.minY, 40);
      let best = 0;
      SCALES.forEach((sc, i) => {
        if (w * sc * 1.15 <= f.w && h * sc * 1.15 <= f.h) best = i;
      });
      return { scaleIx: best, centre: { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 } };
    }
    const st = metro.stations;
    return { scaleIx: DEFAULT_SCALE_INDEX, centre: st.length ? { x: st.reduce((n, p) => n + p.x, 0) / st.length, y: st.reduce((n, p) => n + p.y, 0) / st.length } : { x: proj.width / 2, y: proj.height / 2 } };
  };
  const [view, setView] = useState<{ key: string; scaleIx: number; centre: { x: number; y: number } | null }>({ key: '', scaleIx: DEFAULT_SCALE_INDEX, centre: null });
  // Re-fit when the frame first has a size or the thing to show changes (adjusting state while rendering, guarded by the key).
  if (frame && view.key !== focusKey) setView({ key: focusKey, ...initialView(frame) });
  const scaleIx = view.scaleIx;
  const scale = SCALES[scaleIx];

  useEffect(() => {
    const c = view.centre;
    if (!frame || !c) return;
    const t = setTimeout(() => {
      hRef.current?.scrollTo({ x: Math.max(0, c.x * SCALES[view.scaleIx] - frame.w / 2), animated: false });
      vRef.current?.scrollTo({ y: Math.max(0, c.y * SCALES[view.scaleIx] - frame.h / 2), animated: false });
    }, 40);
    return () => clearTimeout(t);
  }, [view, frame]);

  const zoomTo = (next: number) => {
    if (!frame) return;
    const clamped = Math.max(0, Math.min(SCALES.length - 1, next));
    if (clamped === scaleIx) return;
    setView((v) => ({ ...v, scaleIx: clamped, centre: { x: (offset.current.x + frame.w / 2) / scale, y: (offset.current.y + frame.h / 2) / scale } }));
  };

  // ---- taps
  const onTap = useCallback(
    (x: number, y: number) => {
      const agencies = AGENCY_IDS.filter((a) => effLayers[a]);
      const stopHit = geo.stopsNear(x, y, STOP_TAP_PX / scale, agencies, 1)[0];
      // metro stations win only when closer than any stop
      let best: { id: string; d: number } | null = null;
      for (const s of metro.stations) {
        const d = Math.hypot(s.x - x, s.y - y);
        if (d <= STOP_TAP_PX / scale && (!best || d < best.d)) best = { id: s.id, d };
      }
      if (best) {
        setPicked({ kind: 'station', id: best.id });
        return;
      }
      if (stopHit !== undefined) {
        const [sx, sy] = proj.project(transit.data.stops.lat[stopHit], transit.data.stops.lon[stopHit]);
        setPicked({ kind: 'stop', stop: stopHit, x: sx, y: sy });
        return;
      }
      const r = geo.routesNear(x, y, LINE_TAP_PX / scale, agencies, 1)[0];
      if (r) {
        setPicked({ kind: 'route', route: r.route });
        return;
      }
      setPicked(null);
    },
    [geo, effLayers, scale, metro, proj, transit],
  );

  const toggle = (a: AgencyId) => setLayers((l) => ({ ...l, [a]: !l[a] }));
  const clearFocus = () => {
    setPicked(null);
    router.setParams({ from: undefined, to: undefined, at: undefined, route: undefined, mode: undefined });
  };

  const nameOf = (id: string) => placeName(id, network.stations, transit) ?? id;
  const pickedStop = picked?.kind === 'stop' ? { x: picked.x, y: picked.y } : null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chips} accessibilityRole="radiogroup">
        {AGENCY_IDS.map((a) => {
          const on = effLayers[a];
          const look = AGENCY_LOOK[a];
          return (
            <Pressable
              key={a}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`Show ${look.full} routes`}
              onPress={() => toggle(a)}
              style={[styles.chip, on && { backgroundColor: bus.soft, borderColor: look.color }]}
            >
              <View style={[styles.chipDot, { backgroundColor: look.color, opacity: on ? 1 : 0.35 }]} />
              <Text style={[styles.chipText, on && { fontWeight: '800', color: bus.ink }]}>{look.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {journey && !journey.plan ? (
        <View style={styles.banner}>
          <Text style={[type.small, { flex: 1, color: bus.dark, fontWeight: '700' }]}>No journey found for these places, so there is nothing to highlight.</Text>
          <IconButton icon={X} label="Clear highlighted journey" color={bus.dark} onPress={clearFocus} />
        </View>
      ) : null}
      {journeyShown && journey?.plan ? (
        <View style={styles.banner}>
          <Text style={[type.small, { flex: 1, color: bus.dark, fontWeight: '700' }]} numberOfLines={2}>
            {nameOf(from!)} → {nameOf(to!)} · {formatClockMinutes(journey.plan.departAt)}–{formatClockMinutes(journey.plan.arriveAt)} · scheduled
          </Text>
          <IconButton icon={X} label="Clear highlighted journey" color={bus.dark} onPress={clearFocus} />
        </View>
      ) : null}

      <View style={styles.frame} onLayout={(e) => setFrame({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <ScrollView
          ref={hRef}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator
          scrollEventThrottle={32}
          onScroll={(e) => (offset.current.x = e.nativeEvent.contentOffset.x)}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <ScrollView ref={vRef} nestedScrollEnabled showsVerticalScrollIndicator scrollEventThrottle={32} onScroll={(e) => (offset.current.y = e.nativeEvent.contentOffset.y)}>
            <BusMap geo={geo} metro={metro} layers={effLayers} selectedRoute={selectedRoute} journey={journeyShown} scale={scale} pickedStop={pickedStop} corridorColor={corridorColor} onTap={onTap} />
          </ScrollView>
        </ScrollView>
        <View style={styles.zoom}>
          <IconButton icon={ZoomIn} label="Zoom in" color={bus.red} onPress={() => zoomTo(scaleIx + 1)} />
          <IconButton icon={ZoomOut} label="Zoom out" color={bus.red} onPress={() => zoomTo(scaleIx - 1)} />
          <IconButton
            icon={Maximize}
            label="Reset zoom"
            color={bus.red}
            onPress={() => {
              setPicked(null);
              if (frame) setView({ key: focusKey, ...initialView(frame) });
            }}
          />
        </View>

        {picked ? (
          <View style={styles.sheet} accessibilityLiveRegion="polite">
            <PickedCard picked={picked} transit={transit} routeIndexRoutes={ri.routes} network={network} onClose={() => setPicked(null)} />
          </View>
        ) : null}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>
          <Text style={{ fontWeight: '800' }}>━</Text> on a road shape  ·  <Text style={{ fontWeight: '800' }}>┅</Text> straight between stops (no road shape in the feed)  ·  Metro lines run through estimated station pins, so treat them as approximate. Bus times are scheduled, not live.
        </Text>
      </View>
    </View>
  );
}

function PickedCard({
  picked,
  transit,
  routeIndexRoutes,
  network,
  onClose,
}: {
  picked: NonNullable<Picked>;
  transit: import('../../lib/transit/transitIndex').TransitIndex;
  routeIndexRoutes: import('../../lib/transit/routeIndex').RouteInfo[];
  network: { stations: Map<string, { name: string }> };
  onClose: () => void;
}) {
  const close = <IconButton icon={X} label="Close" color={bus.dark} onPress={onClose} />;
  if (picked.kind === 'station') {
    const st = network.stations.get(picked.id);
    return (
      <Row onPress={() => router.push({ pathname: '/station/[id]', params: { id: picked.id } })} title={st?.name ?? 'Metro station'} sub="Metro station · pin position is estimated" accent={colors.primary} close={close} />
    );
  }
  if (picked.kind === 'route') {
    const r = routeIndexRoutes[picked.route];
    const look = AGENCY_LOOK[r.agency];
    return (
      <Row
        onPress={() => router.push({ pathname: '/bus/route/[id]', params: { id: r.id } })}
        title={`${look.label} ${r.short}`}
        sub={`${r.dirs.map((d) => d.headsign).join(' ⇄ ') || r.long} · scheduled`}
        accent={bus.red}
        close={close}
      />
    );
  }
  const d = transit.data;
  const routes = routesAtStop(transit, picked.stop).map((i) => routeIndexRoutes[i]).filter(Boolean);
  const names = [...new Set(routes.map((r) => r.short))];
  const shorts = names.slice(0, 6).join(', ');
  return (
    <Row
      onPress={() => router.push({ pathname: '/bus/stop/[id]', params: { id: d.stops.id[picked.stop] } })}
      title={d.stops.name[picked.stop]}
      sub={`${routes.length} route${routes.length === 1 ? '' : 's'}${shorts ? `: ${shorts}${names.length > 6 ? '…' : ''}` : ''}`}
      accent={bus.red}
      close={close}
    />
  );
}

function Row({ title, sub, accent, onPress, close }: { title: string; sub: string; accent: string; onPress: () => void; close: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${sub}. Open details`} onPress={onPress} style={styles.cardMain}>
        <View style={[styles.cardBar, { backgroundColor: accent }]} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.cardSub} numberOfLines={2}>
            {sub}
          </Text>
        </View>
        <ChevronRight size={20} color={accent} />
      </Pressable>
      {close}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: 6 },
  chips: { paddingHorizontal: space.lg, gap: 8, paddingBottom: space.sm, alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  chipText: { fontSize: 13, fontWeight: '600', color: bus.inkSoft },
  banner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: space.lg, marginBottom: space.sm, paddingLeft: space.md, backgroundColor: bus.soft, borderRadius: radius.md },
  frame: { flex: 1, marginHorizontal: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: bus.line, backgroundColor: '#F4F1EC', overflow: 'hidden' },
  zoom: { position: 'absolute', right: 8, top: 8, flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: radius.pill, borderWidth: 1, borderColor: bus.line },
  sheet: { position: 'absolute', left: 8, right: 8, bottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: bus.line, paddingRight: 4, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 10, paddingRight: 6, minWidth: 0 },
  cardBar: { width: 5, alignSelf: 'stretch', borderRadius: 3 },
  cardTitle: { fontSize: 15.5, fontWeight: '800', color: bus.ink },
  cardSub: { fontSize: 12.5, color: bus.inkSoft, marginTop: 1 },
  legend: { paddingHorizontal: space.lg + 2, paddingVertical: 6 },
  legendText: { fontSize: 11, lineHeight: 15, color: bus.inkSoft },
});
