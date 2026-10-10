// One-shot generator for the INITIAL dataset in /data.
//
// After the first run the JSON files in /data are the source of truth: edit them
// directly (e.g. to add verified fares, gates, platforms or coordinates).
// Re-running this script overwrites them, so only run it to rebuild from scratch.
//
//   node scripts/generate-initial-data.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
mkdirSync(root, { recursive: true });

const VERIFIED_AT = '2026-10-09';
const SITE = 'https://www.gujaratmetrorail.com/';

// ---------------------------------------------------------------- sources
const sources = [
  {
    id: 'gmrc-route-map',
    name: 'GMRC Route Map (Gujarati / Hindi / English)',
    url: SITE,
    type: 'Corridors, station names, station order, interchanges',
    obtainedBy: 'Screenshot supplied by the project team; transcribed by eye',
    checkedAt: VERIFIED_AT,
    limitations: 'Exact page URL not recorded. Low-resolution image; no coordinates, gates, platforms or fares.',
  },
  {
    id: 'gmrc-interactive-map',
    name: 'GMRC interactive route map (SVG markup)',
    url: SITE,
    type: 'GMRC station codes and adjacent-station links',
    obtainedBy: 'SVG markup pasted by the project team',
    checkedAt: VERIFIED_AT,
    limitations:
      'Used only for station codes and adjacency. Also contains stations/lines (Ashram Road to Airport, GIFT City House, Gujarat Biotechnology University) that are NOT on the official route map and are excluded. Its pixel layout is not reused.',
  },
  {
    id: 'gmrc-train-information',
    name: 'GMRC Train Information (frequency, first/last train, travel time)',
    url: 'https://www.gujaratmetrorail.com/ahmedabad/train-information/',
    type: 'Frequency bands, first and last train, end-to-end travel time and distance per line',
    obtainedBy: 'Screenshot supplied by the project team',
    checkedAt: VERIFIED_AT,
    limitations:
      'Effective 18/05/2026; page footer says last updated 05-Oct-2026. The per-train timetable image is low resolution and partly hidden, so per-train times are not stored.',
  },
  {
    id: 'gmrc-fare-rules',
    name: 'GMRC Fare Rules',
    url: 'https://www.gujaratmetrorail.com/ahmedabad/fare-rules/',
    type: 'Fare media, products and rules',
    obtainedBy: 'Screenshot supplied by the project team',
    checkedAt: VERIFIED_AT,
    limitations: 'Contains no fare amounts. The start of one bullet about Phase-1/Phase-2 travel is hidden by a navigation bar in the screenshot.',
  },
  {
    id: 'gmrc-facilities',
    name: 'GMRC Facilities for Passengers / Differently Abled Passengers',
    url: SITE,
    type: 'Network-wide facility categories',
    obtainedBy: 'Screenshots supplied by the project team',
    checkedAt: VERIFIED_AT,
    limitations: 'Photo galleries only. Does not say which station has which facility.',
  },
];

const meta = (sourceId, notes = '', status = 'verified') => ({
  sourceId,
  sourceUrl: sources.find((s) => s.id === sourceId).url,
  verifiedAt: VERIFIED_AT,
  verificationStatus: status,
  notes,
});

