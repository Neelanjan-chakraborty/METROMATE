import { loadBundledDataset } from '../dataset';
import { buildNetwork, findRoute } from '../routing';
import { buildStationPoints } from '../locator';
import { estimateThroughTunnel, expectedMinutes, hopMinutes, INITIAL_ETA, stepEta, type EtaState, type HopTimes } from '../eta';
import type { RouteResult } from '../../types';

const ds = loadBundledDataset();
const net = buildNetwork(ds);
const points = buildStationPoints(ds.stations, []);
const coord = (id: string) => points.get(id) ?? null;
const lines = ds.timetable.lines;
const route = (a: string, b: string) => findRoute(net, a, b) as RouteResult;

describe('hopMinutes', () => {
  it('spreads each published end-to-end time over the line in proportion to distance', () => {
    const r = route('TLTG', 'VTLG');
    const h = hopMinutes(r.stationIds, coord, lines)!;
    expect(h.minutes).toHaveLength(17);
    expect(h.total).toBeCloseTo(45, 5); // GMRC: Thaltej Gam to Vastral Gam, 45 min
    expect(h.basis).toBe('published-line');
    h.minutes.forEach((m) => expect(m).toBeGreaterThan(0.5));
  });
  it('adds the published figures of every line used on a multi-line journey', () => {
    const r = route('MAHM', 'VTLG'); // NS (both lines) then EW
    const h = hopMinutes(r.stationIds, coord, lines)!;
    expect(h).not.toBeNull();
    expect(h.minutes).toHaveLength(r.stationIds.length - 1);
    expect(h.total).toBeGreaterThan(60);
  });
  it('uses the calculator time for the pair when it is known, scaled across the hops', () => {
    const r = route('APMC', 'OHCI');
    const base = hopMinutes(r.stationIds, coord, lines)!;
    const calc = hopMinutes(r.stationIds, coord, lines, 14)!;
    expect(calc.basis).toBe('calculator');
    expect(calc.total).toBeCloseTo(14, 6);
    expect(calc.minutes[0] / calc.minutes[1]).toBeCloseTo(base.minutes[0] / base.minutes[1], 6);
  });
  it('returns null (no invented time) when a hop is not on a published line or a pin is missing', () => {
    expect(hopMinutes(['APMC', 'TLTG'], coord, lines)).toBeNull();
    expect(hopMinutes(['APMC', 'JVRJ'], (id) => (id === 'JVRJ' ? null : coord(id)), lines)).toBeNull();
  });
});

describe('expectedMinutes', () => {
  const hop = [4, 2, 6];
  it('sums whole and fractional hops', () => {
    expect(expectedMinutes(hop, 0, 3)).toBe(12);
    expect(expectedMinutes(hop, 0.5, 2.5)).toBeCloseTo(2 + 2 + 3, 6);
    expect(expectedMinutes(hop, 2, 2)).toBe(0);
    expect(expectedMinutes(hop, 3, 1)).toBe(0);
  });
});

