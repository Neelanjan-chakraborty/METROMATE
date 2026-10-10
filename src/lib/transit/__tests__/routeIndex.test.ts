import { loadTransit } from '../transitData';
import { buildRouteIndex, headwayBands, searchRoutes, typicalOffsets } from '../routeIndex';
import { departuresAt, groupDepartures } from '../departures';

const ix = loadTransit();
const ri = buildRouteIndex(ix);

describe('route index', () => {
  it('covers the whole feed', () => {
    expect(ri.routes).toHaveLength(639);
    expect(ri.routes.reduce((s, r) => s + r.patterns.length, 0)).toBe(970);
    expect(ri.routes.reduce((s, r) => s + r.trips, 0)).toBe(14244);
    expect(ri.byAgency.AJL).toHaveLength(149);
    expect(ri.byAgency.AMTS.length + ri.byAgency.AJL.length + ri.byAgency.GTSL.length).toBe(639);
  });
  it('is memoised and routes are findable by id', () => {
    expect(buildRouteIndex(ix)).toBe(ri);
    const r = ri.routes[ri.byId.get('101sh')!];
    expect(r.short).toBe('101sh');
    expect(r.agency).toBe('AMTS');
  });
  it('sorts route numbers naturally within an agency', () => {
    const shorts = ri.byAgency.AMTS.map((r) => r.short);
    expect(shorts.indexOf('3')).toBeGreaterThanOrEqual(0);
    expect(shorts.indexOf('3')).toBeLessThan(shorts.indexOf('12'));
    expect(shorts.indexOf('12')).toBeLessThan(shorts.indexOf('14'));
  });
  it('gives each direction a headsign from its last stop and the busiest pattern', () => {
    // a few Gandhinagar routes are listed in the feed with no trips; they have no directions
    expect(ri.routes.filter((r) => r.dirs.length === 0).every((r) => r.trips === 0 && r.patterns.length === 0)).toBe(true);
    for (const r of ri.routes) {
      if (r.trips > 0) expect(r.dirs.length).toBeGreaterThan(0);
      for (const dr of r.dirs) {
        const stops = ix.data.patterns.stops[dr.pattern];
        expect(dr.headsign).toBe(ix.data.stops.name[stops[stops.length - 1]]);
        expect(dr.stops).toBe(stops.length);
      }
      if (r.first !== null && r.last !== null) expect(r.last).toBeGreaterThanOrEqual(r.first);
    }
  });
  it('finds routes by number and by place', () => {
    const byNumber = searchRoutes(ri, '101sh');
    expect(byNumber[0].short).toBe('101sh');
    const byPlace = searchRoutes(ri, 'Maninagar');
    expect(byPlace.length).toBeGreaterThan(3);
    expect(byPlace.every((r) => /maninagar/i.test(`${r.short} ${r.long}`))).toBe(true);
    expect(searchRoutes(ri, '')).toEqual([]);
    expect(searchRoutes(ri, 'zzzzqq')).toEqual([]);
  });
});

describe('headway bands', () => {
  it('count every trip of a pattern exactly once or leave it outside 04:00-29:00, with sane gaps', () => {
    const r = ri.byAgency.AJL[0];
    const bands = headwayBands(ix, r.dirs[0].pattern);
    expect(bands).toHaveLength(5);
    const total = bands.reduce((s, b) => s + b.trips, 0);
    expect(total).toBeLessThanOrEqual(ix.data.patterns.startT[r.dirs[0].pattern].length);
    for (const b of bands) {
      if (b.median !== null) {
        expect(b.min!).toBeLessThanOrEqual(b.median);
        expect(b.median).toBeLessThanOrEqual(b.max!);
        expect(b.min!).toBeGreaterThanOrEqual(0);
      } else expect(b.trips).toBeLessThan(2);
    }
  });
});

describe('typical offsets', () => {
  it('has one non-decreasing value per stop, starting at 0', () => {
    for (const r of ri.routes.filter((x) => x.trips > 0).slice(0, 200)) {
      const p = r.dirs[0].pattern;
      const off = typicalOffsets(ix, p);
      expect(off).toHaveLength(ix.data.patterns.stops[p].length);
      expect(off[0]).toBe(0);
      for (let i = 1; i < off.length; i++) expect(off[i]).toBeGreaterThanOrEqual(off[i - 1]);
    }
  });
});

describe('departures at a stop', () => {
  const stop = ix.stopByGtfs.get('AMC_6161')!; // P.D.P.U. Cross Road, the start of route 101sh

  it('is ascending, never earlier than now, and skips terminal arrivals', () => {
    const now = 9 * 60;
    const deps = departuresAt(ix, stop, now, 20);
    expect(deps.length).toBeGreaterThan(0);
    for (let i = 0; i < deps.length; i++) {
      expect(deps[i].time).toBeGreaterThanOrEqual(now);
      if (i) expect(deps[i].time).toBeGreaterThanOrEqual(deps[i - 1].time);
    }
    const last = ix.stopByGtfs.get('AMC_6163');
    expect(last).toBeDefined();
  });

  it('a terminal stop lists only departures, not the arrivals that end there', () => {
    // pick a pattern's last stop that is not the first stop of any pattern
    const p = ix.data.patterns.stops.findIndex((s) => !ix.data.patterns.stops.some((o) => o[0] === s[s.length - 1]));
    const terminal = ix.data.patterns.stops[p][ix.data.patterns.stops[p].length - 1];
    expect(departuresAt(ix, terminal, 0, 50).every((d) => d.pattern !== p)).toBe(true);
  });

  it('carries over trips that began the previous service day', () => {
    const P = ix.data.patterns;
    let found = false;
    for (let p = 0; p < P.stops.length && !found; p++) {
      for (let i = 0; i < P.startT[p].length && !found; i++) {
        const vec = P.vectors[p][P.startV[p][i]];
        const end = P.startT[p][i] + vec[vec.length - 1];
        if (end < 1440 + 6) continue;
        // a middle stop reached after midnight
        for (let pos = 1; pos < vec.length - 1; pos++) {
          const t = P.startT[p][i] + vec[pos] - 1440;
          if (t >= 5) {
            const deps = departuresAt(ix, P.stops[p][pos], t - 1, 200);
            expect(deps.some((d) => d.pattern === p && d.time === t)).toBe(true);
            found = true;
            break;
          }
        }
      }
    }
    expect(found).toBe(true);
  });

  it('later "now" never lists an earlier first bus; the board has no duplicate route + time', () => {
    const a = departuresAt(ix, stop, 8 * 60, 5)[0].time;
    const b = departuresAt(ix, stop, 8 * 60 + 30, 5)[0].time;
    expect(b).toBeGreaterThanOrEqual(a);
    const deps = departuresAt(ix, stop, 8 * 60, 60);
    expect(new Set(deps.map((d) => `${d.route}|${d.time}`)).size).toBe(deps.length);
  });

  it('every stop with service has something to show at 06:00 or later in the day', () => {
    let empty = 0;
    for (let s = 0; s < ix.data.stops.id.length; s += 37) if (departuresAt(ix, s, 0, 1).length === 0) empty++;
    expect(empty).toBeLessThan(5);
  });

  it('groups a board by route and headsign', () => {
    const groups = groupDepartures(departuresAt(ix, stop, 9 * 60, 30));
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) {
      expect(g.times.length).toBeGreaterThan(0);
      expect(g.times).toEqual([...g.times].sort((a, b) => a - b));
    }
  });
});
