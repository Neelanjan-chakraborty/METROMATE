import type { Language } from '../../i18n';

/**
 * Hindi and Gujarati glyphs (matras above and below the line) need more vertical room than Latin text, so wrapping
 * text gets an explicit line height outside English. English is left to the platform default, as before.
 */
export const lineHeightFor = (lang: Language, size: number, ratio = 1.45): number | undefined => (lang === 'en' ? undefined : Math.round(size * ratio));

/** Letter spacing opens up Latin capitals but breaks Devanagari/Gujarati conjuncts, so it applies to English only. */
export const spacingFor = (lang: Language, value: number): number => (lang === 'en' ? value : 0);
