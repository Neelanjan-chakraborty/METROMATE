// Applies GMRC's "Information of Entry-Exit Gate at Entrance" table (data/source/gates-table.json)
// to data/gates.json and to station type / lift data in data/stations.json.
//
//   node scripts/import-gates.mjs
//
// The published table lists gate NUMBERS, station type and lifts (with ramp) near gates.
// It publishes NO street/landmark direction for any gate, so `verifiedDirection` stays null.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const table = JSON.parse(readFileSync(join(root, 'data', 'source', 'gates-table.json'), 'utf8'));
const stationsPath = join(root, 'data', 'stations.json');
const stations = JSON.parse(readFileSync(stationsPath, 'utf8'));
const byId = new Map(stations.map((s) => [s.id, s]));

const checkedAt = table.checkedAt;
const gates = [];
const listed = new Set();

for (const rec of table.stations) {
  const st = byId.get(rec.stationId);
  if (!st) throw new Error(`Gate table references unknown station ${rec.stationId}`);
  listed.add(rec.stationId);

  st.stationType = rec.type; // 'elevated' | 'underground'
  st.lifts = rec.lifts.map((l) => ({ lift: l.lift, nearGate: l.nearGate }));
  st.serviceNote = null;

  const uniqueGates = [...new Set(rec.gates)].sort((a, b) => a - b);
  for (const n of uniqueGates) {
    const lifts = rec.lifts.filter((l) => l.nearGate === n);
    const nearby = (st.nearbyConnections ?? []).filter((c) => c.gateNumber === n);
    gates.push({
      id: `${rec.stationId}-G${n}`,
      stationId: rec.stationId,
      gateNumber: String(n),
      publishedDescription: 'Listed by GMRC as an operational entry/exit gate. GMRC publishes no street or landmark direction for it.',
      verifiedDirection: null,
      accessibilityNotes: lifts.length
        ? lifts.map((l) => `Lift No. ${String(l.lift).padStart(2, '0')} with ramp for wheelchair near this gate (GMRC)`).join('; ')
        : null,
      nearbyConnectionNotes: nearby.map((c) => c.note),
      sourceUrl: table.sourceUrl,
      verifiedAt: checkedAt,
      verificationStatus: 'verified',
      notes: rec.notes.join(' '),
    });
  }
  // Passenger-relevant notes only; `curation` stays in the source file. Idempotent on re-run.
  const extra = rec.notes.join(' ');
  if (extra && !st.sourceMetadata.notes.includes(extra)) st.sourceMetadata.notes += ' ' + extra;
}

// Stations on the route map that GMRC's operational gate table does not list.
for (const st of stations) {
  if (listed.has(st.id)) continue;
  st.lifts = [];
  st.serviceNote =
    'Shown on the GMRC route map but not listed in GMRC’s table of operational entry/exit gates (checked ' +
    checkedAt +
    '). Confirm that trains stop here before relying on it.';
}

writeFileSync(join(root, 'data', 'gates.json'), JSON.stringify(gates, null, 2) + '\n');
writeFileSync(stationsPath, JSON.stringify(stations, null, 2) + '\n');
console.log(`Gates: ${gates.length}. Stations with lifts: ${stations.filter((s) => s.lifts.length).length}. Not listed: ${stations.filter((s) => s.serviceNote).map((s) => s.id).join(', ')}`);
console.log('Underground:', stations.filter((s) => s.stationType === 'underground').map((s) => s.id).join(', '));
