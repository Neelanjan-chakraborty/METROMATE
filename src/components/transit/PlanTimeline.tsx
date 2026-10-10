import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowRight, Bus, ChevronDown, ChevronUp, Flag, Footprints, MapPin, Repeat, TrainFront } from 'lucide-react-native';
import { useHomeScale } from '../home/scale';
import { NAVY, SLATE, VIOLET } from '../route/primitives';
import { AGENCY_LOOK, dayOffset, formatClockMinutes, formatSpan } from '../../lib/transit/format';
import type { BusLeg, MetroLeg, TransitLeg, TransitPlan, WalkLeg } from '../../lib/transit/planner';
import type { Corridor } from '../../types';

const GREY = '#B8BED6';

interface Props {
  plan: TransitPlan;
  fromName: string;
  toName: string;
  corridors: Map<string, Corridor>;
  stationName: (id: string) => string;
}

const time = (m: number) => formatClockMinutes(m);
const plusDay = (m: number) => (dayOffset(m) > 0 ? ' +1' : '');

/** A vertical journey: start, then walk / bus / metro legs, then arrival. Bus = scheduled, metro and walking = estimates. */
export function PlanTimeline({ plan, fromName, toName, corridors, stationName }: Props) {
  const { z } = useHomeScale();
  const first = plan.legs[0];
  return (
    <View>
      <Node z={z} kind="start" bottomColor={colorOf(first, corridors)} title={fromName} sub={`Leave ${time(plan.departAt)}${plusDay(plan.departAt)}`} />
      {plan.legs.map((leg, i) => (
        <Block key={i} z={z} leg={leg} corridors={corridors} stationName={stationName} />
      ))}
      <Node z={z} kind="end" topColor={colorOf(plan.legs[plan.legs.length - 1], corridors)} title={toName} sub={`Arrive about ${time(plan.arriveAt)}${plusDay(plan.arriveAt)}`} />
    </View>
  );
}

function colorOf(leg: TransitLeg, corridors: Map<string, Corridor>): string {
  if (leg.mode === 'walk') return GREY;
  if (leg.mode === 'bus') return AGENCY_LOOK[leg.agency].color;
  return corridors.get(leg.corridorId)?.color ?? VIOLET;
}

function Rail({ z, color, dashed, children, pad = 0 }: { z: (n: number) => number; color: string; dashed?: boolean; children: React.ReactNode; pad?: number }) {
  const w = z(34);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
      <View style={{ width: w, alignItems: 'center' }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, width: dashed ? 0 : z(5), left: (w - z(5)) / 2, borderRadius: z(3), backgroundColor: dashed ? 'transparent' : color, borderLeftWidth: dashed ? z(3) : 0, borderStyle: 'dashed', borderColor: color }} />
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingVertical: pad }}>{children}</View>
    </View>
  );
}

function Node({ z, kind, title, sub, topColor, bottomColor }: { z: (n: number) => number; kind: 'start' | 'end'; title: string; sub: string; topColor?: string; bottomColor?: string }) {
  const w = z(34);
  const ring = kind === 'start' ? '#4F35E8' : '#E5484D';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', minHeight: z(54) }} accessible accessibilityLabel={`${kind === 'start' ? 'Start' : 'Arrival'}: ${title}. ${sub}`}>
      <View style={{ width: w, alignItems: 'center', justifyContent: 'center' }}>
        {topColor ? <View style={{ position: 'absolute', top: 0, height: '50%', width: z(5), left: (w - z(5)) / 2, backgroundColor: topColor, borderRadius: z(3) }} /> : null}
        {bottomColor ? <View style={{ position: 'absolute', bottom: 0, height: '50%', width: z(5), left: (w - z(5)) / 2, backgroundColor: bottomColor, borderRadius: z(3) }} /> : null}
        <View style={{ width: z(24), height: z(24), borderRadius: z(12), backgroundColor: '#FFFFFF', borderWidth: z(5), borderColor: ring }} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: z(6) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6) }}>
          {kind === 'start' ? <Flag size={z(14)} color={ring} strokeWidth={2.2} /> : <MapPin size={z(14)} color={ring} strokeWidth={2.2} />}
          <Text style={{ fontSize: z(17), fontWeight: '800', color: NAVY, flexShrink: 1 }} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Text style={{ fontSize: z(12.5), color: SLATE, marginTop: 1 }}>{sub}</Text>
      </View>
    </View>
  );
}

