/**
 * Equirectangular projection for the offline Bus & metro map. There are no base tiles offline, so the map is
 * just lines and dots drawn in a local flat frame: x grows east (scaled by cos(latitude) so distances look
 * right), y grows south. Good enough for a 60 km area; not a general-purpose projection.
 */

export interface BBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface Projector {
  width: number;
  height: number;
  bbox: BBox;
  /** Map units per degree of latitude. */
  k: number;
  project(lat: number, lon: number): [number, number];
  unproject(x: number, y: number): [number, number];
  /** Metres on the ground per map unit. */
  metresPerUnit: number;
}

const M_PER_DEG = 111_320;

export function bboxOf(points: Iterable<readonly [number, number]>): BBox | null {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const [lat, lon] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  return minLat === Infinity ? null : { minLat, maxLat, minLon, maxLon };
}

export function unionBBox(a: BBox, b: BBox): BBox {
  return { minLat: Math.min(a.minLat, b.minLat), maxLat: Math.max(a.maxLat, b.maxLat), minLon: Math.min(a.minLon, b.minLon), maxLon: Math.max(a.maxLon, b.maxLon) };
}

/** Projector whose longer side is `longSide` map units, with `pad` units of margin all round. */
export function makeProjector(bbox: BBox, longSide: number, pad = 0): Projector {
  const kx = Math.cos((((bbox.minLat + bbox.maxLat) / 2) * Math.PI) / 180);
  const wDeg = Math.max(1e-9, (bbox.maxLon - bbox.minLon) * kx);
  const hDeg = Math.max(1e-9, bbox.maxLat - bbox.minLat);
  const k = (longSide - 2 * pad) / Math.max(wDeg, hDeg);
  return {
    width: wDeg * k + 2 * pad,
    height: hDeg * k + 2 * pad,
    bbox,
    k,
    metresPerUnit: M_PER_DEG / k,
    project: (lat, lon) => [pad + (lon - bbox.minLon) * kx * k, pad + (bbox.maxLat - lat) * k],
    unproject: (x, y) => [bbox.maxLat - (y - pad) / k, bbox.minLon + (x - pad) / (kx * k)],
  };
}

/** Ground distance in metres between two points (flat-earth, fine at city scale). */
export function flatMetres(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const kx = Math.cos((((aLat + bLat) / 2) * Math.PI) / 180);
  return Math.hypot((bLat - aLat) * M_PER_DEG, (bLon - aLon) * M_PER_DEG * kx);
}

/** Distance from point p to segment ab, all in the same flat units. */
export function pointSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
