import { enT, type T } from '../../i18n/translate';
import type { AgencyId } from './types';

/** Minutes since midnight -> "HH:MM" (wraps past 24:00; use `dayOffset` for the "+1"). */
export function formatClockMinutes(m: number): string {
  const total = Math.round(m);
  const h = (((Math.floor(total / 60) % 24) + 24) % 24).toString().padStart(2, '0');
  const mm = (((total % 60) + 60) % 60).toString().padStart(2, '0');
  return `${h}:${mm}`;
}

/** Whole days past the service day's midnight (1 for 24:00–47:59). */
export function dayOffset(m: number): number {
  return Math.floor(Math.round(m) / 1440);
}

/** "1 h 5 min", "42 min", "under 1 min" (units in the language of `t`). */
export function formatSpan(minutes: number, t: T = enT): string {
  const m = Math.round(minutes);
  if (m < 1) return t('lib.duration.under1');
  if (m < 60) return t('lib.duration.min', { n: m });
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? t('lib.duration.hMin', { h, m: r }) : t('lib.duration.h', { h });
}

/** Parses the `at` URL parameter ("0930" or "09:30") into minutes since midnight, or null. */
export function parseAtParam(v: string | undefined | null): number | null {
  const m = /^(\d{1,2}):?(\d{2})$/.exec((v ?? '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

export const formatAtParam = (m: number): string => formatClockMinutes(m);

export const minutesOfDay = (d: Date): number => d.getHours() * 60 + d.getMinutes();

export const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const isoDate = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Colours and short names for the three bus systems. BRTS (AJL / Janmarg) is called "BRTS" everywhere. */
export const AGENCY_LOOK: Record<AgencyId, { label: string; full: string; color: string; soft: string }> = {
  AJL: { label: 'BRTS', full: 'BRTS (Janmarg)', color: '#D92D20', soft: '#FDECEA' },
  AMTS: { label: 'AMTS', full: 'AMTS city bus', color: '#0F6FC4', soft: '#E3F1FC' },
  GTSL: { label: 'Gandhinagar bus', full: 'Gandhinagar bus (GTSL)', color: '#0E9F6E', soft: '#E4F7EF' },
};

/** The one-word chip form of the agency name: "Gandhinagar" for the Gandhinagar bus, otherwise the brand name. Never translated. */
export const agencyShort = (a: AgencyId): string => (a === 'GTSL' ? 'Gandhinagar' : AGENCY_LOOK[a].label);

/** The short agency name ("BRTS", "AMTS", "Gandhinagar bus") in the language of `t`. */
export function agencyLabel(id: AgencyId, t: T = enT): string {
  return id === 'GTSL' ? t('lib.agency.gtsl.label') : AGENCY_LOOK[id].label;
}

/** The full agency name ("BRTS (Janmarg)", "AMTS city bus", "Gandhinagar bus (GTSL)") in the language of `t`. */
export function agencyFull(id: AgencyId, t: T = enT): string {
  if (id === 'GTSL') return t('lib.agency.gtsl.full');
  if (id === 'AMTS') return t('lib.agency.amts.full');
  return AGENCY_LOOK[id].full;
}
