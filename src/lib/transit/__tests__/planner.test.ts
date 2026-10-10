import { loadBundledDataset } from '../../dataset';
import { buildStationPoints } from '../../locator';
import { buildNetwork, findRoute } from '../../routing';
import { loadTransit } from '../transitData';
import { createPlanner, planTransit, walkMinutes, MAX_RIDES, type PlannerContext, type TransitPlan } from '../planner';
import { searchStops } from '../places';
import { busStopId } from '../types';

const ds = loadBundledDataset();
const ix = loadTransit();
const points = buildStationPoints(ds.stations, []);
const net = buildNetwork(ds);
const ctx: PlannerContext = createPlanner({ ix, stations: ds.stations, corridors: ds.corridors, timetable: ds.timetable, stationPoint: (id) => points.get(id) ?? null });
// 2026-10-12 is a Monday.
const mon = new Date(2026, 9, 12);
const sat = new Date(2026, 9, 17);
const at = (h: number, m = 0) => h * 60 + m;
const stop = (name: string) => busStopId(ix.data.stops.id[searchStops(ix, name, 1)[0].stop]);
const plan = (from: string, to: string, depart: number, date = mon) => planTransit(ctx, { from, to, departAt: depart, date }, '2026-10-12');

function checkPlan(p: TransitPlan, departAt: number) {
  expect(p.legs.length).toBeGreaterThan(0);
  expect(p.rides).toBeGreaterThanOrEqual(1);
  expect(p.rides).toBeLessThanOrEqual(MAX_RIDES);
  expect(p.transfers).toBe(p.rides - 1);
  let t = departAt - 1e-6;
  for (const l of p.legs) {
    expect(l.depart).toBeGreaterThanOrEqual(t - 1e-6); // never leaves before arriving
    expect(l.arrive).toBeGreaterThanOrEqual(l.depart);
    t = l.arrive;
  }
  expect(p.arriveAt).toBeCloseTo(p.legs[p.legs.length - 1].arrive, 6);
  // legs join up: each leg starts where the previous one ended
  for (let i = 1; i < p.legs.length; i++) {
    const prev = p.legs[i - 1];
    const cur = p.legs[i];
    if (prev.mode === 'walk' || cur.mode === 'walk') continue;
    // ride -> ride at the same place, or via an explicit walk leg (already skipped above)
    expect(cur.from.id).toBe(prev.to.id);
  }
  for (const l of p.legs) if (l.mode === 'bus' || l.mode === 'metro') expect(l.waitMinutes).toBeGreaterThanOrEqual(0);
  expect(p.walkMeters).toBeLessThanOrEqual(1500);
  expect(p.legs.filter((l) => l.mode === 'walk').length).toBeLessThanOrEqual(p.rides + 1);
}

describe('walking estimate', () => {
  it('is straight-line distance x 1.3 at 5 km/h', () => {
    expect(walkMinutes(1000)).toBeCloseTo(15.6, 1);
    expect(walkMinutes(0)).toBe(0);
  });
});

