import type { TransitIndex } from './transitIndex';
import type { AgencyId } from './types';

export interface Departure {
  /** Scheduled time at this stop, minutes since the service day began (may be negative/over 1440 only for carried-over trips). */
  time: number;
  route: number;
  pattern: number;
  headsign: string;
  short: string;
  agency: AgencyId;
}

/**
 * The next scheduled buses leaving `stop` at or after `nowMin` (minutes since midnight), soonest first. Trips
 * that began the previous service day and are still running (times past 24:00) are included. A pattern's last
 * stop is skipped (buses only arrive there). Scheduled times, not live.
 */
export function departuresAt(ix: TransitIndex, stop: number, nowMin: number, n = 12): Departure[] {
  const d = ix.data;
  const out: Departure[] = [];
  const lowerBound = (a: number[], x: number) => {
    let lo = 0;
    let hi = a.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (a[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  for (let e = ix.psOff[stop]; e < ix.psOff[stop + 1]; e++) {
    const p = ix.psPattern[e];
    const pos = ix.psPos[e];
    const stops = d.patterns.stops[p];
    if (pos === stops.length - 1) continue;
    const startT = d.patterns.startT[p];
    const startV = d.patterns.startV[p];
    const vecs = d.patterns.vectors[p];
    let maxOff = 0;
    for (const v of vecs) maxOff = Math.max(maxOff, v[pos]);
    const route = d.patterns.route[p];
    const base = { route, pattern: p, headsign: d.stops.name[stops[stops.length - 1]], short: d.routes.short[route], agency: d.agencies[d.routes.agency[route]].id };
    // this service day, then the tail of the previous one (starts at or after 24:00 minus the offset)
    for (const shift of [0, -1440]) {
      for (let i = lowerBound(startT, nowMin - shift - maxOff); i < startT.length; i++) {
        const t = startT[i] + vecs[startV[i]][pos] + shift;
        if (t >= nowMin) out.push({ ...base, time: t });
        if (startT[i] + shift > nowMin + 24 * 60) break;
        if (out.length > 4000) break;
      }
    }
  }
  out.sort((a, b) => a.time - b.time || a.short.localeCompare(b.short, undefined, { numeric: true }));
  // the same bus can appear through two patterns that share a stop sequence; keep one per route + time
  const seen = new Set<string>();
  const unique: Departure[] = [];
  for (const x of out) {
    const k = `${x.route}|${x.time}`;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(x);
    if (unique.length >= n) break;
  }
  return unique;
}

export interface DepartureGroup {
  route: number;
  short: string;
  agency: AgencyId;
  headsign: string;
  /** Next scheduled times, soonest first. */
  times: number[];
}

/** Departures grouped by route and headsign, ordered by their first time: the shape of a stop's departure board. */
export function groupDepartures(deps: Departure[]): DepartureGroup[] {
  const groups = new Map<string, DepartureGroup>();
  for (const x of deps) {
    const k = `${x.route}|${x.headsign}`;
    const g = groups.get(k);
    if (g) g.times.push(x.time);
    else groups.set(k, { route: x.route, short: x.short, agency: x.agency, headsign: x.headsign, times: [x.time] });
  }
  return [...groups.values()];
}
