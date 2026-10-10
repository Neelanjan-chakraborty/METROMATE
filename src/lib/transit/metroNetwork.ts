import type { Corridor, TimetableLine } from '../../types';
import { hopMinutes } from '../eta';
import { directionOnLine, toMinutes } from '../serviceNow';

/**
 * The metro as the planner sees it: one pattern per corridor and direction. The metro has no per-train
 * timetable, so a boarding time is MODELLED from GMRC's published frequency band (average wait = half the
 * headway) and the published first/last train (shifted along the line by the estimated hop minutes). Every
 * number from here is an estimate and is labelled so in the plan.
 */

/** Minutes assumed for changing between metro lines at an interchange. No verified figure exists; shown as an assumption. */
export const METRO_CHANGE_MIN = 5;

export interface MetroPattern {
  corridorId: string;
  /** 0 = along the corridor's station order, 1 = against it. */
  dir: 0 | 1;
  /** Station ids in travel order. */
  stationIds: string[];
  /** Cumulative estimated in-train minutes from the first station. */
  cum: number[];
  /** Published timetable line used for the hop that starts at each position (null for the last). */
  hopLine: (TimetableLine | null)[];
  /** For each position: minutes after the line's departure terminal that a train reaches the station. */
  fromTerminal: number[];
  /** Terminal the train is heading to. */
  towardsId: string;
}

export function buildMetroPatterns(corridors: Corridor[], lines: TimetableLine[], coordOf: (id: string) => { lat: number; lon: number } | null): MetroPattern[] {
  // minutes along each published line from its first station
  const lineCum = new Map<string, Map<string, number>>();
  for (const line of lines) {
    const h = hopMinutes(line.stationIds, coordOf, [line]);
    if (!h) continue;
    const m = new Map<string, number>();
    let acc = 0;
    line.stationIds.forEach((id, i) => {
      if (i > 0) acc += h.minutes[i - 1];
      m.set(id, acc);
    });
    lineCum.set(line.id, m);
  }

  const out: MetroPattern[] = [];
  for (const c of corridors) {
    for (const dir of [0, 1] as const) {
      const ids = dir === 0 ? [...c.sequence] : [...c.sequence].reverse();
      const h = hopMinutes(ids, coordOf, lines);
      if (!h) continue;
      const cum = [0];
      h.minutes.forEach((m) => cum.push(cum[cum.length - 1] + m));
      const hopLine: (TimetableLine | null)[] = ids.map((id, i) => (i < ids.length - 1 ? lines.find((l) => l.stationIds.includes(id) && l.stationIds.includes(ids[i + 1])) ?? null : null));
      const fromTerminal = ids.map((id, i) => {
        const j = i < ids.length - 1 ? i : i - 1; // the last station uses the hop that arrives at it
        const line = hopLine[j];
        const cm = line ? lineCum.get(line.id) : undefined;
        if (!line || !cm) return 0;
        const d = directionOnLine(line, [ids[j], ids[j + 1]]);
        const pos = cm.get(id) ?? 0;
        const total = cm.get(line.stationIds[line.stationIds.length - 1]) ?? 0;
        return d.from === line.stationIds[0] ? pos : total - pos;
      });
      out.push({ corridorId: c.id, dir, stationIds: ids, cum, hopLine, fromTerminal, towardsId: dir === 0 ? c.forwardTerminalId : c.backwardTerminalId });
    }
  }
  return out;
}

export interface MetroBoarding {
  /** Estimated departure time (minutes since the service day began). */
  depart: number;
  /** Estimated wait for the train, minutes (0 when waiting for the first train of the day). */
  wait: number;
  /** Headway used, minutes (null when waiting for the first train). */
  headway: number | null;
  firstTrain: boolean;
}

/**
 * Earliest estimated boarding at position `i` of a metro pattern for someone who is at the platform area
 * at time `t`. Null when no service is modelled: before the first train it waits for the first train;
 * after the last train, or in a window GMRC lists as bus-only, there is no metro boarding.
 */
export function metroBoarding(p: MetroPattern, i: number, t: number, bandAtFn: (line: TimetableLine, minute: number) => { kind: string; minutes: number | null } | null): MetroBoarding | null {
  const line = p.hopLine[i];
  if (!line) return null;
  const from = directionOnLine(line, [p.stationIds[i], p.stationIds[i + 1]]).from;
  const first = line.firstTrain.find((x) => x.stationId === from);
  const last = line.lastTrain.find((x) => x.stationId === from);
  const a = first ? toMinutes(first.time) : null;
  const b = last ? toMinutes(last.time) : null;
  if (a === null || b === null) return null;
  const off = p.fromTerminal[i];
  const firstDep = a + off;
  const lastDep = b + off;
  if (t > lastDep) return null;
  if (t <= firstDep) return { depart: firstDep, wait: firstDep - t, headway: null, firstTrain: true };
  const band = bandAtFn(line, t - off);
  if (!band || band.kind === 'bus-only' || !band.minutes) return null;
  const depart = t + band.minutes / 2;
  if (depart > lastDep) return { depart: lastDep, wait: lastDep - t, headway: band.minutes, firstTrain: false };
  return { depart, wait: band.minutes / 2, headway: band.minutes, firstTrain: false };
}
