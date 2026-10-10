// Turns a capture of GMRC's own fare calculator (route-and-fares page) into fare pairs.
//
// Self-contained on purpose (no imports, only erasable TypeScript) so that both the Jest tests
// and the Node CLI (scripts/import-fares.mjs, via Node's built-in type stripping) can use it.
//
// The calculator is called by that page with:
//   POST /ahmedabad/wp-admin/admin-ajax.php   action=get_fare&FromStation=2&ToStation=8
// and answers, for example:
//   {"fare_price":"10","station_count":"7","search_found":"Yes","station_interchange":"0",
//    "station_km":"7.10","station_min":"14","msg":"","same_station_msg":""}

export interface RawFare {
  fare_price?: string | number;
  station_count?: string | number;
  search_found?: string;
  station_interchange?: string | number;
  station_km?: string | number;
  station_min?: string | number;
  msg?: string;
  same_station_msg?: string;
}

export interface CaptureStation {
  /** The calculator's own station id (the <option> value), e.g. "2". */
  id: string;
  name: string;
}

export interface CaptureResult {
  from: string;
  to: string;
  res: RawFare;
}

export interface Capture {
  capturedAt: string;
  source: string;
  stations: CaptureStation[];
  results: CaptureResult[];
}

export interface OurStation {
  id: string;
  name: string;
  aliases: string[];
}

export interface ParsedFare {
  fare: number;
  km: number | null;
  minutes: number | null;
  stationCount: number | null;
  interchanges: number | null;
}

export interface ImportedPair extends ParsedFare {
  fromStationId: string;
  toStationId: string;
}

export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // "Rly" and "Railway" are the SAME word, but must be kept: "Sabarmati" and "Sabarmati Railway
    // Station" are different stations. Only the generic words "metro" and "station" are dropped.
    .replace(/\brly\b/g, 'railway')
    .replace(/\bmetro\b|\bstation\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export interface StationMatch {
  /** calculator id -> our station id */
  map: Map<string, string>;
  unmatched: CaptureStation[];
  ambiguous: { station: CaptureStation; candidates: string[] }[];
}

/**
 * Matches calculator stations to ours by normalised name or alias. `overrides` ({"12": "OHCI"})
 * wins over matching. Names that match nothing, or more than one station, are reported, never guessed.
 */
export function matchStations(capture: CaptureStation[], ours: OurStation[], overrides: Record<string, string> = {}): StationMatch {
  const index = new Map<string, Set<string>>();
  const add = (key: string, id: string) => {
    if (!key) return;
    if (!index.has(key)) index.set(key, new Set());
    index.get(key)!.add(id);
  };
  for (const s of ours) {
    add(normalizeName(s.name), s.id);
    for (const a of s.aliases) add(normalizeName(a), s.id);
  }
  const ids = new Set(ours.map((s) => s.id));
  const map = new Map<string, string>();
  const unmatched: CaptureStation[] = [];
  const ambiguous: StationMatch['ambiguous'] = [];
  for (const st of capture) {
    const forced = overrides[st.id];
    if (forced) {
      if (!ids.has(forced)) throw new Error(`Override ${st.id}=${forced} is not a known station id`);
      map.set(st.id, forced);
      continue;
    }
    const hits = index.get(normalizeName(st.name));
    if (!hits || hits.size === 0) unmatched.push(st);
    else if (hits.size > 1) ambiguous.push({ station: st, candidates: [...hits] });
    else map.set(st.id, [...hits][0]);
  }
  // Two calculator stations must never map to one of ours.
  const seen = new Map<string, string>();
  for (const [calcId, ourId] of map) {
    if (seen.has(ourId)) throw new Error(`Calculator stations ${seen.get(ourId)} and ${calcId} both map to ${ourId}`);
    seen.set(ourId, calcId);
  }
  return { map, unmatched, ambiguous };
}

const num = (v: unknown): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};

/** Returns null unless the calculator found a route and returned a sane fare. */
export function parseRawFare(res: RawFare): ParsedFare | null {
  if (!res || String(res.search_found ?? '').toLowerCase() !== 'yes') return null;
  const fare = num(res.fare_price);
  if (fare === null || fare < 0) return null;
  const km = num(res.station_km);
  const minutes = num(res.station_min);
  const count = num(res.station_count);
  const interchanges = num(res.station_interchange);
  return {
    fare,
    km: km !== null && km >= 0 ? km : null,
    minutes: minutes !== null && minutes >= 0 ? minutes : null,
    stationCount: count !== null && count >= 0 ? count : null,
    interchanges: interchanges !== null && interchanges >= 0 ? interchanges : null,
  };
}

export interface BuildResult {
  pairs: ImportedPair[];
  skipped: { from: string; to: string; reason: string }[];
  /** true only when at least `minReverseSamples` reversed pairs were captured and ALL agree. */
  symmetric: boolean;
  reverseSamples: number;
  asymmetric: { from: string; to: string; fare: number; reverseFare: number }[];
}

export function buildPairs(capture: Capture, map: Map<string, string>, minReverseSamples = 10): BuildResult {
  const pairs: ImportedPair[] = [];
  const skipped: BuildResult['skipped'] = [];
  const byKey = new Map<string, ImportedPair>();
  for (const r of capture.results) {
    const from = map.get(r.from);
    const to = map.get(r.to);
    if (!from || !to) {
      skipped.push({ from: r.from, to: r.to, reason: 'station not matched' });
      continue;
    }
    if (from === to) {
      skipped.push({ from: r.from, to: r.to, reason: 'same station' });
      continue;
    }
    const parsed = parseRawFare(r.res);
    if (!parsed) {
      skipped.push({ from: r.from, to: r.to, reason: 'no fare returned' });
      continue;
    }
    const key = `${from}>${to}`;
    if (byKey.has(key)) continue; // keep the first capture of a pair
    const p: ImportedPair = { fromStationId: from, toStationId: to, ...parsed };
    byKey.set(key, p);
    pairs.push(p);
  }
  let reverseSamples = 0;
  const asymmetric: BuildResult['asymmetric'] = [];
  for (const p of pairs) {
    const rev = byKey.get(`${p.toStationId}>${p.fromStationId}`);
    if (!rev) continue;
    // count each unordered pair once
    if (p.fromStationId > p.toStationId) continue;
    reverseSamples++;
    if (rev.fare !== p.fare) asymmetric.push({ from: p.fromStationId, to: p.toStationId, fare: p.fare, reverseFare: rev.fare });
  }
  return { pairs, skipped, symmetric: reverseSamples >= minReverseSamples && asymmetric.length === 0, reverseSamples, asymmetric };
}
