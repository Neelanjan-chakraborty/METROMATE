import type { FareOutcome, FarePair, FareTable } from '../types';
import { enT, type T } from '../i18n/translate';

export const FARE_UNAVAILABLE_MESSAGE = 'Fare unavailable offline';

const usable = (p: FarePair) => p.verificationStatus === 'verified' && Number.isFinite(p.amountInr) && p.amountInr >= 0;

/**
 * Finds the verified record for a journey. A pair is used in the OPPOSITE direction only when
 * the fare table says fares were checked to be symmetric.
 */
export function findFarePair(fares: FareTable, fromId: string, toId: string): FarePair | undefined {
  const direct = fares.pairs.find((p) => usable(p) && p.fromStationId === fromId && p.toStationId === toId);
  if (direct) return direct;
  if (!fares.symmetric) return undefined;
  return fares.pairs.find((p) => usable(p) && p.fromStationId === toId && p.toStationId === fromId);
}

/**
 * Looks up a verified origin–destination fare. Fares are NEVER derived from the number of stops:
 * if no verified pair exists the result is "unavailable".
 */
export function getFare(fares: FareTable, fromId: string, toId: string, t: T = enT): FareOutcome {
  const pair = findFarePair(fares, fromId, toId);
  if (!pair) return { status: 'unavailable', message: t('route.lib.fareUnavailable') };
  return {
    status: 'available',
    amountInr: pair.amountInr,
    fareType: pair.fareType,
    validFrom: fares.validFrom,
    sourceUrl: pair.sourceUrl,
    distanceKm: pair.distanceKm ?? null,
    travelMinutes: pair.travelMinutes ?? null,
    stationCount: pair.stationCount ?? null,
    interchanges: pair.interchanges ?? null,
  };
}
