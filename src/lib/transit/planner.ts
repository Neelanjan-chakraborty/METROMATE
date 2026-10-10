import type { Corridor, Station, TimetableLine, TimetableMetadata } from '../../types';
import { bandAt } from '../serviceNow';
import { brtsFare, type FareSummary } from './fares';
import { buildMetroPatterns, metroBoarding, METRO_CHANGE_MIN, type MetroPattern } from './metroNetwork';
import { agenciesOf, type TransitIndex } from './transitIndex';
import { enT, type T } from '../../i18n/translate';
import { busStopId, gtfsStopId, isBusId, type AgencyId } from './types';

/*
 * Multimodal planner: a RAPTOR-style round-based search over
 *   - bus patterns with their scheduled departures (AMTS, AJL/BRTS, GTSL),
 *   - the metro, modelled from GMRC's published frequency (see metroNetwork.ts),
 *   - walking links between nearby stops and between stations and stops.
 * It finds the earliest arrival for each number of rides (up to MAX_RIDES) and keeps the ones that improve.
 * Times are minutes since the service day began (may exceed 1440). Bus times are SCHEDULED, metro times and
 * walking times are ESTIMATES. Nothing here is live.
 */

export const MAX_RIDES = 4;
/** Assumed walking pace and detour factor over the straight-line distance (no street data exists). */
export const WALK_KMH = 5;
export const WALK_DETOUR = 1.3;
const MAX_WAIT_FIRST = 180;
const MAX_WAIT_LATER = 120;
const LOOKAHEAD = 8;
const MAX_TRIP_MIN = 8 * 60;
/** Minutes assumed between getting off one vehicle and being able to board the next at the same place. */
export const TRANSFER_BUFFER_MIN = 1;

export const walkMinutes = (m: number) => (m * WALK_DETOUR) / ((WALK_KMH * 1000) / 60);

// -------------------------------------------------------------------- types

export interface PlaceRef {
  id: string;
  name: string;
  kind: 'station' | 'stop';
}

export interface WalkLeg {
  mode: 'walk';
  from: PlaceRef;
  to: PlaceRef;
  meters: number;
  depart: number;
  arrive: number;
}

export interface BusLeg {
  mode: 'bus';
  agency: AgencyId;
  routeShort: string;
  routeLong: string;
  headsign: string;
  from: PlaceRef;
  to: PlaceRef;
  stops: number;
  /** The pattern (stop sequence) ridden and the positions boarded / alighted in it; used to draw the leg on the map. */
  pattern: number;
  boardPos: number;
  alightPos: number;
  /** Names of the stops passed between boarding and alighting. */
  via: string[];
  depart: number;
  arrive: number;
  /** The wait before this bus, in minutes (scheduled). */
  waitMinutes: number;
  /** The next scheduled departures of this route from the boarding stop after this one. */
  nextDepartures: number[];
  fare: { adult: number; child: number } | null;
}

export interface MetroLeg {
  mode: 'metro';
  corridorId: string;
  from: PlaceRef;
  to: PlaceRef;
  stationIds: string[];
  towardsId: string;
  stops: number;
  depart: number;
  arrive: number;
  /** Estimated average wait (half the published headway), or the wait for the first train. */
  waitMinutes: number;
  headwayMinutes: number | null;
  firstTrain: boolean;
  /** True when this leg starts with a change from another metro line (a flat assumption is added). */
  changeAssumed: boolean;
}

export type TransitLeg = WalkLeg | BusLeg | MetroLeg;

export interface TransitPlan {
  legs: TransitLeg[];
  departAt: number;
  arriveAt: number;
  /** Number of vehicles taken minus one. */
  transfers: number;
  rides: number;
  walkMeters: number;
  fare: FareSummary;
  warnings: string[];
}

export type PlanStatus = 'ok' | 'no-route' | 'same-place' | 'unknown-place' | 'expired';

