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

  it('keeps unknown operational data explicitly unknown', () => {
    const ds = loadBundledDataset();
    expect(ds.stations.every((s) => s.latitude === null && s.coordinateStatus === 'unknown')).toBe(true);
    expect(ds.stations.every((s) => s.stationType === 'unknown')).toBe(true);
    expect(ds.gates).toEqual([]);
    expect(ds.fares.pairs).toEqual([]);
    expect(ds.landmarks.every((l) => l.verificationStatus === 'unverified' && l.recommendedGateId === null)).toBe(true);
    expect(ds.connections.every((c) => c.estimatedTravelMinutes === null)).toBe(true);
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
    ds.stations[0].latitude = 23;
    ds.stations[0].longitude = 72;
    expect(validateDataset(ds).errors.join('\n')).toMatch(/coordinateStatus/);
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
