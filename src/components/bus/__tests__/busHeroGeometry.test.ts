import {
  DASH_MS,
  DASH_PERIOD,
  DASH_WIDTH,
  FAR_MS,
  FAR_PERIOD,
  FAR_WIDTH,
  HERO_W,
  MID_MS,
  MID_PERIOD,
  MID_WIDTH,
  NEAR_MS,
  NEAR_PERIOD,
  NEAR_WIDTH,
  POLE_SPACING,
  SCENES,
  SCENE_W,
  SIGNS,
  STREAK_MS,
  STREAK_PERIOD,
  dashXs,
  poleXs,
  signX,
  speedOf,
} from '../busHeroGeometry';
import { busLook } from '../busLook';
import { heroLookAt } from '../../../lib/skyPalette';
import { loadTransit } from '../../../lib/transit/transitData';
import { buildRouteIndex } from '../../../lib/transit/routeIndex';
import { normalize } from '../../../lib/search';

describe('Bus hero geometry', () => {
  it('loops seamlessly: every layer is drawn one screen wider than its period', () => {
    expect(NEAR_WIDTH).toBe(NEAR_PERIOD + HERO_W);
    expect(MID_WIDTH).toBe(MID_PERIOD + HERO_W);
    expect(FAR_WIDTH).toBe(FAR_PERIOD + HERO_W);
    expect(DASH_WIDTH).toBe(DASH_PERIOD + HERO_W);
    expect(NEAR_PERIOD).toBe(SCENE_W * SCENES.length);
    expect(MID_PERIOD).toBe(NEAR_PERIOD);
    expect(NEAR_PERIOD % POLE_SPACING).toBe(0); // poles repeat each loop
    expect(FAR_PERIOD % SCENE_W).toBe(0);
    expect(STREAK_PERIOD).toBe(HERO_W);
  });

  it('draws enough poles and dashes to cover the strips', () => {
    const p = poleXs();
    expect(p[p.length - 1] + POLE_SPACING).toBeGreaterThan(NEAR_WIDTH);
    for (let i = 1; i < p.length; i++) expect(p[i] - p[i - 1]).toBe(POLE_SPACING);
    const d = dashXs();
    expect(d[d.length - 1] + DASH_PERIOD).toBeGreaterThan(DASH_WIDTH);
    expect(d[0]).toBe(0);
  });

  it('parallax: far < mid < near = road dashes < streaks; a scene about every 4 seconds', () => {
    const near = speedOf(NEAR_PERIOD, NEAR_MS);
    const mid = speedOf(MID_PERIOD, MID_MS);
    const far = speedOf(FAR_PERIOD, FAR_MS);
    const dash = speedOf(DASH_PERIOD, DASH_MS);
    const streak = speedOf(STREAK_PERIOD, STREAK_MS);
    expect(far).toBeLessThan(mid);
    expect(mid).toBeLessThan(near);
    expect(Math.abs(dash - near) / near).toBeLessThan(0.01);
    expect(near).toBeLessThan(streak);
    expect(SCENE_W / near).toBeGreaterThan(3);
    expect(SCENE_W / near).toBeLessThan(5);
  });

  it('one signboard per scene, each fully inside its scene', () => {
    expect(SIGNS).toHaveLength(SCENES.length);
    expect(new Set(SIGNS.map((s) => s.scene)).size).toBe(SCENES.length);
    for (const s of SIGNS) {
      const w = 22 + s.name.length * 5.6;
      expect(signX(s.scene)).toBeGreaterThanOrEqual(s.scene * SCENE_W);
      expect(signX(s.scene) + w).toBeLessThanOrEqual((s.scene + 1) * SCENE_W);
    }
  });

  it('every place named on a board appears in the bus data (a board never invents a place)', () => {
    const ix = loadTransit();
    const ri = buildRouteIndex(ix);
    const haystack = [...ix.data.stops.name, ...ri.routes.map((r) => r.long)].map(normalize);
    for (const s of SIGNS) {
      const n = normalize(s.name);
      expect(haystack.some((h) => h.split(' ').includes(n))).toBe(true);
    }
  });

  it('the warmed sky keeps the time of day: dark at night, light by day, same sun position', () => {
    for (const minute of [0, 6 * 60, 12 * 60, 18 * 60, 22 * 60]) {
      const base = heroLookAt(minute);
      const warm = busLook(base);
      expect(warm.night).toBe(base.night);
      expect(warm.body).toEqual(base.body);
      expect(warm.windowsLit).toBe(base.windowsLit);
      expect(warm.skyTop).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(busLook(heroLookAt(12 * 60)).skyTop).not.toBe(heroLookAt(12 * 60).skyTop);
  });
});
