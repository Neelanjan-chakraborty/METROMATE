import { defineCatalog } from '../catalog';

/** Map tab: the metro schematic, the Bus & metro map and its controls. */
export default defineCatalog({
  'map.title': { en: 'Network map', hi: 'नेटवर्क नक्शा', gu: 'નેટવર્ક નકશો' },
  'map.sub.bus': {
    en: 'Bus routes and the metro on a map of the area. No internet needed.',
    hi: 'इलाके के नक्शे पर बस रूट और मेट्रो। इंटरनेट की ज़रूरत नहीं।',
    gu: 'વિસ્તારના નકશા પર બસ રૂટ અને મેટ્રો. ઇન્ટરનેટની જરૂર નથી.',
  },
  'map.sub.metro': {
    en: 'Original schematic, stored on your device. Tap a station for details.',
    hi: 'हमारा अपना बनाया योजना-चित्र, आपके डिवाइस में सहेजा हुआ। जानकारी के लिए स्टेशन पर टैप करें।',
    gu: 'અમારો પોતાનો બનાવેલો યોજના-નકશો, તમારા ડિવાઇસમાં સાચવેલો. વિગત માટે સ્ટેશન પર ટૅપ કરો.',
  },
  'map.seg.metro': { en: 'Metro schematic', hi: 'मेट्रो का योजना-चित्र', gu: 'મેટ્રોનો યોજના-નકશો' },
  'map.seg.bus': { en: 'Bus & metro', hi: 'बस और मेट्रो', gu: 'બસ અને મેટ્રો' },

  'map.legend.interchange': { en: 'Interchange', hi: 'इंटरचेंज', gu: 'ઇન્ટરચેન્જ' },
  'map.legend.start': { en: 'A start', hi: 'A शुरुआत', gu: 'A શરૂઆત' },
  'map.legend.destination': { en: 'B destination', hi: 'B गंतव्य', gu: 'B ગંતવ્ય' },
  'map.journey.banner': { en: 'Journey: {from} → {to}', hi: 'यात्रा: {from} → {to}', gu: 'મુસાફરી: {from} → {to}' },
  'map.journey.clear': { en: 'Clear highlighted journey', hi: 'हाइलाइट की गई यात्रा हटाएँ', gu: 'હાઇલાઇટ કરેલી મુસાફરી હટાવો' },
  'map.zoomIn': { en: 'Zoom in', hi: 'ज़ूम इन', gu: 'ઝૂમ ઇન' },
  'map.zoomOut': { en: 'Zoom out', hi: 'ज़ूम आउट', gu: 'ઝૂમ આઉટ' },
  'map.zoomReset': { en: 'Reset zoom', hi: 'ज़ूम रीसेट करें', gu: 'ઝૂમ રીસેટ કરો' },

  'map.metroMap.a11y': {
    en: 'Schematic map of the Ahmedabad–Gandhinagar metro network',
    hi: 'Ahmedabad–Gandhinagar मेट्रो नेटवर्क का योजना-चित्र',
    gu: 'Ahmedabad–Gandhinagar મેટ્રો નેટવર્કનો યોજના-નકશો',
  },
  'map.busMap.a11y': {
    en: 'Map of bus routes and the metro around Ahmedabad and Gandhinagar. Tap a line or a stop for details.',
    hi: 'Ahmedabad और Gandhinagar के आसपास बस रूट और मेट्रो का नक्शा। जानकारी के लिए किसी लाइन या स्टॉप पर टैप करें।',
    gu: 'Ahmedabad અને Gandhinagar ની આસપાસ બસ રૂટ અને મેટ્રોનો નકશો. વિગત માટે કોઈ લાઇન કે સ્ટોપ પર ટૅપ કરો.',
  },
  'map.scale': { en: '10 km', hi: '10 किमी', gu: '10 કિમી' },

  // ---- Bus & metro map
  'map.bus.error.title': { en: 'Bus data could not be loaded', hi: 'बस का डेटा लोड नहीं हो सका', gu: 'બસનો ડેટા લોડ થઈ શક્યો નથી' },
  'map.bus.error.body': {
    en: 'The metro schematic still works. Restart the app and try again.',
    hi: 'मेट्रो का योजना-चित्र अब भी चलता है। ऐप फिर से शुरू करें और दोबारा कोशिश करें।',
    gu: 'મેટ્રોનો યોજના-નકશો હજુ ચાલે છે. એપ ફરી શરૂ કરો અને ફરી પ્રયાસ કરો.',
  },
  'map.bus.loading.title': { en: 'Loading bus routes…', hi: 'बस रूट लोड हो रहे हैं…', gu: 'બસ રૂટ લોડ થઈ રહ્યા છે…' },
  'map.bus.loading.body': { en: 'Reading the timetable stored on your phone.', hi: 'आपके फ़ोन में सहेजी समय-सारिणी पढ़ी जा रही है।', gu: 'તમારા ફોનમાં સાચવેલું સમયપત્રક વાંચી રહ્યા છીએ.' },
  'map.chip.a11y': { en: 'Show {name} routes', hi: '{name} रूट दिखाएँ', gu: '{name} રૂટ બતાવો' },
  'map.journey.none': {
    en: 'No journey found for these places, so there is nothing to highlight.',
    hi: 'इन जगहों के लिए कोई यात्रा नहीं मिली, इसलिए हाइलाइट करने को कुछ नहीं है।',
    gu: 'આ જગ્યાઓ માટે કોઈ મુસાફરી મળી નથી, એટલે હાઇલાઇટ કરવા માટે કંઈ નથી.',
  },
  'map.journey.scheduled': {
    en: '{from} → {to} · {dep}–{arr} · scheduled',
    hi: '{from} → {to} · {dep}–{arr} · निर्धारित',
    gu: '{from} → {to} · {dep}–{arr} · નિર્ધારિત',
  },
  'map.legend.road': { en: 'on a road shape', hi: 'सड़क के आकार के अनुसार', gu: 'રસ્તાના આકાર મુજબ' },
  'map.legend.straight': {
    en: 'straight between stops (no road shape in the feed)',
    hi: 'स्टॉप के बीच सीधी रेखा (फ़ीड में सड़क का आकार नहीं है)',
    gu: 'સ્ટોપ વચ્ચે સીધી રેખા (ફીડમાં રસ્તાનો આકાર નથી)',
  },
  'map.legend.metroNote': {
    en: 'Metro lines run through estimated station pins, so treat them as approximate. Bus times are scheduled, not live.',
    hi: 'मेट्रो लाइनें अनुमानित स्टेशन पिन से होकर जाती हैं, इसलिए इन्हें लगभग ही मानें। बस के समय निर्धारित हैं, लाइव नहीं।',
    gu: 'મેટ્રો લાઇનો અંદાજિત સ્ટેશન પિનમાંથી પસાર થાય છે, એટલે તેને આશરે જ ગણો. બસના સમય નિર્ધારિત છે, લાઇવ નથી.',
  },
  'map.pick.metroStation': { en: 'Metro station', hi: 'मेट्रो स्टेशन', gu: 'મેટ્રો સ્ટેશન' },
  'map.pick.metroSub': { en: 'Metro station · pin position is estimated', hi: 'मेट्रो स्टेशन · पिन की स्थिति अनुमानित है', gu: 'મેટ્રો સ્ટેશન · પિનની જગ્યા અંદાજિત છે' },
  'map.pick.routeSub': { en: '{ends} · scheduled', hi: '{ends} · निर्धारित', gu: '{ends} · નિર્ધારિત' },
  'map.pick.a11y': { en: '{title}. {sub}. Open details', hi: '{title}। {sub}। जानकारी खोलें', gu: '{title}. {sub}. વિગત ખોલો' },
});
