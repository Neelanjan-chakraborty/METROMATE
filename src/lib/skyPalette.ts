/**
 * Time-of-day look for the Home hero: sky gradient, horizon glow, tower tints, how many city
 * windows are lit, stars, sun/moon position and legible header ink colours.
 * Pure functions: the same minute of the day always gives the same palette.
 */

export interface SkyPalette {
  skyTop: string;
  skyBottom: string;
  glow: string;
  glowOpacity: number;
  farTop: string;
  farBottom: string;
  nearTop: string;
  nearBottom: string;
  domeBase: string;
  domeTop: string;
  cloud: string;
  cloudOpacity: number;
  /** 0 (all dark) .. 1 (every window lit). */
  windowsLit: number;
  /** 0..1 star brightness. */
  stars: number;
  /** 0 (full day) .. 1 (deep night). */
  night: number;
  /** 0..1: how strongly train windows and headlight glow. */
  trainLight: number;
}

export interface CelestialBody {
  kind: 'sun' | 'moon';
  /** Position in the 430 x 172 hero viewBox. */
  x: number;
  y: number;
  /** 0..1, fades near the horizon. */
  opacity: number;
  color: string;
}

export interface HeroLook extends SkyPalette {
  body: CelestialBody | null;
  /** Colour for the brand name and other primary header text. */
  ink: string;
  /** Colour for the tagline and other secondary header text. */
  inkSoft: string;
  /** Status-bar icon colour that stays visible on this sky. */
  statusBar: 'dark' | 'light';
}

type Key = Omit<SkyPalette, never>;

const NIGHT: Key = {
  skyTop: '#141238', skyBottom: '#2E2C74', glow: '#6B63D9', glowOpacity: 0.18,
  farTop: '#34357A', farBottom: '#26265F', nearTop: '#2A2B6A', nearBottom: '#1F1F52',
  domeBase: '#3A3A84', domeTop: '#464694', cloud: '#5A58A8', cloudOpacity: 0.0,
  windowsLit: 0.85, stars: 1, night: 1, trainLight: 1,
};
const DAWN: Key = {
  skyTop: '#5B4FA8', skyBottom: '#F6A98B', glow: '#FFB48A', glowOpacity: 0.6,
  farTop: '#8F8FCB', farBottom: '#E3BFC8', nearTop: '#7C7BBE', nearBottom: '#C9A9C0',
  domeBase: '#9D95C9', domeTop: '#B7A1BF', cloud: '#FFC7B0', cloudOpacity: 0.55,
  windowsLit: 0.45, stars: 0.25, night: 0.45, trainLight: 0.7,
};
const MORNING: Key = {
  skyTop: '#D3DEFF', skyBottom: '#FCE7DF', glow: '#FFD9B8', glowOpacity: 0.45,
  farTop: '#D6DBF4', farBottom: '#EAE6F6', nearTop: '#C8CBEE', nearBottom: '#DEDAF2',
  domeBase: '#D6D1F2', domeTop: '#C9C3EC', cloud: '#FFFFFF', cloudOpacity: 0.8,
  windowsLit: 0.02, stars: 0, night: 0, trainLight: 0,
};
// Midday matches the supplied design reference.
const DAY: Key = {
  skyTop: '#F4F2FF', skyBottom: '#E5E3FB', glow: '#FFD9C8', glowOpacity: 0.55,
  farTop: '#D3D9F4', farBottom: '#E7E8F8', nearTop: '#C6C9EE', nearBottom: '#DAD9F3',
  domeBase: '#D8D4F3', domeTop: '#C6C0EB', cloud: '#FFFFFF', cloudOpacity: 0.75,
  windowsLit: 0, stars: 0, night: 0, trainLight: 0,
};
const GOLDEN: Key = {
  skyTop: '#A99AE0', skyBottom: '#FFB992', glow: '#FF9E6B', glowOpacity: 0.85,
  farTop: '#A9A3DC', farBottom: '#F0B8B0', nearTop: '#968FD0', nearBottom: '#E3A5A8',
  domeBase: '#B8A6D6', domeTop: '#CFA3B6', cloud: '#FFD2B8', cloudOpacity: 0.8,
  windowsLit: 0.25, stars: 0, night: 0.2, trainLight: 0.25,
};
const DUSK: Key = {
  skyTop: '#43397F', skyBottom: '#E58BA2', glow: '#FF8A7A', glowOpacity: 0.65,
  farTop: '#5B5398', farBottom: '#9A6F9D', nearTop: '#4B4488', nearBottom: '#85608F',
  domeBase: '#625A9C', domeTop: '#8A6A98', cloud: '#C58AA8', cloudOpacity: 0.5,
  windowsLit: 0.7, stars: 0.2, night: 0.6, trainLight: 0.85,
};
const EVENING: Key = {
  skyTop: '#231F5C', skyBottom: '#4D3F95', glow: '#8E6BD0', glowOpacity: 0.3,
  farTop: '#3F3C86', farBottom: '#2E2D6E', nearTop: '#34337C', nearBottom: '#262660',
  domeBase: '#46448E', domeTop: '#52509C', cloud: '#6A5FB0', cloudOpacity: 0.1,
  windowsLit: 0.95, stars: 0.7, night: 0.9, trainLight: 1,
};

