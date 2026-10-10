import { bboxOf, flatMetres, makeProjector, pointSegmentDistance, unionBBox } from '../geoProject';

const bb = { minLat: 22.8, maxLat: 23.35, minLon: 72.25, maxLon: 72.87 };

describe('geoProject', () => {
  it('round-trips points through project / unproject', () => {
    const p = makeProjector(bb, 1200, 20);
    for (const [lat, lon] of [[22.8, 72.25], [23.35, 72.87], [23.03, 72.58]] as const) {
      const [x, y] = p.project(lat, lon);
      const [la, lo] = p.unproject(x, y);
      expect(la).toBeCloseTo(lat, 9);
      expect(lo).toBeCloseTo(lon, 9);
    }
  });
  it('fits the long side to the requested size and keeps north up, east right', () => {
    const p = makeProjector(bb, 1200, 20);
    expect(Math.max(p.width, p.height)).toBeCloseTo(1200, 6);
    const [x0, y0] = p.project(bb.minLat, bb.minLon);
    const [x1, y1] = p.project(bb.maxLat, bb.maxLon);
    expect(x1).toBeGreaterThan(x0);
    expect(y1).toBeLessThan(y0);
  });
  it('keeps distances roughly isotropic (cos latitude) and reports metres per unit', () => {
    const p = makeProjector(bb, 1200, 0);
    const [ax, ay] = p.project(23.0, 72.5);
    const [bx, by] = p.project(23.01, 72.5);
    const [cx, cy] = p.project(23.0, 72.51);
    const north = Math.hypot(bx - ax, by - ay) * p.metresPerUnit;
    const east = Math.hypot(cx - ax, cy - ay) * p.metresPerUnit;
    expect(north).toBeCloseTo(flatMetres(23.0, 72.5, 23.01, 72.5), -1);
    expect(east).toBeCloseTo(flatMetres(23.0, 72.5, 23.0, 72.51), -1);
  });
  it('bbox helpers', () => {
    expect(bboxOf([])).toBeNull();
    expect(bboxOf([[1, 2], [3, 0]])).toEqual({ minLat: 1, maxLat: 3, minLon: 0, maxLon: 2 });
    expect(unionBBox({ minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 }, { minLat: -1, maxLat: 0.5, minLon: 0.5, maxLon: 2 })).toEqual({ minLat: -1, maxLat: 1, minLon: 0, maxLon: 2 });
  });
  it('point-segment distance', () => {
    expect(pointSegmentDistance(5, 3, 0, 0, 10, 0)).toBe(3);
    expect(pointSegmentDistance(-4, 3, 0, 0, 10, 0)).toBe(5);
    expect(pointSegmentDistance(1, 1, 2, 2, 2, 2)).toBeCloseTo(Math.SQRT2);
  });
});
