import React, { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Bell, BellOff, Check, ChevronDown, ChevronUp, LocateFixed, Minus, Play, Plus, Square, TrainFront, TriangleAlert, X, Info, Layers, MapPinOff } from 'lucide-react-native';
import { JourneyScene } from './JourneyScene';
import { buildGeometry, distanceAtProgress, isUndergroundAt } from '../../lib/journeyModel';
import { estimateThroughTunnel, hopMinutes, INITIAL_ETA, minutesToProgress, stepEta, type EtaOutput, type HopTimes } from '../../lib/eta';
import { milestonesBetween, milestoneText, movementLabel, movementState, reliableSpeedKmh, statusMessage, type Snapshot, type StatusInput, type Tone } from '../../lib/journeyStatus';
import { distanceText, durationText } from '../../lib/liveText';
import { formatClock } from '../../lib/format';
import { useT } from '../../i18n/useT';
import type { MessageKey } from '../../i18n/messages';
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

const SOURCE_CHIP: Record<PositionSource | 'estimated', { label: MessageKey; fg: string; bg: string }> = {
  gps: { label: 'live.journey.source.gps', fg: '#0F6B3E', bg: '#E5F7EC' },
  'last-seen': { label: 'live.journey.source.lastSeen', fg: colors.warn, bg: colors.warnSoft },
  checkin: { label: 'live.journey.source.checkin', fg: VIOLET, bg: '#ECE9FF' },
  demo: { label: 'live.journey.source.demo', fg: colors.destination, bg: colors.destinationSoft },
  estimated: { label: 'live.journey.source.estimated', fg: VIOLET, bg: '#ECE9FF' },
};

/** Splits "plain *bold* plain" into text with the starred part in bold (used so translations can place the emphasis). */
function Emphasis({ text, color }: { text: string; color?: string }) {
  return (
    <>
      {text.split('*').map((part, i) => (i % 2 === 1 ? (
        <Text key={i} style={{ fontWeight: '800', ...(color ? { color } : null) }}>
          {part}
        </Text>
      ) : (
        part
      )))}
    </>
  );
}

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
    const timer = setTimeout(() => {
      setOut((prev) => {
        const next = stepEta(prev.state, { nowMs, progress, hop, fromGps });
        if (next.updated) setUpdatedAt(nowMs);
        return next;
      });
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, qProgress, hop, fromGps]);
  return { out, updatedAt };
}

// ------------------------------------------------------------------ screen

