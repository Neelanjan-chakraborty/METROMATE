import { DEFAULT_LANGUAGE, type Language } from './languages';
import { MESSAGES, type MessageKey } from './messages';
import type { Msg } from './catalog';

export type Params = Record<string, string | number>;
/** Translates a key into the active language. */
export type T = (key: MessageKey, params?: Params) => string;

/** Keys that have `.one` and `.other` forms, without the suffix. */
export type PluralKey = MessageKey extends infer K ? (K extends `${infer B}.one` ? B : never) : never;
/** Picks the right form for a count; `{n}` is filled in automatically. */
export type TN = (key: PluralKey, n: number, params?: Params) => string;

const PLACEHOLDER = /\{(\w+)\}/g;

export function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(PLACEHOLDER, (whole, name: string) => (name in params ? String(params[name]) : whole));
}

/** CLDR plural category for the three languages: English has one at exactly 1; Hindi and Gujarati at 0 and 1. */
export function pluralCategory(lang: Language, n: number): 'one' | 'other' {
  if (lang === 'en') return n === 1 ? 'one' : 'other';
  return n === 0 || n === 1 ? 'one' : 'other';
}

export function translate(lang: Language, key: MessageKey, params?: Params): string {
  const m = (MESSAGES as Record<string, Msg>)[key];
  const raw = m ? m[lang] || m[DEFAULT_LANGUAGE] : key;
  return interpolate(raw, params);
}

export function makeT(lang: Language): T {
  return (key, params) => translate(lang, key, params);
}

export function makeTN(lang: Language): TN {
  return (key, n, params) => translate(lang, `${key}.${pluralCategory(lang, n)}` as MessageKey, { n, ...params });
}

/** English translators: the default for pure helpers, so existing callers and tests keep their wording. */
export const enT: T = makeT('en');
export const enTN: TN = makeTN('en');
