import { formatDate, formatDuration, relativeDay } from '../format';
import { agencyFull, agencyLabel, formatSpan } from '../transit/format';
import { transitShareText } from '../transit/share';
import type { TransitPlan } from '../transit/planner';
import { makeT, makeTN } from '../../i18n/translate';

const DEVANAGARI = /[ऀ-ॿ]/;
const GUJARATI = /[઀-૿]/;
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const hi = makeT('hi');
const gu = makeT('gu');

describe('dates in Hindi and Gujarati', () => {
  it('uses translated month names with Western digits and a translated "unknown"', () => {
    expect(formatDate('2026-10-05', 'hi')).toBe('5 अक्तू॰ 2026');
    expect(formatDate('2026-10-05', 'gu')).toBe('5 ઑક્ટો 2026');
    expect(formatDate('2026-10-05')).toBe('5 Oct 2026');
    expect(formatDate(null, 'hi')).toBe('अज्ञात');
    expect(formatDate(undefined, 'gu')).toBe('અજ્ઞાત');
    expect(formatDate('not-a-date', 'hi')).toBe('not-a-date');
  });
  it('relativeDay translates Today, Yesterday and the short date', () => {
    const now = at(2026, 10, 9, 15);
    expect(relativeDay(at(2026, 10, 9, 8), now, 'hi')).toBe('आज');
    expect(relativeDay(at(2026, 10, 8, 23), now, 'gu')).toBe('ગઈકાલે');
    expect(relativeDay(at(2026, 10, 6), now, 'hi')).toBe('6 अक्तू॰');
    expect(relativeDay(at(2026, 9, 30), now, 'gu')).toBe('30 સપ્ટે');
    expect(relativeDay(at(2026, 10, 9, 8), now)).toBe('Today');
  });
});

describe('durations in Hindi and Gujarati', () => {
  it('formatDuration keeps the digits and swaps the unit words', () => {
    expect(formatDuration(12.4, hi)).toBe('12 मिनट');
    expect(formatDuration(65, hi)).toBe('1 घं 05 मिनट');
    expect(formatDuration(65, gu)).toBe('1 કલાક 05 મિનિટ');
    expect(formatDuration(-3, gu)).toBe('0 મિનિટ');
  });
  it('formatSpan covers under a minute, minutes, hours and hours with minutes', () => {
    expect(formatSpan(0.2, hi)).toBe('1 मिनट से कम');
    expect(formatSpan(42, gu)).toBe('42 મિનિટ');
    expect(formatSpan(120, hi)).toBe('2 घं');
    expect(formatSpan(65, gu)).toBe('1 કલાક 5 મિનિટ');
    expect(formatSpan(65)).toBe('1 h 5 min');
  });
});

describe('counts', () => {
  it('picks singular for 0 and 1 in Hindi and Gujarati, and fills {n}', () => {
    const tnHi = makeTN('hi');
    const tnGu = makeTN('gu');
    expect(tnHi('lib.stops', 0)).toBe('0 स्टॉप');
    expect(tnHi('lib.stops', 12)).toBe('12 स्टॉप');
    expect(tnGu('lib.routes', 1)).toBe('1 રૂટ');
    expect(makeTN('en')('lib.stops', 1)).toBe('1 stop');
    expect(makeTN('en')('lib.stops', 0)).toBe('0 stops');
    expect(makeTN('en')('lib.stations', 3)).toBe('3 stations');
  });
});

describe('agency names', () => {
  it('translates only the generic words, never the agency brands', () => {
    expect(agencyLabel('AJL', hi)).toBe('BRTS');
    expect(agencyLabel('GTSL')).toBe('Gandhinagar bus');
    expect(agencyLabel('GTSL', hi)).toBe('Gandhinagar बस');
    expect(agencyFull('AMTS', gu)).toBe('AMTS સિટી બસ');
    expect(agencyFull('AJL', gu)).toBe('BRTS (Janmarg)');
    expect(agencyFull('AMTS')).toBe('AMTS city bus');
  });
});

describe('transitShareText', () => {
  const ref = (name: string) => ({ name }) as never;
  const plan = {
    departAt: 540,
    arriveAt: 1500,
    legs: [
      { mode: 'walk', from: ref('A'), to: ref('Stop X'), meters: 300, depart: 540, arrive: 545 },
      { mode: 'bus', agency: 'AMTS', routeShort: '101', routeLong: '', headsign: 'Central', from: ref('Stop X'), to: ref('Stop Y'), stops: 4, depart: 550, arrive: 570 },
      { mode: 'metro', corridorId: 'ns', from: ref('Stop Y'), to: ref('Z'), stationIds: [], towardsId: 'z', stops: 3, depart: 580, arrive: 1500 },
    ],
  } as unknown as TransitPlan;
  const corridor = () => 'North–South Corridor';
  const station = () => 'Z End';

  it('English output is unchanged', () => {
    expect(transitShareText(plan, 'A', 'Z', corridor, station)).toBe(
      [
        'A → Z: leave 09:00, arrive 01:00 (+1 day) (16 h)',
        'Walk about 5 min to Stop X.',
        'AMTS 101 towards Central: Stop X 09:10 → Stop Y 09:30 (scheduled).',
        'Metro North–South Corridor towards Z End: Stop Y about 09:40 → Z about 01:00 (+1 day) (estimated).',
        'Bus times are scheduled, not live; metro and walking times are estimates. Planned with MetroMate.',
      ].join('\n'),
    );
  });

  it('Hindi and Gujarati keep names and times, translate the words, and keep scheduled vs estimated', () => {
    const h = transitShareText(plan, 'A', 'Z', corridor, station, hi);
    const g = transitShareText(plan, 'A', 'Z', corridor, station, gu);
    expect(DEVANAGARI.test(h)).toBe(true);
    expect(GUJARATI.test(g)).toBe(true);
    expect(h).toContain('A → Z: 09:00 पर रवाना, 01:00 (+1 दिन) पर पहुँचेंगे (16 घं)');
    expect(h).toContain('लगभग 5 मिनट पैदल चलकर Stop X पहुँचें।');
    expect(h).toContain('AMTS 101 (Central की ओर): Stop X 09:10 → Stop Y 09:30 (निर्धारित)।');
    expect(h).toContain('(अनुमानित)');
    expect(g).toContain('લગભગ 5 મિનિટ ચાલીને Stop X પહોંચો.');
    expect(g).toContain('(નિર્ધારિત)');
    expect(g).toContain('(અંદાજિત)');
    expect(g).toContain('MetroMate');
    expect(h).not.toContain('{');
    expect(g).not.toContain('{');
  });
});
