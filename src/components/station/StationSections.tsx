import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowRight, Bus, Building2, ChevronLeft, ChevronRight, Flag, GraduationCap, Landmark, Layers, Map as MapIcon, MapPin, Newspaper, ShoppingBag, TrainFront, Trophy, Briefcase, CalendarDays, ArrowLeftRight, type LucideIcon } from 'lucide-react-native';
import { useHomeScale } from '../home/scale';
import { CARD_LINE, NAVY, SLATE, VIOLET, cardShadow } from '../route/primitives';
import { AMENITY_LOOK, AmenityIcon } from './amenityIcons';
import { GateScene } from './GateScene';
import { placeKind, type Amenity, type GateFeatures, type Neighbours, type PlaceKind, type StationAmenities } from '../../lib/stationView';
import type { Landmark as LandmarkT, NearbyConnection } from '../../types';
import { AGENCY_LOOK } from '../../lib/transit/format';
import { walkMinutes } from '../../lib/transit/planner';
import type { NearbyStop } from '../../lib/transit/nearby';
import { useT } from '../../i18n/useT';
import type { Language } from '../../i18n';
import { lineHeightFor, spacingFor } from './lineHeight';

type Z = (n: number) => number;

/** A white card with an icon tile and a title, the shell for every section below the actions. */
export function Section({ icon: Icon, tint, tintBg, title, right, children }: { icon: LucideIcon; tint: string; tintBg: string; title: string; right?: React.ReactNode; children: React.ReactNode }) {
  const { z } = useHomeScale();
  const { lang } = useT();
  return (
    <View style={[{ marginHorizontal: 16, borderRadius: z(22), padding: z(14), gap: z(12), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE }, cardShadow, { shadowOpacity: 0.05 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(12) }}>
        <View style={{ width: z(40), height: z(40), borderRadius: z(13), backgroundColor: tintBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={z(21)} color={tint} strokeWidth={1.9} />
        </View>
        <Text style={{ flex: 1, fontSize: z(17.5), fontWeight: '800', color: NAVY, lineHeight: lineHeightFor(lang, z(17.5), 1.35) }} accessibilityRole="header">
          {title}
        </Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function PillButton({ label, icon: Icon, onPress }: { label: string; icon: LucideIcon; onPress: () => void }) {
  const { z } = useHomeScale();
  const { lang } = useT();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), minHeight: Math.max(44, z(34)), paddingHorizontal: z(11), borderRadius: z(17), borderWidth: 1, borderColor: '#D9D3FF', backgroundColor: '#FFFFFF' }}>
      <Icon size={z(15)} color={VIOLET} strokeWidth={2} />
      <Text style={{ fontSize: z(12.5), fontWeight: '700', color: VIOLET, lineHeight: lineHeightFor(lang, z(12.5)) }}>{label}</Text>
    </Pressable>
  );
}

// ------------------------------------------------------------------ actions

export function ActionButtons({ onStart, onGo }: { onStart: () => void; onGo: () => void }) {
  const { z } = useHomeScale();
  const { t, lang } = useT();
  const base = { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: z(12), minHeight: z(66), paddingVertical: z(8), paddingHorizontal: z(16), borderRadius: z(20) };
  const title = { fontSize: z(16.5), fontWeight: '800' as const, lineHeight: lineHeightFor(lang, z(16.5), 1.3) };
  const sub = { fontSize: z(12), lineHeight: lineHeightFor(lang, z(12)) };
  return (
    <View style={{ flexDirection: 'row', gap: z(12), marginHorizontal: 16 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('station.action.startA11y')} onPress={onStart} style={({ pressed }) => [base, { backgroundColor: '#E7E3FF', opacity: pressed ? 0.85 : 1 }]}>
        <Flag size={z(24)} color={VIOLET} strokeWidth={2} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[title, { color: '#2E1FA8' }]}>{t('station.action.start')}</Text>
          <Text style={[sub, { color: '#5A5FA8' }]}>{t('station.action.startSub')}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('station.action.goA11y')} onPress={onGo} style={({ pressed }) => [base, { backgroundColor: VIOLET, opacity: pressed ? 0.9 : 1, shadowColor: VIOLET, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 }]}>
        <MapPin size={z(24)} color="#FFFFFF" strokeWidth={2} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[title, { color: '#FFFFFF' }]}>{t('station.action.go')}</Text>
          <Text style={[sub, { color: '#DCD6FF' }]}>{t('station.action.goSub')}</Text>
        </View>
      </Pressable>
    </View>
  );
}