export function JourneyScreen(p: JourneyScreenProps) {
  const { t, tn, lang } = useT();
  // Hindi and Gujarati are taller than English: give wrapped text more line height so nothing is clipped.
  const indic = lang !== 'en';
  const lh = (en: number) => (indic ? { lineHeight: Math.round(en * 1.3) } : null);
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const [size, setSize] = useState({ w: win.width, h: win.height });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [expanded, setExpanded] = useState(false);
  /** Measured height of the header (title + banners), so the floating cards always sit just below it. */
  const [headerH, setHeaderH] = useState(0);

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
  const statusInput: StatusInput = {
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
  };
  const status = statusMessage(statusInput, t);

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
  const arriving = !!base?.arriving && !tunnelEst;
  const prevSnap = useRef<Snapshot | null>(null);
  useEffect(() => {
    if (progress === null) return;
    const snap: Snapshot = { progress, underground, arriving, arrived };
    const timer = setTimeout(() => {
      const ms = milestonesBetween(prevSnap.current, snap, { stations: n, interchangeIdx });
      prevSnap.current = snap;
      if (ms.length === 0) return;
      const texts = ms.map((m) => milestoneText(m, names, t));
      setToasts((q) => [...q, ...texts.map((text, i) => ({ id: Date.now() + i, text }))].slice(-3));
    }, 0);
    return () => clearTimeout(timer);
    // The milestones only need to be recomputed when the position state changes, not when names / language change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, underground, arriving, arrived]);
  const toast = toasts[0] ?? null;
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToasts((q) => q.slice(1)), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // ----- banners
  const banners: { tone: Tone; text: string; action?: { label: string; onPress: () => void }; icon: 'warn' | 'info' }[] = [];
  if (p.permission === 'denied' && source !== 'demo' && source !== 'checkin') {
    banners.push({ tone: 'warn', icon: 'warn', text: t('live.journey.banner.locOff'), action: p.canAskAgain ? { label: t('live.journey.allow'), onPress: p.onRequestLocation } : undefined });
  } else if (p.permission === 'unavailable' && source !== 'demo' && source !== 'checkin') {
    banners.push({ tone: 'warn', icon: 'warn', text: t('live.journey.banner.unavailable') });
  } else if ((p.permission === 'checking' || (p.permission === 'granted' && !p.fix)) && progress === null) {
    banners.push({ tone: 'info', icon: 'info', text: t('live.journey.banner.finding') });
  } else if (p.signal === 'stale' && source === 'gps') {
    banners.push({ tone: 'info', icon: 'info', text: t('live.journey.banner.stale') });
  }
  if (p.offRouteM !== null && progress === null && source !== 'demo') {
    banners.push({ tone: 'warn', icon: 'warn', text: t('live.journey.banner.offRoute', { dist: distanceText(p.offRouteM, t) }) });
  }
  if (p.headingAway) banners.push({ tone: 'warn', icon: 'warn', text: t('live.journey.banner.headingAway', { name: names[0] }) });
  if (p.online === false && banners.length < 2) banners.push({ tone: 'info', icon: 'info', text: t('live.journey.banner.offline') });
  if (!geom && banners.length < 2) banners.push({ tone: 'info', icon: 'info', text: t('live.journey.banner.noGeom') });

  const chip = source ? SOURCE_CHIP[source] : null;
  const tintColor = p.look.night > 0.2 ? '#0B0C3A' : '#FFD9B8';

  const fallbackScene = (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#E9EBF7', alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
      <MapPinOff size={28} color={SLATE} />
      <Text style={[{ color: SLATE, marginTop: 8, textAlign: 'center' }, lh(14)]}>{t('live.journey.sceneFallback')}</Text>
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
      <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none" onLayout={(e) => setHeaderH(Math.round(e.nativeEvent.layout.height))}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('live.journey.close.a11y')} onPress={p.onMinimize} style={styles.roundBtn} hitSlop={6}>
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
              <View style={[styles.chip, { backgroundColor: chip.bg }]} accessibilityLabel={t('live.journey.source.a11y', { label: t(chip.label) })}>
                <View style={[styles.liveDot, { backgroundColor: chip.fg }]} />
                <Text style={[styles.chipText, { color: chip.fg }, lh(11)]}>{t(chip.label)}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {banners.slice(0, 2).map((b) => (
          <View key={b.text} style={[styles.banner, { backgroundColor: TONE[b.tone].bg }]} accessibilityLiveRegion="polite">
            {b.icon === 'warn' ? <TriangleAlert size={16} color={TONE[b.tone].fg} /> : <Info size={16} color={TONE[b.tone].fg} />}
            <Text style={[styles.bannerText, { color: TONE[b.tone].fg }, lh(16)]}>{b.text}</Text>
            {b.action ? (
              <Pressable accessibilityRole="button" onPress={b.action.onPress} style={styles.bannerBtn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Text style={[styles.bannerBtnText, { color: TONE[b.tone].fg }]}>{b.action.label}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      {/* floating information */}
      <View style={[styles.floating, { top: (headerH > 0 ? headerH : insets.top + 8 + 52 + Math.min(2, banners.length) * 46) + 12 }]} pointerEvents="box-none">
        <View style={[styles.glass, styles.etaCard]} accessibilityLiveRegion="polite">
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
            <Text style={styles.etaBig} accessibilityLabel={shownMinutes === null ? t('live.journey.remaining.unavailable') : t('live.journey.remaining.a11y', { duration: durationText(shownMinutes, t) })}>
              {shownMinutes === null ? '—' : shownMinutes >= 60 ? t('live.journey.etaHours', { h: Math.floor(shownMinutes / 60), m: String(shownMinutes % 60).padStart(2, '0') }) : shownMinutes}
            </Text>
            {shownMinutes !== null && shownMinutes < 60 ? <Text style={styles.etaUnit}>{t('live.journey.minUnit')}</Text> : null}
          </View>
          <Text style={[styles.etaCaption, lh(11.5)]}>{arrived ? t('live.journey.arrived') : progress === null ? t('live.journey.tripTime') : t('live.journey.timeToDest')}</Text>
          {arrivalMs !== null && !arrived ? (
            <Text style={[styles.arrival, lh(13)]}>
              <Emphasis text={t('live.journey.arriveAbout', { time: formatClock(arrivalMs) })} color={NAVY} />
            </Text>
          ) : null}
          {!arrived ? <Text style={[styles.basis, lh(10.5)]}>{hop ? (eta.kind === 'adjusted' ? t('live.journey.basis.adjusted') : hop.basis === 'calculator' ? t('live.journey.basis.calculator') : t('live.journey.basis.published')) : t('live.journey.basis.none')}</Text> : null}
          <View style={styles.progressWrap} accessibilityLabel={t('live.journey.progress.a11y', { reached, n, pct })}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(2, Math.min(100, pct))}%` }]} />
            </View>
            <Text style={[styles.progressText, lh(11.5)]}>{t('live.journey.progress', { reached, n, pct })}</Text>
          </View>
        </View>
        <View style={{ gap: 8, alignItems: 'flex-end' }}>
          <View style={[styles.glass, styles.moveChip]}>
            <Text style={[styles.moveText, lh(12)]}>{movementLabel(movement, t)}</Text>
          </View>
          {speedKmh !== null ? (
            <View style={[styles.glass, styles.speedCard]} accessibilityLabel={t('live.journey.speed.a11y', { v: speedKmh })}>
              <Text style={styles.speedBig}>{speedKmh}</Text>
              <Text style={[styles.speedUnit, lh(11)]}>{t('live.unit.kmh')}</Text>
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
              <Text style={[styles.nextLabel, lh(11)]}>{interchangeIdx.has(nextIdx) ? t('live.journey.next.change') : movement === 'approaching' ? t('live.move.approaching') : t('live.journey.next.stop')}</Text>
              <Text style={styles.nextName} numberOfLines={1}>
                {names[nextIdx]}
              </Text>
              <Text style={[styles.nextSub, lh(12)]}>
                {minutesToNext !== null ? t('live.journey.next.about', { v: minutesToNext }) : t('live.journey.next.noTime')}
                {base?.distanceToNextM != null && !tunnelEst ? ` · ${distanceText(base.distanceToNextM, t)}` : ''}
                {isUnderground(ids[nextIdx]) ? ` · ${t('live.journey.next.underground')}` : ''}
              </Text>
            </View>
            {interchangeIdx.has(nextIdx) ? (
              <View style={[styles.chip, { backgroundColor: colors.interchangeSoft }]}>
                <Text style={[styles.chipText, { color: colors.warn }, lh(11)]}>{t('live.journey.interchange')}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.glass, styles.sheet]}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={expanded ? t('live.journey.sheet.hide.a11y') : t('live.journey.sheet.show.a11y')} onPress={() => setExpanded((e) => !e)} style={styles.handleRow} hitSlop={6}>
            <View style={styles.handle} />
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: TONE[status.tone].fg }]} />
              <Text style={[styles.statusText, lh(18)]} accessibilityLiveRegion="polite">
                {status.text}
              </Text>
              {expanded ? <ChevronDown size={18} color={SLATE} /> : <ChevronUp size={18} color={SLATE} />}
            </View>
          </Pressable>

          <View style={styles.controls}>
            <CtrlBtn icon={LocateFixed} label={t('live.journey.ctrl.recenter')} onPress={() => setZoom(DEFAULT_ZOOM)} />
            <CtrlBtn icon={Minus} label={t('live.journey.ctrl.zoomOut')} onPress={() => setZoom((z) => Math.max(0.8, Math.round((z - 0.25) * 100) / 100))} />
            <CtrlBtn icon={Plus} label={t('live.journey.ctrl.zoomIn')} onPress={() => setZoom((z) => Math.min(2.4, Math.round((z + 0.25) * 100) / 100))} />
            <CtrlBtn icon={p.wake ? Bell : BellOff} label={p.wake ? t('live.journey.ctrl.muteAlert', { name: names[n - 1] }) : t('live.journey.ctrl.alertMe', { name: names[n - 1] })} onPress={() => p.onWake(!p.wake)} active={p.wake} />
            <Pressable accessibilityRole="button" accessibilityLabel={t('live.journey.end.a11y')} onPress={p.onEnd} style={styles.endBtn}>
              <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.endText}>{t('live.journey.end')}</Text>
            </Pressable>
          </View>

          {expanded ? (
            <ScrollView style={{ maxHeight: sheetMax }} contentContainerStyle={{ paddingBottom: 6 }} showsVerticalScrollIndicator={false}>
              <View style={styles.grid}>
                <Stat label={t('live.journey.stat.left')} value={arrived ? '0' : progress === null ? String(n - 1) : String(n - 1 - lastIdx)} lh={lh} />
                <Stat label={t('live.journey.stat.nextChange')} value={nextChange ? `${names[nextChange.idx]}` : t('live.journey.stat.none')} lh={lh} />
                <Stat label={t('live.journey.stat.onBoard')} value={onBoardMin === null ? '—' : durationText(onBoardMin, t)} lh={lh} />
                <Stat label={t('live.journey.stat.tripEstimate')} value={totalMin === null ? '—' : durationText(totalMin, t)} lh={lh} />
                <Stat label={t('live.journey.stat.delay')} value={eta.behindMin ? t('live.journey.stat.behind', { n: eta.behindMin }) : onBoardMin === null ? t('live.journey.stat.notStarted') : t('live.journey.stat.noneDetected')} lh={lh} />
                <Stat label={t('live.journey.stat.alerts')} value={t('live.journey.stat.notAvailable')} lh={lh} />
              </View>

              <Text style={[styles.sectionLabel, lh(12)]}>{t('live.journey.stops.title')}</Text>
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
                      <Text style={[styles.stopSub, lh(11)]}>
                        {[interchangeIdx.has(idx) ? t('live.journey.stop.change') : null, isUnderground(id) ? t('live.journey.stop.underground') : null, here ? t('live.journey.stop.here') : isNext ? t('live.journey.stop.next') : null].filter(Boolean).join(' · ') || ' '}
                      </Text>
                    </View>
                    {done ? <Check size={16} color={VIOLET} /> : mins !== null && p.nowMs ? <Text style={styles.stopTime}>≈ {formatClock(p.nowMs + mins * 60_000)}</Text> : null}
                    {!done && !here ? (
                      <Pressable accessibilityRole="button" accessibilityLabel={t('live.journey.imAt.a11y', { name: names[idx] })} onPress={() => p.onCheckIn(idx)} style={styles.checkBtn} hitSlop={8}>
                        <Text style={[styles.checkText, lh(11.5)]}>{t('live.journey.imHere')}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}

              <View style={styles.demoRow}>
                <Pressable accessibilityRole="button" onPress={p.onDemo} style={styles.demoBtn}>
                  {p.demoRunning ? <Square size={14} color={VIOLET} /> : <Play size={14} color={VIOLET} />}
                  <Text style={[styles.demoText, lh(12.5)]}>{p.demoRunning ? t('live.journey.demo.stop') : t('live.journey.demo.run')}</Text>
                </Pressable>
                {base?.source === 'checkin' ? (
                  <Pressable accessibilityRole="button" onPress={p.onClearCheckIn} style={styles.demoBtn}>
                    <Text style={[styles.demoText, lh(12.5)]}>{t('live.journey.clearCheckin')}</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.notes}>
                <Layers size={14} color={SLATE} style={{ marginTop: 2 }} />
                <Text style={[styles.noteText, lh(15.5)]}>{t('live.journey.note.drawing')}</Text>
              </View>
              <View style={styles.notes}>
                <Info size={14} color={SLATE} style={{ marginTop: 2 }} />
                <Text style={[styles.noteText, lh(15.5)]}>
                  <Emphasis text={t('live.journey.note.noFeed')} /> {tn('live.journey.stopsOnJourney', p.route.stopCount)}
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

function Stat({ label, value, lh }: { label: string; value: string; lh: (en: number) => { lineHeight: number } | null }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, lh(10.5)]}>{label}</Text>
      <Text style={[styles.statValue, lh(13)]}>{value}</Text>
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
  const { t } = useT();
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
        <Text style={styles.arrivalTitle}>{t('live.journey.arrived')}</Text>
        <Text style={styles.arrivalSub} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('live.journey.done')} onPress={onDone} style={styles.arrivalBtn}>
        <Text style={styles.arrivalBtnText}>{t('live.journey.done')}</Text>
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
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, minHeight: 24, borderRadius: 99 },
  chipText: { fontSize: 11, fontWeight: '800' },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 38, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  bannerText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  bannerBtn: { paddingHorizontal: 10, minHeight: 28, paddingVertical: 3, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
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
  moveChip: { paddingHorizontal: 12, paddingVertical: 5, minHeight: 32, maxWidth: 150, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
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
  endBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 46, paddingHorizontal: 18, borderRadius: 23, backgroundColor: '#D92D20' },
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
  checkBtn: { paddingHorizontal: 10, paddingVertical: 4, minHeight: 32, borderRadius: 15, borderWidth: 1, borderColor: '#D9DCF0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  checkText: { fontSize: 11.5, fontWeight: '800', color: VIOLET },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  demoBtn: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 6, paddingHorizontal: 14, paddingVertical: 6, minHeight: 44, borderRadius: 22, backgroundColor: '#F3F1FF' },
  demoText: { fontSize: 12.5, fontWeight: '800', color: VIOLET },
  notes: { flexDirection: 'row', gap: 8, marginTop: 10 },
  noteText: { flex: 1, fontSize: 11, color: SLATE, lineHeight: 15.5 },

  arrivalCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  arrivalBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#22B573', alignItems: 'center', justifyContent: 'center' },
  arrivalTitle: { fontSize: 18, fontWeight: '800', color: NAVY },
  arrivalSub: { fontSize: 13.5, color: '#39425E', marginTop: 1 },
  arrivalBtn: { minHeight: 44, paddingHorizontal: 22, borderRadius: 22, backgroundColor: VIOLET, alignItems: 'center', justifyContent: 'center' },
  arrivalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
