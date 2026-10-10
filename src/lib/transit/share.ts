import type { TransitPlan } from './planner';
import { agencyLabel, dayOffset, formatClockMinutes, formatSpan } from './format';
import { enT, type T } from '../../i18n/translate';

/** Plain-text summary of a plan for the system share sheet. States what is scheduled and what is estimated. */
export function transitShareText(
  plan: TransitPlan,
  fromName: string,
  toName: string,
  corridorName: (id: string) => string,
  stationName: (id: string) => string,
  t: T = enT,
): string {
  const at = (m: number) => `${formatClockMinutes(m)}${dayOffset(m) > 0 ? ` (${t('lib.nextDay')})` : ''}`;
  const first = plan.legs[0];
  const lines = [t('lib.share.summary', { from: fromName, to: toName, depart: at(first.depart), arrive: at(plan.arriveAt), span: formatSpan(plan.arriveAt - first.depart, t) })];
  for (const l of plan.legs) {
    if (l.mode === 'walk') lines.push(t('lib.share.walk', { n: Math.max(1, Math.round(l.arrive - l.depart)), place: l.to.name }));
    else if (l.mode === 'bus')
      lines.push(t('lib.share.bus', { agency: agencyLabel(l.agency, t), route: l.routeShort, headsign: l.headsign, from: l.from.name, depart: at(l.depart), to: l.to.name, arrive: at(l.arrive) }));
    else
      lines.push(t('lib.share.metro', { line: corridorName(l.corridorId), towards: stationName(l.towardsId), from: l.from.name, depart: at(l.depart), to: l.to.name, arrive: at(l.arrive) }));
  }
  lines.push(t('lib.share.footer'));
  return lines.join('\n');
}
