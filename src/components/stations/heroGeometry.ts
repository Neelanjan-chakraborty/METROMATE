/**
 * Geometry and timing of the Stations hero (an express train rushing past station canopies).
 * All distances are in the hero's 430 x 124 viewBox units.
 *
 * Every scrolling layer is periodic: its artwork repeats every `period` units, and the layer is drawn
 * one screen-width longer than that period, so sliding it left by exactly one period and starting
 * again is invisible. These constants keep that true; the tests check it.
 */
export const HERO_W = 430;
export const HERO_H = 124;
/** Deck surface (the train's wheels / the platform edge). */
export const DECK_Y = 104;

/** Distance between station canopies. */
export const STATION_SPACING = 215;
/** Station canopies before the pattern repeats (their accent colours / sides differ within the cycle). */
export const STATION_CYCLE = 4;
export const NEAR_PERIOD = STATION_SPACING * STATION_CYCLE; // 860
export const NEAR_WIDTH = NEAR_PERIOD + HERO_W; // 1290
/** First canopy centre: the second one sits behind the middle of the train when motion is off. */
export const STATION_OFFSET = 56;
export const PILLAR_SPACING = 43;
/** Train sits at a fixed place on screen; the world moves past it. */
export const TRAIN_X = 150;

export const MID_PERIOD = HERO_W;
export const FAR_PERIOD = HERO_W;
export const STREAK_PERIOD = HERO_W;

/** Milliseconds per loop. Near speed = 860 / 4.5 s, about 190 units/s: an express passing a station every ~1.1 s. */
export const NEAR_MS = 4_500;
/** Mid layer moves at half the near speed, the far skyline at about a fifth, speed streaks at about 2.5x. */
export const MID_MS = 4_500;
export const FAR_MS = 11_300;
export const STREAK_MS = 900;

export const speedOf = (period: number, ms: number) => (period / ms) * 1000;

/** Canopy centres across the drawn near strip. */
export function stationCentres(): number[] {
  const out: number[] = [];
  for (let x = STATION_OFFSET; x < NEAR_WIDTH + STATION_SPACING; x += STATION_SPACING) out.push(x);
  return out;
}

/** Pillar x positions across the drawn near strip. */
export function pillarXs(): number[] {
  const out: number[] = [];
  for (let x = 0; x <= NEAR_WIDTH; x += PILLAR_SPACING) out.push(x);
  return out;
}
