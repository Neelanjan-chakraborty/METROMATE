import type { Dataset, QuickRoute, QuickSlot, SavedJourney, StationCoord } from '../types';
import { QUICK_SLOTS } from '../types';
import { accumulatorAccuracyM, mergeStationFix, type Fix } from '../lib/locator';
import type { Db } from './types';

export const RECENTS_LIMIT = 10;

const DOCUMENT_KEYS = [
  'info',
  'sources',
  'corridors',
  'gates',
  'landmarks',
  'fares',
  'fareRules',
  'timetable',
  'facilities',
] as const;

export async function migrate(db: Db): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY NOT NULL,
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      corridor_id TEXT NOT NULL,
      json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS documents (
      name TEXT PRIMARY KEY NOT NULL,
      json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS favourites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE (from_id, to_id)
    );
    CREATE TABLE IF NOT EXISTS station_coords (
      station_id TEXT PRIMARY KEY NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      weight REAL NOT NULL,
      samples INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS quick_routes (
      slot TEXT PRIMARY KEY NOT NULL,
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS recents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      searched_at INTEGER NOT NULL,
      UNIQUE (from_id, to_id)
    );
  `);
}

/** Small key/value settings (the interface language). Not cleared by resetLocalData. */
export const getSetting = (db: Db, key: string): Promise<string | null> => getMeta(db, `setting:${key}`);
export const setSetting = (db: Db, key: string, value: string): Promise<void> => setMeta(db, `setting:${key}`, value);

async function getMeta(db: Db, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', [key]);
  return row?.value ?? null;
}

async function setMeta(db: Db, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
}

/** Writes the bundled dataset into SQLite, replacing any previous copy. User data is untouched. */
export async function seedDataset(db: Db, ds: Dataset): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM stations');
    await db.runAsync('DELETE FROM connections');
    await db.runAsync('DELETE FROM documents');
    for (const s of ds.stations) {
      await db.runAsync('INSERT INTO stations (id, name, json) VALUES (?, ?, ?)', [s.id, s.name, JSON.stringify(s)]);
    }
    for (const c of ds.connections) {
      await db.runAsync('INSERT INTO connections (id, from_id, to_id, corridor_id, json) VALUES (?, ?, ?, ?, ?)', [
        c.id,
        c.fromStationId,
        c.toStationId,
        c.corridorId,
        JSON.stringify(c),
      ]);
    }
    for (const key of DOCUMENT_KEYS) {
      await db.runAsync('INSERT INTO documents (name, json) VALUES (?, ?)', [key, JSON.stringify(ds[key])]);
    }
    await setMeta(db, 'dataset_version', ds.info.version);
    await setMeta(db, 'seeded_at', String(Date.now()));
  });
}

/** Seeds on first launch or when the bundled dataset version changed. Returns true if it (re)seeded. */
export async function seedIfNeeded(db: Db, ds: Dataset): Promise<boolean> {
  const stored = await getMeta(db, 'dataset_version');
  const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM stations');
  if (stored === ds.info.version && (count?.n ?? 0) === ds.stations.length) return false;
  await seedDataset(db, ds);
  return true;
}

/** Reads the dataset back from SQLite. Returns null when the tables are empty or incomplete. */
export async function loadDataset(db: Db): Promise<Dataset | null> {
  const stationRows = await db.getAllAsync<{ json: string }>('SELECT json FROM stations ORDER BY rowid');
  if (stationRows.length === 0) return null;
  const connectionRows = await db.getAllAsync<{ json: string }>('SELECT json FROM connections ORDER BY rowid');
  const docRows = await db.getAllAsync<{ name: string; json: string }>('SELECT name, json FROM documents');
  const docs = new Map(docRows.map((r) => [r.name, r.json]));
  for (const key of DOCUMENT_KEYS) if (!docs.has(key)) return null;
  const doc = (key: (typeof DOCUMENT_KEYS)[number]) => JSON.parse(docs.get(key)!);
  return {
    info: doc('info'),
    sources: doc('sources'),
    corridors: doc('corridors'),
    stations: stationRows.map((r) => JSON.parse(r.json)),
    connections: connectionRows.map((r) => JSON.parse(r.json)),
    gates: doc('gates'),
    landmarks: doc('landmarks'),
    fares: doc('fares'),
    fareRules: doc('fareRules'),
    timetable: doc('timetable'),
    facilities: doc('facilities'),
  };
}

// --------------------------------------------------------------- favourites

interface JourneyRow {
  id: number;
  from_id: string;
  to_id: string;
  ts: number;
}
const toJourney = (r: JourneyRow): SavedJourney => ({ id: r.id, fromId: r.from_id, toId: r.to_id, createdAt: r.ts });

export async function listFavourites(db: Db): Promise<SavedJourney[]> {
  const rows = await db.getAllAsync<JourneyRow>('SELECT id, from_id, to_id, created_at AS ts FROM favourites ORDER BY created_at DESC, id DESC');
  return rows.map(toJourney);
}

export async function addFavourite(db: Db, fromId: string, toId: string): Promise<void> {
  await db.runAsync('INSERT OR IGNORE INTO favourites (from_id, to_id, created_at) VALUES (?, ?, ?)', [fromId, toId, Date.now()]);
}

export async function removeFavouritePair(db: Db, fromId: string, toId: string): Promise<void> {
  await db.runAsync('DELETE FROM favourites WHERE from_id = ? AND to_id = ?', [fromId, toId]);
}

export async function removeFavourite(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM favourites WHERE id = ?', [id]);
}

// ------------------------------------------------------------------ recents

export async function listRecents(db: Db): Promise<SavedJourney[]> {
  const rows = await db.getAllAsync<JourneyRow>('SELECT id, from_id, to_id, searched_at AS ts FROM recents ORDER BY searched_at DESC, id DESC');
  return rows.map(toJourney);
}

/** Records a journey as most-recent, de-duplicating the pair and keeping the newest RECENTS_LIMIT. */
export async function recordRecent(db: Db, fromId: string, toId: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO recents (from_id, to_id, searched_at)
     VALUES (?, ?, MAX(?, (SELECT COALESCE(MAX(searched_at), 0) + 1 FROM recents)))
     ON CONFLICT(from_id, to_id) DO UPDATE SET searched_at = excluded.searched_at`,
    [fromId, toId, Date.now()],
  );
  await db.runAsync(
    'DELETE FROM recents WHERE id NOT IN (SELECT id FROM recents ORDER BY searched_at DESC, id DESC LIMIT ?)',
    [RECENTS_LIMIT],
  );
}

