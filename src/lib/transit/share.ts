import type { TransitPlan } from './planner';
import { AGENCY_LOOK, dayOffset, formatClockMinutes, formatSpan } from './format';

/** Plain-text summary of a plan for the system share sheet. States what is scheduled and what is estimated. */
export function transitShareText(plan: TransitPlan, fromName: string, toName: string, corridorName: (id: string) => string, stationName: (id: string) => string): string {
  const t = (m: number) => `${formatClockMinutes(m)}${dayOffset(m) > 0 ? ' (+1 day)' : ''}`;
  const first = plan.legs[0];
  const lines = [`${fromName} → ${toName}: leave ${t(first.depart)}, arrive ${t(plan.arriveAt)} (${formatSpan(plan.arriveAt - first.depart)})`];
  for (const l of plan.legs) {
    if (l.mode === 'walk') lines.push(`Walk about ${Math.max(1, Math.round((l.arrive - l.depart)))} min to ${l.to.name}.`);
    else if (l.mode === 'bus') lines.push(`${AGENCY_LOOK[l.agency].label} ${l.routeShort} towards ${l.headsign}: ${l.from.name} ${t(l.depart)} → ${l.to.name} ${t(l.arrive)} (scheduled).`);
    else lines.push(`Metro ${corridorName(l.corridorId)} towards ${stationName(l.towardsId)}: ${l.from.name} about ${t(l.depart)} → ${l.to.name} about ${t(l.arrive)} (estimated).`);
  }
  lines.push('Bus times are scheduled, not live; metro and walking times are estimates. Planned with MetroMate.');
  return lines.join('\n');
}
