import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNetworkState } from 'expo-network';
import type { Dataset, SavedJourney } from '../types';
import { loadBundledDataset } from '../lib/dataset';
import { validateDataset, type ValidationReport } from '../lib/dataValidation';
import { buildNetwork, type Network } from '../lib/routing';
import * as repo from '../db/repository';
import type { Db } from '../db/types';
import { openAppDatabase } from '../db';

type Status = 'loading' | 'ready' | 'error';

interface AppState {
  status: Status;
  error: string | null;
  dataset: Dataset | null;
  network: Network | null;
  validation: ValidationReport | null;
  /** 'sqlite' when saved routes persist on the device, 'memory' when the database could not be opened. */
  storage: 'sqlite' | 'memory';
  /** null while unknown. */
  online: boolean | null;
  favourites: SavedJourney[];
  recents: SavedJourney[];
  isFavourite: (fromId: string, toId: string) => boolean;
  toggleFavourite: (fromId: string, toId: string) => Promise<void>;
  removeFavourite: (id: number) => Promise<void>;
  recordRecent: (fromId: string, toId: string) => Promise<void>;
  clearRecents: () => Promise<void>;
  resetLocalData: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [storage, setStorage] = useState<'sqlite' | 'memory'>('sqlite');
  const [favourites, setFavourites] = useState<SavedJourney[]>([]);
  const [recents, setRecents] = useState<SavedJourney[]>([]);
  const dbRef = useRef<Db | null>(null);
  const memId = useRef(1);
  const net = useNetworkState();

  const refresh = useCallback(async () => {
    const db = dbRef.current;
    if (!db) return;
    setFavourites(await repo.listFavourites(db));
    setRecents(await repo.listRecents(db));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const bundled = loadBundledDataset();
      let ds: Dataset = bundled;
      try {
        const db = await openAppDatabase();
        await repo.migrate(db);
        await repo.seedIfNeeded(db, bundled);
        ds = (await repo.loadDataset(db)) ?? bundled;
        dbRef.current = db;
        const [f, r] = [await repo.listFavourites(db), await repo.listRecents(db)];
        if (cancelled) return;
        setFavourites(f);
        setRecents(r);
        setStorage('sqlite');
      } catch (e) {
        // The app must keep working without the database: fall back to the bundled data.
        if (cancelled) return;
        console.warn('MetroMate: SQLite unavailable, using in-memory storage.', e);
        dbRef.current = null;
        setStorage('memory');
      }
      if (cancelled) return;
      try {
        buildNetwork(ds);
        setDataset(ds);
        setStatus('ready');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const network = useMemo(() => (dataset ? buildNetwork(dataset) : null), [dataset]);
  const validation = useMemo(() => (dataset ? validateDataset(dataset) : null), [dataset]);

  const isFavourite = useCallback(
    (fromId: string, toId: string) => favourites.some((f) => f.fromId === fromId && f.toId === toId),
    [favourites],
  );

  const toggleFavourite = useCallback(
    async (fromId: string, toId: string) => {
      const existing = favourites.find((f) => f.fromId === fromId && f.toId === toId);
      const db = dbRef.current;
      if (db) {
        if (existing) await repo.removeFavourite(db, existing.id);
        else await repo.addFavourite(db, fromId, toId);
        await refresh();
      } else if (existing) {
        setFavourites((cur) => cur.filter((f) => f.id !== existing.id));
      } else {
        setFavourites((cur) => [{ id: memId.current++, fromId, toId, createdAt: Date.now() }, ...cur]);
      }
    },
    [favourites, refresh],
  );

  const removeFavourite = useCallback(
    async (id: number) => {
      const db = dbRef.current;
      if (db) {
        await repo.removeFavourite(db, id);
        await refresh();
      } else {
        setFavourites((cur) => cur.filter((f) => f.id !== id));
      }
    },
    [refresh],
  );

  const recordRecent = useCallback(
    async (fromId: string, toId: string) => {
      const db = dbRef.current;
      if (db) {
        await repo.recordRecent(db, fromId, toId);
        await refresh();
      } else {
        setRecents((cur) =>
          [{ id: memId.current++, fromId, toId, createdAt: Date.now() }, ...cur.filter((r) => !(r.fromId === fromId && r.toId === toId))].slice(
            0,
            repo.RECENTS_LIMIT,
          ),
        );
      }
    },
    [refresh],
  );

  const clearRecents = useCallback(async () => {
    const db = dbRef.current;
    if (db) {
      await repo.clearRecents(db);
      await refresh();
    } else {
      setRecents([]);
    }
  }, [refresh]);

  const resetLocalData = useCallback(async () => {
    const db = dbRef.current;
    const bundled = loadBundledDataset();
    if (db) {
      await repo.resetLocalData(db, bundled);
      setDataset((await repo.loadDataset(db)) ?? bundled);
      await refresh();
    } else {
      setFavourites([]);
      setRecents([]);
      setDataset(bundled);
    }
  }, [refresh]);

  const online = net.isInternetReachable ?? net.isConnected ?? null;

  const value = useMemo<AppState>(
    () => ({
      status,
      error,
      dataset,
      network,
      validation,
      storage,
      online,
      favourites,
      recents,
      isFavourite,
      toggleFavourite,
      removeFavourite,
      recordRecent,
      clearRecents,
      resetLocalData,
    }),
    [status, error, dataset, network, validation, storage, online, favourites, recents, isFavourite, toggleFavourite, removeFavourite, recordRecent, clearRecents, resetLocalData],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
