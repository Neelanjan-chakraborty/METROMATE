import { milestonesBetween, movementState, reliableSpeedKmh, statusMessage, type MovementInput } from '../journeyStatus';

const NOW = 1_000_000;

describe('reliableSpeedKmh', () => {
  const fix = (o: object = {}) => ({ speedMps: 5, accuracyM: 10, timestamp: NOW - 2000, ...o });
  it('converts a good reading', () => expect(reliableSpeedKmh(fix(), NOW)).toBe(18));
  it('omits missing, negative, stale, imprecise or absurd readings', () => {
    expect(reliableSpeedKmh(null, NOW)).toBeNull();
    expect(reliableSpeedKmh(fix({ speedMps: null }), NOW)).toBeNull();
    expect(reliableSpeedKmh(fix({ speedMps: undefined }), NOW)).toBeNull();
    expect(reliableSpeedKmh(fix({ speedMps: -1 }), NOW)).toBeNull();
    expect(reliableSpeedKmh(fix({ timestamp: NOW - 30_000 }), NOW)).toBeNull();
    expect(reliableSpeedKmh(fix({ accuracyM: 120 }), NOW)).toBeNull();
    expect(reliableSpeedKmh(fix({ accuracyM: null }), NOW)).toBeNull();
    expect(reliableSpeedKmh(fix({ speedMps: 80 }), NOW)).toBeNull();
  });
});

describe('movementState', () => {
  const base: MovementInput = { speedKmh: 30, atStationId: null, arriving: false, arrived: false, distanceToNextM: 1500, source: 'gps', signal: 'live' };
  it('moving / stopped / approaching / at station', () => {
    expect(movementState(base)).toBe('moving');
    expect(movementState({ ...base, speedKmh: 0 })).toBe('stopped');
    expect(movementState({ ...base, distanceToNextM: 300 })).toBe('approaching');
    expect(movementState({ ...base, atStationId: 'X', speedKmh: 0 })).toBe('at-station');
  });
  it('without a speed it does not claim stopped', () => expect(movementState({ ...base, speedKmh: null })).toBe('moving'));
  it('estimated and signal-lost take priority', () => {
    expect(movementState({ ...base, source: 'estimated' })).toBe('estimated');
    expect(movementState({ ...base, signal: 'lost' })).toBe('signal-lost');
    expect(movementState({ ...base, source: 'last-seen' })).toBe('signal-lost');
  });
  it('a check-in alone only knows the position', () => expect(movementState({ ...base, source: 'checkin', speedKmh: null })).toBe('unknown'));
});

describe('statusMessage', () => {
  const base = { arrived: false, movement: 'moving' as const, nextName: 'Gandhigram', destinationName: 'GNLU', nextIsInterchange: false, etaUpdated: false, behindMin: null, inTunnel: false, source: 'gps' };
  it('answers in plain language', () => {
    expect(statusMessage(base).text).toBe('On your way to the next station.');
    expect(statusMessage({ ...base, movement: 'approaching' }).text).toBe('Approaching Gandhigram.');
    expect(statusMessage({ ...base, nextIsInterchange: true, nextName: 'Old High Court' }).text).toBe('Change trains at Old High Court.');
    expect(statusMessage({ ...base, arrived: true }).text).toBe('You’ve arrived at GNLU.');
    expect(statusMessage({ ...base, etaUpdated: true, behindMin: 4 }).text).toMatch(/arrival time has been updated/);
  });
  it('does not claim progress before any position is known', () => {
    expect(statusMessage({ ...base, hasPosition: false, source: 'none' }).text).toMatch(/Waiting for your position/);
  });
  it('is explicit about demo, lost GPS and estimates', () => {
    expect(statusMessage({ ...base, source: 'demo' }).tone).toBe('warn');
    expect(statusMessage({ ...base, movement: 'signal-lost' }).text).toMatch(/nothing is guessed/);
    expect(statusMessage({ ...base, movement: 'estimated' }).text).toMatch(/estimate/);
  });
});

describe('milestonesBetween', () => {
  const ctx = { stations: 9, interchangeIdx: new Set([4]) };
  const snap = (progress: number, o: object = {}) => ({ progress, underground: false, arriving: false, arrived: false, ...o });
  it('reports a passed station once', () => {
    expect(milestonesBetween(snap(1.8), snap(2.2), ctx)).toEqual([{ kind: 'passed', idx: 2 }]);
    expect(milestonesBetween(snap(2.2), snap(2.6), ctx)).toEqual([]);
  });
  it('halfway, tunnel in/out, interchange next, approaching, arrived', () => {
    expect(milestonesBetween(snap(3.9), snap(4.1), ctx).map((m) => m.kind)).toContain('halfway');
    expect(milestonesBetween(snap(1.2), snap(1.4, { underground: true }), ctx)).toEqual([{ kind: 'tunnel-in' }]);
    expect(milestonesBetween(snap(1.2, { underground: true }), snap(1.4), ctx)).toEqual([{ kind: 'tunnel-out' }]);
    expect(milestonesBetween(snap(2.9), snap(3.1), ctx)).toEqual([{ kind: 'passed', idx: 3 }, { kind: 'interchange', idx: 4 }]);
    expect(milestonesBetween(snap(6.5), snap(7.5, { arriving: true }), ctx).map((m) => m.kind)).toContain('approaching');
    expect(milestonesBetween(snap(7.9), snap(8, { arrived: true }), ctx).map((m) => m.kind)).toContain('arrived');
  });
  it('says nothing on the first sample', () => expect(milestonesBetween(null, snap(3), ctx)).toEqual([]));
});
