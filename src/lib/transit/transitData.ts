import { useEffect, useState } from 'react';
import { buildIndex, type TransitIndex } from './transitIndex';
import type { TransitData } from './types';

/*
 * Lazy loader for the bus timetable (data/transit/transit.json, ~1.1 MB). The JSON is bundled with the
 * app but only parsed the first time something asks for it, so it never slows app start. Metro-only
 * features never touch it.
 */

let cached: TransitIndex | null = null;
let failed: Error | null = null;

/** Parses and indexes the data on first call (synchronous, tens of milliseconds); later calls are free. */
export function loadTransit(): TransitIndex {
  if (cached) return cached;
  try {
    // A function-level require is evaluated on first use, not at startup.
    const data = require('../../../data/transit/transit.json') as TransitData;
    cached = buildIndex(data);
    return cached;
  } catch (e) {
    failed = e instanceof Error ? e : new Error(String(e));
    throw failed;
  }
}

/** The index if it has already been loaded, else null. Never triggers a load. */
export function transitIfLoaded(): TransitIndex | null {
  return cached;
}

export type TransitState = { status: 'loading' } | { status: 'ready'; transit: TransitIndex } | { status: 'error'; error: Error };

/** Loads the bus data shortly after the screen first paints. Metro features work while it loads. */
export function useTransit(enabled = true): TransitState {
  const [state, setState] = useState<TransitState>(() => (cached ? { status: 'ready', transit: cached } : failed ? { status: 'error', error: failed } : { status: 'loading' }));
  useEffect(() => {
    if (!enabled || state.status !== 'loading') return;
    // A short timer rather than InteractionManager: the looping hero animations keep the interaction queue busy forever.
    const id = setTimeout(() => {
      try {
        setState({ status: 'ready', transit: loadTransit() });
      } catch (e) {
        setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)) });
      }
    }, 60);
    return () => clearTimeout(id);
  }, [enabled, state.status]);
  return state;
}

/** True when the feed's last valid day is before `today` (YYYY-MM-DD). */
export function feedExpired(t: TransitIndex, today: string): boolean {
  return today > t.data.meta.source.validTo;
}
