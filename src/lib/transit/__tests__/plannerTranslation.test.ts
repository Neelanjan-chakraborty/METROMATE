import { loadBundledDataset } from '../../dataset';
import { buildStationPoints } from '../../locator';
import { loadTransit } from '../transitData';
import { createPlanner, planTransit } from '../planner';
import { makeT } from '../../../i18n/translate';

const ds = loadBundledDataset();
const ix = loadTransit();
const points = buildStationPoints(ds.stations, []);
const ctx = createPlanner({ ix, stations: ds.stations, corridors: ds.corridors, timetable: ds.timetable, stationPoint: (id) => points.get(id) ?? null });
const mon = new Date(2026, 9, 12);
const DEVANAGARI = /[ऀ-ॿ]/;
const GUJARATI = /[઀-૿]/;

describe('planner messages follow the translator', () => {
  it('English by default, Hindi and Gujarati when asked', () => {
    const q = { from: 'TLTG', to: 'VTLG', departAt: 9 * 60 + 30, date: mon };
    const en = planTransit(ctx, q, '2026-10-12');
    expect(en.plans[0].warnings).toContain('Metro times are estimates from GMRC’s published frequency, not a train timetable.');
    const hi = planTransit(ctx, q, '2026-10-12', makeT('hi'));
    expect(hi.plans[0].warnings.length).toBe(en.plans[0].warnings.length);
    for (const w of hi.plans[0].warnings) expect(w).toMatch(DEVANAGARI);
    // the plan itself does not depend on the language
    expect(hi.plans[0].arriveAt).toBe(en.plans[0].arriveAt);
    const gu = planTransit(ctx, q, '2026-10-12', makeT('gu'));
    for (const w of gu.plans[0].warnings) expect(w).toMatch(GUJARATI);
  });

  it('notes for same place, expired timetable and next-day service are translated', () => {
    expect(planTransit(ctx, { from: 'APMC', to: 'APMC', departAt: 600, date: mon }, undefined, makeT('hi')).notes[0]).toMatch(DEVANAGARI);
    const expired = planTransit(ctx, { from: 'APMC', to: 'VTLG', departAt: 600, date: mon }, '2027-03-30', makeT('gu'));
    expect(expired.status).toBe('expired');
    expect(expired.notes[0]).toMatch(GUJARATI);
    expect(expired.notes[0]).toContain(ctx.ix.data.meta.source.validTo);
    const late = planTransit(ctx, { from: 'KOBG', to: 'MAHM', departAt: 23 * 60 + 30, date: mon }, '2026-10-12', makeT('hi'));
    expect(late.nextDay).toBe(true);
    expect(late.notes.join(' ')).toMatch(DEVANAGARI);
    expect(planTransit(ctx, { from: 'APMC', to: 'APMC', departAt: 600, date: mon }).notes[0]).toBe('Your start and destination are the same place.');
  });
});
