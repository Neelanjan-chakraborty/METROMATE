import { describeLocation, describeSignalLoss } from '../liveText';

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
