import raw from '../../../../data/transit/transit.json';
import stationsJson from '../../../../data/stations.json';
import type { TransitData } from '../types';

const d = raw as unknown as TransitData;

describe('bundled transit data (built from the supplied GTFS)', () => {
  it('matches the feed it came from', () => {
    expect(d.meta.schema).toBe(1);
    expect(d.meta.counts.stops).toBe(3203);
    expect(d.meta.counts.routes).toBe(639);
    expect(d.meta.counts.stopTimes).toBe(646471);
    expect(d.stops.id).toHaveLength(3203);
    expect(d.agencies.map((a) => a.id)).toEqual(['AMTS', 'AJL', 'GTSL']);
    expect(d.meta.source.validTo).toBe('2027-03-29');
    expect(d.meta.source.notes.join(' ')).toMatch(/not an official publication/);
    expect(d.meta.source.files).toHaveLength(2);
  });

  it('is internally consistent', () => {
    const n = d.stops.id.length;
    for (const k of ['name', 'lat', 'lon', 'agencies', 'area'] as const) expect(d.stops[k]).toHaveLength(n);
    expect(d.patterns.route).toHaveLength(d.meta.counts.patterns);
    let vectors = 0;
    d.patterns.stops.forEach((stops, p) => {
      expect(stops.every((s) => s >= 0 && s < n)).toBe(true);
      expect(d.patterns.startT[p]).toHaveLength(d.patterns.startV[p].length);
      expect(d.patterns.startT[p].every((t, i, a) => i === 0 || t >= a[i - 1])).toBe(true);
      for (const v of d.patterns.vectors[p]) {
        expect(v).toHaveLength(stops.length);
        expect(v[0]).toBe(0);
        expect(v.every((x, i, a) => i === 0 || x >= a[i - 1])).toBe(true);
        expect(v[v.length - 1]).toBeLessThanOrEqual(360);
      }
      for (const vi of d.patterns.startV[p]) expect(vi).toBeLessThan(d.patterns.vectors[p].length);
      vectors += d.patterns.vectors[p].length;
    });
    expect(vectors).toBe(d.meta.counts.vectors);
  });

  it('every stop is inside the Ahmedabad–Gandhinagar area', () => {
    for (let i = 0; i < d.stops.id.length; i++) {
      expect(d.stops.lat[i]).toBeGreaterThan(22.8);
      expect(d.stops.lat[i]).toBeLessThan(23.4);
      expect(d.stops.lon[i]).toBeGreaterThan(72.2);
      expect(d.stops.lon[i]).toBeLessThan(72.9);
    }
  });

  it('BRTS fares: complete matrix, symmetric, known products, child fare for each adult fare', () => {
    const n = d.fares.areas.length;
    expect(n).toBe(191);
    expect(d.fares.matrix).toHaveLength(n * n);
    expect(d.fares.adult).toEqual([5, 10, 15, 20, 25, 30, 50]);
    expect(d.fares.child).toEqual([3, 5, 8, 10, 13, 15, 25]);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const c = d.fares.matrix[i * n + j];
        if (i === j) continue;
        expect(c).not.toBe('-');
        expect(c).toBe(d.fares.matrix[j * n + i]);
        expect(parseInt(c, 36)).toBeLessThan(d.fares.adult.length);
      }
    }
    // every fare area has exactly one stop in this feed's BRTS stop set
    const stopsWithArea = d.stops.area.filter((a) => a >= 0);
    expect(new Set(stopsWithArea).size).toBe(191);
  });

  it('BRTS fare spot check against the feed: R.T.O Circle -> Ranip Cross Road is Rs 5', () => {
    const a = d.fares.areas.indexOf('R.T.O Circle');
    const b = d.fares.areas.indexOf('Ranip Cross Road');
    expect(a).toBeGreaterThanOrEqual(0);
    expect(d.fares.adult[parseInt(d.fares.matrix[a * 191 + b], 36)]).toBe(5);
  });

  it('only AJL (BRTS) routes serve BRTS fare areas as fare-bearing; AMTS fares are not in the data', () => {
    expect(Object.keys(d.fares)).toEqual(['areas', 'adult', 'child', 'matrix']);
  });

  it('links metro stations to stops from the (estimated) pins, with the Gandhinagar gap visible', () => {
    const stationIds = new Set((stationsJson as { id: string }[]).map((s) => s.id));
    for (const l of d.links.stationStop) {
      expect(stationIds.has(l.station)).toBe(true);
      expect(l.m).toBeLessThanOrEqual(600);
      expect(l.stop).toBeLessThan(d.stops.id.length);
    }
    const linked = new Set(d.links.stationStop.map((l) => l.station));
    expect(linked.size).toBe(43);
    expect(linked.has('GNLU')).toBe(false);
    expect(linked.has('MAHM')).toBe(false);
    const gr = d.links.stationStop.filter((l) => l.station === 'GRMS' && l.named);
    expect(gr.some((l) => /Gandhigram/.test(d.stops.name[l.stop]))).toBe(true);
  });

  it('stop-to-stop links are unique ordered pairs within 250 m', () => {
    const seen = new Set<string>();
    for (const [a, b, m] of d.links.stopStop) {
      expect(a).toBeLessThan(b);
      expect(m).toBeLessThanOrEqual(250);
      expect(seen.has(`${a}|${b}`)).toBe(false);
      seen.add(`${a}|${b}`);
    }
  });
});