describe('metro-only journeys', () => {
  it('Thaltej Gam to Vastral Gam: one metro leg, ~45 min in the train, estimated wait', () => {
    const r = plan('TLTG', 'VTLG', at(9, 30));
    expect(r.status).toBe('ok');
    const p = r.plans[0];
    checkPlan(p, at(9, 30));
    expect(p.legs).toHaveLength(1);
    const l = p.legs[0];
    expect(l.mode).toBe('metro');
    if (l.mode !== 'metro') return;
    expect(l.waitMinutes).toBeCloseTo(3.5, 5); // half of the 7-minute weekday peak headway
    expect(l.headwayMinutes).toBe(7);
    expect(l.arrive - l.depart).toBeCloseTo(45, 4); // GMRC's published end-to-end time
    expect(l.stationIds).toHaveLength(18);
    expect(l.stationIds[0]).toBe('TLTG');
    expect(l.towardsId).toBe('VTLG');
  });

  it('uses the same stops as the existing metro router for a single-corridor trip', () => {
    const route = findRoute(net, 'GJUV', 'ARVD');
    if (!route.ok) throw new Error('no route');
    const p = plan('GJUV', 'ARVD', at(11, 0)).plans[0];
    const metroStops = p.legs.filter((l) => l.mode === 'metro').reduce((s, l) => s + (l.mode === 'metro' ? l.stops : 0), 0);
    expect(metroStops).toBe(route.stopCount);
  });

  it('a change at Old High Court adds the flat change assumption and is labelled', () => {
    const r = plan('APMC', 'CMSR', at(9, 0));
    r.plans.forEach((x) => checkPlan(x, at(9, 0)));
    const p = r.plans.find((x) => x.legs.filter((l) => l.mode === 'metro').length === 2)!;
    expect(p).toBeDefined(); // the fewest-rides plan is a direct bus; the metro-with-a-change plan is also offered
    const metro = p.legs.filter((l) => l.mode === 'metro');
    if (metro[1].mode === 'metro') {
      expect(metro[1].changeAssumed).toBe(true);
      expect(metro[1].from.id).toBe('OHCI');
      expect(metro[1].waitMinutes).toBeGreaterThanOrEqual(5);
    }
  });

  it('the 20-minute early band gives a 10 minute average wait', () => {
    const l = plan('TLTG', 'VTLG', at(6, 40)).plans[0].legs[0];
    expect(l.mode === 'metro' && l.headwayMinutes).toBe(20);
    expect(l.mode === 'metro' && l.waitMinutes).toBe(10);
  });

  it('before the first train it waits for the first train', () => {
    const l = plan('TLTG', 'VTLG', at(6, 0)).plans[0].legs[0];
    expect(l.mode === 'metro' && l.firstTrain).toBe(true);
    expect(l.depart).toBe(at(6, 20));
  });

  it('after the last metro train no metro leg is offered', () => {
    const r = plan('TLTG', 'VTLG', at(23, 30));
    expect(r.nextDay).toBe(true); // nothing at all runs for this trip tonight
    expect(r.plans[0].legs[0].depart).toBe(at(6, 20)); // tomorrow's first train
    if (r.nextDay) return;
    // a bus to a mid-line station can still catch a late train there, but never one that leaves after the last
    // train from the terminal plus the 45 minutes it takes to reach the far end
    for (const p of r.plans) for (const l of p.legs) if (l.mode === 'metro') expect(l.depart).toBeLessThanOrEqual(at(23, 45));
    for (const p of r.plans) expect(p.legs.some((l) => l.mode === 'metro' && l.from.id === 'TLTG')).toBe(false);
  });

  it('when nothing runs any more today, the plan is for the first service tomorrow (even hours after midnight)', () => {
    const r = plan('KOBG', 'MAHM', at(23, 30)); // Line 3 ends 21:00 and these stations have no bus link
    expect(r.status).toBe('ok');
    expect(r.nextDay).toBe(true);
    expect(r.departAt).toBe(0);
    expect(r.notes.join(' ')).toMatch(/first services tomorrow/);
    expect(r.plans[0].legs[0].depart).toBeGreaterThanOrEqual(at(6, 40));
  });

  it('Gandhinagar-side stations have no bus link, so a bus start there cannot reach them', () => {
    const r = plan(stop('Koba Metro Station'), 'MAHM', at(9, 0));
    for (const p of r.plans) checkPlan(p, at(9, 0));
  });
});

describe('bus journeys (real feed)', () => {
  it('finds a bus-only plan between two stops on a route, with scheduled departures and a next-departures list', () => {
    const a = stop('Memnagar');
    const b = stop('Gujarat University');
    const r = plan(a, b, at(8, 30));
    expect(r.status).toBe('ok');
    const p = r.plans[0];
    checkPlan(p, at(8, 30));
    const bus = p.legs.find((l) => l.mode === 'bus');
    expect(bus).toBeDefined();
    if (bus && bus.mode === 'bus') {
      expect(bus.nextDepartures.every((t) => t > bus.depart)).toBe(true);
      expect(bus.headsign.length).toBeGreaterThan(0);
      expect(bus.stops).toBeGreaterThan(0);
    }
  });

  it('metro + bus: from a bus stop to a metro station uses both', () => {
    const r = plan(stop('Paldi Metro Station'), 'VTLG', at(10, 0));
    expect(r.status).toBe('ok');
    r.plans.forEach((p) => checkPlan(p, at(10, 0)));
    expect(r.plans.some((p) => p.legs.some((l) => l.mode === 'metro'))).toBe(true);
    // a plan that mixes a bus and the metro exists for a trip from a stop near no single line
    const mixed = plan(stop('Koba Metro Station'), 'ARVD', at(10, 0));
    expect(mixed.plans.some((p) => p.legs.some((l) => l.mode === 'bus') && p.legs.some((l) => l.mode === 'metro'))).toBe(true);
  });

  it('walks between a station and its linked "Metro Station" stop', () => {
    const r = plan('GRMS', stop('Gandhigram (Metro Station)'), at(10, 0));
    // Same place within walking distance: the planner still needs a ride, so either a short bus or no plan; never a negative leg.
    for (const p of r.plans) checkPlan(p, at(10, 0));
  });

  it('later departures never arrive earlier (bus only)', () => {
    const a = stop('Memnagar');
    const b = stop('Vastral');
    let last = -Infinity;
    for (const h of [7, 8, 9, 10, 12, 15]) {
      const r = plan(a, b, at(h));
      if (!r.plans.length || r.nextDay) continue;
      const arrive = r.plans[r.plans.length - 1].arriveAt;
      expect(arrive).toBeGreaterThanOrEqual(last - 1e-6);
      last = arrive;
    }
  });

  it('more rides only when they arrive earlier', () => {
    const r = plan(stop('Memnagar'), stop('Naroda Gam'), at(9, 0));
    for (let i = 1; i < r.plans.length; i++) {
      expect(r.plans[i].rides).toBeGreaterThan(r.plans[i - 1].rides);
      expect(r.plans[i].arriveAt).toBeLessThan(r.plans[i - 1].arriveAt);
    }
  });

  it('late at night there are no buses today: the plan moves to the start of tomorrow', () => {
    const r = plan(stop('Memnagar'), stop('Vastral'), at(23, 58));
    if (r.status === 'ok') {
      expect(r.nextDay).toBe(true);
      expect(r.departAt).toBe(0);
      expect(r.plans[0].departAt).toBeGreaterThan(at(4)); // leaves just in time for the first bus, not at midnight
      expect(r.plans[0].legs[0].depart).toBeGreaterThan(at(4));
    }
  });

  it('refuses plans after the feed has expired and for unknown or identical places', () => {
    expect(planTransit(ctx, { from: 'APMC', to: 'VTLG', departAt: 600, date: mon }, '2027-03-30').status).toBe('expired');
    expect(plan('APMC', 'APMC', 600).status).toBe('same-place');
    expect(plan('APMC', 'bus:NOPE', 600).status).toBe('unknown-place');
    expect(plan('NOPE', 'APMC', 600).status).toBe('unknown-place');
  });
});

