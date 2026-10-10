import { loadBundledDataset } from '../dataset';
import { buildStationPoints } from '../locator';
import { amenityFor, gateFeatures, hopEstimate, neighboursOn, placeKind, stationAmenities, stationService } from '../stationView';

const ds = loadBundledDataset();
const st = (id: string) => ds.stations.find((s) => s.id === id)!;
const gatesOf = (id: string) => ds.gates.filter((g) => g.stationId === id);
const cor = (id: string) => ds.corridors.find((c) => c.id === id)!;
const points = buildStationPoints(ds.stations, []);
const coord = (id: string) => points.get(id) ?? null;
const at = (day: number, hh: number, mm = 0) => new Date(2026, 9, 12 + day, hh, mm);

describe('amenities', () => {
  it('maps every GMRC facility wording to a known icon (nothing falls through to "other")', () => {
    for (const t of [...ds.facilities.general, ...ds.facilities.accessibility]) expect(amenityFor(t).key).not.toBe('other');
    expect(amenityFor('Washrooms for differently abled passengers').key).toBe('accToilets');
    expect(amenityFor('Washrooms').key).toBe('toilets');
    expect(amenityFor('Something new').key).toBe('other');
  });

  it('lists as "here" only what the gate table gives this station: lifts, ramp, gates', () => {
    const a = stationAmenities(st('APMC'), gatesOf('APMC'), ds.facilities);
    expect(a.here.map((x) => x.key)).toEqual(['lift', 'ramp', 'gates']);
    expect(a.here[0].count).toBe(st('APMC').lifts.length);
    expect(a.here[2].count).toBe(gatesOf('APMC').length);
  });

  it('never claims a station has escalators, toilets, water etc.: they stay network-wide', () => {
    const a = stationAmenities(st('APMC'), gatesOf('APMC'), ds.facilities);
    const here = a.here.map((x) => x.key);
    for (const k of ['escalator', 'toilets', 'water', 'firstaid', 'seating', 'card', 'tickets']) expect(here).not.toContain(k);
    expect(a.network.general.map((x) => x.key)).toContain('escalator');
    expect(a.network.general.map((x) => x.key)).not.toContain('lift'); // shown as a station fact instead
  });

  it('a station with no gate-table row has no "here" amenities and keeps the network lift item', () => {
    const none = ds.stations.find((s) => s.lifts.length === 0 && gatesOf(s.id).length === 0)!;
    expect(none).toBeDefined();
    const a = stationAmenities(none, [], ds.facilities);
    expect(a.here).toEqual([]);
    expect(a.network.general.map((x) => x.key)).toContain('lift');
  });
});

describe('gateFeatures', () => {
  it('gives one entry per gate number, in order, with the lifts near it', () => {
    const g = gateFeatures(st('VTLG'), gatesOf('VTLG'));
    expect(g.map((x) => x.number)).toEqual([...g.map((x) => x.number)].sort((a, b) => a - b));
    expect(g).toHaveLength(gatesOf('VTLG').length);
    expect(g.find((x) => x.number === 1)!.lifts).toEqual([1]); // "Lift No. 01 ... near this gate"
    expect(g.find((x) => x.number === 2)!.lifts).toEqual([]);
    expect(g.find((x) => x.number === 3)!.lifts).toEqual([2]);
  });

  it('attaches unofficial-map connection notes only to the gate they name', () => {
    const g = gateFeatures(st('VDMS'), gatesOf('VDMS'));
    const g5 = g.find((x) => x.number === 5)!;
    expect(g5.connections).toHaveLength(1);
    expect(g5.connections[0].kind).toBe('brts');
    expect(g5.connections[0].verificationStatus).toBe('unverified');
    expect(g.filter((x) => x.number !== 5).every((x) => x.connections.length === 0)).toBe(true);
  });

  it('every lift in the data sits near a gate that exists', () => {
    for (const s of ds.stations) {
      const nums = new Set(gateFeatures(s, gatesOf(s.id)).map((g) => g.number));
      for (const l of s.lifts) expect(nums.has(l.nearGate)).toBe(true);
    }
  });
});

describe('stationService', () => {
  it('combines the lines through a station and reads the clock', () => {
    const apmc = stationService(ds.timetable, 'APMC', at(0, 10));
    expect(apmc.lines.map((l) => l.id)).toEqual(['line-2']);
    expect(apmc.first).toBe('06:16');
    expect(apmc.last).toBe('23:10');
    expect(apmc.state).toBe('running');
    expect(stationService(ds.timetable, 'APMC', at(0, 5)).state).toBe('not-started');
    expect(stationService(ds.timetable, 'APMC', at(0, 23, 30)).state).toBe('ended');
  });

  it('an interchange spans both lines; a station on no published line is unknown', () => {
    expect(stationService(ds.timetable, 'OHCI', at(0, 10)).lines.map((l) => l.id).sort()).toEqual(['line-1', 'line-2']);
    expect(stationService(ds.timetable, 'NOPE', at(0, 10)).state).toBe('unknown');
  });
});

describe('neighbours and hop estimates', () => {
  it('finds the stations either side on a corridor and the terminal each way', () => {
    const n = neighboursOn(cor('ns'), 'APMC');
    expect(n.prev).toBeNull();
    expect(n.next).toEqual({ id: 'JVRJ', towardsId: 'MAHM' });
    const mid = neighboursOn(cor('ns'), 'OHCI');
    expect(mid.prev).toEqual({ id: 'GRMS', towardsId: 'APMC' });
    expect(mid.next).toEqual({ id: 'UPMS', towardsId: 'MAHM' });
    expect(neighboursOn(cor('ns'), 'MAHM').next).toBeNull();
  });

  it('estimates minutes between neighbours from published line times, or null', () => {
    const m = hopEstimate('APMC', 'JVRJ', coord, ds.timetable.lines)!;
    expect(m).toBeGreaterThanOrEqual(1);
    expect(m).toBeLessThan(10);
    expect(hopEstimate('APMC', 'JVRJ', () => null, ds.timetable.lines)).toBeNull();
    expect(hopEstimate('APMC', 'TLTG', coord, ds.timetable.lines)).toBeNull(); // not adjacent on a line
  });
});

describe('placeKind', () => {
  it('maps every landmark category in the data', () => {
    for (const l of ds.landmarks) expect(placeKind(l.category)).not.toBe('other');
  });
});
