import { AREAS, MESSAGES } from '../messages';
import { LANGUAGES, detectLanguage, isLanguage } from '../languages';
import { enT, enTN, interpolate, makeT, makeTN, pluralCategory, translate } from '../translate';
import { MONTHS_SHORT } from '../months';

const DEVANAGARI = /[ऀ-ॿ]/;
const GUJARATI = /[઀-૿]/;
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
/** English text with placeholders removed: does it have words that need translating? */
const hasWords = (s: string) => /[A-Za-z]{2,}/.test(s.replace(/\{\w+\}/g, ''));
/** Messages that are legitimately the same in every language (brand names, codes). */
const SAME_EVERYWHERE = new Set<string>();

const entries = Object.entries(MESSAGES);

describe('message catalog', () => {
  it('has no duplicate keys across areas', () => {
    const seen = new Map<string, string>();
    for (const [area, cat] of Object.entries(AREAS)) {
      for (const key of Object.keys(cat)) {
        expect(seen.has(key) ? `${key} in ${seen.get(key)} and ${area}` : null).toBeNull();
        seen.set(key, area);
      }
    }
  });

  it('every key is area.name, and lives in the file for its area', () => {
    for (const [area, cat] of Object.entries(AREAS)) {
      for (const key of Object.keys(cat)) expect(key.startsWith(`${area}.`) || area === 'lib').toBe(true);
    }
    for (const [key] of entries) expect(key).toMatch(/^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$/);
  });

  it('has text in all three languages for every key', () => {
    for (const [key, m] of entries) {
      for (const l of LANGUAGES) expect(`${key}:${l.id}:${m[l.id].trim().length > 0}`).toBe(`${key}:${l.id}:true`);
    }
  });

  it('uses the same {placeholders} in every language', () => {
    for (const [key, m] of entries) {
      expect([key, placeholders(m.hi)]).toEqual([key, placeholders(m.en)]);
      expect([key, placeholders(m.gu)]).toEqual([key, placeholders(m.en)]);
    }
  });

  it('Hindi is in Devanagari and Gujarati in Gujarati script, never swapped or left in English', () => {
    for (const [key, m] of entries) {
      if (!hasWords(m.en) || SAME_EVERYWHERE.has(key)) continue;
      expect([key, DEVANAGARI.test(m.hi)]).toEqual([key, true]);
      expect([key, GUJARATI.test(m.hi)]).toEqual([key, false]);
      expect([key, GUJARATI.test(m.gu)]).toEqual([key, true]);
      expect([key, DEVANAGARI.test(m.gu)]).toEqual([key, false]);
    }
  });

  it('plural keys come in .one / .other pairs', () => {
    const keys = new Set(entries.map(([k]) => k));
    for (const k of keys) {
      if (k.endsWith('.one')) expect([k, keys.has(k.replace(/\.one$/, '.other'))]).toEqual([k, true]);
      if (k.endsWith('.other')) expect([k, keys.has(k.replace(/\.other$/, '.one'))]).toEqual([k, true]);
    }
  });

  it('does not translate a message into itself by accident (hi / gu text differs from English)', () => {
    for (const [key, m] of entries) {
      if (!hasWords(m.en) || SAME_EVERYWHERE.has(key)) continue;
      expect([key, m.hi === m.en]).toEqual([key, false]);
      expect([key, m.gu === m.en]).toEqual([key, false]);
    }
  });
});

describe('translate', () => {
  it('fills placeholders and leaves unknown ones visible', () => {
    expect(interpolate('Hello {name}, {n} left', { name: 'A', n: 3 })).toBe('Hello A, 3 left');
    expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
    expect(interpolate('plain')).toBe('plain');
  });
  it('uses the language asked for and falls back to English, then the key', () => {
    expect(translate('en', 'common.tab.map')).toBe('Map');
    expect(translate('hi', 'common.tab.map')).toBe('नक्शा');
    expect(translate('gu', 'common.tab.map')).toBe('નકશો');
    expect(translate('hi', 'nope.nothing' as never)).toBe('nope.nothing');
  });
  it('plural categories follow CLDR for en, hi and gu', () => {
    expect(pluralCategory('en', 1)).toBe('one');
    expect(pluralCategory('en', 0)).toBe('other');
    expect(pluralCategory('hi', 0)).toBe('one');
    expect(pluralCategory('hi', 1)).toBe('one');
    expect(pluralCategory('hi', 2)).toBe('other');
    expect(pluralCategory('gu', 0)).toBe('one');
    expect(pluralCategory('gu', 5)).toBe('other');
  });
  it('makeT / enT are bound to a language', () => {
    expect(makeT('hi')('common.tab.bus')).toBe('बस');
    expect(enT('common.tab.bus')).toBe('Bus');
    expect(typeof makeTN('gu')).toBe('function');
    expect(typeof enTN).toBe('function');
  });
  it('language ids and detection', () => {
    expect(LANGUAGES.map((l) => l.id)).toEqual(['en', 'hi', 'gu']);
    expect(isLanguage('hi')).toBe(true);
    expect(isLanguage('fr')).toBe(false);
    expect(['en', 'hi', 'gu']).toContain(detectLanguage());
  });
  it('month names: twelve per language', () => {
    for (const l of LANGUAGES) expect(MONTHS_SHORT[l.id]).toHaveLength(12);
  });
});
