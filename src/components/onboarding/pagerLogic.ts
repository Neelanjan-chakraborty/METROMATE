/** Pure pager rules, kept apart from the gesture code so they can be tested. */

export const clampStep = (i: number, count: number): number => Math.max(0, Math.min(count - 1, Math.round(i)));

export const nextStep = (i: number, count: number): number => clampStep(i + 1, count);

/**
 * Where a swipe lands. `position` is the pager's float position when the finger lifts, `velocity` is in pages per
 * second (positive = towards the next page), `from` the page the swipe began on. A fast flick moves one page even
 * if the drag was short; a slow drag settles on whichever page is nearer; never more than one page per swipe.
 */
export function targetAfterSwipe(position: number, velocity: number, from: number, count: number): number {
  'worklet';
  const projected = position + velocity * 0.25;
  let target = Math.round(projected);
  if (target > from + 1) target = from + 1;
  if (target < from - 1) target = from - 1;
  if (target < 0) target = 0;
  if (target > count - 1) target = count - 1;
  return target;
}