// -------------------------------------------------------------- line cards

export interface LineCardData {
  id: string;
  name: string;
  color: string;
  ends: string;
  phase: number;
  type: string | null;
}

export function LineCards({ lines }: { lines: LineCardData[] }) {
  const { z } = useHomeScale();
  const { t, lang } = useT();
  return (
    <View style={{ flexDirection: 'row', gap: z(10), marginHorizontal: 16 }}>
      {lines.map((l) => (
        <View key={l.id} accessible accessibilityLabel={l.type ? t('station.line.a11yTyped', { name: l.name, phase: l.phase, type: l.type, ends: l.ends }) : t('station.line.a11y', { name: l.name, phase: l.phase, ends: l.ends })} style={[{ flex: 1, minWidth: 0, padding: z(12), borderRadius: z(18), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, gap: z(6) }, cardShadow, { shadowOpacity: 0.05 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8) }}>
            <View style={{ width: z(14), height: z(14), borderRadius: z(7), backgroundColor: l.color }} />
            <Text style={{ flex: 1, fontSize: z(14.5), fontWeight: '800', color: NAVY, lineHeight: lineHeightFor(lang, z(14.5), 1.35) }} numberOfLines={2}>
              {l.name}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: z(6), flexWrap: 'wrap' }}>
            <Tag z={z} lang={lang} label={t('station.line.phase', { phase: l.phase })} color="#B54708" bg="#FFF1E3" />
            {l.type ? <Tag z={z} lang={lang} label={l.type} color="#2E1FA8" bg="#EFEDFF" /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(5) }}>
            <ArrowLeftRight size={z(12)} color={SLATE} />
            <Text style={{ flex: 1, fontSize: z(12), color: SLATE, lineHeight: lineHeightFor(lang, z(12)) }} numberOfLines={2}>
              {l.ends}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Tag({ z, lang, label, color, bg }: { z: Z; lang: Language; label: string; color: string; bg: string }) {
  return (
    <View style={{ paddingHorizontal: z(8), minHeight: z(21), borderRadius: z(10.5), backgroundColor: bg, justifyContent: 'center' }}>
      <Text style={{ fontSize: z(11), fontWeight: '700', color, lineHeight: lineHeightFor(lang, z(11)) }}>{label}</Text>
    </View>
  );
}

// --------------------------------------------------------- neighbour strip

export interface StripNode {
  id: string;
  name: string;
  minutes: number | null;
  towards: string;
}

/** previous - this - next station on a line, with estimated minutes; tap a neighbour to open it. */
export function NeighbourStrip({ tabs, nameOf, minutesOf, here, onOpen, onMap }: { tabs: Neighbours[]; nameOf: (id: string) => string; minutesOf: (a: string, b: string) => number | null; here: { id: string; name: string }; onOpen: (id: string) => void; onMap: () => void }) {
  const { z } = useHomeScale();
  const { t, tn, lang } = useT();
  const [sel, setSel] = useState(0);
  const n = tabs[Math.min(sel, tabs.length - 1)];
  if (!n) return null;
  const color = n.corridor.color;
  const node = (side: 'prev' | 'next') => {
    const nb = n[side];
    if (!nb) return <EndNode z={z} color={color} />;
    const m = minutesOf(here.id, nb.id);
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={m !== null ? t('station.strip.nodeA11yMin', { name: nameOf(nb.id), minutes: tn('station.minutes', m), towards: nameOf(nb.towardsId) }) : t('station.strip.nodeA11y', { name: nameOf(nb.id), towards: nameOf(nb.towardsId) })} onPress={() => onOpen(nb.id)} style={{ flex: 1, alignItems: 'center', gap: z(3) }}>
        <View style={{ width: z(24), height: z(24), borderRadius: z(12), backgroundColor: '#FFFFFF', borderWidth: z(5), borderColor: '#B7BDEB', marginTop: z(10) }} />
        <Text style={{ fontSize: z(14), fontWeight: '700', color: NAVY, textAlign: 'center' }} numberOfLines={2}>
          {nameOf(nb.id)}
        </Text>
        <Text style={{ fontSize: z(12), color: SLATE, lineHeight: lineHeightFor(lang, z(12)) }}>{m !== null ? t('station.strip.min', { m }) : ' '}</Text>
      </Pressable>
    );
  };
  return (
    <Section icon={TrainFront} tint="#4F35E8" tintBg="#EFEDFF" title={t('station.strip.title')} right={<PillButton label={t('station.strip.lineMap')} icon={MapIcon} onPress={onMap} />}>
      {tabs.length > 1 ? (
        <View style={{ flexDirection: 'row', gap: z(8) }} accessibilityRole="radiogroup">
          {tabs.map((tab, i) => (
            <Pressable key={tab.corridor.id} accessibilityRole="radio" accessibilityState={{ selected: i === sel, checked: i === sel }} aria-checked={i === sel} accessibilityLabel={tab.corridor.shortName} onPress={() => setSel(i)} style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), minHeight: Math.max(44, z(32)), paddingHorizontal: z(12), borderRadius: z(16), backgroundColor: i === sel ? VIOLET : '#F3F4FA' }}>
              <View style={{ width: z(8), height: z(8), borderRadius: z(4), backgroundColor: tab.corridor.color, borderWidth: 1, borderColor: '#FFFFFF' }} />
              <Text style={{ fontSize: z(12.5), fontWeight: '700', color: i === sel ? '#FFFFFF' : NAVY }}>{tab.corridor.shortName}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View>
        <View style={{ position: 'absolute', left: z(24), right: z(24), top: z(22), height: z(5), borderRadius: z(3), backgroundColor: color, opacity: 0.55 }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {node('prev')}
          <View style={{ flex: 1.1, alignItems: 'center', gap: z(3) }} accessible accessibilityLabel={t('station.strip.hereA11y', { name: here.name })}>
            <View style={{ width: z(46), height: z(46), borderRadius: z(23), backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderWidth: z(3), borderColor: '#FFFFFF', shadowColor: color, shadowOpacity: 0.45, shadowRadius: 8, elevation: 5 }}>
              <TrainFront size={z(22)} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text style={{ fontSize: z(15), fontWeight: '800', color: NAVY, textAlign: 'center' }} numberOfLines={2}>
              {here.name}
            </Text>
            <View style={{ paddingHorizontal: z(9), minHeight: z(21), borderRadius: z(11), backgroundColor: '#FFF1E3', justifyContent: 'center' }}>
              <Text style={{ fontSize: z(10.5), fontWeight: '800', color: '#B54708', textAlign: 'center', lineHeight: lineHeightFor(lang, z(10.5)) }}>{t('station.strip.here')}</Text>
            </View>
          </View>
          {node('next')}
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Dir z={z} left label={n.prev ? nameOf(n.prev.towardsId) : null} />
        <Dir z={z} label={n.next ? nameOf(n.next.towardsId) : null} />
      </View>
    </Section>
  );
}

function EndNode({ z, color }: { z: Z; color: string }) {
  const { t, lang } = useT();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: z(3), opacity: 0.7 }} accessible accessibilityLabel={t('station.strip.endA11y')}>
      <View style={{ width: z(24), height: z(24), borderRadius: z(12), backgroundColor: '#F3F4FA', borderWidth: z(3), borderColor: color, alignItems: 'center', justifyContent: 'center', marginTop: z(10) }}>
        <Flag size={z(11)} color={color} />
      </View>
      <Text style={{ fontSize: z(13), fontWeight: '600', color: SLATE, textAlign: 'center', lineHeight: lineHeightFor(lang, z(13)) }}>{t('station.strip.end')}</Text>
      <Text style={{ fontSize: z(12), color: SLATE }}> </Text>
    </View>
  );
}

function Dir({ z, label, left }: { z: Z; label: string | null; left?: boolean }) {
  const { t, lang } = useT();
  if (!label) return <View />;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(4), flexShrink: 1, maxWidth: '50%' }}>
      {left ? <ChevronLeft size={z(13)} color={SLATE} /> : null}
      <Text style={{ flexShrink: 1, fontSize: z(11.5), color: SLATE, lineHeight: lineHeightFor(lang, z(11.5)) }}>{t('station.strip.towards', { name: label })}</Text>
      {left ? null : <ChevronRight size={z(13)} color={SLATE} />}
    </View>
  );
}

