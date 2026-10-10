import { normalize } from '../search';
import { AGENCY_IDS, type AgencyId, type TransitData } from './types';

/** Lookup structures derived once from the bundled data. All plain arrays / typed arrays; nothing per frame. */
export interface TransitIndex {
  data: TransitData;
  stopByGtfs: Map<string, number>;
  /** CSR: for stop s, entries [psOff[s], psOff[s+1]) are (pattern, position of s in that pattern). */
  psOff: Int32Array;
  psPattern: Int32Array;
  psPos: Int32Array;
  /** CSR of walking links between stops (both directions): neighbours of s in [wOff[s], wOff[s+1]) with metres in wM. */
  wOff: Int32Array;
  wTo: Int32Array;
  wM: Int32Array;
  /** Bus stops near a metro station, nearest first. */
  stationStops: Map<string, { stop: number; m: number; named: boolean }[]>;
  /** Metro stations near a bus stop. */
  stopStations: Map<number, { station: string; m: number; named: boolean }[]>;
  /** Normalised stop names for search. */
  norm: string[];
}

export function buildIndex(data: TransitData): TransitIndex {
  const n = data.stops.id.length;
  const stopByGtfs = new Map(data.stops.id.map((id, i) => [id, i]));

  const counts = new Int32Array(n + 1);
  data.patterns.stops.forEach((stops) => stops.forEach((s) => counts[s + 1]++));
  const psOff = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) psOff[i + 1] = psOff[i] + counts[i + 1];
  const total = psOff[n];
  const psPattern = new Int32Array(total);
  const psPos = new Int32Array(total);
  const fill = psOff.slice(0, n);
  data.patterns.stops.forEach((stops, p) =>
    stops.forEach((s, pos) => {
      const at = fill[s]++;
      psPattern[at] = p;
      psPos[at] = pos;
    }),
  );

  const wc = new Int32Array(n + 1);
  for (const [a, b] of data.links.stopStop) {
    wc[a + 1]++;
    wc[b + 1]++;
  }
  const wOff = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) wOff[i + 1] = wOff[i] + wc[i + 1];
  const wTo = new Int32Array(wOff[n]);
  const wM = new Int32Array(wOff[n]);
  const wf = wOff.slice(0, n);
  for (const [a, b, m] of data.links.stopStop) {
    wTo[wf[a]] = b;
    wM[wf[a]++] = m;
    wTo[wf[b]] = a;
    wM[wf[b]++] = m;
  }

  const stationStops = new Map<string, { stop: number; m: number; named: boolean }[]>();
  const stopStations = new Map<number, { station: string; m: number; named: boolean }[]>();
  for (const l of data.links.stationStop) {
    (stationStops.get(l.station) ?? stationStops.set(l.station, []).get(l.station)!).push({ stop: l.stop, m: l.m, named: l.named });
    (stopStations.get(l.stop) ?? stopStations.set(l.stop, []).get(l.stop)!).push({ station: l.station, m: l.m, named: l.named });
  }
  for (const list of stationStops.values()) list.sort((a, b) => a.m - b.m);
  for (const list of stopStations.values()) list.sort((a, b) => a.m - b.m);

  return { data, stopByGtfs, psOff, psPattern, psPos, wOff, wTo, wM, stationStops, stopStations, norm: data.stops.name.map(normalize) };
}

/** Agencies that serve a stop, from its bit mask. */
export function agenciesOf(data: TransitData, stop: number): AgencyId[] {
  const mask = data.stops.agencies[stop];
  return AGENCY_IDS.filter((_, i) => (mask & (1 << i)) !== 0);
}

/** Number of distinct routes serving a stop. */
export function routesAtStop(ix: TransitIndex, stop: number): number[] {
  const set = new Set<number>();
  for (let k = ix.psOff[stop]; k < ix.psOff[stop + 1]; k++) set.add(ix.data.patterns.route[ix.psPattern[k]]);
  return [...set];
}
