import type { LocateResult } from './locator';
import { accuracyLabel, classifyAccuracy } from './locator';
import { enT, type T } from '../i18n/translate';

export interface LocationText {
  headline: string;
  detail: string | null;
}

/** "1.5 km" / "320 m" in the active language. */
export function distanceText(m: number, t: T = enT): string {
  return m >= 1000 ? t('live.unit.km', { v: (m / 1000).toFixed(1) }) : t('live.unit.m', { v: Math.round(m) });
}

/** "45 min", "1 h 05 min" in the active language (same wording as formatDuration in English). */
export function durationText(minutes: number, t: T = enT): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return t('live.unit.min', { v: m });
  return t('live.unit.hMin', { h: Math.floor(m / 60), m: String(m % 60).padStart(2, '0') });
}

/** Plain-language description of where the phone is, never more certain than the fix allows. */
export function describeLocation(result: LocateResult, nameOf: (id: string) => string, accuracyM: number | null, t: T = enT): LocationText {
  const acc = accuracyM === null ? null : `${t('live.unit.pmM', { v: Math.round(accuracyM) })} · ${accuracyLabel(classifyAccuracy(accuracyM), t)}`;
  switch (result.kind) {
    case 'at-station':
      return { headline: t(result.approximate ? 'live.loc.atOrNear' : 'live.loc.at', { name: nameOf(result.stationId) }), detail: acc };
    case 'near-station':
      return {
        headline: t('live.loc.near', { name: nameOf(result.stationId) }),
        detail: [t('live.loc.aboutAway', { dist: distanceText(result.distanceM, t) }), result.approximate ? t('live.loc.onlyApprox') : null, acc].filter(Boolean).join(' · '),
      };
    case 'between': {
      const pct = Math.round(result.fraction * 100);
      return {
        headline: t('live.loc.between', { from: nameOf(result.fromId), to: nameOf(result.toId) }),
        detail: [t('live.loc.pctFrom', { pct, from: nameOf(result.fromId) }), result.approximate ? t('live.loc.approx') : null, acc].filter(Boolean).join(' · '),
      };
    }
    case 'off-network':
      return { headline: t('live.loc.offNetwork'), detail: t('live.loc.offNetworkDetail', { name: nameOf(result.nearestId), dist: distanceText(result.distanceM, t) }) };
    case 'unreliable':
      return {
        headline: t(result.reason === 'accuracy' ? 'live.loc.inaccurate' : 'live.loc.invalid'),
        detail: result.reason === 'accuracy' ? t('live.loc.waitBetter') : null,
      };
    case 'no-reference':
      return { headline: t('live.loc.noRef'), detail: t('live.loc.noRefDetail') };
  }
}

/**
 * `lastKnown` is a ready-made phrase such as "at Kalupur" (see {@link lastKnownText}), already in the
 * active language, or null when nothing was seen.
 */
export function describeSignalLoss(ageSeconds: number, lastKnown: string | null, probablyUnderground: boolean, t: T = enT): LocationText {
  return {
    headline: t(probablyUnderground ? 'live.signal.noGpsUnderground' : 'live.signal.lost'),
    detail: [
      probablyUnderground ? t('live.signal.expected') : t('live.signal.noUpdate', { s: ageSeconds }),
      lastKnown ? t('live.signal.lastSeen', { where: lastKnown }) : null,
      t('live.signal.noGuess'),
    ]
      .filter(Boolean)
      .join(' '),
  };
}

/** "at X" / "near X" / "between X and Y" for the last place the phone was seen, or null if unknown. */
export function lastKnownText(result: LocateResult, nameOf: (id: string) => string, t: T = enT): string | null {
  switch (result.kind) {
    case 'at-station':
      return t('live.signal.lastAt', { name: nameOf(result.stationId) });
    case 'near-station':
      return t('live.signal.lastNear', { name: nameOf(result.stationId) });
    case 'between':
      return t('live.signal.lastBetween', { from: nameOf(result.fromId), to: nameOf(result.toId) });
    default:
      return null;
  }
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
export function describeLocationCard(result: LocateResult, nameOf: (id: string) => string, accuracyM: number | null, t: T = enT): LocationCardText {
  const walkLine = (distanceM: number) => t('live.card.awayWalk', { dist: distanceText(distanceM, t), min: walkMinutes(distanceM) });
  switch (result.kind) {
    case 'off-network':
      return {
        icon: 'walk',
        headline: t('live.card.offNetwork'),
        lines: [t('live.card.nearest', { name: nameOf(result.nearestId) }), walkLine(result.distanceM)],
        nearestId: result.nearestId,
      };
    case 'near-station':
      return {
        icon: 'walk',
        headline: t('live.loc.near', { name: nameOf(result.stationId) }),
        lines: [walkLine(result.distanceM), ...(result.approximate ? [t('live.card.approx')] : [])],
        nearestId: result.stationId,
      };
    case 'at-station': {
      const d = describeLocation(result, nameOf, accuracyM, t);
      return { icon: 'station', headline: d.headline, lines: d.detail ? [d.detail] : [], nearestId: null };
    }
    case 'between': {
      const d = describeLocation(result, nameOf, accuracyM, t);
      return { icon: 'train', headline: d.headline, lines: d.detail ? [d.detail] : [], nearestId: null };
    }
    default: {
      const d = describeLocation(result, nameOf, accuracyM, t);
      return { icon: 'warn', headline: d.headline, lines: d.detail ? [d.detail] : [], nearestId: null };
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