// ------------------------------------------------------------------- gates

export function GatesSection({ gates, underground, lineColor, night, towards, hasServiceNote }: { gates: GateFeatures[]; underground: boolean; lineColor: string; night: number; towards: { name: string; color: string }[]; hasServiceNote: boolean }) {
  const { z } = useHomeScale();
  const { t, lang } = useT();
  const [sel, setSel] = useState(0);
  const g = gates[Math.min(sel, gates.length - 1)];
  return (
    <Section icon={Layers} tint="#4F35E8" tintBg="#EFEDFF" title={t('station.gates.title')}>
      {!g ? (
        <Text style={{ fontSize: z(13), color: SLATE, lineHeight: lineHeightFor(lang, z(13)) }}>{hasServiceNote ? t('station.gates.notListed') : t('station.gates.none')}</Text>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: z(8) }} accessibilityRole="radiogroup">
            {gates.map((x, i) => (
              <Pressable key={x.number} accessibilityRole="radio" accessibilityState={{ selected: i === sel, checked: i === sel }} aria-checked={i === sel} accessibilityLabel={t('station.gates.gate', { n: x.number })} onPress={() => setSel(i)} style={{ minWidth: z(76), minHeight: Math.max(44, z(38)), borderRadius: z(19), alignItems: 'center', justifyContent: 'center', paddingHorizontal: z(14), backgroundColor: i === sel ? VIOLET : '#F3F4FA' }}>
                <Text style={{ fontSize: z(14), fontWeight: '700', color: i === sel ? '#FFFFFF' : '#46508C', lineHeight: lineHeightFor(lang, z(14)) }}>{t('station.gates.gate', { n: x.number })}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ borderRadius: z(18), overflow: 'hidden', borderWidth: 1, borderColor: CARD_LINE }}>
            <GateScene gate={g} underground={underground} lineColor={lineColor} night={night} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: z(14) }}>
            {g.lifts.length > 0 ? <Legend z={z} k="lift" label={t('station.gates.lift', { nums: g.lifts.map((l) => String(l).padStart(2, '0')).join(', ') })} /> : null}
            {g.lifts.length > 0 ? <Legend z={z} k="ramp" label={t('station.amenity.wheelchairRamp')} /> : null}
            {g.connections.map((c) => (
              <Legend key={c.note} z={z} k="gates" link={c.kind} label={t('station.gates.link', { kind: c.kind === 'brts' ? 'BRTS' : c.kind === 'rail' ? t('station.kind.rail') : t('station.kind.bus') })} dashed />
            ))}
            {g.lifts.length === 0 && g.connections.length === 0 ? <Text style={{ fontSize: z(12.5), color: SLATE, lineHeight: lineHeightFor(lang, z(12.5)) }}>{t('station.gates.noLiftLink')}</Text> : null}
          </View>
        </>
      )}
      <View style={{ gap: z(8) }}>
        <Text style={{ fontSize: z(11.5), fontWeight: '800', color: SLATE, letterSpacing: spacingFor(lang, 0.8), lineHeight: lineHeightFor(lang, z(11.5)) }}>{t('station.gates.towards')}</Text>
        <View style={{ flexDirection: 'row', gap: z(8), flexWrap: 'wrap' }}>
          {towards.map((tw) => (
            <View key={tw.name} style={{ flexDirection: 'row', alignItems: 'center', gap: z(7), minHeight: z(36), paddingHorizontal: z(12), borderRadius: z(18), backgroundColor: '#F8F8FD', borderWidth: 1.5, borderColor: tw.color }}>
              <ArrowRight size={z(14)} color={tw.color} strokeWidth={2.4} />
              <Text style={{ flexShrink: 1, fontSize: z(13), fontWeight: '700', color: NAVY }}>{tw.name}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={{ fontSize: z(11.5), color: SLATE, lineHeight: lineHeightFor(lang, z(11.5)) }}>{t('station.gates.caption')}</Text>
    </Section>
  );
}

function Legend({ z, k, label, dashed, link }: { z: Z; k: Amenity['key']; label: string; dashed?: boolean; link?: NearbyConnection['kind'] }) {
  const l = AMENITY_LOOK[k];
  const LinkIcon = link === 'rail' ? TrainFront : Bus;
  const { lang } = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(7) }}>
      <View style={{ width: z(28), height: z(28), borderRadius: z(9), backgroundColor: l.bg, alignItems: 'center', justifyContent: 'center', borderWidth: dashed ? 1.5 : 0, borderStyle: 'dashed', borderColor: l.fg }}>
        {link ? <LinkIcon size={z(15)} color={l.fg} strokeWidth={1.9} /> : <AmenityIcon k={k} size={z(15)} color={l.fg} />}
      </View>
      <Text style={{ flexShrink: 1, fontSize: z(12.5), color: NAVY, fontWeight: '600', lineHeight: lineHeightFor(lang, z(12.5)) }}>{label}</Text>
    </View>
  );
}

