import type { Dataset, VerificationStatus } from '../types';

export interface ValidationReport {
  errors: string[];
  warnings: string[];
  ok: boolean;
}

const STATUSES: VerificationStatus[] = ['verified', 'unverified', 'estimated', 'unknown'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Structural and provenance checks for the offline dataset. Never throws: a
 * malformed dataset yields errors in the report so the app can fail gracefully.
 */
export function validateDataset(ds: Dataset): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(m);
  const warn = (m: string) => warnings.push(m);

  try {
    const stationIds = new Set<string>();
    for (const s of ds.stations) {
      if (stationIds.has(s.id)) err(`Duplicate station id: ${s.id}`);
      stationIds.add(s.id);
    }
    const corridorIds = new Set<string>();
    for (const c of ds.corridors) {
      if (corridorIds.has(c.id)) err(`Duplicate corridor id: ${c.id}`);
      corridorIds.add(c.id);
    }
    const stationById = new Map(ds.stations.map((s) => [s.id, s]));
    const corridorById = new Map(ds.corridors.map((c) => [c.id, c]));

    // Corridors
    for (const c of ds.corridors) {
      if (c.sequence.length < 2) err(`Corridor ${c.id} has fewer than 2 stations`);
      const seen = new Set<string>();
      c.sequence.forEach((id, i) => {
        if (!stationById.has(id)) err(`Corridor ${c.id} references unknown station ${id}`);
        if (seen.has(id)) err(`Corridor ${c.id} lists ${id} twice`);
        seen.add(id);
        const st = stationById.get(id);
        if (st) {
          if (!st.corridorIds.includes(c.id)) err(`Station ${id} is in corridor ${c.id} sequence but its corridorIds omit it`);
          if (st.sequenceByCorridor[c.id] !== i + 1) err(`Station ${id} sequenceByCorridor[${c.id}] should be ${i + 1}`);
        }
      });
      if (c.sequence[c.sequence.length - 1] !== c.forwardTerminalId) err(`Corridor ${c.id} forward terminal is not the last station`);
      if (c.sequence[0] !== c.backwardTerminalId) err(`Corridor ${c.id} backward terminal is not the first station`);
      requireProvenance(`corridor ${c.id}`, c.sourceMetadata, err);
    }

    // Stations
    for (const s of ds.stations) {
      for (const cid of s.corridorIds) {
        if (!corridorIds.has(cid)) err(`Station ${s.id} references unknown corridor ${cid}`);
        else if (!corridorById.get(cid)!.sequence.includes(s.id)) err(`Station ${s.id} claims corridor ${cid} but is not in its sequence`);
      }
      if (s.corridorIds.length === 0) err(`Station ${s.id} belongs to no corridor`);
      if (s.isInterchange !== s.corridorIds.length > 1) err(`Station ${s.id} isInterchange does not match its corridor count`);
      if (s.isInterchange && !s.interchangeNote) warn(`Interchange station ${s.id} has no interchangeNote`);
      requireProvenance(`station ${s.id}`, s.sourceMetadata, err);
      const hasCoords = s.latitude !== null || s.longitude !== null;
      if (hasCoords && (s.latitude === null || s.longitude === null)) err(`Station ${s.id} has only one of latitude/longitude`);
      if (hasCoords && !['verified', 'estimated'].includes(s.coordinateStatus)) {
        err(`Station ${s.id} has coordinates but coordinateStatus is ${s.coordinateStatus}`);
      }
      if (!hasCoords && s.coordinateStatus !== 'unknown') err(`Station ${s.id} has no coordinates but coordinateStatus is ${s.coordinateStatus}`);
      if (hasCoords && !(s.latitude! > 22.8 && s.latitude! < 23.5 && s.longitude! > 72.3 && s.longitude! < 72.9)) {
        err(`Station ${s.id} coordinates are outside the Ahmedabad–Gandhinagar area`);
      }
      if (hasCoords && !s.coordinateSourceId) err(`Station ${s.id} has coordinates but no coordinateSourceId`);
      for (const l of s.lifts ?? []) {
        if (!ds.gates.some((g) => g.stationId === s.id && g.gateNumber === String(l.nearGate))) {
          err(`Station ${s.id}: lift ${l.lift} is near gate ${l.nearGate}, which is not a listed gate`);
        }
      }
      for (const p of s.platforms) {
        if (p.verificationStatus === 'verified' && !p.sourceUrl) err(`Platform ${p.id} is verified without a sourceUrl`);
      }
    }

    // Connections
    const connIds = new Set<string>();
    const connKey = new Set<string>();
    for (const c of ds.connections) {
      if (connIds.has(c.id)) err(`Duplicate connection id: ${c.id}`);
      connIds.add(c.id);
      connKey.add(`${c.fromStationId}>${c.toStationId}>${c.corridorId}`);
    }
    for (const c of ds.connections) {
      const a = stationById.get(c.fromStationId);
      const b = stationById.get(c.toStationId);
      const corr = corridorById.get(c.corridorId);
      if (!a || !b) {
        err(`Connection ${c.id} has an unknown endpoint`);
        continue;
      }
      if (!corr) {
        err(`Connection ${c.id} references unknown corridor ${c.corridorId}`);
        continue;
      }
      const sa = a.sequenceByCorridor[c.corridorId];
      const sb = b.sequenceByCorridor[c.corridorId];
      if (sa === undefined || sb === undefined) {
        err(`Connection ${c.id}: endpoints are not both in corridor ${c.corridorId}`);
        continue;
      }
      if (Math.abs(sa - sb) !== 1) err(`Connection ${c.id}: stations are not adjacent in corridor ${c.corridorId}`);
      const terminalId = sb > sa ? corr.forwardTerminalId : corr.backwardTerminalId;
      if (c.directionTerminalId !== terminalId) err(`Connection ${c.id}: directionTerminalId should be ${terminalId}`);
      const terminalName = stationById.get(terminalId)?.name;
      if (terminalName && c.direction !== `Towards ${terminalName}`) err(`Connection ${c.id}: direction label should be "Towards ${terminalName}"`);
      if (!connKey.has(`${c.toStationId}>${c.fromStationId}>${c.corridorId}`)) err(`Connection ${c.id} has no reverse connection`);
      if (c.estimatedTravelMinutes !== null && !(Number.isFinite(c.estimatedTravelMinutes) && c.estimatedTravelMinutes >= 0)) {
        err(`Connection ${c.id} has an invalid estimatedTravelMinutes`);
      }
      if (!STATUSES.includes(c.verificationStatus)) err(`Connection ${c.id} has an invalid verificationStatus`);
      if (c.verificationStatus === 'verified' && (!c.sourceUrl || !c.verifiedAt)) err(`Connection ${c.id} is verified without sourceUrl/verifiedAt`);
    }
    // Every consecutive pair in a corridor must be connected both ways.
    for (const c of ds.corridors) {
      for (let i = 0; i < c.sequence.length - 1; i++) {
        const a = c.sequence[i];
        const b = c.sequence[i + 1];
        if (!connKey.has(`${a}>${b}>${c.id}`) || !connKey.has(`${b}>${a}>${c.id}`)) {
          err(`Corridor ${c.id}: missing connection between ${a} and ${b}`);
        }
      }
    }

    // Connectivity
    if (ds.stations.length > 0) {
      const adj = new Map<string, string[]>();
      for (const s of ds.stations) adj.set(s.id, []);
      for (const c of ds.connections) adj.get(c.fromStationId)?.push(c.toStationId);
      const seen = new Set<string>([ds.stations[0].id]);
      const queue = [ds.stations[0].id];
      while (queue.length) {
        const cur = queue.shift()!;
        for (const n of adj.get(cur) ?? []) {
          if (!seen.has(n)) {
            seen.add(n);
            queue.push(n);
          }
        }
      }
      for (const s of ds.stations) if (!seen.has(s.id)) err(`Station ${s.id} is disconnected from the network`);
    }

    // Gates
    const gateById = new Map(ds.gates.map((g) => [g.id, g]));
    for (const g of ds.gates) {
      if (!stationById.has(g.stationId)) err(`Gate ${g.id} references unknown station ${g.stationId}`);
      if (g.verifiedDirection !== null && g.verificationStatus !== 'verified') err(`Gate ${g.id} has a direction but is not verified`);
      if (g.verificationStatus === 'verified' && !g.sourceUrl) err(`Gate ${g.id} is verified without a sourceUrl`);
    }

    // Landmarks
    for (const l of ds.landmarks) {
      if (!stationById.has(l.nearestStationId)) err(`Landmark ${l.id} references unknown station ${l.nearestStationId}`);
      if ((l.latitude === null) !== (l.longitude === null)) err(`Landmark ${l.id} has only one of latitude/longitude`);
      if (l.recommendedGateId !== null) {
        const g = gateById.get(l.recommendedGateId);
        if (!g) err(`Landmark ${l.id} recommends unknown gate ${l.recommendedGateId}`);
        else if (g.verificationStatus !== 'verified' || g.verifiedDirection === null) err(`Landmark ${l.id} recommends a gate that is not verified`);
      }
      for (const v of [l.walkingDistanceMeters, l.walkingTimeMinutes]) {
        if (v !== null && !(Number.isFinite(v) && v >= 0)) err(`Landmark ${l.id} has an invalid walking value`);
      }
      if ((l.walkingDistanceMeters !== null || l.walkingTimeMinutes !== null) && l.verificationStatus === 'unknown') {
        err(`Landmark ${l.id} has walking data but status unknown`);
      }
    }

    // Fares
    for (const p of ds.fares.pairs) {
      if (!stationById.has(p.fromStationId) || !stationById.has(p.toStationId)) err(`Fare pair ${p.fromStationId}-${p.toStationId} references an unknown station`);
      if (!(Number.isFinite(p.amountInr) && p.amountInr >= 0)) err(`Fare pair ${p.fromStationId}-${p.toStationId} has an invalid amount`);
      if (p.verificationStatus === 'verified' && (!p.sourceUrl || !p.verifiedAt)) err(`Fare pair ${p.fromStationId}-${p.toStationId} is verified without provenance`);
    }
    if (ds.fares.status === 'available' && ds.fares.pairs.length === 0) err('Fares marked available but no verified fare pairs are present');
    if (ds.fares.pairs.length === 0) warn('No verified fares: every route will show "Fare unavailable offline".');

    // Timetable
    for (const line of ds.timetable.lines) {
      if (!corridorIds.has(line.corridorId)) err(`Timetable ${line.id} references unknown corridor ${line.corridorId}`);
      for (const id of [...line.stationIds, ...line.terminalStationIds]) {
        if (!stationIds.has(id)) err(`Timetable ${line.id} references unknown station ${id}`);
      }
      if (!(line.endToEndMinutes > 0)) err(`Timetable ${line.id} has a non-positive end-to-end time`);
      if (!(line.distanceKm > 0)) err(`Timetable ${line.id} has a non-positive distance`);
      for (const t of [...line.firstTrain, ...line.lastTrain]) {
        if (!TIME.test(t.time)) err(`Timetable ${line.id} has an invalid time "${t.time}"`);
        if (!stationIds.has(t.stationId)) err(`Timetable ${line.id} time references unknown station ${t.stationId}`);
      }
      for (const f of line.frequency) {
        if (f.minutes !== null && !(f.minutes > 0)) err(`Timetable ${line.id} has a non-positive frequency`);
      }
    }
    if (ds.timetable.isLive !== false) err('Timetable must be flagged as static (isLive: false)');

    // Dataset info
    if (ds.info.stationCount !== ds.stations.length) err(`dataset.json stationCount (${ds.info.stationCount}) does not match stations (${ds.stations.length})`);
  } catch (e) {
    err(`Validation crashed: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { errors, warnings, ok: errors.length === 0 };
}

function requireProvenance(
  label: string,
  meta: { sourceId: string; sourceUrl: string | null; verifiedAt: string | null; verificationStatus: VerificationStatus } | undefined,
  err: (m: string) => void,
) {
  if (!meta) {
    err(`${label} has no sourceMetadata`);
    return;
  }
  if (!STATUSES.includes(meta.verificationStatus)) err(`${label} has an invalid verificationStatus`);
  if (meta.verificationStatus === 'verified' && (!meta.sourceUrl || !meta.verifiedAt)) err(`${label} is verified without sourceUrl/verifiedAt`);
}
