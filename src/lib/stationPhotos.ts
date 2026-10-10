/**
 * Choosing a station thumbnail from Wikimedia Commons search results. Used by
 * `scripts/fetch-station-thumbs.mjs` (run on a machine with internet access) and unit-tested here.
 *
 * Nothing is accepted blindly: a candidate must be a raster photo, carry a name match for the station,
 * look like a metro/station picture rather than a map or logo, and have a free licence. The licence,
 * author and page are kept so the app can credit the photographer.
 */

export interface CommonsMeta {
  LicenseShortName?: string;
  Artist?: string;
  Credit?: string;
  AttributionRequired?: string;
  NonFree?: string;
}

export interface CommonsPage {
  title: string; // "File:Foo.jpg"
  imageinfo?: {
    thumburl?: string;
    url?: string;
    descriptionurl?: string;
    width?: number;
    height?: number;
    mime?: string;
    extmetadata?: Record<string, { value?: string } | undefined>;
  }[];
  categories?: { title: string }[];
}

export interface StationLike {
  id: string;
  name: string;
  aliases: string[];
  corridorIds: string[];
}

export interface Candidate {
  page: CommonsPage;
  score: number;
  thumbUrl: string;
  pageUrl: string;
  license: string;
  credit: string;
}

const FREE_LICENCE = /^(cc0|cc[ -]by(?:[ -]sa)?\b|public domain|pd\b|pdm|attribution|gfdl|fal\b|free art)/i;
const BAD_WORDS = /\b(map|route|logo|plan|diagram|schematic|timetable|ticket|poster|flag|coat|icon|seal|signature|infographic|layout|render|proposed|under construction model)\b/i;
const OK_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Search phrases, most specific first. */
export function searchQueries(st: StationLike): string[] {
  const place = st.corridorIds.includes('gift') || st.corridorIds.includes('ns') ? ['Ahmedabad', 'Gandhinagar'] : ['Ahmedabad'];
  const names = [st.name, ...st.aliases.slice(0, 1)];
  const out: string[] = [];
  for (const n of names) {
    for (const p of place) out.push(`${n} metro station ${p}`);
    out.push(`${n} metro station`);
  }
  out.push(`${st.name} Ahmedabad Metro`);
  return [...new Set(out)];
}

/** Does the file title/categories mention the station (all its words, in any order)? */
export function mentionsStation(st: StationLike, haystack: string): boolean {
  const h = ` ${normalize(haystack)} `;
  const names = [st.name, ...st.aliases];
  return names.some((n) => {
    const words = normalize(n).split(' ').filter(Boolean);
    if (words.length === 0) return false;
    // Short or generic names ("AEC", "Sector-1") must match as whole words, never as part of another word.
    return words.every((w) => h.includes(` ${w} `));
  });
}

export function stripHtml(s: string | undefined): string {
  return (s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isFreeLicence(name: string | undefined): boolean {
  return !!name && FREE_LICENCE.test(name.trim());
}

/**
 * True when another station's name contains this one's ("Sabarmati" inside "Sabarmati Railway Station",
 * "Thaltej" inside "Thaltej Gam") and the file is about that longer name. Such a file belongs to the other
 * station, so it must not be used for this one.
 */
export function belongsToLongerName(st: StationLike, text: string, others: StationLike[]): boolean {
  const mine = ` ${normalize(st.name)} `;
  return others.some((o) => {
    if (o.id === st.id) return false;
    const theirs = normalize(o.name);
    return theirs.length > mine.trim().length && ` ${theirs} `.includes(mine) && mentionsStation({ ...o, aliases: [] }, text);
  });
}

/** Scores one page for a station; null if it must not be used. */
export function scoreCandidate(st: StationLike, page: CommonsPage, others: StationLike[] = []): Candidate | null {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  if (!info.mime || !OK_MIME.has(info.mime)) return null;
  if ((info.width ?? 0) < 480 || (info.height ?? 0) < 300) return null;
  const meta = info.extmetadata ?? {};
  const license = stripHtml(meta.LicenseShortName?.value);
  if (!isFreeLicence(license) || meta.NonFree?.value === 'true') return null;

  const title = page.title.replace(/^File:/i, '').replace(/\.[a-z0-9]+$/i, '');
  const cats = (page.categories ?? []).map((c) => c.title).join(' ');
  if (BAD_WORDS.test(title)) return null;
  if (!mentionsStation(st, title) && !mentionsStation(st, cats)) return null;
  if (belongsToLongerName(st, `${title} ${cats}`, others)) return null;

  let score = 0;
  if (mentionsStation(st, title)) score += 6;
  else score += 3; // named in the categories only
  const t = normalize(title + ' ' + cats);
  if (/\bmetro\b/.test(t)) score += 3;
  if (/\bstation\b/.test(t)) score += 2;
  if (/\b(ahmedabad|gandhinagar|gift city|gmrc)\b/.test(t)) score += 2;
  if (/\b(entrance|exterior|platform|building|elevated|facade)\b/.test(t)) score += 1;
  // A station photo is landscape; a wide-enough one crops cleanly to the card.
  const ratio = (info.width ?? 1) / (info.height ?? 1);
  if (ratio >= 1.2 && ratio <= 2.2) score += 1;
  // Titles that look like a person or an unrelated place score lower.
  if (/\b(selfie|portrait|wedding|portr)\b/.test(t)) score -= 6;

  const thumbUrl = info.thumburl ?? info.url;
  if (!thumbUrl) return null;
  const artist = stripHtml(meta.Artist?.value) || stripHtml(meta.Credit?.value) || 'Unknown author';
  return {
    page,
    score,
    thumbUrl,
    pageUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
    license,
    credit: artist.length > 120 ? artist.slice(0, 117) + '…' : artist,
  };
}

/** Minimum score for an automatic match. A station name match alone (6) is not enough. */
export const MIN_SCORE = 9;

export function pickBest(st: StationLike, pages: CommonsPage[], others: StationLike[] = []): Candidate | null {
  let best: Candidate | null = null;
  for (const p of pages) {
    const c = scoreCandidate(st, p, others);
    if (c && c.score >= MIN_SCORE && (!best || c.score > best.score)) best = c;
  }
  return best;
}

// ------------------------------------------------------------ generated module

export interface PhotoRecord {
  stationId: string;
  /** File name inside assets/stations, e.g. "AEC.webp". */
  file: string;
  title: string;
  pageUrl: string;
  license: string;
  credit: string;
}

/** Source of `src/components/stations/thumbs.generated.ts`: one static require per photo so Metro bundles them. */
export function renderThumbsModule(records: PhotoRecord[]): string {
  const q = (s: string) => JSON.stringify(s);
  const rows = [...records]
    .sort((a, b) => a.stationId.localeCompare(b.stationId))
    .map(
      (r) =>
        `  ${q(r.stationId)}: { source: require('../../../assets/stations/${r.file}'), credit: ${q(r.credit)}, license: ${q(r.license)}, pageUrl: ${q(r.pageUrl)} },`,
    );
  return `// GENERATED by scripts/fetch-station-thumbs.mjs from data/source/station-photos.json. Do not edit by hand.
import type { StationPhoto } from './photos';

export const STATION_PHOTOS: Record<string, StationPhoto> = {${rows.length ? `\n${rows.join('\n')}\n` : ''}};
`;
}
