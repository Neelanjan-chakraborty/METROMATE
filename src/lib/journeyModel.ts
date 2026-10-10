/**
 * Geometry of a planned journey, for the illustrated live-tracking canvas.
 *
 * What is real and what is drawn:
 *  - Station positions are the app's station pins (estimated, from an unofficial map, or positions
 *    recorded on this phone). They are projected to metres around the route's centre.
 *  - The track between two stations is drawn as a straight line with softened corners. GMRC's actual
 *    alignment is not in the data, so curves and the exact track shape are not known.
 *  - Tunnel sections follow the dataset's station types: a hop between two underground stations is
 *    underground; a hop between an underground and an elevated station has a portal whose position is
 *    NOT known, so it is placed at the middle of the hop and labelled approximate.
 */

const EARTH_R = 6371008.8;
const M_PER_DEG = (Math.PI / 180) * EARTH_R;
/** Corners are rounded with at most this radius so stations stay very close to the drawn track. */
const CORNER_M = 60;

export interface LatLonPoint {
  lat: number;
  lon: number;
}

export interface RouteStation {
  id: string;
  /** Metres east / south of the route centre (screen-style axes: y grows downwards). */
  x: number;
  y: number;
  /** Distance along the drawn path, in metres. */
  distM: number;
  underground: boolean;
}

export type HopKind = 'elevated' | 'tunnel' | 'portal';

export interface RouteHop {
  fromIdx: number;
  toIdx: number;
  startM: number;
  endM: number;
  lengthM: number;
  kind: HopKind;
  /** For 'portal' hops: the fraction range of the hop that is underground (an approximation). */
  tunnelRange: [number, number] | null;
}

export interface PathPoint {
  x: number;
  y: number;
  /** Distance along the path, metres. */
  s: number;
  /** Direction of travel in degrees: 0 = north (up), clockwise. Unwrapped so it is continuous. */
  heading: number;
}

