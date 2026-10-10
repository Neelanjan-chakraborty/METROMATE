import { useMemo } from 'react';
import { useApp } from '../state/AppProvider';
import { languageInfo, type Language } from './languages';
import { makeT, makeTN, type T, type TN } from './translate';

export interface Translation {
  t: T;
  /** Plural-aware: `tn('route.stops', 3)` picks `route.stops.one` / `.other`. */
  tn: TN;
  lang: Language;
  /** BCP 47 locale of the active language. */
  locale: string;
  setLanguage: (l: Language) => Promise<void>;
}

/** The active interface language and its translators. Re-renders the caller when the language changes. */
export function useT(): Translation {
  const { language, setLanguage } = useApp();
  return useMemo(() => ({ t: makeT(language), tn: makeTN(language), lang: language, locale: languageInfo(language).locale, setLanguage }), [language, setLanguage]);
}
