import { defineCatalog } from '../catalog';

/** Home tab: header, journey card, shortcuts, quick routes, recent trips, and the station picker. */
export default defineCatalog({
  // header
  'home.header.tagline': { en: 'Your offline metro companion', hi: 'आपका ऑफ़लाइन मेट्रो साथी', gu: 'તમારો ઑફલાઇન મેટ્રો સાથી' },
  'home.header.offlineReady': { en: 'Offline ready', hi: 'ऑफ़लाइन तैयार', gu: 'ઑફલાઇન તૈયાર' },
  'home.header.offlineReady.a11y': {
    en: 'Offline ready. Routes, search and saved journeys work without internet.',
    hi: 'ऑफ़लाइन तैयार। रूट, खोज और सहेजी यात्राएँ बिना इंटरनेट के चलती हैं।',
    gu: 'ઑફલાઇન તૈયાર. રૂટ, શોધ અને સાચવેલી મુસાફરીઓ ઇન્ટરનેટ વગર ચાલે છે.',
  },

  // journey card
  'home.card.title': { en: 'Where are you going?', hi: 'आप कहाँ जा रहे हैं?', gu: 'તમે ક્યાં જઈ રહ્યા છો?' },
  'home.card.subtitle': { en: 'Plan your journey, even offline.', hi: 'ऑफ़लाइन भी अपनी यात्रा प्लान करें।', gu: 'ઑફલાઇન પણ તમારી મુસાફરી પ્લાન કરો.' },
  'home.card.from': { en: 'FROM', hi: 'से', gu: 'થી' },
  'home.card.to': { en: 'TO', hi: 'तक', gu: 'સુધી' },
  'home.card.fromPlaceholder': { en: 'Starting station', hi: 'शुरुआती स्टेशन', gu: 'શરૂઆતનું સ્ટેશન' },
  'home.card.toPlaceholder': { en: 'Destination', hi: 'गंतव्य', gu: 'ગંતવ્ય' },
  'home.card.notChosen': { en: 'not chosen', hi: 'चुना नहीं गया', gu: 'પસંદ કર્યું નથી' },
  'home.card.from.a11y': {
    en: 'From station: {name}. Tap to change',
    hi: 'शुरुआती स्टेशन: {name}। बदलने के लिए टैप करें',
    gu: 'શરૂઆતનું સ્ટેશન: {name}. બદલવા માટે ટેપ કરો',
  },
  'home.card.to.a11y': {
    en: 'To station: {name}. Tap to change',
    hi: 'गंतव्य स्टेशन: {name}। बदलने के लिए टैप करें',
    gu: 'ગંતવ્ય સ્ટેશન: {name}. બદલવા માટે ટેપ કરો',
  },
  'home.card.swap.a11y': {
    en: 'Swap start and destination',
    hi: 'शुरुआत और गंतव्य की अदला-बदली करें',
    gu: 'શરૂઆત અને ગંતવ્યની અદલાબદલી કરો',
  },
  'home.card.leaveNow': { en: 'Leave now', hi: 'अभी निकलें', gu: 'હમણાં નીકળો' },
  'home.card.departAt': { en: 'Depart at…', hi: 'रवानगी का समय…', gu: 'ઉપડવાનો સમય…' },
  'home.card.departTime': { en: 'Depart {time}', hi: 'रवानगी {time}', gu: 'ઉપડવાનો સમય {time}' },
  'home.card.departAt.a11y': { en: 'Depart at a chosen time', hi: 'चुने हुए समय पर रवानगी', gu: 'પસંદ કરેલા સમયે ઉપડવું' },
  'home.card.departTime.a11y': { en: 'Depart at {time}', hi: '{time} पर रवानगी', gu: '{time} એ ઉપડવું' },
  'home.card.earlier.a11y': { en: '15 minutes earlier', hi: '15 मिनट पहले', gu: '15 મિનિટ વહેલું' },
  'home.card.later.a11y': { en: '15 minutes later', hi: '15 मिनट बाद', gu: '15 મિનિટ મોડું' },
  'home.card.find': { en: 'Find my route', hi: 'मेरा रूट खोजें', gu: 'મારો રૂટ શોધો' },
  'home.error.chooseBoth': {
    en: 'Choose both a start and a destination (a station or a bus stop).',
    hi: 'शुरुआत और गंतव्य दोनों चुनें (स्टेशन या बस स्टॉप)।',
    gu: 'શરૂઆત અને ગંતવ્ય બંને પસંદ કરો (સ્ટેશન અથવા બસ સ્ટોપ).',
  },
  'home.error.samePlace': {
    en: 'Your start and destination are the same place.',
    hi: 'आपकी शुरुआत और गंतव्य एक ही जगह हैं।',
    gu: 'તમારી શરૂઆત અને ગંતવ્ય એક જ જગ્યા છે.',
  },
  'home.busStop': { en: 'Bus stop', hi: 'बस स्टॉप', gu: 'બસ સ્ટોપ' },

  // shortcut cards
  'home.shortcut.map.title': { en: 'Metro map', hi: 'मेट्रो नक्शा', gu: 'મેટ્રો નકશો' },
  'home.shortcut.map.subtitle': { en: 'Explore lines & stations', hi: 'लाइन और स्टेशन देखें', gu: 'લાઇન અને સ્ટેશન જુઓ' },
  'home.shortcut.stations.title': { en: 'Stations', hi: 'स्टेशन', gu: 'સ્ટેશન' },
  'home.shortcut.stations.subtitle': { en: 'Search all stations', hi: 'सभी स्टेशन खोजें', gu: 'બધા સ્ટેશન શોધો' },

  // sections
  'home.section.quick': { en: 'Quick routes', hi: 'क्विक रूट', gu: 'ક્વિક રૂટ' },
  'home.section.recent': { en: 'Recent trips', hi: 'हाल की यात्राएँ', gu: 'તાજેતરની મુસાફરીઓ' },
  'home.seeAll': { en: 'See all', hi: 'सभी देखें', gu: 'બધા જુઓ' },
  'home.seeAll.a11y': { en: 'See all {section}', hi: '{section}: सभी देखें', gu: '{section}: બધા જુઓ' },

  // quick routes
  'home.quick.home': { en: 'Home', hi: 'घर', gu: 'ઘર' },
  'home.quick.campus': { en: 'Campus', hi: 'कैंपस', gu: 'કૅમ્પસ' },
  'home.quick.work': { en: 'Work', hi: 'ऑफ़िस', gu: 'ઑફિસ' },
  'home.quick.add': { en: 'Add route', hi: 'रूट जोड़ें', gu: 'રૂટ ઉમેરો' },
  'home.quick.open.a11y': { en: '{label}: {summary}. Tap to open', hi: '{label}: {summary}। खोलने के लिए टैप करें', gu: '{label}: {summary}. ખોલવા માટે ટેપ કરો' },
  'home.quick.add.a11y': {
    en: '{label}: add route. Tap to save the stations chosen above as {label}',
    hi: '{label}: रूट जोड़ें। ऊपर चुने गए स्टेशनों को {label} के रूप में सहेजने के लिए टैप करें',
    gu: '{label}: રૂટ ઉમેરો. ઉપર પસંદ કરેલા સ્ટેશનોને {label} તરીકે સાચવવા માટે ટેપ કરો',
  },
  'home.quick.remove.a11y': { en: 'Remove {label} shortcut', hi: '{label} शॉर्टकट हटाएँ', gu: '{label} શૉર્ટકટ કાઢી નાખો' },
  'home.quick.hint.choose': {
    en: 'To save {label}, choose two different places above, then tap {label} again.',
    hi: '{label} के रूप में सहेजने के लिए ऊपर दो अलग जगहें चुनें, फिर {label} पर दोबारा टैप करें।',
    gu: '{label} તરીકે સાચવવા માટે ઉપર બે અલગ જગ્યાઓ પસંદ કરો, પછી {label} પર ફરી ટેપ કરો.',
  },
  'home.quick.hint.saved': {
    en: 'Saved {from} → {to} as {label}.',
    hi: '{from} → {to} को {label} के रूप में सहेजा गया।',
    gu: '{from} → {to} ને {label} તરીકે સાચવ્યું.',
  },
  'home.quick.hint.removed': { en: '{label} shortcut removed.', hi: '{label} शॉर्टकट हटा दिया गया।', gu: '{label} શૉર્ટકટ કાઢી નાખ્યો.' },

  // recent trips
  'home.trip.busMetro': { en: 'Bus + metro', hi: 'बस + मेट्रो', gu: 'બસ + મેટ્રો' },
  'home.trip.to': { en: 'to {name}', hi: '{name} तक', gu: '{name} સુધી' },
  'home.trip.open.a11y': {
    en: '{from} to {to}, {day}, {metric}. Tap to open',
    hi: '{from} से {to} तक, {day}, {metric}। खोलने के लिए टैप करें',
    gu: '{from} થી {to} સુધી, {day}, {metric}. ખોલવા માટે ટેપ કરો',
  },
  'home.trip.empty.title': { en: 'No recent trips yet', hi: 'अभी कोई हाल की यात्रा नहीं', gu: 'હજુ કોઈ તાજેતરની મુસાફરી નથી' },
  'home.trip.empty.body': {
    en: 'Routes you look up appear here, even offline.',
    hi: 'आप जो रूट देखते हैं वे यहाँ दिखते हैं, ऑफ़लाइन भी।',
    gu: 'તમે જોયેલા રૂટ અહીં દેખાય છે, ઑફલાઇન પણ.',
  },

  // footer
  'home.memory.title': { en: 'Saved routes won’t be kept', hi: 'सहेजे गए रूट रखे नहीं जाएँगे', gu: 'સાચવેલા રૂટ રહેશે નહીં' },
  'home.memory.body': {
    en: 'The on-device database could not be opened, so favourites, quick routes and recent trips last only until you close the app.',
    hi: 'डिवाइस का डेटाबेस नहीं खुल सका, इसलिए पसंदीदा, क्विक रूट और हाल की यात्राएँ ऐप बंद करने तक ही रहेंगी।',
    gu: 'ડિવાઇસનો ડેટાબેઝ ખૂલી શક્યો નહીં, તેથી મનપસંદ, ક્વિક રૂટ અને તાજેતરની મુસાફરીઓ એપ બંધ કરો ત્યાં સુધી જ રહેશે.',
  },
  'home.dataLink.a11y': { en: 'About the data and its sources', hi: 'डेटा और उसके स्रोतों के बारे में', gu: 'ડેટા અને તેના સ્ત્રોતો વિશે' },
  'home.dataLink': {
    en: 'Offline GMRC data · source page updated {date} · Data & sources',
    hi: 'ऑफ़लाइन GMRC डेटा · स्रोत पेज अपडेट: {date} · डेटा और स्रोत',
    gu: 'ઑફલાઇન GMRC ડેટા · સ્ત્રોત પેજ અપડેટ: {date} · ડેટા અને સ્ત્રોત',
  },

  // station picker
  'home.picker.startFrom': { en: 'Start from', hi: 'यहाँ से शुरू करें', gu: 'અહીંથી શરૂ કરો' },
  'home.picker.goTo': { en: 'Go to', hi: 'यहाँ जाएँ', gu: 'અહીં જાઓ' },
  'home.picker.searchAll': { en: 'Search station, bus stop or place', hi: 'स्टेशन, बस स्टॉप या जगह खोजें', gu: 'સ્ટેશન, બસ સ્ટોપ કે જગ્યા શોધો' },
  'home.picker.searchMetro': {
    en: 'Search station or place (e.g. GIFT City)',
    hi: 'स्टेशन या जगह खोजें (जैसे GIFT City)',
    gu: 'સ્ટેશન કે જગ્યા શોધો (જેમ કે GIFT City)',
  },
  'home.picker.searchAll.a11y': { en: 'Search stations and bus stops', hi: 'स्टेशन और बस स्टॉप खोजें', gu: 'સ્ટેશન અને બસ સ્ટોપ શોધો' },
  'home.picker.searchMetro.a11y': { en: 'Search stations', hi: 'स्टेशन खोजें', gu: 'સ્ટેશન શોધો' },
  'home.picker.clear.a11y': { en: 'Clear search', hi: 'खोज साफ़ करें', gu: 'શોધ સાફ કરો' },
  'home.picker.scope.all': { en: 'All', hi: 'सभी', gu: 'બધા' },
  'home.picker.scope.metro': { en: 'Metro', hi: 'मेट्रो', gu: 'મેટ્રો' },
  'home.picker.scope.bus': { en: 'Bus stops', hi: 'बस स्टॉप', gu: 'બસ સ્ટોપ' },
  'home.picker.scope.all.a11y': { en: 'Search everything', hi: 'सब कुछ खोजें', gu: 'બધું શોધો' },
  'home.picker.scope.metro.a11y': { en: 'Search metro stations only', hi: 'सिर्फ़ मेट्रो स्टेशन खोजें', gu: 'ફક્ત મેટ્રો સ્ટેશન શોધો' },
  'home.picker.scope.bus.a11y': { en: 'Search bus stops only', hi: 'सिर्फ़ बस स्टॉप खोजें', gu: 'ફક્ત બસ સ્ટોપ શોધો' },
  'home.picker.loadingBus': { en: 'Loading bus stops…', hi: 'बस स्टॉप लोड हो रहे हैं…', gu: 'બસ સ્ટોપ લોડ થઈ રહ્યા છે…' },
  'home.picker.busError': {
    en: 'Bus stops could not be loaded; metro stations still work.',
    hi: 'बस स्टॉप लोड नहीं हो सके; मेट्रो स्टेशन फिर भी काम करते हैं।',
    gu: 'બસ સ્ટોપ લોડ થઈ શક્યા નહીં; મેટ્રો સ્ટેશન હજુ પણ કામ કરે છે.',
  },
  'home.picker.stop.a11y': { en: 'Bus stop {name}, {agencies}', hi: 'बस स्टॉप {name}, {agencies}', gu: 'બસ સ્ટોપ {name}, {agencies}' },
  'home.picker.stationInterchange.a11y': { en: '{name}, interchange', hi: '{name}, इंटरचेंज', gu: '{name}, ઇન્ટરચેન્જ' },
  'home.picker.interchange': { en: 'Interchange', hi: 'इंटरचेंज', gu: 'ઇન્ટરચેન્જ' },
  'home.picker.alias': { en: 'Also known as “{name}”', hi: '“{name}” के नाम से भी जाना जाता है', gu: '“{name}” તરીકે પણ ઓળખાય છે' },
  'home.picker.landmark': {
    en: 'Nearest station to {place} (from the station name; unverified)',
    hi: '{place} का सबसे नज़दीकी स्टेशन (स्टेशन के नाम से; असत्यापित)',
    gu: '{place} નું સૌથી નજીકનું સ્ટેશન (સ્ટેશનના નામ પરથી; ચકાસ્યા વગરનું)',
  },
  'home.picker.empty.both': { en: 'No matching station or bus stop', hi: 'कोई मिलता-जुलता स्टेशन या बस स्टॉप नहीं', gu: 'કોઈ મળતું સ્ટેશન કે બસ સ્ટોપ નથી' },
  'home.picker.empty.metro': { en: 'No matching station', hi: 'कोई मिलता-जुलता स्टेशन नहीं', gu: 'કોઈ મળતું સ્ટેશન નથી' },
  'home.picker.typeName': { en: 'Type a station or bus stop name.', hi: 'स्टेशन या बस स्टॉप का नाम लिखें।', gu: 'સ્ટેશન અથવા બસ સ્ટોપનું નામ લખો.' },
  'home.picker.tryShorter': {
    en: 'Try a shorter name, or an alternative spelling such as “Amraiwadi” or “PDPU”.',
    hi: 'छोटा नाम आज़माएँ, या “Amraiwadi” या “PDPU” जैसी दूसरी स्पेलिंग आज़माएँ।',
    gu: 'ટૂંકું નામ અજમાવો, અથવા “Amraiwadi” કે “PDPU” જેવી બીજી સ્પેલિંગ અજમાવો.',
  },
});
