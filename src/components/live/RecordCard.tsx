import React, { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { Crosshair, Share2, Trash2 } from 'lucide-react-native';
import { Button, Card, IconButton, Muted, Notice } from '../ui';
import { StationPicker } from '../StationPicker';
import { colors, space, type } from '../../theme';
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

  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.head}>
        <Crosshair size={20} color={colors.primary} />
        <Text style={[type.h2, { flex: 1 }]}>Improve station positions</Text>
      </View>
      <Muted>
        Built-in station pins come from an unofficial map and can be off by a block. Standing in a station, record your GPS position there; MetroMate averages repeated fixes and prefers them over the pin. Stored only on this phone.
      </Muted>

      <View style={styles.pickRow}>
        <View style={{ flex: 1 }}>
          <Text style={type.tiny}>Station</Text>
          <Text style={stationId ? type.h3 : [type.body, { color: colors.faint }]}>{stationId ? name(stationId) : 'Choose the station you’re at'}</Text>
        </View>
        <Button label="Change" variant="secondary" compact onPress={() => setPicker(true)} />
      </View>
      <Button label="Record my position here" icon={Crosshair} disabled={!stationId || !goodEnough} onPress={() => void record()} />
      <Text style={type.tiny}>
        {!fix
          ? 'Waiting for a GPS fix.'
          : goodEnough
            ? `Current fix ±${Math.round(acc!)} m is good enough. Record 2–3 times, a few seconds apart, for a better average.`
            : `Current fix is ${acc === null ? 'of unknown accuracy' : `±${Math.round(acc)} m`}; recording needs ±${RECORD_MAX_ACCURACY_M} m or better. Step outdoors or wait.`}
      </Text>
      {message ? <Notice>{message}</Notice> : null}

      {coords.length > 0 ? (
        <View style={{ gap: space.xs }}>
          <Text style={type.h3}>Recorded on this phone ({coords.length})</Text>
          {coords.map((c) => (
            <View key={c.stationId} style={styles.recRow}>
              <Text style={[type.small, { flex: 1, color: colors.text }]}>
                {name(c.stationId)} · {c.samples} {c.samples === 1 ? 'fix' : 'fixes'} · ±{Math.max(1, Math.round(c.accuracyM))} m
              </Text>
              <IconButton icon={Trash2} label={`Remove recorded position for ${name(c.stationId)}`} color={colors.destination} onPress={() => onClearOne(c.stationId)} />
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: space.sm }}>
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
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  recRow: { flexDirection: 'row', alignItems: 'center' },
});
