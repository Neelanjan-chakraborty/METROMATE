import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, ArrowUpDown, Briefcase, ChevronLeft, ChevronRight, Clock, GraduationCap, House, List, Map as MapIcon, Navigation, Plus, WifiOff, X, type LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme';
import { ButtonArt, MapCardArt, StationCardArt } from './art';
import { MetroTrainIcon } from './icons';
import { useHomeScale } from './scale';
import type { QuickSlot } from '../../types';

const NAVY = colors.text;
const SLATE = colors.slate;
const VIOLET = colors.primary;
const LINE = colors.border;
const CARD_LINE = '#E8EAF6';

type Z = (n: number) => number;

function useStyles() {
  const { z } = useHomeScale();
  const st = useMemo(() => makeStyles(z), [z]);
  return { z, st };
}

// ------------------------------------------------------------------ header

export interface HeaderBadge {
  label: string;
  Icon: LucideIcon;
  accessibilityLabel: string;
}

const OFFLINE_READY: HeaderBadge = { label: 'Offline ready', Icon: WifiOff, accessibilityLabel: 'Offline ready. Routes, search and saved journeys work without internet.' };

/** Shared by Home and Live: logo, brand, a one-line tagline and a status badge over the hero. */
export function HomeHeader({
  topInset,
  ink,
  inkSoft,
  tagline = 'Your offline metro companion',
  badge = OFFLINE_READY,
}: {
  topInset: number;
  ink: string;
  inkSoft: string;
  tagline?: string;
  badge?: HeaderBadge;
}) {
  const { z, st } = useStyles();
  const BadgeIcon = badge.Icon;
  return (
    <View style={[st.header, { paddingTop: topInset + z(21) }]}>
      <View style={st.logo} accessibilityLabel="MetroMate logo">
        <MetroTrainIcon size={z(32)} color="#FFFFFF" strokeWidth={1.7} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[st.brand, { color: ink }]} accessibilityRole="header" numberOfLines={1}>
          MetroMate
        </Text>
        <Text style={[st.tagline, { color: inkSoft }]} numberOfLines={1}>
          {tagline}
        </Text>
      </View>
      <View style={st.offlinePill} accessibilityLabel={badge.accessibilityLabel}>
        <BadgeIcon size={z(15)} color="#0F6B3E" strokeWidth={2} />
        <Text style={st.offlineText}>{badge.label}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------- journey card

interface JourneyProps {
  fromName: string | null;
  toName: string | null;
  onFrom: () => void;
  onTo: () => void;
  onSwap: () => void;
  onFind: () => void;
  error: string | null;
  /** When to leave: null = now; otherwise "HH:MM". */
  leaveAt?: string | null;
  onLeaveNow?: () => void;
  onLeaveAt?: () => void;
  onLeaveStep?: (deltaMinutes: number) => void;
}

export function JourneyCard({ fromName, toName, onFrom, onTo, onSwap, onFind, error, leaveAt, onLeaveNow, onLeaveAt, onLeaveStep }: JourneyProps) {
  const { z, st } = useStyles();
  return (
    <View style={st.journeyCard}>
      <Text style={st.cardTitle}>Where are you going?</Text>
      <Text style={st.cardSub}>Plan your journey, even offline.</Text>

      <View style={st.selector}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`From station: ${fromName ?? 'not chosen'}. Tap to change`}
          onPress={onFrom}
          style={({ pressed }) => [st.selRow, st.selTop, pressed && st.pressedSoft]}
        >
          <View style={[st.selDot, { backgroundColor: '#22B573' }]} />
          <View style={st.selText}>
            <Text style={st.selLabel}>FROM</Text>
            <Text style={st.selValue} numberOfLines={1}>
              {fromName ?? 'Starting station'}
            </Text>
          </View>
          <ChevronRight size={z(20)} color={SLATE} strokeWidth={1.8} />
          <View style={{ width: z(52) }} />
        </Pressable>
        <View style={st.selDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`To station: ${toName ?? 'not chosen'}. Tap to change`}
          onPress={onTo}
          style={({ pressed }) => [st.selRow, st.selBottom, pressed && st.pressedSoft]}
        >
          <View style={[st.selDot, { backgroundColor: '#FF5A47' }]} />
          <View style={st.selText}>
            <Text style={st.selLabel}>TO</Text>
            <Text style={st.selValue} numberOfLines={1}>
              {toName ?? 'Destination'}
            </Text>
          </View>
          <ChevronRight size={z(20)} color={SLATE} strokeWidth={1.8} />
          <View style={{ width: z(52) }} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Swap start and destination" onPress={onSwap} style={({ pressed }) => [st.swap, pressed && { opacity: 0.8 }]}>
          <ArrowUpDown size={z(22)} color={VIOLET} strokeWidth={2} />
        </Pressable>
      </View>

      {onLeaveNow ? (
        <View style={st.whenRow} accessibilityRole="radiogroup">
          <Pressable accessibilityRole="radio" accessibilityState={{ selected: !leaveAt, checked: !leaveAt }} aria-checked={!leaveAt} accessibilityLabel="Leave now" onPress={onLeaveNow} style={[st.whenChip, !leaveAt && st.whenChipOn]}>
            <Clock size={z(14)} color={!leaveAt ? '#FFFFFF' : VIOLET} strokeWidth={2.1} />
            <Text style={[st.whenText, !leaveAt && { color: '#FFFFFF' }]}>Leave now</Text>
          </Pressable>
          <Pressable accessibilityRole="radio" accessibilityState={{ selected: !!leaveAt, checked: !!leaveAt }} aria-checked={!!leaveAt} accessibilityLabel={leaveAt ? `Depart at ${leaveAt}` : 'Depart at a chosen time'} onPress={onLeaveAt} style={[st.whenChip, !!leaveAt && st.whenChipOn]}>
            <Text style={[st.whenText, !!leaveAt && { color: '#FFFFFF' }]}>{leaveAt ? `Depart ${leaveAt}` : 'Depart at…'}</Text>
          </Pressable>
          {leaveAt && onLeaveStep ? (
            <>
              <Pressable accessibilityRole="button" accessibilityLabel="15 minutes earlier" onPress={() => onLeaveStep(-15)} style={st.stepBtn}>
                <ChevronLeft size={z(18)} color={VIOLET} strokeWidth={2.2} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="15 minutes later" onPress={() => onLeaveStep(15)} style={st.stepBtn}>
                <ChevronRight size={z(18)} color={VIOLET} strokeWidth={2.2} />
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <Text style={st.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Pressable accessibilityRole="button" accessibilityLabel="Find my route" onPress={onFind} style={({ pressed }) => [st.findBtn, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
        <ButtonArt radius={z(17)} />
        <View style={st.findRow}>
          <Navigation size={z(21)} color="#FFFFFF" strokeWidth={1.9} />
          <Text style={st.findLabel}>Find my route</Text>
        </View>
        <View style={st.findArrow}>
          <ArrowRight size={z(24)} color="#FFFFFF" strokeWidth={2} />
        </View>
      </Pressable>
    </View>
  );
}

// ------------------------------------------------------- shortcut cards

export function ShortcutCards({ onMap, onStations }: { onMap: () => void; onStations: () => void }) {
  const { st } = useStyles();
  return (
    <View style={st.shortcutRow}>
      <ShortcutCard icon={MapIcon} title="Metro map" subtitle="Explore lines & stations" onPress={onMap} art={<MapCardArt />} />
      <ShortcutCard icon={List} title="Stations" subtitle="Search all stations" onPress={onStations} art={<StationCardArt />} />
    </View>
  );
}

function ShortcutCard({ icon: Icon, title, subtitle, onPress, art }: { icon: LucideIcon; title: string; subtitle: string; onPress: () => void; art: React.ReactNode }) {
  const { z, st } = useStyles();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${subtitle}`} onPress={onPress} style={({ pressed }) => [st.shortcut, pressed && st.pressedSoft]}>
      {art}
      <View style={st.shortcutIcon}>
        <Icon size={z(25)} color="#3F2DD0" strokeWidth={2.1} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.shortcutTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={st.shortcutSub} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={z(17)} color={VIOLET} strokeWidth={2} />
    </Pressable>
  );
}

// ---------------------------------------------------------- section head

export function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  const { z, st } = useStyles();
  return (
    <View style={st.sectionHead}>
      <Text style={st.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`See all ${title.toLowerCase()}`} onPress={onSeeAll} hitSlop={10} style={st.seeAll}>
        <Text style={st.seeAllText}>See all</Text>
        <ChevronRight size={z(16)} color={VIOLET} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------- quick routes

export interface QuickItem {
  slot: QuickSlot;
  label: string;
  /** "A → B" once saved. */
  summary: string | null;
}

const QUICK_STYLE: Record<QuickSlot, { icon: LucideIcon; fg: string; bg: string }> = {
  home: { icon: House, fg: '#2F6BEA', bg: '#E8F0FF' },
  campus: { icon: GraduationCap, fg: '#17A267', bg: '#E4F7EC' },
  work: { icon: Briefcase, fg: '#F08A24', bg: '#FFF0DD' },
};

export function QuickRoutes({ items, onPress, onClear }: { items: QuickItem[]; onPress: (slot: QuickSlot) => void; onClear: (slot: QuickSlot) => void }) {
  const { z, st } = useStyles();
  return (
    <View style={st.quickRow}>
      {items.map((it) => {
        const q = QUICK_STYLE[it.slot];
        const Icon = q.icon;
        const saved = it.summary !== null;
        return (
          <Pressable
            key={it.slot}
            accessibilityRole="button"
            accessibilityLabel={saved ? `${it.label}: ${it.summary}. Tap to open` : `${it.label}: add route. Tap to save the stations chosen above as ${it.label}`}
            onPress={() => onPress(it.slot)}
            style={({ pressed }) => [st.quick, pressed && st.pressedSoft]}
          >
            <View style={[st.quickIcon, { backgroundColor: q.bg }]}>
              <Icon size={z(19)} color={q.fg} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.quickLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {it.label}
              </Text>
              <Text style={st.quickSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {saved ? it.summary : 'Add route'}
              </Text>
            </View>
            {saved ? (
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${it.label} shortcut`} onPress={() => onClear(it.slot)} hitSlop={8} style={st.quickPlus}>
                <X size={z(12)} color={VIOLET} strokeWidth={2.4} />
              </Pressable>
            ) : (
              <View style={st.quickPlus}>
                <Plus size={z(13)} color={VIOLET} strokeWidth={2.4} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------- recent trips

export interface TripItem {
  id: number;
  fromName: string;
  toName: string;
  chips: { color: string; label: string }[];
  day: string;
  metric: string;
}

export function RecentTrips({ trips, onOpen }: { trips: TripItem[]; onOpen: (id: number) => void }) {
  const { z, st } = useStyles();
  if (trips.length === 0) {
    return (
      <View style={[st.tripsCard, st.tripsEmpty]}>
        <Text style={st.tripName}>No recent trips yet</Text>
        <Text style={st.tripTo}>Routes you look up appear here, even offline.</Text>
      </View>
    );
  }
  return (
    <View style={st.tripsCard}>
      {trips.map((t, i) => (
        <Pressable
          key={t.id}
          accessibilityRole="button"
          accessibilityLabel={`${t.fromName} to ${t.toName}, ${t.day}, ${t.metric}. Tap to open`}
          onPress={() => onOpen(t.id)}
          style={({ pressed }) => [st.trip, i > 0 && st.tripDivider, pressed && st.pressedSoft]}
        >
          <View style={st.tripRail}>
            <View style={st.railFilled} />
            <View style={st.railLine} />
            <View style={st.railHollow} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={st.tripName} numberOfLines={1}>
              {t.fromName}
            </Text>
            <Text style={st.tripTo} numberOfLines={1}>
              to {t.toName}
            </Text>
            <View style={st.chipRow}>
              {t.chips.map((c, ci) => (
                <React.Fragment key={`${c.label}-${ci}`}>
                  {ci > 0 ? <ChevronRight size={z(13)} color={SLATE} strokeWidth={2} /> : null}
                  <View style={st.chip}>
                    <View style={[st.chipDot, { backgroundColor: c.color }]} />
                    <Text style={st.chipText} numberOfLines={1}>
                      {c.label}
                    </Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
          <View style={st.tripMeta}>
            <Text style={st.metaText}>{t.day}</Text>
            <Text style={st.metaText}>{t.metric}</Text>
          </View>
          <ChevronRight size={z(19)} color={SLATE} strokeWidth={1.8} />
        </Pressable>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ styles

function makeStyles(z: Z) {
  const shadow = { shadowColor: '#3B2BB5', shadowOpacity: 0.07, shadowRadius: z(16), shadowOffset: { width: 0, height: z(6) }, elevation: 3 } as const;
  return StyleSheet.create({
    pressedSoft: { backgroundColor: '#F3F1FF' },

    header: { flexDirection: 'row', alignItems: 'center', gap: z(13), paddingHorizontal: z(20), paddingBottom: z(4) },
    logo: { width: z(58), height: z(58), borderRadius: z(17), backgroundColor: VIOLET, alignItems: 'center', justifyContent: 'center', shadowColor: VIOLET, shadowOpacity: 0.28, shadowRadius: z(10), shadowOffset: { width: 0, height: z(5) }, elevation: 4 },
    brand: { fontSize: z(26), fontWeight: '800', color: NAVY, letterSpacing: -0.6 },
    tagline: { fontSize: z(12.5), color: '#66718C', marginTop: z(1) },
    whenRow: { flexDirection: 'row', alignItems: 'center', gap: z(8), marginTop: z(12) },
    whenChip: { flexDirection: 'row', alignItems: 'center', gap: z(6), height: z(34), paddingHorizontal: z(13), borderRadius: z(17), backgroundColor: '#F1EFFF' },
    whenChipOn: { backgroundColor: VIOLET },
    whenText: { fontSize: z(13), fontWeight: '700', color: VIOLET },
    stepBtn: { width: z(34), height: z(34), borderRadius: z(17), backgroundColor: '#F1EFFF', alignItems: 'center', justifyContent: 'center' },
    offlinePill: { flexDirection: 'row', alignItems: 'center', gap: z(6), paddingHorizontal: z(11), height: z(31), borderRadius: 99, backgroundColor: '#E5F7EC', borderWidth: 1, borderColor: '#C4EBD3' },
    offlineText: { fontSize: z(12), fontWeight: '700', color: '#0F6B3E' },

    journeyCard: { marginHorizontal: z(16), backgroundColor: '#FFFFFF', borderRadius: z(26), borderWidth: 1, borderColor: CARD_LINE, padding: z(16), paddingTop: z(18), ...shadow },
    cardTitle: { fontSize: z(23), fontWeight: '800', color: NAVY, letterSpacing: -0.4, marginLeft: z(4) },
    cardSub: { fontSize: z(13.5), color: SLATE, marginTop: z(4), marginLeft: z(4) },

    selector: { marginTop: z(11), borderRadius: z(16), borderWidth: 1.2, borderColor: LINE, backgroundColor: '#FFFFFF' },
    selRow: { flexDirection: 'row', alignItems: 'center', height: z(64), paddingLeft: z(17), paddingRight: z(14) },
    selTop: { borderTopLeftRadius: z(15), borderTopRightRadius: z(15) },
    selBottom: { borderBottomLeftRadius: z(15), borderBottomRightRadius: z(15) },
    selDot: { width: z(18), height: z(18), borderRadius: z(9), marginRight: z(16) },
    selText: { flex: 1, minWidth: 0 },
    selLabel: { fontSize: z(10), fontWeight: '700', color: SLATE, letterSpacing: 0.8 },
    selValue: { fontSize: z(17.5), fontWeight: '500', color: NAVY, marginTop: z(1) },
    selDivider: { height: 1.2, backgroundColor: LINE },
    swap: { position: 'absolute', right: z(10), top: '50%', marginTop: z(-24), width: z(47), height: z(47), borderRadius: z(24), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B2BB5', shadowOpacity: 0.14, shadowRadius: z(10), shadowOffset: { width: 0, height: z(4) }, elevation: 4 },
    error: { marginTop: z(10), marginLeft: z(4), fontSize: z(13), color: '#B42318', fontWeight: '600' },

    findBtn: { marginTop: z(14), height: z(51), borderRadius: z(16), backgroundColor: VIOLET, justifyContent: 'center', shadowColor: VIOLET, shadowOpacity: 0.34, shadowRadius: z(14), shadowOffset: { width: 0, height: z(8) }, elevation: 6 },
    findRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(11) },
    findLabel: { fontSize: z(18.5), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
    findArrow: { position: 'absolute', right: z(22), top: 0, bottom: 0, justifyContent: 'center' },

    shortcutRow: { flexDirection: 'row', gap: z(10), marginHorizontal: z(16), marginTop: z(14) },
    shortcut: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: z(10), minHeight: z(72), paddingHorizontal: z(11), borderRadius: z(18), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, overflow: 'hidden' },
    shortcutIcon: { width: z(40), height: z(40), borderRadius: z(12), backgroundColor: '#EFEDFF', alignItems: 'center', justifyContent: 'center' },
    shortcutTitle: { fontSize: z(14), fontWeight: '800', color: NAVY },
    shortcutSub: { fontSize: z(10.5), color: SLATE, marginTop: z(1), lineHeight: z(13) },

    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: z(19), marginTop: z(17), marginBottom: z(10) },
    sectionTitle: { fontSize: z(19), fontWeight: '800', color: NAVY, letterSpacing: -0.3 },
    seeAll: { flexDirection: 'row', alignItems: 'center', gap: z(2) },
    seeAllText: { fontSize: z(12.5), fontWeight: '700', color: VIOLET },

    quickRow: { flexDirection: 'row', gap: z(7), marginHorizontal: z(16) },
    quick: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: z(5), height: z(52), paddingLeft: z(8), paddingRight: z(5), borderRadius: z(16), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE },
    quickIcon: { width: z(28), height: z(28), borderRadius: z(9), alignItems: 'center', justifyContent: 'center' },
    quickLabel: { fontSize: z(12), fontWeight: '800', color: NAVY },
    quickSub: { fontSize: z(10), color: SLATE, marginTop: z(1) },
    quickPlus: { width: z(20), height: z(20), borderRadius: z(10), backgroundColor: '#ECE9FF', alignItems: 'center', justifyContent: 'center' },

    tripsCard: { marginHorizontal: z(16), backgroundColor: '#FFFFFF', borderRadius: z(22), borderWidth: 1, borderColor: CARD_LINE, overflow: 'hidden' },
    tripsEmpty: { padding: z(18), gap: z(3) },
    trip: { flexDirection: 'row', alignItems: 'center', gap: z(12), paddingVertical: z(15), paddingHorizontal: z(15) },
    tripDivider: { borderTopWidth: 1, borderTopColor: '#EDEFF8' },
    tripRail: { alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center', width: z(16), paddingVertical: z(5) },
    railFilled: { width: z(12), height: z(12), borderRadius: z(6), backgroundColor: VIOLET },
    railLine: { flex: 1, width: 2, backgroundColor: '#D2CDF6', marginVertical: z(2) },
    railHollow: { width: z(12), height: z(12), borderRadius: z(6), borderWidth: 2, borderColor: '#A9A4D6', backgroundColor: '#FFFFFF' },
    tripName: { fontSize: z(16), fontWeight: '800', color: NAVY, letterSpacing: -0.3 },
    tripTo: { fontSize: z(13), color: SLATE, marginTop: z(1) },
    chipRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: z(4), marginTop: z(8) },
    chip: { flexDirection: 'row', alignItems: 'center', gap: z(5), paddingHorizontal: z(9), height: z(24), borderRadius: 99, backgroundColor: '#F1F3FA' },
    chipDot: { width: z(10), height: z(10), borderRadius: z(5) },
    chipText: { fontSize: z(11.5), fontWeight: '600', color: '#39425E' },
    tripMeta: { alignItems: 'flex-end', gap: z(4) },
    metaText: { fontSize: z(12.5), color: SLATE },
  });
}