// --------------------------------------------------------------- amenities

export function AmenitiesSection({ data }: { data: StationAmenities }) {
  const { z } = useHomeScale();
  const { t, lang } = useT();
  const network = [...data.network.general, ...data.network.accessibility];
  return (
    <Section icon={Building2} tint="#4F35E8" tintBg="#EFEDFF" title={t('station.amenities.title')}>
      {data.here.length > 0 ? (
        <View style={{ gap: z(8) }}>
          <Text style={{ fontSize: z(11.5), fontWeight: '800', color: SLATE, letterSpacing: spacingFor(lang, 0.8), lineHeight: lineHeightFor(lang, z(11.5)) }}>{t('station.amenities.here')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: z(10) }}>
            {data.here.map((a) => (
              <Tile key={a.key} z={z} k={a.key} label={a.label} count={a.count} />
            ))}
          </View>
        </View>
      ) : null}
      <View style={{ gap: z(8) }}>
        <Text style={{ fontSize: z(11.5), fontWeight: '800', color: SLATE, letterSpacing: spacingFor(lang, 0.8), lineHeight: lineHeightFor(lang, z(11.5)) }}>{t('station.amenities.network')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: z(8), paddingVertical: z(2) }}>
          {network.map((a) => (
            <Tile key={a.key + a.label} z={z} k={a.key} label={a.label} faded small />
          ))}
        </ScrollView>
        <Text style={{ fontSize: z(11.5), color: SLATE, lineHeight: lineHeightFor(lang, z(11.5)) }}>{t('station.amenities.note')}</Text>
      </View>
    </Section>
  );
}

