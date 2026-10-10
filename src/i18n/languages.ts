/** UI languages. English is the source text; Hindi and Gujarati are translations of the interface only. */
export type Language = 'en' | 'hi' | 'gu';

export interface LanguageInfo {
  id: Language;
  /** The language's name in its own script: what the picker shows. */
  native: string;
  english: string;
  /** BCP 47 tag, for number/date helpers and accessibility. */
  locale: string;
  /** Two-letter code shown on the compact language button. */
  short: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { id: 'en', native: 'English', english: 'English', locale: 'en-IN', short: 'EN' },
  { id: 'hi', native: 'हिन्दी', english: 'Hindi', locale: 'hi-IN', short: 'हि' },
  { id: 'gu', native: 'ગુજરાતી', english: 'Gujarati', locale: 'gu-IN', short: 'ગુ' },
];

export const DEFAULT_LANGUAGE: Language = 'en';

export const isLanguage = (v: unknown): v is Language => v === 'en' || v === 'hi' || v === 'gu';

export const languageInfo = (l: Language): LanguageInfo => LANGUAGES.find((x) => x.id === l) ?? LANGUAGES[0];

/**
 * First-launch default from the phone's language (Hindi or Gujarati if the phone is set to one, else English).
 * Uses Intl, which Hermes provides on both platforms; falls back to English if it is missing.
 */
export function detectLanguage(): Language {
  try {
    const tag = (Intl.DateTimeFormat().resolvedOptions().locale || '').toLowerCase();
    if (tag.startsWith('hi')) return 'hi';
    if (tag.startsWith('gu')) return 'gu';
  } catch {
    /* no Intl */
  }
  return DEFAULT_LANGUAGE;
}
