import * as SQLite from 'expo-sqlite';
import type { Db } from './types';

export const DATABASE_NAME = 'metromate.db';

/** Opens the on-device SQLite database (works with no network). */
export async function openAppDatabase(): Promise<Db> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  return db as unknown as Db;
}

export * from './repository';
export type { Db } from './types';
