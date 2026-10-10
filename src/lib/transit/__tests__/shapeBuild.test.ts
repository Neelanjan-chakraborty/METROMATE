import raw from '../../../../data/transit/transit.json';
import shapesRaw from '../../../../data/transit/shapes.json';
import { buildShapes, decodeLine, encodeLine, parseShapes, simplify, sweep } from '../shapeBuild';
import type { ShapesData, TransitData } from '../types';

const csv = (rows: (string | number)[][]) => ['shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence', ...rows.map((r) => r.join(','))].join('\n') + '\n';

// A straight road along lat 23.0 from lon 72.50 to 72.60 (about 10 km), points every ~110 m.
const road = Array.from({ length: 91 }, (_, i) => [23.0, +(72.5 + i * 0.0011).toFixed(5)] as [number, number]);
const stopsAt = (idx: number[]) => idx.map((i) => road[i]);

function input(patternStops: number[][], extraStops: [number, number][] = [], agency = 0) {
  const pts = [...road, ...extraStops];
  return {
    transit: {
      stops: { id: pts.map((_, i) => `s${i}`), name: pts.map((_, i) => `S${i}`), lat: pts.map((p) => p[0]), lon: pts.map((p) => p[1]), agencies: pts.map(() => 1), area: pts.map(() => -1) },
      patterns: { route: patternStops.map(() => 0), dir: patternStops.map(() => 0), stops: patternStops, vectors: patternStops.map(() => [[0]]), startT: patternStops.map(() => [0]), startV: patternStops.map(() => [0]) },
      routes: { id: ['r'], agency: [agency], short: ['1'], long: ['one'] },
      agencies: [{ id: 'AMTS' as const, name: 'A', url: '' }],
    } as Pick<TransitData, 'stops' | 'patterns' | 'routes' | 'agencies'>,
    shapesText: csv(road.map((p, i) => ['road', p[0], p[1], i + 1])),
  };
}

describe('line encoding and simplification', () => {
  it('round-trips a polyline at 1e-5 degrees', () => {
    const pts: [number, number][] = [[23.12345, 72.54321], [23.12399, 72.54299], [23.1241, 72.5435]];
    const back = decodeLine(encodeLine(pts));
    back.forEach((p, i) => {
      expect(p[0]).toBeCloseTo(pts[i][0], 5);
      expect(p[1]).toBeCloseTo(pts[i][1], 5);
    });
  });
  it('keeps the ends and drops points on a straight line', () => {
    const s = simplify(road, 10);
    expect(s).toHaveLength(2);
    expect(s[0]).toEqual(road[0]);
    expect(s[1]).toEqual(road[road.length - 1]);
  });
  it('keeps a real bend', () => {
    const bend: [number, number][] = [[23.0, 72.5], [23.0, 72.51], [23.01, 72.51]];
    expect(simplify(bend, 10)).toHaveLength(3);
  });
  it('parses shapes in sequence order', () => {
    const m = parseShapes('shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence\na,1,1,2\na,0,0,1\n');
    expect(m.get('a')).toEqual([[0, 0], [1, 1]]);
  });
});

describe('sweep', () => {
  it('follows stops in order and clips to first..last', () => {
    const r = sweep(road, stopsAt([10, 30, 50]))!;
    expect(r.onShape).toBe(3);
    expect(r.slice[0]).toEqual(road[10]);
    expect(r.slice[r.slice.length - 1]).toEqual(road[50]);
  });
  it('fails when the stops run against the shape', () => {
    expect(sweep(road, stopsAt([50, 30, 10]))).toBeNull();
  });
});

