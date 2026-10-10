import { loadTransit } from '../transitData';
import { nearbyBusStops } from '../nearby';

const ix = loadTransit();

describe('nearbyBusStops', () => {
  it('lists real stops near a metro station, nearest first, with their routes', () => {
    const n = nearbyBusStops(ix, 'GRMS', 4);
    expect(n.length).toBeGreaterThan(0);
    for (let i = 1; i < n.length; i++) expect(n[i].m).toBeGreaterThanOrEqual(n[i - 1].m);
    expect(n[0].id.startsWith('bus:')).toBe(true);
    expect(n.some((s) => s.named && /metro/i.test(s.name))).toBe(true);
    for (const s of n) {
      expect(s.m).toBeLessThanOrEqual(600);
      expect(s.routes.length).toBeGreaterThan(0);
      expect(s.agencies.length).toBeGreaterThan(0);
    }
  });

  it('lists BRTS routes before city-bus routes', () => {
    const order = { AJL: 0, AMTS: 1, GTSL: 2 } as const;
    for (const id of ['RNIP', 'VDMS', 'SMMS', 'APMC']) {
      for (const s of nearbyBusStops(ix, id, 4)) for (let i = 1; i < s.routes.length; i++) expect(order[s.routes[i].agency]).toBeGreaterThanOrEqual(order[s.routes[i - 1].agency]);
    }
  });

  it('never repeats a stop name and honours the limit', () => {
    for (const id of ['AEC', 'OHCI', 'KPMS']) {
      const n = nearbyBusStops(ix, id, 3);
      expect(n.length).toBeLessThanOrEqual(3);
      expect(new Set(n.map((s) => s.name)).size).toBe(n.length);
    }
  });

  it('returns nothing for stations with no stop within the link radius (Gandhinagar side)', () => {
    expect(nearbyBusStops(ix, 'GNLU')).toEqual([]);
    expect(nearbyBusStops(ix, 'MAHM')).toEqual([]);
    expect(nearbyBusStops(ix, 'NOPE')).toEqual([]);
  });
});
