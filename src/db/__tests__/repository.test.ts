import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadBundledDataset } from '../../lib/dataset';
import {
  RECENTS_LIMIT,
  addFavourite,
  clearRecents,
  getDatasetMeta,
  listFavourites,
  listRecents,
  loadDataset,
  migrate,
  recordRecent,
  removeFavourite,
  removeFavouritePair,
  resetLocalData,
  seedIfNeeded,
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