export interface PlanResult {
  status: PlanStatus;
  plans: TransitPlan[];
  /** True when nothing was found today and the plans are for the start of the next day. */
  nextDay: boolean;
  /** Minutes since midnight the search started from (after any next-day shift). */
  departAt: number;
  notes: string[];
}

export interface PlannerContext {
  ix: TransitIndex;
  stations: Station[];
  stationNode: Map<string, number>;
  nodeCount: number;
  stopCount: number;
  metro: MetroPattern[];
  /** metro pattern index lists for each station node */
  metroAt: Map<number, { pattern: number; pos: number }[]>;
  /** bus pattern trips including those that began the previous day (negative starts) */
  trips: { startT: number[]; startV: number[] }[];
  maxOff: number[];
  coord: (id: string) => { lat: number; lon: number } | null;
  nameOfStation: (id: string) => string;
}

export interface PlannerInputs {
  ix: TransitIndex;
  stations: Station[];
  corridors: Corridor[];
  timetable: TimetableMetadata;
  /** Station positions (dataset pins or recorded fixes). */
  stationPoint: (id: string) => { lat: number; lon: number } | null;
}

export function createPlanner(inp: PlannerInputs): PlannerContext {
  const { ix, stations } = inp;
  const stopCount = ix.data.stops.id.length;
  const stationNode = new Map(stations.map((s, i) => [s.id, stopCount + i]));
  const metro = buildMetroPatterns(inp.corridors, inp.timetable.lines, inp.stationPoint);
  const metroAt = new Map<number, { pattern: number; pos: number }[]>();
  metro.forEach((p, pi) =>
    p.stationIds.forEach((id, pos) => {
      const node = stationNode.get(id);
      if (node === undefined) return;
      (metroAt.get(node) ?? metroAt.set(node, []).get(node)!).push({ pattern: pi, pos });
    }),
  );
  const P = ix.data.patterns;
  const trips = P.startT.map((startT, p) => {
    const vecs = P.vectors[p];
    const st: number[] = [];
    const sv: number[] = [];
    const prev: [number, number][] = [];
    startT.forEach((t, i) => {
      const v = P.startV[p][i];
      const end = t + vecs[v][vecs[v].length - 1];
      if (end >= 1440) prev.push([t - 1440, v]); // the same trip, seen from the previous service day
    });
    prev.sort((a, b) => a[0] - b[0]);
    for (const [t, v] of prev) {
      st.push(t);
      sv.push(v);
    }
    startT.forEach((t, i) => {
      st.push(t);
      sv.push(P.startV[p][i]);
    });
    return { startT: st, startV: sv };
  });
  const maxOff = P.vectors.map((vs) => Math.max(...vs.map((v) => v[v.length - 1])));
  return {
    ix,
    stations,
    stationNode,
    nodeCount: stopCount + stations.length,
    stopCount,
    metro,
    metroAt,
    trips,
    maxOff,
    coord: inp.stationPoint,
    nameOfStation: (id) => stations.find((s) => s.id === id)?.name ?? id,
  };
}

// ------------------------------------------------------------------- search

interface Rec {
  kind: 'origin' | 'bus' | 'metro' | 'walk';
  prevNode: number;
  prevRound: number;
  time: number;
  // bus
  pattern?: number;
  boardPos?: number;
  alightPos?: number;
  tripStart?: number;
  tripVec?: number;
  boardTime?: number;
  // metro
  metroPattern?: number;
  waitMin?: number;
  headway?: number | null;
  firstTrain?: boolean;
  changed?: boolean;
  // walk
  meters?: number;
}

const INF = Number.POSITIVE_INFINITY;