// -------------------------------------------------------------- stations
// [id (GMRC code), name, aliases]
const NS = [
  ['APMC', 'APMC', ['APMC Vasna', 'Vasna']],
  ['JVRJ', 'Jivraj Park', ['Jivraj']],
  ['RNMS', 'Rajiv Nagar', ['Rajivnagar']],
  ['SRYS', 'Shreyas', ['Shreyas Crossing']],
  ['PLDI', 'Paldi', []],
  ['GRMS', 'Gandhigram', ['Gandhi Gram']],
  ['OHCI', 'Old High Court', ['High Court', 'Old HC']],
  ['UPMS', 'Usmanpura', []],
  ['VRMS', 'Vijay Nagar', ['Vijaynagar']],
  ['VDMS', 'Vadaj', []],
  ['RNIP', 'Ranip', []],
  ['SBRS', 'Sabarmati Railway Station', ['Sabarmati Rly', 'Sabarmati Railway']],
  ['AEC', 'AEC', []],
  ['SMMS', 'Sabarmati', ['Sabarmati Metro']],
  ['MTRS', 'Motera Stadium', ['Motera', 'Narendra Modi Stadium']],
  ['KORD', 'Koteshwar Road', ['Koteshwar']],
  ['VIKC', 'Vishwakarma College', ['Vishwakarma']],
  ['TAPC', 'Tapovan Circle', ['Tapovan']],
  ['NAMC', 'Narmada Canal', []],
  ['KOBC', 'Koba Circle', ['Koba']],
  ['JUKB', 'Juna Koba', []],
  ['KOBG', 'Koba Gaam', ['Koba Gam', 'Koba Gaon']],
  ['GNLU', 'GNLU', ['Gujarat National Law University', 'GNLU Interchange']],
  ['RAYN', 'Raysan', []],
  ['RADN', 'Randesan', []],
  ['DHKU', 'Dholakuva Circle', ['Dholakuva']],
  ['INFC', 'Infocity', ['Info City']],
  ['SEOA', 'Sector-1', ['Sector 1']],
  ['SEAO', 'Sector-10A', ['Sector 10A', 'Sector 10 A']],
  ['SVAL', 'Sachivalaya', ['Secretariat', 'Gandhinagar Sachivalaya']],
  ['AKDM', 'Akshardham', ['Akshardham Temple']],
  ['JUSL', 'Juna Sachivalaya', ['Old Sachivalaya']],
  ['SEAF', 'Sector-16', ['Sector 16']],
  ['SEBD', 'Sector-24', ['Sector 24']],
  ['MAHM', 'Mahatma Mandir', ['Mahatama Mandir']],
];
const GIFT_EXTRA = [
  ['PDEU', 'PDEU', ['PDPU', 'Pandit Deendayal Energy University']],
  ['GIFC', 'GIFT City', ['Gift City', 'GIFT']],
];
const EW = [
  ['TLTG', 'Thaltej Gam', ['Thaltej Gaam']],
  ['TLTJ', 'Thaltej', []],
  ['DDKN', 'Doordarshan Kendra', ['Doordarshan', 'DD Kendra']],
  ['GKRD', 'Gurukul Road', ['Gurukul']],
  ['GJUV', 'Gujarat University', ['Gujarat Univ']],
  ['CMSR', 'Commerce Six Road', ['Commerce 6 Road']],
  ['SPSD', 'SP Stadium', ['Stadium', 'S P Stadium']],
  ['OHCI', null, null],
  ['SHHP', 'Shahpur', []],
  ['GEKA', 'Ghee Kanta', ['Gheekanta']],
  ['KPMS', 'Kalupur', ['Kalupur Metro Station', 'Kalupur Railway Station']],
  ['KKES', 'Kankaria East', ['Kankaria']],
  ['ARPK', 'Apparel Park', []],
  ['ARVD', 'Amraivadi', ['Amraiwadi']],
  ['RBCY', 'Rabari Colony', []],
  ['VSTL', 'Vastral', []],
  ['NTCR', 'Nirant Cross Road', ['Nirant Cross Roads']],
  ['VTLG', 'Vastral Gam', ['Vastral Gaam']],
];

const nsIds = NS.map((s) => s[0]);
const giftIds = ['GNLU', 'PDEU', 'GIFC'];
const ewIds = EW.map((s) => s[0]);

