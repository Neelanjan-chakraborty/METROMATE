import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { useIsFocused } from 'expo-router';
import { heroLookAt, minuteOfDay } from '../../lib/skyPalette';

/** Local minute of the day (fractional), refreshed every 30 s and whenever the app returns to the foreground. */
export function useMinuteOfDay(refreshMs = 30_000): number {
  const [m, setM] = useState(() => minuteOfDay(new Date()));
  useEffect(() => {
    const tick = () => setM(minuteOfDay(new Date()));
    const id = setInterval(tick, refreshMs);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [refreshMs]);
  return m;
}

/** True when the user has asked the OS to reduce motion. Moving parts of the hero then stay still. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/** True while the app is in the foreground, so animations can stop in the background. */
export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}

/** Parses a "HH:MM" preview time (used by the `?sky=` URL/deep-link parameter). Returns null if invalid. */
export function parsePreviewTime(v: string | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v ?? '');
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/**
 * Everything a screen needs to drive the shared hero: the sky look for the current (or previewed)
 * time, whether the screen is focused, and whether moving parts may run right now.
 */
export function useHeroState(skyParam: string | undefined) {
  const clock = useMinuteOfDay();
  const preview = parsePreviewTime(skyParam);
  const look = useMemo(() => heroLookAt(preview ?? clock), [preview, clock]);
  const focused = useIsFocused();
  const appActive = useAppActive();
  const reduceMotion = useReduceMotion();
  return { look, focused, animate: focused && appActive && !reduceMotion };
}
