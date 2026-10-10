import type { TransitIndex } from './transitIndex';

/** BRTS fare between two stops, from the feed's fare matrix. Null when either stop has no fare area. */
export function brtsFare(ix: TransitIndex, fromStop: number, toStop: number): { adult: number; child: number } | null {
  const a = ix.data.stops.area[fromStop];
  const b = ix.data.stops.area[toStop];
  if (a < 0 || b < 0 || a === b) return null;
  const n = ix.data.fares.areas.length;
  const c = ix.data.fares.matrix[a * n + b];
  if (!c || c === '-') return null;
  const i = parseInt(c, 36);
  const adult = ix.data.fares.adult[i];
  const child = ix.data.fares.child[i];
  return adult === undefined ? null : { adult, child };
}

export interface FareSummary {
  /** Sum of the fares the data knows (BRTS legs only), or null when none is known. */
  knownInr: number | null;
  knownChildInr: number | null;
  /** Modes in the plan whose fare is not available offline. */
  unavailable: ('AMTS' | 'GTSL' | 'BRTS' | 'metro')[];
  /** True when the total is not the whole fare. */
  partial: boolean;
}
