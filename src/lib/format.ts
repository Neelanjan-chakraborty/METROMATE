import type { Language } from '../i18n/languages';
import { MONTHS_SHORT } from '../i18n/months';
import { enT, makeT, type T } from '../i18n/translate';

/**
 * "2026-10-05" -> "5 Oct 2026" (month name in `lang`; digits stay Western). Returns the input unchanged if it is
 * not an ISO date, and "unknown" (translated) when there is none.
 */
export function formatDate(iso: string | null | undefined, lang: Language = 'en'): string {
  if (!iso) return makeT(lang)('common.unknown');
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const month = MONTHS_SHORT[lang][Number(m[2]) - 1];
  if (!month) return iso;
  return `${Number(m[3])} ${month} ${m[1]}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Optional, online-only search link. Never used for navigation inside the app. */
export function mapsSearchUrl(stationName: string): string {
  const q = encodeURIComponent(`${stationName} metro station, Gujarat, India`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/**
 * "Today", "Yesterday", or "9 Oct" for an epoch-ms timestamp, in the device's local time, in `lang`.
 * `now` is injectable for tests.
 */
export function relativeDay(ts: number, now: number = Date.now(), lang: Language = 'en'): string {
  const d = new Date(ts);
  const n = new Date(now);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(n) - startOf(d)) / 86_400_000);
  if (days === 0) return makeT(lang)('lib.day.today');
  if (days === 1) return makeT(lang)('lib.day.yesterday');
  return `${d.getDate()} ${MONTHS_SHORT[lang][d.getMonth()]}`;
}

/** "10:42 AM" for an epoch-ms time in the device's local time (no Intl needed). */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "45 min", "1 h 05 min" (units in the language of `t`). */
export function formatDuration(minutes: number, t: T = enT): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return t('lib.duration.min', { n: m });
  return t('lib.duration.hMin', { h: Math.floor(m / 60), m: String(m % 60).padStart(2, '0') });
}
