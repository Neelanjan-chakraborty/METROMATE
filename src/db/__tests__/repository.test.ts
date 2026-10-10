import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadBundledDataset } from '../../lib/dataset';
import {
  RECENTS_LIMIT,
  addFavourite,
  clearRecents,
  clearQuickRoute,
  clearStationCoord,
  clearStationCoords,
  getDatasetMeta,
  getSetting,
  setSetting,
  listFavourites,
  listQuickRoutes,
  listRecents,
  listStationCoords,
  loadDataset,
  migrate,
  recordRecent,
  recordStationFix,
  removeFavourite,
  removeFavouritePair,
  resetLocalData,
  seedIfNeeded,
  setQuickRoute,
} from '../repository';
import { NodeSqliteDb } from './nodeSqliteDb';

const ds = loadBundledDataset();

async function freshDb() {
  const db = new NodeSqliteDb();
  await migrate(db);
  return db;
}

describe('dataset seeding', () => {
  it('seeds once, reads the full dataset back from SQLite, and does not re-seed', async () => {
    const db = await freshDb();
    expect(await loadDataset(db)).toBeNull();
    expect(await seedIfNeeded(db, ds)).toBe(true);
    expect(await seedIfNeeded(db, ds)).toBe(false);
    const loaded = await loadDataset(db);
    expect(loaded).not.toBeNull();
    expect(loaded!.stations).toHaveLength(54);
    expect(loaded!.connections).toHaveLength(106);
    expect(loaded!.stations).toEqual(ds.stations);
    expect(loaded!.timetable.isLive).toBe(false);
    expect(loaded!.fares.pairs).toEqual([]);
    expect((await getDatasetMeta(db)).version).toBe(ds.info.version);
  });

  it('re-seeds when the bundled dataset version changes, keeping user data', async () => {
    const db = await freshDb();
    await seedIfNeeded(db, ds);
    await addFavourite(db, 'MTRS', 'MAHM');
    const newer = { ...ds, info: { ...ds.info, version: 'next' } };
    expect(await seedIfNeeded(db, newer)).toBe(true);
    expect((await getDatasetMeta(db)).version).toBe('next');
    expect(await listFavourites(db)).toHaveLength(1);
  });

  it('migrating twice is harmless', async () => {
    const db = await freshDb();
    await migrate(db);
    await migrate(db);
    expect(await listFavourites(db)).toEqual([]);
  });
});

describe('favourites', () => {
  it('adds, de-duplicates and removes', async () => {
    const db = await freshDb();
    await addFavourite(db, 'MTRS', 'MAHM');
    await addFavourite(db, 'MTRS', 'MAHM');
    await addFavourite(db, 'MAHM', 'MTRS');
    const favs = await listFavourites(db);
    expect(favs).toHaveLength(2);
    await removeFavourite(db, favs[0].id);
    expect(await listFavourites(db)).toHaveLength(1);
    await removeFavouritePair(db, favs[1].fromId, favs[1].toId);
    expect(await listFavourites(db)).toHaveLength(0);
  });
});

describe('recents', () => {
  it('keeps the newest first and moves a repeated journey to the top', async () => {
    const db = await freshDb();
    await recordRecent(db, 'A', 'B');
    await recordRecent(db, 'C', 'D');
    await recordRecent(db, 'A', 'B');
    const r = await listRecents(db);
    expect(r.map((x) => `${x.fromId}>${x.toId}`)).toEqual(['A>B', 'C>D']);
  });

  it(`keeps at most ${RECENTS_LIMIT}`, async () => {
    const db = await freshDb();
    for (let i = 0; i < RECENTS_LIMIT + 5; i++) await recordRecent(db, `S${i}`, 'T');
    const r = await listRecents(db);
    expect(r).toHaveLength(RECENTS_LIMIT);
    expect(r[0].fromId).toBe(`S${RECENTS_LIMIT + 4}`);
  });

  it('can be cleared without touching favourites', async () => {
    const db = await freshDb();
    await addFavourite(db, 'A', 'B');
    await recordRecent(db, 'A', 'B');
    await clearRecents(db);
    expect(await listRecents(db)).toEqual([]);
    expect(await listFavourites(db)).toHaveLength(1);
  });
});

describe('persistence across restarts', () => {
  const dir = path.join(__dirname, '..', '..', '..', 'node_modules', '.cache', 'metromate-test');
  const file = path.join(dir, `persist-${process.pid}.db`);
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('favourites, recents and the seeded dataset survive closing and reopening the database', async () => {
    fs.mkdirSync(dir, { recursive: true });
    const first = new NodeSqliteDb(file);
    await migrate(first);
    await seedIfNeeded(first, ds);
    await addFavourite(first, 'MTRS', 'MAHM');
    await recordRecent(first, 'APMC', 'VTLG');
    first.close();

    const second = new NodeSqliteDb(file);
    await migrate(second);
    expect(await seedIfNeeded(second, ds)).toBe(false);
    expect((await listFavourites(second)).map((f) => `${f.fromId}>${f.toId}`)).toEqual(['MTRS>MAHM']);
    expect((await listRecents(second)).map((f) => `${f.fromId}>${f.toId}`)).toEqual(['APMC>VTLG']);
    expect((await loadDataset(second))!.stations).toHaveLength(54);
    second.close();
  });
});

