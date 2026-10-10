import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { Accessibility, ArrowLeftRight, Armchair, BriefcaseMedical, Droplet, Eye, Footprints, Hand, MonitorUp, Nfc, Signpost, Ticket, Toilet, TrainFront, DoorOpen, type LucideIcon } from 'lucide-react-native';
import type { AmenityKey } from '../../lib/stationView';

/** Icon + soft tint for each amenity. Escalator, lift and ramp are drawn here (the icon set has none). */
interface Look {
  fg: string;
  bg: string;
}

export const AMENITY_LOOK: Record<AmenityKey, Look> = {
  lift: { fg: '#4F35E8', bg: '#EFEDFF' },
  ramp: { fg: '#0F6FC4', bg: '#E3F1FC' },
  gates: { fg: '#4F35E8', bg: '#EFEDFF' },
  escalator: { fg: '#EA7A1A', bg: '#FFF1E3' },
  signage: { fg: '#0E8F8F', bg: '#E1F5F4' },
  card: { fg: '#4F35E8', bg: '#EFEDFF' },
  tickets: { fg: '#0F6FC4', bg: '#E3F1FC' },
  water: { fg: '#1E88D6', bg: '#E3F1FC' },
  firstaid: { fg: '#D92D20', bg: '#FDECEA' },
  seating: { fg: '#B45309', bg: '#FEF3C7' },
  display: { fg: '#475569', bg: '#EEF1F6' },
  toilets: { fg: '#4F35E8', bg: '#EFEDFF' },
  wideGates: { fg: '#0E9F6E', bg: '#E4F7EF' },
  tactile: { fg: '#0E9F6E', bg: '#E4F7EF' },
  wheelchair: { fg: '#0F6FC4', bg: '#E3F1FC' },
  braille: { fg: '#4F35E8', bg: '#EFEDFF' },
  trainSpace: { fg: '#0F6FC4', bg: '#E3F1FC' },
  accToilets: { fg: '#0F6FC4', bg: '#E3F1FC' },
  lowCounter: { fg: '#B45309', bg: '#FEF3C7' },
  other: { fg: '#475569', bg: '#EEF1F6' },
};

const LUCIDE: Partial<Record<AmenityKey, LucideIcon>> = {
  gates: DoorOpen,
  signage: Signpost,
  card: Nfc,
  tickets: Ticket,
  water: Droplet,
  firstaid: BriefcaseMedical,
  seating: Armchair,
  display: MonitorUp,
  toilets: Toilet,
  wideGates: ArrowLeftRight,
  tactile: Footprints,
  wheelchair: Accessibility,
  braille: Hand,
  trainSpace: TrainFront,
  accToilets: Accessibility,
  lowCounter: Ticket,
  other: Eye,
};

export function AmenityIcon({ k, size, color }: { k: AmenityKey; size: number; color: string }) {
  if (k === 'escalator')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 20h4l9-9h5" />
        <Path d="M3 14.5h2.5l8-8h4" />
        <Path d="M15 3.5l3.2 3-3.2 3" />
      </Svg>
    );
  if (k === 'lift')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <Rect x={4} y={3} width={16} height={18} rx={3} />
        <Path d="M12 7.5v9M9.5 10l2.5-2.5 2.5 2.5M9.5 14l2.5 2.5 2.5-2.5" />
      </Svg>
    );
  if (k === 'ramp')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 19h18V9L3 19z" />
        <Path d="M3 19h4.5" />
        <Path d="M14 6.5a2 2 0 100-.01" />
      </Svg>
    );
  const Icon = LUCIDE[k] ?? Eye;
  return <Icon size={size} color={color} strokeWidth={1.9} />;
}
