import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Check, Compass, Database, Heart, History, MapPinOff, RotateCcw, Star, Trash2, Zap } from 'lucide-react-native';
import { Button, Card, EmptyState, Muted, Notice, Screen, SectionTitle } from '../../components/ui';
import { JourneyRow } from '../../components/JourneyRow';
import { OfflineBadge } from '../../components/OfflineBadge';
import { MetroMateLogo } from '../../components/brand/MetroMateLogo';
import { useReady } from '../../state/useReady';
import { formatDate } from '../../lib/format';
import { isBusId } from '../../lib/transit/types';
import { placeName } from '../../lib/transit/places';
import { useTransit } from '../../lib/transit/transitData';
import { colors, radius, space, type } from '../../theme';
import { LANGUAGES } from '../../i18n/languages';
import { useT } from '../../i18n/useT';

export default function SettingsScreen() {
  const { dataset, network, favourites, recents, quickRoutes, clearQuickRoute, stationCoords, clearStationCoords, removeFavourite, clearRecents, resetLocalData, storage } = useReady();
  const { t, tn, lang, setLanguage } = useT();
  const [done, setDone] = useState(false);
  const hasBus = [...favourites, ...recents, ...quickRoutes].some((r) => isBusId(r.fromId) || isBusId(r.toId));
  const bus = useTransit(hasBus);
  const transit = bus.status === 'ready' ? bus.transit : null;
  const name = (id: string) => placeName(id, network.stations, transit) ?? (isBusId(id) ? t('home.busStop') : id);
  const open = (a: string, b: string) => router.push({ pathname: '/route', params: isBusId(a) || isBusId(b) ? { from: a, to: b, mode: 'transit' } : { from: a, to: b } });

  const confirmReset = () => {
    const run = async () => {
      await resetLocalData();
      setDone(true);
    };
    if (Platform.OS === 'web') {
      void run();
      return;
    }
    Alert.alert(t('saved.reset.title'), t('saved.reset.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('saved.reset.confirm'), style: 'destructive', onPress: () => void run() },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <MetroMateLogo size={56} animate="float" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={type.title} accessibilityRole="header">
              {t('settings.title')}
            </Text>
            <Muted>{t('settings.subtitle')}</Muted>
          </View>
        </View>
        <View style={{ alignItems: 'flex-start' }}>
          <OfflineBadge />
        </View>

        <Text style={styles.group} accessibilityRole="header">
          {t('settings.saved.title')}
        </Text>

        <View>
          <SectionTitle>{t('saved.favourites.title')}</SectionTitle>
          <Card style={{ paddingVertical: space.sm }}>
            {favourites.length === 0 ? (
              <EmptyState icon={Star} title={t('saved.favourites.empty.title')} body={t('saved.favourites.empty.body')} />
            ) : (
              favourites.map((f, i) => (
                <View key={f.id} style={i > 0 && styles.divider}>
                  <JourneyRow
                    fromName={name(f.fromId)}
                    toName={name(f.toId)}
                    onOpen={() => open(f.fromId, f.toId)}
                    onReverse={() => open(f.toId, f.fromId)}
                    onRemove={() => removeFavourite(f.id)}
                    removeLabel={t('saved.favourites.remove')}
                  />
                </View>
              ))
            )}
          </Card>
        </View>

        <View>
          <SectionTitle
            right={recents.length > 0 ? <Button label={t('saved.recents.clear')} icon={Trash2} variant="danger" compact onPress={() => void clearRecents()} /> : undefined}
          >
            {t('saved.recents.title')}
          </SectionTitle>
          <Card style={{ paddingVertical: space.sm }}>
            {recents.length === 0 ? (
              <EmptyState icon={History} title={t('saved.recents.empty.title')} body={t('saved.recents.empty.body')} />
            ) : (
              recents.map((r, i) => (
                <View key={r.id} style={i > 0 && styles.divider}>
                  <JourneyRow fromName={name(r.fromId)} toName={name(r.toId)} onOpen={() => open(r.fromId, r.toId)} onReverse={() => open(r.toId, r.fromId)} />
                </View>
              ))
            )}
          </Card>
        </View>

        <View>
          <SectionTitle>{t('settings.quick.title')}</SectionTitle>
          <Card style={{ paddingVertical: space.sm }}>
            {quickRoutes.length === 0 ? (
              <EmptyState icon={Zap} title={t('settings.quick.empty.title')} body={t('settings.quick.empty.body')} />
            ) : (
              quickRoutes.map((q, i) => (
                <View key={q.slot} style={i > 0 && styles.divider}>
                  <JourneyRow
                    fromName={name(q.fromId)}
                    toName={name(q.toId)}
                    onOpen={() => open(q.fromId, q.toId)}
                    onReverse={() => open(q.toId, q.fromId)}
                    onRemove={() => void clearQuickRoute(q.slot)}
                    removeLabel={`${t('settings.quick.remove')} (${t(`home.quick.${q.slot}`)})`}
                  />
                </View>
              ))
            )}
          </Card>
        </View>

        <Text style={styles.group} accessibilityRole="header">
          {t('settings.prefs.title')}
        </Text>

        <View>
          <SectionTitle>{t('common.language.title')}</SectionTitle>
          <Card style={{ gap: space.sm }}>
            <View style={styles.langRow} accessibilityRole="radiogroup">
              {LANGUAGES.map((l) => {
                const on = l.id === lang;
                return (
                  <Pressable
                    key={l.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on, checked: on }}
                    aria-checked={on}
                    accessibilityLabel={t(on ? 'common.language.option.a11y' : 'common.language.optionOff.a11y', { language: l.native })}
                    onPress={() => void setLanguage(l.id)}
                    style={({ pressed }) => [styles.langOption, on && styles.langOptionOn, pressed && { opacity: 0.85 }]}
                  >
                    {on ? <Check size={16} color={colors.primary} strokeWidth={2.6} /> : null}
                    <Text style={[styles.langText, on && { color: colors.primary }]}>{l.native}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Muted>{t('common.language.note')}</Muted>
          </Card>
        </View>

        <View>
          <SectionTitle>{t('onboarding.replay.title')}</SectionTitle>
          <Card style={{ gap: space.sm }}>
            <Muted>{t('onboarding.replay.body')}</Muted>
            <Button label={t('onboarding.replay.button')} icon={Compass} variant="secondary" compact onPress={() => router.push('/onboarding')} />
          </Card>
        </View>

        <View>
          <SectionTitle>{t('settings.prefs.positions.title')}</SectionTitle>
          <Card style={{ gap: space.sm }}>
            <Muted>{stationCoords.length > 0 ? tn('settings.prefs.positions.count', stationCoords.length) : t('settings.prefs.positions.none')}</Muted>
            {stationCoords.length > 0 ? <Button label={t('settings.prefs.positions.clear')} icon={MapPinOff} variant="danger" compact onPress={() => void clearStationCoords()} /> : null}
          </Card>
        </View>

        <Text style={styles.group} accessibilityRole="header">
          {t('settings.db.title')}
        </Text>

        <View>
          <SectionTitle>{t('saved.storage.title')}</SectionTitle>
          <Card style={{ gap: space.sm }}>
            <Row label={t('saved.storage.dataset')} value={dataset.info.version} />
            <Row label={t('saved.storage.sourceUpdated')} value={formatDate(dataset.info.sourcePageLastUpdated, lang)} />
            <Row label={t('saved.storage.timetable')} value={formatDate(dataset.timetable.validFrom, lang)} />
            <Row label={t('saved.storage.storedIn')} value={storage === 'sqlite' ? t('saved.storage.sqlite') : t('saved.storage.memory')} />
            <Row label={t('settings.db.engine')} value={storage === 'sqlite' ? 'SQLite · metromate.db' : '—'} />
            <Row label={t('settings.db.stations')} value={String(dataset.stations.length)} />
            <Row label={t('settings.db.favourites')} value={String(favourites.length)} />
            <Row label={t('settings.db.recents')} value={String(recents.length)} />
            <Row label={t('settings.db.quick')} value={String(quickRoutes.length)} />
            <Row label={t('settings.db.positions')} value={String(stationCoords.length)} />
            <Muted>{t('settings.db.note')}</Muted>
            <View style={styles.actions}>
              <Button label={t('saved.storage.dataButton')} icon={Database} variant="secondary" compact style={styles.action} onPress={() => router.push('/data')} />
              <Button label={t('saved.storage.resetButton')} icon={RotateCcw} variant="danger" compact style={styles.action} onPress={confirmReset} />
            </View>
          </Card>
          {done ? (
            <View style={{ marginTop: space.sm }}>
              <Notice>{t('saved.reset.done')}</Notice>
            </View>
          ) : null}
        </View>

        <Text style={styles.group} accessibilityRole="header">
          {t('settings.about.title')}
        </Text>
        <Card style={{ gap: space.sm }}>
          <Text style={type.body}>{t('settings.about.tagline')}</Text>
          <Row label={t('settings.about.version')} value={Constants.expoConfig?.version ?? '1.0.0'} />
          <Muted>{t('settings.about.privacy')}</Muted>
          <Muted>{t('settings.about.independent')}</Muted>
        </Card>

        <Text style={styles.group} accessibilityRole="header">
          {t('settings.credits.title')}
        </Text>
        <View style={styles.love} accessible accessibilityLabel={t('settings.credits.love.a11y')}>
          <Heart size={26} color={colors.destination} fill={colors.destination} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.loveTitle}>{t('settings.credits.love')}</Text>
            <Text style={styles.loveEvent}>{t('settings.credits.event')}</Text>
          </View>
        </View>
        <Card style={{ gap: space.sm }}>
          <SectionTitle>{t('settings.credits.thanks')}</SectionTitle>
          <Muted>{t('settings.credits.gmrc')}</Muted>
          <Muted>{t('settings.credits.gtfs')}</Muted>
          <Muted>{t('settings.credits.photos')}</Muted>
          <Muted>{t('settings.credits.tools')}</Muted>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={[type.small, { flexShrink: 1 }]}>{label}</Text>
      <Text style={[type.small, { color: colors.text, fontWeight: '700', flexShrink: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  group: { fontSize: 13, fontWeight: '800', letterSpacing: 0.8, color: colors.primaryDark, textTransform: 'uppercase', marginTop: space.sm },
  love: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#D5D9FF' },
  loveTitle: { fontSize: 17, fontWeight: '800', color: colors.text, lineHeight: 24 },
  loveEvent: { fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  action: { flexGrow: 1, flexBasis: 140 },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  langOption: {
    flexGrow: 1,
    flexBasis: 90,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  langOptionOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  langText: { fontSize: 16, fontWeight: '700', color: colors.text },
});