const corridors = [
  {
    id: 'ns',
    name: 'North–South Corridor',
    shortName: 'North–South',
    color: '#D92D20',
    lengthKm: 41.71,
    description: 'APMC to Mahatma Mandir',
    sequence: nsIds,
    forwardTerminalId: 'MAHM',
    backwardTerminalId: 'APMC',
    sourceMetadata: meta('gmrc-route-map', 'Legend: North–South Corridor (41.71 km), APMC to Mahatma Mandir.'),
  },
  {
    id: 'gift',
    name: 'North–South Corridor (GNLU–GIFT City branch)',
    shortName: 'GIFT City branch',
    color: '#7A3DDB',
    lengthKm: 5.42,
    description: 'GNLU to GIFT City',
    sequence: giftIds,
    forwardTerminalId: 'GIFC',
    backwardTerminalId: 'GNLU',
    sourceMetadata: meta(
      'gmrc-route-map',
      'Legend: North–South Corridor (5.42 km), GNLU to Gift City. Drawn in a separate colour here so the branch is distinguishable.',
    ),
  },
  {
    id: 'ew',
    name: 'East–West Corridor',
    shortName: 'East–West',
    color: '#1570EF',
    lengthKm: 21.16,
    description: 'Thaltej Gam to Vastral Gam',
    sequence: ewIds,
    forwardTerminalId: 'VTLG',
    backwardTerminalId: 'TLTG',
    sourceMetadata: meta('gmrc-route-map', 'Legend: East–West Corridor (21.16 km), Thaltej Gam to Vastral Gam.'),
  },
];

// Phase boundary per the Fare Rules page: Phase 1 = Thaltej Gam–Vastral Gam and APMC–Motera;
// Phase 2 = Koteshwar Road–Mahatma Mandir and GNLU–GIFT City.
const phaseOf = (id) => {
  if (ewIds.includes(id)) return 1;
  const i = nsIds.indexOf(id);
  if (i >= 0) return i <= nsIds.indexOf('MTRS') ? 1 : 2;
  return 2; // PDEU, GIFC
};

const byId = new Map();
const add = (id, name, aliases) => {
  if (!byId.has(id)) byId.set(id, { id, name, aliases, corridorIds: [], sequenceByCorridor: {} });
};
for (const [id, name, aliases] of NS) add(id, name, aliases);
for (const [id, name, aliases] of GIFT_EXTRA) add(id, name, aliases);
for (const [id, name, aliases] of EW) if (name) add(id, name, aliases);

for (const c of corridors) {
  c.sequence.forEach((id, i) => {
    const s = byId.get(id);
    s.corridorIds.push(c.id);
    s.sequenceByCorridor[c.id] = i + 1;
  });
}

const interchangeNotes = {
  OHCI: 'Marked as an interchange between the North–South and East–West corridors on the GMRC route map.',
  GNLU: 'Marked as an interchange on the GMRC route map (North–South corridor and GIFT City branch). The GMRC timetable shows some services running through to GIFT City; check the station display for the train you need.',
};

const stations = [...byId.values()].map((s) => ({
  id: s.id,
  name: s.name,
  aliases: s.aliases,
  corridorIds: s.corridorIds,
  sequenceByCorridor: s.sequenceByCorridor,
  isInterchange: s.corridorIds.length > 1,
  interchangeNote: interchangeNotes[s.id] ?? null,
  phase: phaseOf(s.id),
  latitude: null,
  longitude: null,
  coordinateStatus: 'unknown',
  stationType: 'unknown',
  facilities: [],
  platforms: [],
  sourceMetadata: meta(
    'gmrc-route-map',
    'Name and position from the GMRC route map; code and adjacency cross-checked against the GMRC interactive map.',
  ),
}));

// ----------------------------------------------------------- connections
const connections = [];
const dirLabel = (c, terminalId) => `Towards ${byId.get(terminalId).name}`;
for (const c of corridors) {
  for (let i = 0; i < c.sequence.length - 1; i++) {
    const a = c.sequence[i];
    const b = c.sequence[i + 1];
    connections.push({
      id: `${c.id}:${a}>${b}`,
      fromStationId: a,
      toStationId: b,
      corridorId: c.id,
      direction: dirLabel(c, c.forwardTerminalId),
      directionTerminalId: c.forwardTerminalId,
      estimatedTravelMinutes: null,
      verificationStatus: 'verified',
      sourceUrl: sources.find((s) => s.id === 'gmrc-route-map').url,
      verifiedAt: VERIFIED_AT,
      notes: 'Adjacency from the GMRC route map. No per-station travel time is published.',
    });
    connections.push({
      id: `${c.id}:${b}>${a}`,
      fromStationId: b,
      toStationId: a,
      corridorId: c.id,
      direction: dirLabel(c, c.backwardTerminalId),
      directionTerminalId: c.backwardTerminalId,
      estimatedTravelMinutes: null,
      verificationStatus: 'verified',
      sourceUrl: sources.find((s) => s.id === 'gmrc-route-map').url,
      verifiedAt: VERIFIED_AT,
      notes: 'Adjacency from the GMRC route map. No per-station travel time is published.',
    });
  }
}

