import React, { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Bell, BellOff, Check, ChevronDown, ChevronUp, LocateFixed, Minus, Play, Plus, Square, TrainFront, TriangleAlert, X, Info, Layers, MapPinOff } from 'lucide-react-native';
import { JourneyScene } from './JourneyScene';
import { buildGeometry, distanceAtProgress, isUndergroundAt } from '../../lib/journeyModel';
import { estimateThroughTunnel, hopMinutes, INITIAL_ETA, minutesToProgress, stepEta, type EtaOutput, type HopTimes } from '../../lib/eta';
import { MOVEMENT_LABEL, milestonesBetween, movementState, reliableSpeedKmh, statusMessage, type Snapshot, type Tone } from '../../lib/journeyStatus';
import { formatClock, formatDuration, plural } from '../../lib/format';
import type { HeroLook } from '../../lib/skyPalette';
import type { Fix, SignalState, StationPoint } from '../../lib/locator';
import type { Position, PositionSource } from '../../lib/position';
import type { PermissionState } from '../../hooks/useLocation';
import type { RouteResult, Station, TimetableLine } from '../../types';
import { colors } from '../../theme';

const DEFAULT_ZOOM = 1.45;
const NAVY = colors.text;
const SLATE = colors.slate;
const VIOLET = colors.primary;
const LINE = '#E8EAF6';

export interface JourneyScreenProps {
  route: RouteResult;
  stations: Map<string, Station>;
  corridorColor: (corridorId: string) => string;
  stationPoints: Map<string, StationPoint>;
  timetableLines: TimetableLine[];
  /** GMRC's calculator time for this exact pair, if one was imported. */
  calculatorMinutes: number | null;
  position: Position | null;
  fix: Fix | null;
  signal: SignalState;
  nowMs: number;
  permission: PermissionState;
  canAskAgain: boolean;
  onRequestLocation: () => void;
  online: boolean | null;
  offRouteM: number | null;
  headingAway: boolean;
  wake: boolean;
  onWake: (v: boolean) => void;
  demoRunning: boolean;
  onDemo: () => void;
  onCheckIn: (idx: number) => void;
  onClearCheckIn: () => void;
  onMinimize: () => void;
  onEnd: () => void;
  look: HeroLook;
  animate: boolean;
  reduceMotion: boolean;
}

const SOURCE_CHIP: Record<PositionSource | 'estimated', { label: string; fg: string; bg: string }> = {
  gps: { label: 'GPS live', fg: '#0F6B3E', bg: '#E5F7EC' },
  'last-seen': { label: 'Last seen', fg: colors.warn, bg: colors.warnSoft },
  checkin: { label: 'Check-in', fg: VIOLET, bg: '#ECE9FF' },
  demo: { label: 'Demo', fg: colors.destination, bg: colors.destinationSoft },
  estimated: { label: 'Estimated', fg: VIOLET, bg: '#ECE9FF' },
};

const TONE: Record<Tone, { fg: string; bg: string }> = {
  ok: { fg: '#0F6B3E', bg: '#E5F7EC' },
  info: { fg: VIOLET, bg: '#ECE9FF' },
  warn: { fg: colors.warn, bg: colors.warnSoft },
  alert: { fg: colors.offline, bg: colors.offlineSoft },
};

// ------------------------------------------------------------ error boundary

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* the information panels below do not depend on the illustration */
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// --------------------------------------------------------------------- ETA

function useEta(progress: number | null, hop: HopTimes | null, fromGps: boolean, nowMs: number) {
  const bucket = Math.round(nowMs / 4000);
  const qProgress = progress === null ? null : Math.round(progress * 50) / 50;
  const [out, setOut] = useState<EtaOutput>(() => stepEta(INITIAL_ETA, { nowMs, progress, hop, fromGps }));
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setOut((prev) => {
        const next = stepEta(prev.state, { nowMs, progress, hop, fromGps });
        if (next.updated) setUpdatedAt(nowMs);
        return next;
      });
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, qProgress, hop, fromGps]);
  return { out, updatedAt };
}

