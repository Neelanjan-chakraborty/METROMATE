import type { TimetableLine } from '../types';
import { haversineM, type LatLon } from './geo';

/**
 * Journey-time estimates for the live-tracking screen.
 *
 * MetroMate has NO live train feed and no verified per-station travel times, so nothing here is a
 * live prediction. The estimate is built from what is published:
 *  - GMRC's end-to-end time for each line (train-information page), spread over that line's hops in
 *    proportion to the distance between the (estimated) station pins; or
 *  - GMRC's own calculator time for the exact pair, when one has been imported, spread the same way.
 * It is then nudged by how fast the passenger is actually progressing (their own GPS history), with
 * smoothing so it doesn't jump, and it is always labelled as an estimate. Time to change trains is not
 * included because no verified figure exists.
 */

export type EtaBasis = 'published-line' | 'calculator';

export interface HopTimes {
  /** Estimated in-train minutes for each hop, including time stopped at stations. */
  minutes: number[];
  total: number;
  basis: EtaBasis;
}

/**
 * Minutes per hop from the published line figures. Returns null if any hop is not on a published
 * line or a needed station position is missing (no time is invented).
 */
export function hopMinutes(
  routeIds: string[],
  coordOf: (id: string) => LatLon | null | undefined,
  lines: TimetableLine[],
  calculatorMinutes?: number | null,
): HopTimes | null {
  if (routeIds.length < 2) return null;
  const lineLength = new Map<string, number>();
  const distance = (a: string, b: string): number | null => {
    const pa = coordOf(a);
    const pb = coordOf(b);
    return pa && pb ? haversineM(pa, pb) : null;
  };
  for (const line of lines) {
    let sum = 0;
    let ok = true;
    for (let i = 0; i < line.stationIds.length - 1; i++) {
      const d = distance(line.stationIds[i], line.stationIds[i + 1]);
      if (d === null) {
        ok = false;
        break;
      }
      sum += d;
    }
    if (ok && sum > 0) lineLength.set(line.id, sum);
  }

  const minutes: number[] = [];
  for (let i = 0; i < routeIds.length - 1; i++) {
    const a = routeIds[i];
    const b = routeIds[i + 1];
    let found: number | null = null;
    for (const line of lines) {
      const ia = line.stationIds.indexOf(a);
      const ib = line.stationIds.indexOf(b);
      const total = lineLength.get(line.id);
      if (ia < 0 || ib < 0 || Math.abs(ia - ib) !== 1 || !total) continue;
      const d = distance(a, b);
      if (d === null) continue;
      found = (line.endToEndMinutes * d) / total;
      break;
    }
    if (found === null || !Number.isFinite(found) || found <= 0) return null;
    minutes.push(found);
  }
  let total = minutes.reduce((s, m) => s + m, 0);
  let basis: EtaBasis = 'published-line';
  if (typeof calculatorMinutes === 'number' && Number.isFinite(calculatorMinutes) && calculatorMinutes > 0 && total > 0) {
    const k = calculatorMinutes / total;
    for (let i = 0; i < minutes.length; i++) minutes[i] *= k;
    total = calculatorMinutes;
    basis = 'calculator';
  }
  return { minutes, total, basis };
}

/** Expected minutes to travel from fractional index `from` to `to` (from <= to). */
export function expectedMinutes(hop: number[], from: number, to: number): number {
  const n = hop.length; // hops; stations = n + 1
  const clamp = (p: number) => Math.max(0, Math.min(n, p));
  const a = clamp(from);
  const b = clamp(to);
  if (b <= a) return 0;
  let m = 0;
  for (let i = Math.floor(a); i < Math.min(n, Math.ceil(b)); i++) {
    const lo = Math.max(a, i);
    const hi = Math.min(b, i + 1);
    if (hi > lo) m += hop[i] * (hi - lo);
  }
  return m;
}

// ----------------------------------------------------------------- live state

export interface EtaState {
  /** The smoothed arrival estimate, epoch ms. */
  arrivalMs: number | null;
  /** The estimate when the passenger started moving; used to say how far it has moved since. */
  firstArrivalMs: number | null;
  /** The estimate last announced as "updated". */
  announcedMs: number | null;
  startProgress: number | null;
  boardedProgress: number | null;
  boardedAtMs: number | null;
  /** Multiplier applied to the published times (1 = as published). */
  pace: number;
  lastNowMs: number | null;
}

export const INITIAL_ETA: EtaState = {
  arrivalMs: null,
  firstArrivalMs: null,
  announcedMs: null,
  startProgress: null,
  boardedProgress: null,
  boardedAtMs: null,
  pace: 1,
  lastNowMs: null,
};

export interface EtaInput {
  nowMs: number;
  /** Fractional station index, or null when no position is known. */
  progress: number | null;
  hop: HopTimes | null;
  /** Only GPS-derived positions may adjust the pace; demo / check-in positions must not. */
  fromGps: boolean;
}

export interface EtaOutput {
  state: EtaState;
  /** Whole minutes left, or null when unavailable. */
  minutes: number | null;
  arrivalMs: number | null;
  /** 'estimate' = published figures; 'adjusted' = also scaled by the passenger's own pace. */
  kind: 'estimate' | 'adjusted' | 'unavailable';
  /** True the moment the estimate has moved enough to tell the passenger. */
  updated: boolean;
  /** Minutes later than first estimated (positive), once it is at least 3 and the passenger is moving. */
  behindMin: number | null;
}

const DEAD_BAND_MS = 45_000;
const ALPHA = 0.25;
const ANNOUNCE_MS = 3 * 60_000;
const MOVE_START = 0.15; // hops of movement before we treat the passenger as aboard and moving
const MIN_COVERED_MIN = 3;
const PACE_MIN = 0.8;
const PACE_MAX = 1.6;