// ------------------------------------------------------------- landmarks
// Associations come ONLY from the official station name. No coordinates,
// distances or gates are recorded, so every entry is "unverified".
const lm = (id, name, category, nearestStationId) => ({
  id,
  name,
  category,
  nearestStationId,
  latitude: null,
  longitude: null,
  walkingDistanceMeters: null,
  walkingTimeMinutes: null,
  recommendedGateId: null,
  sourceUrl: sources.find((s) => s.id === 'gmrc-route-map').url,
  verificationStatus: 'unverified',
  verifiedAt: VERIFIED_AT,
  notes: 'Association inferred from the official station name only. Walking distance and gate are not verified.',
});
const landmarks = [
  lm('motera-stadium', 'Motera Stadium', 'stadium', 'MTRS'),
  lm('gnlu', 'Gujarat National Law University (GNLU)', 'university', 'GNLU'),
  lm('pdeu', 'Pandit Deendayal Energy University (PDEU)', 'university', 'PDEU'),
  lm('gift-city', 'GIFT City', 'business-district', 'GIFC'),
  lm('gujarat-university', 'Gujarat University', 'university', 'GJUV'),
  lm('vishwakarma-college', 'Vishwakarma College', 'college', 'VIKC'),
  lm('sabarmati-railway', 'Sabarmati Railway Station', 'railway-station', 'SBRS'),
  lm('kalupur-railway', 'Kalupur Railway Station', 'railway-station', 'KPMS'),
  lm('mahatma-mandir', 'Mahatma Mandir (convention centre)', 'convention-centre', 'MAHM'),
  lm('akshardham', 'Akshardham Temple', 'tourist-landmark', 'AKDM'),
  lm('gujarat-secretariat', 'Gujarat Secretariat', 'government', 'SVAL'),
  lm('infocity', 'Infocity', 'business-district', 'INFC'),
  lm('old-high-court', 'Old High Court', 'court', 'OHCI'),
  lm('doordarshan-kendra', 'Doordarshan Kendra', 'media', 'DDKN'),
  lm('apmc', 'APMC Market, Vasna', 'market', 'APMC'),
  lm('apparel-park', 'Apparel Park', 'industrial-park', 'ARPK'),
  lm('sp-stadium', 'SP Stadium', 'stadium', 'SPSD'),
];

