import type { TransitData } from './types.ts';

/*
 * GTFS -> compact transit data. Pure (no file access) so it can be tested with a small fixture; the CLI is
 * scripts/build-transit.mjs. Written without TS-only runtime syntax (no enums) so Node can run it directly.
 */

// ------------------------------------------------------------------- csv

/** Parses CSV text into row objects. Handles quoted fields, doubled quotes and a BOM. */
export function parseCsv(text: string): Record<string, string>[] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = src.split(/\r?\n/);
  const head = splitLine(lines[0] ?? '');
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cells = splitLine(line);
    const row: Record<string, string> = {};
    for (let c = 0; c < head.length; c++) row[head[c]] = cells[c] ?? '';
    rows.push(row);
  }
  return rows;
}

function splitLine(line: string): string[] {
  if (line.indexOf('"') < 0) return line.split(',');
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** "HH:MM:SS" (hours may exceed 23) -> minutes since the service day began, or null. */
export function gtfsMinutes(t: string): number | null {
  const m = /^(\d{1,3}):(\d{2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 60;
}

function haversineM(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const r = Math.PI / 180;
  const dLat = (bLat - aLat) * r;
  const dLon = (bLon - aLon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// ----------------------------------------------------------------- build

export interface BuildInput {
  files: Record<string, string>;
  stations: { id: string; latitude: number | null; longitude: number | null }[];
  sources: { name: string; sha256: string }[];
  /** Largest end-to-end trip time kept, in minutes. Longer vectors are reported and dropped. */
  maxTripMinutes?: number;
  /** Station -> stop link radius and stop -> stop radius, metres. */
  stationRadiusM?: number;
  stopRadiusM?: number;
}

const ymd = (s: string) => (s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : s);

export function buildTransit(input: BuildInput): TransitData {
  const maxTrip = input.maxTripMinutes ?? 360;
  const stationR = input.stationRadiusM ?? 600;
  const stopR = input.stopRadiusM ?? 250;
  const F = input.files;
  const need = (n: string) => {
    if (F[n] === undefined) throw new Error(`GTFS file missing: ${n}`);
    return F[n];
  };
  const report: string[] = [];

  // --- calendar: the planner assumes the same service every day, so refuse anything else
  const calendar = parseCsv(need('calendar.txt'));
  if (calendar.length !== 1) throw new Error(`Expected exactly one calendar service, found ${calendar.length}`);
  const cal = calendar[0];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  if (!days.every((d) => cal[d] === '1')) throw new Error('The calendar service does not run every day; the planner assumes it does');
  if (F['calendar_dates.txt'] && parseCsv(F['calendar_dates.txt']).length > 0) throw new Error('calendar_dates.txt has exceptions; not supported');
  const serviceId = cal.service_id;
  const feedInfo = parseCsv(need('feed_info.txt'))[0] ?? {};

  // --- agencies, routes
  const agencyRows = parseCsv(need('agency.txt'));
  const agencies = agencyRows.map((a) => ({ id: a.agency_id as 'AMTS' | 'AJL' | 'GTSL', name: a.agency_name, url: a.agency_url }));
  const agencyIdx = new Map(agencies.map((a, i) => [a.id as string, i]));
  const routeRows = parseCsv(need('routes.txt'));
  const routeIdx = new Map<string, number>();
  const routes = { id: [] as string[], agency: [] as number[], short: [] as string[], long: [] as string[] };
  for (const r of routeRows) {
    const ai = agencyIdx.get(r.agency_id);
    if (ai === undefined) throw new Error(`Route ${r.route_id} has unknown agency ${r.agency_id}`);
    routeIdx.set(r.route_id, routes.id.length);
    routes.id.push(r.route_id);
    routes.agency.push(ai);
    routes.short.push(r.route_short_name);
    routes.long.push(r.route_long_name);
  }

  // --- stops (only those used by some trip are kept, in file order)
  const stopRows = parseCsv(need('stops.txt'));
  const stopById = new Map(stopRows.map((s) => [s.stop_id, s]));

  // --- trips
  const tripRows = parseCsv(need('trips.txt'));
  const tripInfo = new Map<string, { route: number; dir: number }>();
  for (const t of tripRows) {
    if (t.service_id !== serviceId) throw new Error(`Trip ${t.trip_id} uses service ${t.service_id}, expected ${serviceId}`);
    const ri = routeIdx.get(t.route_id);
    if (ri === undefined) throw new Error(`Trip ${t.trip_id} has unknown route ${t.route_id}`);
    tripInfo.set(t.trip_id, { route: ri, dir: t.direction_id === '1' ? 1 : 0 });
  }

  // --- stop_times grouped by trip
  const stRows = parseCsv(need('stop_times.txt'));
  const perTrip = new Map<string, { seq: number; stop: string; dep: number }[]>();
  let dwell = 0;
  for (const r of stRows) {
    if (!tripInfo.has(r.trip_id)) throw new Error(`stop_times references unknown trip ${r.trip_id}`);
    if (!stopById.has(r.stop_id)) throw new Error(`stop_times references unknown stop ${r.stop_id}`);
    const dep = gtfsMinutes(r.departure_time);
    if (dep === null) throw new Error(`Bad time "${r.departure_time}" on trip ${r.trip_id}`);
    if (r.arrival_time !== r.departure_time) dwell++;
    let list = perTrip.get(r.trip_id);
    if (!list) perTrip.set(r.trip_id, (list = []));
    list.push({ seq: Number(r.stop_sequence), stop: r.stop_id, dep });
  }
  report.push(`stop_times rows: ${stRows.length}; arrival differs from departure on ${dwell} rows (departure times are used)`);

  // --- patterns
  type Pat = { route: number; dir: number; stops: string[]; vecKey: Map<string, number>; vectors: number[][]; trips: Map<string, number> };
  const pats = new Map<string, Pat>();
  let trips = 0;
  let dupes = 0;
  let over24 = 0;
  const dropped: string[] = [];
  const stopAgencies = new Map<string, number>();
  for (const [tid, rows] of perTrip) {
    rows.sort((a, b) => a.seq - b.seq);
    const info = tripInfo.get(tid)!;
    const base = rows[0].dep;
    const start = Math.round(base);
    const vec = rows.map((r) => Math.round(r.dep - base));
    for (let i = 1; i < vec.length; i++) if (vec[i] < vec[i - 1]) throw new Error(`Trip ${tid} goes back in time`);
    if (vec[vec.length - 1] > maxTrip) {
      dropped.push(`${tid} (${routes.short[info.route]}, ${vec[vec.length - 1]} min end to end)`);
      continue;
    }
    const stopsKey = rows.map((r) => r.stop);
    const key = `${info.route}|${info.dir}|${stopsKey.join(',')}`;
    let p = pats.get(key);
    if (!p) pats.set(key, (p = { route: info.route, dir: info.dir, stops: stopsKey, vecKey: new Map(), vectors: [], trips: new Map() }));
    const vk = vec.join(',');
    let vi = p.vecKey.get(vk);
    if (vi === undefined) {
      vi = p.vectors.length;
      p.vecKey.set(vk, vi);
      p.vectors.push(vec);
    }
    const tk = `${start}|${vi}`;
    if (p.trips.has(tk)) {
      dupes++;
      continue;
    }
    p.trips.set(tk, start);
    trips++;
    if (start + vec[vec.length - 1] >= 1440) over24++;
    const bit = 1 << routes.agency[info.route];
    for (const s of stopsKey) stopAgencies.set(s, (stopAgencies.get(s) ?? 0) | bit);
  }
  if (dropped.length) report.push(`dropped ${dropped.length} trip(s) longer than ${maxTrip} min end to end: ${dropped.slice(0, 5).join('; ')}${dropped.length > 5 ? '…' : ''}`);
  report.push(`trips kept: ${trips}; exact duplicate trips removed: ${dupes}; trips reaching past 24:00: ${over24}`);

  // --- stops actually used
  const stopOrder = stopRows.filter((s) => stopAgencies.has(s.stop_id));
  const stopIndex = new Map(stopOrder.map((s, i) => [s.stop_id, i]));
  const areaRows = parseCsv(need('areas.txt'));
  const areaIdx = new Map(areaRows.map((a, i) => [a.area_id, i]));
  const stopArea = new Map<string, number>();
  for (const sa of parseCsv(need('stop_areas.txt'))) {
    const ai = areaIdx.get(sa.area_id);
    if (ai !== undefined) stopArea.set(sa.stop_id, ai);
  }
  const stops = {
    id: stopOrder.map((s) => s.stop_id),
    name: stopOrder.map((s) => s.stop_name.trim()),
    lat: stopOrder.map((s) => Math.round(Number(s.stop_lat) * 1e5) / 1e5),
    lon: stopOrder.map((s) => Math.round(Number(s.stop_lon) * 1e5) / 1e5),
    agencies: stopOrder.map((s) => stopAgencies.get(s.stop_id)!),
    area: stopOrder.map((s) => stopArea.get(s.stop_id) ?? -1),
  };
  if (stops.lat.some((v) => !Number.isFinite(v)) || stops.lon.some((v) => !Number.isFinite(v))) throw new Error('A stop has no coordinates');
  report.push(`stops used: ${stops.id.length} of ${stopRows.length} in stops.txt`);

  // --- patterns -> columnar
  const patterns = { route: [] as number[], dir: [] as number[], stops: [] as number[][], vectors: [] as number[][][], startT: [] as number[][], startV: [] as number[][] };
  const patList = [...pats.values()].sort((a, b) => a.route - b.route || a.dir - b.dir || (a.stops.join() < b.stops.join() ? -1 : 1));
  let vectorCount = 0;
  for (const p of patList) {
    const order = [...p.trips.keys()].map((k) => {
      const [s, v] = k.split('|').map(Number);
      return [s, v] as [number, number];
    });
    order.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    patterns.route.push(p.route);
    patterns.dir.push(p.dir);
    patterns.stops.push(p.stops.map((s) => stopIndex.get(s)!));
    patterns.vectors.push(p.vectors);
    patterns.startT.push(order.map((o) => o[0]));
    patterns.startV.push(order.map((o) => o[1]));
    vectorCount += p.vectors.length;
  }

  // --- BRTS fares
  const areas = areaRows.map((a) => a.area_name);
  const products = new Map<string, { rider: string; amount: number }>();
  for (const p of parseCsv(need('fare_products.txt'))) products.set(p.fare_product_id, { rider: p.rider_category_id, amount: Number(p.amount) });
  const legs = new Map<string, { adult?: number; child?: number }>();
  for (const r of parseCsv(need('fare_leg_rules.txt'))) {
    const p = products.get(r.fare_product_id);
    if (!p || (p.rider !== 'BRTS_ADULT' && p.rider !== 'BRTS_CHILD')) continue;
    const k = `${r.from_area_id}|${r.to_area_id}`;
    const e = legs.get(k) ?? {};
    if (p.rider === 'BRTS_ADULT') e.adult = p.amount;
    else e.child = p.amount;
    legs.set(k, e);
  }
  const adultAmounts = [...new Set([...legs.values()].map((v) => v.adult).filter((v): v is number => v !== undefined))].sort((a, b) => a - b);
  const childFor = new Map<number, number>();
  for (const v of legs.values()) {
    if (v.adult === undefined || v.child === undefined) continue;
    const had = childFor.get(v.adult);
    if (had !== undefined && had !== v.child) throw new Error(`Adult fare ${v.adult} maps to more than one child fare`);
    childFor.set(v.adult, v.child);
  }
  if (adultAmounts.length > 36) throw new Error('Too many fare products for a base-36 matrix');
  const n = areas.length;
  let matrix = '';
  let asym = 0;
  let missing = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const e = legs.get(`${areaRows[i].area_id}|${areaRows[j].area_id}`);
      if (!e || e.adult === undefined) {
        matrix += '-';
        if (i !== j) missing++;
        continue;
      }
      matrix += adultAmounts.indexOf(e.adult).toString(36);
      const back = legs.get(`${areaRows[j].area_id}|${areaRows[i].area_id}`);
      if (back && back.adult !== e.adult) asym++;
    }
  }
  report.push(`BRTS fare areas: ${n}; products: ${adultAmounts.join('/')}; pairs without a fare (excluding same-area): ${missing}; asymmetric pairs: ${asym}`);

  // --- links
  const stationPts = input.stations.filter((s) => s.latitude !== null && s.longitude !== null) as { id: string; latitude: number; longitude: number }[];
  const stationStop: TransitData['links']['stationStop'] = [];
  for (const st of stationPts) {
    for (let i = 0; i < stops.id.length; i++) {
      if (Math.abs(stops.lat[i] - st.latitude) > 0.008 || Math.abs(stops.lon[i] - st.longitude) > 0.008) continue;
      const m = haversineM(st.latitude, st.longitude, stops.lat[i], stops.lon[i]);
      if (m <= stationR) stationStop.push({ station: st.id, stop: i, m: Math.round(m), named: /metro/i.test(stops.name[i]) });
    }
  }
  stationStop.sort((a, b) => (a.station < b.station ? -1 : a.station > b.station ? 1 : a.m - b.m));
  const grid = new Map<string, number[]>();
  const cell = (la: number, lo: number) => `${Math.floor(la / 0.003)}|${Math.floor(lo / 0.003)}`;
  stops.id.forEach((_, i) => {
    const k = cell(stops.lat[i], stops.lon[i]);
    const g = grid.get(k);
    if (g) g.push(i);
    else grid.set(k, [i]);
  });
  const stopStop: [number, number, number][] = [];
  for (let i = 0; i < stops.id.length; i++) {
    const cx = Math.floor(stops.lat[i] / 0.003);
    const cy = Math.floor(stops.lon[i] / 0.003);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const j of grid.get(`${cx + dx}|${cy + dy}`) ?? []) {
          if (j <= i) continue;
          const m = haversineM(stops.lat[i], stops.lon[i], stops.lat[j], stops.lon[j]);
          if (m <= stopR) stopStop.push([i, j, Math.round(m)]);
        }
      }
    }
  }
  stopStop.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const withLink = new Set(stationStop.map((l) => l.station));
  const without = stationPts.filter((s) => !withLink.has(s.id)).map((s) => s.id);
  report.push(`metro stations with a bus stop within ${stationR} m: ${withLink.size} of ${stationPts.length}; without: ${without.join(', ') || 'none'}`);
  report.push(`stop-to-stop walking links within ${stopR} m: ${stopStop.length}`);

  return {
    meta: {
      schema: 1,
      source: {
        name: 'GTFS feed supplied by the project team (BLRTransit compilation of AMTS, AJL/BRTS Janmarg and GTSL services)',
        publisher: feedInfo.feed_publisher_name ?? 'unknown',
        publisherUrl: feedInfo.feed_publisher_url ?? '',
        validFrom: ymd(feedInfo.feed_start_date ?? cal.start_date),
        validTo: ymd(feedInfo.feed_end_date ?? cal.end_date),
        files: input.sources.map((s) => ({ name: s.name, sha256: s.sha256 })),
        notes: [
          'Third-party compilation, not an official publication of AMTS, AJL or GTSL; licence not stated.',
          'Scheduled times only; there is no live vehicle data.',
          'Only BRTS (AJL) fares are in the feed.',
          'The same service runs every day of the feed period.',
        ],
      },
      counts: { stops: stops.id.length, routes: routes.id.length, patterns: patterns.route.length, trips, stopTimes: stRows.length, vectors: vectorCount, stationLinks: stationStop.length, stopLinks: stopStop.length },
      report,
    },
    agencies,
    stops,
    routes,
    patterns,
    fares: { areas, adult: adultAmounts, child: adultAmounts.map((a) => childFor.get(a) ?? 0), matrix },
    links: { stopStop, stationStop },
  };
}
