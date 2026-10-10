import { distToPolyline, distToSegments, nearbyPolyline, tileShapes, TILE } from '../../components/journey/cityDecor';

describe('tileShapes', () => {
  it('is deterministic for a tile and differs between tiles', () => {
    const a = tileShapes(3, 4, []);
    const b = tileShapes(3, 4, []);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(tileShapes(4, 4, []))).not.toBe(JSON.stringify(a));
  });
  it('produces a bounded number of shapes (render cost)', () => {
    for (let i = 0; i < 40; i++) expect(tileShapes(i, i * 3 - 20, []).length).toBeLessThan(320);
  });
  it('keeps buildings, trees and parks clear of the route', () => {
    const route = [0, TILE / 2, TILE, TILE / 2]; // one segment: a track straight across tile (0,0)
    const shapes = tileShapes(0, 0, route, 34);
    for (const s of shapes) {
      if (s.k === 'rect' && s.fill && s.fill !== '#FFFFFF' && s.w && s.h && s.r !== 14 && s.r !== 10) {
        const cx = s.x! + s.w / 2;
        const cy = s.y! + s.h / 2;
        expect(distToSegments(cx, cy, route)).toBeGreaterThan(34 - 1);
      }
      if (s.k === 'circle') expect(distToSegments(s.x!, s.y!, route)).toBeGreaterThan(30);
    }
  });
});

describe('seamless tiles', () => {
  const verticals = (tx: number, ty: number) =>
    tileShapes(tx, ty, [])
      .filter((s) => s.k === 'line' && s.pts!.startsWith('') && /^-?[\d.]+,-4 /.test(s.pts!))
      .map((s) => Math.round((parseFloat(s.pts!) + tx * TILE) * 10) / 10);
  it('streets continue across tile borders (same world position from either tile)', () => {
    const a = new Set(verticals(2, 3));
    const b = new Set(verticals(3, 3));
    const shared = [...a].filter((x) => b.has(x));
    expect(shared.length).toBeGreaterThan(0);
    // every street in the overlap zone of both tiles is present in both
    for (const x of a) if (x > 3 * TILE - 20 && x < 3 * TILE + 20) expect(b.has(x)).toBe(true);
  });
});

describe('polyline helpers', () => {
  it('measures distance to a polyline', () => {
    expect(distToPolyline(5, 10, [0, 0, 10, 0])).toBeCloseTo(10, 6);
    expect(distToPolyline(20, 0, [0, 0, 10, 0])).toBeCloseTo(10, 6);
  });
  it('keeps only segments near a tile', () => {
    expect(nearbyPolyline([0, 0, 10, 10], 0, 0, 20)).toEqual([0, 0, 10, 10]);
    expect(nearbyPolyline([5000, 5000, 5010, 5010], 0, 0, 20)).toEqual([]);
    expect(distToSegments(5, 3, [0, 0, 10, 0, 0, 100, 10, 100])).toBeCloseTo(3, 6);
  });
});
