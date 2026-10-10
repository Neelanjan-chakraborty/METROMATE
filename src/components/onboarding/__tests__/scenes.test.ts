import { AREAS, MESSAGES } from '../../../i18n/messages';
import { LANGUAGES } from '../../../i18n/languages';
import { makeT } from '../../../i18n/translate';
import { STEP_COUNT } from '../palette';

import { SCENE_COPY as SCENES } from '../scenes/copy';

describe('onboarding scenes', () => {
  it('has exactly five distinct steps', () => {
    expect(SCENES).toHaveLength(STEP_COUNT);
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(STEP_COUNT);
  });

  it('every step has a headline, a sentence and an illustration description in all three languages', () => {
    for (const s of SCENES) {
      for (const key of [s.title, s.body, s.art, ...(s.note ? [s.note] : [])]) {
        expect(MESSAGES[key]).toBeDefined();
        for (const l of LANGUAGES) expect(makeT(l.id)(key).trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('only the first and last steps have a secondary action, and both end in a real destination', () => {
    SCENES.forEach((s, i) => expect(s.secondary !== undefined).toBe(i === 0 || i === STEP_COUNT - 1));
    expect(makeT('en')(SCENES[0].primary!)).toBe('Get started');
    expect(makeT('en')(SCENES[0].secondary!)).toBe('I already know the way');
    expect(makeT('en')(SCENES[4].primary!)).toBe('Plan my first trip');
    expect(makeT('en')(SCENES[4].secondary!)).toBe('Explore the map first');
  });

  it('keeps the spec headlines and supporting sentences in English', () => {
    const en = makeT('en');
    expect(SCENES.map((s) => en(s.title))).toEqual(['Your city. Your way.', 'The smartest way there.', 'Never miss your stop.', 'Your city, even offline.', 'Let’s get moving.']);
    expect(en(SCENES[0].body)).toBe('Metro, buses & every connection.');
    expect(en(SCENES[1].body)).toBe('Compare routes, stops & connections.');
    expect(en(SCENES[2].body)).toBe('Follow your trip, stop by stop.');
    expect(en(SCENES[4].body)).toBe('Your next journey starts here.');
  });

  it('does not promise what the app does not do: no live fleet tracking, fares, times or arrivals in the copy', () => {
    const copy = Object.entries(MESSAGES)
      .filter(([k]) => k.startsWith('onboarding.s'))
      .map(([, m]) => m.en.toLowerCase())
      .join(' ');
    for (const banned of ['₹', 'fare', 'arrives in', 'real-time', 'real time', 'live bus', 'live train', 'min away']) expect(copy).not.toContain(banned);
    // the honest caveats are present
    expect(copy).toContain('gps');
    expect(copy).toContain('scheduled, not live');
  });

  it('every onboarding message is registered in its own area', () => {
    for (const key of Object.keys(AREAS.onboarding)) expect(key.startsWith('onboarding.')).toBe(true);
  });
});
