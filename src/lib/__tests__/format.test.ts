import { formatDate, plural, relativeDay } from '../format';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

describe('relativeDay', () => {
  const now = at(2026, 10, 9, 15);
  it('says Today and Yesterday by calendar day, not by 24-hour windows', () => {
    expect(relativeDay(at(2026, 10, 9, 0), now)).toBe('Today');
    expect(relativeDay(at(2026, 10, 9, 14), now)).toBe('Today');
    expect(relativeDay(at(2026, 10, 8, 23), now)).toBe('Yesterday');
    expect(relativeDay(at(2026, 10, 8, 1), at(2026, 10, 9, 0))).toBe('Yesterday');
  });
  it('falls back to a short date for older trips', () => {
    expect(relativeDay(at(2026, 10, 6), now)).toBe('6 Oct');
    expect(relativeDay(at(2026, 9, 30), now)).toBe('30 Sep');
  });
});

describe('format helpers', () => {
  it('formats ISO dates and plurals', () => {
    expect(formatDate('2026-10-05')).toBe('5 Oct 2026');
    expect(formatDate(null)).toBe('unknown');
    expect(plural(1, 'stop')).toBe('1 stop');
    expect(plural(20, 'stop')).toBe('20 stops');
  });
});
