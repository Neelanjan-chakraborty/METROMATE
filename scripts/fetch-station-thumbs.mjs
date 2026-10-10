// Fetches one small, compressed thumbnail per station from Wikimedia Commons (free-licensed photos only).
//
//   npm run fetch:thumbs                      # all stations that have no thumbnail yet
//   npm run fetch:thumbs -- --only AEC,APMC   # just these station ids
//   npm run fetch:thumbs -- --dry-run         # show what would be used, download nothing
//   npm run fetch:thumbs -- --refresh         # re-pick and re-download even if a file exists
//
// Needs internet access to commons.wikimedia.org (the MetroMate build container has none, so run this
// on your own machine). Output:
//   assets/stations/<ID>.webp                      360x300 WebP, quality 62 (about 12-22 KB each)
//   data/source/station-photos.json                provenance: title, page, licence, author per photo
//   src/components/stations/thumbs.generated.ts    static requires the app imports
// Review the picked files in data/source/station-photos.json. To correct a wrong pick, put the exact
// Commons file title in data/source/station-photo-overrides.json ({"AEC": "File:Name.jpg"}), or null to
// force the illustration, then re-run with --only <ID> --refresh. Stations with no acceptable photo keep
// the app's drawn illustration.

import { Buffer } from 'node:buffer';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { pickBest, renderThumbsModule, scoreCandidate, searchQueries } from '../src/lib/stationPhotos.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = process.env.COMMONS_API ?? 'https://commons.wikimedia.org/w/api.php';
const UA = 'MetroMateThumbFetcher/1.0 (https://github.com/neelanjan-chakraborty/metromate; offline metro companion)';
const OUT_DIR = join(root, 'assets', 'stations');
const MANIFEST = join(root, 'data', 'source', 'station-photos.json');
const OVERRIDES = join(root, 'data', 'source', 'station-photo-overrides.json');
const MODULE = join(root, 'src', 'components', 'stations', 'thumbs.generated.ts');
const WIDTH = 360;
const HEIGHT = 300;

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : null;
};
const only = opt('only')?.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) ?? null;
const dryRun = flag('dry-run');
const refresh = flag('refresh');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback);

async function http(url, asBuffer = false) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: asBuffer ? 'image/*' : 'application/json' } });
    if (res.ok) return asBuffer ? Buffer.from(await res.arrayBuffer()) : res.json();
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 1500 * 2 ** attempt;
      await sleep(wait);
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  throw new Error(`Gave up after retries: ${url}`);
}

const PAGE_PROPS = {
  prop: 'imageinfo|categories',
  iiprop: 'url|size|mime|extmetadata',
  iiurlwidth: '800',
  iiextmetadatafilter: 'LicenseShortName|Artist|Credit|AttributionRequired|NonFree',
  cllimit: '20',
  format: 'json',
  formatversion: '2',
  action: 'query',
};

async function query(params) {
  const url = `${API}?${new URLSearchParams({ ...PAGE_PROPS, ...params })}`;
  const json = await http(url);
  return json?.query?.pages ?? [];
}

const searchPages = (q) => query({ generator: 'search', gsrsearch: q, gsrnamespace: '6', gsrlimit: '12' });
const titlePages = (t) => query({ titles: t });

const stations = readJson(join(root, 'data', 'stations.json'), []);
const overrides = readJson(OVERRIDES, {});
let manifest = readJson(MANIFEST, { generatedBy: 'scripts/fetch-station-thumbs.mjs', photos: [] });
const byId = new Map(manifest.photos.map((p) => [p.stationId, p]));
mkdirSync(OUT_DIR, { recursive: true });

async function findFor(st) {
  if (Object.hasOwn(overrides, st.id)) {
    if (overrides[st.id] === null) return { skip: 'override: use the illustration' };
    const pages = await titlePages(overrides[st.id]);
    // An override is a human decision: it must still be a free raster photo, but needs no name match.
    const named = { ...st, name: overrides[st.id].replace(/^File:/i, '').replace(/\.[a-z0-9]+$/i, ''), aliases: [] };
    const c = pages[0] ? scoreCandidate(named, pages[0]) : null;
    return c ? { cand: c, by: 'override' } : { skip: `override ${overrides[st.id]} is missing, not a free raster image, or too small` };
  }
  for (const q of searchQueries(st)) {
    const pages = await searchPages(q);
    const cand = pickBest(st, pages, stations);
    if (cand) return { cand, by: 'auto' };
    await sleep(250);
  }
  return { skip: 'no acceptable free photo found' };
}

async function compress(buf) {
  return sharp(buf).rotate().resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' }).webp({ quality: 62, effort: 6 }).toBuffer();
}

const targets = stations.filter((s) => (only ? only.includes(s.id) : true));
const report = { matched: [], skipped: [], failed: [] };
let bytes = 0;

for (const st of targets) {
  const file = `${st.id}.webp`;
  if (!refresh && byId.has(st.id) && existsSync(join(OUT_DIR, file))) continue;
  try {
    const found = await findFor(st);
    if (!found.cand) {
      report.skipped.push(`${st.id} ${st.name}: ${found.skip}`);
      continue;
    }
    const { cand, by } = found;
    console.log(`${st.id.padEnd(5)} ${st.name.padEnd(26)} <- ${cand.page.title}  [${cand.license}, score ${cand.score}, ${by}]`);
    if (dryRun) {
      report.matched.push(st.id);
      continue;
    }
    const out = await compress(await http(cand.thumbUrl, true));
    writeFileSync(join(OUT_DIR, file), out);
    bytes += out.length;
    byId.set(st.id, {
      stationId: st.id,
      file,
      title: cand.page.title,
      pageUrl: cand.pageUrl,
      license: cand.license,
      credit: cand.credit,
      matchedBy: by,
      score: cand.score,
      bytes: out.length,
      fetchedAt: new Date().toISOString().slice(0, 10),
    });
    report.matched.push(st.id);
    await sleep(300);
  } catch (e) {
    report.failed.push(`${st.id} ${st.name}: ${e.message}`);
  }
}

if (!dryRun) {
  manifest = { ...manifest, photos: [...byId.values()].sort((a, b) => a.stationId.localeCompare(b.stationId)) };
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  const present = manifest.photos.filter((p) => existsSync(join(OUT_DIR, p.file)));
  writeFileSync(MODULE, renderThumbsModule(present));
}

console.log(`\n${dryRun ? 'Would use' : 'Saved'} ${report.matched.length} photo(s)${dryRun ? '' : `, ${(bytes / 1024).toFixed(0)} KB new`}.`);
if (report.skipped.length) console.log(`No photo (illustration used) for ${report.skipped.length}:\n  ${report.skipped.join('\n  ')}`);
if (report.failed.length) {
  console.log(`Failed ${report.failed.length}:\n  ${report.failed.join('\n  ')}`);
  process.exitCode = 1;
}
