import { belongsToLongerName, isFreeLicence, mentionsStation, pickBest, scoreCandidate, searchQueries, stripHtml, type CommonsPage, type StationLike } from '../stationPhotos';

const aec: StationLike = { id: 'AEC', name: 'AEC', aliases: [], corridorIds: ['ns'] };
const sabarmati: StationLike = { id: 'SMMS', name: 'Sabarmati', aliases: [], corridorIds: ['ns'] };
const sabarmatiRs: StationLike = { id: 'SBRS', name: 'Sabarmati Railway Station', aliases: [], corridorIds: ['ns'] };
const sector1: StationLike = { id: 'SEOA', name: 'Sector-1', aliases: [], corridorIds: ['ns'] };
const sector10a: StationLike = { id: 'SEAO', name: 'Sector-10A', aliases: [], corridorIds: ['ns'] };

function page(title: string, over: Partial<NonNullable<CommonsPage['imageinfo']>[0]> = {}, licence = 'CC BY-SA 4.0', categories: string[] = []): CommonsPage {
  return {
    title: `File:${title}`,
    categories: categories.map((c) => ({ title: `Category:${c}` })),
    imageinfo: [
      {
        thumburl: 'https://upload.example/thumb.jpg',
        descriptionurl: 'https://commons.example/File',
        width: 2000,
        height: 1200,
        mime: 'image/jpeg',
        extmetadata: { LicenseShortName: { value: licence }, Artist: { value: '<a href="x">Jane Doe</a>' } },
        ...over,
      },
    ],
  };
}

describe('stationPhotos', () => {
  it('matches station names as whole words only', () => {
    expect(mentionsStation(aec, 'AEC metro station.jpg')).toBe(true);
    expect(mentionsStation(aec, 'Paec metro station')).toBe(false);
    expect(mentionsStation(sector1, 'Sector 10A metro')).toBe(false);
    expect(mentionsStation(sector10a, 'Sector-10A metro')).toBe(true);
  });

  it('does not use a photo of the longer-named neighbour', () => {
    const others = [sabarmati, sabarmatiRs];
    expect(belongsToLongerName(sabarmati, 'Sabarmati Railway Station metro', others)).toBe(true);
    expect(belongsToLongerName(sabarmati, 'Sabarmati metro station', others)).toBe(false);
    const rs = page('Sabarmati Railway Station metro station Ahmedabad.jpg');
    expect(pickBest(sabarmati, [rs], others)).toBeNull();
    expect(pickBest(sabarmatiRs, [rs], others)?.license).toBe('CC BY-SA 4.0');
  });

  it('accepts a free landscape metro photo and records its credit', () => {
    const best = pickBest(aec, [page('AEC metro station Ahmedabad.jpg')]);
    expect(best).not.toBeNull();
    expect(best?.credit).toBe('Jane Doe');
    expect(best?.pageUrl).toBe('https://commons.example/File');
  });

  it('rejects maps, logos, small, non-raster and non-free files', () => {
    expect(scoreCandidate(aec, page('AEC metro station route map.jpg'))).toBeNull();
    expect(scoreCandidate(aec, page('AEC metro station.svg', { mime: 'image/svg+xml' }))).toBeNull();
    expect(scoreCandidate(aec, page('AEC metro station.jpg', { width: 300, height: 200 }))).toBeNull();
    expect(scoreCandidate(aec, page('AEC metro station.jpg', {}, 'All rights reserved'))).toBeNull();
    expect(scoreCandidate(aec, page('Random bridge.jpg'))).toBeNull();
  });

  it('needs more than a bare name match', () => {
    expect(pickBest(aec, [page('AEC.jpg')])).toBeNull();
    expect(pickBest(aec, [page('AEC.jpg', {}, 'CC BY 4.0', ['Ahmedabad Metro stations'])])).not.toBeNull();
  });

  it('prefers the better-scored of several candidates', () => {
    const a = page('AEC metro station.jpg');
    const b = page('AEC metro station Ahmedabad entrance.jpg');
    expect(pickBest(aec, [a, b])?.page.title).toBe(b.title);
  });

  it('recognises free licences and cleans credits', () => {
    for (const l of ['CC BY 4.0', 'CC BY-SA 3.0', 'CC0', 'Public domain']) expect(isFreeLicence(l)).toBe(true);
    for (const l of ['All rights reserved', 'Fair use', '', undefined]) expect(isFreeLicence(l)).toBe(false);
    expect(stripHtml('<b>A &amp; B</b>  <i>c</i>')).toBe('A & B c');
  });

  it('builds search phrases that name the station and the city', () => {
    const q = searchQueries({ ...aec, name: 'Koba Circle' });
    expect(q[0]).toBe('Koba Circle metro station Ahmedabad');
    expect(q.every((s) => s.includes('Koba Circle'))).toBe(true);
  });
});

describe('renderThumbsModule', () => {
  const { renderThumbsModule } = jest.requireActual('../stationPhotos') as typeof import('../stationPhotos');
  it('writes one static require per photo, sorted by station, with the credit', () => {
    const src = renderThumbsModule([
      { stationId: 'ARPK', file: 'ARPK.webp', title: 'File:A.jpg', pageUrl: 'https://c/A', license: 'CC BY 4.0', credit: 'Ann "A" Lee' },
      { stationId: 'AEC', file: 'AEC.webp', title: 'File:B.jpg', pageUrl: 'https://c/B', license: 'CC0', credit: 'Bo' },
    ]);
    expect(src.indexOf('"AEC"')).toBeLessThan(src.indexOf('"ARPK"'));
    expect(src).toContain("require('../../../assets/stations/AEC.webp')");
    expect(src).toContain('credit: "Ann \\"A\\" Lee"');
    expect(renderThumbsModule([])).toContain('STATION_PHOTOS: Record<string, StationPhoto> = {};');
  });
});
