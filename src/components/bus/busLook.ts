import { mixColor, type HeroLook } from '../../lib/skyPalette';

/**
 * The shared time-of-day sky is violet-tinted (the rest of the app is violet). The Bus screens are red,
 * so the bus hero warms the sky: day skies lean peach, night skies a deep wine. Same hours, same sun and
 * moon, same lit windows; only the colours move.
 */
export function busLook(look: HeroLook): HeroLook {
  const warm = (c: string) => mixColor(mixColor(c, '#FFC9B0', (1 - look.night) * 0.38), '#4A1A2A', look.night * 0.35);
  return {
    ...look,
    skyTop: warm(look.skyTop),
    skyBottom: warm(look.skyBottom),
    farTop: warm(look.farTop),
    farBottom: warm(look.farBottom),
    nearTop: warm(look.nearTop),
    nearBottom: warm(look.nearBottom),
  };
}