/** One update step. Pure: pass the previous state back in. */
export function stepEta(prev: EtaState, input: EtaInput): EtaOutput {
  const { nowMs, progress, hop, fromGps } = input;
  if (!hop || progress === null) {
    return { state: prev, minutes: null, arrivalMs: null, kind: 'unavailable', updated: false, behindMin: null };
  }
  const s: EtaState = { ...prev, lastNowMs: nowMs };
  if (s.startProgress === null) s.startProgress = progress;

  // Boarded and moving: only GPS positions count.
  if (fromGps && s.boardedProgress === null && progress - s.startProgress >= MOVE_START) {
    s.boardedProgress = s.startProgress;
    s.boardedAtMs = nowMs - expectedMinutes(hop.minutes, s.startProgress, progress) * 60_000; // assume it left on time
  }
  let kind: EtaOutput['kind'] = 'estimate';
  if (fromGps && s.boardedProgress !== null && s.boardedAtMs !== null) {
    const covered = expectedMinutes(hop.minutes, s.boardedProgress, progress);
    const elapsed = (nowMs - s.boardedAtMs) / 60_000;
    if (covered >= MIN_COVERED_MIN && elapsed > 0) {
      const ratio = Math.max(PACE_MIN, Math.min(PACE_MAX, elapsed / covered));
      const weight = Math.min(1, covered / 10);
      const target = 1 + (ratio - 1) * weight;
      s.pace = s.pace + 0.3 * (target - s.pace);
      if (Math.abs(s.pace - 1) >= 0.05) kind = 'adjusted';
    }
  }

  const remaining = expectedMinutes(hop.minutes, progress, hop.minutes.length) * s.pace;
  const raw = nowMs + remaining * 60_000;
  let arrival: number;
  if (s.arrivalMs === null) arrival = raw;
  else if (Math.abs(raw - s.arrivalMs) < DEAD_BAND_MS) arrival = s.arrivalMs;
  else arrival = s.arrivalMs + ALPHA * (raw - s.arrivalMs);
  // The estimate can't be in the past, and can't stay put while the passenger is closing in.
  arrival = Math.max(arrival, nowMs + 30_000 * (remaining > 0.5 ? 1 : 0));
  if (remaining < 0.25) arrival = nowMs;

  s.arrivalMs = arrival;
  if (s.firstArrivalMs === null && s.boardedProgress !== null) s.firstArrivalMs = arrival;
  let updated = false;
  if (s.announcedMs === null) s.announcedMs = arrival;
  else if (Math.abs(arrival - s.announcedMs) >= ANNOUNCE_MS && s.firstArrivalMs !== null) {
    updated = true;
    s.announcedMs = arrival;
  }
  const behind = s.firstArrivalMs !== null ? (arrival - s.firstArrivalMs) / 60_000 : null;

  return {
    state: s,
    minutes: Math.max(0, Math.round((arrival - nowMs) / 60_000)),
    arrivalMs: arrival,
    kind,
    updated,
    behindMin: behind !== null && behind >= 3 ? Math.round(behind) : null,
  };
}

/** Minutes until a given fractional station index, using the same (unscaled) hop table. */
export function minutesToProgress(hop: HopTimes, from: number, to: number, pace = 1): number {
  return Math.max(0, expectedMinutes(hop.minutes, from, to) * pace);
}

// ----------------------------------------------------------- tunnel estimate

/**
 * While GPS is missing in an underground section, estimate how far the train has got using the
 * published pace. Returns null when it does not apply (the last known position was not in or at
 * the entrance of a tunnel). The estimate never passes the point where GPS should come back
 * (the portal before the next elevated station) and stops after `maxMinutes`.
 */
export function estimateThroughTunnel(opts: {
  lastProgress: number;
  lastAtMs: number;
  nowMs: number;
  hop: HopTimes;
  /** Underground flag for each station of the route. */
  underground: boolean[];
  pace?: number;
  maxMinutes?: number;
}): { progress: number; estimated: true } | null {
  const { lastProgress, lastAtMs, nowMs, hop, underground } = opts;
  const pace = opts.pace ?? 1;
  const n = underground.length;
  const i0 = Math.min(n - 2, Math.floor(lastProgress));
  const t0 = lastProgress - i0;
  // Applies only if the last known position was itself below ground: inside a tunnel hop, in the
  // underground half of a portal hop (portals are placed at the hop's midpoint), or at an underground
  // station. A surface position that merely lost GPS is not extrapolated.
  const uA = underground[i0];
  const uB = underground[i0 + 1];
  const inTunnel = (uA && uB) || (uA && t0 <= 0.5) || (uB && t0 >= 0.5);
  if (!inTunnel || n < 2) return null;
  const elapsed = Math.max(0, (nowMs - lastAtMs) / 60_000);
  if (elapsed > (opts.maxMinutes ?? 25)) return null;

  // GPS should return at the portal before the first elevated station after the tunnel.
  let capIdx = n - 1;
  for (let k = Math.ceil(lastProgress + 1e-9); k < n; k++) {
    if (!underground[k]) {
      capIdx = k;
      break;
    }
  }
  const cap = capIdx - 0.5 > lastProgress ? Math.min(n - 1, capIdx - 0.5) : lastProgress;

  let remaining = elapsed / pace;
  let p = lastProgress;
  let i = i0;
  let t = t0;
  while (remaining > 0 && p < cap - 1e-9 && i < n - 1) {
    const hopLeft = hop.minutes[i] * (1 - t);
    if (remaining < hopLeft) {
      p = i + t + remaining / hop.minutes[i];
      remaining = 0;
    } else {
      remaining -= hopLeft;
      i += 1;
      t = 0;
      p = i;
    }
  }
  return { progress: Math.min(p, cap), estimated: true };
}
