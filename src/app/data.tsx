import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ExternalLink } from 'lucide-react-native';
import { Card, IconButton, Muted, Notice, Pill, Screen, SectionTitle, VerifyBadge } from '../components/ui';
import { useReady } from '../state/useReady';
import { formatDate } from '../lib/format';
import { colors, space, type } from '../theme';

const NOT_AVAILABLE = [
  'Fare amounts (GMRC’s Fare Rules page lists no amounts)',
  'Per-station travel times and journey-time estimates',
  'Station coordinates and walking distances',
  'Entry/exit gates, platform numbers and boarding sides',
  'Station-by-station lift and step-free information',
  'Underground vs elevated station type',
  'Live train status (MetroMate shows static timetable information only)',
];

export default function DataScreen() {
  const { dataset, validation, storage } = useReady();
  const counts = dataset.stations.reduce<Record<string, number>>((acc, s) => {
    acc[s.sourceMetadata.verificationStatus] = (acc[s.sourceMetadata.verificationStatus] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Screen>
      <View style={styles.topBar}>
        <IconButton icon={ChevronLeft} label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} color={colors.text} />
        <Text style={[type.h2, { flex: 1 }]} accessibilityRole="header">
          Data &amp; sources
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={{ gap: space.sm }}>
          <Text style={type.h3}>{dataset.info.network}</Text>
          <Muted>
            Dataset {dataset.info.version} · {dataset.info.stationCount} stations · GMRC source page updated {formatDate(dataset.info.sourcePageLastUpdated)}
          </Muted>
          <Muted>{dataset.info.notes}</Muted>
          <View style={styles.pills}>
            {Object.entries(counts).map(([status, n]) => (
              <Pill key={status} label={`${n} stations: ${status}`} color={colors.text} bg="#EEF0F5" />
            ))}
            <Pill label={storage === 'sqlite' ? 'SQLite on device' : 'Memory only'} color={colors.text} bg="#EEF0F5" />
          </View>
          {validation && !validation.ok ? (
            <Notice tone="warn" title="Data checks found problems">
              {validation.errors.slice(0, 3).join(' · ')}
            </Notice>
          ) : (
            <Notice>Built-in data checks passed: station links, corridor order and provenance are consistent.</Notice>
          )}
        </Card>

        <View>
          <SectionTitle>Sources</SectionTitle>
          <View style={{ gap: space.md }}>
            {dataset.sources.map((s) => (
              <Card key={s.id} style={{ gap: 4 }}>
                <Text style={type.h3}>{s.name}</Text>
                <Muted>{s.type}</Muted>
                <Muted>Checked {formatDate(s.checkedAt)} · {s.obtainedBy}</Muted>
                <Text style={[type.small, { color: colors.text }]}>Limitations: {s.limitations}</Text>
                <Pressable onPress={() => Linking.openURL(s.url).catch(() => undefined)} accessibilityRole="link" style={styles.link}>
                  <ExternalLink size={14} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Open page (needs internet)</Text>
                </Pressable>
              </Card>
            ))}
          </View>
        </View>

        <View>
          <SectionTitle>Not available yet</SectionTitle>
          <Card style={{ gap: 6 }}>
            {NOT_AVAILABLE.map((n) => (
              <Text key={n} style={type.small}>
                • {n}
              </Text>
            ))}
            <View style={{ marginTop: 4 }}>
              <VerifyBadge status="unknown" />
            </View>
            <Muted>These stay blank rather than guessed. They can be added to the dataset files once verified.</Muted>
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
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
});