function lowerBound(a: number[], x: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Earliest trip of bus pattern `p` that reaches position `pos` at or after `t` (looks a few trips ahead because travel times vary). */
function earliestTrip(ctx: PlannerContext, p: number, pos: number, t: number): { start: number; vec: number; dep: number } | null {
  const tr = ctx.trips[p];
  const vecs = ctx.ix.data.patterns.vectors[p];
  let i = lowerBound(tr.startT, t - ctx.maxOff[p]);
  let best: { start: number; vec: number; dep: number } | null = null;
  let seen = 0;
  for (; i < tr.startT.length; i++) {
    const start = tr.startT[i];
    if (best && start > best.dep) break;
    const dep = start + vecs[tr.startV[i]][pos];
    if (dep < t) continue;
    if (!best || dep < best.dep) best = { start, vec: tr.startV[i], dep };
    if (++seen >= LOOKAHEAD) break;
  }
  return best;
}

export interface Query {
  from: string;
  to: string;
  /** Minutes since midnight of `date`. */
  departAt: number;
  /** Local midnight of the service day. */
  date: Date;
}

function nodeOf(ctx: PlannerContext, id: string): number | null {
  if (isBusId(id)) {
    const s = ctx.ix.stopByGtfs.get(gtfsStopId(id));
    return s === undefined ? null : s;
  }
  return ctx.stationNode.get(id) ?? null;
}

function search(ctx: PlannerContext, origin: number, dest: number, depart: number, date: Date, waitFirst: number): { rounds: Map<number, Rec>[]; bestRound: Int8Array; best: Float64Array; reached: number[] } {
  const { ix } = ctx;
  const N = ctx.nodeCount;
  const best = new Float64Array(N).fill(INF);
  const bestRound = new Int8Array(N).fill(-1);
  const rounds: Map<number, Rec>[] = [];
  const reached: number[] = [];
  const bandFn = (line: TimetableLine, minute: number) => bandAt(line, new Date(date.getTime() + minute * 60_000));

  const walkFrom = (node: number, k: number, rec: Map<number, Rec>, marked: Set<number>) => {
    const t0 = best[node];
    const consider = (to: number, m: number) => {
      const t = t0 + walkMinutes(m);
      if (t < best[to] - 1e-9) {
        best[to] = t;
        bestRound[to] = k;
        rec.set(to, { kind: 'walk', prevNode: node, prevRound: k, time: t, meters: m });
        marked.add(to);
      }
    };
    if (node < ctx.stopCount) {
      for (let e = ix.wOff[node]; e < ix.wOff[node + 1]; e++) consider(ix.wTo[e], ix.wM[e]);
      for (const l of ix.stopStations.get(node) ?? []) {
        const sn = ctx.stationNode.get(l.station);
        if (sn !== undefined) consider(sn, l.m);
      }
    } else {
      const id = ctx.stations[node - ctx.stopCount].id;
      for (const l of ix.stationStops.get(id) ?? []) consider(l.stop, l.m);
    }
  };

  // round 0: the origin and whatever can be walked to from it
  const rec0 = new Map<number, Rec>();
  rounds.push(rec0);
  best[origin] = depart;
  bestRound[origin] = 0;
  rec0.set(origin, { kind: 'origin', prevNode: -1, prevRound: -1, time: depart });
  let marked = new Set<number>([origin]);
  walkFrom(origin, 0, rec0, marked);

  for (let k = 1; k <= MAX_RIDES; k++) {
    const rec = new Map<number, Rec>();
    rounds.push(rec);
    const prevBest = best.slice();
    const prevRound = bestRound.slice();
    const improved = new Set<number>();
    const maxWait = k === 1 ? waitFirst : MAX_WAIT_LATER;
    const bound = () => Math.min(best[dest], depart + MAX_TRIP_MIN);

    // bus patterns touching a marked stop
    const qPos = new Map<number, number>();
    for (const node of marked) {
      if (node >= ctx.stopCount) continue;
      for (let e = ix.psOff[node]; e < ix.psOff[node + 1]; e++) {
        const p = ix.psPattern[e];
        const pos = ix.psPos[e];
        const cur = qPos.get(p);
        if (cur === undefined || pos < cur) qPos.set(p, pos);
      }
    }
    for (const [p, firstPos] of qPos) {
      const stops = ix.data.patterns.stops[p];
      const vecs = ix.data.patterns.vectors[p];
      let cur: { start: number; vec: number; dep: number; boardPos: number; boardNode: number } | null = null;
      for (let q = firstPos; q < stops.length; q++) {
        const node = stops[q];
        if (cur) {
          const arr = cur.start + vecs[cur.vec][q];
          if (arr < best[node] - 1e-9 && arr < bound()) {
            best[node] = arr;
            bestRound[node] = k;
            rec.set(node, { kind: 'bus', prevNode: cur.boardNode, prevRound: prevRound[cur.boardNode], time: arr, pattern: p, boardPos: cur.boardPos, alightPos: q, tripStart: cur.start, tripVec: cur.vec, boardTime: cur.dep });
            improved.add(node);
          }
        }
        const t0 = prevBest[node];
        if (t0 < INF && marked.has(node)) {
          const pk = rounds[prevRound[node]]?.get(node)?.kind;
          const t = t0 + (pk === 'bus' || pk === 'metro' ? TRANSFER_BUFFER_MIN : 0);
          const et = earliestTrip(ctx, p, q, t);
          if (et && et.dep - t <= maxWait && (!cur || et.dep < cur.start + vecs[cur.vec][q])) cur = { ...et, boardPos: q, boardNode: node };
        }
      }
    }

    // metro patterns touching a marked station
    for (const node of marked) {
      for (const at of ctx.metroAt.get(node) ?? []) {
        const mp = ctx.metro[at.pattern];
        const arrivedByMetro = rounds[prevRound[node]]?.get(node)?.kind === 'metro';
        const changed = arrivedByMetro;
        const pk = rounds[prevRound[node]]?.get(node)?.kind;
        const t = prevBest[node] + (changed ? METRO_CHANGE_MIN : pk === 'bus' ? TRANSFER_BUFFER_MIN : 0);
        const b = metroBoarding(mp, at.pos, t, bandFn);
        if (!b || b.wait > maxWait) continue;
        for (let j = at.pos + 1; j < mp.stationIds.length; j++) {
          const dn = ctx.stationNode.get(mp.stationIds[j]);
          if (dn === undefined) continue;
          const arr = b.depart + (mp.cum[j] - mp.cum[at.pos]);
          if (arr < best[dn] - 1e-9 && arr < bound()) {
            best[dn] = arr;
            bestRound[dn] = k;
            rec.set(dn, { kind: 'metro', prevNode: node, prevRound: prevRound[node], time: arr, metroPattern: at.pattern, boardPos: at.pos, alightPos: j, boardTime: b.depart, waitMin: b.wait + (changed ? METRO_CHANGE_MIN : 0), headway: b.headway, firstTrain: b.firstTrain, changed });
            improved.add(dn);
          }
        }
      }
    }

    // footpaths from nodes improved by a ride this round
    const next = new Set<number>(improved);
    for (const node of improved) walkFrom(node, k, rec, next);
    marked = next;
    if (marked.size === 0) break;
    if (bestRound[dest] === k) reached.push(k);
  }
  return { rounds, bestRound, best, reached };
}

// ------------------------------------------------------------ reconstruction

function placeRef(ctx: PlannerContext, node: number): PlaceRef {
  if (node < ctx.stopCount) return { id: busStopId(ctx.ix.data.stops.id[node]), name: ctx.ix.data.stops.name[node], kind: 'stop' };
  const s = ctx.stations[node - ctx.stopCount];
  return { id: s.id, name: s.name, kind: 'station' };
}

function build(ctx: PlannerContext, found: ReturnType<typeof search>, dest: number, k: number, departAt: number, t: T): TransitPlan {
  const { ix } = ctx;
  const legs: TransitLeg[] = [];
  let node = dest;
  let round = k;
  for (let guard = 0; guard < 40; guard++) {
    const r = found.rounds[round]?.get(node);
    if (!r || r.kind === 'origin') break;
    if (r.kind === 'walk') {
      const from = placeRef(ctx, r.prevNode);
      legs.push({ mode: 'walk', from, to: placeRef(ctx, node), meters: r.meters ?? 0, depart: r.time - walkMinutes(r.meters ?? 0), arrive: r.time });
      node = r.prevNode;
      round = r.prevRound;
    } else if (r.kind === 'bus') {
      const p = r.pattern!;
      const stops = ix.data.patterns.stops[p];
      const route = ix.data.patterns.route[p];
      const agency = ix.data.agencies[ix.data.routes.agency[route]].id;
      const from = placeRef(ctx, stops[r.boardPos!]);
      const to = placeRef(ctx, stops[r.alightPos!]);
      const prevArr = found.rounds[r.prevRound]?.get(r.prevNode)?.time ?? r.boardTime!;
      const vecs = ix.data.patterns.vectors[p];
      const tr = ctx.trips[p];
      const next: number[] = [];
      for (let i = 0; i < tr.startT.length && next.length < 3; i++) {
        const dep = tr.startT[i] + vecs[tr.startV[i]][r.boardPos!];
        if (dep > r.boardTime! && dep >= 0) next.push(dep);
      }
      next.sort((a, b) => a - b);
      legs.push({
        mode: 'bus',
        agency,
        routeShort: ix.data.routes.short[route],
        routeLong: ix.data.routes.long[route],
        headsign: ix.data.stops.name[stops[stops.length - 1]],
        from,
        to,
        stops: r.alightPos! - r.boardPos!,
        pattern: p,
        boardPos: r.boardPos!,
        alightPos: r.alightPos!,
        via: stops.slice(r.boardPos! + 1, r.alightPos!).map((s) => ix.data.stops.name[s]),
        depart: r.boardTime!,
        arrive: r.time,
        waitMinutes: Math.max(0, r.boardTime! - prevArr),
        nextDepartures: next.slice(0, 3),
        fare: agency === 'AJL' ? brtsFare(ix, stops[r.boardPos!], stops[r.alightPos!]) : null,
      });
      node = r.prevNode;
      round = r.prevRound;
    } else {
      const mp = ctx.metro[r.metroPattern!];
      const ids = mp.stationIds.slice(r.boardPos!, r.alightPos! + 1);
      legs.push({
        mode: 'metro',
        corridorId: mp.corridorId,
        from: placeRef(ctx, r.prevNode),
        to: placeRef(ctx, node),
        stationIds: ids,
        towardsId: mp.towardsId,
        stops: ids.length - 1,
        depart: r.boardTime!,
        arrive: r.time,
        waitMinutes: r.waitMin ?? 0,
        headwayMinutes: r.headway ?? null,
        firstTrain: !!r.firstTrain,
        changeAssumed: !!r.changed,
      });
      node = r.prevNode;
      round = r.prevRound;
    }
  }
  legs.reverse();
  const rides = legs.filter((l) => l.mode !== 'walk').length;
  const walkMeters = legs.reduce((s, l) => s + (l.mode === 'walk' ? l.meters : 0), 0);
  const warnings: string[] = [];
  const unavailable = new Set<FareSummary['unavailable'][number]>();
  let known = 0;
  let knownChild = 0;
  let anyKnown = false;
  for (const l of legs) {
    if (l.mode === 'metro') unavailable.add('metro');
    if (l.mode !== 'bus') continue;
    if (l.agency === 'AJL') {
      if (l.fare) {
        known += l.fare.adult;
        knownChild += l.fare.child;
        anyKnown = true;
      } else unavailable.add('BRTS');
    } else unavailable.add(l.agency);
  }
  if (legs.some((l) => l.mode === 'metro')) warnings.push(t('route.lib.plan.metroEstimates'));
  if (legs.some((l) => l.mode === 'bus')) warnings.push(t('route.lib.plan.busScheduled'));
  if (walkMeters > 0) warnings.push(t('route.lib.plan.walkRough'));
  return {
    legs,
    departAt,
    arriveAt: legs.length ? legs[legs.length - 1].arrive : departAt,
    transfers: Math.max(0, rides - 1),
    rides,
    walkMeters: Math.round(walkMeters),
    fare: { knownInr: anyKnown ? known : null, knownChildInr: anyKnown ? knownChild : null, unavailable: [...unavailable], partial: unavailable.size > 0 },
    warnings,
  };
}

// -------------------------------------------------------------------- API

/**
 * Plans the trip. The user-visible `notes` and each plan's `warnings` are written with `t` (English by default), so the
 * caller passes the active language's translator; the search itself does not depend on it.
 */
export function planTransit(ctx: PlannerContext, q: Query, today?: string, t: T = enT): PlanResult {
  if (q.from === q.to) return { status: 'same-place', plans: [], nextDay: false, departAt: q.departAt, notes: [t('route.lib.plan.samePlace')] };
  const o = nodeOf(ctx, q.from);
  const d = nodeOf(ctx, q.to);
  if (o === null || d === null) return { status: 'unknown-place', plans: [], nextDay: false, departAt: q.departAt, notes: [t('route.lib.plan.unknownPlace')] };
  const notes: string[] = [];
  if (today && today > ctx.ix.data.meta.source.validTo) {
    return { status: 'expired', plans: [], nextDay: false, departAt: q.departAt, notes: [t('route.lib.plan.expired', { date: ctx.ix.data.meta.source.validTo })] };
  }
  const attempt = (depart: number, date: Date, waitFirst: number) => {
    const found = search(ctx, o, d, depart, date, waitFirst);
    const plans = found.reached.map((k) => build(ctx, found, d, k, depart, t)).filter((p) => p.legs.length > 0);
    // a later plan must be strictly earlier to be worth showing
    const out: TransitPlan[] = [];
    for (const p of plans) if (!out.length || p.arriveAt < out[out.length - 1].arriveAt - 0.5) out.push(p);
    return out;
  };
  /** For a next-day plan the search starts at midnight, which is not when anyone leaves: start the leading walk just in time. */
  const justInTime = (plan: TransitPlan): TransitPlan => {
    const legs = plan.legs.map((l) => ({ ...l })) as TransitLeg[];
    const first = legs[0];
    const second = legs[1];
    if (first.mode === 'walk' && second && second.mode !== 'walk') {
      const dur = first.arrive - first.depart;
      first.arrive = second.depart;
      first.depart = second.depart - dur;
      if (second.mode === 'bus') second.waitMinutes = 0;
      else if (second.firstTrain) second.waitMinutes = 0;
      return { ...plan, legs, departAt: Math.round(first.depart) };
    }
    const lead = first.mode === 'walk' ? first.arrive : first.depart;
    if (first.mode === 'bus') first.waitMinutes = 0;
    if (first.mode === 'metro' && first.firstTrain) first.waitMinutes = 0;
    return { ...plan, legs, departAt: Math.round(first.mode === 'walk' ? lead : first.depart) };
  };
  let plans = attempt(q.departAt, q.date, MAX_WAIT_FIRST);
  let nextDay = false;
  let departAt = q.departAt;
  if (plans.length === 0 && q.departAt > 0) {
    const tomorrow = new Date(q.date.getTime() + 24 * 3_600_000);
    plans = attempt(0, tomorrow, Infinity); // the first service of the day may be hours after midnight
    if (plans.length) {
      nextDay = true;
      departAt = 0;
      plans = plans.map(justInTime);
      notes.push(t('route.lib.plan.nextDay'));
    }
  }
  if (plans.length === 0) notes.push(t('route.lib.plan.noRoute'));
  return { status: plans.length ? 'ok' : 'no-route', plans, nextDay, departAt, notes };
}

/** Agencies serving a stop, for display. */
export const stopAgencies = (ix: TransitIndex, stop: number): AgencyId[] => agenciesOf(ix.data, stop);
