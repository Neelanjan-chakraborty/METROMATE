import { useFonts, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import type { TextStyle } from 'react-native';
import type { Language } from '../../i18n/languages';

/**
 * Manrope for the onboarding copy. It has Latin glyphs only, so Hindi and Gujarati keep the system font
 * (which has the proper Devanagari / Gujarati shapes and spacing). Text renders in the system font until
 * Manrope has loaded, so nothing waits on it.
 */
export function useOnboardingFonts(): boolean {
  const [loaded] = useFonts({ Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  return loaded;
}

type Weight = 'medium' | 'semibold' | 'bold' | 'extrabold';
const FAMILY: Record<Weight, string> = { medium: 'Manrope_500Medium', semibold: 'Manrope_600SemiBold', bold: 'Manrope_700Bold', extrabold: 'Manrope_800ExtraBold' };
const SYSTEM_WEIGHT: Record<Weight, TextStyle['fontWeight']> = { medium: '500', semibold: '600', bold: '700', extrabold: '800' };

/** Font style for a weight: Manrope in English once loaded, the system font in Hindi / Gujarati. */
export function fontFor(weight: Weight, lang: Language, loaded: boolean): TextStyle {
  if (lang === 'en' && loaded) return { fontFamily: FAMILY[weight] };
  return { fontWeight: SYSTEM_WEIGHT[weight] };
}
