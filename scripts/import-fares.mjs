// Imports a capture of GMRC's fare calculator (see scripts/capture-fares.browser.js) into
// data/fares.json, then bumps the dataset version so installed apps re-seed.
//
//   node scripts/import-fares.mjs gmrc-fares-capture.json [--map 12=OHCI,15=GEKA] [--data-dir <dir>] [--dry-run]
//
// Station names from the calculator are matched to ours by name/alias. Anything unmatched or
// ambiguous stops the import and is listed; resolve it with --map CALCULATOR_ID=OUR_ID.
// Requires Node 22.18+ (it loads the TypeScript import logic via built-in type stripping).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPairs, matchStations } from '../src/lib/fareImport.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--map' || args[i] === '--data-dir') i++; // skip the flag's value
  else if (!args[i].startsWith('--')) positional.push(args[i]);
}
const file = positional[0];
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = args.includes('--dry-run');
const dataDir = resolve(flag('--data-dir') ?? join(root, 'data'));
const overrides = {};
for (const kv of (flag('--map') ?? '').split(',').filter(Boolean)) {
  const [k, v] = kv.split('=');
  overrides[k.trim()] = v.trim();
}
if (!file) {
  console.error('usage: node scripts/import-fares.mjs <capture.json> [--map 12=OHCI,...] [--data-dir dir] [--dry-run]');
  process.exit(1);
}

const capture = JSON.parse(readFileSync(file, 'utf8'));
if (!Array.isArray(capture.stations) || !Array.isArray(capture.results)) throw new Error('Not a fare capture file (needs "stations" and "results").');
const stations = JSON.parse(readFileSync(join(dataDir, 'stations.json'), 'utf8'));

const match = matchStations(capture.stations, stations, overrides);
if (match.unmatched.length || match.ambiguous.length) {
  console.error('Cannot match every calculator station. Fix with --map CALCULATOR_ID=OUR_ID:');
  for (const u of match.unmatched) console.error(`  unmatched: ${u.id} = "${u.name}"`);
  for (const a of match.ambiguous) console.error(`  ambiguous: ${a.station.id} = "${a.station.name}" could be ${a.candidates.join(' / ')}`);
  console.error('Our station ids: ' + stations.map((s) => `${s.id}=${s.name}`).join(', '));
  process.exit(2);
}

const built = buildPairs(capture, match.map);
if (built.pairs.length === 0) {
  console.error('No usable fares in the capture (search_found was not "Yes" for any pair).');
  process.exit(3);
}

const capturedDate = String(capture.capturedAt ?? new Date().toISOString()).slice(0, 10);
const sourceUrl = 'https://www.gujaratmetrorail.com/ahmedabad/route-and-fares/';
const fares = JSON.parse(readFileSync(join(dataDir, 'fares.json'), 'utf8'));
fares.version = capturedDate;
fares.status = 'available';
fares.validFrom = null; // GMRC's calculator does not state a validity date
fares.reviewDate = capturedDate;
fares.fareType = 'Fare shown by GMRC fare calculator (ticket type not stated)';
fares.symmetric = built.symmetric;
fares.coverage = { pairs: built.pairs.length, capturedAt: capturedDate };
fares.notes =
  'Fares, distance and journey time are exactly as returned by the GMRC fare calculator on the route-and-fares page when captured by the project team. The calculator does not say which ticket product the fare is for, and fares can change. Pairs are used in the reverse direction only when `symmetric` is true.';
fares.sourceMetadata = {
  sourceId: 'gmrc-fare-calculator',
  sourceUrl,
  verifiedAt: capturedDate,
  verificationStatus: 'verified',
  notes: `Captured ${capturedDate}: ${built.pairs.length} pairs; ${built.reverseSamples} reversed pairs compared (${built.asymmetric.length} differed).`,
};
fares.pairs = built.pairs.map((p) => ({
  fromStationId: p.fromStationId,
  toStationId: p.toStationId,
  amountInr: p.fare,
  fareType: fares.fareType,
  distanceKm: p.km,
  travelMinutes: p.minutes,
  stationCount: p.stationCount,
  interchanges: p.interchanges,
  validFrom: null,
  sourceUrl,
  verifiedAt: capturedDate,
  verificationStatus: 'verified',
}));

console.log(`Matched ${match.map.size}/${capture.stations.length} calculator stations.`);
console.log(`Pairs imported: ${built.pairs.length}. Skipped: ${built.skipped.length}${built.skipped.length ? ' (' + [...new Set(built.skipped.map((s) => s.reason))].join('; ') + ')' : ''}.`);
console.log(`Reversed pairs compared: ${built.reverseSamples}. Symmetric: ${built.symmetric}.`);
if (built.asymmetric.length) console.log('Direction-dependent fares:', JSON.stringify(built.asymmetric.slice(0, 10)));
if (!built.symmetric) console.log('NOTE: fares are used only in the direction captured. Re-run the capture with more reversed pairs (or both directions) to cover return journeys.');
if (dryRun) {
  console.log('Dry run: nothing written.');
  process.exit(0);
}

writeFileSync(join(dataDir, 'fares.json'), JSON.stringify(fares, null, 2) + '\n');

const dsPath = join(dataDir, 'dataset.json');
const ds = JSON.parse(readFileSync(dsPath, 'utf8'));
const m = /^(.*-)(\d+)$/.exec(ds.version);
ds.version = m ? `${m[1]}${Number(m[2]) + 1}` : `${ds.version}-1`;
writeFileSync(dsPath, JSON.stringify(ds, null, 2) + '\n');

// Register the source once.
const srcPath = join(dataDir, 'sources.json');
const sources = JSON.parse(readFileSync(srcPath, 'utf8'));
if (!sources.some((s) => s.id === 'gmrc-fare-calculator')) {
  sources.push({
    id: 'gmrc-fare-calculator',
    name: 'GMRC fare calculator (route-and-fares page)',
    url: sourceUrl,
    type: 'Fare, distance, journey time, station count and interchange count per pair of stations',
    obtainedBy: 'Captured from the page’s own calculator in a visitor’s browser by the project team (scripts/capture-fares.browser.js)',
    checkedAt: capturedDate,
    limitations: 'The calculator does not state the ticket type or a validity date. Fares can change. Pairs not captured show “Fare unavailable offline”.',
  });
  writeFileSync(srcPath, JSON.stringify(sources, null, 2) + '\n');
}
console.log(`Wrote ${join(dataDir, 'fares.json')} and bumped dataset version to ${ds.version}. Now run: npm test`);
