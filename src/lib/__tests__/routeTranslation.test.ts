import { loadBundledDataset } from '../dataset';
import { buildNetwork, findRoute, GNLU_WARNING, PHASE_WARNING } from '../routing';
import { getFare, FARE_UNAVAILABLE_MESSAGE } from '../fareCalculator';
import { getJourneyTime, JOURNEY_TIME_UNAVAILABLE } from '../journeyTime';
import { bandPeriod, bandText } from '../serviceNow';
import { corridorLabel, shareSummary, warningText, warningTitle } from '../routeView';
import { makeT, makeTN } from '../../i18n/translate';
import type { FrequencyBand, RouteResult } from '../../types';

const ds = loadBundledDataset();
const net = buildNetwork(ds);
const hi = makeT('hi');
const gu = makeT('gu');
const hiN = makeTN('hi');
const guN = makeTN('gu');
const DEVANAGARI = /[ऀ-ॿ]/;
const GUJARATI = /[઀-૿]/;
const route = (a: string, b: string) => findRoute(net, a, b) as RouteResult;

describe('route helpers: English stays the default', () => {
  it('bandText / bandPeriod / corridorLabel / warningTitle give the original English', () => {
    const every: FrequencyBand = { label: 'Peak', kind: 'every', minutes: 7 };
    expect(bandText(every)).toBe('Every 7 min');
    expect(bandText({ ...every, kind: 'average', minutes: 40 })).toBe('About every 40 min');
    expect(bandText({ label: 'x', kind: 'bus-only', minutes: null })).toBe('Bus only');
    expect(bandPeriod(every)).toBe('Peak hours');
    expect(corridorLabel({ shortName: 'North–South' })).toBe('North–South Line');
    expect(corridorLabel({ shortName: 'Gift branch' })).toBe('Gift branch');
    expect(corridorLabel(undefined)).toBe('Metro');
    expect(warningTitle(PHASE_WARNING)).toBe('Confirm your ticket before travelling');
    expect(warningText(PHASE_WARNING)).toBe(PHASE_WARNING);
  });
  it('error, fare and time messages are unchanged by default', () => {
    const empty = { ...ds.fares, pairs: [] };
    expect(getFare(empty, 'APMC', 'MTRS')).toEqual({ status: 'unavailable', message: FARE_UNAVAILABLE_MESSAGE });
    const r = findRoute(net, 'APMC', 'APMC');
    expect(!r.ok && r.message).toBe('Your start and destination are the same station.');
    const broken = buildNetwork({ stations: ds.stations, corridors: ds.corridors, connections: [] });
    const rr = route('APMC', 'MTRS');
    expect(getJourneyTime(broken, rr, empty)).toEqual({ status: 'unavailable', message: JOURNEY_TIME_UNAVAILABLE });
  });
});

describe('route helpers in Hindi and Gujarati', () => {
  it('band text keeps the number and uses the language', () => {
    const every: FrequencyBand = { label: 'Peak', kind: 'every', minutes: 7 };
    expect(bandText(every, hi)).toBe('हर 7 मिनट');
    expect(bandText(every, gu)).toBe('દર 7 મિનિટ');
    expect(bandText({ ...every, kind: 'average', minutes: 40 }, hi)).toBe('लगभग हर 40 मिनट');
    expect(bandPeriod(every, hi)).toMatch(DEVANAGARI);
    expect(bandPeriod(every, gu)).toMatch(GUJARATI);
  });

  it('line names keep the data short name and translate the word "Line"', () => {
    expect(corridorLabel({ shortName: 'North–South' }, hi)).toBe('North–South लाइन');
    expect(corridorLabel({ shortName: 'North–South' }, gu)).toBe('North–South લાઇન');
    expect(corridorLabel(null, hi)).toBe('मेट्रो');
  });

  it('the share text translates the sentences but keeps station names, with plural-aware stop counts', () => {
    const r = route('APMC', 'CMSR');
    const text = shareSummary(r, net.stations, net.corridors, hi, hiN);
    expect(text).toContain('APMC → Commerce Six Road (अहमदाबाद मेट्रो)');
    expect(text).toContain('Old High Court');
    expect(text).toContain('स्टॉप');
    expect(text).not.toMatch(/Planned with MetroMate/);
    expect(text).toMatch(DEVANAGARI);
    const g = shareSummary(r, net.stations, net.corridors, gu, guN);
    expect(g).toContain('APMC → Commerce Six Road (અમદાવાદ મેટ્રો)');
    expect(g).toMatch(GUJARATI);
    expect(g).not.toMatch(DEVANAGARI);
  });

  it('warnings the app writes are translated; station notes from the data are left as they are', () => {
    expect(warningTitle(PHASE_WARNING, hi)).toBe('सफ़र से पहले अपना टिकट पक्का कर लें');
    expect(warningTitle(GNLU_WARNING, gu)).toBe('GNLU: ટ્રેનનું ડિસ્પ્લે જુઓ');
    expect(warningText(PHASE_WARNING, hi)).toMatch(DEVANAGARI);
    expect(warningText(GNLU_WARNING, gu)).toMatch(GUJARATI);
    const note = 'Sabarmati Railway Station: not listed by GMRC.';
    expect(warningText(note, hi)).toBe(note);
    expect(warningTitle(note, hi)).toBe('Sabarmati Railway Station: जाने से पहले जाँच लें');
  });

  it('route errors name the stations in any language', () => {
    const same = findRoute(net, 'APMC', 'APMC', hi);
    expect(!same.ok && same.message).toMatch(DEVANAGARI);
    const none = findRoute(buildNetwork({ stations: ds.stations, corridors: ds.corridors, connections: [] }), 'GNLU', 'GIFC', gu);
    expect(none.ok).toBe(false);
    if (!none.ok) {
      expect(none.message).toContain('GIFT City');
      expect(none.message).toMatch(GUJARATI);
    }
    expect(getFare({ ...ds.fares, pairs: [] }, 'APMC', 'MTRS', gu)).toEqual({ status: 'unavailable', message: 'ઑફલાઇન ભાડું ઉપલબ્ધ નથી' });
  });
});
