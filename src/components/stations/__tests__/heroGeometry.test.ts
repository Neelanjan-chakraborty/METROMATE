import {
  FAR_MS,
  FAR_PERIOD,
  HERO_W,
  MID_MS,
  MID_PERIOD,
  NEAR_MS,
  NEAR_PERIOD,
  NEAR_WIDTH,
  PILLAR_SPACING,
  STATION_CYCLE,
  STATION_OFFSET,
  STATION_SPACING,
  STREAK_MS,
  STREAK_PERIOD,
  TRAIN_X,
  pillarXs,
  speedOf,
  stationCentres,
} from '../heroGeometry';

describe('Stations hero geometry', () => {
  it('loops seamlessly: every layer is drawn one screen wider than its period', () => {
    expect(NEAR_WIDTH).toBe(NEAR_PERIOD + HERO_W);
    expect(NEAR_PERIOD % PILLAR_SPACING).toBe(0); // pillars and lamps repeat each loop
    expect(NEAR_PERIOD % STATION_SPACING).toBe(0);
    expect(NEAR_PERIOD).toBe(STATION_SPACING * STATION_CYCLE);
    expect(MID_PERIOD).toBe(HERO_W);
    expect(FAR_PERIOD).toBe(HERO_W);
    expect(STREAK_PERIOD).toBe(HERO_W);
  });

  it('draws enough canopies and pillars to cover the strip', () => {
    const c = stationCentres();
    expect(c[0]).toBe(STATION_OFFSET);
    expect(c[c.length - 1] + 100).toBeGreaterThanOrEqual(NEAR_WIDTH);
    for (let i = 1; i < c.length; i++) expect(c[i] - c[i - 1]).toBe(STATION_SPACING);
    const p = pillarXs();
    expect(p[p.length - 1]).toBeLessThanOrEqual(NEAR_WIDTH);
    expect(p[p.length - 1] + PILLAR_SPACING).toBeGreaterThan(NEAR_WIDTH);
  });

  it('parallax: far < mid < near < streaks, with a station about every second', () => {
    const near = speedOf(NEAR_PERIOD, NEAR_MS);
    const mid = speedOf(MID_PERIOD, MID_MS);
    const far = speedOf(FAR_PERIOD, FAR_MS);
    const streak = speedOf(STREAK_PERIOD, STREAK_MS);
    expect(far).toBeLessThan(mid);
    expect(mid).toBeLessThan(near);
    expect(near).toBeLessThan(streak);
    const secondsPerStation = STATION_SPACING / near;
    expect(secondsPerStation).toBeGreaterThan(0.8);
    expect(secondsPerStation).toBeLessThan(1.5);
  });

  it('with motion off, a canopy stands behind the middle of the train', () => {
    const trainMid = TRAIN_X + 121;
    expect(stationCentres().some((x) => Math.abs(x - trainMid) <= 2)).toBe(true);
  });
});
