import type { Corridor, Facilities, Gate, NearbyConnection, Station, TimetableLine, TimetableMetadata } from '../types';
import { enT, type MessageKey, type T } from '../i18n';
import { hopMinutes } from './eta';
import { toMinutes } from './serviceNow';

/** View-model helpers for the Station screen. Pure, so they can be tested. */

// --------------------------------------------------------------- amenities

export type AmenityKey =
  | 'lift' | 'ramp' | 'gates'
  | 'escalator' | 'signage' | 'card' | 'tickets' | 'water' | 'firstaid' | 'seating' | 'display' | 'toilets'
  | 'wideGates' | 'tactile' | 'wheelchair' | 'braille' | 'trainSpace' | 'accToilets' | 'lowCounter'
  | 'other';

export interface Amenity {
  key: AmenityKey;
  label: string;
}

/** GMRC's facility wording -> an icon key. First match wins; the label comes from the message catalog. */
const FACILITY_RULES: [RegExp, Exclude<AmenityKey, 'other' | 'gates'>][] = [
  [/escalator/i, 'escalator'],
  [/signage/i, 'signage'],
  [/smart card|contactless/i, 'card'],
  [/vending|recharge/i, 'tickets'],
  [/drinking/i, 'water'],
  [/first aid/i, 'firstaid'],
  [/seating/i, 'seating'],
  [/^lifts?$/i, 'lift'],
  [/information display/i, 'display'],
  [/washroom.*differently|differently.*washroom/i, 'accToilets'],
  [/washroom/i, 'toilets'],
  [/wide automatic/i, 'wideGates'],
  [/tactile/i, 'tactile'],
  [/ramp/i, 'ramp'],
  [/wheelchair available/i, 'wheelchair'],
  [/braille/i, 'braille'],
  [/reserved space/i, 'trainSpace'],
  [/low height/i, 'lowCounter'],
];

/** One- or two-word label for each amenity (English: "Escalators", "Smart card", ...). */
const AMENITY_LABEL: Record<Exclude<AmenityKey, 'other' | 'gates'>, MessageKey> = {
  lift: 'station.amenity.lifts',
  ramp: 'station.amenity.ramp',
  escalator: 'station.amenity.escalator',
  signage: 'station.amenity.signage',
  card: 'station.amenity.card',
  tickets: 'station.amenity.tickets',
  water: 'station.amenity.water',
  firstaid: 'station.amenity.firstaid',
  seating: 'station.amenity.seating',
  display: 'station.amenity.display',
  toilets: 'station.amenity.toilets',
  wideGates: 'station.amenity.wideGates',
  tactile: 'station.amenity.tactile',
  wheelchair: 'station.amenity.wheelchair',
  braille: 'station.amenity.braille',
  trainSpace: 'station.amenity.trainSpace',
  accToilets: 'station.amenity.accToilets',
  lowCounter: 'station.amenity.lowCounter',
};

/** An unknown facility falls back to the first two words of GMRC's own wording (data, so not translated). */
export function amenityFor(text: string, t: T = enT): Amenity {
  for (const [re, key] of FACILITY_RULES) if (re.test(text.trim())) return { key, label: t(AMENITY_LABEL[key]) };
  return { key: 'other', label: text.split(/\s+/).slice(0, 2).join(' ') };
}

export interface StationAmenities {
  /** Listed by GMRC for THIS station (gate table): lifts with ramp, entry/exit gates. */
  here: (Amenity & { count?: number })[];
  /** GMRC's network-wide lists. They do not confirm that this station has them. */
  network: { general: Amenity[]; accessibility: Amenity[] };
}

export function stationAmenities(station: Station, gates: Gate[], facilities: Facilities, t: T = enT): StationAmenities {
  const here: StationAmenities['here'] = [];
  const nGates = new Set(gates.map((g) => g.gateNumber)).size;
  if (station.lifts.length > 0) {
    here.push({ key: 'lift', label: t(station.lifts.length === 1 ? 'station.amenity.lift' : 'station.amenity.lifts'), count: station.lifts.length });
    here.push({ key: 'ramp', label: t('station.amenity.wheelchairRamp') });
  }
  if (nGates > 0) here.push({ key: 'gates', label: t(nGates === 1 ? 'station.amenity.gate' : 'station.amenity.gates'), count: nGates });
  const hasLift = station.lifts.length > 0;
  const general = facilities.general.map((f) => amenityFor(f, t)).filter((a) => !(a.key === 'lift' && hasLift));
  const accessibility = facilities.accessibility.map((f) => amenityFor(f, t)).filter((a) => !(a.key === 'ramp' && hasLift));
  return { here, network: { general, accessibility } };
}