describe('reset', () => {
  it('clears user data and restores the bundled dataset', async () => {
    const db = await freshDb();
    await seedIfNeeded(db, ds);
    await addFavourite(db, 'A', 'B');
    await recordRecent(db, 'A', 'B');
    await db.runAsync('DELETE FROM stations WHERE id = ?', ['APMC']);
    await resetLocalData(db, ds);
    expect(await listFavourites(db)).toEqual([]);
    expect(await listRecents(db)).toEqual([]);
    expect((await loadDataset(db))!.stations).toHaveLength(54);
  });
});

describe('recorded station positions', () => {
  it('averages fixes per station and persists them', async () => {
    const db = await freshDb();
    expect(await recordStationFix(db, 'MTRS', { lat: 23.0967, lon: 72.5967, accuracyM: 10 })).toMatchObject({ samples: 1 });
    const second = await recordStationFix(db, 'MTRS', { lat: 23.0969, lon: 72.5967, accuracyM: 10 });
    expect(second!.samples).toBe(2);
    expect(second!.lat).toBeCloseTo(23.0968, 6);
    expect(second!.accuracyM).toBeLessThan(10);
    const list = await listStationCoords(db);
    expect(list).toHaveLength(1);
    expect(list[0].stationId).toBe('MTRS');
  });

  it('writes nothing for a fix that is too inaccurate', async () => {
    const db = await freshDb();
    expect(await recordStationFix(db, 'MTRS', { lat: 23.1, lon: 72.6, accuracyM: 120 })).toBeNull();
    expect(await recordStationFix(db, 'MTRS', { lat: 23.1, lon: 72.6, accuracyM: null })).toBeNull();
    expect(await listStationCoords(db)).toEqual([]);
  });

  it('can clear one station or all, and survives reset of other data', async () => {
    const db = await freshDb();
    await recordStationFix(db, 'MTRS', { lat: 23.1, lon: 72.6, accuracyM: 10 });
    await recordStationFix(db, 'APMC', { lat: 22.99, lon: 72.53, accuracyM: 10 });
    await clearStationCoord(db, 'MTRS');
    expect((await listStationCoords(db)).map((c) => c.stationId)).toEqual(['APMC']);
    await seedIfNeeded(db, ds);
    await resetLocalData(db, ds); // favourites/recents/dataset reset must not wipe recorded positions
    expect(await listStationCoords(db)).toHaveLength(1);
    await clearStationCoords(db);
    expect(await listStationCoords(db)).toEqual([]);
  });

  it('persists across closing and reopening the database', async () => {
    const dir = path.join(__dirname, '..', '..', '..', 'node_modules', '.cache', 'metromate-test');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `coords-${process.pid}.db`);
    const first = new NodeSqliteDb(file);
    await migrate(first);
    await recordStationFix(first, 'PLDI', { lat: 23.0186, lon: 72.5624, accuracyM: 8 });
    first.close();
    const second = new NodeSqliteDb(file);
    await migrate(second);
    expect((await listStationCoords(second))[0]).toMatchObject({ stationId: 'PLDI', samples: 1 });
    second.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('quick routes (Home / Campus / Work)', () => {
  it('saves, replaces and clears a shortcut per slot', async () => {
    const db = await freshDb();
    expect(await listQuickRoutes(db)).toEqual([]);
    await setQuickRoute(db, 'home', 'APMC', 'PLDI');
    await setQuickRoute(db, 'work', 'MTRS', 'MAHM');
    await setQuickRoute(db, 'home', 'JVRJ', 'GRMS'); // replaces
    const list = await listQuickRoutes(db);
    expect(list.map((q) => `${q.slot}:${q.fromId}>${q.toId}`).sort()).toEqual(['home:JVRJ>GRMS', 'work:MTRS>MAHM']);
    await clearQuickRoute(db, 'work');
    expect((await listQuickRoutes(db)).map((q) => q.slot)).toEqual(['home']);
  });

  it('rejects an unknown slot or identical stations', async () => {
    const db = await freshDb();
    await expect(setQuickRoute(db, 'gym' as never, 'A', 'B')).rejects.toThrow(/Unknown quick-route slot/);
    await expect(setQuickRoute(db, 'home', 'A', 'A')).rejects.toThrow(/two different stations/);
    expect(await listQuickRoutes(db)).toEqual([]);
  });

  it('ignores rows with a slot the app does not know, and is cleared by "reset local data"', async () => {
    const db = await freshDb();
    await db.runAsync("INSERT INTO quick_routes (slot, from_id, to_id, updated_at) VALUES ('gym', 'A', 'B', 1)");
    await setQuickRoute(db, 'campus', 'APMC', 'PLDI');
    expect((await listQuickRoutes(db)).map((q) => q.slot)).toEqual(['campus']);
    await seedIfNeeded(db, ds);
    await resetLocalData(db, ds);
    expect(await listQuickRoutes(db)).toEqual([]);
  });
});

describe('settings', () => {
  it('stores the interface language, replaces it, and keeps it through a data reset', async () => {
    const db = await freshDb();
    expect(await getSetting(db, 'language')).toBeNull();
    await setSetting(db, 'language', 'hi');
    expect(await getSetting(db, 'language')).toBe('hi');
    await setSetting(db, 'language', 'gu');
    expect(await getSetting(db, 'language')).toBe('gu');
    await seedIfNeeded(db, ds);
    await resetLocalData(db, ds);
    expect(await getSetting(db, 'language')).toBe('gu');
  });
});
