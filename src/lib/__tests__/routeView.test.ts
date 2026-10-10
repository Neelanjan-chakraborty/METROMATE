import { loadBundledDataset } from '../dataset';
import { buildNetwork, findRoute, GNLU_WARNING, PHASE_WARNING } from '../routing';
import { buildStationPoints } from '../locator';
import { bandAt, bandPeriod, bandText, directionOnLine, linesForRoute, serviceNow, toMinutes } from '../serviceNow';
import { overview, shareSummary, stopMinutes, stopsOf, warningTitle } from '../routeView';
import type { RouteResult } from '../../types';

const ds = loadBundledDataset();
const net = buildNetwork(ds);
const points = buildStationPoints(ds.stations, []);
const coord = (id: string) => points.get(id) ?? null;
const route = (a: string, b: string) => findRoute(net, a, b) as RouteResult;
const line = (id: string) => ds.timetable.lines.find((l) => l.id === id)!;
// 2026-10-12 is a Monday, 2026-10-17 a Saturday, 2026-10-18 a Sunday.
const at = (day: number, hh: number, mm = 0) => new Date(2026, 9, 12 + day, hh, mm);

describe('published frequency bands', () => {
  it('every band of every line has a structured window, and the windows are well-formed', () => {
    for (const l of ds.timetable.lines) {
      for (const f of l.frequency) {
        expect(f.when && f.when.length > 0).toBe(true);
        for (const w of f.when!) {
          expect(w.days.every((d) => d >= 0 && d <= 6)).toBe(true);
          for (const [a, b] of w.ranges) expect(b).toBeGreaterThan(a);
        }
      }
    }
  });

  it('Line 1 picks the right band by day and time', () => {
    const l1 = line('line-1');
    expect(bandAt(l1, at(0, 9))!.minutes).toBe(7); // Monday peak
    expect(bandAt(l1, at(0, 13))!.minutes).toBe(10); // Monday midday
    expect(bandAt(l1, at(5, 9))!.minutes).toBe(10); // Saturday peak
    expect(bandAt(l1, at(5, 13))!.minutes).toBe(12); // Saturday non-peak
    expect(bandAt(l1, at(6, 9))!.minutes).toBe(12); // Sunday
    expect(bandAt(l1, at(0, 6, 30))!.minutes).toBe(20); // early
    expect(bandAt(l1, at(0, 22, 30))!.minutes).toBe(20); // late
    expect(bandAt(l1, at(0, 3))).toBeNull();
    expect(bandAt(l1, at(0, 23, 30))).toBeNull();
  });

  it('no minute of the published service day matches two different frequencies', () => {
    for (const l of ds.timetable.lines) {
      for (let day = 0; day < 7; day++) {
        for (let m = 0; m < 1440; m += 5) {
          const d = new Date(2026, 9, 11 + day, Math.floor(m / 60), m % 60);
          const hits = l.frequency.filter((f) => (f.when ?? []).some((w) => w.days.includes(d.getDay()) && w.ranges.some(([a, b]) => m >= a && m < b)));
          expect(hits.length).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('Line 4 reports bus-only in the midday window', () => {
    const b = bandAt(line('line-4'), at(0, 12))!;
    expect(b.kind).toBe('bus-only');
    expect(bandText(b)).toBe('Bus only');
    expect(bandText(bandAt(line('line-3'), at(0, 7))!)).toBe('About every 40 min');
    expect(bandText(bandAt(line('line-2'), at(0, 10))!)).toBe('Every 12 min');
  });

  it('labels the period from GMRC wording', () => {
    expect(bandPeriod(bandAt(line('line-1'), at(0, 9))!)).toBe('Peak hours');
    expect(bandPeriod(bandAt(line('line-1'), at(0, 13))!)).toBe('Non-peak hours');
    expect(bandPeriod(bandAt(line('line-1'), at(0, 6, 30))!)).toBe('Early / late hours');
    expect(bandPeriod(bandAt(line('line-2'), at(0, 10))!)).toBeNull();
  });
});

describe('serviceNow', () => {
  it('uses the first and last train of the end the rider departs from', () => {
    const r = route('APMC', 'KORD'); // line 2, towards Koteshwar Road
    const s = serviceNow(line('line-2'), r.stationIds, at(0, 10));
    expect(s.fromTerminalId).toBe('APMC');
    expect(s.towardsTerminalId).toBe('KORD');
    expect(s.first).toBe('06:20');
    expect(s.last).toBe('23:10');
    expect(s.state).toBe('running');
    const back = serviceNow(line('line-2'), route('KORD', 'APMC').stationIds, at(0, 10));
    expect(back.fromTerminalId).toBe('KORD');
    expect(back.first).toBe('06:16');
    expect(back.last).toBe('23:00');
  });

  it('knows before the first train and after the last', () => {
    const ids = route('TLTG', 'VTLG').stationIds;
    expect(serviceNow(line('line-1'), ids, at(0, 5, 59)).state).toBe('not-started');
    expect(serviceNow(line('line-1'), ids, at(0, 6, 20)).state).toBe('running');
    expect(serviceNow(line('line-1'), ids, at(0, 23, 0)).state).toBe('running');
    expect(serviceNow(line('line-1'), ids, at(0, 23, 1)).state).toBe('ended');
  });

  it('finds the direction on a line from the route order', () => {
    expect(directionOnLine(line('line-1'), route('GJUV', 'VTLG').stationIds)).toEqual({ from: 'TLTG', towards: 'VTLG' });
    expect(directionOnLine(line('line-1'), route('VTLG', 'GJUV').stationIds)).toEqual({ from: 'VTLG', towards: 'TLTG' });
    expect(toMinutes('06:20')).toBe(380);
    expect(toMinutes('nope')).toBeNull();
  });

  it('lists the lines of a multi-line route in travel order', () => {
    expect(linesForRoute(ds.timetable, route('KOBG', 'GIFC')).map((x) => x.line.id)).toEqual(['line-3', 'line-4']);
    expect(linesForRoute(ds.timetable, route('MAHM', 'VTLG')).map((x) => x.line.id)).toEqual(['line-3', 'line-2', 'line-1']);
  });
});

describe('route view model', () => {
  it('estimated minutes start at 0, rise, and end at the published line total for a single-line trip', () => {
    const r = route('TLTG', 'VTLG');
    const m = stopMinutes(r, coord, ds.timetable.lines)!;
    expect(m).toHaveLength(r.stationIds.length);
    expect(m[0]).toBe(0);
    for (let i = 1; i < m.length; i++) expect(m[i]).toBeGreaterThan(m[i - 1]);
    expect(m[m.length - 1]).toBeCloseTo(45, 5);
  });

  it('scales to the GMRC calculator time when one is stored', () => {
    const m = stopMinutes(route('TLTG', 'VTLG'), coord, ds.timetable.lines, 40)!;
    expect(m[m.length - 1]).toBeCloseTo(40, 5);
  });

  it('returns null rather than inventing times when a station position is missing', () => {
    expect(stopMinutes(route('TLTG', 'VTLG'), () => null, ds.timetable.lines)).toBeNull();
  });

  it('draws each station once, with origin, change and destination marked', () => {
    const r = route('APMC', 'CMSR'); // NS to Old High Court, then EW
    const stops = stopsOf(r, null);
    expect(stops.map((s) => s.id)).toEqual(r.stationIds);
    expect(stops[0].kind).toBe('origin');
    expect(stops[stops.length - 1].kind).toBe('destination');
    expect(stops.filter((s) => s.kind === 'interchange').map((s) => s.id)).toEqual(['OHCI']);
    expect(stops.every((s) => s.minutes === null)).toBe(true);
    const withTimes = stopsOf(r, stopMinutes(r, coord, ds.timetable.lines));
    expect(withTimes[0].minutes).toBe(0);
    expect(withTimes.every((s) => s.minutes !== null)).toBe(true);
  });

  it('overview shares add up to 1', () => {
    const o = overview(route('APMC', 'CMSR'));
    expect(o).toHaveLength(2);
    expect(o.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 10);
  });

  it('share text names the stations, the change and says it is not live', () => {
    const r = route('APMC', 'CMSR');
    const text = shareSummary(r, net.stations, net.corridors);
    expect(text).toContain('APMC → Commerce Six Road');
    expect(text).toContain('Change to the East–West line at Old High Court');
    expect(text).toContain('not a live train status');
  });
});

describe('warningTitle', () => {
  it('gives each known warning a short heading', () => {
    expect(warningTitle(PHASE_WARNING)).toBe('Confirm your ticket before travelling');
    expect(warningTitle(GNLU_WARNING)).toBe('GNLU: check the train display');
    expect(warningTitle('Sabarmati Railway Station: not listed by GMRC.')).toBe('Sabarmati Railway Station: check before you go');
    expect(warningTitle('x'.repeat(80)).length).toBeLessThanOrEqual(46);
  });
  it('real routes only produce warnings that have a heading shorter than the text', () => {
    for (const [a, b] of [['MTRS', 'KOBC'], ['KOBG', 'GIFC'], ['SMMS', 'AEC']] as const) {
      for (const w of route(a, b).warnings) expect(warningTitle(w).length).toBeLessThan(w.length);
    }
  });
});
