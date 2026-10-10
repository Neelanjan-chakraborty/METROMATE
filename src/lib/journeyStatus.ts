/**
 * Plain-language status and milestone logic for the live-tracking screen. Pure and testable.
 * Nothing here claims more than the data supports: speed appears only when the phone reports a
 * trustworthy one, and "approaching" / "stopped" are inferred from the passenger's own position.
 */

import { enT, type T } from '../i18n/translate';
import type { MessageKey } from '../i18n/messages';

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

const MOVEMENT_KEY: Record<Movement, MessageKey> = {
  'at-station': 'live.move.atStation',
  approaching: 'live.move.approaching',
  moving: 'live.move.moving',
  stopped: 'live.move.stopped',
  estimated: 'live.move.estimated',
  'signal-lost': 'live.move.signalLost',
  unknown: 'live.move.unknown',
};

/** The movement label in the active language (English by default, identical to MOVEMENT_LABEL). */
export const movementLabel = (m: Movement, t: T = enT): string => t(MOVEMENT_KEY[m]);

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

export function statusMessage(i: StatusInput, t: T = enT): { text: string; tone: Tone } {
  if (i.arrived) return { text: t('live.status.arrivedAt', { name: i.destinationName }), tone: 'ok' };
  if (i.hasPosition === false) return { text: t('live.status.waiting'), tone: 'info' };
  if (i.source === 'demo') return { text: t('live.status.demo'), tone: 'warn' };
  if (i.movement === 'signal-lost') return { text: t('live.status.signalLost'), tone: 'warn' };
  if (i.movement === 'estimated') return { text: t('live.status.estimated'), tone: 'info' };
  if (i.nextIsInterchange && i.nextName) return { text: t('live.status.changeAt', { name: i.nextName }), tone: 'info' };
  if (i.etaUpdated) {
    return { text: i.behindMin ? t('live.status.etaUpdatedBehind', { n: i.behindMin }) : t('live.status.etaUpdated'), tone: 'info' };
  }
  if (i.movement === 'approaching' && i.nextName) return { text: t('live.status.approaching', { name: i.nextName }), tone: 'ok' };
  if (i.movement === 'at-station') return { text: i.nextName ? t('live.status.atStationNext', { name: i.nextName }) : t('live.status.atStation'), tone: 'ok' };
  if (i.movement === 'stopped') return { text: t('live.status.stopped'), tone: 'warn' };
  if (i.inTunnel) return { text: t('live.status.underground'), tone: 'ok' };
  return { text: t('live.status.onYourWay'), tone: 'ok' };
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

/** Toast text for a milestone, given the route's station names (the last one is the destination). */
export function milestoneText(m: Milestone, names: string[], t: T = enT): string {
  switch (m.kind) {
    case 'passed':
      return t('live.milestone.passed', { name: names[m.idx] });
    case 'halfway':
      return t('live.milestone.halfway');
    case 'tunnel-in':
      return t('live.milestone.tunnelIn');
    case 'tunnel-out':
      return t('live.milestone.tunnelOut');
    case 'interchange':
      return t('live.milestone.interchange', { name: names[m.idx] });
    case 'approaching':
      return t('live.milestone.approaching', { name: names[names.length - 1] });
    case 'arrived':
      return t('live.milestone.arrived');
  }
}