describe('buildShapes (fixture)', () => {
  it('matches forward and reversed patterns to one stored line, with a reverse flag', () => {
    const s = buildShapes(input([[10, 30, 50, 70], [70, 50, 30, 10]]));
    expect(s.pattern).toEqual([0, 0]);
    expect(s.rev).toEqual([0, 1]);
    expect(s.lines).toHaveLength(1);
    const pts = decodeLine(s.lines[0]);
    expect(pts[0][1]).toBeCloseTo(road[10][1], 4);
    expect(pts[pts.length - 1][1]).toBeCloseTo(road[70][1], 4);
    expect(s.meta.matched).toBe(2);
    expect(s.meta.byAgency.AMTS).toEqual({ matched: 2, total: 2 });
  });

  it('gives no line to a pattern whose stops are off the road, and counts it', () => {
    const far: [number, number][] = [[23.2, 72.5], [23.2, 72.52], [23.2, 72.54]];
    const s = buildShapes(input([[10, 30, 50], [91, 92, 93]], far));
    expect(s.pattern[0]).toBe(0);
    expect(s.pattern[1]).toBe(-1);
    expect(s.meta.matched).toBe(1);
    expect(s.meta.total).toBe(2);
  });

  it('tolerates a stop slightly off the road (90 % rule) but not many', () => {
    const off: [number, number][] = [[23.003, 72.53]]; // ~330 m north of the road
    const s = buildShapes(input([[10, 20, 91, 30, 40, 50, 60, 70, 80, 85], [10, 91, 91, 91]], off));
    expect(s.pattern[0]).toBe(0);
    expect(s.pattern[1]).toBe(-1);
  });

  it('reports matched counts', () => {
    const s = buildShapes(input([[10, 30, 50]]));
    expect(s.meta.report[0]).toMatch(/matched for 1 of 1 patterns/);
  });

  it('is deterministic', () => {
    expect(JSON.stringify(buildShapes(input([[10, 30, 50], [70, 50, 30]])))).toBe(JSON.stringify(buildShapes(input([[10, 30, 50], [70, 50, 30]]))));
  });
});

describe('bundled shapes (real feed)', () => {
  const t = raw as unknown as TransitData;
  const s = shapesRaw as unknown as ShapesData;

  it('lines up with the transit patterns', () => {
    expect(s.pattern).toHaveLength(t.patterns.route.length);
    expect(s.rev).toHaveLength(t.patterns.route.length);
    expect(s.meta.total).toBe(t.patterns.route.length);
    expect(s.pattern.filter((x) => x >= 0).length).toBe(s.meta.matched);
    for (const i of s.pattern) expect(i).toBeLessThan(s.lines.length);
  });

  it('matches most BRTS patterns, some AMTS, no Gandhinagar (the feed has no shapes for it)', () => {
    expect(s.meta.matched).toBeGreaterThan(550);
    expect(s.meta.byAgency.AJL.matched / s.meta.byAgency.AJL.total).toBeGreaterThan(0.85);
    expect(s.meta.byAgency.GTSL.matched).toBe(0);
  });

  it('matched polylines run the right way: they start near the first stops and end near the last', () => {
    const m = 111195;
    const d = (a: [number, number], lat: number, lon: number) => Math.hypot((a[0] - lat) * m, (a[1] - lon) * m * 0.92);
    let off = 0;
    s.pattern.forEach((li, p) => {
      if (li < 0) return;
      let pts = decodeLine(s.lines[li]);
      if (s.rev[p]) pts = [...pts].reverse();
      const stops = t.patterns.stops[p];
      const head = stops.slice(0, 6);
      const tail = stops.slice(-6);
      const nearStart = Math.min(...head.map((x) => d(pts[0], t.stops.lat[x], t.stops.lon[x])));
      const nearEnd = Math.min(...tail.map((x) => d(pts[pts.length - 1], t.stops.lat[x], t.stops.lon[x])));
      // never reversed: the start is not closer to the last stops than to the first ones
      const startToTail = Math.min(...tail.map((x) => d(pts[0], t.stops.lat[x], t.stops.lon[x])));
      expect(nearStart).toBeLessThanOrEqual(startToTail + 1e-6); // equal for loop routes whose ends meet
      if (nearStart > 80 || nearEnd > 80) {
        off++;
        expect(Math.max(nearStart, nearEnd)).toBeLessThan(500);
      }
    });
    expect(off).toBeLessThanOrEqual(5); // a handful have their first/last stops off the road
  });

  it('is small enough to ship', () => {
    expect(JSON.stringify(s).length).toBeLessThan(450_000);
  });
});
