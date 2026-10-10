import React, { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Info, Map as MapIcon, MapPin, Share2, Trash2 } from 'lucide-react-native';
import { Button, IconButton, Notice } from '../ui';
import { StationPicker } from '../StationPicker';
import { PositionArt } from './LiveArt';
import { NAVY, SLATE, VIOLET, useLive } from './LiveSections';
import { colors } from '../../theme';
import { useT } from '../../i18n/useT';
import { RECORD_MAX_ACCURACY_M, type Fix } from '../../lib/locator';
import type { Station, StationCoord } from '../../types';

interface Props {
  fix: Fix | null;
  stations: Map<string, Station>;
  coords: StationCoord[];
  /** Pre-selected station, e.g. the one the phone says you are at. */
  suggestedId: string | null;
  onRecord: (stationId: string) => Promise<StationCoord | null>;
  onClearOne: (stationId: string) => void;
  onClearAll: () => void;
}

/**
 * Lets riders improve station positions with their own GPS fixes. This does not alter the
 * bundled dataset; recorded positions are stored on this phone, labelled as such, and can
 * be shared as JSON for adding to the dataset.
 */
export function RecordCard({ fix, stations, coords, suggestedId, onRecord, onClearOne, onClearAll }: Props) {
  const [picker, setPicker] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  /** The outcome of the last attempt, kept as data so it follows a language change. */
  const [outcome, setOutcome] = useState<{ kind: 'saved'; id: string; samples: number; accuracyM: number } | { kind: 'rejected' } | null>(null);
  const { t, tn, lang } = useT();
  const stationId = chosen ?? suggestedId;
  const name = (id: string) => stations.get(id)?.name ?? id;
  const acc = fix?.accuracyM ?? null;
  const goodEnough = acc !== null && acc <= RECORD_MAX_ACCURACY_M;

  const record = async () => {
    if (!stationId) return;
    const saved = await onRecord(stationId);
    setOutcome(saved ? { kind: 'saved', id: stationId, samples: saved.samples, accuracyM: saved.accuracyM } : { kind: 'rejected' });
  };

  const share = () => {
    const payload = {
      note: 'Station positions recorded on a phone with MetroMate. Averaged GPS fixes; treat as estimated.',
      generatedAt: new Date().toISOString(),
      stations: coords.map((c) => ({
        id: c.stationId,
        name: name(c.stationId),
        latitude: Number(c.lat.toFixed(6)),
        longitude: Number(c.lon.toFixed(6)),
        accuracyM: Math.round(c.accuracyM),
        samples: c.samples,
      })),
    };
    void Share.share({ message: JSON.stringify(payload, null, 2) }).catch(() => undefined);
  };

  const { z, st } = useLive();
  const rs = useMemo(() => makeRecordStyles(z, lang !== 'en'), [z, lang]);
  const enabled = !!stationId && goodEnough;
  const fixes = (n: number) => tn('live.record.fixes', n);
  const message =
    outcome === null
      ? null
      : outcome.kind === 'saved'
        ? t('live.record.saved', { name: name(outcome.id), fixes: fixes(outcome.samples), m: Math.max(1, Math.round(outcome.accuracyM)) })
        : t('live.record.rejected', { max: RECORD_MAX_ACCURACY_M });

  return (
    <View style={st.card}>
      <View style={rs.head}>
        <View style={st.smallCircle}>
          <MapPin size={z(15)} color={VIOLET} strokeWidth={2.1} />
        </View>
        <Text style={[st.howTitle, { flex: 1, fontSize: z(15) }]} accessibilityRole="header">
          {t('live.record.title')}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={stationId ? t('live.record.stationA11y', { name: name(stationId) }) : t('live.record.chooseA11y')} onPress={() => setPicker(true)} hitSlop={8} style={({ pressed }) => [st.chip, pressed && { opacity: 0.8 }]}>
          <MapIcon size={z(14)} color={VIOLET} strokeWidth={2.1} />
          <Text style={st.chipText}>{t('live.record.change')}</Text>
        </Pressable>
      </View>

      <View style={rs.body}>
        <PositionArt width={z(115)} height={z(108)} radius={z(14)} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={rs.text}>
            {t('live.record.intro')}
          </Text>
          <Text style={rs.station}>
            {stationId ? t('live.record.recordingFor', { name: name(stationId) }) : t('live.record.chooseHere')}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('live.record.button')}
        accessibilityState={{ disabled: !enabled }}
        disabled={!enabled}
        onPress={() => void record()}
        style={({ pressed }) => [rs.record, !enabled && rs.recordOff, pressed && { opacity: 0.9 }]}
      >
        <View style={rs.recordIcon}>
          <View style={rs.recordDot} />
        </View>
        <Text style={rs.recordLabel}>{t('live.record.button')}</Text>
      </Pressable>

      <View style={rs.info}>
        <Info size={z(15)} color={SLATE} strokeWidth={2} style={{ marginTop: z(1) }} />
        <Text style={[st.caption, { flex: 1, marginTop: 0 }]}>
          {!fix
            ? t('live.record.waitingFix')
            : goodEnough
              ? t('live.record.goodEnough', { m: Math.round(acc!) })
              : acc === null
                ? t('live.record.unknownAcc', { max: RECORD_MAX_ACCURACY_M })
                : t('live.record.tooCoarse', { m: Math.round(acc), max: RECORD_MAX_ACCURACY_M })}
        </Text>
      </View>
      {message ? (
        <View style={{ marginTop: z(10) }}>
          <Notice>{message}</Notice>
        </View>
      ) : null}

      {coords.length > 0 ? (
        <View style={rs.list}>
          <Text style={rs.listTitle}>{t('live.record.listTitle', { n: coords.length })}</Text>
          {coords.map((c) => (
            <View key={c.stationId} style={rs.recRow}>
              <Text style={[st.caption, { flex: 1, marginTop: 0, color: '#39425E' }]}>
                {name(c.stationId)} · {fixes(c.samples)} · {t('live.unit.pmM', { v: Math.max(1, Math.round(c.accuracyM)) })}
              </Text>
              <IconButton icon={Trash2} label={t('live.record.remove.a11y', { name: name(c.stationId) })} color={colors.destination} onPress={() => onClearOne(c.stationId)} />
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: z(10), marginTop: z(4) }}>
            <Button label={t('live.record.share')} icon={Share2} variant="secondary" compact style={{ flex: 1 }} onPress={share} />
            <Button label={t('live.record.clearAll')} icon={Trash2} variant="danger" compact style={{ flex: 1 }} onPress={onClearAll} />
          </View>
        </View>
      ) : null}

      <StationPicker
        visible={picker}
        title={t('live.record.pickTitle')}
        allowBus={false}
        onClose={() => setPicker(false)}
        onSelect={(id) => {
          setChosen(id);
          setOutcome(null);
        }}
      />
    </View>
  );
}