export interface RouteGeometry {
  stations: RouteStation[];
  hops: RouteHop[];
  path: PathPoint[];
  totalM: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

interface V2 {
  x: number;
  y: number;
}

const sub = (a: V2, b: V2): V2 => ({ x: a.x - b.x, y: a.y - b.y });
const len = (a: V2) => Math.hypot(a.x, a.y);

/** Projects pins to a local metre grid. Returns null if any route station has no known position. */
export function projectRoute(ids: string[], coordOf: (id: string) => LatLonPoint | null | undefined): { id: string; x: number; y: number }[] | null {
  const pts: { id: string; lat: number; lon: number }[] = [];
  for (const id of ids) {
    const c = coordOf(id);
    if (!c || !Number.isFinite(c.lat) || !Number.isFinite(c.lon)) return null;
    pts.push({ id, lat: c.lat, lon: c.lon });
  }
  if (pts.length === 0) return [];
  const lat0 = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const lon0 = pts.reduce((s, p) => s + p.lon, 0) / pts.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  return pts.map((p) => ({ id: p.id, x: (p.lon - lon0) * M_PER_DEG * k, y: -(p.lat - lat0) * M_PER_DEG }));
}

function headingDeg(dx: number, dy: number): number {
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

/**
 * Builds the drawn path through the stations (straight runs, rounded corners), the per-station
 * distance along it, and the hop table. Returns null when station positions are missing.
 */
export function buildGeometry(ids: string[], coordOf: (id: string) => LatLonPoint | null | undefined, isUnderground: (id: string) => boolean): RouteGeometry | null {
  if (ids.length < 2) return null;
  const proj = projectRoute(ids, coordOf);
  if (!proj) return null;
  const n = proj.length;

  // Densified polyline with a note of which sample is each station.
  const raw: V2[] = [];
  const stationSample: number[] = new Array(n).fill(0);
  raw.push({ x: proj[0].x, y: proj[0].y });
  stationSample[0] = 0;
  for (let i = 1; i < n - 1; i++) {
    const a = proj[i - 1];
    const v = proj[i];
    const b = proj[i + 1];
    const din = sub(v, a);
    const dout = sub(b, v);
    const lin = len(din);
    const lout = len(dout);
    if (lin < 1 || lout < 1) {
      raw.push({ x: v.x, y: v.y });
      stationSample[i] = raw.length - 1;
      continue;
    }
    const uin = { x: din.x / lin, y: din.y / lin };
    const uout = { x: dout.x / lout, y: dout.y / lout };
    const cos = uin.x * uout.x + uin.y * uout.y;
    const r = Math.min(CORNER_M, 0.35 * lin, 0.35 * lout);
    if (cos > 0.9986 || r < 4) {
      raw.push({ x: v.x, y: v.y });
      stationSample[i] = raw.length - 1;
      continue;
    }
    const p1 = { x: v.x - uin.x * r, y: v.y - uin.y * r };
    const p2 = { x: v.x + uout.x * r, y: v.y + uout.y * r };
    const STEPS = 6;
    let mid = raw.length;
    for (let k = 0; k <= STEPS; k++) {
      const t = k / STEPS;
      const q = {
        x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * v.x + t * t * p2.x,
        y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * v.y + t * t * p2.y,
      };
      if (k === STEPS / 2) mid = raw.length;
      raw.push(q);
    }
    stationSample[i] = mid;
  }
  raw.push({ x: proj[n - 1].x, y: proj[n - 1].y });
  stationSample[n - 1] = raw.length - 1;

  const path: PathPoint[] = [];
  let s = 0;
  let prevHeading = 0;
  for (let i = 0; i < raw.length; i++) {
    if (i > 0) s += len(sub(raw[i], raw[i - 1]));
    const next = raw[Math.min(raw.length - 1, i + 1)];
    const prev = raw[Math.max(0, i - 1)];
    const d = i === raw.length - 1 ? sub(raw[i], prev) : sub(next, raw[i]);
    let h = headingDeg(d.x, d.y);
    if (i > 0) {
      while (h - prevHeading > 180) h -= 360;
      while (h - prevHeading < -180) h += 360;
    }
    prevHeading = h;
    path.push({ x: raw[i].x, y: raw[i].y, s, heading: h });
  }

  const stations: RouteStation[] = ids.map((id, i) => {
    const p = path[stationSample[i]];
    return { id, x: p.x, y: p.y, distM: p.s, underground: isUnderground(id) };
  });
  // Stations must be strictly increasing along the path.
  for (let i = 1; i < n; i++) if (stations[i].distM <= stations[i - 1].distM) stations[i].distM = stations[i - 1].distM + 1;

  const hops: RouteHop[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = stations[i];
    const b = stations[i + 1];
    const ua = a.underground;
    const ub = b.underground;
    const kind: HopKind = ua && ub ? 'tunnel' : ua || ub ? 'portal' : 'elevated';
    hops.push({
      fromIdx: i,
      toIdx: i + 1,
      startM: a.distM,
      endM: b.distM,
      lengthM: b.distM - a.distM,
      kind,
      tunnelRange: kind === 'portal' ? (ua ? [0, 0.5] : [0.5, 1]) : kind === 'tunnel' ? [0, 1] : null,
    });
  }

  const xs = path.map((p) => p.x);
  const ys = path.map((p) => p.y);
  return {
    stations,
    hops,
    path,
    totalM: path[path.length - 1].s,
    bounds: { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) },
  };
}

/** Distance along the path for a fractional station index (0 = origin, n-1 = destination). */
export function distanceAtProgress(geom: RouteGeometry, progress: number): number {
  const n = geom.stations.length;
  const p = Math.max(0, Math.min(n - 1, progress));
  const i = Math.min(n - 2, Math.floor(p));
  const t = p - i;
  return geom.stations[i].distM + t * (geom.stations[i + 1].distM - geom.stations[i].distM);
}

/** Point on the path at distance `s` (clamped). */
export function pointAtDistance(geom: RouteGeometry, s: number): PathPoint {
  const path = geom.path;
  if (s <= 0) return path[0];
  if (s >= geom.totalM) return path[path.length - 1];
  let lo = 0;
  let hi = path.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (path[mid].s <= s) lo = mid;
    else hi = mid;
  }
  const a = path[lo];
  const b = path[hi];
  const t = b.s === a.s ? 0 : (s - a.s) / (b.s - a.s);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s, heading: a.heading + (b.heading - a.heading) * t };
}

/** Is the point at fractional station index `progress` underground (per the dataset's station types)? */
export function isUndergroundAt(geom: RouteGeometry, progress: number): boolean {
  const n = geom.stations.length;
  const p = Math.max(0, Math.min(n - 1, progress));
  const i = Math.min(n - 2, Math.floor(p));
  const t = p - i;
  const hop = geom.hops[i];
  if (!hop) return false;
  if (t < 1e-6 && geom.stations[i].underground) return true;
  if (t > 1 - 1e-6 && geom.stations[i + 1].underground) return true;
  if (!hop.tunnelRange) return false;
  return t >= hop.tunnelRange[0] && t <= hop.tunnelRange[1];
}

/** Hops of the route that have any underground part. */
export function tunnelHopIndexes(geom: RouteGeometry): number[] {
  return geom.hops.filter((h) => h.kind !== 'elevated').map((h) => h.fromIdx);
}

/** The part of the path between two distances, as points (ends interpolated). */
export function pathBetween(geom: RouteGeometry, s0: number, s1: number): PathPoint[] {
  const a = Math.max(0, Math.min(s0, s1));
  const b = Math.min(geom.totalM, Math.max(s0, s1));
  const out: PathPoint[] = [pointAtDistance(geom, a)];
  for (const p of geom.path) if (p.s > a && p.s < b) out.push(p);
  out.push(pointAtDistance(geom, b));
  return out;
}