// ------------------------------------------------------------------ screen

export function JourneyScreen(p: JourneyScreenProps) {
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const [size, setSize] = useState({ w: win.width, h: win.height });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [expanded, setExpanded] = useState(false);

  const ids = p.route.stationIds;
  const n = ids.length;
  const names = useMemo(() => ids.map((id) => p.stations.get(id)?.name ?? id), [ids, p.stations]);
  const isUnderground = (id: string) => p.stations.get(id)?.stationType === 'underground';

  const { stationPoints, stations, timetableLines, calculatorMinutes } = p;
  const ugFlags = useMemo(() => ids.map((id) => stations.get(id)?.stationType === 'underground'), [ids, stations]);
  const geom = useMemo(() => buildGeometry(ids, (id) => stationPoints.get(id) ?? null, (id) => stations.get(id)?.stationType === 'underground'), [ids, stationPoints, stations]);
  const hop = useMemo(() => hopMinutes(ids, (id) => stationPoints.get(id) ?? null, timetableLines, calculatorMinutes), [ids, stationPoints, timetableLines, calculatorMinutes]);

  // ----- which hop belongs to which corridor, and where the passenger changes trains
  const { corridorColor } = p;
  const segments = p.route.segments;
  const hopColors = useMemo(() => {
    const out: string[] = new Array(Math.max(0, n - 1)).fill(VIOLET);
    for (const seg of segments) {
      const a = ids.indexOf(seg.fromStationId);
      const b = ids.indexOf(seg.toStationId);
      for (let i = a; i < b; i++) out[i] = corridorColor(seg.corridorId);
    }
    return out;
  }, [segments, ids, n, corridorColor]);
  const interchangeIdx = useMemo(() => new Set(p.route.interchanges.map((x) => ids.indexOf(x.stationId)).filter((i) => i >= 0)), [p.route.interchanges, ids]);
  const interchangeFlags = useMemo(() => ids.map((_, i) => interchangeIdx.has(i)), [ids, interchangeIdx]);

  // ----- the position to show: GPS / check-in / demo, or an estimate through a tunnel
  const base = p.position;
  const nowQ = Math.round(p.nowMs / 4000) * 4000;
  const { fix, signal } = p;
  const tunnelEst = useMemo(() => {
    if (!base || !hop || !fix) return null;
    if (!(base.source === 'last-seen' || signal === 'lost')) return null;
    if (base.source === 'checkin' || base.source === 'demo') return null;
    return estimateThroughTunnel({ lastProgress: base.progress, lastAtMs: fix.timestamp, nowMs: nowQ, hop, underground: ugFlags });
  }, [base, hop, fix, signal, nowQ, ugFlags]);

  const source: PositionSource | 'estimated' | null = tunnelEst ? 'estimated' : base ? base.source : null;
  const progress = tunnelEst ? tunnelEst.progress : base ? base.progress : null;
  const lastIdx = progress === null ? 0 : Math.min(n - 1, Math.floor(progress + 1e-6));
  const atIdx = !tunnelEst && base?.atStationId ? ids.indexOf(base.atStationId) : null;
  const arrived = !tunnelEst && !!base?.arrived;
  const nextIdx = progress === null || arrived ? null : tunnelEst || !base?.nextStationId ? Math.min(n - 1, lastIdx + 1) : ids.indexOf(base.nextStationId);
  const underground = geom && progress !== null ? isUndergroundAt(geom, progress) : false;

  const { out: eta, updatedAt } = useEta(progress, hop, source === 'gps', p.nowMs);
  const pace = eta.state.pace;
  const speedKmh = source === 'gps' && p.signal === 'live' ? reliableSpeedKmh(p.fix, p.nowMs) : null;
  const movement = movementState({
    speedKmh,
    atStationId: atIdx !== null && atIdx >= 0 ? ids[atIdx] : null,
    arriving: !!base?.arriving && !tunnelEst,
    arrived,
    distanceToNextM: tunnelEst ? null : base?.distanceToNextM ?? null,
    source: source ?? 'none',
    signal: p.signal,
  });
  const etaFresh = updatedAt !== null && p.nowMs - updatedAt < 25_000;
  const status = statusMessage({
    arrived,
    movement,
    nextName: nextIdx !== null ? names[nextIdx] : null,
    destinationName: names[n - 1],
    nextIsInterchange: nextIdx !== null && interchangeIdx.has(nextIdx),
    etaUpdated: etaFresh,
    behindMin: eta.behindMin,
    inTunnel: underground,
    source: source ?? 'none',
    hasPosition: progress !== null,
  });

  // ----- numbers for the cards
  const totalMin = hop ? hop.total : null;
  const minutesToNext = hop && progress !== null && nextIdx !== null ? Math.max(1, Math.round(minutesToProgress(hop, progress, nextIdx, pace))) : null;
  const pct = geom && progress !== null ? Math.round((distanceAtProgress(geom, progress) / geom.totalM) * 100) : progress !== null ? Math.round((progress / (n - 1)) * 100) : 0;
  const reached = progress === null ? 0 : Math.min(n, lastIdx + 1);
  const nextChange = progress === null ? null : p.route.interchanges.map((x) => ({ ...x, idx: ids.indexOf(x.stationId) })).find((x) => x.idx > lastIdx || (x.idx === lastIdx && atIdx !== lastIdx)) ?? null;
  const onBoardMin = eta.state.boardedAtMs !== null ? Math.max(0, Math.round((p.nowMs - eta.state.boardedAtMs) / 60_000)) : null;
  const shownMinutes = progress === null ? (totalMin === null ? null : Math.round(totalMin)) : eta.minutes;
  const arrivalMs = progress === null ? (totalMin === null ? null : p.nowMs + totalMin * 60_000) : eta.arrivalMs;

  // ----- toasts for milestones
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const snap = useMemo<Snapshot | null>(
    () => (progress === null ? null : { progress, underground, arriving: !!base?.arriving && !tunnelEst, arrived }),
    [progress, underground, base?.arriving, tunnelEst, arrived],
  );
  const [prevSnap, setPrevSnap] = useState<Snapshot | null>(null);
  useEffect(() => {
    if (!snap) return;
    const t = setTimeout(() => {
      const ms = milestonesBetween(prevSnap, snap, { stations: n, interchangeIdx });
      setPrevSnap(snap);
      if (ms.length === 0) return;
      const texts = ms.map((m) => {
        switch (m.kind) {
          case 'passed':
            return `Passed ${names[m.idx]}`;
          case 'halfway':
            return 'Halfway there';
          case 'tunnel-in':
            return 'Heading underground';
          case 'tunnel-out':
            return 'Back above ground';
          case 'interchange':
            return `Next: change trains at ${names[m.idx]}`;
          case 'approaching':
            return `Approaching ${names[n - 1]}`;
          case 'arrived':
            return 'You’ve arrived';
        }
      });
      setToasts((q) => [...q, ...texts.map((text, i) => ({ id: Date.now() + i, text }))].slice(-3));
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap]);
  const toast = toasts[0] ?? null;
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToasts((q) => q.slice(1)), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // ----- banners
  const banners: { tone: Tone; text: string; action?: { label: string; onPress: () => void }; icon: 'warn' | 'info' }[] = [];
  if (p.permission === 'denied' && source !== 'demo' && source !== 'checkin') {
    banners.push({ tone: 'warn', icon: 'warn', text: 'Location is off, so MetroMate can’t place the train. Tap “I’m here” on a station, or turn location on.', action: p.canAskAgain ? { label: 'Allow', onPress: p.onRequestLocation } : undefined });
  } else if (p.permission === 'unavailable' && source !== 'demo' && source !== 'checkin') {
    banners.push({ tone: 'warn', icon: 'warn', text: 'This device can’t provide location. Use “I’m here” check-ins to follow your journey.' });
  } else if ((p.permission === 'checking' || (p.permission === 'granted' && !p.fix)) && progress === null) {
    banners.push({ tone: 'info', icon: 'info', text: 'Finding your position… Step outdoors or near a window if it takes a while.' });
  } else if (p.signal === 'stale' && source === 'gps') {
    banners.push({ tone: 'info', icon: 'info', text: 'Location updates are a little late. The train position may lag.' });
  }
  if (p.offRouteM !== null && progress === null && source !== 'demo') {
    banners.push({ tone: 'warn', icon: 'warn', text: `You seem to be about ${p.offRouteM >= 1000 ? `${(p.offRouteM / 1000).toFixed(1)} km` : `${p.offRouteM} m`} from this route. Use check-ins if GPS is unreliable.` });
  }
  if (p.headingAway) banners.push({ tone: 'warn', icon: 'warn', text: `You seem to be moving back towards ${names[0]}. Check you boarded the right train.` });
  if (p.online === false && banners.length < 2) banners.push({ tone: 'info', icon: 'info', text: 'Offline: your position and the stored estimates still work.' });
  if (!geom && banners.length < 2) banners.push({ tone: 'info', icon: 'info', text: 'Some station positions are missing, so the illustration is off. The information below still works.' });

  const chip = source ? SOURCE_CHIP[source] : null;
  const tintColor = p.look.night > 0.2 ? '#0B0C3A' : '#FFD9B8';

  const fallbackScene = (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#E9EBF7', alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
      <MapPinOff size={28} color={SLATE} />
      <Text style={{ color: SLATE, marginTop: 8, textAlign: 'center' }}>The illustrated map isn’t available. Your journey information is shown below.</Text>
    </View>
  );

  const sheetMax = Math.round(size.h * 0.5);

  return (
    <View style={styles.root} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View style={StyleSheet.absoluteFill}>
        {geom ? (
          <SceneBoundary fallback={fallbackScene}>
            <JourneyScene
              geom={geom}
              names={names}
              interchange={interchangeFlags}
              hopColors={hopColors}
              progress={progress ?? 0}
              nextIdx={nextIdx}
              estimated={source === 'estimated' || source === 'last-seen'}
              underground={underground}
              showTrain={progress !== null}
              width={size.w}
              height={size.h}
              zoom={zoom}
              animate={p.animate}
              smooth={!p.reduceMotion}
              night={p.look.night}
              tint={tintColor}
            />
          </SceneBoundary>
        ) : (
          fallbackScene
        )}
      </View>

      {/* header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close live view (tracking continues)" onPress={p.onMinimize} style={styles.roundBtn} hitSlop={6}>
            <X size={22} color={NAVY} />
          </Pressable>
          <View style={[styles.glass, styles.titleCard]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.titleText} numberOfLines={1}>
                  {names[0]}
                </Text>
                <ArrowRight size={14} color={SLATE} />
                <Text style={[styles.titleText, { flexShrink: 1 }]} numberOfLines={1}>
                  {names[n - 1]}
                </Text>
              </View>
            </View>
            {chip ? (
              <View style={[styles.chip, { backgroundColor: chip.bg }]} accessibilityLabel={`Position source: ${chip.label}`}>
                <View style={[styles.liveDot, { backgroundColor: chip.fg }]} />
                <Text style={[styles.chipText, { color: chip.fg }]}>{chip.label}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {banners.slice(0, 2).map((b) => (
          <View key={b.text} style={[styles.banner, { backgroundColor: TONE[b.tone].bg }]} accessibilityLiveRegion="polite">
            {b.icon === 'warn' ? <TriangleAlert size={16} color={TONE[b.tone].fg} /> : <Info size={16} color={TONE[b.tone].fg} />}
            <Text style={[styles.bannerText, { color: TONE[b.tone].fg }]}>{b.text}</Text>
            {b.action ? (
              <Pressable accessibilityRole="button" onPress={b.action.onPress} style={styles.bannerBtn}>
                <Text style={[styles.bannerBtnText, { color: TONE[b.tone].fg }]}>{b.action.label}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      {/* floating information */}
      <View style={[styles.floating, { top: insets.top + 8 + 52 + Math.min(2, banners.length) * 46 + 12 }]} pointerEvents="box-none">
        <View style={[styles.glass, styles.etaCard]} accessibilityLiveRegion="polite">
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
            <Text style={styles.etaBig} accessibilityLabel={shownMinutes === null ? 'Time remaining unavailable' : `${formatDuration(shownMinutes)} remaining`}>
              {shownMinutes === null ? '—' : shownMinutes >= 60 ? `${Math.floor(shownMinutes / 60)}h ${String(shownMinutes % 60).padStart(2, '0')}` : shownMinutes}
            </Text>
            {shownMinutes !== null && shownMinutes < 60 ? <Text style={styles.etaUnit}>min</Text> : null}
          </View>
          <Text style={styles.etaCaption}>{arrived ? 'You’ve arrived' : progress === null ? 'Estimated trip time' : 'Estimated time to destination'}</Text>
          {arrivalMs !== null && !arrived ? (
            <Text style={styles.arrival}>
              Arrive about <Text style={{ fontWeight: '800', color: NAVY }}>{formatClock(arrivalMs)}</Text>
            </Text>
          ) : null}
          {!arrived ? <Text style={styles.basis}>{hop ? (eta.kind === 'adjusted' ? 'Estimate · adjusted to your pace' : hop.basis === 'calculator' ? 'Estimate · GMRC calculator time' : 'Estimate · GMRC published times') : 'No time estimate for this route'}</Text> : null}
          <View style={styles.progressWrap} accessibilityLabel={`${reached} of ${n} stations, ${pct} percent`}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(2, Math.min(100, pct))}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {reached} of {n} stations · {pct}%
            </Text>
          </View>
        </View>
        <View style={{ gap: 8, alignItems: 'flex-end' }}>
          <View style={[styles.glass, styles.moveChip]}>
            <Text style={styles.moveText}>{MOVEMENT_LABEL[movement]}</Text>
          </View>
          {speedKmh !== null ? (
            <View style={[styles.glass, styles.speedCard]} accessibilityLabel={`Speed ${speedKmh} kilometres per hour`}>
              <Text style={styles.speedBig}>{speedKmh}</Text>
              <Text style={styles.speedUnit}>km/h</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* bottom: next stop + sheet */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
        {toast ? <Toast key={toast.id} text={toast.text} reduce={p.reduceMotion} /> : null}
        {arrived ? <Arrival name={names[n - 1]} reduce={p.reduceMotion} onDone={p.onEnd} /> : null}
        {nextIdx !== null && !arrived ? (
          <View style={[styles.glass, styles.nextCard]} accessibilityLiveRegion="polite">
            <View style={styles.nextIcon}>
              <TrainFront size={20} color={VIOLET} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.nextLabel}>{interchangeIdx.has(nextIdx) ? 'Change trains at' : movement === 'approaching' ? 'Approaching' : 'Next stop'}</Text>
              <Text style={styles.nextName} numberOfLines={1}>
                {names[nextIdx]}
              </Text>
              <Text style={styles.nextSub}>
                {minutesToNext !== null ? `About ${minutesToNext} min` : 'Time unavailable'}
                {base?.distanceToNextM != null && !tunnelEst ? ` · ${base.distanceToNextM >= 1000 ? (base.distanceToNextM / 1000).toFixed(1) + ' km' : base.distanceToNextM + ' m'}` : ''}
                {isUnderground(ids[nextIdx]) ? ' · underground' : ''}
              </Text>
            </View>
            {interchangeIdx.has(nextIdx) ? (
              <View style={[styles.chip, { backgroundColor: colors.interchangeSoft }]}>
                <Text style={[styles.chipText, { color: colors.warn }]}>Interchange</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.glass, styles.sheet]}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={expanded ? 'Hide stops and details' : 'Show all stops and details'} onPress={() => setExpanded((e) => !e)} style={styles.handleRow} hitSlop={6}>
            <View style={styles.handle} />
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: TONE[status.tone].fg }]} />
              <Text style={styles.statusText} accessibilityLiveRegion="polite">
                {status.text}
              </Text>
              {expanded ? <ChevronDown size={18} color={SLATE} /> : <ChevronUp size={18} color={SLATE} />}
            </View>
          </Pressable>

          <View style={styles.controls}>
            <CtrlBtn icon={LocateFixed} label="Recenter and reset zoom" onPress={() => setZoom(DEFAULT_ZOOM)} />
            <CtrlBtn icon={Minus} label="Zoom out" onPress={() => setZoom((z) => Math.max(0.8, Math.round((z - 0.25) * 100) / 100))} />
            <CtrlBtn icon={Plus} label="Zoom in" onPress={() => setZoom((z) => Math.min(2.4, Math.round((z + 0.25) * 100) / 100))} />
            <CtrlBtn icon={p.wake ? Bell : BellOff} label={p.wake ? `Mute arrival alert for ${names[n - 1]}` : `Alert me near ${names[n - 1]}`} onPress={() => p.onWake(!p.wake)} active={p.wake} />
            <Pressable accessibilityRole="button" accessibilityLabel="End tracking" onPress={p.onEnd} style={styles.endBtn}>
              <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.endText}>End</Text>
            </Pressable>
          </View>

          {expanded ? (
            <ScrollView style={{ maxHeight: sheetMax }} contentContainerStyle={{ paddingBottom: 6 }} showsVerticalScrollIndicator={false}>
              <View style={styles.grid}>
                <Stat label="Stations left" value={arrived ? '0' : progress === null ? String(n - 1) : String(n - 1 - lastIdx)} />
                <Stat label="Next change" value={nextChange ? `${names[nextChange.idx]}` : 'None'} />
                <Stat label="On board" value={onBoardMin === null ? '—' : formatDuration(onBoardMin)} />
                <Stat label="Trip estimate" value={totalMin === null ? '—' : formatDuration(totalMin)} />
                <Stat label="Delay" value={eta.behindMin ? `~${eta.behindMin} min behind` : onBoardMin === null ? 'Not started' : 'None detected'} />
                <Stat label="Service alerts" value="Not available" />
              </View>

              <Text style={styles.sectionLabel}>Stops (estimated times)</Text>
              {ids.map((id, idx) => {
                const done = progress !== null && idx < lastIdx;
                const here = atIdx === idx;
                const isNext = idx === nextIdx;
                const mins = hop && progress !== null && idx > lastIdx - (here ? 1 : 0) && !done && !here ? minutesToProgress(hop, progress, idx, pace) : null;
                return (
                  <View key={id} style={styles.stopRow}>
                    <View style={styles.stopRail}>
                      <View style={[styles.stopDot, done && { backgroundColor: VIOLET, borderColor: VIOLET }, (here || isNext) && { borderColor: colors.interchange, borderWidth: 4 }, idx === n - 1 && { borderColor: colors.destination }]} />
                      {idx < n - 1 ? <View style={[styles.stopLine, done && { backgroundColor: VIOLET, opacity: 0.6 }]} /> : null}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.stopName, done && { color: SLATE }, (here || isNext) && { fontWeight: '800' }]} numberOfLines={1}>
                        {names[idx]}
                      </Text>
                      <Text style={styles.stopSub} numberOfLines={1}>
                        {[interchangeIdx.has(idx) ? 'Change trains' : null, isUnderground(id) ? 'Underground' : null, here ? 'You are here' : isNext ? 'Next' : null].filter(Boolean).join(' · ') || ' '}
                      </Text>
                    </View>
                    {done ? <Check size={16} color={VIOLET} /> : mins !== null && p.nowMs ? <Text style={styles.stopTime}>≈ {formatClock(p.nowMs + mins * 60_000)}</Text> : null}
                    {!done && !here ? (
                      <Pressable accessibilityRole="button" accessibilityLabel={`I’m at ${names[idx]}`} onPress={() => p.onCheckIn(idx)} style={styles.checkBtn} hitSlop={6}>
                        <Text style={styles.checkText}>I’m here</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}

              <View style={styles.demoRow}>
                <Pressable accessibilityRole="button" onPress={p.onDemo} style={styles.demoBtn}>
                  {p.demoRunning ? <Square size={14} color={VIOLET} /> : <Play size={14} color={VIOLET} />}
                  <Text style={styles.demoText}>{p.demoRunning ? 'Stop demo' : 'Run demo ride (simulated)'}</Text>
                </Pressable>
                {base?.source === 'checkin' ? (
                  <Pressable accessibilityRole="button" onPress={p.onClearCheckIn} style={styles.demoBtn}>
                    <Text style={styles.demoText}>Clear check-in</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.notes}>
                <Layers size={14} color={SLATE} style={{ marginTop: 2 }} />
                <Text style={styles.noteText}>
                  Stations and the route are placed from the station map (estimated pins); the track between stations is drawn straight with soft corners, and the surroundings are illustrative, not a street map. Tunnels follow the dataset’s underground stations; tunnel portals are placed mid-way between stations because their real positions aren’t known.
                </Text>
              </View>
              <View style={styles.notes}>
                <Info size={14} color={SLATE} style={{ marginTop: 2 }} />
                <Text style={styles.noteText}>
                  There is no live train feed. The train shows <Text style={{ fontWeight: '800' }}>your</Text> position. Times are estimates from GMRC’s published figures, adjusted to your own pace, and don’t include time to change trains. Speed appears only when your phone reports a reliable one. {plural(p.route.stopCount, 'stop')} on this journey.
                </Text>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ pieces

function CtrlBtn({ icon: Icon, label, onPress, active }: { icon: typeof Plus; label: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.ctrl, active && { backgroundColor: '#ECE9FF' }, pressed && { opacity: 0.8 }]} hitSlop={4}>
      <Icon size={20} color={VIOLET} />
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Toast({ text, reduce }: { text: string; reduce: boolean }) {
  const [v] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) return;
    const a = Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(v, { toValue: 0, duration: 340, useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
  }, [v, reduce]);
  return (
    <Animated.View style={[styles.toast, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]} accessibilityLiveRegion="polite">
      <Text style={styles.toastText}>{text}</Text>
    </Animated.View>
  );
}

function Arrival({ name, reduce, onDone }: { name: string; reduce: boolean; onDone: () => void }) {
  const [v] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) return;
    const a = Animated.spring(v, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [v, reduce]);
  return (
    <Animated.View style={[styles.glass, styles.arrivalCard, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]} accessibilityLiveRegion="assertive">
      <View style={styles.arrivalBadge}>
        <Check size={28} color="#FFFFFF" strokeWidth={3} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.arrivalTitle}>You’ve arrived</Text>
        <Text style={styles.arrivalSub} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={onDone} style={styles.arrivalBtn}>
        <Text style={styles.arrivalBtnText}>Done</Text>
      </Pressable>
    </Animated.View>
  );
}

// ------------------------------------------------------------------ styles

const GLASS = 'rgba(255,255,255,0.94)';
const shadow = { shadowColor: '#2A1F8F', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 } as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E9EBF7' },
  glass: { backgroundColor: GLASS, borderRadius: 22, borderWidth: 1, borderColor: LINE, ...shadow },
  header: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 12, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roundBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: GLASS, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LINE, ...shadow },
  titleCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 14, borderRadius: 24 },
  titleText: { fontSize: 15, fontWeight: '800', color: NAVY, flexShrink: 1 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 24, borderRadius: 99 },
  chipText: { fontSize: 11, fontWeight: '800' },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 38, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  bannerText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  bannerBtn: { paddingHorizontal: 10, height: 28, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  bannerBtnText: { fontSize: 12, fontWeight: '800' },
  toast: { alignSelf: 'center', backgroundColor: '#14163F', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, ...shadow },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  floating: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  etaCard: { flex: 1, maxWidth: 250, paddingHorizontal: 14, paddingVertical: 11 },
  etaBig: { fontSize: 38, fontWeight: '800', color: NAVY, letterSpacing: -1, lineHeight: 42 },
  etaUnit: { fontSize: 15, fontWeight: '700', color: NAVY, marginBottom: 5 },
  etaCaption: { fontSize: 11.5, color: SLATE, fontWeight: '600', marginTop: -1 },
  arrival: { fontSize: 13, color: '#39425E', marginTop: 5 },
  basis: { fontSize: 10.5, color: VIOLET, fontWeight: '700', marginTop: 3 },
  progressWrap: { marginTop: 9, gap: 5 },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#E6E3FA', overflow: 'hidden' },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: VIOLET },
  progressText: { fontSize: 11.5, color: '#39425E', fontWeight: '700' },
  moveChip: { paddingHorizontal: 12, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  moveText: { fontSize: 12, fontWeight: '800', color: NAVY },
  speedCard: { minWidth: 70, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', borderRadius: 18 },
  speedBig: { fontSize: 24, fontWeight: '800', color: NAVY, lineHeight: 26 },
  speedUnit: { fontSize: 11, color: SLATE, fontWeight: '700' },

  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 10, gap: 8 },
  nextCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  nextIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#ECE9FF', alignItems: 'center', justifyContent: 'center' },
  nextLabel: { fontSize: 11, color: SLATE, fontWeight: '700' },
  nextName: { fontSize: 18, fontWeight: '800', color: NAVY, letterSpacing: -0.3 },
  nextSub: { fontSize: 12, color: '#39425E', marginTop: 1 },
  sheet: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10, borderRadius: 26 },
  handleRow: { alignItems: 'center', paddingBottom: 6 },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#D5D8EA', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusText: { flex: 1, fontSize: 13.5, fontWeight: '700', color: NAVY, lineHeight: 18 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  ctrl: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#F3F1FF', alignItems: 'center', justifyContent: 'center' },
  endBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 7, height: 46, paddingHorizontal: 18, borderRadius: 23, backgroundColor: '#D92D20' },
  endText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  stat: { flexBasis: '31%', flexGrow: 1, backgroundColor: '#F4F3FD', borderRadius: 12, padding: 9 },
  statLabel: { fontSize: 10.5, color: SLATE, fontWeight: '700' },
  statValue: { fontSize: 13, fontWeight: '800', color: NAVY, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: NAVY, marginTop: 14, marginBottom: 4 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46 },
  stopRail: { width: 18, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  stopDot: { width: 13, height: 13, borderRadius: 7, borderWidth: 3, borderColor: '#B9B6E8', backgroundColor: '#FFFFFF', zIndex: 1 },
  stopLine: { position: 'absolute', top: '50%', bottom: -23, width: 3, backgroundColor: '#D9D6F2' },
  stopName: { fontSize: 14, fontWeight: '600', color: NAVY },
  stopSub: { fontSize: 11, color: SLATE },
  stopTime: { fontSize: 12, color: '#39425E', fontWeight: '700' },
  checkBtn: { paddingHorizontal: 10, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#D9DCF0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  checkText: { fontSize: 11.5, fontWeight: '800', color: VIOLET },
  demoRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  demoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 20, backgroundColor: '#F3F1FF' },
  demoText: { fontSize: 12.5, fontWeight: '800', color: VIOLET },
  notes: { flexDirection: 'row', gap: 8, marginTop: 10 },
  noteText: { flex: 1, fontSize: 11, color: SLATE, lineHeight: 15.5 },

  arrivalCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  arrivalBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#22B573', alignItems: 'center', justifyContent: 'center' },
  arrivalTitle: { fontSize: 18, fontWeight: '800', color: NAVY },
  arrivalSub: { fontSize: 13.5, color: '#39425E', marginTop: 1 },
  arrivalBtn: { height: 44, paddingHorizontal: 22, borderRadius: 22, backgroundColor: VIOLET, alignItems: 'center', justifyContent: 'center' },
  arrivalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
