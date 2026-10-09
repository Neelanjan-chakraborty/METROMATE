import React, { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpDown, Check, ChevronRight, ChartNoAxesColumn, Crosshair, Leaf, Lightbulb, LocateFixed, MapPin, MapPinOff, Navigation, Radio, TrainFront, TriangleAlert, WifiOff, type LucideIcon } from 'lucide-react-native';
import { Button, Notice } from '../ui';
import { ButtonArt } from '../home/art';
import { WalkIcon } from '../home/icons';
import { useHomeScale } from '../home/scale';
import { colors } from '../../theme';
import type { LocationCardText, LocationIcon } from '../../lib/liveText';
import { ACCURACY_LABEL, classifyAccuracy, type Fix, type SignalState } from '../../lib/locator';
import type { PermissionState, Precision } from '../../hooks/useLocation';

export const NAVY = colors.text;
export const SLATE = colors.slate;
export const VIOLET = colors.primary;
export const CARD_LINE = '#E8EAF6';
const LAVENDER = '#F0EFFC';
const CHIP = '#EAE8FD';

type Z = (n: number) => number;

export function useLive() {
  const { z } = useHomeScale();
  const st = useMemo(() => makeStyles(z), [z]);
  return { z, st };
}

// ------------------------------------------------------------ Where am I?

interface WhereProps {
  permission: PermissionState;
  canAskAgain: boolean;
  servicesEnabled: boolean | null;
  onRequest: () => void;
  precision: Precision;
  onPrecision: (p: Precision) => void;
  signal: SignalState;
  fix: Fix | null;
  card: LocationCardText | null;
  /** Online-only walking directions to the nearest station, when there is one to walk to. */
  directionsUrl: string | null;
  error: string | null;
  coverage: { known: number; total: number; recorded: number };
}

const PANEL_ICON: Record<LocationIcon, LucideIcon | 'walk'> = { walk: 'walk', station: TrainFront, train: TrainFront, wait: MapPinOff, warn: TriangleAlert };

