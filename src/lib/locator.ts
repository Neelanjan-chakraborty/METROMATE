import type { Connection, Station } from '../types';
import { haversineM, projectOnSegment } from './geo';

/**
 * On-device "where am I on the metro" engine. Pure functions only: it takes a GPS-style
 * fix plus known station coordinates and reports a position on the network. It never
 * invents a position: with no usable fix it says so.
 *
 * What it can and cannot know:
 *  - It knows only what the phone's location provider reports (a point and an accuracy radius).
 *  - It cannot see which cell tower or satellite was used, so fixes are classified by accuracy.
 *  - It has no live train feed and no verified per-station travel times, so it never
 *    extrapolates a position through a tunnel.
 */

export interface Fix {
  lat: number;
  lon: number;
  /** Horizontal accuracy radius in metres, if the provider reports one. */
  accuracyM: number | null;
  /** Ground speed in metres per second, when the provider reports one (null/absent otherwise). */
  speedMps?: number | null;
  /** Milliseconds since epoch. */
  timestamp: number;
  mocked?: boolean;
}

export interface StationPoint {
  id: string;
  lat: number;
  lon: number;
  source: 'dataset' | 'recorded';
  /** Estimated accuracy of this point itself, if known. */
  accuracyM: number | null;
}

export interface Link {
  fromId: string;
  toId: string;
}

/** Station coordinates are map pins (unofficial), so allow generous slack around them. */
export const AT_STATION_M = 200;
export const LINE_TOLERANCE_M = 400;
/** Fixes worse than this say little about which station you are near. */
export const MAX_USABLE_ACCURACY_M = 2500;
/** A fix must be at least this good to claim "at station". */
export const AT_STATION_MAX_ACCURACY_M = 300;
export const ARRIVING_M = 600;
export const LIVE_FIX_MS = 15_000;
export const LOST_FIX_MS = 45_000;
/** Station-recording fixes must be at least this accurate. */
export const RECORD_MAX_ACCURACY_M = 50;

// ---------------------------------------------------------------- accuracy

export type AccuracyClass = 'precise' | 'good' | 'coarse' | 'poor' | 'unknown';

/**
 * Classifies by accuracy radius. This is a heuristic: a few metres almost always means
 * GPS, hundreds of metres to a few kilometres is typical of Wi-Fi/cell-assisted location.
 */
export function classifyAccuracy(accuracyM: number | null): AccuracyClass {
  if (accuracyM === null || !Number.isFinite(accuracyM) || accuracyM < 0) return 'unknown';
  if (accuracyM <= 30) return 'precise';
  if (accuracyM <= 150) return 'good';
  if (accuracyM <= MAX_USABLE_ACCURACY_M) return 'coarse';
  return 'poor';
}

export const ACCURACY_LABEL: Record<AccuracyClass, string> = {
  precise: 'GPS-class accuracy',
  good: 'Good accuracy',
  coarse: 'Approximate (network-assisted)',
  poor: 'Too inaccurate to use',
  unknown: 'Accuracy unknown',
};

// ------------------------------------------------------------------ signal

export type SignalState = 'none' | 'live' | 'stale' | 'lost';

export function signalState(nowMs: number, lastFixMs: number | null): SignalState {
  if (lastFixMs === null) return 'none';
  const age = nowMs - lastFixMs;
  if (age <= LIVE_FIX_MS) return 'live';
  if (age <= LOST_FIX_MS) return 'stale';
  return 'lost';
}

// ------------------------------------------------------- station points

/**
 * Chooses the best known coordinates per station. Verified dataset coordinates win;
 * otherwise a position recorded on this phone (averaged GPS fixes) is preferred over an
 * estimated dataset pin when it is more precise.
 */
