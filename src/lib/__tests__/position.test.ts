import { resolvePosition } from '../position';
import type { JourneyProgress } from '../locator';

const ids = ['A', 'B', 'C', 'D', 'E'];
const gps = (over: Partial<JourneyProgress> = {}): JourneyProgress => ({
  status: 'tracking',
  progress: 1.5,
  atStationId: null,
  lastStationId: 'B',
  nextStationId: 'C',
  stopsRemaining: 3,
  distanceToNextM: 420,
  offRouteM: 30,
  arriving: false,
  arrived: false,
  approximate: false,
  ...over,
});

describe('resolvePosition', () => {
  it('uses live GPS when the signal is fresh', () => {
    expect(resolvePosition(ids, gps(), 'live', null, null)).toMatchObject({ source: 'gps', lastStationId: 'B', nextStationId: 'C', stopsRemaining: 3, distanceToNextM: 420 });
    expect(resolvePosition(ids, gps(), 'stale', 3, null)!.source).toBe('gps');
  });

  it('prefers the passenger check-in once the GPS signal is lost', () => {
    const p = resolvePosition(ids, gps(), 'lost', 2, null)!;
    expect(p).toMatchObject({ source: 'checkin', atStationId: 'C', nextStationId: 'D', stopsRemaining: 2, arriving: false });
  });

  it('falls back to the last GPS position, labelled last-seen, and never extrapolates', () => {
    const p = resolvePosition(ids, gps(), 'lost', null, null)!;
    expect(p.source).toBe('last-seen');
    expect(p.progress).toBe(1.5);
  });

  it('knows nothing without GPS, check-in or demo', () => {
    expect(resolvePosition(ids, null, 'none', null, null)).toBeNull();
    expect(resolvePosition(ids, gps({ status: 'off-route', progress: null, lastStationId: null }), 'live', null, null)).toBeNull();
    expect(resolvePosition(['A'], null, 'none', 0, null)).toBeNull();
  });

  it('check-in at the second-to-last stop is "arriving"; at the last stop it is "arrived"', () => {
    expect(resolvePosition(ids, null, 'none', 3, null)).toMatchObject({ arriving: true, arrived: false, stopsRemaining: 1 });
    expect(resolvePosition(ids, null, 'none', 4, null)).toMatchObject({ arriving: false, arrived: true, stopsRemaining: 0, nextStationId: null });
  });

  it('a running demo wins over everything and is labelled demo', () => {
    expect(resolvePosition(ids, gps(), 'live', 3, 0)).toMatchObject({ source: 'demo', atStationId: 'A', stopsRemaining: 4 });
  });

  it('clamps out-of-range check-ins', () => {
    expect(resolvePosition(ids, null, 'none', 99, null)!.atStationId).toBe('E');
  });
});