export function WhereAmICard(p: WhereProps) {
  const { z, st } = useLive();
  const [dirHint, setDirHint] = useState<string | null>(null);
  const acc = p.fix ? classifyAccuracy(p.fix.accuracyM) : null;
  const pill =
    p.signal === 'live'
      ? { label: 'Live', fg: '#0F6B3E', bg: '#E5F7EC', border: '#C4EBD3' }
      : p.signal === 'stale'
        ? { label: 'Updating…', fg: colors.warn, bg: colors.warnSoft, border: colors.warnBorder }
        : p.signal === 'lost'
          ? { label: 'Signal lost', fg: colors.offline, bg: colors.offlineSoft, border: '#F8CFCB' }
          : { label: 'Waiting for GPS', fg: colors.muted, bg: '#EEF0F5', border: '#E0E4EE' };

  const openDirections = () => {
    if (!p.directionsUrl) return;
    setDirHint(null);
    Linking.openURL(p.directionsUrl).catch(() => setDirHint('Directions need a maps app and an internet connection. Everything else here works offline.'));
  };

  const panelIcon = p.card ? PANEL_ICON[p.card.icon] : PANEL_ICON.wait;
  const PanelIcon = panelIcon === 'walk' ? null : panelIcon;

  return (
    <View style={st.card}>
      <View style={st.whereHead}>
        <View style={st.halo}>
          <View style={st.haloInner}>
            <MapPin size={z(18)} color="#FFFFFF" strokeWidth={2.2} />
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={st.cardTitle} accessibilityRole="header">
            Where am I?
          </Text>
          <Text style={st.cardSub}>Find your nearest metro station</Text>
        </View>
        {p.permission === 'granted' ? (
          <View style={[st.livePill, { backgroundColor: pill.bg, borderColor: pill.border }]} accessibilityLabel={`Signal: ${pill.label}`}>
            <Radio size={z(13)} color={pill.fg} strokeWidth={2.2} />
            <Text style={[st.livePillText, { color: pill.fg }]}>{pill.label}</Text>
          </View>
        ) : null}
      </View>

      {p.permission === 'checking' ? <Text style={st.caption}>Checking location permission…</Text> : null}

      {p.permission === 'unavailable' ? (
        <View style={st.block}>
          <Notice tone="warn" title="Location isn’t available here">
            This device or browser can’t provide location. You can still track a journey with manual check-ins below.
          </Notice>
        </View>
      ) : null}

      {p.permission === 'denied' ? (
        <View style={[st.block, { gap: z(10) }]}>
          <Text style={st.captionDark}>
            MetroMate uses your phone’s GPS to show which station you’re at and how far along your journey you are. It works with no internet. Location is used only while the app is open and is never sent anywhere.
          </Text>
          {p.canAskAgain ? (
            <Button label="Allow location" icon={Crosshair} onPress={p.onRequest} />
          ) : (
            <>
              <Notice tone="warn">Location is blocked for MetroMate. Turn it on in your phone’s app settings, then come back.</Notice>
              <Button label="Open settings" variant="secondary" onPress={() => void Linking.openSettings().catch(() => undefined)} />
            </>
          )}
        </View>
      ) : null}

      {p.permission === 'granted' ? (
        <>
          {p.servicesEnabled === false ? (
            <View style={st.block}>
              <Notice tone="warn" title="Location services are off">
                Turn on location in your phone’s quick settings to get a position.
              </Notice>
            </View>
          ) : null}

          <View style={st.panel} accessibilityLiveRegion="polite">
            <View style={st.panelIcon}>{PanelIcon ? <PanelIcon size={z(19)} color={NAVY} strokeWidth={2} /> : <WalkIcon size={z(21)} color={NAVY} strokeWidth={1.9} />}</View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {p.card ? (
                <>
                  <Text style={st.panelTitle}>{p.card.headline}</Text>
                  {p.card.lines.slice(0, 2).map((l) => (
                    <Text key={l} style={st.panelLine}>
                      {l}
                    </Text>
                  ))}
                </>
              ) : (
                <>
                  <Text style={st.panelTitle}>Finding you…</Text>
                  <Text style={st.panelLine}>Waiting for a location fix. Step outdoors or near a window if it takes a while.</Text>
                </>
              )}
            </View>
            {p.directionsUrl ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Get walking directions to the nearest station (opens a maps app, needs internet)" onPress={openDirections} style={({ pressed }) => [st.directions, pressed && { opacity: 0.85 }]}>
                <View style={st.directionsIcon}>
                  <Navigation size={z(13)} color={VIOLET} strokeWidth={2.2} />
                </View>
                <Text style={st.directionsText}>Get directions</Text>
                <ChevronRight size={z(14)} color={VIOLET} strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </View>
          {dirHint ? <Text style={[st.caption, { marginTop: z(8) }]}>{dirHint}</Text> : null}
          {p.fix?.mocked ? (
            <View style={st.block}>
              <Notice tone="warn">Your device reports this location as simulated (mock location).</Notice>
            </View>
          ) : null}
          {p.error ? (
            <View style={st.block}>
              <Notice tone="warn">{p.error}</Notice>
            </View>
          ) : null}

          <Text style={st.sourceLabel}>Location source</Text>
          <View style={st.segmentRow}>
            <Segment label="Precise (GPS)" icon={Crosshair} active={p.precision === 'precise'} onPress={() => p.onPrecision('precise')} />
            <Segment label="Battery saver" icon={Leaf} active={p.precision === 'saver'} onPress={() => p.onPrecision('saver')} />
          </View>

          <View style={st.fixRow}>
            <ChartNoAxesColumn size={z(17)} color={VIOLET} strokeWidth={2.4} />
            <Text style={st.fixText} numberOfLines={2}>
              {acc ? `Current fix: ${ACCURACY_LABEL[acc]}` : 'Current fix: waiting for GPS'}
            </Text>
            {p.fix && p.fix.accuracyM !== null ? (
              <View style={st.fixChip}>
                <Text style={st.fixChipText}>± {Math.round(p.fix.accuracyM)} m</Text>
              </View>
            ) : null}
          </View>

          <Text style={st.caption}>
            Station positions known: {p.coverage.known} of {p.coverage.total}
            {p.coverage.recorded > 0 ? ` (${p.coverage.recorded} recorded on this phone)` : ''}. Pins come from an unofficial map and may be a little off.
          </Text>
        </>
      ) : null}
    </View>
  );
}

function Segment({ label, icon: Icon, active, onPress }: { label: string; icon: LucideIcon; active: boolean; onPress: () => void }) {
  const { z, st } = useLive();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      aria-checked={active}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [st.segment, active ? st.segmentOn : st.segmentOff, pressed && { opacity: 0.9 }]}
    >
      <Icon size={z(17)} color={active ? '#FFFFFF' : VIOLET} strokeWidth={2} />
      <Text style={[st.segmentText, { color: active ? '#FFFFFF' : VIOLET }]} numberOfLines={1}>
        {label}
      </Text>
      {active ? (
        <View style={st.segmentCheck}>
          <Check size={z(11)} color={VIOLET} strokeWidth={3.2} />
        </View>
      ) : null}
    </Pressable>
  );
}

