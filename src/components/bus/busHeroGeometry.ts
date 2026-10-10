/**
 * Geometry and timing of the Bus tab's animated header: a red bus lettered "GSRTC" driving past a city,
 * open fields, a village and a town. All distances are in the hero's 430 x 132 viewBox units.
 *
 * Every scrolling layer is periodic (its artwork repeats every `period` units) and is drawn one screen
 * wider than that, so sliding it left by one period and starting again is invisible. The tests check it.
 *
 * The lettering is decorative: the timetables in the app cover AMTS, BRTS and Gandhinagar buses, not GSRTC.
 */
export const HERO_W = 430;
export const HERO_H = 132;
/** Extra road below the artwork, so the search box can overlap the header without covering the bus. */
export const LIFT = 26;
/** Top of the road surface; the bus's wheels sit near the bottom of it. */
export const ROAD_Y = 108;
/** y of the bottom of the bus's tyres. */
export const WHEEL_BOTTOM = 125;
/** The bus stands at a fixed x; the world moves past it. */
export const BUS_X = 150;
export const BUS_LEN = 120;

export type SceneKind = 'city' | 'fields' | 'village' | 'town';
/** One screen-wide scene each, in the order they pass. */
export const SCENES: SceneKind[] = ['city', 'fields', 'village', 'town'];
export const SCENE_W = HERO_W;

/** Distance between roadside poles. */
export const POLE_SPACING = 86;
export const DASH_PERIOD = 43;

export const NEAR_PERIOD = SCENE_W * SCENES.length; // 1720
export const NEAR_WIDTH = NEAR_PERIOD + HERO_W;
export const MID_PERIOD = NEAR_PERIOD;
export const MID_WIDTH = MID_PERIOD + HERO_W;
export const FAR_PERIOD = 860;
export const FAR_WIDTH = FAR_PERIOD + HERO_W;
export const STREAK_PERIOD = HERO_W;

/** Milliseconds per loop. Near speed is about 115 units/s: a scene every 3.7 s, a full journey in 15 s. */
export const NEAR_MS = 15_000;
/** Mid scenery moves at half the near speed, the far skyline and hills at a fifth. */
export const MID_MS = 30_000;
export const FAR_MS = 37_500;
/** Road dashes move with the road: the same speed as the near layer. */
export const DASH_MS = Math.round((NEAR_MS * DASH_PERIOD) / NEAR_PERIOD);
export const STREAK_MS = 1_100;

export const speedOf = (period: number, ms: number) => (period / ms) * 1000;

/**
 * Place names on the roadside boards, one per scene. Real names that appear in the bus data (stop or
 * route names), so a board never invents a place. Decorative: a board is not a route or a distance.
 */
export const SIGNS: { scene: number; name: string }[] = [
  { scene: 0, name: 'Sarkhej' },
  { scene: 1, name: 'Chiloda' },
  { scene: 2, name: 'Pethapur' },
  { scene: 3, name: 'Kalol' },
];

/** x of each board inside the near strip (a little right of the scene's start so the board is whole on screen). */
export const signX = (scene: number) => scene * SCENE_W + 300;

/** Pole x positions across the drawn near strip. */
export function poleXs(): number[] {
  const out: number[] = [];
  for (let x = 10; x <= NEAR_WIDTH; x += POLE_SPACING) out.push(x);
  return out;
}

/** Dash x positions across the drawn dash strip (one screen wider than the period). */
export function dashXs(): number[] {
  const out: number[] = [];
  for (let x = 0; x <= DASH_PERIOD + HERO_W; x += DASH_PERIOD) out.push(x);
  return out;
}

export const DASH_WIDTH = DASH_PERIOD + HERO_W;
