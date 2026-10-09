import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Crosshair, MapPinOff, SatelliteDish } from 'lucide-react-native';
import { Button, Card, Muted, Notice, Pill } from '../ui';
import { colors, radius, space, type } from '../../theme';
import type { LocationText } from '../../lib/liveText';
import { ACCURACY_LABEL, classifyAccuracy, type Fix, type SignalState } from '../../lib/locator';
import type { PermissionState, Precision } from '../../hooks/useLocation';

interface Props {
  permission: PermissionState;
  canAskAgain: boolean;
  servicesEnabled: boolean | null;
  onRequest: () => void;
  precision: Precision;
  onPrecision: (p: Precision) => void;
  signal: SignalState;
  fix: Fix | null;
  text: LocationText | null;
  error: string | null;
  coverage: { known: number; total: number; recorded: number };
}

export function LocationCard(p: Props) {
  const acc = p.fix ? classifyAccuracy(p.fix.accuracyM) : 'unknown';
  const signalPill =
    p.signal === 'live'
      ? { label: 'Live', fg: colors.ok, bg: colors.okSoft }
      : p.signal === 'stale'
        ? { label: 'Updating…', fg: colors.warn, bg: colors.warnSoft }
        : p.signal === 'lost'
          ? { label: 'Signal lost', fg: colors.offline, bg: colors.offlineSoft }
          : { label: 'Waiting for GPS', fg: colors.muted, bg: '#EEF0F5' };

  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.head}>
        <SatelliteDish size={20} color={colors.primary} />
        <Text style={[type.h2, { flex: 1 }]}>Where am I?</Text>
        {p.permission === 'granted' ? <Pill label={signalPill.label} color={signalPill.fg} bg={signalPill.bg} /> : null}
      </View>

      {p.permission === 'checking' ? <Muted>Checking location permission…</Muted> : null}

      {p.permission === 'unavailable' ? (
        <Notice tone="warn" title="Location isn’t available here">
          This device or browser can’t provide location. You can still track a journey with manual check-ins below.
        </Notice>
      ) : null}

      {p.permission === 'denied' ? (
        <View style={{ gap: space.sm }}>
          <Muted>
            MetroMate uses your phone’s GPS to show which station you’re at and how far along your journey you are. It works with no internet. Location is used only while the app is open and is never sent anywhere.
          </Muted>
          {p.canAskAgain ? (
            <Button label="Allow location" icon={Crosshair} onPress={p.onRequest} />
          ) : (
            <>
              <Notice tone="warn">Location is blocked for MetroMate. Turn it on in your phone’s app settings, then come back.</Notice>
              <Button label="Open settings" variant="secondary" onPress={() => void Linking.openSettings().catch(() => undefined)} />
            </>
          )}
        </View>
      ) : null}

      {p.permission === 'granted' ? (
        <>
          {p.servicesEnabled === false ? (
            <Notice tone="warn" title="Location services are off">
              Turn on location in your phone’s quick settings to get a position.
            </Notice>
          ) : null}
          {p.text ? (
            <View style={styles.result} accessibilityLiveRegion="polite">
              <Text style={styles.headline}>{p.text.headline}</Text>
              {p.text.detail ? <Muted>{p.text.detail}</Muted> : null}
            </View>
          ) : (
            <View style={styles.result}>
              <MapPinOff size={18} color={colors.faint} />
              <Muted>Waiting for a location fix. Step outdoors or near a window if it takes a while.</Muted>
            </View>
          )}
          {p.fix?.mocked ? <Notice tone="warn">Your device reports this location as simulated (mock location).</Notice> : null}
          {p.error ? <Notice tone="warn">{p.error}</Notice> : null}

          <View style={{ gap: space.xs }}>
            <Text style={[type.small, { fontWeight: '700', color: colors.text }]}>Location source</Text>
            <View style={styles.segment}>
              <SegmentButton label="Precise (GPS)" active={p.precision === 'precise'} onPress={() => p.onPrecision('precise')} />
              <SegmentButton label="Battery saver" active={p.precision === 'saver'} onPress={() => p.onPrecision('saver')} />
            </View>
            <Text style={type.tiny}>
              {p.precision === 'precise'
                ? 'Asks for the most accurate fixes (uses more battery).'
                : 'Asks for balanced accuracy, so the phone may use Wi‑Fi or mobile-network (cell tower) location where it can. Less accurate.'}
              {p.fix ? ` Current fix: ${ACCURACY_LABEL[acc]}.` : ''}
            </Text>
          </View>

          <Muted>
            Station positions known: {p.coverage.known} of {p.coverage.total}
            {p.coverage.recorded > 0 ? ` (${p.coverage.recorded} recorded on this phone)` : ''}. Pins come from an unofficial map and may be a little off.
          </Muted>
        </>
      ) : null}
    </Card>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Button label={label} compact variant={active ? 'primary' : 'secondary'} onPress={onPress} style={{ flex: 1 }} />
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  result: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: space.md, gap: 4, flexDirection: 'column' },
  headline: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  segment: { flexDirection: 'row', gap: space.sm },
});
