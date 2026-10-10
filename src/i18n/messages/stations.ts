import { defineCatalog } from '../catalog';

/** The Stations tab: header, search, line filter, empty state and the station cards. */
export default defineCatalog({
  // ---- header
  'stations.title': { en: 'Stations', hi: 'स्टेशन', gu: 'સ્ટેશન' },
  'stations.sub.one': { en: '{n} station · Works offline', hi: '{n} स्टेशन · ऑफ़लाइन चलता है', gu: '{n} સ્ટેશન · ઑફલાઇન ચાલે છે' },
  'stations.sub.other': { en: '{n} stations · Works offline', hi: '{n} स्टेशन · ऑफ़लाइन चलता है', gu: '{n} સ્ટેશન · ઑફલાઇન ચાલે છે' },
  'stations.offlineReady': { en: 'Offline ready', hi: 'ऑफ़लाइन तैयार', gu: 'ઑફલાઇન તૈયાર' },
  'stations.offlineReady.a11y': {
    en: 'Offline ready. Stations and search work without internet.',
    hi: 'ऑफ़लाइन तैयार। स्टेशन और खोज बिना इंटरनेट के चलते हैं।',
    gu: 'ઑફલાઇન તૈયાર. સ્ટેશન અને શોધ ઇન્ટરનેટ વગર ચાલે છે.',
  },

  // ---- search and filter
  'stations.search.placeholder': {
    en: 'Search station, alias or nearby place…',
    hi: 'स्टेशन, दूसरा नाम या पास की जगह खोजें…',
    gu: 'સ્ટેશન, બીજું નામ અથવા નજીકની જગ્યા શોધો…',
  },
  'stations.search.a11y': { en: 'Search stations', hi: 'स्टेशन खोजें', gu: 'સ્ટેશન શોધો' },
  'stations.search.clear': { en: 'Clear search', hi: 'खोज साफ़ करें', gu: 'શોધ સાફ કરો' },
  'stations.mapButton.a11y': { en: 'Open the metro map', hi: 'मेट्रो नक्शा खोलें', gu: 'મેટ્રો નકશો ખોલો' },
  'stations.filter.all': { en: 'All', hi: 'सभी', gu: 'બધા' },
  'stations.filter.a11y': { en: 'Filter: {label}', hi: 'फ़िल्टर: {label}', gu: 'ફિલ્ટર: {label}' },
  'stations.legend': {
    en: 'Exits and lifts are from GMRC’s gate table. A dashed chip is unverified.',
    hi: 'निकास और लिफ़्ट GMRC की गेट तालिका से हैं। बिंदीदार किनारे वाला चिप असत्यापित है।',
    gu: 'બહાર નીકળવાના રસ્તા અને લિફ્ટ GMRC ના ગેટ કોષ્ટકમાંથી છે. ટપકાંવાળી કિનારવાળી ચિપ ચકાસ્યા વગરની છે.',
  },
  'stations.empty.title': { en: 'No matching station', hi: 'कोई मेल खाता स्टेशन नहीं', gu: 'મેળ ખાતું કોઈ સ્ટેશન નથી' },
  'stations.empty.body': {
    en: 'Try a shorter name or a different spelling.',
    hi: 'छोटा नाम या अलग वर्तनी आज़माएँ।',
    gu: 'ટૂંકું નામ અથવા અલગ જોડણી અજમાવો.',
  },
  'stations.match.landmark': {
    en: 'Nearest station to {name} (unverified)',
    hi: '{name} का सबसे नज़दीकी स्टेशन (असत्यापित)',
    gu: '{name} નું સૌથી નજીકનું સ્ટેશન (ચકાસ્યા વગરનું)',
  },
  'stations.match.alias': { en: 'Also known as “{name}”', hi: '“{name}” नाम से भी जाना जाता है', gu: '“{name}” નામથી પણ ઓળખાય છે' },

  // ---- card: place line
  'stations.loc.near': { en: 'Near {name}', hi: '{name} के पास', gu: '{name} પાસે' },
  'stations.loc.alias': { en: 'Also known as {name}', hi: '{name} नाम से भी जाना जाता है', gu: '{name} નામથી પણ ઓળખાય છે' },
  'stations.loc.stop': { en: 'Stop {seq} of {total} · Phase {phase}', hi: '{total} में से स्टॉप {seq} · फेज़ {phase}', gu: '{total} માંથી સ્ટોપ {seq} · ફેઝ {phase}' },
  'stations.loc.phase': { en: 'Phase {phase}', hi: 'फेज़ {phase}', gu: 'ફેઝ {phase}' },

  // ---- card: lines, connections, chips
  'stations.line.named': { en: '{name} Line', hi: '{name} लाइन', gu: '{name} લાઇન' },
  'stations.line.metro': { en: 'Metro', hi: 'मेट्रो', gu: 'મેટ્રો' },
  'stations.interchange': { en: 'Interchange', hi: 'इंटरचेंज', gu: 'ઇન્ટરચેન્જ' },
  'stations.conn.bus': { en: 'Bus stop', hi: 'बस स्टॉप', gu: 'બસ સ્ટોપ' },
  'stations.conn.rail': { en: 'Rail', hi: 'रेल', gu: 'રેલ' },
  'stations.conn.generic': { en: 'Connection', hi: 'कनेक्शन', gu: 'કનેક્શન' },
  'stations.chip.exits.one': { en: '{n} Exit', hi: '{n} निकास', gu: '{n} બહાર નીકળવાનો રસ્તો' },
  'stations.chip.exits.other': { en: '{n} Exits', hi: '{n} निकास', gu: '{n} બહાર નીકળવાના રસ્તા' },
  'stations.chip.exitsNa': { en: 'Exits n/a', hi: 'निकास की जानकारी नहीं', gu: 'બહાર નીકળવાના રસ્તાની માહિતી નથી' },
  'stations.chip.lifts.one': { en: '{n} Lift', hi: '{n} लिफ़्ट', gu: '{n} લિફ્ટ' },
  'stations.chip.lifts.other': { en: '{n} Lifts', hi: '{n} लिफ़्ट', gu: '{n} લિફ્ટ' },

  // ---- card: spoken summary
  'stations.a11y.exits.one': { en: '{n} exit gate', hi: '{n} निकास गेट', gu: '{n} બહાર નીકળવાનો ગેટ' },
  'stations.a11y.exits.other': { en: '{n} exit gates', hi: '{n} निकास गेट', gu: '{n} બહાર નીકળવાના ગેટ' },
  'stations.a11y.exitsNa': { en: 'Exit gates not listed by GMRC', hi: 'GMRC ने निकास गेट सूचीबद्ध नहीं किए हैं', gu: 'GMRC એ બહાર નીકળવાના ગેટ નોંધ્યા નથી' },
  'stations.a11y.lifts.one': { en: '{n} lift', hi: '{n} लिफ़्ट', gu: '{n} લિફ્ટ' },
  'stations.a11y.lifts.other': { en: '{n} lifts', hi: '{n} लिफ़्ट', gu: '{n} લિફ્ટ' },
  'stations.unverified': { en: 'unverified', hi: 'असत्यापित', gu: 'ચકાસ્યા વગરનું' },
  'stations.a11y.open': { en: 'Open station details', hi: 'स्टेशन का विवरण खोलें', gu: 'સ્ટેશનની વિગતો ખોલો' },
});