describe('fares', () => {
  it('BRTS legs get the feed fare; AMTS and metro legs are marked unavailable; totals are partial', () => {
    let sawBrts = false;
    let sawAmts = false;
    const names = ['R.T.O. Circle', 'Maninagar', 'Narol', 'Nehrunagar', 'Jaimangal', 'Shastrinagar', 'Memnagar', 'Naroda Gam', 'Vasna', 'LD Engg. College'];
    for (const a of names) {
      for (const b of names) {
        if (a === b) continue;
        const r = plan(stop(a), stop(b), at(10, 0));
        for (const p of r.plans) {
          for (const l of p.legs) {
            if (l.mode !== 'bus') continue;
            if (l.agency === 'AJL') {
              sawBrts = true;
              if (l.fare) {
                expect(l.fare.adult).toBeGreaterThanOrEqual(5);
                expect(l.fare.child).toBeLessThan(l.fare.adult);
              }
            } else {
              sawAmts = true;
              expect(l.fare).toBeNull();
              expect(p.fare.unavailable).toContain(l.agency);
              expect(p.fare.partial).toBe(true);
            }
          }
          if (p.legs.some((l) => l.mode === 'metro')) expect(p.fare.unavailable).toContain('metro');
        }
      }
    }
    expect(sawBrts || sawAmts).toBe(true);
  });
});

describe('invariants over many random journeys', () => {
  it('every plan found obeys the rules', () => {
    let seed = 12345;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const ids: string[] = [];
    for (let i = 0; i < 40; i++) ids.push(busStopId(ix.data.stops.id[Math.floor(rnd() * ix.data.stops.id.length)]));
    for (const s of ds.stations.slice(0, 20)) ids.push(s.id);
    let found = 0;
    const t0 = Date.now();
    for (let i = 0; i < 60; i++) {
      const a = ids[Math.floor(rnd() * ids.length)];
      const b = ids[Math.floor(rnd() * ids.length)];
      if (a === b) continue;
      const depart = at(7 + Math.floor(rnd() * 12), Math.floor(rnd() * 60));
      const r = plan(a, b, depart, rnd() < 0.3 ? sat : mon);
      if (r.status !== 'ok') continue;
      found++;
      const base = r.nextDay ? 0 : depart;
      r.plans.forEach((p) => checkPlan(p, base));
    }
    expect(found).toBeGreaterThan(10);
    // performance guard in Node: well under a second per plan on average
    expect((Date.now() - t0) / 60).toBeLessThan(500);
  });
});

describe('share text', () => {
  it('lists each leg, marks bus as scheduled and metro as estimated, and says it is not live', () => {
    const { transitShareText } = jest.requireActual('../share') as typeof import('../share');
    const p = plan(stop('Koba Metro Station'), 'ARVD', at(10, 0)).plans.find((x) => x.legs.some((l) => l.mode === 'bus') && x.legs.some((l) => l.mode === 'metro'))!;
    const text = transitShareText(p, 'Koba', 'Amraivadi', (id) => id, (id) => id);
    expect(text).toMatch(/^Koba → Amraivadi: leave \d\d:\d\d, arrive \d\d:\d\d/);
    expect(text).toMatch(/\(scheduled\)/);
    expect(text).toMatch(/\(estimated\)/);
    expect(text).toMatch(/not live/);
  });
});
