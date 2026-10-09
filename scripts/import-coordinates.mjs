// Imports station coordinates (and entry/exit connectivity notes) from a Google My Maps
// KML export into data/stations.json.
//
//   node scripts/import-coordinates.mjs path/to/Ahmedabad_Metro_Rail.kml
//
// Source: the "Ahmedabad Metro Rail" Google My Maps supplied by the project team
// (https://www.google.com/maps/d/viewer?mid=1ebnAmbRUbMyI_quB06reRZWcyfcLF8M). It is NOT an
// official GMRC product, so coordinates are stored as `estimated`, never `verified`.
// Only the three operational-station folders are used; planned lines are ignored.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kmlPath = process.argv[2];
if (!kmlPath) {
  console.error('usage: node scripts/import-coordinates.mjs <file.kml>');
  process.exit(1);
}
const kml = readFileSync(kmlPath, 'utf8');
if (/<NetworkLink>/.test(kml) && !/<Point>/.test(kml)) {
  console.error('This KML only contains a NetworkLink to the live map and no coordinates. Export the full KML ("Download KML" with "Keep data up to date" unchecked).');
  process.exit(1);
}

const USED_FOLDERS = new Set(['Phase-I-NS', 'Phase-I-EW', 'Phase-II Stations']);

// KML placemark name -> station id (folder-scoped names are unique within USED_FOLDERS).
const NAME_TO_ID = {
  APMC: 'APMC',
  'Jivraj Park': 'JVRJ',
  Rajivnagar: 'RNMS',
  Shreyas: 'SRYS',
  Paldi: 'PLDI',
  Gandhigram: 'GRMS',
  'Old High Court Interchange': 'OHCI',
  Usmanpura: 'UPMS',
  Vijaynagar: 'VRMS',
  Vadaj: 'VDMS',
  Ranip: 'RNIP',
  'Sabarmati Rly Station': 'SBRS',
  AEC: 'AEC',
  Sabarmati: 'SMMS',
  'Motera Stadium': 'MTRS',
  'S P Stadium': 'SPSD',
  Shahpur: 'SHHP',
  'Kalupur Rly Station': 'KPMS',
  'Kankaria East': 'KKES',
  'Apparel Park': 'ARPK',
  Amraiwadi: 'ARVD',
  'Rabari Colony': 'RBCY',
  Vastral: 'VSTL',
  'Nirant Cross Road': 'NTCR',
  'Vastral Gam': 'VTLG',
  Thaltej: 'TLTJ',
  'Thaltej Gam': 'TLTG',
  'Gurukul Road Metro Station': 'GKRD',
  'Doordarshan Kendra Metro Station': 'DDKN',
  'Gujarat University': 'GJUV',
  'Commerce Six Metro Station': 'CMSR',
  'Metro Station gheekanta': 'GEKA',
  'Koteshwar Road': 'KORD',
  'Vishwakarma College': 'VIKC',
  'Tapovan Circle': 'TAPC',
  'Narmada Canal': 'NAMC',
  'Koba Circle': 'KOBC',
  'Juna Koba': 'JUKB',
  'Koba Gam': 'KOBG',
  GNLU: 'GNLU',
  PDEU: 'PDEU',
  'GIFT City': 'GIFC',
  Raysan: 'RAYN',
  Randesan: 'RADN',
  'Dholakuva Circle': 'DHKU',
  Infocity: 'INFC',
  'Sector-1': 'SEOA',
  'Sector-10A': 'SEAO',
  Sachivalaya: 'SVAL',
  Akshardham: 'AKDM',
  'Juna Sachivalaya': 'JUSL',
  'Sector-16': 'SEAF',
  'Sector-24': 'SEBD',
  'Mahatma Mandir': 'MAHM',
};

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// ---- parse folders / placemarks
const placemarks = [];
for (const f of kml.matchAll(/<Folder>\s*<name>([\s\S]*?)<\/name>([\s\S]*?)<\/Folder>/g)) {
  const folder = decode(f[1].trim());
  for (const p of f[2].matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/g)) {
    const body = p[1];
    const name = decode((/<name>([\s\S]*?)<\/name>/.exec(body)?.[1] ?? '').trim());
    const pt = /<Point>[\s\S]*?<coordinates>\s*(-?[\d.]+),(-?[\d.]+)(?:,-?[\d.]+)?\s*<\/coordinates>/.exec(body);
    if (!pt) continue; // lines etc.
    let desc = /<description>([\s\S]*?)<\/description>/.exec(body)?.[1] ?? '';
    desc = desc.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<img[^>]*>/g, '');
    const lines = decode(desc)
      .split(/<br\s*\/?>/i)
      .map((l) => l.replace(/<[^>]+>/g, '').trim())
      .filter((l) => l && !/^(description:?\s*)?(Row|Latitude|Longitude|Name|Description):?\s*$/i.test(l) && !/^description:\s*(Row|Latitude)/i.test(l));
    placemarks.push({ folder, name, lon: Number(pt[1]), lat: Number(pt[2]), notes: lines });
  }
}

