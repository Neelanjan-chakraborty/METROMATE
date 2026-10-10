import { defineCatalog } from '../catalog';

/** Shared interface text: tab bar, status badges, loading, language picker. */
export default defineCatalog({
  'common.tab.plan': { en: 'Plan', hi: 'योजना', gu: 'પ્લાન' },
  'common.tab.live': { en: 'Live', hi: 'लाइव', gu: 'લાઇવ' },
  'common.tab.map': { en: 'Map', hi: 'नक्शा', gu: 'નકશો' },
  'common.tab.bus': { en: 'Bus', hi: 'बस', gu: 'બસ' },
  'common.tab.stations': { en: 'Stations', hi: 'स्टेशन', gu: 'સ્ટેશન' },
  'common.tab.saved': { en: 'Saved', hi: 'सहेजे', gu: 'સાચવેલ' },

  'common.online': { en: 'Online', hi: 'ऑनलाइन', gu: 'ઑનલાઇન' },
  'common.offlineAll': { en: 'Offline · all features work', hi: 'ऑफ़लाइन · सब कुछ चलता है', gu: 'ઑફલાઇન · બધું ચાલે છે' },
  'common.online.a11y': { en: 'Online. Everything also works offline.', hi: 'ऑनलाइन। सब कुछ ऑफ़लाइन भी चलता है।', gu: 'ઑનલાઇન. બધું ઑફલાઇન પણ ચાલે છે.' },
  'common.offline.a11y': { en: 'Offline. Routes, search and saved journeys still work.', hi: 'ऑफ़लाइन। रूट, खोज और सहेजी यात्राएँ फिर भी चलती हैं।', gu: 'ઑફલાઇન. રૂટ, શોધ અને સાચવેલી મુસાફરીઓ હજુ ચાલે છે.' },

  'common.loading': { en: 'Loading offline data…', hi: 'ऑफ़लाइन डेटा लोड हो रहा है…', gu: 'ઑફલાઇન ડેટા લોડ થઈ રહ્યો છે…' },
  'common.loadError.title': { en: 'MetroMate could not load its data', hi: 'MetroMate अपना डेटा लोड नहीं कर सका', gu: 'MetroMate તેનો ડેટા લોડ કરી શક્યું નહીં' },
  'common.loadError.body': {
    en: '{error} Restart the app. If this persists, reinstall to restore the bundled offline data.',
    hi: '{error} ऐप फिर से शुरू करें। समस्या बनी रहे तो ऑफ़लाइन डेटा वापस पाने के लिए ऐप दोबारा इंस्टॉल करें।',
    gu: '{error} એપ ફરી શરૂ કરો. સમસ્યા ચાલુ રહે તો ઑફલાઇન ડેટા પાછો મેળવવા એપ ફરી ઇન્સ્ટૉલ કરો.',
  },
  'common.unknownError': { en: 'Unknown error.', hi: 'अज्ञात त्रुटि।', gu: 'અજ્ઞાત ભૂલ.' },

  'common.verify.verified': { en: 'Verified from GMRC', hi: 'GMRC से सत्यापित', gu: 'GMRC પરથી ચકાસેલ' },
  'common.verify.unverified': { en: 'Unverified', hi: 'असत्यापित', gu: 'ચકાસ્યા વગરનું' },
  'common.verify.estimated': { en: 'Estimate', hi: 'अनुमान', gu: 'અંદાજ' },
  'common.verify.unknown': { en: 'Not verified yet', hi: 'अभी सत्यापित नहीं', gu: 'હજુ ચકાસ્યું નથી' },

  'common.back': { en: 'Back', hi: 'वापस', gu: 'પાછા' },
  'common.close': { en: 'Close', hi: 'बंद करें', gu: 'બંધ કરો' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें', gu: 'રદ કરો' },
  'common.unknown': { en: 'unknown', hi: 'अज्ञात', gu: 'અજ્ઞાત' },

  'common.language.title': { en: 'Language', hi: 'भाषा', gu: 'ભાષા' },
  'common.language.a11y': { en: 'Change language. Now {language}.', hi: 'भाषा बदलें। अभी {language}।', gu: 'ભાષા બદલો. હાલ {language}.' },
  'common.language.note': {
    en: 'Changes the app’s buttons and text. Station names and official GMRC notes stay in English.',
    hi: 'ऐप के बटन और लेख की भाषा बदलती है। स्टेशनों के नाम और GMRC के आधिकारिक नोट अंग्रेज़ी में ही रहते हैं।',
    gu: 'એપના બટન અને લખાણની ભાષા બદલાય છે. સ્ટેશનોના નામ અને GMRC ની સત્તાવાર નોંધ અંગ્રેજીમાં જ રહે છે.',
  },
  'common.language.option.a11y': { en: '{language}, selected', hi: '{language}, चुनी हुई', gu: '{language}, પસંદ કરેલ' },
  'common.language.optionOff.a11y': { en: 'Switch to {language}', hi: '{language} में बदलें', gu: '{language} માં બદલો' },
});
