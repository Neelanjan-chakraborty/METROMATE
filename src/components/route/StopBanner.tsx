import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock, DoorOpen, Flag, MapPin, Repeat, type LucideIcon } from 'lucide-react-native';
import { StationThumb, type ThumbStation } from '../stations/StationThumb';
import { useHomeScale } from '../home/scale';
import { Gradient, cardShadow } from './primitives';
import type { StopKind } from '../../lib/routeView';

/**
 * A key stop (start, change, destination) drawn as a photo banner: the station's thumbnail (its photo, or the
 * drawn illustration when none is bundled) faded into violet from the left, with the name over the violet.
 */
type KeyKind = Exclude<StopKind, 'stop'>;

const KIND: Record<KeyKind, { label: string; Icon: LucideIcon; dot: string }> = {
  origin: { label: 'START', Icon: Flag, dot: '#34D399' },
  interchange: { label: 'CHANGE TRAINS', Icon: Repeat, dot: '#FBBF24' },
  destination: { label: 'DESTINATION', Icon: MapPin, dot: '#FB7185' },
};

interface Props {
  station: ThumbStation;
  kind: KeyKind;
  /** Colour of the line the rider is on (a small dot next to the line name). */
  lineColor: string;
  lineName: string;
  /** Second line replacing the line name, e.g. "Switch to North–South · towards Mahatma Mandir". */
  note?: string | null;
  minutes: number | null;
  exits?: number | null;
  onPress: () => void;
}

export const StopBanner = memo(function StopBanner({ station, kind, lineColor, lineName, note, minutes, exits, onPress }: Props) {
  const { z } = useHomeScale();
  const k = KIND[kind];
  const Icon = k.Icon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${k.label.toLowerCase()}: ${station.name}. ${note ?? lineName}.${minutes !== null ? ` About ${minutes} minutes from the start.` : ''} Open station details`}
      onPress={onPress}
      style={({ pressed }) => [{ height: z(96), borderRadius: z(20), overflow: 'hidden', backgroundColor: '#3B27CF', opacity: pressed ? 0.92 : 1 }, cardShadow, { shadowColor: '#4F35E8', shadowOpacity: 0.2 }]}
    >
      <StationThumb station={station} color={lineColor} width={4} height={1} radius={0} fill />
      <Gradient
        id={`bn-${station.id}-${kind}`}
        stops={[
          { at: 0, color: '#34209F', opacity: 0.98 },
          { at: 0.52, color: '#4F35E8', opacity: 0.9 },
          { at: 0.92, color: '#4F35E8', opacity: 0.06 },
          { at: 1, color: '#4F35E8', opacity: 0 },
        ]}
      />
      <View style={[StyleSheet.absoluteFill, { paddingHorizontal: z(15), paddingVertical: z(12), justifyContent: 'center', gap: z(3) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6) }}>
          <View style={{ width: z(8), height: z(8), borderRadius: z(4), backgroundColor: k.dot }} />
          <Icon size={z(12)} color="#E5E1FF" strokeWidth={2.2} />
          <Text style={{ fontSize: z(10.5), fontWeight: '800', color: '#E5E1FF', letterSpacing: 0.9 }}>{k.label}</Text>
        </View>
        <Text style={{ fontSize: z(19), fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, maxWidth: '68%' }} numberOfLines={1}>
          {station.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), maxWidth: '72%' }}>
          {note ? null : <View style={{ width: z(9), height: z(9), borderRadius: z(5), backgroundColor: lineColor, borderWidth: 1.5, borderColor: '#FFFFFF' }} />}
          <Text style={{ fontSize: z(12.5), color: '#E9E6FF', fontWeight: '500' }} numberOfLines={1}>
            {note ?? lineName}
          </Text>
        </View>
      </View>
      <View style={{ position: 'absolute', right: z(10), top: z(10), flexDirection: 'row', gap: z(6) }}>
        {exits ? (
          <View style={chip(z)}>
            <DoorOpen size={z(12)} color="#FFFFFF" strokeWidth={2} />
            <Text style={chipText(z)}>{exits}</Text>
          </View>
        ) : null}
        {minutes !== null && minutes > 0 ? (
          <View style={chip(z)}>
            <Clock size={z(12)} color="#FFFFFF" strokeWidth={2} />
            <Text style={chipText(z)}>~{minutes} min</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const chip = (z: (n: number) => number) => ({ flexDirection: 'row' as const, alignItems: 'center' as const, gap: z(4), height: z(24), paddingHorizontal: z(8), borderRadius: z(12), backgroundColor: 'rgba(30,18,110,0.55)' });
const chipText = (z: (n: number) => number) => ({ fontSize: z(11.5), fontWeight: '700' as const, color: '#FFFFFF' });
