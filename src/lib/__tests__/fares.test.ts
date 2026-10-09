import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadBundledDataset } from '../dataset';
import { buildNetwork, findRoute } from '../routing';
import { FARE_UNAVAILABLE_MESSAGE, getFare } from '../fareCalculator';
import { getJourneyTime } from '../journeyTime';
import { checkFareConsistency } from '../fareConsistency';
import { validateDataset } from '../dataValidation';
import { buildPairs, matchStations, normalizeName, parseRawFare, type Capture } from '../fareImport';
import type { Dataset, FarePair, FareTable, RouteResult } from '../../types';

const ds = loadBundledDataset();
const net = buildNetwork(ds);
const route = (a: string, b: string) => {
  const r = findRoute(net, a, b);
  if (!r.ok) throw new Error('no route');
  return r as RouteResult;
};

// The exact response captured from GMRC's calculator by the project team (FromStation=2, ToStation=8).
const GMRC_SAMPLE = JSON.parse(
  '{"msg":"","same_station_msg":"","fare_price":"10","station_count":"7","search_found":"Yes","station_interchange":"0","station_km":"7.10","station_min":"14"}',
);

describe('parsing GMRC calculator responses', () => {
  it('parses the real captured response', () => {
    expect(parseRawFare(GMRC_SAMPLE)).toEqual({ fare: 10, km: 7.1, minutes: 14, stationCount: 7, interchanges: 0 });
  });

  it('rejects answers without a found route or with a bad fare', () => {
    expect(parseRawFare({ ...GMRC_SAMPLE, search_found: 'No' })).toBeNull();
    expect(parseRawFare({ ...GMRC_SAMPLE, fare_price: '' })).toBeNull();
    expect(parseRawFare({ ...GMRC_SAMPLE, fare_price: '-5' })).toBeNull();
    expect(parseRawFare({ ...GMRC_SAMPLE, fare_price: 'abc' })).toBeNull();
    expect(parseRawFare({ same_station_msg: 'Please select different stations' })).toBeNull();
  });

  it('tolerates missing optional fields', () => {
    expect(parseRawFare({ fare_price: '15', search_found: 'Yes' })).toEqual({ fare: 15, km: null, minutes: null, stationCount: null, interchanges: null });
  });
});

describe('station name matching', () => {
  it('matches the names GMRC uses, via aliases, ignoring "Metro Station" wording', () => {
    expect(normalizeName('Kalupur Metro Station')).toBe(normalizeName('Kalupur'));
    const cap = [
      { id: '1', name: 'Kalupur Metro Station' },
      { id: '2', name: 'Gheekanta' },
      { id: '3', name: 'Rajiv Nagar Metro Station' },
      { id: '4', name: 'Old High Court (Interchange Station)' },
      { id: '5', name: 'Sabarmati Rly. Station' },
    ];
    const m = matchStations(cap, ds.stations);
    expect(m.map.get('1')).toBe('KPMS');
    expect(m.map.get('2')).toBe('GEKA');
    expect(m.map.get('3')).toBe('RNMS');
    expect(m.map.get('5')).toBe('SBRS');
    expect(m.unmatched.map((u) => u.id)).toEqual(['4']); // parenthesised suffix is not guessed
    expect(matchStations(cap, ds.stations, { '4': 'OHCI' }).map.get('4')).toBe('OHCI');
  });

  it('keeps "Sabarmati" and "Sabarmati Railway Station" as different stations, whichever wording GMRC uses', () => {
    const m = matchStations(
      [
        { id: '1', name: 'Sabarmati Metro Station' }, // wording used on GMRC's gate table
        { id: '2', name: 'Sabarmati Rly. Station' }, // wording used on GMRC's route map
      ],
      ds.stations,
    );
    expect(m.map.get('1')).toBe('SMMS');
    expect(m.map.get('2')).toBe('SBRS');
    expect(m.ambiguous).toEqual([]);
    expect(normalizeName('Kalupur Rly Station')).toBe(normalizeName('Kalupur Railway Station'));
    expect(normalizeName('Sabarmati')).not.toBe(normalizeName('Sabarmati Railway Station'));
  });

  it('never maps two calculator stations to one of ours, and rejects bad overrides', () => {
    expect(() => matchStations([{ id: '1', name: 'Paldi' }, { id: '2', name: 'Paldi Metro Station' }], ds.stations)).toThrow(/both map/);
    expect(() => matchStations([{ id: '1', name: 'X' }], ds.stations, { '1': 'NOPE' })).toThrow(/not a known station/);
  });
});

