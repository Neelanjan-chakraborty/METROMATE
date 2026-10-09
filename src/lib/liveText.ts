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
