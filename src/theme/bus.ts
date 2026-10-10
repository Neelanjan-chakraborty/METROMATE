/**
 * The Bus tab's red theme. Used only by the Bus screens, the bus layer of the map and the Bus tab's active
 * state; the rest of the app stays violet. `red` is 5.6:1 on white (WCAG AA for normal text), `dark` is
 * for text on `soft` and for pressed states.
 */
export const bus = {
  red: '#C62828',
  dark: '#8E1B1B',
  soft: '#FDECEA',
  /** Hairlines and borders on white. */
  line: '#F2CFCB',
  /** Body text on the Bus screens: a warm near-black. */
  ink: '#1F1A1A',
  /** Secondary text, 7:1 on white. */
  inkSoft: '#5E4B4A',
  /** Page background behind cards. */
  bg: '#FFF8F6',
  white: '#FFFFFF',
} as const;