// ------------------------------------------------- timetable (static info)
const T = (s) => ({ sourceUrl: sources.find((x) => x.id === 'gmrc-train-information').url, ...s });
const timetable = {
  version: '2026-05-18',
  validFrom: '2026-05-18',
  sourcePageLastUpdated: '2026-10-05',
  isLive: false,
  sourceMetadata: meta(
    'gmrc-train-information',
    'Static schedule published by GMRC, effective 18/05/2026. Not a live train status. Frequencies are subject to change.',
  ),
  notes: [
    'Ticket windows at all stations close five minutes before departure of the last revenue train.',
    'Frequency of metro train services is subject to change due to inevitable reasons (GMRC).',
  ],
  lines: [
    {
      id: 'line-1',
      label: 'Line 1 — East–West Corridor',
      corridorId: 'ew',
      terminalStationIds: ['TLTG', 'VTLG'],
      stationIds: ewIds,
      frequency: [
        { label: 'Weekdays, peak hours (08:00–11:00 and 17:00–20:00)', kind: 'every', minutes: 7 },
        { label: 'Weekdays non-peak hours and Saturday peak hours', kind: 'every', minutes: 10 },
        { label: 'Saturday non-peak hours and all day Sunday', kind: 'every', minutes: 12 },
        { label: 'All days 06:20–07:00 and 22:00–23:00', kind: 'every', minutes: 20 },
      ],
      firstTrain: [
        { stationId: 'VTLG', time: '06:20' },
        { stationId: 'TLTG', time: '06:20' },
      ],
      lastTrain: [
        { stationId: 'VTLG', time: '23:00' },
        { stationId: 'TLTG', time: '23:00' },
      ],
      endToEndMinutes: 45,
      distanceKm: 21.1,
      ...T({ verificationStatus: 'verified', verifiedAt: VERIFIED_AT, notes: '' }),
    },
    {
      id: 'line-2',
      label: 'Line 2 — APMC to Koteshwar Road (North–South Corridor)',
      corridorId: 'ns',
      terminalStationIds: ['APMC', 'KORD'],
      stationIds: nsIds.slice(0, nsIds.indexOf('KORD') + 1),
      frequency: [
        { label: 'Monday–Sunday 06:16–22:00', kind: 'every', minutes: 12 },
        { label: 'Monday–Sunday 22:00–23:00', kind: 'every', minutes: 20 },
      ],
      firstTrain: [
        { stationId: 'APMC', time: '06:20' },
        { stationId: 'KORD', time: '06:16' },
      ],
      lastTrain: [
        { stationId: 'APMC', time: '23:10' },
        { stationId: 'KORD', time: '23:00' },
      ],
      endToEndMinutes: 35,
      distanceKm: 20.2,
      ...T({ verificationStatus: 'verified', verifiedAt: VERIFIED_AT, notes: '' }),
    },
    {
      id: 'line-3',
      label: 'Line 3 — Koteshwar Road to Mahatma Mandir (Phase 2, Corridor-1)',
      corridorId: 'ns',
      terminalStationIds: ['KORD', 'MAHM'],
      stationIds: nsIds.slice(nsIds.indexOf('KORD')),
      frequency: [
        { label: 'Monday–Sunday 06:40–08:00', kind: 'average', minutes: 40 },
        { label: 'Monday–Sunday 08:00–21:00', kind: 'average', minutes: 24 },
      ],
      firstTrain: [
        { stationId: 'KORD', time: '06:55' },
        { stationId: 'MAHM', time: '06:40' },
      ],
      lastTrain: [
        { stationId: 'KORD', time: '21:20' },
        { stationId: 'MAHM', time: '21:00' },
      ],
      endToEndMinutes: 43,
      distanceKm: 20.87,
      ...T({ verificationStatus: 'verified', verifiedAt: VERIFIED_AT, notes: '' }),
    },
    {
      id: 'line-4',
      label: 'Line 4 — GNLU to GIFT City (Phase 2, Corridor-2)',
      corridorId: 'gift',
      terminalStationIds: ['GNLU', 'GIFC'],
      stationIds: giftIds,
      frequency: [
        { label: '07:36–10:18', kind: 'average', minutes: 49 },
        { label: '10:18–16:06', kind: 'bus-only', minutes: null, note: 'GMRC lists only bus services for GNLU–GIFT City in this window.' },
        { label: '16:06–19:13', kind: 'average', minutes: 57 },
      ],
      firstTrain: [
        { stationId: 'GNLU', time: '07:36' },
        { stationId: 'GIFC', time: '07:48' },
      ],
      lastTrain: [
        { stationId: 'GNLU', time: '18:57' },
        { stationId: 'GIFC', time: '19:13' },
      ],
      endToEndMinutes: 6,
      distanceKm: 5.8,
      ...T({ verificationStatus: 'verified', verifiedAt: VERIFIED_AT, notes: '' }),
    },
  ],
};

// ---------------------------------------------------------------- fares
const fares = {
  version: '0',
  currency: 'INR',
  status: 'unavailable',
  validFrom: null,
  reviewDate: VERIFIED_AT,
  fareType: null,
  pairs: [],
  rules: [],
  notes:
    'No GMRC fare amounts or tariff rule have been supplied or verified. Add verified origin–destination pairs to "pairs" ({ fromStationId, toStationId, amountInr, fareType, validFrom, sourceUrl, verifiedAt, verificationStatus: "verified" }) to enable fares. Fares are never computed from stop counts.',
  sourceMetadata: meta('gmrc-fare-rules', 'Fare Rules page contains no amounts.', 'unknown'),
};

