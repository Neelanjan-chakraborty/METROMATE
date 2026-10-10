import React from 'react';
import { Text, View } from 'react-native';
import { Clock, Info, DoorOpen, Layers, TrainFront, Ticket, TriangleAlert, MapPin } from 'lucide-react-native';
import { useHomeScale } from '../home/scale';
import { Accordion, CARD_LINE, NAVY, SLATE, VIOLET } from './primitives';
import { bandAt, bandText, serviceNow } from '../../lib/serviceNow';
import { formatDate } from '../../lib/format';
import type { Corridor, FareRules, TimetableLine, TimetableMetadata } from '../../types';

/** The three "tap to open" sections: train schedule, ticket rules and fares, and good-to-know notes. */

export function ScheduleAccordion({
  lines,
  timetable,
  corridors,
  nameOf,
}: {
  lines: { line: TimetableLine; stationIds: string[] }[];
  timetable: TimetableMetadata;
  corridors: Map<string, Corridor>;
  nameOf: (id: string) => string;
}) {
  const { z } = useHomeScale();
  const now = new Date();
  return (
    <Accordion icon={Clock} tint="#4F35E8" tintBg="#EFEDFF" title="Train schedule" subtitle="First & last train, how often trains run">
      {lines.map(({ line, stationIds }) => {
        const s = serviceNow(line, stationIds, now);
        const current = bandAt(line, now);
        const color = corridors.get(line.corridorId)?.color ?? VIOLET;
        return (
          <View key={line.id} style={{ gap: z(8) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8) }}>
              <View style={{ width: z(10), height: z(10), borderRadius: z(5), backgroundColor: color }} />
              <Text style={{ flex: 1, fontSize: z(14.5), fontWeight: '800', color: NAVY }}>{line.label.replace(' — ', ' · ')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: z(8) }}>
              <Mini z={z} label="First train" value={s.first ?? '—'} sub={`from ${nameOf(s.fromTerminalId)}`} />
              <Mini z={z} label="Last train" value={s.last ?? '—'} sub={`from ${nameOf(s.fromTerminalId)}`} />
              <Mini z={z} label="Whole line" value={`${line.endToEndMinutes} min`} sub={`${line.distanceKm} km`} />
            </View>
            {line.frequency.map((f) => {
              const active = f === current;
              return (
                <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: z(10), padding: z(10), borderRadius: z(12), backgroundColor: active ? '#EFEDFF' : '#F8F8FD', borderWidth: 1, borderColor: active ? '#CFC8FF' : CARD_LINE }}>
                  <Text style={{ flex: 1, fontSize: z(12.5), color: NAVY }}>{f.label}</Text>
                  {active ? <Text style={{ fontSize: z(10.5), fontWeight: '800', color: VIOLET }}>NOW</Text> : null}
                  <Text style={{ fontSize: z(13), fontWeight: '800', color: NAVY }}>{bandText(f)}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
      <Note z={z} Icon={Info}>
        Static GMRC schedule effective {formatDate(timetable.validFrom)} (page updated {formatDate(timetable.sourcePageLastUpdated)}). Not live. {timetable.notes.join(' ')}
      </Note>
    </Accordion>
  );
}

export function TicketAccordion({ rules, fareText, fareNote }: { rules: FareRules; fareText: string; fareNote: string }) {
  const { z } = useHomeScale();
  return (
    <Accordion icon={Ticket} tint="#0F6FC4" tintBg="#E3F1FC" title="Ticket rules & fares" subtitle="Fare, smart card, concessions">
      <View style={{ padding: z(12), borderRadius: z(14), backgroundColor: '#F8F8FD', borderWidth: 1, borderColor: CARD_LINE, gap: z(3) }}>
        <Text style={{ fontSize: z(16), fontWeight: '800', color: NAVY }}>{fareText}</Text>
        <Text style={{ fontSize: z(12.5), color: SLATE }}>{fareNote}</Text>
      </View>
      <Chips z={z} title="Ticket types" items={rules.products} />
      <Chips z={z} title="Pay with" items={rules.media} />
      <View style={{ gap: z(6) }}>
        <Text style={{ fontSize: z(12), fontWeight: '800', color: SLATE, letterSpacing: 0.6 }}>KEY RULES</Text>
        {rules.rules.map((r) => (
          <View key={r} style={{ flexDirection: 'row', gap: z(8) }}>
            <Text style={{ color: VIOLET, fontWeight: '800' }}>•</Text>
            <Text style={{ flex: 1, fontSize: z(13), color: NAVY }}>{r}</Text>
          </View>
        ))}
      </View>
      <Note z={z} Icon={TriangleAlert} tone="warn">
        {rules.phaseRestriction.text} Part of this rule isn’t available offline, so confirm at the station if your trip crosses between Motera Stadium and Koteshwar Road.
      </Note>
    </Accordion>
  );
}

export function GoodToKnowAccordion({ destination, towards, checkedOn, hasMinutes }: { destination: string; towards: string[]; checkedOn: string; hasMinutes: boolean }) {
  const { z } = useHomeScale();
  return (
    <Accordion icon={Info} tint="#B45309" tintBg="#FEF3C7" title="Good to know" subtitle="Platforms, exits, and how times are worked out">
      <Fact z={z} Icon={Layers} title="Platforms">
        Platform numbers aren’t published. Follow the signs for “Towards {towards.join(' / ')}”.
      </Fact>
      <Fact z={z} Icon={DoorOpen} title="Exit gates">
        Which gate faces which street at {destination} isn’t verified. Follow the exit signs inside the station.
      </Fact>
      <Fact z={z} Icon={Clock} title="About the minutes">
        {hasMinutes
          ? 'Estimates: GMRC’s published time for each line, shared across the stops by distance (station positions are approximate). They leave out waiting and the walk to change trains.'
          : 'GMRC publishes whole-line times but not times between stations, so no per-stop minutes are shown.'}
      </Fact>
      <Fact z={z} Icon={TrainFront} title="Not live">
        MetroMate works offline and has no live train feed, so it shows the published schedule, never the next train’s arrival.
      </Fact>
      <Fact z={z} Icon={MapPin} title="Route choice">
        Fewest stops first, then fewest changes. Network layout from the GMRC route map, checked {formatDate(checkedOn)}.
      </Fact>
    </Accordion>
  );
}

export function Mini({ z, label, value, sub }: { z: (n: number) => number; label: string; value: string; sub: string }) {
  return (
    <View style={{ flex: 1, padding: z(10), borderRadius: z(12), backgroundColor: '#F8F8FD', borderWidth: 1, borderColor: CARD_LINE, gap: 1 }}>
      <Text style={{ fontSize: z(11), color: SLATE, fontWeight: '600' }}>{label}</Text>
      <Text style={{ fontSize: z(17), fontWeight: '800', color: NAVY }} numberOfLines={1}>
        {value}
      </Text>
      <Text style={{ fontSize: z(10.5), color: SLATE }} numberOfLines={1}>
        {sub}
      </Text>
    </View>
  );
}

function Chips({ z, title, items }: { z: (n: number) => number; title: string; items: string[] }) {
  return (
    <View style={{ gap: z(6) }}>
      <Text style={{ fontSize: z(12), fontWeight: '800', color: SLATE, letterSpacing: 0.6 }}>{title.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: z(6) }}>
        {items.map((i) => (
          <View key={i} style={{ paddingHorizontal: z(10), paddingVertical: z(5), borderRadius: z(12), backgroundColor: '#F1EFFF' }}>
            <Text style={{ fontSize: z(12.5), color: '#3A27C9', fontWeight: '600' }}>{i}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function Note({ z, Icon, tone, children }: { z: (n: number) => number; Icon: typeof Info; tone?: 'warn'; children: React.ReactNode }) {
  const warn = tone === 'warn';
  return (
    <View style={{ flexDirection: 'row', gap: z(8), padding: z(10), borderRadius: z(12), backgroundColor: warn ? '#FFF4E5' : '#F8F8FD', borderWidth: 1, borderColor: warn ? '#F9D9A8' : CARD_LINE }}>
      <Icon size={z(15)} color={warn ? '#B54708' : SLATE} />
      <Text style={{ flex: 1, fontSize: z(12), color: warn ? '#7A3B06' : SLATE }}>{children}</Text>
    </View>
  );
}

function Fact({ z, Icon, title, children }: { z: (n: number) => number; Icon: typeof Info; title: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: z(12) }}>
      <View style={{ width: z(34), height: z(34), borderRadius: z(11), backgroundColor: '#F4F3FF', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={z(17)} color={VIOLET} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ fontSize: z(13.5), fontWeight: '800', color: NAVY }}>{title}</Text>
        <Text style={{ fontSize: z(12.5), color: SLATE }}>{children}</Text>
      </View>
    </View>
  );
}

/** Station page: both ends' first and last trains for each line through the station, and the frequency bands. */
export function StationTimingsAccordion({ lines, timetable, corridors, nameOf }: { lines: TimetableLine[]; timetable: TimetableMetadata; corridors: Map<string, Corridor>; nameOf: (id: string) => string }) {
  const { z } = useHomeScale();
  const now = new Date();
  return (
    <Accordion icon={Clock} tint="#4F35E8" tintBg="#EFEDFF" title="Timings & frequency" subtitle="First & last train, how often trains run">
      {lines.map((line) => {
        const current = bandAt(line, now);
        const color = corridors.get(line.corridorId)?.color ?? VIOLET;
        return (
          <View key={line.id} style={{ gap: z(8) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8) }}>
              <View style={{ width: z(10), height: z(10), borderRadius: z(5), backgroundColor: color }} />
              <Text style={{ flex: 1, fontSize: z(14.5), fontWeight: '800', color: NAVY }}>{line.label.replace(' — ', ' · ')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: z(8) }}>
              {line.firstTrain.slice(0, 2).map((t) => (
                <Mini key={`f${t.stationId}`} z={z} label="First train" value={t.time} sub={`from ${nameOf(t.stationId)}`} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: z(8) }}>
              {line.lastTrain.slice(0, 2).map((t) => (
                <Mini key={`l${t.stationId}`} z={z} label="Last train" value={t.time} sub={`from ${nameOf(t.stationId)}`} />
              ))}
            </View>
            {line.frequency.map((f) => {
              const active = f === current;
              return (
                <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: z(10), padding: z(10), borderRadius: z(12), backgroundColor: active ? '#EFEDFF' : '#F8F8FD', borderWidth: 1, borderColor: active ? '#CFC8FF' : CARD_LINE }}>
                  <Text style={{ flex: 1, fontSize: z(12.5), color: NAVY }}>{f.label}</Text>
                  {active ? <Text style={{ fontSize: z(10.5), fontWeight: '800', color: VIOLET }}>NOW</Text> : null}
                  <Text style={{ fontSize: z(13), fontWeight: '800', color: NAVY }}>{bandText(f)}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
      <Note z={z} Icon={Info}>
        First and last trains are at each line’s end stations; at this station they are a little later or earlier. Static GMRC schedule effective {formatDate(timetable.validFrom)}, not live. {timetable.notes.join(' ')}
      </Note>
    </Accordion>
  );
}
