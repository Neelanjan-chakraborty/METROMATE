import { clampStep, nextStep, targetAfterSwipe } from '../pagerLogic';

describe('pager rules', () => {
  it('clamps and advances within the five steps', () => {
    expect(clampStep(-3, 5)).toBe(0);
    expect(clampStep(9, 5)).toBe(4);
    expect(nextStep(2, 5)).toBe(3);
    expect(nextStep(4, 5)).toBe(4);
  });
  it('a short slow drag settles on the nearer page', () => {
    expect(targetAfterSwipe(1.2, 0, 1, 5)).toBe(1);
    expect(targetAfterSwipe(1.7, 0, 1, 5)).toBe(2);
  });
  it('a quick flick moves one page even after a short drag, in both directions', () => {
    expect(targetAfterSwipe(1.15, 2, 1, 5)).toBe(2);
    expect(targetAfterSwipe(0.85, -2, 1, 5)).toBe(0);
  });
  it('never moves more than one page per swipe, and stays inside the ends', () => {
    expect(targetAfterSwipe(1.4, 9, 1, 5)).toBe(2);
    expect(targetAfterSwipe(0.6, -9, 1, 5)).toBe(0);
    expect(targetAfterSwipe(-0.3, -2, 0, 5)).toBe(0);
    expect(targetAfterSwipe(4.4, 3, 4, 5)).toBe(4);
  });
});
