import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ExternalLink } from 'lucide-react-native';
import { Card, IconButton, Muted, Notice, Pill, Screen, SectionTitle, VerifyBadge } from '../components/ui';
import { useReady } from '../state/useReady';
import { formatDate } from '../lib/format';
import { colors, space, type } from '../theme';
import { useT } from '../i18n/useT';
import type { MessageKey } from '../i18n';
import type { VerificationStatus } from '../types';

const NOT_AVAILABLE: MessageKey[] = [
  'saved.data.missing.fares',
  'saved.data.missing.times',
  'saved.data.missing.coords',
  'saved.data.missing.gates',
  'saved.data.missing.lifts',
  'saved.data.missing.type',
  'saved.data.missing.live',
];

const STATUS_WORD: Record<VerificationStatus, MessageKey> = {
  verified: 'saved.data.status.verified',
  unverified: 'saved.data.status.unverified',
  estimated: 'saved.data.status.estimated',
  unknown: 'saved.data.status.unknown',
};

export default function DataScreen() {
  const { dataset, validation, storage } = useReady();
  const { t, tn, lang } = useT();
  const counts = dataset.stations.reduce<Record<string, number>>((acc, s) => {
    acc[s.sourceMetadata.verificationStatus] = (acc[s.sourceMetadata.verificationStatus] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Screen>
      <View style={styles.topBar}>
        <IconButton icon={ChevronLeft} label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} color={colors.text} />
        <Text style={[type.h2, { flex: 1 }]} accessibilityRole="header">
          {t('saved.data.title')}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={{ gap: space.sm }}>
          <Text style={type.h3}>{dataset.info.network}</Text>
          <Muted>
            {t('saved.data.summary', { version: dataset.info.version, stations: tn('lib.stations', dataset.info.stationCount), date: formatDate(dataset.info.sourcePageLastUpdated, lang) })}
          </Muted>
          <Muted>{dataset.info.notes}</Muted>
          <View style={styles.pills}>
            {Object.entries(counts).map(([status, n]) => (
              <Pill key={status} label={tn('saved.data.statusPill', n, { status: STATUS_WORD[status as VerificationStatus] ? t(STATUS_WORD[status as VerificationStatus]) : status })} color={colors.text} bg="#EEF0F5" />
            ))}
            <Pill label={storage === 'sqlite' ? t('saved.data.sqlitePill') : t('saved.data.memoryPill')} color={colors.text} bg="#EEF0F5" />
          </View>
          {validation && !validation.ok ? (
            <Notice tone="warn" title={t('saved.data.problems')}>
              {validation.errors.slice(0, 3).join(' · ')}
            </Notice>
          ) : (
            <Notice>{t('saved.data.checksPassed')}</Notice>
          )}
        </Card>

        <View>
          <SectionTitle>{t('saved.data.sources')}</SectionTitle>
          <View style={{ gap: space.md }}>
            {dataset.sources.map((s) => (
              <Card key={s.id} style={{ gap: 4 }}>
                <Text style={type.h3}>{s.name}</Text>
                <Muted>{s.type}</Muted>
                <Muted>{t('saved.data.checked', { date: formatDate(s.checkedAt, lang), by: s.obtainedBy })}</Muted>
                <Text style={[type.small, { color: colors.text }]}>{t('saved.data.limitations', { text: s.limitations })}</Text>
                <Pressable onPress={() => Linking.openURL(s.url).catch(() => undefined)} accessibilityRole="link" style={styles.link}>
                  <ExternalLink size={14} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13, flexShrink: 1 }}>{t('saved.data.openPage')}</Text>
                </Pressable>
              </Card>
            ))}
          </View>
        </View>

        <View>
          <SectionTitle>{t('saved.data.missing.title')}</SectionTitle>
          <Card style={{ gap: 6 }}>
            {NOT_AVAILABLE.map((k) => (
              <Text key={k} style={type.small}>
                • {t(k)}
              </Text>
            ))}
            <View style={{ marginTop: 4 }}>
              <VerifyBadge status="unknown" />
            </View>
            <Muted>{t('saved.data.missing.note')}</Muted>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.sm, paddingTop: space.xs },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2, maxWidth: 720, width: '100%', alignSelf: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
});
