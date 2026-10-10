import { describeLocation, describeLocationCard, describeSignalLoss, walkMinutes, walkingDirectionsUrl } from '../liveText';

const name = (id: string) => ({ A: 'Alpha', B: 'Beta' })[id as 'A' | 'B'] ?? id;

describe('describeLocation', () => {
  it('describes each result kind without overstating certainty', () => {
    expect(describeLocation({ kind: 'at-station', stationId: 'A', distanceM: 40, approximate: false }, name, 8).headline).toBe('At Alpha');
    expect(describeLocation({ kind: 'at-station', stationId: 'A', distanceM: 40, approximate: true }, name, 200).headline).toBe('At or near Alpha');
    const near = describeLocation({ kind: 'near-station', stationId: 'A', distanceM: 1500, approximate: true }, name, 800);
    expect(near.headline).toBe('Near Alpha');
    expect(near.detail).toMatch(/1\.5 km/);
    expect(near.detail).toMatch(/approximate/);
    const between = describeLocation({ kind: 'between', fromId: 'A', toId: 'B', fraction: 0.4, offLineM: 20, approximate: false }, name, 10);
    expect(between.headline).toBe('Between Alpha and Beta');
    expect(between.detail).toMatch(/40% of the way from Alpha/);
    expect(describeLocation({ kind: 'off-network', nearestId: 'B', distanceM: 5200 }, name, 10).detail).toMatch(/Beta, 5\.2 km/);
    expect(describeLocation({ kind: 'unreliable', reason: 'accuracy' }, name, 6000).headline).toMatch(/too inaccurate/);
    expect(describeLocation({ kind: 'no-reference' }, name, null).headline).toMatch(/unavailable/);
  });

  it('labels GPS-class versus network-assisted accuracy', () => {
    expect(describeLocation({ kind: 'at-station', stationId: 'A', distanceM: 1, approximate: false }, name, 8).detail).toMatch(/GPS-class/);
    expect(describeLocation({ kind: 'near-station', stationId: 'A', distanceM: 900, approximate: true }, name, 900).detail).toMatch(/network-assisted/);
  });
});

describe('describeSignalLoss', () => {
  it('explains an underground gap and never claims a position', () => {
    const t = describeSignalLoss(90, 'between Shahpur and Gheekanta', true);
    expect(t.headline).toMatch(/underground/);
    expect(t.detail).toMatch(/Last seen: between Shahpur and Gheekanta/);
    expect(t.detail).toMatch(/does not guess/);
  });
  it('uses a generic message above ground', () => {
    expect(describeSignalLoss(60, null, false).headline).toBe('GPS signal lost');
  });
});

describe('describeLocationCard', () => {
  const name = (id: string) => (({ SCT1: 'Sector-1', GNLU: 'GNLU' }) as Record<string, string>)[id] ?? id;
  it('off-network: nearest station with distance and a rounded walking estimate', () => {
    const c = describeLocationCard({ kind: 'off-network', nearestId: 'SCT1', distanceM: 1000 }, name, 13);
    expect(c).toEqual({ icon: 'walk', headline: 'Not on a metro line yet', lines: ['Nearest station is Sector-1', '1.0 km away · ~12 min walk'], nearestId: 'SCT1' });
  });
  it('near a station offers directions to it; at a station and between do not', () => {
    expect(describeLocationCard({ kind: 'near-station', stationId: 'GNLU', distanceM: 180, approximate: false }, name, 20)).toMatchObject({ icon: 'walk', headline: 'Near GNLU', nearestId: 'GNLU' });
    expect(describeLocationCard({ kind: 'at-station', stationId: 'GNLU', distanceM: 10, approximate: false }, name, 10)).toMatchObject({ icon: 'station', nearestId: null });
    expect(describeLocationCard({ kind: 'between', fromId: 'SCT1', toId: 'GNLU', fraction: 0.5, offLineM: 5, approximate: false }, name, 10)).toMatchObject({ icon: 'train', nearestId: null });
  });
  it('unreliable fixes never produce a place', () => {
    expect(describeLocationCard({ kind: 'unreliable', reason: 'accuracy' }, name, 900)).toMatchObject({ icon: 'warn', nearestId: null });
  });
  it('walk estimate is at least one minute', () => {
    expect(walkMinutes(10)).toBe(1);
    expect(walkMinutes(2500)).toBe(30);
  });
  it('builds a walking-directions link with the destination coordinates', () => {
    expect(walkingDirectionsUrl(23.2156, 72.6369)).toContain('destination=23.215600,72.636900&travelmode=walking');
  });
});
