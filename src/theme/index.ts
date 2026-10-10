export const colors = {
  primary: '#4F35E8',
  primaryDark: '#2E1FA8',
  primarySoft: '#EFEDFF',
  bg: '#F7F7FF',
  card: '#FFFFFF',
  border: '#E2E5F2',
  text: '#111A32',
  muted: '#566074',
  faint: '#8791A5',
  /** Secondary text on the Home screen, per the design reference. */
  slate: '#78839D',
  origin: '#0E9F6E',
  originSoft: '#E4F7EF',
  destination: '#D92D20',
  destinationSoft: '#FDECEA',
  interchange: '#F59E0B',
  interchangeSoft: '#FEF4DC',
  warn: '#B54708',
  warnSoft: '#FFF4E5',
  warnBorder: '#F9D9A8',
  ok: '#067647',
  okSoft: '#E4F7EF',
  offline: '#B42318',
  offlineSoft: '#FEE4E2',
  white: '#FFFFFF',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const type = {
  title: { fontSize: 26, fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.muted },
  tiny: { fontSize: 12, color: colors.muted },
};
