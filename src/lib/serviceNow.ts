import type { FrequencyBand, RouteResult, TimetableLine, TimetableMetadata } from '../types';
import { enT, type T } from '../i18n/translate';

/**
 * What GMRC's published (static) timetable says about a line right now. This is NOT live: MetroMate has
 * no train feed, so it can say how often trains are scheduled and whether the line should be running, but
 * never when the next train arrives.
 */
export interface ServiceNow {
  /** 'running' = between the first and last train of the departure end; otherwise before/after. */
  state: 'running' | 'not-started' | 'ended';
  /** The published frequency band for this day and time, or null if none applies (or its window is unknown). */
  band: FrequencyBand | null;
  /** Terminal the first / last train of this direction leaves from. Times at other stations are later or earlier. */
  fromTerminalId: string;
  towardsTerminalId: string;
  first: string | null;
  last: string | null;
}

export function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const v = Number(m[1]) * 60 + Number(m[2]);
  return v < 24 * 60 + 60 ? v : null;
}

/** The frequency band whose window contains this moment (first match), or null. */
export function bandAt(line: TimetableLine, when: Date): FrequencyBand | null {
  const day = when.getDay();
  const minute = when.getHours() * 60 + when.getMinutes();
  for (const band of line.frequency) {
    for (const w of band.when ?? []) {
      if (w.days.includes(day) && w.ranges.some(([a, b]) => minute >= a && minute < b)) return band;
    }
  }
  return null;
}

/** Which end of `line` a rider ends up heading towards, given the stations of their route that lie on it. */
export function directionOnLine(line: TimetableLine, routeStationIds: string[]): { from: string; towards: string } {
  const idx = routeStationIds.map((id) => line.stationIds.indexOf(id)).filter((i) => i >= 0);
  const first = line.stationIds[0];
  const last = line.stationIds[line.stationIds.length - 1];
  const forward = idx.length < 2 || idx[idx.length - 1] >= idx[0];
  return forward ? { from: first, towards: last } : { from: last, towards: first };
}

export function serviceNow(line: TimetableLine, routeStationIds: string[], when: Date): ServiceNow {
  const { from, towards } = directionOnLine(line, routeStationIds);
  const first = line.firstTrain.find((t) => t.stationId === from)?.time ?? null;
  const last = line.lastTrain.find((t) => t.stationId === from)?.time ?? null;
  const minute = when.getHours() * 60 + when.getMinutes();
  const a = first ? toMinutes(first) : null;
  const b = last ? toMinutes(last) : null;
  let state: ServiceNow['state'] = 'running';
  if (a !== null && minute < a) state = 'not-started';
  else if (b !== null && minute > b) state = 'ended';
  return { state, band: bandAt(line, when), fromTerminalId: from, towardsTerminalId: towards, first, last };
}

/** The timetable lines a route rides, in travel order, with the route stations on each. */
export function linesForRoute(timetable: TimetableMetadata, route: RouteResult): { line: TimetableLine; stationIds: string[] }[] {
  const out: { line: TimetableLine; stationIds: string[]; at: number }[] = [];
  for (const line of timetable.lines) {
    const set = new Set(line.stationIds);
    const used: string[] = [];
    let at = Infinity;
    for (let i = 0; i < route.stationIds.length - 1; i++) {
      const a = route.stationIds[i];
      const b = route.stationIds[i + 1];
      if (set.has(a) && set.has(b)) {
        if (!used.includes(a)) used.push(a);
        used.push(b);
        at = Math.min(at, i);
      }
    }
    if (used.length > 0) out.push({ line, stationIds: used, at });
  }
  return out.sort((x, y) => x.at - y.at).map(({ line, stationIds }) => ({ line, stationIds }));
}

/** "Every 7 min", "About every 40 min", "Bus only". */
export function bandText(band: FrequencyBand, t: T = enT): string {
  if (band.kind === 'bus-only') return t('route.lib.band.busOnly');
  return t(band.kind === 'average' ? 'route.lib.band.about' : 'route.lib.band.every', { n: String(band.minutes) });
}

/** Short tag for the band's period, taken from GMRC's label ("Peak", "Non-peak", "Early / late"). */
export function bandPeriod(band: FrequencyBand, t: T = enT): string | null {
  const l = band.label.toLowerCase();
  if (l.includes('non-peak')) return t('route.lib.period.nonPeak');
  if (l.includes('peak')) return t('route.lib.period.peak');
  if (/06:20.*07:00.*22:00.*23:00/.test(l)) return t('route.lib.period.earlyLate');
  return null;
}
