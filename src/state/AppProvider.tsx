import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNetworkState } from 'expo-network';
import type { Dataset, QuickRoute, QuickSlot, SavedJourney, StationCoord } from '../types';
import { accumulatorAccuracyM, buildLinks, buildStationPoints, mergeStationFix, type Fix, type Link, type StationPoint } from '../lib/locator';
import { loadBundledDataset } from '../lib/dataset';
import { validateDataset, type ValidationReport } from '../lib/dataValidation';
import { buildNetwork, type Network } from '../lib/routing';
import * as repo from '../db/repository';
import type { Db } from '../db/types';
import { openAppDatabase } from '../db';
import { DEFAULT_LANGUAGE, detectLanguage, isLanguage, type Language } from '../i18n/languages';

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
  /** Home / Campus / Work shortcuts saved on this phone. */
  quickRoutes: QuickRoute[];
  setQuickRoute: (slot: QuickSlot, fromId: string, toId: string) => Promise<void>;
  clearQuickRoute: (slot: QuickSlot) => Promise<void>;
  /** Positions recorded on this phone from GPS fixes. */
  stationCoords: StationCoord[];
  /** Best known coordinates per station (dataset pins and recorded positions). */
  stationPoints: Map<string, StationPoint>;
  /** Undirected station links, for locating a fix between two stations. */
  links: Link[];
  /** Adds a GPS fix to a station's recorded position. Resolves null if the fix is too inaccurate. */
  recordStationFix: (stationId: string, fix: Pick<Fix, 'lat' | 'lon' | 'accuracyM'>) => Promise<StationCoord | null>;
  clearStationCoord: (stationId: string) => Promise<void>;
  clearStationCoords: () => Promise<void>;
  isFavourite: (fromId: string, toId: string) => boolean;
  toggleFavourite: (fromId: string, toId: string) => Promise<void>;
  removeFavourite: (id: number) => Promise<void>;
  recordRecent: (fromId: string, toId: string) => Promise<void>;
  clearRecents: () => Promise<void>;
  resetLocalData: () => Promise<void>;
  /** Interface language: saved on this phone; the first launch follows the phone's language. */
  language: Language;
  setLanguage: (l: Language) => Promise<void>;
  /** First-run welcome guide: 'loading' until the saved setting is read, 'pending' until the user finishes or skips it. */
  onboarding: 'loading' | 'pending' | 'done';
  completeOnboarding: () => Promise<void>;
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
  const [stationCoords, setStationCoords] = useState<StationCoord[]>([]);
  const [quickRoutes, setQuickRoutes] = useState<QuickRoute[]>([]);
  const [onboarding, setOnboarding] = useState<'loading' | 'pending' | 'done'>('loading');
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const dbRef = useRef<Db | null>(null);
  const memId = useRef(1);
  const net = useNetworkState();

  const refresh = useCallback(async () => {
    const db = dbRef.current;
    if (!db) return;
    setFavourites(await repo.listFavourites(db));
    setRecents(await repo.listRecents(db));
    setStationCoords(await repo.listStationCoords(db));
    setQuickRoutes(await repo.listQuickRoutes(db));
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
        const savedLanguage = await repo.getSetting(db, 'language');
        if (!cancelled) setLanguageState(isLanguage(savedLanguage) ? savedLanguage : detectLanguage());
        const seen = await repo.getSetting(db, 'onboarding');
        if (!cancelled) setOnboarding(seen === 'done' ? 'done' : 'pending');
        const [f, r, c, q] = [await repo.listFavourites(db), await repo.listRecents(db), await repo.listStationCoords(db), await repo.listQuickRoutes(db)];
        if (cancelled) return;
        setFavourites(f);
        setRecents(r);
        setStationCoords(c);
        setQuickRoutes(q);
        setStorage('sqlite');
      } catch (e) {
        // The app must keep working without the database: fall back to the bundled data.
        if (cancelled) return;
        console.warn('MetroMate: SQLite unavailable, using in-memory storage.', e);
        dbRef.current = null;
        setLanguageState(detectLanguage());
        setOnboarding('pending');
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

  const setQuickRoute = useCallback(
    async (slot: QuickSlot, fromId: string, toId: string) => {
      const db = dbRef.current;
      if (db) {
        await repo.setQuickRoute(db, slot, fromId, toId);
        await refresh();
      } else {
        if (fromId === toId) return;
        setQuickRoutes((cur) => [...cur.filter((q) => q.slot !== slot), { slot, fromId, toId, updatedAt: Date.now() }]);
      }
    },
    [refresh],
  );

  const clearQuickRoute = useCallback(
    async (slot: QuickSlot) => {
      const db = dbRef.current;
      if (db) {
        await repo.clearQuickRoute(db, slot);
        await refresh();
      } else {
        setQuickRoutes((cur) => cur.filter((q) => q.slot !== slot));
      }
    },
    [refresh],
  );

  const stationPoints = useMemo(
    () => buildStationPoints(dataset?.stations ?? [], stationCoords),
    [dataset, stationCoords],
  );
  const links = useMemo(() => buildLinks(dataset?.connections ?? []), [dataset]);

  const recordStationFix = useCallback(
    async (stationId: string, fix: Pick<Fix, 'lat' | 'lon' | 'accuracyM'>) => {
      const db = dbRef.current;
      if (db) {
        const saved = await repo.recordStationFix(db, stationId, fix);
        if (saved) await refresh();
        return saved;
      }
      // In-memory fallback: same maths, no persistence.
      const prev = stationCoords.find((c) => c.stationId === stationId);
      const merged = mergeStationFix(prev ? { lat: prev.lat, lon: prev.lon, weight: prev.weight, samples: prev.samples } : null, fix);
      if (!merged) return null;
      const next: StationCoord = { stationId, ...merged, updatedAt: Date.now(), accuracyM: accumulatorAccuracyM(merged) };
      setStationCoords((cur) => [...cur.filter((c) => c.stationId !== stationId), next]);
      return next;
    },
    [stationCoords, refresh],
  );

  const clearStationCoord = useCallback(
    async (stationId: string) => {
      const db = dbRef.current;
      if (db) {
        await repo.clearStationCoord(db, stationId);
        await refresh();
      } else {
        setStationCoords((cur) => cur.filter((c) => c.stationId !== stationId));
      }
    },
    [refresh],
  );

  const clearStationCoords = useCallback(async () => {
    const db = dbRef.current;
    if (db) {
      await repo.clearStationCoords(db);
      await refresh();
    } else {
      setStationCoords([]);
    }
  }, [refresh]);

  const setLanguage = useCallback(async (l: Language) => {
    setLanguageState(l);
    const db = dbRef.current;
    if (db) await repo.setSetting(db, 'language', l).catch(() => undefined);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setOnboarding('done');
    const db = dbRef.current;
    if (db) await repo.setSetting(db, 'onboarding', 'done').catch(() => undefined);
  }, []);

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
      setQuickRoutes([]);
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
      quickRoutes,
      setQuickRoute,
      clearQuickRoute,
      stationCoords,
      stationPoints,
      links,
      recordStationFix,
      clearStationCoord,
      clearStationCoords,
      isFavourite,
      toggleFavourite,
      removeFavourite,
      recordRecent,
      clearRecents,
      resetLocalData,
      language,
      setLanguage,
      onboarding,
      completeOnboarding,
    }),
    [status, error, dataset, network, validation, storage, online, favourites, recents, quickRoutes, setQuickRoute, clearQuickRoute, stationCoords, stationPoints, links, recordStationFix, clearStationCoord, clearStationCoords, isFavourite, toggleFavourite, removeFavourite, recordRecent, clearRecents, resetLocalData, language, setLanguage, onboarding, completeOnboarding],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
