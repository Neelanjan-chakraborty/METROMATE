/** Onboarding palette. Every illustration and control draws from these, so the five scenes read as one set. */
export const ob = {
  indigo: '#25216F',
  violet: '#5140E8',
  lavender: '#E9E7FF',
  bg: '#F6F7FD',
  white: '#FFFFFF',
  mint: '#35C99A',
  red: '#F04444',
  blue: '#2783F5',
  /** Secondary text on white: 6.9:1. */
  ink2: '#4A4780',
  /** Supporting tints made from the palette above. */
  violetSoft: '#B9B0F7',
  violetMid: '#8B7FF0',
  lavenderDeep: '#D4CFFA',
  indigoSoft: '#4B4793',
  sunrisePeach: '#FFE2D1',
  sunrisePink: '#F6D3E8',
  sunriseGold: '#FFC98F',
  grass: '#BFE8D3',
  road: '#3A3780',
  roadLine: '#F6F7FD',
} as const;

/** Artboard shared by all five scenes (units): the 360 x 440 view plus 60 units of overscan each side. */
export const BOARD_W = 360;
export const BOARD_H = 440;
export const OVERSCAN = 60;
export const VIEWBOX = `${-OVERSCAN} 0 ${BOARD_W + OVERSCAN * 2} ${BOARD_H}`;
export const STEP_COUNT = 5;
