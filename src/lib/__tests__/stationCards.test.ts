import dataset from '../../../data/stations.json';
import corridorsJson from '../../../data/corridors.json';
import gatesJson from '../../../data/gates.json';
import landmarksJson from '../../../data/landmarks.json';
import type { Corridor, Gate, Landmark, Station } from '../../types';
import { cardAccessibilityLabel, countLabel, pickConnection, stationCardInfo } from '../stationCards';

const stations = dataset as unknown as Station[];
const corridors = new Map((corridorsJson as unknown as Corridor[]).map((c) => [c.id, c]));
const gates = gatesJson as unknown as Gate[];
const landmarks = landmarksJson as unknown as Landmark[];
const info = (id: string) => stationCardInfo(stations.find((s) => s.id === id)!, gates, landmarks, corridors);

describe('stationCardInfo', () => {
  it('counts exits from GMRC gates and lifts from the lift table', () => {
    const v = info('VTLG');
    expect(v.exits).toBe(gates.filter((g) => g.stationId === 'VTLG').length);
    expect(v.lifts).toBe(stations.find((s) => s.id === 'VTLG')!.lifts.length);
    expect(v.exits).toBeGreaterThan(0);
  });

  it('never invents exits: stations without gate rows report null', () => {
    for (const s of stations) {
      const n = gates.filter((g) => g.stationId === s.id).length;
      expect(info(s.id).exits).toBe(n > 0 ? n : null);
    }
  });

  it('shows both corridors at an interchange', () => {
    const g = info('GNLU');
    expect(g.badges.map((b) => b.code)).toEqual(['NS', 'GIFT']);
    expect(g.lineName).toBe('North–South Line');
    expect(g.allLines).toBe('North–South Line · GIFT City branch');
    expect(info('AEC').lineName).toBe('North–South Line');
    expect(info('ARPK').badges.map((b) => b.code)).toEqual(['EW']);
  });

  it('flags every nearby connection as unverified (unofficial map) and picks rail first', () => {
    const withConn = stations.filter((s) => s.nearbyConnections.length > 0);
    expect(withConn.length).toBeGreaterThan(0);
    for (const s of withConn) expect(info(s.id).connection?.verified).toBe(false);
    expect(pickConnection([])).toBeNull();
    const c = pickConnection([
      { kind: 'bus', gateNumber: null, note: '', sourceId: 'x', verificationStatus: 'unverified' },
      { kind: 'rail', gateNumber: null, note: '', sourceId: 'x', verificationStatus: 'unverified' },
    ]);
    expect(c?.kind).toBe('rail');
  });

  it('location line only uses landmarks, aliases or the stop number', () => {
    expect(info('MTRS').location).toBe('Near Motera Stadium');
    expect(info('APMC').location).toBe('Near APMC Market, Vasna');
    const aliased = stations.find((s) => s.aliases.length > 0 && !landmarks.some((l) => l.nearestStationId === s.id))!;
    expect(info(aliased.id).location).toBe(`Also known as ${aliased.aliases[0]}`);
    const plain = stations.find((s) => s.aliases.length === 0 && !landmarks.some((l) => l.nearestStationId === s.id))!;
    expect(info(plain.id).location).toMatch(/^Stop \d+ of \d+ · Phase [12]$/);
  });

  it('writes a spoken summary with the unverified caveat', () => {
    const withConn = stations.find((s) => s.nearbyConnections.length > 0)!;
    const label = cardAccessibilityLabel(withConn.name, info(withConn.id));
    expect(label).toContain('(unverified)');
    expect(label.endsWith('Open station details')).toBe(true);
    expect(countLabel(1, 'exit gate', 'exit gates')).toBe('1 exit gate');
    expect(countLabel(2, 'lift', 'lifts')).toBe('2 lifts');
  });
});
