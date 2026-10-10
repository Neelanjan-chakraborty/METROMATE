import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Info, Map as MapIcon, MapPin, Repeat, Search, X } from 'lucide-react-native';
import { BusCard, Divider, RouteBadge, ScheduledTag, busShadow } from '../../components/bus/BusUi';
import { BusHero } from '../../components/bus/BusHero';
import { HERO_H, HERO_W, LIFT } from '../../components/bus/busHeroGeometry';
import { useHeroState } from '../../components/home/useHeroClock';
import { useHomeScale } from '../../components/home/scale';
import { agencyFull, agencyLabel, agencyShort, dayOffset, formatClockMinutes } from '../../lib/transit/format';
import { useT } from '../../i18n/useT';
import { searchStops } from '../../lib/transit/places';
import { buildRouteIndex, searchRoutes, type RouteInfo } from '../../lib/transit/routeIndex';
import { useTransit } from '../../lib/transit/transitData';
import { AGENCY_IDS, type AgencyId } from '../../lib/transit/types';
import { bus } from '../../theme/bus';

const clock = (m: number) => `${formatClockMinutes(m)}${dayOffset(m) > 0 ? ' +1' : ''}`;
const AGENCY_ORDER: AgencyId[] = ['AJL', 'AMTS', 'GTSL'];

type Item = { kind: 'route'; r: RouteInfo } | { kind: 'stop'; stop: number; name: string; agencies: AgencyId[]; routes: number } | { kind: 'head'; text: string };

