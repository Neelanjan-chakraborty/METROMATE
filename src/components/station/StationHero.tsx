import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, Clock, ExternalLink, Repeat } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomeScale } from '../home/scale';
import { Gradient } from '../route/primitives';
import { StationThumb, type ThumbStation } from '../stations/StationThumb';
import { stationPhoto } from '../stations/photos';
import type { StationService } from '../../lib/stationView';

interface Props {
  station: ThumbStation & { isInterchange: boolean };
  color: string;
  service: StationService;
  /** "Elevated" / "Underground" / null when unknown. */
  typeLabel: string | null;
  onBack: () => void;
  onMaps: () => void;
}

const STATE = {
  running: { text: 'Trains running', dot: '#34D399' },
  'not-started': { text: 'Not started yet', dot: '#FBBF24' },
  ended: { text: 'Service ended', dot: '#CBD5E1' },
  unknown: { text: 'Timings unknown', dot: '#CBD5E1' },
} as const;

/** The station's photo (or drawn illustration) full-bleed, with the name and today's service state over a violet fade. */
export function StationHero({ station, color, service, typeLabel, onBack, onMaps }: Props) {
  const { z } = useHomeScale();
  const insets = useSafeAreaInsets();
  const photo = stationPhoto(station.id);
  const st = STATE[service.state];
  const h = insets.top + z(236);
  return (
    <View style={{ height: h, backgroundColor: '#3B27CF', overflow: 'hidden' }}>
      <StationThumb station={station} color={color} width={4} height={3} radius={0} fill />
      <Gradient id="sh-top" vertical stops={[{ at: 0, color: '#1E126E', opacity: 0.62 }, { at: 0.38, color: '#1E126E', opacity: 0 }]} />
      <Gradient id="sh-bot" vertical stops={[{ at: 0.35, color: '#2B1FC4', opacity: 0 }, { at: 1, color: '#2B1FC4', opacity: 0.94 }]} />

      <View style={{ position: 'absolute', top: insets.top + z(8), left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <RoundBtn z={z} label="Back" onPress={onBack}>
          <ChevronLeft size={z(22)} color="#1E1B4B" />
        </RoundBtn>
        <RoundBtn z={z} label="Open in Maps (needs internet)" onPress={onMaps}>
          <ExternalLink size={z(19)} color="#4F35E8" />
        </RoundBtn>
      </View>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: z(14), gap: z(8) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(10) }}>
          <Text style={{ flexShrink: 1, fontSize: z(31), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.6 }} accessibilityRole="header" numberOfLines={2}>
            {station.name}
          </Text>
          {station.isInterchange ? (
            <View accessible accessibilityLabel="Interchange station" style={{ width: z(30), height: z(30), borderRadius: z(15), backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
              <Repeat size={z(16)} color="#FFFFFF" strokeWidth={2.4} />
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8), flexWrap: 'wrap' }}>
          <Chip z={z}>
            <View style={{ width: z(8), height: z(8), borderRadius: z(4), backgroundColor: st.dot }} />
            <Text style={chipText(z)}>{st.text}</Text>
          </Chip>
          {service.first && service.last ? (
            <Chip z={z} label={`Line hours ${service.first} to ${service.last}`}>
              <Clock size={z(13)} color="#FFFFFF" strokeWidth={2} />
              <Text style={chipText(z)}>
                {service.first} – {service.last}
              </Text>
            </Chip>
          ) : null}
          {typeLabel ? (
            <Chip z={z}>
              <Text style={chipText(z)}>{typeLabel}</Text>
            </Chip>
          ) : null}
        </View>
      </View>

      <Pressable
        disabled={!photo}
        accessibilityRole={photo ? 'link' : 'text'}
        accessibilityLabel={photo ? `Photo credit: ${photo.credit}, ${photo.license}. Opens Wikimedia Commons` : 'Illustration, not a photo of this station'}
        onPress={() => photo && Linking.openURL(photo.pageUrl).catch(() => undefined)}
        style={{ position: 'absolute', right: 16, top: insets.top + z(58), paddingHorizontal: z(9), height: z(22), borderRadius: z(11), backgroundColor: 'rgba(20,12,80,0.5)', justifyContent: 'center' }}
      >
        <Text style={{ fontSize: z(10.5), color: '#FFFFFF' }} numberOfLines={1}>
          {photo ? `Photo: ${photo.credit} · ${photo.license}` : 'Illustration'}
        </Text>
      </Pressable>
    </View>
  );
}

function RoundBtn({ z, label, onPress, children }: { z: (n: number) => number; label: string; onPress: () => void; children: React.ReactNode }) {
  const d = z(42);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => [{ width: d, height: d, borderRadius: d / 2, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 }, styles.shadow]}>
      {children}
    </Pressable>
  );
}

function Chip({ z, children, label }: { z: (n: number) => number; children: React.ReactNode; label?: string }) {
  return (
    <View accessible={!!label} accessibilityLabel={label} style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), height: z(26), paddingHorizontal: z(10), borderRadius: z(13), backgroundColor: 'rgba(255,255,255,0.18)' }}>
      {children}
    </View>
  );
}

const chipText = (z: (n: number) => number) => ({ fontSize: z(12), fontWeight: '700' as const, color: '#FFFFFF' });
const styles = StyleSheet.create({ shadow: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 } });
