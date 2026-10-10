import { makeT, makeTN } from '../../../i18n/translate';
import { loadTransit } from '../transitData';
import { buildRouteIndex, headwayBands } from '../routeIndex';
import { waitText } from '../departures';
import { agencyShort } from '../format';

const ix = loadTransit();
const ri = buildRouteIndex(ix);
const pattern = ri.byAgency.AJL[0].dirs[0].pattern;

describe('translated bus text', () => {
  it('headway bands keep their English labels by default and carry an id', () => {
    const bands = headwayBands(ix, pattern);
    expect(bands.map((b) => b.id)).toEqual(['early', 'morning', 'midday', 'evening', 'night']);
    expect(bands.map((b) => b.label)).toEqual(['Early 04:00–07:00', 'Morning 07:00–10:00', 'Midday 10:00–16:00', 'Evening 16:00–20:00', 'Night 20:00 onwards']);
  });

  it('headway band labels follow the translator but keep the hours in Western digits', () => {
    const hi = headwayBands(ix, pattern, makeT('hi'));
    const gu = headwayBands(ix, pattern, makeT('gu'));
    expect(hi[0].label).toBe('तड़के 04:00–07:00');
    expect(gu[4].label).toBe('રાત 20:00 થી આગળ');
    for (const b of [...hi, ...gu]) expect(b.label).toMatch(/\d\d:\d\d/);
    // the numbers do not depend on the language
    expect(hi.map((b) => b.trips)).toEqual(headwayBands(ix, pattern).map((b) => b.trips));
  });

  it('waitText: now / in N min / later, in each language', () => {
    expect(waitText(0)).toBe('now');
    expect(waitText(-3)).toBe('now');
    expect(waitText(12.4)).toBe('in 12 min');
    expect(waitText(89.4)).toBe('in 89 min');
    expect(waitText(90)).toBe('later');
    expect(waitText(0, makeT('hi'))).toBe('अभी');
    expect(waitText(12, makeT('hi'))).toBe('12 मिनट में');
    expect(waitText(12, makeT('gu'))).toBe('12 મિનિટમાં');
    expect(waitText(500, makeT('gu'))).toBe('પછી');
  });

  it('plural counts: English splits at 1, Hindi and Gujarati treat 0 and 1 as singular', () => {
    const en = makeTN('en');
    const hi = makeTN('hi');
    const gu = makeTN('gu');
    expect(en('bus.tripsADay', 1)).toBe('1 trip a day');
    expect(en('bus.tripsADay', 0)).toBe('0 trips a day');
    expect(en('bus.routes', 5)).toBe('5 routes');
    expect(hi('bus.tripsADay', 1)).toBe('रोज़ 1 फेरी');
    expect(hi('bus.tripsADay', 0)).toBe('रोज़ 0 फेरी');
    expect(hi('bus.tripsADay', 24)).toBe('रोज़ 24 फेरियाँ');
    expect(gu('bus.tripsADay', 24)).toBe('દરરોજ 24 ફેરીઓ');
    expect(gu('bus.stops', 12)).toBe('12 સ્ટોપ');
    expect(hi('bus.stop.moreRoutes', 3)).toContain('3');
    expect(hi('bus.stop.moreRoutes', 3)).not.toMatch(/[A-Za-z]{2,}/);
  });

  it('placeholders are filled in every language', () => {
    for (const l of ['en', 'hi', 'gu'] as const) {
      const t = makeT(l);
      const text = t('bus.expired.body', { date: '2026-03-31' });
      expect(text).toContain('2026-03-31');
      expect(text).not.toMatch(/\{\w+\}/);
      expect(t('bus.band.gaps', { buses: '4', min: 5, max: 20 })).toMatch(/4.*5.*20/);
    }
    expect(makeT('hi')('bus.towards.a11y', { place: 'Maninagar' })).toBe('Maninagar की ओर');
    expect(makeT('gu')('bus.towards.a11y', { place: 'Maninagar' })).toBe('Maninagar તરફ');
  });

  it('the agency chip word stays a brand / place name', () => {
    expect(agencyShort('AJL')).toBe('BRTS');
    expect(agencyShort('AMTS')).toBe('AMTS');
    expect(agencyShort('GTSL')).toBe('Gandhinagar');
  });
});