// -------------------------------------------------------- Track a journey

interface TrackProps {
  fromName: string | null;
  toName: string | null;
  onFrom: () => void;
  onTo: () => void;
  onSwap: () => void;
  /** Whether live tracking is on for the chosen pair. */
  tracking: boolean;
  onToggle: () => void;
  /** Offered when the phone is at / near a station (or off the network with a nearest one). */
  useLocationLabel: string | null;
  onUseLocation: () => void;
  hint: string;
  warn: string | null;
}

export function TrackSection(p: TrackProps) {
  const { z, st } = useLive();
  return (
    <>
      <View style={st.sectionHead}>
        <Text style={st.sectionTitle} accessibilityRole="header">
          Track a journey
        </Text>
        {p.useLocationLabel ? (
          <Pressable accessibilityRole="button" accessibilityLabel={p.useLocationLabel} onPress={p.onUseLocation} hitSlop={8} style={({ pressed }) => [st.chip, pressed && { opacity: 0.8 }]}>
            <LocateFixed size={z(14)} color={VIOLET} strokeWidth={2.2} />
            <Text style={st.chipText}>Use my current location</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={st.card}>
        <View style={st.trackRows}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <StationRow label="From" value={p.fromName} placeholder="Choose starting station" dot="#22B573" onPress={p.onFrom} />
            <View style={st.dotsLink} pointerEvents="none">
              {[0, 1, 2].map((i) => (
                <View key={i} style={st.linkDot} />
              ))}
            </View>
            <StationRow label="To" value={p.toName} placeholder="Choose destination" dot="#FF5A47" onPress={p.onTo} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Swap start and destination" onPress={p.onSwap} style={({ pressed }) => [st.swap, pressed && { opacity: 0.85 }]}>
            <ArrowUpDown size={z(21)} color={VIOLET} strokeWidth={2} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={p.tracking ? 'Stop live tracking' : 'Start live tracking'}
          onPress={p.onToggle}
          style={({ pressed }) => [st.startBtn, !p.tracking && st.startOn, p.tracking && st.startStop, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
        >
          {!p.tracking ? <ButtonArt radius={z(14)} /> : null}
          <View style={st.startRow}>
            <Navigation size={z(19)} color={p.tracking ? VIOLET : '#FFFFFF'} strokeWidth={2} />
            <Text style={[st.startLabel, p.tracking && { color: VIOLET }]}>{p.tracking ? 'Stop live tracking' : 'Start live tracking'}</Text>
          </View>
          {!p.tracking ? (
            <View style={st.startArrow}>
              <ChevronRight size={z(20)} color="#FFFFFF" strokeWidth={2.2} />
            </View>
          ) : null}
        </Pressable>

        {p.warn ? (
          <View style={{ marginTop: z(10) }}>
            <Notice tone="warn">{p.warn}</Notice>
          </View>
        ) : (
          <View style={st.hintRow}>
            <TrainFront size={z(17)} color={VIOLET} strokeWidth={2} />
            <Text style={st.hintText}>{p.hint}</Text>
          </View>
        )}
      </View>
    </>
  );
}

function StationRow({ label, value, placeholder, dot, onPress }: { label: string; value: string | null; placeholder: string; dot: string; onPress: () => void }) {
  const { z, st } = useLive();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} station: ${value ?? 'not chosen'}. Tap to change`}
      onPress={onPress}
      style={({ pressed }) => [st.stationRow, pressed && { backgroundColor: '#F3F1FF' }]}
    >
      <View style={[st.stationDot, { backgroundColor: dot }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.stationLabel}>{label}</Text>
        <Text style={value ? st.stationValue : st.stationPlaceholder} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
      </View>
      <ChevronRight size={z(19)} color={SLATE} strokeWidth={1.8} />
    </Pressable>
  );
}

// ------------------------------------------------------------ How it works

const FACTS: { icon: LucideIcon; title: string; sub: string }[] = [
  { icon: WifiOff, title: 'Works offline', sub: 'Uses saved station data' },
  { icon: Crosshair, title: 'Compares location', sub: 'With stored station positions' },
  { icon: ChartNoAxesColumn, title: 'Network backup', sub: 'Phone may use Wi‑Fi or cell' },
  { icon: TrainFront, title: 'Tracks only you', sub: 'No train locations or live feed' },
];

const DETAILS = [
  'GPS works with no internet. MetroMate compares your phone’s position with the stored station map on the device.',
  'Mobile-network (cell tower) positioning is done by the phone’s operating system, not by MetroMate: the app can’t read cell tower IDs. “Battery saver” asks for balanced accuracy so the OS may use cell or Wi‑Fi location, which is less accurate. Fixes are labelled by accuracy.',
  'Underground (Kankaria East, Kalupur, Gheekanta, Shahpur) GPS is unavailable. MetroMate then says “signal lost” and shows your last position instead of guessing.',
  'This tracks YOU, not other trains. There is no live train feed, and MetroMate never shows a train’s position or arrival time.',
  'Tracking and alerts work only while the app is open. Station pins are from an unofficial map (estimated).',
];

export function HowItWorks() {
  const { z, st } = useLive();
  const [open, setOpen] = useState(false);
  return (
    <View style={st.card}>
      <View style={st.howHead}>
        <View style={st.smallCircle}>
          <Lightbulb size={z(15)} color={VIOLET} strokeWidth={2.1} />
        </View>
        <Text style={[st.howTitle, { flex: 1 }]} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          How live location works here
        </Text>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={open ? 'Show less' : 'Read more about how live location works'} onPress={() => setOpen((o) => !o)} hitSlop={8} style={st.readMore}>
          <Text style={st.readMoreText}>{open ? 'Show less' : 'Read more'}</Text>
          <ChevronRight size={z(13)} color={VIOLET} strokeWidth={2.4} style={{ transform: [{ rotate: open ? '-90deg' : '0deg' }] }} />
        </Pressable>
      </View>
      <View style={st.factsRow}>
        {FACTS.map((f, i) => (
          <View key={f.title} style={[st.fact, i > 0 && st.factDivider]}>
            <View style={st.factIcon}>
              <f.icon size={z(15)} color={VIOLET} strokeWidth={2.1} />
            </View>
            <Text style={st.factTitle}>{f.title}</Text>
            <Text style={st.factSub}>{f.sub}</Text>
          </View>
        ))}
      </View>
      {open ? (
        <View style={st.details}>
          {DETAILS.map((t) => (
            <View key={t} style={{ flexDirection: 'row', gap: z(6) }}>
              <ChevronRight size={z(13)} color={SLATE} style={{ marginTop: z(2) }} />
              <Text style={[st.caption, { flex: 1, marginTop: 0 }]}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ styles

function makeStyles(z: Z) {
  const shadow = { shadowColor: '#3B2BB5', shadowOpacity: 0.07, shadowRadius: z(16), shadowOffset: { width: 0, height: z(6) }, elevation: 3 } as const;
  return StyleSheet.create({
    card: { marginHorizontal: z(16), backgroundColor: '#FFFFFF', borderRadius: z(24), borderWidth: 1, borderColor: CARD_LINE, padding: z(12), ...shadow },
    block: { marginTop: z(10) },
    cardTitle: { fontSize: z(18), fontWeight: '800', color: NAVY, letterSpacing: -0.3 },
    cardSub: { fontSize: z(11.5), color: SLATE, marginTop: z(2) },
    caption: { fontSize: z(11), color: SLATE, lineHeight: z(15), marginTop: z(9), marginLeft: z(2) },
    captionDark: { fontSize: z(12.5), color: '#39425E', lineHeight: z(18) },

    whereHead: { flexDirection: 'row', alignItems: 'center', gap: z(12), marginLeft: z(1) },
    halo: { width: z(44), height: z(44), borderRadius: z(22), backgroundColor: '#E9E6FC', alignItems: 'center', justifyContent: 'center' },
    haloInner: { width: z(32), height: z(32), borderRadius: z(16), backgroundColor: VIOLET, alignItems: 'center', justifyContent: 'center', shadowColor: VIOLET, shadowOpacity: 0.35, shadowRadius: z(8), shadowOffset: { width: 0, height: z(4) }, elevation: 4 },
    livePill: { flexDirection: 'row', alignItems: 'center', gap: z(5), paddingHorizontal: z(9), height: z(24), borderRadius: 99, borderWidth: 1 },
    livePillText: { fontSize: z(11), fontWeight: '700' },

    panel: { marginTop: z(12), flexDirection: 'row', alignItems: 'center', gap: z(10), borderRadius: z(15), backgroundColor: LAVENDER, paddingVertical: z(9), paddingHorizontal: z(9) },
    panelIcon: { width: z(34), height: z(34), borderRadius: z(11), backgroundColor: '#E6E3FA', alignItems: 'center', justifyContent: 'center' },
    panelTitle: { fontSize: z(14), fontWeight: '800', color: NAVY, letterSpacing: -0.2 },
    panelLine: { fontSize: z(11.5), color: '#66718C', marginTop: z(1), lineHeight: z(15.5) },
    directions: { flexDirection: 'row', alignItems: 'center', gap: z(5), height: z(37), paddingLeft: z(6), paddingRight: z(6), borderRadius: z(12), backgroundColor: '#FFFFFF', shadowColor: '#3B2BB5', shadowOpacity: 0.08, shadowRadius: z(8), shadowOffset: { width: 0, height: z(3) }, elevation: 2 },
    directionsIcon: { width: z(22), height: z(22), borderRadius: z(11), backgroundColor: '#ECE9FF', alignItems: 'center', justifyContent: 'center' },
    directionsText: { fontSize: z(11.5), fontWeight: '700', color: VIOLET },

    sourceLabel: { fontSize: z(12), fontWeight: '700', color: NAVY, marginTop: z(12), marginBottom: z(7), marginLeft: z(1) },
    segmentRow: { flexDirection: 'row', gap: z(9) },
    segment: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(8), height: z(36), borderRadius: z(12), borderWidth: 1.2 },
    segmentOn: { backgroundColor: VIOLET, borderColor: VIOLET, shadowColor: VIOLET, shadowOpacity: 0.3, shadowRadius: z(10), shadowOffset: { width: 0, height: z(5) }, elevation: 4 },
    segmentOff: { backgroundColor: '#FFFFFF', borderColor: '#DDE0F2' },
    segmentText: { fontSize: z(12.5), fontWeight: '700' },
    segmentCheck: { position: 'absolute', right: z(9), width: z(16), height: z(16), borderRadius: z(8), backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },

    fixRow: { marginTop: z(10), flexDirection: 'row', alignItems: 'center', gap: z(10), minHeight: z(36), paddingHorizontal: z(13), paddingVertical: z(6), borderRadius: z(12), backgroundColor: '#F4F3FD' },
    fixText: { flex: 1, minWidth: 0, fontSize: z(12), color: '#39425E' },
    fixChip: { height: z(20), paddingHorizontal: z(8), borderRadius: 99, backgroundColor: '#E6E3FB', alignItems: 'center', justifyContent: 'center' },
    fixChipText: { fontSize: z(10.5), fontWeight: '700', color: VIOLET },

    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: z(19), marginTop: z(18), marginBottom: z(10), gap: z(8) },
    sectionTitle: { fontSize: z(18), fontWeight: '800', color: NAVY, letterSpacing: -0.3 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: z(6), height: z(28), paddingHorizontal: z(10), borderRadius: 99, backgroundColor: CHIP },
    chipText: { fontSize: z(10.5), fontWeight: '700', color: VIOLET },

    trackRows: { flexDirection: 'row', alignItems: 'center', gap: z(8) },
    stationRow: { flexDirection: 'row', alignItems: 'center', gap: z(12), height: z(44), paddingLeft: z(14), paddingRight: z(10), borderRadius: z(14), borderWidth: 1.2, borderColor: '#E2E5F2', backgroundColor: '#FFFFFF' },
    stationDot: { width: z(12), height: z(12), borderRadius: z(6) },
    stationLabel: { fontSize: z(10), fontWeight: '600', color: '#39425E' },
    stationValue: { fontSize: z(13), fontWeight: '600', color: NAVY, marginTop: z(1) },
    stationPlaceholder: { fontSize: z(13), color: '#6B7690', marginTop: z(1) },
    dotsLink: { position: 'absolute', left: z(18.5), top: z(44), height: z(8), width: z(4), alignItems: 'center', justifyContent: 'space-around' },
    linkDot: { width: z(2.2), height: z(2.2), borderRadius: z(1.1), backgroundColor: '#C9CCE6' },
    swap: { width: z(36), height: z(36), borderRadius: z(18), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B2BB5', shadowOpacity: 0.14, shadowRadius: z(10), shadowOffset: { width: 0, height: z(4) }, elevation: 4 },
    startBtn: { marginTop: z(12), height: z(42), borderRadius: z(13), justifyContent: 'center' },
    startOn: { backgroundColor: VIOLET, shadowColor: VIOLET, shadowOpacity: 0.34, shadowRadius: z(14), shadowOffset: { width: 0, height: z(8) }, elevation: 6 },
    startStop: { backgroundColor: '#FFFFFF', borderWidth: 1.4, borderColor: VIOLET },
    startRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(10) },
    startLabel: { fontSize: z(14.5), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.1 },
    startArrow: { position: 'absolute', right: z(18), top: 0, bottom: 0, justifyContent: 'center' },
    hintRow: { marginTop: z(10), flexDirection: 'row', alignItems: 'center', gap: z(10), minHeight: z(34), paddingHorizontal: z(11), paddingVertical: z(7), borderRadius: z(11), backgroundColor: '#F4F3FD' },
    hintText: { flex: 1, fontSize: z(11.5), color: '#66718C', lineHeight: z(15.5) },

    howHead: { flexDirection: 'row', alignItems: 'center', gap: z(9) },
    smallCircle: { width: z(26), height: z(26), borderRadius: z(13), backgroundColor: '#ECE9FF', alignItems: 'center', justifyContent: 'center' },
    howTitle: { fontSize: z(14), fontWeight: '800', color: NAVY, letterSpacing: -0.2 },
    readMore: { flexDirection: 'row', alignItems: 'center', gap: z(2), height: z(24), paddingHorizontal: z(9), borderRadius: 99, backgroundColor: '#F1EFFD' },
    readMoreText: { fontSize: z(10.5), fontWeight: '700', color: VIOLET },
    factsRow: { flexDirection: 'row', marginTop: z(11) },
    fact: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: z(3) },
    factDivider: { borderLeftWidth: 1, borderLeftColor: '#ECEEF8' },
    factIcon: { width: z(26), height: z(26), borderRadius: z(13), backgroundColor: '#ECE9FF', alignItems: 'center', justifyContent: 'center', marginBottom: z(5) },
    factTitle: { fontSize: z(10.5), fontWeight: '800', color: NAVY, textAlign: 'center' },
    factSub: { fontSize: z(9.5), color: SLATE, textAlign: 'center', marginTop: z(2), lineHeight: z(12.5) },
    details: { marginTop: z(11), paddingTop: z(9), borderTopWidth: 1, borderTopColor: '#ECEEF8', gap: z(6) },
  });
}