export async function clearRecents(db: Db): Promise<void> {
  await db.runAsync('DELETE FROM recents');
}

// ----------------------------------------------------------------- housekeeping

export async function getDatasetMeta(db: Db): Promise<{ version: string | null; seededAt: number | null }> {
  const version = await getMeta(db, 'dataset_version');
  const seeded = await getMeta(db, 'seeded_at');
  return { version, seededAt: seeded ? Number(seeded) : null };
}

/** Clears favourites and recents and re-seeds the bundled dataset. */
export async function resetLocalData(db: Db, ds: Dataset): Promise<void> {
  await db.runAsync('DELETE FROM favourites');
  await db.runAsync('DELETE FROM recents');
  await db.runAsync('DELETE FROM quick_routes');
  await seedDataset(db, ds);
}

// ------------------------------------------------- recorded station positions

interface CoordRow {
  station_id: string;
  lat: number;
  lon: number;
  weight: number;
  samples: number;
  updated_at: number;
}

export const toStationCoord = (r: CoordRow): StationCoord => ({
  stationId: r.station_id,
  lat: r.lat,
  lon: r.lon,
  weight: r.weight,
  samples: r.samples,
  updatedAt: r.updated_at,
  accuracyM: accumulatorAccuracyM({ weight: r.weight }),
});

export async function listStationCoords(db: Db): Promise<StationCoord[]> {
  const rows = await db.getAllAsync<CoordRow>('SELECT station_id, lat, lon, weight, samples, updated_at FROM station_coords ORDER BY station_id');
  return rows.map(toStationCoord);
}

/**
 * Adds one GPS fix to a station's recorded position (inverse-variance weighted average).
 * Returns null, and writes nothing, if the fix is too inaccurate to use.
 */
export async function recordStationFix(db: Db, stationId: string, fix: Pick<Fix, 'lat' | 'lon' | 'accuracyM'>): Promise<StationCoord | null> {
  const prevRow = await db.getFirstAsync<CoordRow>('SELECT station_id, lat, lon, weight, samples, updated_at FROM station_coords WHERE station_id = ?', [stationId]);
  const merged = mergeStationFix(prevRow ? { lat: prevRow.lat, lon: prevRow.lon, weight: prevRow.weight, samples: prevRow.samples } : null, fix);
  if (!merged) return null;
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO station_coords (station_id, lat, lon, weight, samples, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(station_id) DO UPDATE SET lat = excluded.lat, lon = excluded.lon, weight = excluded.weight, samples = excluded.samples, updated_at = excluded.updated_at`,
    [stationId, merged.lat, merged.lon, merged.weight, merged.samples, now],
  );
  return toStationCoord({ station_id: stationId, lat: merged.lat, lon: merged.lon, weight: merged.weight, samples: merged.samples, updated_at: now });
}

export async function clearStationCoord(db: Db, stationId: string): Promise<void> {
  await db.runAsync('DELETE FROM station_coords WHERE station_id = ?', [stationId]);
}

export async function clearStationCoords(db: Db): Promise<void> {
  await db.runAsync('DELETE FROM station_coords');
}

// ------------------------------------------------------------------ quick routes

interface QuickRow {
  slot: string;
  from_id: string;
  to_id: string;
  updated_at: number;
}

export async function listQuickRoutes(db: Db): Promise<QuickRoute[]> {
  const rows = await db.getAllAsync<QuickRow>('SELECT slot, from_id, to_id, updated_at FROM quick_routes');
  return rows
    .filter((r): r is QuickRow & { slot: QuickSlot } => (QUICK_SLOTS as readonly string[]).includes(r.slot))
    .map((r) => ({ slot: r.slot, fromId: r.from_id, toId: r.to_id, updatedAt: r.updated_at }));
}

/** Saves (or replaces) the journey behind a Home / Campus / Work shortcut. */
export async function setQuickRoute(db: Db, slot: QuickSlot, fromId: string, toId: string): Promise<void> {
  if (!(QUICK_SLOTS as readonly string[]).includes(slot)) throw new Error(`Unknown quick-route slot: ${slot}`);
  if (fromId === toId) throw new Error('A quick route needs two different stations');
  await db.runAsync(
    `INSERT INTO quick_routes (slot, from_id, to_id, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(slot) DO UPDATE SET from_id = excluded.from_id, to_id = excluded.to_id, updated_at = excluded.updated_at`,
    [slot, fromId, toId, Date.now()],
  );
}

export async function clearQuickRoute(db: Db, slot: QuickSlot): Promise<void> {
  await db.runAsync('DELETE FROM quick_routes WHERE slot = ?', [slot]);
}
