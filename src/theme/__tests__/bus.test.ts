import { bus } from '../bus';

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('bus theme contrast', () => {
  it('red text and white-on-red buttons meet AA (4.5:1)', () => {
    expect(ratio(bus.red, bus.white)).toBeGreaterThanOrEqual(4.5);
  });
  it('dark red on the soft tint, and body text on page and card backgrounds', () => {
    expect(ratio(bus.dark, bus.soft)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(bus.red, bus.soft)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(bus.ink, bus.bg)).toBeGreaterThanOrEqual(7);
    expect(ratio(bus.inkSoft, bus.white)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(bus.inkSoft, bus.bg)).toBeGreaterThanOrEqual(4.5);
  });
});