/** [minute of day, palette]. Must start at 0 and end at 1440 with the same palette. */
const KEYFRAMES: [number, Key][] = [
  [0, NIGHT],
  [300, NIGHT], // 05:00
  [360, DAWN], // 06:00
  [450, MORNING], // 07:30
  [600, DAY], // 10:00
  [960, DAY], // 16:00
  [1080, GOLDEN], // 18:00
  [1140, DUSK], // 19:00
  [1200, EVENING], // 20:00
  [1290, NIGHT], // 21:30
  [1440, NIGHT],
];

// ------------------------------------------------------------------ helpers

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');

export function mixColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return `#${toHex(lerp(ar, br, t))}${toHex(lerp(ag, bg, t))}${toHex(lerp(ab, bb, t))}`.toUpperCase();
}

/** Relative luminance 0..1 (sRGB). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Normalises any minute count into [0, 1440). */
export function wrapMinutes(m: number): number {
  return ((m % 1440) + 1440) % 1440;
}

export function minuteOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

// ------------------------------------------------------------------ palette

export function skyPaletteAt(minutes: number): SkyPalette {
  const m = wrapMinutes(minutes);
  let i = 0;
  while (i < KEYFRAMES.length - 2 && m >= KEYFRAMES[i + 1][0]) i++;
  const [t0, a] = KEYFRAMES[i];
  const [t1, b] = KEYFRAMES[i + 1];
  // smoothstep so colours ease in and out of each keyframe instead of changing at a constant rate
  const raw = clamp01((m - t0) / (t1 - t0));
  const t = raw * raw * (3 - 2 * raw);
  const out = {} as SkyPalette;
  for (const k of Object.keys(a) as (keyof SkyPalette)[]) {
    const av = a[k];
    const bv = b[k];
    (out as unknown as Record<string, number | string>)[k] = typeof av === 'number' ? lerp(av, bv as number, t) : mixColor(av as string, bv as string, t);
  }
  return out;
}

/** Sun (06:00–18:00) or moon (18:00–06:00) travelling along an arc in front of the distant skyline. */
export function celestialBodyAt(minutes: number): CelestialBody {
  const m = wrapMinutes(minutes);
  const isDay = m >= 360 && m < 1080;
  const f = isDay ? (m - 360) / 720 : ((m >= 1080 ? m : m + 1440) - 1080) / 720; // 0..1 along the arc
  const x = 36 + f * 358;
  const y = 132 - 50 * Math.sin(Math.PI * f);
  const horizonFade = clamp01(Math.sin(Math.PI * f) * 3.2);
  if (isDay) {
    const warmth = 1 - clamp01(Math.sin(Math.PI * f) * 1.6);
    return { kind: 'sun', x, y, opacity: horizonFade, color: mixColor('#FFE9A8', '#FF9F6B', warmth) };
  }
  return { kind: 'moon', x, y, opacity: horizonFade, color: '#F1EEFF' };
}

/**
 * Colour the header text actually sits on: the upper-middle of the sky gradient with the distant
 * towers showing through it (the hero is cropped to its lower part on shorter screens).
 */
export function headerBackdrop(p: SkyPalette): string {
  return mixColor(mixColor(p.skyTop, p.skyBottom, 0.3), p.farTop, 0.35);
}

export function heroLookAt(minutes: number): HeroLook {
  const p = skyPaletteAt(minutes);
  const backdrop = headerBackdrop(p);
  const darkSky = luminance(backdrop) < 0.3;
  const body = celestialBodyAt(minutes);
  return {
    ...p,
    body: body.opacity > 0.02 ? body : null,
    ink: darkSky ? '#FFFFFF' : '#111A32',
    // the reference slate on bright skies, a deeper slate on the mid-tone dawn and golden-hour skies
    inkSoft: darkSky ? '#E4E6FF' : mixColor('#3E4766', '#66718C', clamp01((luminance(backdrop) - 0.45) / 0.2)),
    statusBar: darkSky ? 'light' : 'dark',
  };
}

/** Deterministic 0..1 value for a (tower, row, column) so each window keeps its own on/off threshold. */
export function windowThreshold(a: number, b: number, c: number): number {
  let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791);
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 10000) / 10000;
}

export const windowIsLit = (a: number, b: number, c: number, litAmount: number): boolean => windowThreshold(a, b, c) < litAmount;
