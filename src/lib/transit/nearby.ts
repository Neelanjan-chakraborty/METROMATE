import { agenciesOf, routesAtStop, type TransitIndex } from './transitIndex';
import { busStopId, type AgencyId } from './types';

export interface NearbyStop {
  /** `bus:<id>`, usable as a place in the planner. */
  id: string;
  name: string;
  /** Straight-line distance from the (estimated) station pin, metres. */
  m: number;
  /** The stop's own name says "metro". */
  named: boolean;
  agencies: AgencyId[];
  routes: { short: string; agency: AgencyId }[];
}

/**
 * Bus stops within the link radius of a metro station, nearest first, with the routes serving each. A stop
 * with the same name as a nearer one (the other side of the road) is skipped. Distances come from the
 * station's ESTIMATED pin, so they are approximate.
 */
export function nearbyBusStops(ix: TransitIndex, stationId: string, limit = 4): NearbyStop[] {
  const links = ix.stationStops.get(stationId) ?? [];
  const seen = new Set<string>();
  const out: NearbyStop[] = [];
  for (const l of links) {
    const name = ix.data.stops.name[l.stop];
    const key = ix.norm[l.stop];
    if (seen.has(key)) continue;
    seen.add(key);
    const routeSet = new Map<string, { short: string; agency: AgencyId }>();
    for (const r of routesAtStop(ix, l.stop)) {
      const agency = ix.data.agencies[ix.data.routes.agency[r]].id;
      const short = ix.data.routes.short[r];
      routeSet.set(`${agency}|${short}`, { short, agency });
    }
    const order: Record<AgencyId, number> = { AJL: 0, AMTS: 1, GTSL: 2 };
    const routes = [...routeSet.values()].sort((a, b) => order[a.agency] - order[b.agency] || a.short.localeCompare(b.short, undefined, { numeric: true }));
    out.push({ id: busStopId(ix.data.stops.id[l.stop]), name, m: l.m, named: l.named, agencies: agenciesOf(ix.data, l.stop), routes });
    if (out.length >= limit) break;
  }
  return out;
}