const stationsPath = join(root, 'data', 'stations.json');
const stations = JSON.parse(readFileSync(stationsPath, 'utf8'));

const matched = new Map();
const ignored = [];
for (const pm of placemarks) {
  const id = USED_FOLDERS.has(pm.folder) ? NAME_TO_ID[pm.name] : undefined;
  if (!id) {
    ignored.push(`${pm.folder} / ${pm.name}`);
    continue;
  }
  if (matched.has(id)) throw new Error(`Station ${id} matched twice (${pm.name})`);
  matched.set(id, pm);
}
const missing = stations.filter((s) => !matched.has(s.id)).map((s) => s.id);
if (missing.length) throw new Error('No coordinates found for: ' + missing.join(', '));

// ---- sanity checks
const R = 6371008.8;
const rad = (d) => (d * Math.PI) / 180;
const dist = (a, b) => {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const warnings = [];
for (const [id, pm] of matched) {
  if (!(pm.lat > 22.9 && pm.lat < 23.35 && pm.lon > 72.4 && pm.lon < 72.8)) warnings.push(`${id}: outside the expected Ahmedabad–Gandhinagar box`);
}
const corridors = JSON.parse(readFileSync(join(root, 'data', 'corridors.json'), 'utf8'));
const gaps = [];
for (const c of corridors) {
  for (let i = 0; i < c.sequence.length - 1; i++) {
    const a = matched.get(c.sequence[i]);
    const b = matched.get(c.sequence[i + 1]);
    const d = dist(a, b);
    gaps.push(d);
    if (d < 300 || d > 4000) warnings.push(`${c.sequence[i]}–${c.sequence[i + 1]} is ${Math.round(d)} m apart (expected 300–4000 m)`);
  }
}

// ---- nearby-connection notes (gate numbers are only recorded when the note names one)
function connectionsFor(pm) {
  const out = [];
  for (const line of pm.notes) {
    if (/^[A-Za-z .&-]*Metro Station\s*$/i.test(line) || /^description:/i.test(line) && !/(entry|exit|subway|skywalk)/i.test(line)) continue;
    const m = /Entry[- ]?Exit\s*(\d+)\s*[–-]\s*(.+)/i.exec(line);
    const text = (m ? m[2] : line).replace(/^description:\s*/i, '').replace(/\s+/g, ' ').trim();
    if (!/(footpath|skywalk|subway|lift|stair|connect|integration)/i.test(text)) continue;
    const kind = /brts/i.test(text) ? 'brts' : /gsrtc|bus/i.test(text) ? 'bus' : /rail/i.test(text) ? 'rail' : 'other';
    out.push({ kind, gateNumber: m ? Number(m[1]) : null, note: text, sourceId: 'google-my-maps', verificationStatus: 'unverified' });
  }
  return out;
}

// ---- apply
for (const s of stations) {
  const pm = matched.get(s.id);
  s.latitude = Number(pm.lat.toFixed(6));
  s.longitude = Number(pm.lon.toFixed(6));
  s.coordinateStatus = 'estimated';
  s.coordinateSourceId = 'google-my-maps';
  s.nearbyConnections = connectionsFor(pm);
}
writeFileSync(stationsPath, JSON.stringify(stations, null, 2) + '\n');

mkdirSync(join(root, 'data', 'source'), { recursive: true });
writeFileSync(
  join(root, 'data', 'source', 'kml-placemarks.json'),
  JSON.stringify(
    {
      source: 'google-my-maps',
      sourceUrl: 'https://www.google.com/maps/d/viewer?mid=1ebnAmbRUbMyI_quB06reRZWcyfcLF8M',
      note: 'Parsed from the supplied KML. Unofficial map: coordinates are estimates. Planned-line placemarks are listed under "ignored".',
      used: [...matched].map(([id, pm]) => ({ id, kmlName: pm.name, folder: pm.folder, lat: pm.lat, lon: pm.lon })),
      ignored,
    },
    null,
    2,
  ) + '\n',
);

gaps.sort((a, b) => a - b);
console.log(`Matched ${matched.size}/${stations.length} stations. Ignored ${ignored.length} placemarks.`);
console.log(`Adjacent-station distance: min ${Math.round(gaps[0])} m, median ${Math.round(gaps[Math.floor(gaps.length / 2)])} m, max ${Math.round(gaps[gaps.length - 1])} m`);
if (warnings.length) console.log('WARNINGS:\n - ' + warnings.join('\n - '));
console.log('Ignored:', ignored.join('; '));