// -------------------------------------------------------------------- gates

export interface GateFeatures {
  number: number;
  /** Lifts GMRC lists near this gate (lift numbers). All are described by GMRC as "with ramp for wheelchair". */
  lifts: number[];
  /** Connection notes from the unofficial map that name this gate. UNVERIFIED. */
  connections: NearbyConnection[];
}

/** One entry per gate number, in numeric order. */
export function gateFeatures(station: Station, gates: Gate[]): GateFeatures[] {
  const numbers = [...new Set(gates.map((g) => Number(g.gateNumber)).filter((n) => Number.isFinite(n)))].sort((a, b) => a - b);
  return numbers.map((n) => ({
    number: n,
    lifts: station.lifts.filter((l) => l.nearGate === n).map((l) => l.lift),
    connections: station.nearbyConnections.filter((c) => c.gateNumber === n),
  }));
}

// ------------------------------------------------------------------- hours

export interface StationService {
  lines: TimetableLine[];
  /** Earliest first train and latest last train over the lines that serve the station (at their end stations). */
  first: string | null;
  last: string | null;
  state: 'running' | 'not-started' | 'ended' | 'unknown';
}

/**
 * Service hours from GMRC's published line timetable. These are the first/last trains at the line's end
 * stations, not at this station, so they are labelled as line hours and never as the station's opening hours.
 */
export function stationService(timetable: TimetableMetadata, stationId: string, when: Date): StationService {
  const lines = timetable.lines.filter((l) => l.stationIds.includes(stationId));
  const firsts = lines.flatMap((l) => l.firstTrain.map((t) => t.time)).filter((t) => toMinutes(t) !== null);
  const lasts = lines.flatMap((l) => l.lastTrain.map((t) => t.time)).filter((t) => toMinutes(t) !== null);
  if (firsts.length === 0 || lasts.length === 0) return { lines, first: null, last: null, state: 'unknown' };
  const first = firsts.reduce((a, b) => (toMinutes(a)! <= toMinutes(b)! ? a : b));
  const last = lasts.reduce((a, b) => (toMinutes(a)! >= toMinutes(b)! ? a : b));
  const m = when.getHours() * 60 + when.getMinutes();
  const state = m < toMinutes(first)! ? 'not-started' : m > toMinutes(last)! ? 'ended' : 'running';
  return { lines, first, last, state };
}

// --------------------------------------------------------------- neighbours

export interface Neighbours {
  corridor: Corridor;
  prev: { id: string; towardsId: string } | null;
  next: { id: string; towardsId: string } | null;
}

/** The stations either side on one corridor, with the terminal a train in that direction is heading to. */
export function neighboursOn(corridor: Corridor, stationId: string): Neighbours {
  const i = corridor.sequence.indexOf(stationId);
  return {
    corridor,
    prev: i > 0 ? { id: corridor.sequence[i - 1], towardsId: corridor.backwardTerminalId } : null,
    next: i >= 0 && i < corridor.sequence.length - 1 ? { id: corridor.sequence[i + 1], towardsId: corridor.forwardTerminalId } : null,
  };
}

/**
 * Estimated minutes between two adjacent stations: GMRC's published line time spread by distance between
 * the (approximate) pins. Null if no published line covers the hop or a pin is missing. Never below 1.
 */
export function hopEstimate(
  a: string,
  b: string,
  coordOf: (id: string) => { lat: number; lon: number } | null | undefined,
  lines: TimetableLine[],
): number | null {
  const h = hopMinutes([a, b], coordOf, lines);
  return h ? Math.max(1, Math.round(h.minutes[0])) : null;
}

// ----------------------------------------------------------------- nearby

export type PlaceKind = 'education' | 'sport' | 'business' | 'rail' | 'culture' | 'government' | 'market' | 'event' | 'media' | 'other';

const PLACE_KIND: Record<string, PlaceKind> = {
  university: 'education',
  college: 'education',
  stadium: 'sport',
  'business-district': 'business',
  'industrial-park': 'business',
  'railway-station': 'rail',
  'tourist-landmark': 'culture',
  government: 'government',
  court: 'government',
  market: 'market',
  'convention-centre': 'event',
  media: 'media',
};

export function placeKind(category: string): PlaceKind {
  return PLACE_KIND[category] ?? 'other';
}
