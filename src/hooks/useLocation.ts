import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { Fix } from '../lib/locator';

export type PermissionState = 'checking' | 'granted' | 'denied' | 'unavailable';
/**
 * 'precise'  → best available GPS fixes (more battery).
 * 'saver'    → balanced accuracy: lets the OS use network-assisted location (Wi-Fi / cell towers)
 *              where it can, at the cost of a larger accuracy radius. MetroMate cannot read cell
 *              tower IDs itself; the OS decides which sources to use.
 */
export type Precision = 'precise' | 'saver';

const HISTORY = 4;

export interface LocationState {
  permission: PermissionState;
  canAskAgain: boolean;
  /** null until checked. */
  servicesEnabled: boolean | null;
  fix: Fix | null;
  /** Most recent fixes, oldest first. */
  history: Fix[];
  error: string | null;
  /** Ticks every few seconds so signal age can be recomputed. */
  now: number;
  request: () => Promise<void>;
}

/** Foreground location only: updates stop when the app is closed or backgrounded. */
export function useLocation(active: boolean, precision: Precision): LocationState {
  const [permission, setPermission] = useState<PermissionState>('checking');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [servicesEnabled, setServicesEnabled] = useState<boolean | null>(null);
  const [history, setHistory] = useState<Fix[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const apply = useCallback((p: { granted: boolean; canAskAgain: boolean }) => {
    setPermission(p.granted ? 'granted' : 'denied');
    setCanAskAgain(p.canAskAgain);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await Location.getForegroundPermissionsAsync();
        if (!cancelled) apply(p);
      } catch {
        if (!cancelled) setPermission('unavailable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const request = useCallback(async () => {
    try {
      apply(await Location.requestForegroundPermissionsAsync());
    } catch {
      setPermission('unavailable');
    }
  }, [apply]);

  useEffect(() => {
    if (!active || permission !== 'granted') return;
    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const enabled = await Location.hasServicesEnabledAsync();
        if (cancelled) return;
        setServicesEnabled(enabled);
        setError(null);
        const s = await Location.watchPositionAsync(
          {
            accuracy: precision === 'precise' ? Location.Accuracy.BestForNavigation : Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (loc) => {
            const fix: Fix = {
              lat: loc.coords.latitude,
              lon: loc.coords.longitude,
              accuracyM: loc.coords.accuracy,
              timestamp: loc.timestamp,
              mocked: loc.mocked,
            };
            setHistory((h) => [...h, fix].slice(-HISTORY));
            setNow(Date.now());
          },
          (message) => setError(String(message)),
        );
        if (cancelled) s.remove();
        else sub = s;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [active, permission, precision]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  return { permission, canAskAgain, servicesEnabled, fix: history[history.length - 1] ?? null, history, error, now, request };
}
