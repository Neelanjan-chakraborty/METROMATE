import { enT, enTN, type T, type TN } from '../i18n';
import type { Corridor, Gate, Landmark, NearbyConnection, Station } from '../types';

/**
 * What the Stations list shows for each station. Only published or recorded data is used:
 *  - exits = GMRC's table of operational entry/exit gates (verified);
 *  - lifts = lifts with ramp listed by GMRC at the entrances (verified);
 *  - connection = BRTS / bus / rail note from an unofficial map (UNVERIFIED, so it is flagged).
 * Escalators, parking and per-station facilities are not published per station, so they are never shown.
 */
export interface StationCardInfo {
  /** Number of GMRC-listed entry/exit gates, or null when the station is not in GMRC's table. */
  exits: number | null;
  lifts: number;
  connection: { kind: NearbyConnection['kind']; label: string; verified: boolean } | null;
  /** One line under the corridor name. See `locationLine`. */
  location: string;
  badges: { code: string; color: string }[];
  /** The first line's name, e.g. "North–South Line". Interchanges show both lines as badges. */
  lineName: string;
  /** Every line serving the station, for screen readers: "North–South Line · GIFT City branch". */
  allLines: string;
  lineColor: string;
}

/** "BRTS" is a brand name and stays as it is; the other labels are translated. */
function connectionLabel(kind: NearbyConnection['kind'], t: T): string {
  return kind === 'brts' ? 'BRTS' : t(kind === 'bus' ? 'stations.conn.bus' : kind === 'rail' ? 'stations.conn.rail' : 'stations.conn.generic');
}
const CONNECTION_ORDER: NearbyConnection['kind'][] = ['rail', 'brts', 'bus', 'other'];

const BADGE_CODE: Record<string, string> = { ns: 'NS', ew: 'EW', gift: 'GIFT' };

export function corridorCode(corridor: Corridor): string {
  return BADGE_CODE[corridor.id] ?? corridor.shortName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
}

function lineLabel(c: Corridor, t: T = enT): string {
  return /branch|line$/i.test(c.shortName) ? c.shortName : t('stations.line.named', { name: c.shortName });
}

/** First nearby connection by usefulness (rail, then BRTS, then bus). */
export function pickConnection(list: NearbyConnection[], t: T = enT): StationCardInfo['connection'] {
  for (const kind of CONNECTION_ORDER) {
    const c = list.find((x) => x.kind === kind);
    if (c) return { kind, label: connectionLabel(kind, t), verified: c.verificationStatus === 'verified' };
  }
  return null;
}

/**
 * The place line. There is no verified street address or neighbourhood in the data, so this is, in order:
 * a landmark named like the station (association inferred from the official name), an alias, or the
 * station's position on its line. It never states a street or area that is not in the data.
 */
export function locationLine(station: Station, landmarks: Landmark[], corridors: Map<string, Corridor>, t: T = enT): string {
  const landmark = landmarks.find((l) => l.nearestStationId === station.id);
  if (landmark) return t('stations.loc.near', { name: landmark.name });
  if (station.aliases.length > 0) return t('stations.loc.alias', { name: station.aliases[0] });
  const cid = station.corridorIds[0];
  const c = cid ? corridors.get(cid) : undefined;
  const seq = cid ? station.sequenceByCorridor[cid] : undefined;
  if (c && seq) return t('stations.loc.stop', { seq, total: c.sequence.length, phase: station.phase });
  return t('stations.loc.phase', { phase: station.phase });
}

export function stationCardInfo(
  station: Station,
  gates: Gate[],
  landmarks: Landmark[],
  corridors: Map<string, Corridor>,
  t: T = enT,
): StationCardInfo {
  const own = station.corridorIds.map((id) => corridors.get(id)).filter((c): c is Corridor => !!c);
  const gateCount = gates.filter((g) => g.stationId === station.id).length;
  return {
    exits: gateCount > 0 ? gateCount : null,
    lifts: station.lifts.length,
    connection: pickConnection(station.nearbyConnections, t),
    location: locationLine(station, landmarks, corridors, t),
    badges: own.map((c) => ({ code: corridorCode(c), color: c.color })),
    lineName: own[0] ? lineLabel(own[0], t) : t('stations.line.metro'),
    allLines: own.map((c) => lineLabel(c, t)).join(' · ') || t('stations.line.metro'),
    lineColor: own[0]?.color ?? '#566074',
  };
}

/** Singular/plural label for a count chip. */
export function countLabel(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Spoken summary for the whole card (screen readers). */
export function cardAccessibilityLabel(name: string, info: StationCardInfo, t: T = enT, tn: TN = enTN): string {
  const parts = [name, info.allLines, info.location];
  parts.push(info.exits === null ? t('stations.a11y.exitsNa') : tn('stations.a11y.exits', info.exits));
  if (info.lifts > 0) parts.push(tn('stations.a11y.lifts', info.lifts));
  if (info.connection) parts.push(`${info.connection.label}${info.connection.verified ? '' : ` (${t('stations.unverified')})`}`);
  return `${parts.join('. ')}. ${t('stations.a11y.open')}`;
}