// ----------------------------------------------------------- fare rules
const fareRules = {
  version: '2026-10-05',
  sourceMetadata: meta('gmrc-fare-rules', 'Selected rules transcribed from a screenshot of the GMRC Fare Rules page (page footer dated 05-Oct-2026).'),
  media: [
    'QR tickets (including paper and mobile app tickets)',
    'Contactless Smart Token (CST)',
    'Contactless Smart Card (CSC) – GMRC',
    'NCMC (National Common Mobility Card)',
    'Temporary paper ticket (used if the AFC system fails)',
    'Special paper tickets (special events/occasions)',
  ],
  products: ['Single journey ticket', 'Return journey ticket', 'Group ticket (more than 9 passengers)'],
  rules: [
    'Two children under 3 feet in height travel free if accompanied by one adult.',
    'Tickets can be bought at ticket windows at operational stations; QR tickets can also be bought online in the official GMRC Mobile App.',
    'QR paper tickets are valid for 30 minutes and digital mobile QR tickets for 180 minutes from issue, only from the issuing station.',
    'All passengers travelling with NCMC get a 10% discount on completing a journey, as per current fare rules.',
    'Every valid entry must be followed by a valid exit.',
    'Travelling back in the reverse direction from the destination station is not permitted: exit the paid area and pay the full fare for the new journey.',
    'Maximum permissible time in the paid area: 20 minutes if exiting at the same station and 240 minutes if exiting at another station (QR ticket).',
    'Luggage limit: 25 kg and 80 cm × 50 cm × 30 cm.',
  ],
  phaseRestriction: {
    status: 'partial',
    text:
      '…not permitted to travel between Phase-1 (i.e. Thaltej Gam to Vastral Gam and APMC to Motera) stations and Phase-2 (i.e. Koteshwar to Mahatma Mandir and GNLU to Gift City).',
    notes:
      'The start of this rule is hidden by a navigation bar in the screenshot, so what exactly is not permitted (for example a ticket type) is unknown. Routes crossing between Motera Stadium and Koteshwar Road show a neutral warning.',
  },
};

// ----------------------------------------------------------- facilities
const facilities = {
  scope: 'network-wide',
  sourceMetadata: meta(
    'gmrc-facilities',
    'GMRC facility galleries. These are network-wide categories; they do not confirm that any specific station has a given facility.',
  ),
  general: [
    'Escalators',
    'Guiding signage',
    'Contactless smart card',
    'Token vending and card recharge machines',
    'Drinking water',
    'First aid assistance',
    'Passenger seating',
    'Lifts',
    'Passenger information display',
    'Washrooms',
  ],
  accessibility: [
    'Wide automatic fare gates',
    'Tactile path for visually impaired passengers',
    'Passenger ramp',
    'Wheelchair available at station',
    'Braille call buttons and handrails in lifts',
    'Reserved space for wheelchair in train',
    'Washrooms for differently abled passengers',
    'Ticket counter at low height',
  ],
};

// -------------------------------------------------------------- dataset
const dataset = {
  name: 'MetroMate offline dataset',
  version: '2026.10.09-1',
  generatedAt: VERIFIED_AT,
  sourcePageLastUpdated: '2026-10-05',
  network: 'Ahmedabad–Gandhinagar Metro',
  stationCount: stations.length,
  notes:
    'Network structure is transcribed from official GMRC material supplied as screenshots/markup. Coordinates, gates, platforms, lifts per station and fares are unknown.',
};

const files = {
  'dataset.json': dataset,
  'sources.json': sources,
  'corridors.json': corridors,
  'stations.json': stations,
  'connections.json': connections,
  'gates.json': [],
  'landmarks.json': landmarks,
  'fares.json': fares,
  'fare-rules.json': fareRules,
  'timetable-metadata.json': timetable,
  'facilities.json': facilities,
};
for (const [name, value] of Object.entries(files)) {
  writeFileSync(join(root, name), JSON.stringify(value, null, 2) + '\n');
}
console.log(`Wrote ${Object.keys(files).length} files. Stations: ${stations.length}, connections: ${connections.length}`);
