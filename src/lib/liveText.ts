import type { LocateResult } from './locator';
import { ACCURACY_LABEL, classifyAccuracy } from './locator';

export interface LocationText {
  headline: string;
  detail: string | null;
}

const km = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

/** Plain-language description of where the phone is, never more certain than the fix allows. */
export function describeLocation(result: LocateResult, nameOf: (id: string) => string, accuracyM: number | null): LocationText {
  const acc = accuracyM === null ? null : `±${Math.round(accuracyM)} m · ${ACCURACY_LABEL[classifyAccuracy(accuracyM)]}`;
  switch (result.kind) {
    case 'at-station':
      return { headline: `${result.approximate ? 'At or near' : 'At'} ${nameOf(result.stationId)}`, detail: acc };
    case 'near-station':
      return {
        headline: `Near ${nameOf(result.stationId)}`,
        detail: [`about ${km(result.distanceM)} away`, result.approximate ? 'location is only approximate' : null, acc].filter(Boolean).join(' · '),
      };
    case 'between': {
      const pct = Math.round(result.fraction * 100);
      return {
        headline: `Between ${nameOf(result.fromId)} and ${nameOf(result.toId)}`,
        detail: [`${pct}% of the way from ${nameOf(result.fromId)}`, result.approximate ? 'approximate' : null, acc].filter(Boolean).join(' · '),
      };
    }
    case 'off-network':
      return { headline: 'Not on a metro line', detail: `Nearest station is ${nameOf(result.nearestId)}, ${km(result.distanceM)} away.` };
    case 'unreliable':
      return {
        headline: result.reason === 'accuracy' ? 'Location too inaccurate to place you' : 'Location reading is invalid',
        detail: result.reason === 'accuracy' ? 'Wait for a better fix (clear sky, or move away from tall buildings).' : null,
      };
    case 'no-reference':
      return { headline: 'Station locations unavailable', detail: 'Add station coordinates to place yourself on the network.' };
  }
}

export function describeSignalLoss(ageSeconds: number, lastKnown: string | null, probablyUnderground: boolean): LocationText {
  return {
    headline: probablyUnderground ? 'No GPS — probably underground' : 'GPS signal lost',
    detail: [
      probablyUnderground ? 'This is expected in the underground section; GPS cannot reach tunnels.' : 'No location update for ' + ageSeconds + ' s.',
      lastKnown ? `Last seen: ${lastKnown}.` : null,
      'MetroMate does not guess where the train is while the signal is missing.',
    ]
      .filter(Boolean)
      .join(' '),
  };
}

// ------------------------------------------------------------ Live screen card

/** Straight-line walking estimate at about 5 km/h. It ignores roads, so it is shown with a "~". */
export function walkMinutes(distanceM: number): number {
  return Math.max(1, Math.round(distanceM / (5000 / 60)));
}

export type LocationIcon = 'walk' | 'station' | 'train' | 'wait' | 'warn';

export interface LocationCardText {
  icon: LocationIcon;
  headline: string;
  /** Short lines under the headline (at most two are shown). */
  lines: string[];
  /** Station the phone is nearest to when the rider is on foot, so the UI can offer directions. */
  nearestId: string | null;
}

/** Structured version of describeLocation for the "Where am I?" card. */
export function describeLocationCard(result: LocateResult, nameOf: (id: string) => string, accuracyM: number | null): LocationCardText {
  switch (result.kind) {
    case 'off-network':
      return {
        icon: 'walk',
        headline: 'Not on a metro line yet',
        lines: [`Nearest station is ${nameOf(result.nearestId)}`, `${km(result.distanceM)} away · ~${walkMinutes(result.distanceM)} min walk`],
        nearestId: result.nearestId,
      };
    case 'near-station':
      return {
        icon: 'walk',
        headline: `Near ${nameOf(result.stationId)}`,
        lines: [`${km(result.distanceM)} away · ~${walkMinutes(result.distanceM)} min walk`, ...(result.approximate ? ['Location is only approximate'] : [])],
        nearestId: result.stationId,
      };
    case 'at-station': {
      const t = describeLocation(result, nameOf, accuracyM);
      return { icon: 'station', headline: t.headline, lines: t.detail ? [t.detail] : [], nearestId: null };
    }
    case 'between': {
      const t = describeLocation(result, nameOf, accuracyM);
      return { icon: 'train', headline: t.headline, lines: t.detail ? [t.detail] : [], nearestId: null };
    }
    default: {
      const t = describeLocation(result, nameOf, accuracyM);
      return { icon: 'warn', headline: t.headline, lines: t.detail ? [t.detail] : [], nearestId: null };
    }
  }
}

/** Never-claimed signal-loss text in the same shape. */
export function cardFromSignalLoss(t: LocationText): LocationCardText {
  return { icon: 'warn', headline: t.headline, lines: t.detail ? [t.detail] : [], nearestId: null };
}

/** Online-only link that opens a maps app with walking directions to a point. Never used for in-app navigation. */
export function walkingDirectionsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lon.toFixed(6)}&travelmode=walking`;
}
