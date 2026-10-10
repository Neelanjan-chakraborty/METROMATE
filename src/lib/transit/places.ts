import type { Landmark, Station } from '../../types';
import { normalize, searchStations } from '../search';
import { agenciesOf, routesAtStop, type TransitIndex } from './transitIndex';
import { busStopId, gtfsStopId, isBusId, type AgencyId } from './types';

/** A start or end of a journey: a metro station or a bus stop. */
export interface Place {
  /** Metro station id, or `bus:<gtfs stop id>`. */
  id: string;
  kind: 'station' | 'stop';
  name: string;
  lat: number;
  lon: number;
  agencies: AgencyId[];
}

export type PlaceHit =
  | { kind: 'station'; station: Station; matchedOn: 'name' | 'alias' | 'landmark' | 'all'; matchedText: string; score: number }
  | { kind: 'stop'; id: string; stop: number; name: string; agencies: AgencyId[]; routes: number; score: number };

export type PlaceScope = 'all' | 'metro' | 'bus';

/** Resolves an id from the URL, favourites or recents. Null if it is unknown (e.g. bus data not loaded yet). */
export function resolvePlace(id: string | null | undefined, stations: Map<string, Station>, points: Map<string, { lat: number; lon: number }>, transit: TransitIndex | null): Place | null {
  if (!id) return null;
  if (isBusId(id)) {
    if (!transit) return null;
    const i = transit.stopByGtfs.get(gtfsStopId(id));
    if (i === undefined) return null;
    return { id, kind: 'stop', name: transit.data.stops.name[i], lat: transit.data.stops.lat[i], lon: transit.data.stops.lon[i], agencies: agenciesOf(transit.data, i) };
  }
  const s = stations.get(id);
  if (!s) return null;
  const p = points.get(id) ?? (s.latitude !== null && s.longitude !== null ? { lat: s.latitude, lon: s.longitude } : null);
  if (!p) return null;
  return { id, kind: 'station', name: s.name, lat: p.lat, lon: p.lon, agencies: [] };
}

/** Name for a stored id even when the bus data is not loaded: stations by id, stops only if loaded. */
export function placeName(id: string, stations: Map<string, Station>, transit: TransitIndex | null): string | null {
  if (isBusId(id)) {
    if (!transit) return null;
    const i = transit.stopByGtfs.get(gtfsStopId(id));
    return i === undefined ? null : transit.data.stops.name[i];
  }
  return stations.get(id)?.name ?? null;
}

/**
 * Bus stop search over the precomputed normalised names. An empty query returns nothing (3,200 stops are
 * not a useful list). Stops with the same name within 300 m (the two sides of a road) are shown once,
 * as the one served by the most routes.
 */
export function searchStops(ix: TransitIndex, query: string, limit = 30): Extract<PlaceHit, { kind: 'stop' }>[] {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(' ');
  const scored: { stop: number; score: number }[] = [];
  for (let i = 0; i < ix.norm.length; i++) {
    const name = ix.norm[i];
    if (!tokens.every((t) => name.includes(t))) continue;
    let score = 45;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.split(' ').some((w) => w.startsWith(tokens[0]))) score = 65;
    scored.push({ stop: i, score: score - Math.min(10, name.length / 10) });
  }
  scored.sort((a, b) => b.score - a.score || ix.data.stops.name[a.stop].localeCompare(ix.data.stops.name[b.stop]));
  const out: Extract<PlaceHit, { kind: 'stop' }>[] = [];
  const kept: number[] = [];
  const routeCount = new Map<number, number>();
  const rc = (s: number) => routeCount.get(s) ?? routeCount.set(s, routesAtStop(ix, s).length).get(s)!;
  for (const c of scored) {
    if (out.length >= limit) break;
    const near = kept.findIndex((k) => ix.norm[k] === ix.norm[c.stop] && approxM(ix, k, c.stop) <= 300);
    if (near >= 0) {
      // keep whichever of the pair has more routes
      if (rc(c.stop) > rc(kept[near])) {
        kept[near] = c.stop;
        out[near] = hit(ix, c.stop, c.score, rc(c.stop));
      }
      continue;
    }
    kept.push(c.stop);
    out.push(hit(ix, c.stop, c.score, rc(c.stop)));
  }
  return out;
}

function hit(ix: TransitIndex, stop: number, score: number, routes: number) {
  return { kind: 'stop' as const, id: busStopId(ix.data.stops.id[stop]), stop, name: ix.data.stops.name[stop], agencies: agenciesOf(ix.data, stop), routes, score };
}

function approxM(ix: TransitIndex, a: number, b: number): number {
  const dLat = (ix.data.stops.lat[a] - ix.data.stops.lat[b]) * 111_195;
  const dLon = (ix.data.stops.lon[a] - ix.data.stops.lon[b]) * 111_195 * Math.cos((ix.data.stops.lat[a] * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

/**
 * Stations (names, aliases, landmarks) and bus stops in one ranked list. `transit` may be null while the
 * bus data is loading; then only stations are returned. Metro wins ties.
 */
export function searchPlaces(stations: Station[], landmarks: Landmark[], transit: TransitIndex | null, query: string, scope: PlaceScope = 'all', limit = 40): PlaceHit[] {
  const out: PlaceHit[] = [];
  if (scope !== 'bus') {
    for (const h of searchStations(stations, landmarks, query, limit)) out.push({ kind: 'station', station: h.station, matchedOn: h.matchedOn, matchedText: h.matchedText, score: h.score + 1 });
  }
  if (scope !== 'metro' && transit) out.push(...searchStops(transit, query, limit));
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}
