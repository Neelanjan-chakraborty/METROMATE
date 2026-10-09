import type { JourneyTimeOutcome, RouteResult, ServiceInfo, TimetableMetadata } from '../types';
import type { Network } from './routing';

export const JOURNEY_TIME_UNAVAILABLE =
  'Journey time estimate unavailable: GMRC publishes line end-to-end times but no per-station travel times, so none is calculated.';

/**
 * Sums verified per-connection travel times. Returns "unavailable" unless
 * EVERY connection on the route has a non-negative time. The result is an
 * estimate of in-train time only (no walking, waiting or interchange buffer).
 */
export function getJourneyTime(net: Network, route: RouteResult): JourneyTimeOutcome {
  let total = 0;
  for (let i = 0; i < route.stationIds.length - 1; i++) {
    const from = route.stationIds[i];
    const to = route.stationIds[i + 1];
    const edge = (net.edges.get(from) ?? []).find((e) => e.toStationId === to);
    const minutes = edge?.estimatedTravelMinutes;
    if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0) {
      return { status: 'unavailable', message: JOURNEY_TIME_UNAVAILABLE };
    }
    total += minutes;
  }
  return {
    status: 'estimated',
    minutes: total,
    note: 'Estimated in-train time from published per-station times. Excludes waiting, walking and interchange time. Not a live prediction.',
  };
}

/**
 * Published (static) service information for each timetable line that the
 * route actually uses. A line is used when both ends of a route hop belong to it.
 */
export function getServiceInfo(timetable: TimetableMetadata, route: RouteResult): ServiceInfo[] {
  const result: ServiceInfo[] = [];
  for (const line of timetable.lines) {
    const set = new Set(line.stationIds);
    const used = new Set<string>();
    for (let i = 0; i < route.stationIds.length - 1; i++) {
      const a = route.stationIds[i];
      const b = route.stationIds[i + 1];
      if (set.has(a) && set.has(b)) {
        used.add(a);
        used.add(b);
      }
    }
    if (used.size > 0) {
      result.push({ line, routeStationIds: route.stationIds.filter((s) => used.has(s)) });
    }
  }
  return result;
}