function Tile({ z, k, label, count, faded, small }: { z: Z; k: Amenity['key']; label: string; count?: number; faded?: boolean; small?: boolean }) {
  const look = AMENITY_LOOK[k];
  const { t, lang } = useT();
  const box = small ? 46 : 56;
  return (
    <View accessible accessibilityLabel={`${count ? count + ' ' : ''}${label}${faded ? `, ${t('station.amenities.faded')}` : ''}`} style={{ width: z(small ? 66 : 72), alignItems: 'center', gap: z(5), opacity: faded ? 0.6 : 1 }}>
      <View style={{ width: z(box), height: z(box), borderRadius: z(small ? 15 : 17), backgroundColor: look.bg, alignItems: 'center', justifyContent: 'center', borderWidth: faded ? 1.5 : 0, borderStyle: 'dashed', borderColor: look.fg }}>
        <AmenityIcon k={k} size={z(small ? 22 : 26)} color={look.fg} />
        {count ? (
          <View style={{ position: 'absolute', top: z(-6), right: z(-6), minWidth: z(22), height: z(22), borderRadius: z(11), backgroundColor: look.fg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: z(5), borderWidth: 2, borderColor: '#FFFFFF' }}>
            <Text style={{ fontSize: z(11.5), fontWeight: '800', color: '#FFFFFF' }}>{count}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ fontSize: z(small ? 10.5 : 11.5), color: NAVY, textAlign: 'center', fontWeight: '500', lineHeight: lineHeightFor(lang, z(small ? 10.5 : 11.5), 1.4) }} numberOfLines={3}>
        {label}
      </Text>
    </View>
  );
}

