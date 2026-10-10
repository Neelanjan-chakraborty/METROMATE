import type { Corridor, RouteResult, Station, TimetableLine } from '../types';
import { hopMinutes } from './eta';
import { enT, enTN, type T, type TN } from '../i18n/translate';
import { GNLU_WARNING, PHASE_WARNING } from './routing';

/** View-model helpers for the Route screen. Pure so they can be tested. */

export type StopKind = 'origin' | 'stop' | 'interchange' | 'destination';

export interface StopView {
  id: string;
  kind: StopKind;
  /** Index into route.segments of the segment this stop is drawn in. */
  segment: number;
  /** Estimated minutes after leaving the origin (in-train only), or null when no estimate exists. */
  minutes: number | null;
}

/**
 * Estimated minutes from the origin to every station of the route. Built from GMRC's published
 * end-to-end line times spread over the hops by distance between the (estimated) station pins, or scaled
 * to GMRC's calculator time for this pair when one is stored. It is an estimate: it excludes waiting and
 * the time to change trains, and null is returned (no number invented) when a hop has no published line.
 */
export function stopMinutes(
  route: RouteResult,
  coordOf: (id: string) => { lat: number; lon: number } | null | undefined,
  lines: TimetableLine[],
  calculatorMinutes?: number | null,
): number[] | null {
  const hop = hopMinutes(route.stationIds, coordOf, lines, calculatorMinutes);
  if (!hop) return null;
  const out = [0];
  for (const m of hop.minutes) out.push(out[out.length - 1] + m);
  return out;
}

/** Every station of the route once, tagged with how it should be drawn. */
export function stopsOf(route: RouteResult, minutes: number[] | null): StopView[] {
  const out: StopView[] = [];
  let idx = 0;
  route.segments.forEach((seg, si) => {
    seg.stationIds.forEach((id, k) => {
      if (si > 0 && k === 0) return; // already drawn as the previous segment's end
      const isFirst = idx === 0;
      const isLast = si === route.segments.length - 1 && k === seg.stationIds.length - 1;
      const isEnd = k === seg.stationIds.length - 1;
      out.push({
        id,
        kind: isFirst ? 'origin' : isLast ? 'destination' : isEnd ? 'interchange' : 'stop',
        segment: si,
        minutes: minutes ? Math.round(minutes[idx]) : null,
      });
      idx += 1;
    });
  });
  return out;
}

/** Segment lengths as fractions of the whole trip, for the overview bar. */
export function overview(route: RouteResult): { corridorId: string; stops: number; share: number }[] {
  const total = route.segments.reduce((s, x) => s + x.stops, 0) || 1;
  return route.segments.map((x) => ({ corridorId: x.corridorId, stops: x.stops, share: x.stops / total }));
}

/** Plain-text summary for the system share sheet. The default translators give the English text. */
export function shareSummary(route: RouteResult, stations: Map<string, Station>, corridors: Map<string, Corridor>, t: T = enT, tn: TN = enTN): string {
  const name = (id: string) => stations.get(id)?.name ?? id;
  const lines = [t('route.lib.share.header', { from: name(route.originId), to: name(route.destinationId) })];
  route.segments.forEach((seg, i) => {
    const c = corridors.get(seg.corridorId)?.shortName ?? seg.corridorId;
    lines.push(
      t(i === 0 ? 'route.lib.share.board' : 'route.lib.share.change', {
        line: c,
        from: name(seg.fromStationId),
        towards: name(seg.directionTerminalId),
        stops: tn('route.stops', seg.stops),
        to: name(seg.toStationId),
      }),
    );
  });
  const changes = route.interchanges.length === 0 ? t('route.lib.noChange') : tn('route.lib.changes', route.interchanges.length);
  lines.push(t('route.lib.share.summary', { stops: tn('route.stops', route.stopCount), changes }));
  return lines.join('\n');
}

/** A short heading for a route warning; the full text is shown when it is opened. */
export function warningTitle(text: string, t: T = enT): string {
  if (text.startsWith('GMRC’s fare rules')) return t('route.lib.warn.confirmTicket');
  if (text.startsWith('GNLU is marked')) return t('route.lib.warn.gnlu');
  const colon = text.indexOf(': ');
  if (colon > 0 && colon < 40) return t('route.lib.warn.checkBeforeGo', { place: text.slice(0, colon) });
  return text.length > 48 ? `${text.slice(0, 45)}…` : text;
}

/**
 * The full text of a route warning. The two warnings the app writes itself are translated; a warning that comes
 * from the data (a station's service note) is shown exactly as the data gives it.
 */
export function warningText(text: string, t: T = enT): string {
  if (text === PHASE_WARNING) return t('route.lib.warn.phaseText');
  if (text === GNLU_WARNING) return t('route.lib.warn.gnluText');
  return text;
}

/** "North–South Line" (or the short name as GMRC gives it when it already says "line" / "branch"); "Metro" when unknown. */
export function corridorLabel(c: Pick<Corridor, 'shortName'> | null | undefined, t: T = enT): string {
  if (!c) return t('route.line.metro');
  return /branch|line$/i.test(c.shortName) ? c.shortName : t('route.line.name', { name: c.shortName });
}
