import { useWindowDimensions } from 'react-native';

/** The Home design is drawn for a 430 dp wide phone; everything scales down (never up) from there. */
export const DESIGN_WIDTH = 430;

export function useHomeScale() {
  const { width } = useWindowDimensions();
  const s = Math.min(1, width / DESIGN_WIDTH);
  const z = (n: number) => Math.round(n * s * 10) / 10;
  return { z, s, width };
}
