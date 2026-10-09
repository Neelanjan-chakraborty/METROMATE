import type { FareOutcome, FareTable } from '../types';

export const FARE_UNAVAILABLE_MESSAGE = 'Fare unavailable offline';

/**
 * Looks up a verified origin–destination fare. Fares are NEVER derived from
 * the number of stops: if no verified pair exists the result is "unavailable".
 */
export function getFare(fares: FareTable, fromId: string, toId: string): FareOutcome {
  const pair = fares.pairs.find(
    (p) =>
      p.verificationStatus === 'verified' &&
      Number.isFinite(p.amountInr) &&
      p.amountInr >= 0 &&
      ((p.fromStationId === fromId && p.toStationId === toId) ||
        (p.fromStationId === toId && p.toStationId === fromId)),
  );
  if (!pair) return { status: 'unavailable', message: FARE_UNAVAILABLE_MESSAGE };
  return {
    status: 'available',
    amountInr: pair.amountInr,
    fareType: pair.fareType,
    validFrom: pair.validFrom,
    sourceUrl: pair.sourceUrl,
  };
}