/** Renders `**bold**` markers in a message as bold text. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
        i % 2 ? (
          <Text key={i} style={{ fontWeight: '800' }}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default function BusScreen() {
  const insets = useSafeAreaInsets();
  const { z, width } = useHomeScale();
  const { t, tn, lang } = useT();
  // Indic scripts join letters into conjuncts; negative or positive tracking breaks them
  const track = (n: number) => (lang === 'en' ? n : 0);
  const state = useTransit(true);
  const { sky } = useLocalSearchParams<{ sky?: string }>();
  const { look, animate } = useHeroState(sky);
  const heroH = insets.top + z(46) + (HERO_H + LIFT) * (width / HERO_W);
  const titleInk = look.night > 0.5 ? '#FFFFFF' : bus.dark;
  const [query, setQuery] = useState('');
  const [agency, setAgency] = useState<AgencyId>('AJL');
  const transit = state.status === 'ready' ? state.transit : null;
  const ri = useMemo(() => (transit ? buildRouteIndex(transit) : null), [transit]);

  const items: Item[] = useMemo(() => {
    if (!transit || !ri) return [];
    const q = query.trim();
    if (q) {
      const stops = searchStops(transit, q, 8);
      const routes = searchRoutes(ri, q, 40).filter((r) => r.trips > 0);
      return [
        ...(routes.length ? [{ kind: 'head', text: t('bus.head.routes') } as Item, ...routes.map((r) => ({ kind: 'route', r }) as Item)] : []),
        ...(stops.length ? [{ kind: 'head', text: t('bus.head.stops') } as Item, ...stops.map((s) => ({ kind: 'stop', stop: s.stop, name: s.name, agencies: s.agencies, routes: s.routes }) as Item)] : []),
      ];
    }
    return ri.byAgency[agency].filter((r) => r.trips > 0).map((r) => ({ kind: 'route', r }) as Item);
  }, [transit, ri, query, agency, t]);

  const counts = useMemo(() => Object.fromEntries(AGENCY_IDS.map((a) => [a, ri ? ri.byAgency[a].filter((r) => r.trips > 0).length : 0])) as Record<AgencyId, number>, [ri]);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      if (item.kind === 'head') {
        return (
          <Text style={{ marginHorizontal: 20, marginTop: z(10), marginBottom: z(4), fontSize: z(12), fontWeight: '800', letterSpacing: lang === 'en' ? 0.6 : 0, color: bus.inkSoft }} accessibilityRole="header">
            {item.text.toUpperCase()}
          </Text>
        );
      }
      if (item.kind === 'stop') {
        return (
          <Row
            z={z}
            label={t('bus.stopRow.a11y', { name: item.name, routes: tn('bus.routes', item.routes) })}
            lead={
              <View style={{ width: z(46), height: z(34), borderRadius: z(10), backgroundColor: bus.soft, alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={z(19)} color={bus.red} strokeWidth={2} />
              </View>
            }
            title={item.name}
            sub={`${item.agencies.map((a) => agencyLabel(a, t)).join(' · ')} · ${tn('bus.routes', item.routes)}`}
            onPress={() => router.push({ pathname: '/bus/stop/[id]', params: { id: transit!.data.stops.id[item.stop] } })}
          />
        );
      }
      const r = item.r;
      const ends = r.dirs.length ? [...new Set(r.dirs.map((d) => d.headsign))] : [];
      return (
        <Row
          z={z}
          label={t('bus.routeRow.a11y', { agency: agencyLabel(r.agency, t), short: r.short, long: r.long, trips: tn('bus.tripsADay', r.trips) })}
          lead={<RouteBadge agency={r.agency} short={r.short} />}
          title={r.dirs.length > 1 && r.dirs[0].origin !== r.dirs[0].headsign ? `${r.dirs[0].origin} ⇄ ${r.dirs[0].headsign}` : r.dirs.length ? `${r.dirs[0].origin} → ${ends[0]}` : r.long}
          sub={`${tn('bus.tripsADay', r.trips)}${r.first !== null && r.last !== null ? ` · ${clock(r.first)}–${clock(r.last)}` : ''}`}
          onPress={() => router.push({ pathname: '/bus/route/[id]', params: { id: String(r.index) } })}
        />
      );
    },
    [z, transit, t, tn, lang],
  );

  const header = (
    <View>
      <View style={{ height: heroH }}>
        <BusHero height={heroH} look={look} animate={animate} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'flex-start', paddingTop: insets.top + z(12), paddingHorizontal: 20, gap: z(10) }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: z(31), fontWeight: '800', color: titleInk, letterSpacing: track(-0.6) }} accessibilityRole="header" numberOfLines={1}>
              {t('common.tab.bus')}
            </Text>
            <Text style={{ fontSize: z(13), color: look.night > 0.5 ? 'rgba(255,255,255,0.85)' : bus.inkSoft }} numberOfLines={1}>
              BRTS · AMTS · {agencyShort('GTSL')}
            </Text>
          </View>
          <ScheduledTag />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: z(10), marginHorizontal: 16, marginTop: z(-22) }}>
        <View style={[styles.search, { height: z(50), borderRadius: z(25), paddingHorizontal: z(16), gap: z(10) }, busShadow]}>
          <Search size={z(20)} color={bus.red} strokeWidth={2.2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('bus.search.placeholder')}
            placeholderTextColor="#9A8785"
            style={[{ flex: 1, minWidth: 0, fontSize: z(15), color: bus.ink, paddingVertical: 0 }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel={t('bus.search.a11y')}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('bus.search.clear')} onPress={() => setQuery('')} hitSlop={14}>
              <X size={z(18)} color={bus.inkSoft} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: z(10), marginHorizontal: 16, marginTop: z(14) }}>
        <Quick z={z} Icon={Repeat} label={t('bus.quick.plan')} onPress={() => router.navigate('/')} />
        <Quick z={z} Icon={MapIcon} label={t('bus.quick.map')} onPress={() => router.navigate({ pathname: '/map', params: { view: 'bus' } })} />
      </View>

      {!query ? (
        <View style={{ flexDirection: 'row', gap: z(8), marginHorizontal: 16, marginTop: z(14) }} accessibilityRole="radiogroup">
          {AGENCY_ORDER.map((a) => {
            const on = agency === a;
            return (
              <Pressable key={a} accessibilityRole="radio" accessibilityState={{ selected: on, checked: on }} accessibilityLabel={`${agencyFull(a, t)}, ${tn('bus.routes', counts[a])}`} onPress={() => setAgency(a)} style={[styles.chip, { minHeight: z(50), borderRadius: z(25) }, on && { backgroundColor: bus.red, borderColor: bus.red }]}>
                <Text style={{ fontSize: z(13.5), fontWeight: '800', color: on ? '#FFFFFF' : bus.ink }} numberOfLines={1} adjustsFontSizeToFit>
                  {agencyShort(a)}
                </Text>
                <Text style={{ fontSize: z(11.5), color: on ? 'rgba(255,255,255,0.88)' : bus.inkSoft }}>{tn('bus.routes', counts[a])}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {!transit && state.status === 'loading' ? <Text style={{ marginHorizontal: 20, marginTop: z(16), fontSize: z(14), color: bus.inkSoft }}>{t('bus.loading.timetable')}</Text> : null}
      {state.status === 'error' ? <Text style={{ marginHorizontal: 20, marginTop: z(16), fontSize: z(14), color: bus.dark }}>{t('bus.loadError.inline')}</Text> : null}
    </View>
  );

  const footer = (
    <View style={{ marginTop: z(18) }}>
      <BusCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8), marginBottom: z(8) }}>
          <Info size={z(19)} color={bus.red} strokeWidth={2} />
          <Text style={{ fontSize: z(16), fontWeight: '800', color: bus.ink }}>{t('bus.about.title')}</Text>
        </View>
        <Text style={styles.about}>
          <Rich text={t('bus.about.coverage')} />
        </Text>
        {transit ? (
          <Text style={styles.about}>
            {t('bus.about.source', { from: transit.data.meta.source.validFrom, to: transit.data.meta.source.validTo })}
          </Text>
        ) : null}
      </BusCard>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bus.bg }}>
      <FlatList
        data={items}
        keyExtractor={(it, i) => (it.kind === 'route' ? `r${it.r.index}` : it.kind === 'stop' ? `s${it.stop}` : `h${i}`)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ItemSeparatorComponent={Sep}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={12}
        windowSize={7}
        contentContainerStyle={{ paddingBottom: z(28) }}
        ListEmptyComponent={
          transit ? (
            <View style={{ padding: z(24) }}>
              <Text style={{ textAlign: 'center', fontSize: z(15), fontWeight: '700', color: bus.ink }}>{t('bus.empty.title')}</Text>
              <Text style={{ textAlign: 'center', fontSize: z(13), color: bus.inkSoft, marginTop: 4 }}>{t('bus.empty.hint')}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function Sep() {
  return (
    <View style={{ marginHorizontal: 20 }}>
      <Divider />
    </View>
  );
}

function Row({ z, label, lead, title, sub, onPress }: { z: (n: number) => number; label: string; lead: React.ReactNode; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: z(12), paddingVertical: z(11), paddingHorizontal: 20, backgroundColor: pressed ? bus.soft : 'transparent' }]}>
      {lead}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: z(15), fontWeight: '700', color: bus.ink }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ fontSize: z(12.5), color: bus.inkSoft, marginTop: 1 }} numberOfLines={2}>
          {sub}
        </Text>
      </View>
      <ChevronRight size={z(20)} color={bus.red} />
    </Pressable>
  );
}

function Quick({ z, Icon, label, onPress }: { z: (n: number) => number; Icon: typeof Search; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.quick, { minHeight: z(48), paddingVertical: z(6), paddingHorizontal: z(10), borderRadius: z(24), gap: z(8), opacity: pressed ? 0.88 : 1 }]}>
      <Icon size={z(19)} color={bus.dark} strokeWidth={2.1} />
      <Text style={{ flexShrink: 1, textAlign: 'center', fontSize: z(14.5), fontWeight: '800', color: bus.dark }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: bus.line },
  chip: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: bus.line },
  quick: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: bus.soft },
  about: { fontSize: 13.5, lineHeight: 20, color: bus.inkSoft, marginBottom: 6 },
});
