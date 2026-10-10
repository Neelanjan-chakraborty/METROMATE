import React from 'react';
import { Text, View } from 'react-native';
import { Clock, Info, DoorOpen, Layers, TrainFront, Ticket, TriangleAlert, MapPin } from 'lucide-react-native';
import { useHomeScale } from '../home/scale';
import { Accordion, CARD_LINE, NAVY, SLATE, VIOLET } from './primitives';
import { bandAt, bandText, serviceNow } from '../../lib/serviceNow';
import { formatDate } from '../../lib/format';
import { useT } from '../../i18n/useT';
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
  const { t, lang } = useT();
  const now = new Date();
  return (
    <Accordion icon={Clock} tint="#4F35E8" tintBg="#EFEDFF" title={t('route.details.schedule.title')} subtitle={t('route.details.schedule.subtitle')}>
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
              <Mini z={z} label={t('route.service.firstTrain')} value={s.first ?? '—'} sub={t('route.details.from', { name: nameOf(s.fromTerminalId) })} />
              <Mini z={z} label={t('route.service.lastTrain')} value={s.last ?? '—'} sub={t('route.details.from', { name: nameOf(s.fromTerminalId) })} />
              <Mini z={z} label={t('route.details.wholeLine')} value={t('route.min', { n: line.endToEndMinutes })} sub={t('route.km', { n: line.distanceKm })} />
            </View>
            {line.frequency.map((f) => {
              const active = f === current;
              return (
                <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: z(10), padding: z(10), borderRadius: z(12), backgroundColor: active ? '#EFEDFF' : '#F8F8FD', borderWidth: 1, borderColor: active ? '#CFC8FF' : CARD_LINE }}>
                  <Text style={{ flex: 1, fontSize: z(12.5), color: NAVY }}>{f.label}</Text>
                  {active ? <Text style={{ fontSize: z(10.5), fontWeight: '800', color: VIOLET }}>{t('route.details.now')}</Text> : null}
                  <Text style={{ fontSize: z(13), fontWeight: '800', color: NAVY }}>{bandText(f, t)}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
      <Note z={z} Icon={Info}>
        {t('route.details.scheduleNote', { from: formatDate(timetable.validFrom, lang), updated: formatDate(timetable.sourcePageLastUpdated, lang) })} {timetable.notes.join(' ')}
      </Note>
    </Accordion>
  );
}

export function TicketAccordion({ rules, fareText, fareNote }: { rules: FareRules; fareText: string; fareNote: string }) {
  const { z } = useHomeScale();
  const { t, lang } = useT();
  return (
    <Accordion icon={Ticket} tint="#0F6FC4" tintBg="#E3F1FC" title={t('route.details.ticket.title')} subtitle={t('route.details.ticket.subtitle')}>
      <View style={{ padding: z(12), borderRadius: z(14), backgroundColor: '#F8F8FD', borderWidth: 1, borderColor: CARD_LINE, gap: z(3) }}>
        <Text style={{ fontSize: z(16), fontWeight: '800', color: NAVY }}>{fareText}</Text>
        <Text style={{ fontSize: z(12.5), color: SLATE }}>{fareNote}</Text>
      </View>
      <Chips z={z} title={t('route.details.ticketTypes')} items={rules.products} />
      <Chips z={z} title={t('route.details.payWith')} items={rules.media} />
      <View style={{ gap: z(6) }}>
        <Text style={{ fontSize: z(12), fontWeight: '800', color: SLATE, letterSpacing: lang === 'en' ? 0.6 : 0 }}>{t('route.details.keyRules')}</Text>
        {rules.rules.map((r) => (
          <View key={r} style={{ flexDirection: 'row', gap: z(8) }}>
            <Text style={{ color: VIOLET, fontWeight: '800' }}>•</Text>
            <Text style={{ flex: 1, fontSize: z(13), color: NAVY }}>{r}</Text>
          </View>
        ))}
      </View>
      <Note z={z} Icon={TriangleAlert} tone="warn">
        {rules.phaseRestriction.text} {t('route.details.phaseNote')}
      </Note>
    </Accordion>
  );
}

export function GoodToKnowAccordion({ destination, towards, checkedOn, hasMinutes }: { destination: string; towards: string[]; checkedOn: string; hasMinutes: boolean }) {
  const { z } = useHomeScale();
  const { t, lang } = useT();
  return (
    <Accordion icon={Info} tint="#B45309" tintBg="#FEF3C7" title={t('route.details.good.title')} subtitle={t('route.details.good.subtitle')}>
      <Fact z={z} Icon={Layers} title={t('route.details.platforms.title')}>
        {t('route.details.platforms.body', { towards: towards.join(' / ') })}
      </Fact>
      <Fact z={z} Icon={DoorOpen} title={t('route.details.exits.title')}>
        {t('route.details.exits.body', { destination })}
      </Fact>
      <Fact z={z} Icon={Clock} title={t('route.details.minutes.title')}>
        {t(hasMinutes ? 'route.details.minutes.withMinutes' : 'route.details.minutes.noMinutes')}
      </Fact>
      <Fact z={z} Icon={TrainFront} title={t('route.details.notLive.title')}>
        {t('route.details.notLive.body')}
      </Fact>
      <Fact z={z} Icon={MapPin} title={t('route.details.routeChoice.title')}>
        {t('route.details.routeChoice.body', { date: formatDate(checkedOn, lang) })}
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
      <Text style={{ fontSize: z(10.5), color: SLATE }} numberOfLines={2}>
        {sub}
      </Text>
    </View>
  );
}

function Chips({ z, title, items }: { z: (n: number) => number; title: string; items: string[] }) {
  const { lang } = useT();
  return (
    <View style={{ gap: z(6) }}>
      <Text style={{ fontSize: z(12), fontWeight: '800', color: SLATE, letterSpacing: lang === 'en' ? 0.6 : 0 }}>{title.toUpperCase()}</Text>
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
  const { t, lang } = useT();
  const now = new Date();
  return (
    <Accordion icon={Clock} tint="#4F35E8" tintBg="#EFEDFF" title={t('route.details.station.title')} subtitle={t('route.details.schedule.subtitle')}>
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
              {line.firstTrain.slice(0, 2).map((ft) => (
                <Mini key={`f${ft.stationId}`} z={z} label={t('route.service.firstTrain')} value={ft.time} sub={t('route.details.from', { name: nameOf(ft.stationId) })} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: z(8) }}>
              {line.lastTrain.slice(0, 2).map((lt) => (
                <Mini key={`l${lt.stationId}`} z={z} label={t('route.service.lastTrain')} value={lt.time} sub={t('route.details.from', { name: nameOf(lt.stationId) })} />
              ))}
            </View>
            {line.frequency.map((f) => {
              const active = f === current;
              return (
                <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: z(10), padding: z(10), borderRadius: z(12), backgroundColor: active ? '#EFEDFF' : '#F8F8FD', borderWidth: 1, borderColor: active ? '#CFC8FF' : CARD_LINE }}>
                  <Text style={{ flex: 1, fontSize: z(12.5), color: NAVY }}>{f.label}</Text>
                  {active ? <Text style={{ fontSize: z(10.5), fontWeight: '800', color: VIOLET }}>{t('route.details.now')}</Text> : null}
                  <Text style={{ fontSize: z(13), fontWeight: '800', color: NAVY }}>{bandText(f, t)}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
      <Note z={z} Icon={Info}>
        {t('route.details.station.note', { from: formatDate(timetable.validFrom, lang) })} {timetable.notes.join(' ')}
      </Note>
    </Accordion>
  );
}
