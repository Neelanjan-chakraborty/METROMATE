import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Bus, ChevronLeft, ChevronRight, Clock, Footprints, Repeat, Ticket, TrainFront, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { useHomeScale } from '../home/scale';
import { CARD_LINE, NAVY, SLATE, VIOLET, cardShadow } from '../route/primitives';
import { AGENCY_LOOK, dayOffset, formatClockMinutes, formatSpan } from '../../lib/transit/format';
import type { TransitPlan } from '../../lib/transit/planner';
import type { Corridor } from '../../types';

const time = (m: number) => `${formatClockMinutes(m)}${dayOffset(m) > 0 ? ' +1' : ''}`;

// ---------------------------------------------------------------- summary

export function TransitSummary({ plan, fromName, toName, whenLabel, onStep, onNow, canNow }: { plan: TransitPlan; fromName: string; toName: string; whenLabel: string; onStep: (d: number) => void; onNow: () => void; canNow: boolean }) {
  const { z } = useHomeScale();
  const first = plan.legs[0];
  const span = plan.arriveAt - (first.mode === 'walk' ? first.depart : first.depart);
  const modes = new Set(plan.legs.map((l) => l.mode));
  return (
    <View style={[{ marginHorizontal: 16, borderRadius: z(24), padding: z(16), gap: z(14), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE }, cardShadow]}>
      <View style={{ flexDirection: 'row', gap: z(12) }}>
        <End z={z} label="FROM" name={fromName} dot="#4F35E8" />
        <View style={{ width: 1, backgroundColor: CARD_LINE }} />
        <End z={z} label="TO" name={toName} dot="#E5484D" />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8) }} accessible accessibilityLabel={`Leave ${time(plan.departAt)}, arrive about ${time(plan.arriveAt)}, ${formatSpan(span)}`}>
        <Big z={z} top="Leave" value={time(plan.departAt)} />
        <Text style={{ fontSize: z(22), color: SLATE }}>→</Text>
        <Big z={z} top="Arrive about" value={time(plan.arriveAt)} accent />
        <View style={{ flex: 1 }} />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: z(11.5), color: SLATE }}>Total</Text>
          <Text style={{ fontSize: z(19), fontWeight: '800', color: NAVY }}>{formatSpan(span)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), height: z(34), paddingHorizontal: z(12), borderRadius: z(17), backgroundColor: '#F1EFFF' }}>
          <Clock size={z(14)} color={VIOLET} strokeWidth={2.1} />
          <Text style={{ fontSize: z(13), fontWeight: '700', color: VIOLET }}>{whenLabel}</Text>
        </View>
        <Step z={z} label="15 minutes earlier" onPress={() => onStep(-15)} Icon={ChevronLeft} />
        <Step z={z} label="15 minutes later" onPress={() => onStep(15)} Icon={ChevronRight} />
        {canNow ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Leave now" onPress={onNow} style={{ height: z(34), paddingHorizontal: z(12), borderRadius: z(17), borderWidth: 1, borderColor: '#D9D3FF', justifyContent: 'center' }}>
            <Text style={{ fontSize: z(13), fontWeight: '700', color: VIOLET }}>Now</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: z(8) }}>
        <Tile z={z} Icon={Repeat} tint="#B45309" bg="#FEF3C7" value={String(plan.transfers)} label={plan.transfers === 1 ? 'Change' : 'Changes'} a11y={`${plan.transfers} changes`} />
        <Tile z={z} Icon={Footprints} tint="#475569" bg="#EEF1F6" value={plan.walkMeters >= 1000 ? `${(plan.walkMeters / 1000).toFixed(1)} km` : `${plan.walkMeters} m`} label="Walking" a11y={`${plan.walkMeters} metres of walking, approximate`} />
        <Tile z={z} Icon={modes.has('metro') && !modes.has('bus') ? TrainFront : Bus} tint="#0F6FC4" bg="#E3F1FC" value={String(plan.rides)} label={plan.rides === 1 ? 'Ride' : 'Rides'} a11y={`${plan.rides} rides`} />
        <Tile
          z={z}
          Icon={Ticket}
          tint="#0F6FC4"
          bg="#E3F1FC"
          value={plan.fare.knownInr !== null ? `₹${plan.fare.knownInr}` : 'N/A'}
          label={plan.fare.knownInr !== null && plan.fare.partial ? 'BRTS only' : 'Fare'}
          a11y={plan.fare.knownInr !== null ? `Known fare ${plan.fare.knownInr} rupees${plan.fare.partial ? ', not the whole fare' : ''}` : 'Fare unavailable offline'}
        />
      </View>
    </View>
  );
}

