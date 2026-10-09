/**
 * Plain-language status and milestone logic for the live-tracking screen. Pure and testable.
 * Nothing here claims more than the data supports: speed appears only when the phone reports a
 * trustworthy one, and "approaching" / "stopped" are inferred from the passenger's own position.
 */

export type Movement = 'at-station' | 'approaching' | 'moving' | 'stopped' | 'estimated' | 'signal-lost' | 'unknown';

export interface SpeedFix {
  speedMps?: number | null;
  accuracyM: number | null;
  timestamp: number;
}

const SPEED_MAX_AGE_MS = 10_000;
const SPEED_MAX_ACCURACY_M = 40;
const SPEED_MAX_KMH = 130;

/** km/h, or null when the phone's speed is missing, stale, imprecise or implausible. */
export function reliableSpeedKmh(fix: SpeedFix | null, nowMs: number): number | null {
  if (!fix) return null;
  const v = fix.speedMps;
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null;
  if (nowMs - fix.timestamp > SPEED_MAX_AGE_MS) return null;
  if (fix.accuracyM === null || fix.accuracyM > SPEED_MAX_ACCURACY_M) return null;
  const kmh = v * 3.6;
  return kmh > SPEED_MAX_KMH ? null : Math.round(kmh);
}

export interface MovementInput {
  speedKmh: number | null;
  atStationId: string | null;
  arriving: boolean;
  arrived: boolean;
  distanceToNextM: number | null;
  /** 'gps' | 'last-seen' | 'checkin' | 'demo' | 'estimated' */
  source: string;
  signal: 'none' | 'live' | 'stale' | 'lost';
}

export const APPROACH_M = 500;

export function movementState(m: MovementInput): Movement {
  if (m.source === 'estimated') return 'estimated';
  if (m.source === 'gps' || m.source === 'last-seen') {
    if (m.signal === 'lost' || m.source === 'last-seen') return 'signal-lost';
  }
  if (m.arrived || m.atStationId) return m.speedKmh !== null && m.speedKmh >= 8 ? 'moving' : 'at-station';
  if (m.arriving || (m.distanceToNextM !== null && m.distanceToNextM <= APPROACH_M)) return 'approaching';
  if (m.speedKmh !== null) return m.speedKmh >= 2 ? 'moving' : 'stopped';
  return m.source === 'gps' || m.source === 'demo' ? 'moving' : 'unknown';
}

export const MOVEMENT_LABEL: Record<Movement, string> = {
  'at-station': 'At station',
  approaching: 'Approaching',
  moving: 'Moving',
  stopped: 'Stopped',
  estimated: 'Estimated position',
  'signal-lost': 'Signal lost',
  unknown: 'Position only',
};

// ------------------------------------------------------------------ messages

export type Tone = 'ok' | 'info' | 'warn' | 'alert';

export interface StatusInput {
  arrived: boolean;
  movement: Movement;
  nextName: string | null;
  destinationName: string;
  /** The next station is a place to change trains. */
  nextIsInterchange: boolean;
  etaUpdated: boolean;
  behindMin: number | null;
  inTunnel: boolean;
  source: string;
  /** False until some position is known. */
  hasPosition?: boolean;
}

export function statusMessage(i: StatusInput): { text: string; tone: Tone } {
  if (i.arrived) return { text: `You’ve arrived at ${i.destinationName}.`, tone: 'ok' };
  if (i.hasPosition === false) return { text: 'Waiting for your position. Tap “I’m here” on a station to follow by check-in.', tone: 'info' };
  if (i.source === 'demo') return { text: 'Demo ride: simulated, not your location.', tone: 'warn' };
  if (i.movement === 'signal-lost') return { text: 'GPS signal lost. Showing your last position; nothing is guessed.', tone: 'warn' };
  if (i.movement === 'estimated') return { text: 'No GPS underground. This position is an estimate; it will correct when GPS returns.', tone: 'info' };
  if (i.nextIsInterchange && i.nextName) return { text: `Change trains at ${i.nextName}.`, tone: 'info' };
  if (i.etaUpdated) {
    return { text: i.behindMin ? `Your arrival time has been updated (about ${i.behindMin} min later than first estimated).` : 'Your arrival time has been updated.', tone: 'info' };
  }
  if (i.movement === 'approaching' && i.nextName) return { text: `Approaching ${i.nextName}.`, tone: 'ok' };
  if (i.movement === 'at-station') return { text: i.nextName ? `At the station. Next: ${i.nextName}.` : 'At the station.', tone: 'ok' };
  if (i.movement === 'stopped') return { text: 'The train seems to be stopped. Live service information isn’t available in MetroMate.', tone: 'warn' };
  if (i.inTunnel) return { text: 'Underground. Heading for the next station.', tone: 'ok' };
  return { text: 'On your way to the next station.', tone: 'ok' };
}

// ----------------------------------------------------------------- milestones

export type Milestone =
  | { kind: 'passed'; idx: number }
  | { kind: 'halfway' }
  | { kind: 'tunnel-in' }
  | { kind: 'tunnel-out' }
  | { kind: 'interchange'; idx: number }
  | { kind: 'approaching'; idx: number }
  | { kind: 'arrived' };

export interface Snapshot {
  progress: number;
  underground: boolean;
  arriving: boolean;
  arrived: boolean;
}

/** What is worth telling the passenger about between two position snapshots (at most a few). */
export function milestonesBetween(prev: Snapshot | null, cur: Snapshot, ctx: { stations: number; interchangeIdx: ReadonlySet<number> }): Milestone[] {
  const out: Milestone[] = [];
  if (!prev) return out;
  const last = ctx.stations - 1;
  if (cur.arrived && !prev.arrived) out.push({ kind: 'arrived' });
  const prevI = Math.floor(prev.progress + 1e-9);
  const curI = Math.floor(cur.progress + 1e-9);
  if (curI > prevI && curI < last && curI > 0) out.push({ kind: 'passed', idx: curI });
  const half = last / 2;
  if (last >= 4 && prev.progress < half && cur.progress >= half && !cur.arrived) out.push({ kind: 'halfway' });
  if (cur.underground && !prev.underground) out.push({ kind: 'tunnel-in' });
  if (!cur.underground && prev.underground) out.push({ kind: 'tunnel-out' });
  const prevNext = Math.floor(prev.progress + 1e-9) + 1;
  const curNext = curI + 1;
  if (curNext !== prevNext && ctx.interchangeIdx.has(curNext)) out.push({ kind: 'interchange', idx: curNext });
  if (cur.arriving && !prev.arriving && !cur.arrived) out.push({ kind: 'approaching', idx: last });
  return out.slice(0, 3);
}
