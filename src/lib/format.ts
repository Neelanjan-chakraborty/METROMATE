const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-05" -> "5 Oct 2026". Returns the input unchanged if it is not an ISO date. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'unknown';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1];
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
