// Builds data/transit/transit.json (bus, BRTS and Gandhinagar bus timetable) from a GTFS zip.
//
//   npm run build:transit -- /path/to/gtfs_compat.zip [/path/to/other.zip ...]
//
// The first zip is the one that is converted (use the "compat" feed: merged routes, one calendar service).
// Extra zips are only listed in the provenance block (name + sha256). The build FAILS if the calendar has
// more than one service or exceptions, because the planner assumes the same service every day.
// See docs/research-sources.md for the feed's provenance (third-party, unofficial).

import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { strFromU8, unzipSync } from 'fflate';
import { buildTransit } from '../src/lib/transit/gtfsBuild.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const zips = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (zips.length === 0) {
  console.error('Usage: npm run build:transit -- <gtfs_compat.zip> [other.zip ...]');
  process.exit(2);
}
const RAW_BUDGET = 1_500_000;
const GZ_BUDGET = 250_000;
const NEEDED = ['agency.txt', 'areas.txt', 'calendar.txt', 'calendar_dates.txt', 'fare_leg_rules.txt', 'fare_products.txt', 'feed_info.txt', 'routes.txt', 'stop_areas.txt', 'stop_times.txt', 'stops.txt', 'trips.txt'];

const main = zips[0];
const entries = unzipSync(new Uint8Array(readFileSync(main)), { filter: (f) => NEEDED.includes(f.name) });
const files = Object.fromEntries(Object.entries(entries).map(([name, bytes]) => [name, strFromU8(bytes)]));
const stations = JSON.parse(readFileSync(join(root, 'data', 'stations.json'), 'utf8'));
const sources = zips.map((z) => ({ name: basename(z), sha256: createHash('sha256').update(readFileSync(z)).digest('hex') }));

const data = buildTransit({ files, stations, sources });
const json = JSON.stringify(data);
const out = join(root, 'data', 'transit', 'transit.json');
writeFileSync(out, json + '\n');
const gz = gzipSync(json).length;

console.log(`Wrote ${out}`);
console.log(`  ${(json.length / 1024).toFixed(0)} KB raw, ${(gz / 1024).toFixed(0)} KB gzipped`);
for (const [k, v] of Object.entries(data.meta.counts)) console.log(`  ${k}: ${v}`);
for (const line of data.meta.report) console.log(`  - ${line}`);
console.log(`  valid ${data.meta.source.validFrom} to ${data.meta.source.validTo} (${statSync(main).size} byte input)`);
if (json.length > RAW_BUDGET || gz > GZ_BUDGET) {
  console.error(`Over budget (raw ${RAW_BUDGET}, gz ${GZ_BUDGET}).`);
  process.exit(1);
}