// ---- SYNTHETIC fixture (NOT GMRC data): invented numbers, only to exercise the pipeline.
function syntheticCapture(opts: { asymmetric?: boolean } = {}): Capture {
  const names = ['APMC', 'Jivraj Park', 'Rajivnagar', 'Shreyas', 'Paldi', 'Gandhigram', 'Old High Court', 'Usmanpura', 'Vijaynagar', 'Vadaj', 'Ranip', 'Thaltej Gam'];
  const stations = names.map((name, i) => ({ id: String(i + 1), name }));
  const results: Capture['results'] = [];
  const fakeRes = (a: number, b: number) => ({ fare_price: String(10 + Math.abs(a - b) * 2), station_count: String(Math.abs(a - b) + 1), search_found: 'Yes', station_interchange: '0', station_km: String(Math.abs(a - b) * 1.1), station_min: String(Math.abs(a - b) * 2), msg: '', same_station_msg: '' });
  for (let i = 1; i <= names.length; i++) for (let j = i + 1; j <= names.length; j++) results.push({ from: String(i), to: String(j), res: fakeRes(i, j) });
  for (let k = 0; k < 11; k++) {
    const a = 1 + k; const b = a + 1; // 11 distinct reversed pairs
    results.push({ from: String(b), to: String(a), res: opts.asymmetric && k === 3 ? { ...fakeRes(a, b), fare_price: '99' } : fakeRes(a, b) });
  }
  return { capturedAt: '2026-10-10T08:00:00.000Z', source: 'synthetic test fixture', stations, results };
}

describe('building pairs from a capture (synthetic fixture)', () => {
  const cap = syntheticCapture();
  const match = matchStations(cap.stations, ds.stations);

  it('maps every station and builds directed pairs, ignoring unfound/same-station answers', () => {
    expect(match.unmatched).toEqual([]);
    const withBad: Capture = { ...cap, results: [...cap.results, { from: '1', to: '1', res: GMRC_SAMPLE }, { from: '1', to: '12', res: { search_found: 'No' } }] };
    const r = buildPairs(withBad, match.map);
    expect(r.skipped.map((s) => s.reason).sort()).toEqual(['no fare returned', 'same station']);
    expect(r.pairs.length).toBe(cap.results.length); // 66 forward + 11 reversed, all distinct directed pairs
    expect(cap.results.length).toBe(77);
  });

  it('declares symmetry only when enough reversed samples ALL agree', () => {
    const ok = buildPairs(cap, match.map);
    expect(ok.reverseSamples).toBe(11);
    expect(ok.symmetric).toBe(true);
    const bad = buildPairs(syntheticCapture({ asymmetric: true }), match.map);
    expect(bad.symmetric).toBe(false);
    expect(bad.asymmetric).toHaveLength(1);
    const few = buildPairs({ ...cap, results: cap.results.slice(0, 20) }, match.map);
    expect(few.symmetric).toBe(false); // no reverse samples -> not proven
  });
});

describe('fare lookup with pairs', () => {
  const pair: FarePair = { fromStationId: 'APMC', toStationId: 'PLDI', amountInr: 20, fareType: 'test', distanceKm: 4.4, travelMinutes: 9, stationCount: 5, interchanges: 0, validFrom: null, sourceUrl: 'https://example.invalid', verifiedAt: '2026-10-10', verificationStatus: 'verified' };
  const table = (symmetric: boolean): FareTable => ({ ...ds.fares, status: 'available', symmetric, pairs: [pair] });

  it('uses the reverse direction only when symmetry was proven', () => {
    expect(getFare(table(true), 'PLDI', 'APMC')).toMatchObject({ status: 'available', amountInr: 20, distanceKm: 4.4, travelMinutes: 9, stationCount: 5, interchanges: 0 });
    expect(getFare(table(false), 'PLDI', 'APMC')).toEqual({ status: 'unavailable', message: FARE_UNAVAILABLE_MESSAGE });
    expect(getFare(table(false), 'APMC', 'PLDI').status).toBe('available');
  });

  it('prefers GMRC\'s published journey time for the pair, labelled as such', () => {
    const t = getJourneyTime(net, route('APMC', 'PLDI'), table(false));
    expect(t).toMatchObject({ status: 'estimated', minutes: 9, source: 'gmrc-calculator' });
    // with no pair and no per-hop times, still unavailable
    expect(getJourneyTime(net, route('APMC', 'MTRS'), table(false)).status).toBe('unavailable');
    expect(getJourneyTime(net, route('APMC', 'PLDI')).status).toBe('unavailable');
  });
});

describe('cross-check against the route graph', () => {
  const base: FarePair = { fromStationId: 'APMC', toStationId: 'PLDI', amountInr: 20, fareType: 't', validFrom: null, sourceUrl: 'u', verifiedAt: 'd', verificationStatus: 'verified' };

  it('accepts GMRC numbers that match our graph (stations incl. both ends, interchanges)', () => {
    expect(checkFareConsistency(net, [{ ...base, stationCount: 5, interchanges: 0 }])).toEqual([]);
    const r = route('TLTG', 'APMC'); // changes at Old High Court
    expect(checkFareConsistency(net, [{ ...base, fromStationId: 'TLTG', toStationId: 'APMC', stationCount: r.stationIds.length, interchanges: 1 }])).toEqual([]);
  });

  it('flags disagreements instead of hiding them', () => {
    const issues = checkFareConsistency(net, [{ ...base, stationCount: 9, interchanges: 2 }]);
    expect(issues.map((i) => i.kind).sort()).toEqual(['interchanges', 'station-count']);
    expect(checkFareConsistency(net, [{ ...base, fromStationId: 'NOPE', stationCount: 3 }])[0].kind).toBe('no-route');
  });

  it('every pair stored in data/fares.json agrees with our graph (vacuous until fares are imported)', () => {
    expect(checkFareConsistency(net, ds.fares.pairs)).toEqual([]);
  });
});