export function buildStationPoints(
  stations: Pick<Station, 'id' | 'latitude' | 'longitude' | 'coordinateStatus'>[],
  recorded: { stationId: string; lat: number; lon: number; accuracyM: number }[],
): Map<string, StationPoint> {
  const rec = new Map(recorded.map((r) => [r.stationId, r]));
  const out = new Map<string, StationPoint>();
  for (const s of stations) {
    const r = rec.get(s.id);
    const hasDataset = s.latitude !== null && s.longitude !== null;
    if (hasDataset && s.coordinateStatus === 'verified') {
      out.set(s.id, { id: s.id, lat: s.latitude!, lon: s.longitude!, source: 'dataset', accuracyM: null });
    } else if (r && r.accuracyM <= RECORD_MAX_ACCURACY_M) {
      out.set(s.id, { id: s.id, lat: r.lat, lon: r.lon, source: 'recorded', accuracyM: r.accuracyM });
    } else if (hasDataset) {
      out.set(s.id, { id: s.id, lat: s.latitude!, lon: s.longitude!, source: 'dataset', accuracyM: null });
    } else if (r) {
      out.set(s.id, { id: s.id, lat: r.lat, lon: r.lon, source: 'recorded', accuracyM: r.accuracyM });
    }
  }
  return out;
}

