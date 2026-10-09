import { loadBundledDataset } from '../dataset';
import { buildNetwork, findRoute, GNLU_WARNING, PHASE_WARNING } from '../routing';
import type { RouteResult } from '../../types';

const ds = loadBundledDataset();
const net = buildNetwork(ds);

function route(from: string, to: string): RouteResult {
  const r = findRoute(net, from, to);
  if (!r.ok) throw new Error(`expected route ${from}->${to}, got ${r.code}`);
  return r;
}

describe('network shape', () => {
  it('has 54 stations and 53 undirected links', () => {
    expect(ds.stations).toHaveLength(54);
    expect(ds.connections).toHaveLength(106);
  });

  it('marks exactly Old High Court and GNLU as interchanges', () => {
    expect(ds.stations.filter((s) => s.isInterchange).map((s) => s.id).sort()).toEqual(['GNLU', 'OHCI']);
  });
});

describe('single-corridor routes', () => {
  it('Mahatma Mandir -> APMC runs the whole North–South line with no change', () => {
    const r = route('MAHM', 'APMC');
    expect(r.stopCount).toBe(34);
    expect(r.intermediateCount).toBe(33);
    expect(r.segments).toHaveLength(1);
    expect(r.interchanges).toHaveLength(0);
    expect(r.segments[0].direction).toBe('Towards APMC');
    expect(r.crossesPhaseBoundary).toBe(true);
    expect(r.warnings).toContain(PHASE_WARNING);
  });

  it('the reverse route flips the direction label and keeps the stop count', () => {
    const fwd = route('MAHM', 'APMC');
    const rev = route('APMC', 'MAHM');
    expect(rev.stopCount).toBe(fwd.stopCount);
    expect(rev.stationIds).toEqual([...fwd.stationIds].reverse());
    expect(rev.segments[0].direction).toBe('Towards Mahatma Mandir');
  });

  it('Mahatma Mandir -> Sector-24 is one stop towards the terminus side', () => {
    const r = route('MAHM', 'SEBD');
    expect(r.stationIds).toEqual(['MAHM', 'SEBD']);
    expect(r.segments[0].direction).toBe('Towards APMC');
    expect(r.crossesPhaseBoundary).toBe(false);
  });

  it('Phase-1 only journeys do not raise the phase warning', () => {
    const r = route('APMC', 'VTLG');
    expect(r.crossesPhaseBoundary).toBe(false);
    expect(r.warnings).not.toContain(PHASE_WARNING);
  });

  it('Koteshwar Road -> Motera Stadium crosses the phase boundary', () => {
    expect(route('KORD', 'MTRS').crossesPhaseBoundary).toBe(true);
    expect(route('SMMS', 'MTRS').crossesPhaseBoundary).toBe(false);
  });
});

describe('interchanges', () => {
  it('Thaltej Gam -> Mahatma Mandir changes at Old High Court', () => {
    const r = route('TLTG', 'MAHM');
    expect(r.segments.map((s) => s.corridorId)).toEqual(['ew', 'ns']);
    expect(r.segments[0].direction).toBe('Towards Vastral Gam');
    expect(r.segments[1].direction).toBe('Towards Mahatma Mandir');
    expect(r.interchanges).toEqual([{ stationId: 'OHCI', fromCorridorId: 'ew', toCorridorId: 'ns' }]);
    expect(r.stopCount).toBe(7 + 28);
    expect(r.segments[0].stops + r.segments[1].stops).toBe(r.stopCount);
  });

  it('Vastral Gam -> GIFT City changes at Old High Court and GNLU', () => {
    const r = route('VTLG', 'GIFC');
    expect(r.interchanges.map((i) => i.stationId)).toEqual(['OHCI', 'GNLU']);
    expect(r.segments.map((s) => s.corridorId)).toEqual(['ew', 'ns', 'gift']);
    expect(r.segments[0].direction).toBe('Towards Thaltej Gam');
    expect(r.segments[2].direction).toBe('Towards GIFT City');
    expect(r.warnings).toContain(GNLU_WARNING);
  });

  it('passing straight through GNLU on the main line is not a change', () => {
    const r = route('KOBG', 'RAYN');
    expect(r.interchanges).toHaveLength(0);
    expect(r.warnings).not.toContain(GNLU_WARNING);
  });

  it('PDEU -> Raysan changes at GNLU', () => {
    const r = route('PDEU', 'RAYN');
    expect(r.interchanges).toEqual([{ stationId: 'GNLU', fromCorridorId: 'gift', toCorridorId: 'ns' }]);
    expect(r.segments[0].direction).toBe('Towards GNLU');
  });

  it('every pair of stations has a route, and reverse routes have equal length', () => {
    for (const a of ds.stations) {
      for (const b of ds.stations) {
        if (a.id === b.id) continue;
        const f = findRoute(net, a.id, b.id);
        const r = findRoute(net, b.id, a.id);
        expect(f.ok).toBe(true);
        expect(r.ok).toBe(true);
        if (f.ok && r.ok) {
          expect(r.stopCount).toBe(f.stopCount);
          // consecutive stations in every route are directly connected
          for (let i = 0; i < f.stationIds.length - 1; i++) {
            const hop = net.edges.get(f.stationIds[i])!.some((e) => e.toStationId === f.stationIds[i + 1]);
            expect(hop).toBe(true);
          }
        }
      }
    }
  });
});

describe('error handling', () => {
  it('rejects the same station', () => {
    const r = findRoute(net, 'MTRS', 'MTRS');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('SAME_STATION');
  });

  it('rejects unknown ids', () => {
    const r = findRoute(net, 'MTRS', 'NOPE');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('UNKNOWN_STATION');
  });

  it('rejects missing input', () => {
    const r = findRoute(net, null, 'MTRS');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('MISSING_INPUT');
  });

  it('reports NO_ROUTE when the graph is disconnected', () => {
    const broken = buildNetwork({
      stations: ds.stations,
      corridors: ds.corridors,
      connections: ds.connections.filter((c) => c.corridorId !== 'gift'),
    });
    const r = findRoute(broken, 'GNLU', 'GIFC');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('NO_ROUTE');
      expect(r.message).toContain('GIFT City');
    }
  });

  it('ignores dangling connections instead of crashing', () => {
    const odd = buildNetwork({
      stations: ds.stations,
      corridors: ds.corridors,
      connections: [...ds.connections, { ...ds.connections[0], id: 'x', toStationId: 'GHOST' }],
    });
    expect(findRoute(odd, 'APMC', 'JVRJ').ok).toBe(true);
  });
});
