import { AGENCY_LOOK, dayOffset, formatAtParam, formatClockMinutes, formatSpan, isoDate, minutesOfDay, parseAtParam, startOfDay } from '../format';

describe('transit formatting', () => {
  it('formats clock times, wrapping past midnight', () => {
    expect(formatClockMinutes(0)).toBe('00:00');
    expect(formatClockMinutes(9 * 60 + 5)).toBe('09:05');
    expect(formatClockMinutes(24 * 60 + 10)).toBe('00:10');
    expect(dayOffset(24 * 60 + 10)).toBe(1);
    expect(dayOffset(23 * 60 + 59)).toBe(0);
    expect(formatClockMinutes(-10)).toBe('23:50');
    expect(formatClockMinutes(509.6)).toBe('08:30');
  });
  it('formats spans', () => {
    expect(formatSpan(0.2)).toBe('under 1 min');
    expect(formatSpan(42)).toBe('42 min');
    expect(formatSpan(65)).toBe('1 h 5 min');
    expect(formatSpan(120)).toBe('2 h');
  });
  it('parses and formats the at= parameter', () => {
    expect(parseAtParam('0930')).toBe(570);
    expect(parseAtParam('09:30')).toBe(570);
    expect(parseAtParam('9:05')).toBe(545);
    expect(parseAtParam('2460')).toBeNull();
    expect(parseAtParam('25:00')).toBeNull();
    expect(parseAtParam(undefined)).toBeNull();
    expect(formatAtParam(570)).toBe('09:30');
  });
  it('date helpers', () => {
    const d = new Date(2026, 9, 12, 14, 7);
    expect(minutesOfDay(d)).toBe(14 * 60 + 7);
    expect(startOfDay(d).getHours()).toBe(0);
    expect(isoDate(d)).toBe('2026-10-12');
  });
  it('names the three bus systems, calling AJL "BRTS"', () => {
    expect(AGENCY_LOOK.AJL.label).toBe('BRTS');
    expect(Object.keys(AGENCY_LOOK)).toEqual(['AJL', 'AMTS', 'GTSL']);
  });
});
