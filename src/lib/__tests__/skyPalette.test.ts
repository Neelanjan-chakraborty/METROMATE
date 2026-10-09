import { celestialBodyAt, heroLookAt, luminance, minuteOfDay, mixColor, skyPaletteAt, windowIsLit, windowThreshold, wrapMinutes } from '../skyPalette';

const at = (h: number, m = 0) => h * 60 + m;

describe('colour helpers', () => {
  it('mixes colours and measures luminance', () => {
    expect(mixColor('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mixColor('#102030', '#102030', 0.7)).toBe('#102030');
    expect(luminance('#000000')).toBeCloseTo(0, 3);
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 3);
    expect(luminance('#141238')).toBeLessThan(0.05);
  });

  it('wraps minutes and reads the minute of day', () => {
    expect(wrapMinutes(-30)).toBe(1410);
    expect(wrapMinutes(1500)).toBe(60);
    expect(minuteOfDay(new Date(2026, 9, 9, 18, 30, 30))).toBeCloseTo(1110.5, 3);
  });
});

describe('skyPaletteAt', () => {
  it('is deep night at 03:00 and bright day at midday', () => {
    const night = skyPaletteAt(at(3));
    const day = skyPaletteAt(at(12));
    expect(night.night).toBe(1);
    expect(night.stars).toBe(1);
    expect(night.windowsLit).toBeGreaterThan(0.8);
    expect(day.night).toBe(0);
    expect(day.stars).toBe(0);
    expect(day.windowsLit).toBe(0);
    expect(luminance(day.skyTop)).toBeGreaterThan(luminance(night.skyTop) * 5);
  });

  it('midday matches the supplied design reference colours', () => {
    const d = skyPaletteAt(at(12));
    expect(d.skyTop).toBe('#F4F2FF');
    expect(d.skyBottom).toBe('#E5E3FB');
  });

  it('city windows light up through the evening and switch off by morning', () => {
    const lit = [at(10), at(17), at(18, 30), at(19, 30), at(21), at(2)].map((m) => skyPaletteAt(m).windowsLit);
    expect(lit[0]).toBe(0);
    expect(lit[1]).toBeLessThan(0.2);
    expect(lit[2]).toBeGreaterThan(lit[1]);
    expect(lit[3]).toBeGreaterThan(lit[2]);
    expect(lit[4]).toBeGreaterThan(0.85);
    expect(lit[5]).toBeGreaterThan(0.8);
    expect(skyPaletteAt(at(8)).windowsLit).toBeLessThan(0.05);
  });

  it('is continuous: no jump between neighbouring minutes, including across midnight', () => {
    for (let m = 0; m < 1440; m += 1) {
      const a = skyPaletteAt(m);
      const b = skyPaletteAt(m + 1);
      expect(Math.abs(a.windowsLit - b.windowsLit)).toBeLessThan(0.06);
      expect(Math.abs(a.night - b.night)).toBeLessThan(0.06);
      expect(Math.abs(a.stars - b.stars)).toBeLessThan(0.06);
      expect(Math.abs(luminance(a.skyTop) - luminance(b.skyTop))).toBeLessThan(0.05);
    }
  });

  it('wraps: 24:00 equals 00:00 and negative minutes work', () => {
    expect(skyPaletteAt(1440)).toEqual(skyPaletteAt(0));
    expect(skyPaletteAt(-60)).toEqual(skyPaletteAt(1380));
  });

  it('hits each keyframe exactly', () => {
    expect(skyPaletteAt(at(18)).glow).toBe('#FF9E6B');
    expect(skyPaletteAt(at(20)).skyTop).toBe('#231F5C');
  });
});

describe('sun and moon', () => {
  it('the sun rises, peaks at midday and sets, moving left to right and up then down', () => {
    const rise = celestialBodyAt(at(6, 30));
    const noon = celestialBodyAt(at(12));
    const set = celestialBodyAt(at(17, 30));
    expect([rise.kind, noon.kind, set.kind]).toEqual(['sun', 'sun', 'sun']);
    expect(rise.x).toBeLessThan(noon.x);
    expect(noon.x).toBeLessThan(set.x);
    expect(noon.y).toBeLessThan(rise.y);
    expect(noon.y).toBeLessThan(set.y);
    expect(noon.opacity).toBeGreaterThan(0.95);
    expect(celestialBodyAt(at(6)).opacity).toBe(0); // on the horizon at dawn
  });

  it('the moon takes over at night and crosses the sky until dawn', () => {
    expect(celestialBodyAt(at(19)).kind).toBe('moon');
    expect(celestialBodyAt(at(1)).kind).toBe('moon');
    expect(celestialBodyAt(at(0)).y).toBeLessThan(celestialBodyAt(at(19)).y); // higher after midnight than at moonrise
    expect(celestialBodyAt(at(4, 59)).kind).toBe('moon');
    expect(celestialBodyAt(at(23)).x).toBeGreaterThan(celestialBodyAt(at(20)).x);
  });

  it('the sun is warmer near the horizon', () => {
    const low = celestialBodyAt(at(7)).color;
    const high = celestialBodyAt(at(12)).color;
    expect(low).not.toBe(high);
  });
});

describe('heroLookAt: header text stays legible', () => {
  it('uses dark ink on light skies and white ink on dark skies, never mid-grey on mid sky', () => {
    for (let m = 0; m < 1440; m += 5) {
      const look = heroLookAt(m);
      const darkSky = luminance(look.skyTop) < 0.3;
      expect(look.ink).toBe(darkSky ? '#FFFFFF' : '#111A32');
      expect(look.statusBar).toBe(darkSky ? 'light' : 'dark');
      // contrast of the primary ink against the sky behind the header
      const L1 = Math.max(luminance(look.ink), luminance(look.skyTop)) + 0.05;
      const L2 = Math.min(luminance(look.ink), luminance(look.skyTop)) + 0.05;
      expect(L1 / L2).toBeGreaterThan(3);
      const S1 = Math.max(luminance(look.inkSoft), luminance(look.skyTop)) + 0.05;
      const S2 = Math.min(luminance(look.inkSoft), luminance(look.skyTop)) + 0.05;
      expect(S1 / S2).toBeGreaterThan(2.4); // secondary tagline, lowest right at the white/navy switch-over
      if (look.skyTop === '#F4F2FF') expect(look.inkSoft).toBe('#66718C');
    }
  });

  it('shows the sun or moon at all hours except exactly on the horizon', () => {
    expect(heroLookAt(at(12)).body?.kind).toBe('sun');
    expect(heroLookAt(at(0)).body?.kind).toBe('moon');
    expect(heroLookAt(at(6)).body).toBeNull();
  });
});

describe('window lights', () => {
  it('is deterministic and roughly proportional to the lit amount', () => {
    expect(windowThreshold(1, 2, 3)).toBe(windowThreshold(1, 2, 3));
    let lit = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) if (windowIsLit(i % 17, Math.floor(i / 17), i % 5, 0.5)) lit++;
    expect(lit / N).toBeGreaterThan(0.4);
    expect(lit / N).toBeLessThan(0.6);
    expect(windowIsLit(4, 5, 6, 0)).toBe(false);
    expect(windowIsLit(4, 5, 6, 1)).toBe(true);
  });

  it('a window lit at a low level stays lit as the evening gets darker', () => {
    for (let i = 0; i < 200; i++) {
      if (windowIsLit(i, 3, 2, 0.3)) expect(windowIsLit(i, 3, 2, 0.8)).toBe(true);
    }
  });
});
