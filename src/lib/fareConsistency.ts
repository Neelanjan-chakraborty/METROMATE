import type { FarePair } from '../types';
import { findRoute, type Network } from './routing';

export interface ConsistencyIssue {
  fromStationId: string;
  toStationId: string;
  kind: 'no-route' | 'station-count' | 'interchanges';
  expected: number | null;
  gmrc: number | null;
}

/**
 * Cross-checks GMRC's own numbers (station count and interchanges, as returned by its fare
 * calculator) against MetroMate's route graph. A mismatch means the graph, the interchange
 * markers or the captured data deserves a second look; it never changes a fare.
 *
 * GMRC's `station_count` is compared with the number of stations on our route INCLUDING both ends.
 */
export function checkFareConsistency(net: Network, pairs: FarePair[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  for (const p of pairs) {
    const r = findRoute(net, p.fromStationId, p.toStationId);
    if (!r.ok) {
      issues.push({ fromStationId: p.fromStationId, toStationId: p.toStationId, kind: 'no-route', expected: null, gmrc: p.stationCount ?? null });
      continue;
    }
    if (typeof p.stationCount === 'number' && p.stationCount !== r.stationIds.length) {
      issues.push({ fromStationId: p.fromStationId, toStationId: p.toStationId, kind: 'station-count', expected: r.stationIds.length, gmrc: p.stationCount });
    }
    if (typeof p.interchanges === 'number' && p.interchanges !== r.interchanges.length) {
      issues.push({ fromStationId: p.fromStationId, toStationId: p.toStationId, kind: 'interchanges', expected: r.interchanges.length, gmrc: p.interchanges });
    }
  }
  return issues;
}
