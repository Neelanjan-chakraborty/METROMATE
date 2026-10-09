import React, { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Info, Map as MapIcon, MapPin, Share2, Trash2 } from 'lucide-react-native';
import { Button, IconButton, Notice } from '../ui';
import { StationPicker } from '../StationPicker';
import { PositionArt } from './LiveArt';
import { NAVY, SLATE, VIOLET, useLive } from './LiveSections';
import { colors } from '../../theme';
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
  const [message, setMessage] = useState<string | null>(null);
  const stationId = chosen ?? suggestedId;
  const name = (id: string) => stations.get(id)?.name ?? id;
  const acc = fix?.accuracyM ?? null;
  const goodEnough = acc !== null && acc <= RECORD_MAX_ACCURACY_M;

  const record = async () => {
    if (!stationId) return;
    const saved = await onRecord(stationId);
    setMessage(
      saved
        ? `Saved ${name(stationId)}: ${saved.samples} ${saved.samples === 1 ? 'fix' : 'fixes'} averaged, about ±${Math.max(1, Math.round(saved.accuracyM))} m.`
        : `That fix isn’t accurate enough (needs ±${RECORD_MAX_ACCURACY_M} m or better). Wait for a better fix.`,
    );
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
  const rs = useMemo(() => makeRecordStyles(z), [z]);
  const enabled = !!stationId && goodEnough;

  return (
    <View style={st.card}>
      <View style={rs.head}>
        <View style={st.smallCircle}>
          <MapPin size={z(15)} color={VIOLET} strokeWidth={2.1} />
        </View>
        <Text style={[st.howTitle, { flex: 1, fontSize: z(15) }]} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          Improve station positions
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={stationId ? `Station: ${name(stationId)}. Change station` : 'Choose a station'} onPress={() => setPicker(true)} hitSlop={8} style={({ pressed }) => [st.chip, pressed && { opacity: 0.8 }]}>
          <MapIcon size={z(14)} color={VIOLET} strokeWidth={2.1} />
          <Text style={st.chipText}>Change station</Text>
        </Pressable>
      </View>

      <View style={rs.body}>
        <PositionArt width={z(115)} height={z(108)} radius={z(14)} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={rs.text}>
            Help make MetroMate more accurate. Stand in the station, record your GPS position, and we’ll improve the station pin (stored only on this phone).
          </Text>
          <Text style={rs.station} numberOfLines={1}>
            {stationId ? `Recording for ${name(stationId)}` : 'Choose the station you’re at'}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Record my position here"
        accessibilityState={{ disabled: !enabled }}
        disabled={!enabled}
        onPress={() => void record()}
        style={({ pressed }) => [rs.record, !enabled && rs.recordOff, pressed && { opacity: 0.9 }]}
      >
        <View style={rs.recordIcon}>
          <View style={rs.recordDot} />
        </View>
        <Text style={rs.recordLabel}>Record my position here</Text>
      </Pressable>

      <View style={rs.info}>
        <Info size={z(15)} color={SLATE} strokeWidth={2} style={{ marginTop: z(1) }} />
        <Text style={[st.caption, { flex: 1, marginTop: 0 }]}>
          {!fix
            ? 'Waiting for a GPS fix.'
            : goodEnough
              ? `Current fix ±${Math.round(acc!)} m is good enough. Record 2–3 times, a few seconds apart, for a better average.`
              : `Current fix is ${acc === null ? 'of unknown accuracy' : `±${Math.round(acc)} m`}; recording needs ±${RECORD_MAX_ACCURACY_M} m or better. Step outdoors or wait.`}
        </Text>
      </View>
      {message ? (
        <View style={{ marginTop: z(10) }}>
          <Notice>{message}</Notice>
        </View>
      ) : null}

      {coords.length > 0 ? (
        <View style={rs.list}>
          <Text style={rs.listTitle}>Recorded on this phone ({coords.length})</Text>
          {coords.map((c) => (
            <View key={c.stationId} style={rs.recRow}>
              <Text style={[st.caption, { flex: 1, marginTop: 0, color: '#39425E' }]}>
                {name(c.stationId)} · {c.samples} {c.samples === 1 ? 'fix' : 'fixes'} · ±{Math.max(1, Math.round(c.accuracyM))} m
              </Text>
              <IconButton icon={Trash2} label={`Remove recorded position for ${name(c.stationId)}`} color={colors.destination} onPress={() => onClearOne(c.stationId)} />
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: z(10), marginTop: z(4) }}>
            <Button label="Share as JSON" icon={Share2} variant="secondary" compact style={{ flex: 1 }} onPress={share} />
            <Button label="Clear all" icon={Trash2} variant="danger" compact style={{ flex: 1 }} onPress={onClearAll} />
          </View>
        </View>
      ) : null}

      <StationPicker
        visible={picker}
        title="Which station are you at?"
        onClose={() => setPicker(false)}
        onSelect={(id) => {
          setChosen(id);
          setMessage(null);
        }}
      />
    </View>
  );
}

function makeRecordStyles(z: (n: number) => number) {
  return StyleSheet.create({
    head: { flexDirection: 'row', alignItems: 'center', gap: z(9) },
    body: { flexDirection: 'row', gap: z(14), marginTop: z(13), alignItems: 'flex-start' },
    text: { fontSize: z(11.5), lineHeight: z(16.5), color: '#66718C' },
    station: { fontSize: z(11.5), fontWeight: '700', color: VIOLET, marginTop: z(7) },
    record: { marginTop: z(12), height: z(38), borderRadius: z(12), backgroundColor: VIOLET, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(10), shadowColor: VIOLET, shadowOpacity: 0.28, shadowRadius: z(10), shadowOffset: { width: 0, height: z(5) }, elevation: 4 },
    recordOff: { backgroundColor: '#B8ADF4', shadowOpacity: 0, elevation: 0 },
    recordIcon: { width: z(20), height: z(20), borderRadius: z(10), borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    recordDot: { width: z(11), height: z(11), borderRadius: z(6), backgroundColor: '#FFFFFF' },
    recordLabel: { fontSize: z(13), fontWeight: '700', color: '#FFFFFF' },
    info: { marginTop: z(10), flexDirection: 'row', gap: z(8), alignItems: 'flex-start' },
    list: { marginTop: z(14), paddingTop: z(12), borderTopWidth: 1, borderTopColor: '#ECEEF8', gap: z(6) },
    listTitle: { fontSize: z(14), fontWeight: '800', color: NAVY },
    recRow: { flexDirection: 'row', alignItems: 'center' },
  });
}
