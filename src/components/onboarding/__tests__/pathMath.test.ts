import { buildTrack, distanceOfNearest, pointAt, roundedPolyline, sliceTrack, smoothClosed, stage, stageOut, toPathD, type Pt } from '../motion/pathMath';

const L: Pt[] = [[0, 0], [100, 0], [100, 50]];

describe('track geometry', () => {
  it('measures a polyline', () => {
    const t = buildTrack(L);
    expect(t.total).toBe(150);
    expect(t.cum).toEqual([0, 100, 150]);
  });
  it('finds position and heading along it, clamped at the ends', () => {
    const t = buildTrack(L);
    expect(pointAt(t, 0)).toEqual([0, 0, 0]);
    const [x, y, a] = pointAt(t, 50);
    expect([x, y, a]).toEqual([50, 0, 0]);
    const [x2, y2, a2] = pointAt(t, 125);
    expect([x2, y2]).toEqual([100, 25]);
    expect(a2).toBeCloseTo(Math.PI / 2);
    expect(pointAt(t, -5)[0]).toBe(0);
    expect(pointAt(t, 999).slice(0, 2)).toEqual([100, 50]);
  });
  it('handles a single point and zero-length segments', () => {
    expect(pointAt(buildTrack([[3, 4]]), 10)).toEqual([3, 4, 0]);
    const t = buildTrack([[0, 0], [0, 0], [10, 0]]);
    expect(pointAt(t, 5)[0]).toBeCloseTo(5);
  });
  it('rounded corners keep the ends, stay inside the corner and shorten the path', () => {
    const r = roundedPolyline(L, 20);
    expect(r[0]).toEqual([0, 0]);
    expect(r[r.length - 1]).toEqual([100, 50]);
    expect(buildTrack(r).total).toBeLessThan(150);
    for (const [x, y] of r) {
      expect(x).toBeLessThanOrEqual(100.0001);
      expect(y).toBeGreaterThanOrEqual(-0.0001);
    }
    expect(roundedPolyline([[0, 0], [5, 5]], 10)).toEqual([[0, 0], [5, 5]]);
  });
  it('slices a track and writes an SVG path', () => {
    const t = buildTrack(L);
    const s = sliceTrack(t, 50, 125);
    expect(s[0]).toEqual([50, 0]);
    expect(s[s.length - 1]).toEqual([100, 25]);
    expect(s).toContainEqual([100, 0]);
    expect(toPathD([[0, 0], [1.25, 2]])).toBe('M0.0 0.0L1.3 2.0');
  });
  it('places a point on the route by nearest distance', () => {
    const t = buildTrack(L);
    expect(distanceOfNearest(t, 40, 10)).toBeCloseTo(40);
    expect(distanceOfNearest(t, 110, 30)).toBeCloseTo(130);
  });
  it('draws a smooth closed loop through every stop', () => {
    const pts: Pt[] = [[0, 0], [100, 0], [100, 60], [0, 60]];
    const c = smoothClosed(pts, 10);
    expect(c).toHaveLength(41);
    expect(c[0]).toEqual([0, 0]);
    expect(c[c.length - 1]).toEqual([0, 0]);
    for (let i = 0; i < pts.length; i++) expect(c[i * 10]).toEqual(pts[i]);
    // no sharp corners: neighbouring samples never turn more than 30 degrees
    for (let i = 1; i < c.length - 1; i++) {
      const a = Math.atan2(c[i][1] - c[i - 1][1], c[i][0] - c[i - 1][0]);
      const b = Math.atan2(c[i + 1][1] - c[i][1], c[i + 1][0] - c[i][0]);
      let d = Math.abs(b - a);
      if (d > Math.PI) d = 2 * Math.PI - d;
      expect(d).toBeLessThan(Math.PI / 6);
    }
    expect(smoothClosed([[0, 0], [1, 1]])).toEqual([[0, 0], [1, 1]]);
  });
  it('stage ramps and clamps', () => {
    expect(stage(0.1, 0.2, 0.6)).toBe(0);
    expect(stage(0.4, 0.2, 0.6)).toBeCloseTo(0.5);
    expect(stage(0.9, 0.2, 0.6)).toBe(1);
    expect(stageOut(0.4, 0.2, 0.6)).toBeGreaterThan(0.5);
    expect(stageOut(1, 0.2, 0.6)).toBe(1);
  });
});