function Block({ z, leg, corridors, stationName }: { z: (n: number) => number; leg: TransitLeg; corridors: Map<string, Corridor>; stationName: (id: string) => string }) {
  if (leg.mode === 'walk') return <WalkRow z={z} leg={leg} />;
  if (leg.mode === 'bus') return <BusCard z={z} leg={leg} />;
  return <MetroCard z={z} leg={leg} corridor={corridors.get(leg.corridorId)} stationName={stationName} />;
}

function WalkRow({ z, leg }: { z: (n: number) => number; leg: WalkLeg }) {
  const min = Math.max(1, Math.round(leg.arrive - leg.depart));
  return (
    <Rail z={z} color={GREY} dashed pad={z(6)}>
      <View accessible accessibilityLabel={`Walk about ${min} minutes, ${Math.round(leg.meters)} metres, to ${leg.to.name}. A rough estimate.`} style={{ flexDirection: 'row', alignItems: 'center', gap: z(8), minHeight: z(30) }}>
        <View style={{ width: z(28), height: z(28), borderRadius: z(14), backgroundColor: '#EEF1F6', alignItems: 'center', justifyContent: 'center' }}>
          <Footprints size={z(15)} color="#475569" strokeWidth={2} />
        </View>
        <Text style={{ flex: 1, fontSize: z(13), color: '#475569' }}>
          Walk about <Text style={{ fontWeight: '800', color: NAVY }}>{min} min</Text> · {Math.round(leg.meters)} m to {leg.to.name}
        </Text>
        <Text style={{ fontSize: z(11), color: SLATE }}>approx.</Text>
      </View>
    </Rail>
  );
}