describe('fare table validation', () => {
  const clone = (): Dataset => JSON.parse(JSON.stringify(loadBundledDataset()));
  const good: FarePair = { fromStationId: 'APMC', toStationId: 'PLDI', amountInr: 20, fareType: 't', distanceKm: 4, travelMinutes: 9, stationCount: 5, interchanges: 0, validFrom: null, sourceUrl: 'u', verifiedAt: 'd', verificationStatus: 'verified' };

  it('accepts a well-formed pair', () => {
    const d = clone();
    d.fares.status = 'available';
    d.fares.pairs = [good];
    expect(validateDataset(d).errors).toEqual([]);
  });

  it('rejects duplicates, negative extras and false symmetry', () => {
    const d = clone();
    d.fares.status = 'available';
    d.fares.symmetric = true;
    d.fares.pairs = [good, good, { ...good, fromStationId: 'PLDI', toStationId: 'APMC', amountInr: 25, travelMinutes: -1 }];
    const e = validateDataset(d).errors.join('\n');
    expect(e).toMatch(/Duplicate fare pair/);
    expect(e).toMatch(/invalid travelMinutes/);
    expect(e).toMatch(/symmetric but/);
  });
});

describe('import-fares CLI (end to end, synthetic capture, temp data dir)', () => {
  const root = path.join(__dirname, '..', '..', '..');
  const tmp = path.join(root, 'node_modules', '.cache', 'metromate-fares-cli');
  beforeAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    for (const f of ['stations.json', 'fares.json', 'dataset.json', 'sources.json']) fs.copyFileSync(path.join(root, 'data', f), path.join(tmp, f));
  });
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const run = (args: string[]) =>
    execFileSync('node', [path.join(root, 'scripts', 'import-fares.mjs'), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_NO_WARNINGS: '1' } });

  it('writes verified pairs, flags symmetry, bumps the dataset version and registers the source', () => {
    const capFile = path.join(tmp, 'capture.json');
    fs.writeFileSync(capFile, JSON.stringify(syntheticCapture()));
    const before = JSON.parse(fs.readFileSync(path.join(tmp, 'dataset.json'), 'utf8')).version;
    const out = run([capFile, '--data-dir', tmp]);
    expect(out).toMatch(/Pairs imported: 77/);
    const fares = JSON.parse(fs.readFileSync(path.join(tmp, 'fares.json'), 'utf8'));
    expect(fares.status).toBe('available');
    expect(fares.symmetric).toBe(true);
    expect(fares.pairs).toHaveLength(77);
    expect(fares.pairs[0]).toMatchObject({ verificationStatus: 'verified', sourceUrl: expect.stringContaining('route-and-fares') });
    const after = JSON.parse(fs.readFileSync(path.join(tmp, 'dataset.json'), 'utf8')).version;
    expect(after).not.toBe(before);
    const sources = JSON.parse(fs.readFileSync(path.join(tmp, 'sources.json'), 'utf8'));
    expect(sources.filter((s: { id: string }) => s.id === 'gmrc-fare-calculator')).toHaveLength(1);
    // the produced table passes the real validator
    const d = loadBundledDataset();
    d.fares = fares;
    expect(validateDataset(d).errors).toEqual([]);
  });

  it('stops and lists stations it cannot match instead of guessing', () => {
    const cap = syntheticCapture();
    cap.stations[0].name = 'Totally Unknown Station';
    const capFile = path.join(tmp, 'bad.json');
    fs.writeFileSync(capFile, JSON.stringify(cap));
    let failed = false;
    try {
      run([capFile, '--data-dir', tmp, '--dry-run']);
    } catch (e) {
      failed = true;
      expect(String((e as { stderr: string }).stderr)).toMatch(/unmatched: 1 = "Totally Unknown Station"/);
    }
    expect(failed).toBe(true);
  });

  it('--dry-run writes nothing', () => {
    const before = fs.readFileSync(path.join(tmp, 'fares.json'), 'utf8');
    const capFile = path.join(tmp, 'capture2.json');
    fs.writeFileSync(capFile, JSON.stringify(syntheticCapture({ asymmetric: true })));
    const out = run([capFile, '--data-dir', tmp, '--dry-run']);
    expect(out).toMatch(/Dry run/);
    expect(out).toMatch(/Symmetric: false/);
    expect(fs.readFileSync(path.join(tmp, 'fares.json'), 'utf8')).toBe(before);
  });
});