function makeRecordStyles(z: (n: number) => number, indic: boolean) {
  return StyleSheet.create({
    head: { flexDirection: 'row', alignItems: 'center', gap: z(9) },
    body: { flexDirection: 'row', gap: z(14), marginTop: z(13), alignItems: 'flex-start' },
    text: { fontSize: z(11.5), lineHeight: indic ? z(22) : z(16.5), color: '#66718C' },
    station: { fontSize: z(11.5), fontWeight: '700', color: VIOLET, marginTop: z(7) },
    record: { marginTop: z(12), minHeight: z(44), paddingVertical: z(6), paddingHorizontal: z(12), borderRadius: z(12), backgroundColor: VIOLET, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(10), shadowColor: VIOLET, shadowOpacity: 0.28, shadowRadius: z(10), shadowOffset: { width: 0, height: z(5) }, elevation: 4 },
    recordOff: { backgroundColor: '#B8ADF4', shadowOpacity: 0, elevation: 0 },
    recordIcon: { width: z(20), height: z(20), borderRadius: z(10), borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    recordDot: { width: z(11), height: z(11), borderRadius: z(6), backgroundColor: '#FFFFFF' },
    recordLabel: { flexShrink: 1, textAlign: 'center', fontSize: z(13), fontWeight: '700', color: '#FFFFFF' },
    info: { marginTop: z(10), flexDirection: 'row', gap: z(8), alignItems: 'flex-start' },
    list: { marginTop: z(14), paddingTop: z(12), borderTopWidth: 1, borderTopColor: '#ECEEF8', gap: z(6) },
    listTitle: { fontSize: z(14), fontWeight: '800', color: NAVY },
    recRow: { flexDirection: 'row', alignItems: 'center' },
  });
}
