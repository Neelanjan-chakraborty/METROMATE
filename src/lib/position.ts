import type { JourneyProgress, SignalState } from './locator';

export type PositionSource = 'gps' | 'last-seen' | 'checkin' | 'demo';

export interface Position {
  source: PositionSource;
  /** Fractional index along the route. */
  progress: number;
  atStationId: string | null;
  lastStationId: string;
  nextStationId: string | null;
  stopsRemaining: number;
  distanceToNextM: number | null;
  arriving: boolean;
  arrived: boolean;
  approximate: boolean;
}

/** A position known only to the nearest station (manual check-in or demo). */
function atIndex(ids: string[], idx: number, source: PositionSource): Position {
  const i = Math.max(0, Math.min(ids.length - 1, idx));
  const left = ids.length - 1 - i;
  return {
    source,
    progress: i,
    atStationId: ids[i],
    lastStationId: ids[i],
    nextStationId: i + 1 < ids.length ? ids[i + 1] : null,
    stopsRemaining: left,
    distanceToNextM: null,
    arriving: left === 1,
    arrived: left === 0,
    approximate: false,
  };
}

/**
 * Chooses where to say the passenger is along the route:
 *  1. a running demo (clearly labelled elsewhere),
 *  2. live GPS, while the signal is fresh,
 *  3. otherwise the passenger's own check-in,
 *  4. otherwise the last GPS position, labelled "last seen".
 * Returns null when nothing trustworthy is known.
 */
export function resolvePosition(
  routeIds: string[],
  gps: JourneyProgress | null,
  signal: SignalState,
  manualIdx: number | null,
  demoIdx: number | null,
): Position | null {
  if (routeIds.length < 2) return null;
  if (demoIdx !== null) return atIndex(routeIds, demoIdx, 'demo');
  const gpsOk = gps && gps.status === 'tracking' && gps.lastStationId !== null && gps.progress !== null;
  const fromGps = (source: PositionSource): Position | null =>
    gpsOk
      ? {
          source,
          progress: gps.progress!,
          atStationId: gps.atStationId,
          lastStationId: gps.lastStationId!,
          nextStationId: gps.nextStationId,
          stopsRemaining: gps.stopsRemaining!,
          distanceToNextM: gps.distanceToNextM,
          arriving: gps.arriving,
          arrived: gps.arrived,
          approximate: gps.approximate,
        }
      : null;
  if (signal === 'live' || signal === 'stale') {
    const g = fromGps('gps');
    if (g) return g;
  }
  if (manualIdx !== null) return atIndex(routeIds, manualIdx, 'checkin');
  return fromGps('last-seen');
}
