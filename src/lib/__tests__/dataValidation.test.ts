import { loadBundledDataset } from '../dataset';
import { validateDataset } from '../dataValidation';
import type { Dataset } from '../../types';

const clone = (): Dataset => JSON.parse(JSON.stringify(loadBundledDataset()));

describe('bundled dataset', () => {
  it('passes validation with no errors', () => {
    const report = validateDataset(loadBundledDataset());
    expect(report.errors).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it('marks imported coordinates as estimated (unofficial source), never verified', () => {
    const ds = loadBundledDataset();
    expect(ds.stations.every((s) => s.latitude !== null && s.longitude !== null)).toBe(true);
    expect(ds.stations.every((s) => s.coordinateStatus === 'estimated' && s.coordinateSourceId === 'google-my-maps')).toBe(true);
  });

  it('records station type from the GMRC gate table, with Sabarmati Railway Station left unknown', () => {
    const ds = loadBundledDataset();
    const under = ds.stations.filter((s) => s.stationType === 'underground').map((s) => s.id).sort();
    expect(under).toEqual(['GEKA', 'KKES', 'KPMS', 'SHHP']);
    const unknown = ds.stations.filter((s) => s.stationType === 'unknown').map((s) => s.id);
    expect(unknown).toEqual(['SBRS']);
    expect(ds.stations.find((s) => s.id === 'SBRS')!.serviceNote).toMatch(/not listed/);
  });

  it('has 129 listed gates with numbers only: no gate direction is invented', () => {
    const ds = loadBundledDataset();
    expect(ds.gates).toHaveLength(129);
    expect(ds.gates.every((g) => g.verifiedDirection === null && g.verificationStatus === 'verified')).toBe(true);
    expect(ds.gates.filter((g) => g.stationId === 'OHCI').map((g) => g.gateNumber)).toEqual(['1', '2', '4', '6', '7', '8']);
    expect(ds.gates.filter((g) => g.stationId === 'GEKA').map((g) => g.gateNumber)).toEqual(['1', '2', '3']);
    expect(ds.stations.find((s) => s.id === 'OHCI')!.lifts).toHaveLength(4);
  });

  it('still has no fares, platforms or per-hop travel times', () => {
    const ds = loadBundledDataset();
    expect(ds.fares.pairs).toEqual([]);
    expect(ds.stations.every((s) => s.platforms.length === 0)).toBe(true);
    expect(ds.connections.every((c) => c.estimatedTravelMinutes === null)).toBe(true);
    expect(ds.landmarks.every((l) => l.verificationStatus === 'unverified' && l.recommendedGateId === null)).toBe(true);
  });

  it('records provenance on every station', () => {
    for (const s of loadBundledDataset().stations) {
      expect(s.sourceMetadata.sourceUrl).toBeTruthy();
      expect(s.sourceMetadata.verifiedAt).toBeTruthy();
    }
  });
});

describe('validator catches bad data', () => {
  it('duplicate station ids', () => {
    const ds = clone();
    ds.stations.push({ ...ds.stations[0] });
    expect(validateDataset(ds).errors.join('\n')).toMatch(/Duplicate station id/);
  });

  it('connection to an unknown station', () => {
    const ds = clone();
    ds.connections[0].toStationId = 'GHOST';
    expect(validateDataset(ds).errors.join('\n')).toMatch(/unknown endpoint/);
  });

  it('non-adjacent stations connected', () => {
    const ds = clone();
    ds.connections.push({ ...ds.connections[0], id: 'bad', fromStationId: 'APMC', toStationId: 'PLDI', corridorId: 'ns' });
    const e = validateDataset(ds).errors.join('\n');
    expect(e).toMatch(/not adjacent/);
  });

  it('negative travel time', () => {
    const ds = clone();
    ds.connections[0].estimatedTravelMinutes = -3;
    expect(validateDataset(ds).errors.join('\n')).toMatch(/invalid estimatedTravelMinutes/);
  });

  it('negative fare and fare without provenance', () => {
    const ds = clone();
    ds.fares.pairs.push({
      fromStationId: 'APMC',
      toStationId: 'MAHM',
      amountInr: -5,
      fareType: 'x',
      validFrom: null,
      sourceUrl: '',
      verifiedAt: '',
      verificationStatus: 'verified',
    });
    const e = validateDataset(ds).errors.join('\n');
    expect(e).toMatch(/invalid amount/);
    expect(e).toMatch(/verified without provenance/);
  });

  it('inconsistent direction label', () => {
    const ds = clone();
    ds.connections[0].direction = 'Towards Nowhere';
    expect(validateDataset(ds).errors.join('\n')).toMatch(/direction label/);
  });

  it('disconnected station', () => {
    const ds = clone();
    ds.stations.push({ ...ds.stations[0], id: 'LONE', corridorIds: [], sequenceByCorridor: {}, isInterchange: false });
    ds.info.stationCount = ds.stations.length;
    const e = validateDataset(ds).errors.join('\n');
    expect(e).toMatch(/LONE is disconnected/);
    expect(e).toMatch(/belongs to no corridor/);
  });

  it('coordinates without an explicit status', () => {
    const ds = clone();
    ds.stations[0].coordinateStatus = 'unknown';
    expect(validateDataset(ds).errors.join('\n')).toMatch(/coordinateStatus/);
  });

  it('coordinates outside the network area, or without a source', () => {
    const ds = clone();
    ds.stations[0].latitude = 12.9;
    ds.stations[1].coordinateSourceId = null;
    const e = validateDataset(ds).errors.join('\n');
    expect(e).toMatch(/outside the Ahmedabad–Gandhinagar area/);
    expect(e).toMatch(/no coordinateSourceId/);
  });

  it('a lift near a gate that is not listed', () => {
    const ds = clone();
    ds.stations.find((s) => s.id === 'APMC')!.lifts.push({ lift: 9, nearGate: 9 });
    expect(validateDataset(ds).errors.join('\n')).toMatch(/lift 9 is near gate 9/);
  });

  it('a recommended gate that is not verified', () => {
    const ds = clone();
    ds.gates.push({
      id: 'g1',
      stationId: 'MTRS',
      gateNumber: '1',
      publishedDescription: '',
      verifiedDirection: null,
      accessibilityNotes: null,
      sourceUrl: null,
      verificationStatus: 'unknown',
    });
    ds.landmarks[0].recommendedGateId = 'g1';
    expect(validateDataset(ds).errors.join('\n')).toMatch(/gate that is not verified/);
  });

  it('does not throw on a malformed dataset', () => {
    const broken = { ...clone(), stations: undefined } as unknown as Dataset;
    const r = validateDataset(broken);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/Validation crashed/);
  });
});