// ------------------------------------------------------------------ nearby

const PLACE_ICON: Record<PlaceKind, { Icon: LucideIcon; fg: string; bg: string }> = {
  education: { Icon: GraduationCap, fg: '#4F35E8', bg: '#EFEDFF' },
  sport: { Icon: Trophy, fg: '#0E9F6E', bg: '#E4F7EF' },
  business: { Icon: Briefcase, fg: '#0F6FC4', bg: '#E3F1FC' },
  rail: { Icon: TrainFront, fg: '#D92D20', bg: '#FDECEA' },
  culture: { Icon: Landmark, fg: '#B45309', bg: '#FEF3C7' },
  government: { Icon: Landmark, fg: '#475569', bg: '#EEF1F6' },
  market: { Icon: ShoppingBag, fg: '#EA7A1A', bg: '#FFF1E3' },
  event: { Icon: CalendarDays, fg: '#7A3DDB', bg: '#F1E8FF' },
  media: { Icon: Newspaper, fg: '#0E8F8F', bg: '#E1F5F4' },
  other: { Icon: MapPin, fg: '#475569', bg: '#EEF1F6' },
};

export function NearbySection({ places, links, onMaps }: { places: LandmarkT[]; links: NearbyConnection[]; onMaps: () => void }) {
  const { z } = useHomeScale();
  const { t, lang } = useT();
  if (places.length === 0 && links.length === 0) return null;
  return (
    <Section icon={MapPin} tint="#4F35E8" tintBg="#EFEDFF" title={t('station.nearby.title')} right={<PillButton label={t('station.nearby.maps')} icon={MapPin} onPress={onMaps} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: z(10) }}>
        {places.map((p) => {
          const k = PLACE_ICON[placeKind(p.category)];
          return (
            <View key={p.id} accessible accessibilityLabel={t('station.nearby.placeA11y', { name: p.name })} style={{ width: z(140), borderRadius: z(16), overflow: 'hidden', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D9D3FF', backgroundColor: '#FFFFFF' }}>
              <View style={{ height: z(64), backgroundColor: k.bg, alignItems: 'center', justifyContent: 'center' }}>
                <k.Icon size={z(30)} color={k.fg} strokeWidth={1.8} />
              </View>
              <View style={{ padding: z(10), gap: 2 }}>
                <Text style={{ fontSize: z(13), fontWeight: '700', color: NAVY }} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={{ fontSize: z(11), color: SLATE, lineHeight: lineHeightFor(lang, z(11)) }}>{t('station.nearby.distance')}</Text>
              </View>
            </View>
          );
        })}
        {links.map((c) => (
          <View key={c.note} accessible accessibilityLabel={t('station.nearby.linkA11y', { note: c.note })} style={{ width: z(140), borderRadius: z(16), overflow: 'hidden', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D9D3FF', backgroundColor: '#FFFFFF' }}>
            <View style={{ height: z(64), backgroundColor: '#EFEDFF', alignItems: 'center', justifyContent: 'center' }}>
              {c.kind === 'rail' ? <TrainFront size={z(30)} color="#4F35E8" strokeWidth={1.8} /> : <Bus size={z(30)} color="#4F35E8" strokeWidth={1.8} />}
            </View>
            <View style={{ padding: z(10), gap: 2 }}>
              <Text style={{ fontSize: z(12.5), fontWeight: '700', color: NAVY }} numberOfLines={3}>
                {c.note}
              </Text>
              <Text style={{ fontSize: z(11), color: SLATE, lineHeight: lineHeightFor(lang, z(11)) }}>{t('station.nearby.unverified')}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <Text style={{ fontSize: z(11.5), color: SLATE, lineHeight: lineHeightFor(lang, z(11.5)) }}>{t('station.nearby.caption')}</Text>
    </Section>
  );
}

// -------------------------------------------------------------- buses nearby


/** Real bus stops (from the timetable feed) within a few hundred metres of the station pin, with the routes serving them. */
export function BusesSection({ stops, loading, onPlan }: { stops: NearbyStop[]; loading: boolean; onPlan: (stopId: string) => void }) {
  const { z } = useHomeScale();
  const { t, tn, lang } = useT();
  return (
    <Section icon={Bus} tint="#0F6FC4" tintBg="#E3F1FC" title={t('station.buses.title')}>
      {loading ? (
        <Text style={{ fontSize: z(13), color: SLATE, lineHeight: lineHeightFor(lang, z(13)) }}>{t('station.buses.loading')}</Text>
      ) : stops.length === 0 ? (
        <Text style={{ fontSize: z(13), color: SLATE, lineHeight: lineHeightFor(lang, z(13)) }}>{t('station.buses.none')}</Text>
      ) : (
        <View style={{ gap: z(10) }}>
          {stops.map((s) => (
            <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={t('station.buses.a11y', { name: s.name, minutes: tn('station.minutes', Math.max(1, Math.round(walkMinutes(s.m)))), routes: s.routes.slice(0, 8).map((r) => r.short).join(', ') })} onPress={() => onPlan(s.id)} style={({ pressed }) => ({ flexDirection: 'row', gap: z(12), padding: z(12), borderRadius: z(16), backgroundColor: '#F8FAFD', borderWidth: 1, borderColor: CARD_LINE, opacity: pressed ? 0.9 : 1 })}>
              <View style={{ width: z(40), height: z(40), borderRadius: z(13), backgroundColor: '#E3F1FC', alignItems: 'center', justifyContent: 'center' }}>
                <Bus size={z(20)} color="#0F6FC4" strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: z(5) }}>
                <Text style={{ fontSize: z(14.5), fontWeight: '800', color: NAVY }} numberOfLines={2}>
                  {s.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: z(12), color: SLATE, lineHeight: lineHeightFor(lang, z(12)) }}>
                    {t('station.buses.walk', { min: Math.max(1, Math.round(walkMinutes(s.m))), m: s.m })}
                  </Text>
                  {s.named ? (
                    <View style={{ paddingHorizontal: z(7), minHeight: z(20), borderRadius: z(10), backgroundColor: '#E4F7EF', justifyContent: 'center' }}>
                      <Text style={{ fontSize: z(10.5), fontWeight: '800', color: '#0B7A54', lineHeight: lineHeightFor(lang, z(10.5)) }}>{t('station.buses.metroName')}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: z(5) }}>
                  {s.routes.slice(0, 8).map((r) => (
                    <View key={`${r.agency}${r.short}`} style={{ paddingHorizontal: z(7), height: z(21), borderRadius: z(10.5), backgroundColor: AGENCY_LOOK[r.agency].soft, justifyContent: 'center' }}>
                      <Text style={{ fontSize: z(11), fontWeight: '800', color: AGENCY_LOOK[r.agency].color }}>{r.short}</Text>
                    </View>
                  ))}
                  {s.routes.length > 8 ? <Text style={{ fontSize: z(11.5), color: SLATE, alignSelf: 'center', lineHeight: lineHeightFor(lang, z(11.5)) }}>{t('station.buses.more', { n: s.routes.length - 8 })}</Text> : null}
                </View>
              </View>
              <ChevronRight size={z(18)} color="#5A5FA8" style={{ alignSelf: 'center' }} />
            </Pressable>
          ))}
        </View>
      )}
      <Text style={{ fontSize: z(11.5), color: SLATE, lineHeight: lineHeightFor(lang, z(11.5)) }}>{t('station.buses.caption')}</Text>
    </Section>
  );
}
