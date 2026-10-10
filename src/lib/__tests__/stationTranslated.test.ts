import { loadBundledDataset } from '../dataset';
import corridorsJson from '../../../data/corridors.json';
import gatesJson from '../../../data/gates.json';
import landmarksJson from '../../../data/landmarks.json';
import type { Corridor, Gate, Landmark } from '../../types';
import { makeT, makeTN } from '../../i18n';
import { amenityFor, stationAmenities } from '../stationView';
import { cardAccessibilityLabel, locationLine, pickConnection, stationCardInfo } from '../stationCards';

const ds = loadBundledDataset();
const corridors = new Map((corridorsJson as unknown as Corridor[]).map((c) => [c.id, c]));
const gates = gatesJson as unknown as Gate[];
const landmarks = landmarksJson as unknown as Landmark[];
const st = (id: string) => ds.stations.find((s) => s.id === id)!;
const DEVANAGARI = /[ऀ-ॿ]/;
const GUJARATI = /[઀-૿]/;

describe('stationView in Hindi and Gujarati', () => {
  it('translates amenity labels and keeps GMRC wording for unknown facilities', () => {
    expect(amenityFor('Drinking water').label).toBe('Drinking water');
    expect(amenityFor('Drinking water', makeT('hi')).label).toBe('पीने का पानी');
    expect(amenityFor('Drinking water', makeT('gu')).label).toBe('પીવાનું પાણી');
    expect(amenityFor('Something new thing', makeT('hi')).label).toBe('Something new');
  });

  it('every amenity of a station is translated, never claims more, and keeps the counts', () => {
    const en = stationAmenities(st('APMC'), ds.gates.filter((g) => g.stationId === 'APMC'), ds.facilities);
    for (const [lang, script] of [['hi', DEVANAGARI], ['gu', GUJARATI]] as const) {
      const a = stationAmenities(st('APMC'), ds.gates.filter((g) => g.stationId === 'APMC'), ds.facilities, makeT(lang));
      expect(a.here.map((x) => x.key)).toEqual(en.here.map((x) => x.key));
      expect(a.here.map((x) => x.count)).toEqual(en.here.map((x) => x.count));
      expect(a.network.general.map((x) => x.key)).toEqual(en.network.general.map((x) => x.key));
      for (const x of [...a.here, ...a.network.general, ...a.network.accessibility]) expect(script.test(x.label)).toBe(true);
    }
  });
});

describe('stationCards in Hindi and Gujarati', () => {
  const info = (id: string, lang?: 'hi' | 'gu') => stationCardInfo(st(id), gates, landmarks, corridors, lang ? makeT(lang) : undefined);

  it('English output is unchanged by default', () => {
    expect(info('MTRS').location).toBe('Near Motera Stadium');
    expect(info('GNLU').allLines).toBe('North–South Line · GIFT City branch');
  });

  it('translates place lines with placeholders filled', () => {
    expect(info('MTRS', 'hi').location).toBe('Motera Stadium के पास');
    expect(info('MTRS', 'gu').location).toBe('Motera Stadium પાસે');
    const plain = ds.stations.find((s) => s.aliases.length === 0 && !landmarks.some((l) => l.nearestStationId === s.id))!;
    expect(locationLine(plain, landmarks, corridors, makeT('hi'))).toMatch(/^\d+ में से स्टॉप \d+ · फेज़ [12]$/);
    expect(locationLine(plain, landmarks, corridors, makeT('gu'))).toMatch(/^\d+ માંથી સ્ટોપ \d+ · ફેઝ [12]$/);
  });

  it('translates line names but keeps BRTS and the dataset wording', () => {
    expect(info('AEC', 'hi').lineName).toBe('North–South लाइन');
    expect(info('AEC', 'gu').lineName).toBe('North–South લાઇન');
    expect(info('GNLU', 'hi').allLines).toBe('North–South लाइन · GIFT City branch');
    const brts = { kind: 'brts' as const, gateNumber: null, note: '', sourceId: 'x', verificationStatus: 'unverified' as const };
    expect(pickConnection([brts], makeT('hi'))?.label).toBe('BRTS');
    const bus = { ...brts, kind: 'bus' as const };
    expect(pickConnection([bus], makeT('hi'))?.label).toBe('बस स्टॉप');
    expect(pickConnection([bus], makeT('gu'))?.label).toBe('બસ સ્ટોપ');
  });

  it('spoken summary uses plural forms, the unverified caveat and the closing action', () => {
    const withConn = ds.stations.find((s) => s.nearbyConnections.length > 0)!;
    const hi = cardAccessibilityLabel(withConn.name, info(withConn.id, 'hi'), makeT('hi'), makeTN('hi'));
    expect(hi).toContain('(असत्यापित)');
    expect(hi.endsWith('स्टेशन का विवरण खोलें')).toBe(true);
    const gu = cardAccessibilityLabel(withConn.name, info(withConn.id, 'gu'), makeT('gu'), makeTN('gu'));
    expect(gu).toContain('(ચકાસ્યા વગરનું)');
    expect(gu.endsWith('સ્ટેશનની વિગતો ખોલો')).toBe(true);
    // a count of exactly one uses the singular form in English; Hindi/Gujarati count words never leak English
    const noGates = { ...info('APMC'), exits: null, lifts: 0 };
    expect(cardAccessibilityLabel('X', noGates, makeT('hi'), makeTN('hi'))).toContain('GMRC ने निकास गेट सूचीबद्ध नहीं किए हैं');
    expect(cardAccessibilityLabel('X', { ...noGates, exits: 1 }, makeT('gu'), makeTN('gu'))).toContain('1 બહાર નીકળવાનો ગેટ');
    expect(cardAccessibilityLabel('X', { ...noGates, exits: 3, lifts: 2 }, makeT('gu'), makeTN('gu'))).toContain('3 બહાર નીકળવાના ગેટ. 2 લિફ્ટ');
  });

  it('chip and header plural messages fill {n}', () => {
    expect(makeTN('en')('stations.chip.exits', 1)).toBe('1 Exit');
    expect(makeTN('en')('stations.chip.exits', 4)).toBe('4 Exits');
    expect(makeTN('hi')('stations.chip.exits', 4)).toBe('4 निकास');
    expect(makeTN('gu')('stations.chip.exits', 0)).toBe('0 બહાર નીકળવાનો રસ્તો');
    expect(makeTN('hi')('stations.sub', 28)).toBe('28 स्टेशन · ऑफ़लाइन चलता है');
    expect(makeTN('en')('station.minutes', 1)).toBe('1 minute');
    expect(makeTN('gu')('station.minutes', 5)).toBe('5 મિનિટ');
  });
});