describe('stepEta', () => {
  const hop: HopTimes = { minutes: [3, 3, 3, 3, 3, 3], total: 18, basis: 'published-line' };
  const T0 = 1_000_000_000;
  const min = 60_000;

  it('is unavailable without a position or times', () => {
    expect(stepEta(INITIAL_ETA, { nowMs: T0, progress: null, hop, fromGps: true }).kind).toBe('unavailable');
    expect(stepEta(INITIAL_ETA, { nowMs: T0, progress: 0, hop: null, fromGps: true }).minutes).toBeNull();
  });

  it('starts from the published figures', () => {
    const o = stepEta(INITIAL_ETA, { nowMs: T0, progress: 0, hop, fromGps: true });
    expect(o.minutes).toBe(18);
    expect(o.kind).toBe('estimate');
    expect(o.arrivalMs).toBe(T0 + 18 * min);
  });

  it('on schedule keeps the estimate steady and does not claim an update', () => {
    let st: EtaState = INITIAL_ETA;
    let last = null as ReturnType<typeof stepEta> | null;
    for (let m = 0; m <= 12; m++) {
      last = stepEta(st, { nowMs: T0 + m * min, progress: m / 3, hop, fromGps: true });
      st = last.state;
      expect(last.updated).toBe(false);
    }
    expect(last!.minutes).toBe(6);
    expect(Math.abs((last!.arrivalMs ?? 0) - (T0 + 18 * min))).toBeLessThan(min);
    expect(last!.behindMin).toBeNull();
  });

  it('slower than published: the estimate moves later, gradually, and says it was updated', () => {
    let st: EtaState = INITIAL_ETA;
    let flagged = false;
    let o = stepEta(st, { nowMs: T0, progress: 0, hop, fromGps: true });
    st = o.state;
    const arrivals: number[] = [o.arrivalMs!];
    // takes 1.5x as long as published
    for (let m = 1; m <= 24; m++) {
      o = stepEta(st, { nowMs: T0 + m * min, progress: Math.min(6, (m / 1.5) / 3), hop, fromGps: true });
      st = o.state;
      if (o.updated) flagged = true;
      arrivals.push(o.arrivalMs!);
    }
    expect(o.kind).toBe('adjusted');
    expect(flagged).toBe(true);
    expect(o.arrivalMs!).toBeGreaterThan(T0 + 20 * min);
    // smoothing: never jumps by more than a couple of minutes in one step
    for (let i = 1; i < arrivals.length; i++) expect(Math.abs(arrivals[i] - arrivals[i - 1])).toBeLessThan(2.5 * min);
    expect(o.behindMin).not.toBeNull();
  });

  it('demo and check-in positions never adjust the pace', () => {
    let st: EtaState = INITIAL_ETA;
    for (let m = 0; m <= 10; m++) {
      const o = stepEta(st, { nowMs: T0 + m * min, progress: Math.min(6, m * 0.9), hop, fromGps: false });
      st = o.state;
      expect(o.kind).toBe('estimate');
    }
    expect(st.pace).toBe(1);
  });

  it('never reports an arrival in the past and reaches zero at the destination', () => {
    const st = stepEta(INITIAL_ETA, { nowMs: T0, progress: 0, hop, fromGps: true }).state;
    const o = stepEta(st, { nowMs: T0 + 40 * min, progress: 6, hop, fromGps: true });
    expect(o.minutes).toBe(0);
    expect(o.arrivalMs).toBeGreaterThanOrEqual(T0 + 40 * min);
  });
});

describe('estimateThroughTunnel', () => {
  const hop: HopTimes = { minutes: [2, 2, 2, 2, 2], total: 10, basis: 'published-line' };
  const ug = [false, true, true, true, false, false]; // stations 1..3 underground
  const T0 = 5_000_000;

  it('advances at the published pace while GPS is missing underground', () => {
    const e = estimateThroughTunnel({ lastProgress: 1, lastAtMs: T0, nowMs: T0 + 3 * 60_000, hop, underground: ug })!;
    expect(e.estimated).toBe(true);
    expect(e.progress).toBeCloseTo(2.5, 6);
  });
  it('never passes the portal where GPS should return', () => {
    const e = estimateThroughTunnel({ lastProgress: 1, lastAtMs: T0, nowMs: T0 + 20 * 60_000, hop, underground: ug })!;
    expect(e.progress).toBeCloseTo(3.5, 6); // station 4 is the first elevated one
  });
  it('does not apply when the last known position was on the surface', () => {
    expect(estimateThroughTunnel({ lastProgress: 4.2, lastAtMs: T0, nowMs: T0 + 60_000, hop, underground: ug })).toBeNull();
    expect(estimateThroughTunnel({ lastProgress: 0.2, lastAtMs: T0, nowMs: T0 + 60_000, hop, underground: ug })).toBeNull();
  });
  it('gives up after a long time instead of guessing', () => {
    expect(estimateThroughTunnel({ lastProgress: 1, lastAtMs: T0, nowMs: T0 + 40 * 60_000, hop, underground: ug })).toBeNull();
  });
});
