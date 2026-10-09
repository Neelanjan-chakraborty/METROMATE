export interface LatLon {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_M = 6371008.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversineM(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface SegmentProjection {
  /** Position of the closest point along a→b, 0 (at a) to 1 (at b). */
  t: number;
  /** Distance from the point to that closest point, in metres. */
  distanceM: number;
}

/**
 * Projects `p` onto the segment a→b using a local flat-earth approximation,
 * which is accurate to well under a metre over the few kilometres between
 * adjacent metro stations.
 */
export function projectOnSegment(p: LatLon, a: LatLon, b: LatLon): SegmentProjection {
  const refLat = toRad((a.lat + b.lat) / 2);
  const mPerDegLat = (Math.PI / 180) * EARTH_RADIUS_M;
  const mPerDegLon = mPerDegLat * Math.cos(refLat);
  const ax = 0;
  const ay = 0;
  const bx = (b.lon - a.lon) * mPerDegLon;
  const by = (b.lat - a.lat) * mPerDegLat;
  const px = (p.lon - a.lon) * mPerDegLon;
  const py = (p.lat - a.lat) * mPerDegLat;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return { t, distanceM: Math.hypot(px - cx, py - cy) };
}

export function isValidLatLon(p: { lat: number; lon: number }): boolean {
  return Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180;
}
