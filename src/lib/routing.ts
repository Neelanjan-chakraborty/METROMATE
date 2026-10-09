import type {
  Connection,
  Corridor,
  Dataset,
  Interchange,
  RouteOutcome,
  RouteSegment,
  Station,
} from '../types';

export interface Network {
  stations: Map<string, Station>;
  corridors: Map<string, Corridor>;
  /** Outgoing connections per station id. */
  edges: Map<string, Connection[]>;
}

export const PHASE_WARNING =
  'GMRC’s fare rules mention a restriction on travel between Phase-1 (Thaltej Gam–Vastral Gam, APMC–Motera) and Phase-2 (Koteshwar Road–Mahatma Mandir, GNLU–GIFT City) stations. Part of the rule text is not available offline, so confirm your ticket at the station before travelling.';

export const GNLU_WARNING =
  'GNLU is marked as an interchange on the GMRC map. The GMRC timetable suggests some trains run through to GIFT City, so check the station display for your train.';

export function buildNetwork(ds: Pick<Dataset, 'stations' | 'corridors' | 'connections'>): Network {
  const stations = new Map(ds.stations.map((s) => [s.id, s]));
  const corridors = new Map(ds.corridors.map((c) => [c.id, c]));
  const edges = new Map<string, Connection[]>();
  for (const s of ds.stations) edges.set(s.id, []);
  for (const c of ds.connections) {
    // Ignore dangling connections instead of crashing; the data validator reports them.
    if (!stations.has(c.fromStationId) || !stations.has(c.toStationId)) continue;
    edges.get(c.fromStationId)!.push(c);
  }
  return { stations, corridors, edges };
}

interface Label {
  cost: number;
  stationId: string;
  corridorId: string | null;
  prevKey: string | null;
  edge: Connection | null;
}

const key = (stationId: string, corridorId: string | null) => `${stationId}|${corridorId ?? ''}`;

/**
 * Deterministic least-stops route. Ties are broken by fewer train changes.
 * Cost = stops * 1000 + changes, searched over (station, corridor) states.
 */
export function findRoute(net: Network, originId: string | null | undefined, destinationId: string | null | undefined): RouteOutcome {
  if (!originId || !destinationId) {
    return { ok: false, code: 'MISSING_INPUT', message: 'Choose both a starting station and a destination.' };
  }
  const origin = net.stations.get(originId);
  const destination = net.stations.get(destinationId);
  if (!origin || !destination) {
    return {
      ok: false,
      code: 'UNKNOWN_STATION',
      message: 'One of the selected stations is not in the offline data. Pick a station from the list.',
    };
  }
  if (originId === destinationId) {
    return { ok: false, code: 'SAME_STATION', message: 'Your start and destination are the same station.' };
  }

  const best = new Map<string, Label>();
  const open: Label[] = [];
  const startLabel: Label = { cost: 0, stationId: originId, corridorId: null, prevKey: null, edge: null };
  best.set(key(originId, null), startLabel);
  open.push(startLabel);
  const done = new Set<string>();
  let goal: Label | null = null;

  while (open.length > 0) {
    // Linear scan is fine: the network has 54 stations.
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].cost < open[bestIdx].cost) bestIdx = i;
    }
    const cur = open.splice(bestIdx, 1)[0];
    const curKey = key(cur.stationId, cur.corridorId);
    if (done.has(curKey)) continue;
    done.add(curKey);

    if (cur.stationId === destinationId) {
      goal = cur;
      break;
    }
    for (const e of net.edges.get(cur.stationId) ?? []) {
      const change = cur.corridorId !== null && cur.corridorId !== e.corridorId ? 1 : 0;
      const nextKey = key(e.toStationId, e.corridorId);
      const cost = cur.cost + 1000 + change;
      const existing = best.get(nextKey);
      if (!existing || cost < existing.cost) {
        const label: Label = { cost, stationId: e.toStationId, corridorId: e.corridorId, prevKey: curKey, edge: e };
        best.set(nextKey, label);
        open.push(label);
      }
    }
  }

  if (!goal) {
    return {
      ok: false,
      code: 'NO_ROUTE',
      message: `No route between ${origin.name} and ${destination.name} was found in the offline network data.`,
    };
  }

  // Reconstruct the edge list.
  const edgeList: Connection[] = [];
  for (let l: Label | undefined = goal; l && l.edge; l = l.prevKey ? best.get(l.prevKey) : undefined) {
    edgeList.unshift(l.edge);
  }

  const stationIds = [originId, ...edgeList.map((e) => e.toStationId)];

  const segments: RouteSegment[] = [];
  for (const e of edgeList) {
    const last = segments[segments.length - 1];
    if (last && last.corridorId === e.corridorId) {
      last.stationIds.push(e.toStationId);
      last.toStationId = e.toStationId;
      last.stops += 1;
    } else {
      segments.push({
        corridorId: e.corridorId,
        stationIds: [e.fromStationId, e.toStationId],
        fromStationId: e.fromStationId,
        toStationId: e.toStationId,
        stops: 1,
        direction: e.direction,
        directionTerminalId: e.directionTerminalId,
      });
    }
  }

  const interchanges: Interchange[] = [];
  for (let i = 0; i < segments.length - 1; i++) {
    interchanges.push({
      stationId: segments[i].toStationId,
      fromCorridorId: segments[i].corridorId,
      toCorridorId: segments[i + 1].corridorId,
    });
  }

  const crossesPhaseBoundary = edgeList.some(
    (e) => net.stations.get(e.fromStationId)!.phase !== net.stations.get(e.toStationId)!.phase,
  );

  const warnings: string[] = [];
  if (crossesPhaseBoundary) warnings.push(PHASE_WARNING);
  if (interchanges.some((i) => i.stationId === 'GNLU')) warnings.push(GNLU_WARNING);
  for (const id of stationIds) {
    const note = net.stations.get(id)?.serviceNote;
    if (note) warnings.push(`${net.stations.get(id)!.name}: ${note}`);
  }

  return {
    ok: true,
    originId,
    destinationId,
    stationIds,
    segments,
    interchanges,
    stopCount: edgeList.length,
    intermediateCount: Math.max(0, stationIds.length - 2),
    crossesPhaseBoundary,
    preference: 'fewest-stops',
    warnings,
  };
}