function End({ z, label, name, dot }: { z: (n: number) => number; label: string; name: string; dot: string }) {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: z(4) }} accessible accessibilityLabel={`${label.toLowerCase()} ${name}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6) }}>
        <View style={{ width: z(11), height: z(11), borderRadius: z(6), borderWidth: z(3), borderColor: dot }} />
        <Text style={{ fontSize: z(11), fontWeight: '800', color: SLATE, letterSpacing: 1 }}>{label}</Text>
      </View>
      <Text style={{ fontSize: z(19), fontWeight: '800', color: NAVY, letterSpacing: -0.3, lineHeight: z(23) }} numberOfLines={3}>
        {name}
      </Text>
    </View>
  );
}

function Big({ z, top, value, accent }: { z: (n: number) => number; top: string; value: string; accent?: boolean }) {
  return (
    <View>
      <Text style={{ fontSize: z(11.5), color: SLATE }}>{top}</Text>
      <Text style={{ fontSize: z(26), fontWeight: '800', color: accent ? VIOLET : NAVY, letterSpacing: -0.5 }}>{value}</Text>
    </View>
  );
}

function Step({ z, label, onPress, Icon }: { z: (n: number) => number; label: string; onPress: () => void; Icon: LucideIcon }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ width: z(34), height: z(34), borderRadius: z(17), backgroundColor: '#F1EFFF', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={z(18)} color={VIOLET} strokeWidth={2.2} />
    </Pressable>
  );
}

function Tile({ z, Icon, tint, bg, value, label, a11y }: { z: (n: number) => number; Icon: LucideIcon; tint: string; bg: string; value: string; label: string; a11y: string }) {
  return (
    <View accessible accessibilityLabel={a11y} style={{ flex: 1, alignItems: 'center', gap: z(5), paddingVertical: z(10), borderRadius: z(16), backgroundColor: '#F8F8FD', borderWidth: 1, borderColor: CARD_LINE }}>
      <View style={{ width: z(28), height: z(28), borderRadius: z(14), backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={z(15)} color={tint} strokeWidth={2.1} />
      </View>
      <Text style={{ fontSize: z(16), fontWeight: '800', color: NAVY }} numberOfLines={1}>
        {value}
      </Text>
      <Text style={{ fontSize: z(11), color: SLATE }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------- options

/** One small card per alternative (fewest rides vs earliest arrival); the selected one is outlined in violet. */
export function PlanOptions({ plans, selected, onSelect, corridors }: { plans: TransitPlan[]; selected: number; onSelect: (i: number) => void; corridors: Map<string, Corridor> }) {
  const { z } = useHomeScale();
  if (plans.length < 2) return null;
  const earliest = Math.min(...plans.map((p) => p.arriveAt));
  const fewest = Math.min(...plans.map((p) => p.rides));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: z(10) }} accessibilityRole="radiogroup">
      {plans.map((p, i) => {
        const on = i === selected;
        const tag = p.arriveAt === earliest ? 'Earliest arrival' : p.rides === fewest ? 'Fewest changes' : 'Option';
        return (
          <Pressable key={i} accessibilityRole="radio" accessibilityState={{ selected: on, checked: on }} aria-checked={on} accessibilityLabel={`${tag}: arrive about ${time(p.arriveAt)}, ${p.rides} ${p.rides === 1 ? 'ride' : 'rides'}`} onPress={() => onSelect(i)} style={{ width: z(150), padding: z(12), borderRadius: z(18), backgroundColor: on ? '#F1EFFF' : '#FFFFFF', borderWidth: on ? 2 : 1, borderColor: on ? VIOLET : CARD_LINE, gap: z(5) }}>
            <Text style={{ fontSize: z(11), fontWeight: '800', color: on ? VIOLET : SLATE, letterSpacing: 0.5 }}>{tag.toUpperCase()}</Text>
            <Text style={{ fontSize: z(20), fontWeight: '800', color: NAVY }}>{time(p.arriveAt)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(4), flexWrap: 'wrap' }}>
              {p.legs
                .filter((l) => l.mode !== 'walk')
                .map((l, j) => (
                  <View key={j} style={{ paddingHorizontal: z(6), height: z(20), borderRadius: z(10), backgroundColor: l.mode === 'bus' ? AGENCY_LOOK[l.agency].color : corridors.get(l.corridorId)?.color ?? VIOLET, justifyContent: 'center' }}>
                    <Text style={{ fontSize: z(10.5), fontWeight: '800', color: '#FFFFFF' }}>{l.mode === 'bus' ? l.routeShort : 'Metro'}</Text>
                  </View>
                ))}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ------------------------------------------------------------------- notes

export function NoteCard({ text, tone = 'warn' }: { text: string; tone?: 'warn' | 'info' }) {
  const { z } = useHomeScale();
  const warn = tone === 'warn';
  return (
    <View style={{ marginHorizontal: 16, flexDirection: 'row', gap: z(10), padding: z(12), borderRadius: z(16), backgroundColor: warn ? '#FFF4E5' : '#F1EFFF', borderWidth: 1, borderColor: warn ? '#F9D9A8' : '#D9D3FF' }}>
      <TriangleAlert size={z(18)} color={warn ? '#B54708' : VIOLET} />
      <Text style={{ flex: 1, fontSize: z(13), color: warn ? '#7A3B06' : '#2E1FA8' }}>{text}</Text>
    </View>
  );
}

export function FareCard({ plan }: { plan: TransitPlan }) {
  const { z } = useHomeScale();
  const f = plan.fare;
  const names: Record<string, string> = { AMTS: 'AMTS bus', GTSL: 'Gandhinagar bus', BRTS: 'some BRTS stops', metro: 'metro' };
  return (
    <View style={[{ marginHorizontal: 16, padding: z(14), borderRadius: z(20), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CARD_LINE, gap: z(6) }, cardShadow, { shadowOpacity: 0.05 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
        <View style={{ width: z(38), height: z(38), borderRadius: z(12), backgroundColor: '#E3F1FC', alignItems: 'center', justifyContent: 'center' }}>
          <Ticket size={z(20)} color="#0F6FC4" strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: z(16), fontWeight: '800', color: NAVY }}>{f.knownInr !== null ? `₹${f.knownInr} adult · ₹${f.knownChildInr} child` : 'Fare not available offline'}</Text>
          <Text style={{ fontSize: z(12.5), color: SLATE }}>{f.knownInr !== null ? (f.partial ? 'BRTS fare only. The rest is not available offline.' : 'BRTS fare from the timetable feed.') : 'No verified fare is stored for this trip.'}</Text>
        </View>
      </View>
      {f.unavailable.length > 0 ? <Text style={{ fontSize: z(12), color: SLATE }}>No fare data for: {f.unavailable.map((u) => names[u]).join(', ')}. MetroMate never guesses a fare.</Text> : null}
    </View>
  );
}