function BusCard({ z, leg }: { z: (n: number) => number; leg: BusLeg }) {
  const [open, setOpen] = useState(false);
  const look = AGENCY_LOOK[leg.agency];
  return (
    <Rail z={z} color={look.color} pad={z(6)}>
      <View accessible={false} style={{ borderRadius: z(18), borderWidth: 1.5, borderColor: look.color, backgroundColor: '#FFFFFF', padding: z(12), gap: z(10) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
          <View style={{ minWidth: z(44), height: z(34), paddingHorizontal: z(9), borderRadius: z(10), backgroundColor: look.color, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: z(5) }}>
            <Bus size={z(15)} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={{ fontSize: z(15), fontWeight: '800', color: '#FFFFFF' }}>{leg.routeShort}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: z(13.5), fontWeight: '800', color: NAVY }} numberOfLines={1}>
              {look.full}
            </Text>
            <Text style={{ fontSize: z(12.5), color: SLATE }} numberOfLines={1}>
              towards {leg.headsign}
            </Text>
          </View>
        </View>

        <Stop z={z} color={look.color} name={leg.from.name} t={leg.depart} label="Board" />
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${leg.stops} ${leg.stops === 1 ? 'stop' : 'stops'}, about ${Math.round(leg.arrive - leg.depart)} minutes. ${open ? 'Hide' : 'Show'} the stops`} onPress={() => setOpen((o) => !o)} disabled={leg.via.length === 0} style={{ flexDirection: 'row', alignItems: 'center', gap: z(8), paddingLeft: z(20) }}>
          <Text style={{ fontSize: z(12.5), color: '#46508C', fontWeight: '600' }}>
            {leg.stops} {leg.stops === 1 ? 'stop' : 'stops'} · {formatSpan(leg.arrive - leg.depart)}
          </Text>
          {leg.via.length > 0 ? open ? <ChevronUp size={z(15)} color={VIOLET} /> : <ChevronDown size={z(15)} color={VIOLET} /> : null}
        </Pressable>
        {open ? (
          <View style={{ paddingLeft: z(20), gap: z(3) }}>
            {leg.via.map((n, i) => (
              <Text key={i} style={{ fontSize: z(12.5), color: SLATE }} numberOfLines={1}>
                · {n}
              </Text>
            ))}
          </View>
        ) : null}
        <Stop z={z} color={look.color} name={leg.to.name} t={leg.arrive} label="Get off" />

        <View style={{ borderTopWidth: 1, borderTopColor: '#EEF0F8', paddingTop: z(8), gap: z(6) }}>
          <Text style={{ fontSize: z(12.5), color: NAVY }}>
            <Text style={{ fontWeight: '700' }}>Wait {leg.waitMinutes < 1 ? 'under 1 min' : `about ${Math.round(leg.waitMinutes)} min`}</Text> · scheduled, not live
          </Text>
          {leg.nextDepartures.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), flexWrap: 'wrap' }}>
              <Text style={{ fontSize: z(12), color: SLATE }}>Then</Text>
              {leg.nextDepartures.map((t) => (
                <View key={t} style={{ paddingHorizontal: z(8), height: z(22), borderRadius: z(11), backgroundColor: look.soft, justifyContent: 'center' }}>
                  <Text style={{ fontSize: z(11.5), fontWeight: '700', color: look.color }}>
                    {time(t)}
                    {plusDay(t)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={{ fontSize: z(12.5), color: leg.fare ? NAVY : SLATE }}>
            {leg.fare ? `Fare ₹${leg.fare.adult} adult · ₹${leg.fare.child} child` : 'Fare not available offline'}
          </Text>
        </View>
      </View>
    </Rail>
  );
}

function MetroCard({ z, leg, corridor, stationName }: { z: (n: number) => number; leg: MetroLeg; corridor?: Corridor; stationName: (id: string) => string }) {
  const color = corridor?.color ?? VIOLET;
  const line = corridor ? (/branch|line$/i.test(corridor.shortName) ? corridor.shortName : `${corridor.shortName} Line`) : 'Metro';
  return (
    <Rail z={z} color={color} pad={z(6)}>
      <View accessible={false} style={{ borderRadius: z(18), borderWidth: 1.5, borderColor: color, backgroundColor: '#FFFFFF', padding: z(12), gap: z(10) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
          <View style={{ minWidth: z(44), height: z(34), paddingHorizontal: z(9), borderRadius: z(10), backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: z(5) }}>
            <TrainFront size={z(15)} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={{ fontSize: z(13), fontWeight: '800', color: '#FFFFFF' }}>Metro</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: z(13.5), fontWeight: '800', color: NAVY }} numberOfLines={1}>
              {line}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(4) }}>
              <ArrowRight size={z(12)} color={SLATE} />
              <Text style={{ fontSize: z(12.5), color: SLATE, flexShrink: 1 }} numberOfLines={1}>
                towards {stationName(leg.towardsId)}
              </Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: z(8), height: z(22), borderRadius: z(11), backgroundColor: '#FFF4E5', justifyContent: 'center' }}>
            <Text style={{ fontSize: z(10.5), fontWeight: '800', color: '#B54708' }}>ESTIMATED</Text>
          </View>
        </View>
        <Stop z={z} color={color} name={leg.from.name} t={leg.depart} label="Board" approx />
        <Text style={{ fontSize: z(12.5), color: '#46508C', fontWeight: '600', paddingLeft: z(20) }}>
          {leg.stops} {leg.stops === 1 ? 'stop' : 'stops'} · {formatSpan(leg.arrive - leg.depart)}
        </Text>
        <Stop z={z} color={color} name={leg.to.name} t={leg.arrive} label="Get off" approx />
        <View style={{ borderTopWidth: 1, borderTopColor: '#EEF0F8', paddingTop: z(8), gap: z(4) }}>
          <Text style={{ fontSize: z(12.5), color: NAVY }}>
            {leg.firstTrain ? <Text style={{ fontWeight: '700' }}>Waits for the first train of the day</Text> : <Text style={{ fontWeight: '700' }}>Wait about {Math.round(leg.waitMinutes)} min</Text>}
            {leg.headwayMinutes ? ` · trains every ${leg.headwayMinutes} min` : ''}
          </Text>
          {leg.changeAssumed ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6) }}>
              <Repeat size={z(13)} color="#B54708" />
              <Text style={{ fontSize: z(12), color: '#7A3B06', flex: 1 }}>Includes about 5 min to change trains (an assumption: no verified figure).</Text>
            </View>
          ) : null}
          <Text style={{ fontSize: z(12), color: SLATE }}>Times are estimated from GMRC’s published frequency; there is no per-train timetable. Fare not available offline.</Text>
        </View>
      </View>
    </Rail>
  );
}

function Stop({ z, color, name, t, label, approx }: { z: (n: number) => number; color: string; name: string; t: number; label: string; approx?: boolean }) {
  return (
    <View accessible accessibilityLabel={`${label} at ${name}, ${approx ? 'about ' : ''}${time(t)}`} style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
      <View style={{ width: z(10), height: z(10), borderRadius: z(5), backgroundColor: color }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: z(11), fontWeight: '800', color: SLATE, letterSpacing: 0.6 }}>{label.toUpperCase()}</Text>
        <Text style={{ fontSize: z(15), fontWeight: '700', color: NAVY }} numberOfLines={2}>
          {name}
        </Text>
      </View>
      <Text style={{ fontSize: z(15.5), fontWeight: '800', color: NAVY }}>
        {approx ? '~' : ''}
        {time(t)}
        <Text style={{ fontSize: z(11), color: SLATE }}>{plusDay(t)}</Text>
      </Text>
    </View>
  );
}

export { Rail };