/** One undirected link per adjacent station pair. */
export function buildLinks(connections: Pick<Connection, 'fromStationId' | 'toStationId'>[]): Link[] {
  const seen = new Set<string>();
  const out: Link[] = [];
  for (const c of connections) {
    const [a, b] = c.fromStationId < c.toStationId ? [c.fromStationId, c.toStationId] : [c.toStationId, c.fromStationId];
    const key = `${a}|${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ fromId: a, toId: b });
  }
  return out;
}

/** True when a link touches an underground station, i.e. GPS is expected to drop out. */
export function isUndergroundLink(a: Pick<Station, 'stationType'> | undefined, b: Pick<Station, 'stationType'> | undefined): boolean {
  return a?.stationType === 'underground' || b?.stationType === 'underground';
}

// ----------------------------------------------------------------- locate

export type LocateResult =
  | { kind: 'no-reference' }
  | { kind: 'unreliable'; reason: 'accuracy' | 'invalid' }
  | { kind: 'at-station'; stationId: string; distanceM: number; approximate: boolean }
  | { kind: 'near-station'; stationId: string; distanceM: number; approximate: boolean }
  | { kind: 'between'; fromId: string; toId: string; fraction: number; offLineM: number; approximate: boolean }
  | { kind: 'off-network'; nearestId: string; distanceM: number };

const isFiniteFix = (f: Fix) => Number.isFinite(f.lat) && Number.isFinite(f.lon) && Math.abs(f.lat) <= 90 && Math.abs(f.lon) <= 180;

export function locate(fix: Fix, points: Map<string, StationPoint>, links: Link[]): LocateResult {
  if (!isFiniteFix(fix)) return { kind: 'unreliable', reason: 'invalid' };
  if (points.size === 0) return { kind: 'no-reference' };
  const accuracy = fix.accuracyM;
  if (accuracy !== null && accuracy > MAX_USABLE_ACCURACY_M) return { kind: 'unreliable', reason: 'accuracy' };

  let nearest: { id: string; d: number } | null = null;
  for (const p of points.values()) {
    const d = haversineM(fix, p);
    if (!nearest || d < nearest.d) nearest = { id: p.id, d };
  }
  if (!nearest) return { kind: 'no-reference' };
  const approximate = accuracy === null || accuracy > 150;
  const atRadius = Math.max(AT_STATION_M, Math.min(accuracy ?? 0, AT_STATION_MAX_ACCURACY_M));
  const canClaimAt = accuracy === null || accuracy <= AT_STATION_MAX_ACCURACY_M;
  if (nearest.d <= atRadius) {
    // A coarse fix landing on a station only supports "near", not "at".
    return canClaimAt
      ? { kind: 'at-station', stationId: nearest.id, distanceM: Math.round(nearest.d), approximate }
      : { kind: 'near-station', stationId: nearest.id, distanceM: Math.round(nearest.d), approximate: true };
  }

  // Which line segment (between two stations with known coordinates) are we closest to?
  let best: { link: Link; t: number; d: number } | null = null;
  for (const l of links) {
    const a = points.get(l.fromId);
    const b = points.get(l.toId);
    if (!a || !b) continue;
    const proj = projectOnSegment(fix, a, b);
    if (!best || proj.distanceM < best.d) best = { link: l, t: proj.t, d: proj.distanceM };
  }
  const tolerance = LINE_TOLERANCE_M + (accuracy ?? 0);
  if (best && best.d <= tolerance) {
    return {
      kind: 'between',
      fromId: best.link.fromId,
      toId: best.link.toId,
      fraction: best.t,
      offLineM: Math.round(best.d),
      approximate,
    };
  }
  if (!best) {
    // Partial coverage: no segment has both endpoints known.
    if (nearest.d <= 2000 + (accuracy ?? 0)) return { kind: 'near-station', stationId: nearest.id, distanceM: Math.round(nearest.d), approximate };
  }
  return { kind: 'off-network', nearestId: nearest.id, distanceM: Math.round(nearest.d) };
}

// ----------------------------------------------------------- journey tracking

export interface JourneyProgress {
  status: 'tracking' | 'off-route' | 'no-reference' | 'unreliable';
  /** Fractional index along the route (0 = origin, n-1 = destination), or null. */
  progress: number | null;
  atStationId: string | null;
  /** Last station passed (or the current one). */
  lastStationId: string | null;
  nextStationId: string | null;
  /** Stops still to travel, counting the next station and the destination. */
  stopsRemaining: number | null;
  distanceToNextM: number | null;
  offRouteM: number | null;
  arriving: boolean;
  arrived: boolean;
  approximate: boolean;
}

const EMPTY: JourneyProgress = {
  status: 'no-reference',
  progress: null,
  atStationId: null,
  lastStationId: null,
  nextStationId: null,
  stopsRemaining: null,
  distanceToNextM: null,
  offRouteM: null,
  arriving: false,
  arrived: false,
  approximate: false,
};

/**
 * Where is the passenger along a planned route? Uses every route station that has known
 * coordinates, so partial coverage degrades gracefully. A fix far from the route is
 * reported as off-route and no progress is claimed.
 */
export function trackJourney(fix: Fix, routeStationIds: string[], points: Map<string, StationPoint>): JourneyProgress {
  if (!isFiniteFix(fix)) return { ...EMPTY, status: 'unreliable' };
  const n = routeStationIds.length;
  const known = routeStationIds.map((id, idx) => ({ id, idx, p: points.get(id) })).filter((k): k is { id: string; idx: number; p: StationPoint } => !!k.p);
  if (n < 2 || known.length === 0) return EMPTY;
  const accuracy = fix.accuracyM;
  if (accuracy !== null && accuracy > MAX_USABLE_ACCURACY_M) return { ...EMPTY, status: 'unreliable' };
  const approximate = accuracy === null || accuracy > 150;

  // Closest route station.
  let nearest = known[0];
  let nearestD = haversineM(fix, known[0].p);
  for (const k of known) {
    const d = haversineM(fix, k.p);
    if (d < nearestD) {
      nearest = k;
      nearestD = d;
    }
  }
  const atRadius = Math.max(AT_STATION_M, Math.min(accuracy ?? 0, AT_STATION_MAX_ACCURACY_M));
  const canClaimAt = accuracy === null || accuracy <= AT_STATION_MAX_ACCURACY_M;
  const tolerance = LINE_TOLERANCE_M + (accuracy ?? 0);

  let progress: number | null = null;
  let offRouteM: number | null = null;
  let atIdx: number | null = null;

  if (nearestD <= atRadius && canClaimAt) {
    progress = nearest.idx;
    atIdx = nearest.idx;
    offRouteM = Math.round(nearestD);
  } else if (known.length >= 2) {
    let best: { a: (typeof known)[number]; b: (typeof known)[number]; t: number; d: number } | null = null;
    for (let i = 0; i < known.length - 1; i++) {
      const proj = projectOnSegment(fix, known[i].p, known[i + 1].p);
      if (!best || proj.distanceM < best.d) best = { a: known[i], b: known[i + 1], t: proj.t, d: proj.distanceM };
    }
    if (best) {
      offRouteM = Math.round(best.d);
      if (best.d <= tolerance) progress = best.a.idx + best.t * (best.b.idx - best.a.idx);
    }
  } else {
    offRouteM = Math.round(nearestD);
  }

  if (progress === null) {
    return { ...EMPTY, status: 'off-route', offRouteM, approximate };
  }

  const floorIdx = Math.min(n - 1, Math.floor(progress + 1e-9));
  const isAt = atIdx !== null || Math.abs(progress - Math.round(progress)) < 1e-6;
  const lastIdx = isAt ? Math.round(progress) : floorIdx;
  const nextIdx = isAt ? (lastIdx + 1 < n ? lastIdx + 1 : null) : Math.min(n - 1, floorIdx + 1);
  const nextId = nextIdx === null ? null : routeStationIds[nextIdx];
  const nextPoint = nextId ? points.get(nextId) : undefined;
  const distanceToNextM = nextPoint ? Math.round(haversineM(fix, nextPoint)) : null;
  const dest = n - 1;
  const arrived = isAt && lastIdx === dest;
  const arriving =
    !arrived &&
    nextIdx === dest &&
    (distanceToNextM !== null ? distanceToNextM <= ARRIVING_M : progress - floorIdx >= 0.75);

  return {
    status: 'tracking',
    progress,
    atStationId: isAt ? routeStationIds[lastIdx] : null,
    lastStationId: routeStationIds[lastIdx],
    nextStationId: nextId,
    stopsRemaining: n - 1 - lastIdx,
    distanceToNextM,
    offRouteM,
    arriving,
    arrived,
    approximate,
  };
}

/** True when the last few progress values show steady movement back towards the origin. */
export function isHeadingAway(history: number[], minDrop = 0.4): boolean {
  if (history.length < 3) return false;
  const h = history.slice(-3);
  return h[0] - h[1] > 0.05 && h[1] - h[2] > 0.05 && h[0] - h[2] >= minDrop;
}

// -------------------------------------------------- recording station positions

export interface RecordedAccumulator {
  lat: number;
  lon: number;
  /** Sum of 1/accuracy² weights. */
  weight: number;
  samples: number;
}

/** Inverse-variance weighted average of fixes taken at a station. */
export function mergeStationFix(prev: RecordedAccumulator | null, fix: Pick<Fix, 'lat' | 'lon' | 'accuracyM'>): RecordedAccumulator | null {
  if (!isFiniteFix({ ...fix, timestamp: 0 })) return null;
  if (fix.accuracyM === null || !Number.isFinite(fix.accuracyM) || fix.accuracyM > RECORD_MAX_ACCURACY_M) return null;
  const acc = Math.max(fix.accuracyM, 3);
  const w = 1 / (acc * acc);
  if (!prev) return { lat: fix.lat, lon: fix.lon, weight: w, samples: 1 };
  const total = prev.weight + w;
  return {
    lat: (prev.lat * prev.weight + fix.lat * w) / total,
    lon: (prev.lon * prev.weight + fix.lon * w) / total,
    weight: total,
    samples: prev.samples + 1,
  };
}

/** Standard-error style estimate of a recorded position, in metres. */
export function accumulatorAccuracyM(acc: Pick<RecordedAccumulator, 'weight'>): number {
  return acc.weight > 0 ? 1 / Math.sqrt(acc.weight) : Infinity;
}
