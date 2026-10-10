/**
 * Facts and links the whole site shares. Everything a visitor can click goes somewhere real: page sections,
 * the published Android preview build, the public source repository and its issue tracker.
 */
export const site = {
  name: 'MetroMate',
  tagline: 'A calmer way through the city.',
  description:
    'MetroMate is an offline-first metro and bus companion for Ahmedabad and Gandhinagar: metro routes, bus connections and station details on your phone, without the everyday confusion.',
  /** Android preview build published with EAS (an APK you install directly; not on Google Play yet). */
  androidApk: 'https://expo.dev/artifacts/eas/FRk6vqoEAP_QPs_TEV6VlLTskJpNvcROpg5INuj4cpw.apk',
  repo: 'https://github.com/Neelanjan-chakraborty/METROMATE',
  issues: 'https://github.com/Neelanjan-chakraborty/METROMATE/issues',
  dataSources: 'https://github.com/Neelanjan-chakraborty/METROMATE/blob/main/docs/data-gaps.md',
} as const;

export const nav = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#offline', label: 'Offline mode' },
  { href: '#faq', label: 'FAQ' },
] as const;

/** Network facts used in copy (from the app's bundled GMRC dataset and bus timetable feed). */
export const network = {
  stations: 54,
  interchanges: ['Old High Court', 'GNLU'],
  busRoutes: { brts: 149, amts: 474, gandhinagar: 10 },
} as const;
