import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, ArrowUpDown, Briefcase, ChevronLeft, ChevronRight, Clock, GraduationCap, House, List, Map as MapIcon, Navigation, Plus, WifiOff, X, type LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme';
import { ButtonArt, MapCardArt, StationCardArt } from './art';
import { MetroTrainIcon } from './icons';
import { LanguageButton } from '../LanguagePicker';
import { useHomeScale } from './scale';
import { useT } from '../../i18n/useT';
import type { QuickSlot } from '../../types';

const NAVY = colors.text;
const SLATE = colors.slate;
const VIOLET = colors.primary;
const LINE = colors.border;
const CARD_LINE = '#E8EAF6';

type Z = (n: number) => number;

/** The time chips and step buttons are 34 dp tall: extend their touch area to 44. */
const WHEN_HIT = { top: 5, bottom: 5, left: 2, right: 2 } as const;

function useStyles() {
  const { z } = useHomeScale();
  const { lang } = useT();
  const st = useMemo(() => makeStyles(z, lang !== 'en'), [z, lang]);
  return { z, st };
}

// ------------------------------------------------------------------ header

export interface HeaderBadge {
  label: string;
  Icon: LucideIcon;
  accessibilityLabel: string;
}

/** Shared by Home and Live: logo, brand, a one-line tagline and a status badge over the hero. */
export function HomeHeader({
  topInset,
  ink,
  inkSoft,
  tagline,
  badge,
}: {
  topInset: number;
  ink: string;
  inkSoft: string;
  /** Defaults to the Home tagline. */
  tagline?: string;
  /** Defaults to the "Offline ready" badge. */
  badge?: HeaderBadge;
}) {
  const { z, st } = useStyles();
  const { t } = useT();
  const shownBadge: HeaderBadge = badge ?? { label: t('home.header.offlineReady'), Icon: WifiOff, accessibilityLabel: t('home.header.offlineReady.a11y') };
  const BadgeIcon = shownBadge.Icon;
  return (
    <View style={[st.header, { paddingTop: topInset + z(21) }]}>
      <View style={st.logo} accessibilityLabel={t('home.header.logo.a11y')}>
        <MetroTrainIcon size={z(32)} color="#FFFFFF" strokeWidth={1.7} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[st.brand, { color: ink }]} accessibilityRole="header" numberOfLines={1}>
          MetroMate
        </Text>
        <Text style={[st.tagline, { color: inkSoft }]} numberOfLines={2}>
          {tagline ?? t('home.header.tagline')}
        </Text>
      </View>
      <LanguageButton size={z(38)} />
      <View style={st.offlinePill} accessibilityLabel={shownBadge.accessibilityLabel}>
        <BadgeIcon size={z(15)} color="#0F6B3E" strokeWidth={2} />
        <Text style={st.offlineText}>{shownBadge.label}</Text>
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
  const { t } = useT();
  return (
    <View style={st.journeyCard}>
      <Text style={st.cardTitle}>{t('home.card.title')}</Text>
      <Text style={st.cardSub}>{t('home.card.subtitle')}</Text>

      <View style={st.selector}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.card.from.a11y', { name: fromName ?? t('home.card.notChosen') })}
          onPress={onFrom}
          style={({ pressed }) => [st.selRow, st.selTop, pressed && st.pressedSoft]}
        >
          <View style={[st.selDot, { backgroundColor: '#22B573' }]} />
          <View style={st.selText}>
            <Text style={st.selLabel}>{t('home.card.from')}</Text>
            <Text style={st.selValue} numberOfLines={1}>
              {fromName ?? t('home.card.fromPlaceholder')}
            </Text>
          </View>
          <ChevronRight size={z(20)} color={SLATE} strokeWidth={1.8} />
          <View style={{ width: z(52) }} />
        </Pressable>
        <View style={st.selDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.card.to.a11y', { name: toName ?? t('home.card.notChosen') })}
          onPress={onTo}
          style={({ pressed }) => [st.selRow, st.selBottom, pressed && st.pressedSoft]}
        >
          <View style={[st.selDot, { backgroundColor: '#FF5A47' }]} />
          <View style={st.selText}>
            <Text style={st.selLabel}>{t('home.card.to')}</Text>
            <Text style={st.selValue} numberOfLines={1}>
              {toName ?? t('home.card.toPlaceholder')}
            </Text>
          </View>
          <ChevronRight size={z(20)} color={SLATE} strokeWidth={1.8} />
          <View style={{ width: z(52) }} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.card.swap.a11y')} onPress={onSwap} style={({ pressed }) => [st.swap, pressed && { opacity: 0.8 }]}>
          <ArrowUpDown size={z(22)} color={VIOLET} strokeWidth={2} />
        </Pressable>
      </View>

      {onLeaveNow ? (
        <View style={st.whenRow} accessibilityRole="radiogroup">
          <Pressable accessibilityRole="radio" accessibilityState={{ selected: !leaveAt, checked: !leaveAt }} aria-checked={!leaveAt} accessibilityLabel={t('home.card.leaveNow')} onPress={onLeaveNow} hitSlop={WHEN_HIT} style={[st.whenChip, !leaveAt && st.whenChipOn]}>
            <Clock size={z(14)} color={!leaveAt ? '#FFFFFF' : VIOLET} strokeWidth={2.1} />
            <Text style={[st.whenText, !leaveAt && { color: '#FFFFFF' }]}>{t('home.card.leaveNow')}</Text>
          </Pressable>
          <Pressable accessibilityRole="radio" accessibilityState={{ selected: !!leaveAt, checked: !!leaveAt }} aria-checked={!!leaveAt} accessibilityLabel={leaveAt ? t('home.card.departTime.a11y', { time: leaveAt }) : t('home.card.departAt.a11y')} onPress={onLeaveAt} hitSlop={WHEN_HIT} style={[st.whenChip, !!leaveAt && st.whenChipOn]}>
            <Text style={[st.whenText, !!leaveAt && { color: '#FFFFFF' }]}>{leaveAt ? t('home.card.departTime', { time: leaveAt }) : t('home.card.departAt')}</Text>
          </Pressable>
          {leaveAt && onLeaveStep ? (
            <>
              <Pressable accessibilityRole="button" accessibilityLabel={t('home.card.earlier.a11y')} onPress={() => onLeaveStep(-15)} hitSlop={WHEN_HIT} style={st.stepBtn}>
                <ChevronLeft size={z(18)} color={VIOLET} strokeWidth={2.2} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t('home.card.later.a11y')} onPress={() => onLeaveStep(15)} hitSlop={WHEN_HIT} style={st.stepBtn}>
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

      <Pressable accessibilityRole="button" accessibilityLabel={t('home.card.find')} onPress={onFind} style={({ pressed }) => [st.findBtn, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
        <ButtonArt radius={z(17)} />
        <View style={st.findRow}>
          <Navigation size={z(21)} color="#FFFFFF" strokeWidth={1.9} />
          <Text style={st.findLabel}>{t('home.card.find')}</Text>
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
  const { t } = useT();
  return (
    <View style={st.shortcutRow}>
      <ShortcutCard icon={MapIcon} title={t('home.shortcut.map.title')} subtitle={t('home.shortcut.map.subtitle')} onPress={onMap} art={<MapCardArt />} />
      <ShortcutCard icon={List} title={t('home.shortcut.stations.title')} subtitle={t('home.shortcut.stations.subtitle')} onPress={onStations} art={<StationCardArt />} />
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
        <Text style={st.shortcutTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={st.shortcutSub} numberOfLines={3}>
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
  const { t } = useT();
  return (
    <View style={st.sectionHead}>
      <Text style={st.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t('home.seeAll.a11y', { section: title.toLowerCase() })} onPress={onSeeAll} hitSlop={10} style={st.seeAll}>
        <Text style={st.seeAllText}>{t('home.seeAll')}</Text>
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
  const { t } = useT();
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
            accessibilityLabel={saved ? t('home.quick.open.a11y', { label: it.label, summary: it.summary ?? '' }) : t('home.quick.add.a11y', { label: it.label })}
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
                {saved ? it.summary : t('home.quick.add')}
              </Text>
            </View>
            {saved ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('home.quick.remove.a11y', { label: it.label })} onPress={() => onClear(it.slot)} hitSlop={8} style={st.quickPlus}>
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
  const { t } = useT();
  if (trips.length === 0) {
    return (
      <View style={[st.tripsCard, st.tripsEmpty]}>
        <Text style={st.tripName}>{t('home.trip.empty.title')}</Text>
        <Text style={st.tripTo}>{t('home.trip.empty.body')}</Text>
      </View>
    );
  }
  return (
    <View style={st.tripsCard}>
      {trips.map((trip, i) => (
        <Pressable
          key={trip.id}
          accessibilityRole="button"
          accessibilityLabel={t('home.trip.open.a11y', { from: trip.fromName, to: trip.toName, day: trip.day, metric: trip.metric })}
          onPress={() => onOpen(trip.id)}
          style={({ pressed }) => [st.trip, i > 0 && st.tripDivider, pressed && st.pressedSoft]}
        >
          <View style={st.tripRail}>
            <View style={st.railFilled} />
            <View style={st.railLine} />
            <View style={st.railHollow} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={st.tripName} numberOfLines={1}>
              {trip.fromName}
            </Text>
            <Text style={st.tripTo} numberOfLines={1}>
              {t('home.trip.to', { name: trip.toName })}
            </Text>
            <View style={st.chipRow}>
              {trip.chips.map((c, ci) => (
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
            <Text style={st.metaText}>{trip.day}</Text>
            <Text style={st.metaText}>{trip.metric}</Text>
          </View>
          <ChevronRight size={z(19)} color={SLATE} strokeWidth={1.8} />
        </Pressable>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ styles

/**
 * `indic`: Hindi or Gujarati. Their scripts are taller than Latin and break with letter-spacing, so spacing is
 * dropped, fixed heights become minimums, and small text gets a roomier line height.
 */
function makeStyles(z: Z, indic: boolean) {
  const ls = (v: number) => (indic ? 0 : v);
  const lh = (size: number) => (indic ? Math.round(size * 1.45 * 10) / 10 : undefined);
  const shadow = { shadowColor: '#3B2BB5', shadowOpacity: 0.07, shadowRadius: z(16), shadowOffset: { width: 0, height: z(6) }, elevation: 3 } as const;
  return StyleSheet.create({
    pressedSoft: { backgroundColor: '#F3F1FF' },

    header: { flexDirection: 'row', alignItems: 'center', gap: z(13), paddingHorizontal: z(20), paddingBottom: z(4) },
    logo: { width: z(58), height: z(58), borderRadius: z(17), backgroundColor: VIOLET, alignItems: 'center', justifyContent: 'center', shadowColor: VIOLET, shadowOpacity: 0.28, shadowRadius: z(10), shadowOffset: { width: 0, height: z(5) }, elevation: 4 },
    brand: { fontSize: z(26), fontWeight: '800', color: NAVY, letterSpacing: -0.6 },
    tagline: { fontSize: z(12.5), color: '#66718C', marginTop: z(1), lineHeight: lh(z(12.5)) },
    whenRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: z(8), marginTop: z(12) },
    whenChip: { flexDirection: 'row', alignItems: 'center', gap: z(6), minHeight: z(34), paddingVertical: indic ? z(3) : 0, paddingHorizontal: z(13), borderRadius: z(17), backgroundColor: '#F1EFFF' },
    whenChipOn: { backgroundColor: VIOLET },
    whenText: { fontSize: z(13), fontWeight: '700', color: VIOLET, lineHeight: lh(z(13)) },
    stepBtn: { width: z(34), height: z(34), borderRadius: z(17), backgroundColor: '#F1EFFF', alignItems: 'center', justifyContent: 'center' },
    offlinePill: { flexDirection: 'row', alignItems: 'center', gap: z(6), paddingHorizontal: z(11), minHeight: z(31), borderRadius: 99, backgroundColor: '#E5F7EC', borderWidth: 1, borderColor: '#C4EBD3' },
    offlineText: { fontSize: z(12), fontWeight: '700', color: '#0F6B3E', lineHeight: lh(z(12)) },

    journeyCard: { marginHorizontal: z(16), backgroundColor: '#FFFFFF', borderRadius: z(26), borderWidth: 1, borderColor: CARD_LINE, padding: z(16), paddingTop: z(18), ...shadow },
    cardTitle: { fontSize: z(23), fontWeight: '800', color: NAVY, letterSpacing: ls(-0.4), lineHeight: lh(z(23)), marginLeft: z(4) },
    cardSub: { fontSize: z(13.5), color: SLATE, marginTop: z(4), marginLeft: z(4), lineHeight: lh(z(13.5)) },

    selector: { marginTop: z(11), borderRadius: z(16), borderWidth: 1.2, borderColor: LINE, backgroundColor: '#FFFFFF' },
    selRow: { flexDirection: 'row', alignItems: 'center', minHeight: z(64), paddingLeft: z(17), paddingRight: z(14) },
    selTop: { borderTopLeftRadius: z(15), borderTopRightRadius: z(15) },
    selBottom: { borderBottomLeftRadius: z(15), borderBottomRightRadius: z(15) },
    selDot: { width: z(18), height: z(18), borderRadius: z(9), marginRight: z(16) },
    selText: { flex: 1, minWidth: 0 },
    selLabel: { fontSize: indic ? z(12) : z(10), fontWeight: '700', color: SLATE, letterSpacing: ls(0.8), lineHeight: lh(z(12)) },
    selValue: { fontSize: z(17.5), fontWeight: '500', color: NAVY, marginTop: z(1), lineHeight: lh(z(17.5)) },
    selDivider: { height: 1.2, backgroundColor: LINE },
    swap: { position: 'absolute', right: z(10), top: '50%', marginTop: z(-24), width: z(47), height: z(47), borderRadius: z(24), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B2BB5', shadowOpacity: 0.14, shadowRadius: z(10), shadowOffset: { width: 0, height: z(4) }, elevation: 4 },
    error: { marginTop: z(10), marginLeft: z(4), fontSize: z(13), color: '#B42318', fontWeight: '600', lineHeight: lh(z(13)) },

    findBtn: { marginTop: z(14), minHeight: z(51), borderRadius: z(16), backgroundColor: VIOLET, justifyContent: 'center', shadowColor: VIOLET, shadowOpacity: 0.34, shadowRadius: z(14), shadowOffset: { width: 0, height: z(8) }, elevation: 6 },
    findRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(11), paddingHorizontal: z(52) },
    findLabel: { fontSize: z(18.5), fontWeight: '800', color: '#FFFFFF', letterSpacing: ls(-0.2), lineHeight: lh(z(18.5)), flexShrink: 1, textAlign: 'center' },
    findArrow: { position: 'absolute', right: z(22), top: 0, bottom: 0, justifyContent: 'center' },

    shortcutRow: { flexDirection: 'row', gap: z(10), marginHorizontal: z(16), marginTop: z(14) },
    shortcut: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: z(10), minHeight: z(72), paddingHorizontal: z(11), borderRadius: z(18), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, overflow: 'hidden' },
    shortcutIcon: { width: z(40), height: z(40), borderRadius: z(12), backgroundColor: '#EFEDFF', alignItems: 'center', justifyContent: 'center' },
    shortcutTitle: { fontSize: z(14), fontWeight: '800', color: NAVY, lineHeight: lh(z(14)) },
    shortcutSub: { fontSize: z(10.5), color: SLATE, marginTop: z(1), lineHeight: indic ? z(16) : z(13) },

    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: z(19), marginTop: z(17), marginBottom: z(10) },
    sectionTitle: { fontSize: z(19), fontWeight: '800', color: NAVY, letterSpacing: ls(-0.3), lineHeight: lh(z(19)), flexShrink: 1 },
    seeAll: { flexDirection: 'row', alignItems: 'center', gap: z(2) },
    seeAllText: { fontSize: z(12.5), fontWeight: '700', color: VIOLET, lineHeight: lh(z(12.5)) },

    quickRow: { flexDirection: 'row', gap: z(7), marginHorizontal: z(16) },
    quick: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: z(5), minHeight: z(52), paddingLeft: z(8), paddingRight: z(5), borderRadius: z(16), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE },
    quickIcon: { width: z(28), height: z(28), borderRadius: z(9), alignItems: 'center', justifyContent: 'center' },
    quickLabel: { fontSize: z(12), fontWeight: '800', color: NAVY, lineHeight: lh(z(12)) },
    quickSub: { fontSize: z(10), color: SLATE, marginTop: z(1), lineHeight: lh(z(10)) },
    quickPlus: { width: z(20), height: z(20), borderRadius: z(10), backgroundColor: '#ECE9FF', alignItems: 'center', justifyContent: 'center' },

    tripsCard: { marginHorizontal: z(16), backgroundColor: '#FFFFFF', borderRadius: z(22), borderWidth: 1, borderColor: CARD_LINE, overflow: 'hidden' },
    tripsEmpty: { padding: z(18), gap: z(3) },
    trip: { flexDirection: 'row', alignItems: 'center', gap: z(12), paddingVertical: z(15), paddingHorizontal: z(15) },
    tripDivider: { borderTopWidth: 1, borderTopColor: '#EDEFF8' },
    tripRail: { alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center', width: z(16), paddingVertical: z(5) },
    railFilled: { width: z(12), height: z(12), borderRadius: z(6), backgroundColor: VIOLET },
    railLine: { flex: 1, width: 2, backgroundColor: '#D2CDF6', marginVertical: z(2) },
    railHollow: { width: z(12), height: z(12), borderRadius: z(6), borderWidth: 2, borderColor: '#A9A4D6', backgroundColor: '#FFFFFF' },
    tripName: { fontSize: z(16), fontWeight: '800', color: NAVY, letterSpacing: ls(-0.3), lineHeight: lh(z(16)) },
    tripTo: { fontSize: z(13), color: SLATE, marginTop: z(1), lineHeight: lh(z(13)) },
    chipRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: z(4), marginTop: z(8) },
    chip: { flexDirection: 'row', alignItems: 'center', gap: z(5), paddingHorizontal: z(9), height: z(24), borderRadius: 99, backgroundColor: '#F1F3FA' },
    chipDot: { width: z(10), height: z(10), borderRadius: z(5) },
    chipText: { fontSize: z(11.5), fontWeight: '600', color: '#39425E' },
    tripMeta: { alignItems: 'flex-end', gap: z(4) },
    metaText: { fontSize: z(12.5), color: SLATE, lineHeight: lh(z(12.5)) },
  });
}
