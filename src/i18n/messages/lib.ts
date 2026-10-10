import { defineCatalog } from '../catalog';

/** Words and sentences built by pure helpers in src/lib: dates, durations, counts, bus-agency names, shared text. */
export default defineCatalog({
  'lib.and': { en: 'and', hi: 'और', gu: 'અને' },

  'lib.day.today': { en: 'Today', hi: 'आज', gu: 'આજે' },
  'lib.day.yesterday': { en: 'Yesterday', hi: 'कल', gu: 'ગઈકાલે' },
  'lib.nextDay': { en: '+1 day', hi: '+1 दिन', gu: '+1 દિવસ' },

  'lib.duration.under1': { en: 'under 1 min', hi: '1 मिनट से कम', gu: '1 મિનિટથી ઓછું' },
  'lib.duration.min': { en: '{n} min', hi: '{n} मिनट', gu: '{n} મિનિટ' },
  'lib.duration.h': { en: '{h} h', hi: '{h} घं', gu: '{h} કલાક' },
  'lib.duration.hMin': { en: '{h} h {m} min', hi: '{h} घं {m} मिनट', gu: '{h} કલાક {m} મિનિટ' },

  'lib.unit.m': { en: '{n} m', hi: '{n} मी.', gu: '{n} મી.' },
  'lib.unit.km': { en: '{n} km', hi: '{n} किमी', gu: '{n} કિમી' },

  'lib.stops.one': { en: '{n} stop', hi: '{n} स्टॉप', gu: '{n} સ્ટોપ' },
  'lib.stops.other': { en: '{n} stops', hi: '{n} स्टॉप', gu: '{n} સ્ટોપ' },
  'lib.routes.one': { en: '{n} route', hi: '{n} रूट', gu: '{n} રૂટ' },
  'lib.routes.other': { en: '{n} routes', hi: '{n} रूट', gu: '{n} રૂટ' },
  'lib.stations.one': { en: '{n} station', hi: '{n} स्टेशन', gu: '{n} સ્ટેશન' },
  'lib.stations.other': { en: '{n} stations', hi: '{n} स्टेशन', gu: '{n} સ્ટેશન' },

  // Bus agency names. BRTS (Janmarg) and the short AMTS label are brand names and stay as they are.
  'lib.agency.amts.full': { en: 'AMTS city bus', hi: 'AMTS सिटी बस', gu: 'AMTS સિટી બસ' },
  'lib.agency.gtsl.label': { en: 'Gandhinagar bus', hi: 'Gandhinagar बस', gu: 'Gandhinagar બસ' },
  'lib.agency.gtsl.full': { en: 'Gandhinagar bus (GTSL)', hi: 'Gandhinagar बस (GTSL)', gu: 'Gandhinagar બસ (GTSL)' },

  // Plain-text trip summary for the share sheet.
  'lib.share.summary': {
    en: '{from} → {to}: leave {depart}, arrive {arrive} ({span})',
    hi: '{from} → {to}: {depart} पर रवाना, {arrive} पर पहुँचेंगे ({span})',
    gu: '{from} → {to}: {depart} એ ઉપડશે, {arrive} એ પહોંચશે ({span})',
  },
  'lib.share.walk': {
    en: 'Walk about {n} min to {place}.',
    hi: 'लगभग {n} मिनट पैदल चलकर {place} पहुँचें।',
    gu: 'લગભગ {n} મિનિટ ચાલીને {place} પહોંચો.',
  },
  'lib.share.bus': {
    en: '{agency} {route} towards {headsign}: {from} {depart} → {to} {arrive} (scheduled).',
    hi: '{agency} {route} ({headsign} की ओर): {from} {depart} → {to} {arrive} (निर्धारित)।',
    gu: '{agency} {route} ({headsign} તરફ): {from} {depart} → {to} {arrive} (નિર્ધારિત).',
  },
  'lib.share.metro': {
    en: 'Metro {line} towards {towards}: {from} about {depart} → {to} about {arrive} (estimated).',
    hi: 'मेट्रो {line} ({towards} की ओर): {from} लगभग {depart} → {to} लगभग {arrive} (अनुमानित)।',
    gu: 'મેટ્રો {line} ({towards} તરફ): {from} લગભગ {depart} → {to} લગભગ {arrive} (અંદાજિત).',
  },
  'lib.share.footer': {
    en: 'Bus times are scheduled, not live; metro and walking times are estimates. Planned with MetroMate.',
    hi: 'बस के समय निर्धारित हैं, लाइव नहीं; मेट्रो और पैदल के समय अनुमान हैं। MetroMate से प्लान किया गया।',
    gu: 'બસના સમય નિર્ધારિત છે, લાઇવ નથી; મેટ્રો અને ચાલવાના સમય અંદાજ છે. MetroMate વડે પ્લાન કરેલ.',
  },
});
