import { defineCatalog } from '../catalog';

/** Saved tab (favourites, recent journeys, language, data & storage) and the Data & sources screen. */
export default defineCatalog({
  'saved.title': { en: 'Saved', hi: 'सहेजे गए', gu: 'સાચવેલ' },
  'saved.subtitle': { en: 'Stored on this device. No account needed.', hi: 'इस डिवाइस पर रखा गया है। अकाउंट की ज़रूरत नहीं।', gu: 'આ ડિવાઇસ પર રાખેલ છે. એકાઉન્ટની જરૂર નથી.' },

  'saved.favourites.title': { en: 'Favourite routes', hi: 'पसंदीदा रूट', gu: 'મનપસંદ રૂટ' },
  'saved.favourites.empty.title': { en: 'No favourites yet', hi: 'अभी कोई पसंदीदा नहीं', gu: 'હજુ કોઈ મનપસંદ નથી' },
  'saved.favourites.empty.body': {
    en: 'Open a route and tap the star to save it.',
    hi: 'कोई रूट खोलें और सहेजने के लिए स्टार पर टैप करें।',
    gu: 'કોઈ રૂટ ખોલો અને સાચવવા માટે સ્ટાર પર ટેપ કરો.',
  },
  'saved.favourites.remove': { en: 'Remove favourite', hi: 'पसंदीदा से हटाएँ', gu: 'મનપસંદમાંથી કાઢી નાખો' },

  'saved.recents.title': { en: 'Recent journeys', hi: 'हाल की यात्राएँ', gu: 'તાજેતરની મુસાફરીઓ' },
  'saved.recents.clear': { en: 'Clear history', hi: 'इतिहास साफ़ करें', gu: 'ઇતિહાસ સાફ કરો' },
  'saved.recents.empty.title': { en: 'No recent journeys', hi: 'कोई हाल की यात्रा नहीं', gu: 'કોઈ તાજેતરની મુસાફરી નથી' },
  'saved.recents.empty.body': {
    en: 'Routes you look up appear here.',
    hi: 'आप जो रूट देखते हैं वे यहाँ दिखते हैं।',
    gu: 'તમે જોયેલા રૂટ અહીં દેખાય છે.',
  },

  'saved.row.remove': { en: 'Remove', hi: 'हटाएँ', gu: 'કાઢી નાખો' },
  'saved.row.remove.a11y': { en: '{label} {from} to {to}', hi: '{label}: {from} से {to} तक', gu: '{label}: {from} થી {to} સુધી' },
  'saved.row.open.a11y': { en: 'Open journey from {from} to {to}', hi: '{from} से {to} तक की यात्रा खोलें', gu: '{from} થી {to} સુધીની મુસાફરી ખોલો' },
  'saved.row.reverse.a11y': { en: 'Reverse: {to} to {from}', hi: 'उल्टी दिशा: {to} से {from} तक', gu: 'ઉલટી દિશા: {to} થી {from} સુધી' },

  'saved.storage.title': { en: 'Data & storage', hi: 'डेटा और स्टोरेज', gu: 'ડેટા અને સ્ટોરેજ' },
  'saved.storage.dataset': { en: 'Offline dataset', hi: 'ऑफ़लाइन डेटासेट', gu: 'ઑફલાઇન ડેટાસેટ' },
  'saved.storage.sourceUpdated': { en: 'GMRC source page updated', hi: 'GMRC स्रोत पेज अपडेट हुआ', gu: 'GMRC સ્ત્રોત પેજ અપડેટ થયું' },
  'saved.storage.timetable': { en: 'Timetable effective', hi: 'समय-सारिणी लागू होने की तारीख', gu: 'સમયપત્રક અમલમાં આવ્યાની તારીખ' },
  'saved.storage.storedIn': { en: 'Stored in', hi: 'यहाँ रखा गया है', gu: 'અહીં રાખેલ છે' },
  'saved.storage.sqlite': { en: 'On-device SQLite database', hi: 'डिवाइस पर SQLite डेटाबेस', gu: 'ડિવાઇસ પર SQLite ડેટાબેઝ' },
  'saved.storage.memory': { en: 'Memory only (database unavailable)', hi: 'सिर्फ़ मेमोरी में (डेटाबेस उपलब्ध नहीं)', gu: 'ફક્ત મેમરીમાં (ડેટાબેઝ ઉપલબ્ધ નથી)' },
  'saved.storage.dataButton': { en: 'Data & sources', hi: 'डेटा और स्रोत', gu: 'ડેટા અને સ્ત્રોત' },
  'saved.storage.resetButton': { en: 'Reset local data', hi: 'लोकल डेटा रीसेट करें', gu: 'લોકલ ડેટા રીસેટ કરો' },

  'saved.reset.title': { en: 'Reset local data?', hi: 'लोकल डेटा रीसेट करें?', gu: 'લોકલ ડેટા રીસેટ કરવો?' },
  'saved.reset.body': {
    en: 'This clears your favourites and recent journeys and restores the bundled offline dataset.',
    hi: 'इससे आपके पसंदीदा और हाल की यात्राएँ साफ़ हो जाएँगी और ऐप में दिया गया ऑफ़लाइन डेटासेट वापस आ जाएगा।',
    gu: 'આનાથી તમારા મનપસંદ અને તાજેતરની મુસાફરીઓ સાફ થઈ જશે અને એપમાં આપેલો ઑફલાઇન ડેટાસેટ પાછો આવી જશે.',
  },
  'saved.reset.confirm': { en: 'Reset', hi: 'रीसेट', gu: 'રીસેટ' },
  'saved.reset.done': {
    en: 'Local data reset. Favourites and recent journeys were cleared and the bundled dataset restored.',
    hi: 'लोकल डेटा रीसेट हो गया। पसंदीदा और हाल की यात्राएँ साफ़ कर दी गईं और ऐप में दिया गया डेटासेट वापस आ गया।',
    gu: 'લોકલ ડેટા રીસેટ થઈ ગયો. મનપસંદ અને તાજેતરની મુસાફરીઓ સાફ કરી દીધી અને એપમાં આપેલો ડેટાસેટ પાછો આવી ગયો.',
  },

  // Data & sources screen
  'saved.data.title': { en: 'Data & sources', hi: 'डेटा और स्रोत', gu: 'ડેટા અને સ્ત્રોત' },
  'saved.data.summary': {
    en: 'Dataset {version} · {stations} · GMRC source page updated {date}',
    hi: 'डेटासेट {version} · {stations} · GMRC स्रोत पेज अपडेट: {date}',
    gu: 'ડેટાસેટ {version} · {stations} · GMRC સ્ત્રોત પેજ અપડેટ: {date}',
  },
  'saved.data.statusPill.one': { en: '{n} station: {status}', hi: '{n} स्टेशन: {status}', gu: '{n} સ્ટેશન: {status}' },
  'saved.data.statusPill.other': { en: '{n} stations: {status}', hi: '{n} स्टेशन: {status}', gu: '{n} સ્ટેશન: {status}' },
  'saved.data.status.verified': { en: 'verified', hi: 'सत्यापित', gu: 'ચકાસેલ' },
  'saved.data.status.unverified': { en: 'unverified', hi: 'असत्यापित', gu: 'ચકાસ્યા વગરનું' },
  'saved.data.status.estimated': { en: 'estimated', hi: 'अनुमानित', gu: 'અંદાજિત' },
  'saved.data.status.unknown': { en: 'unknown', hi: 'अज्ञात', gu: 'અજ્ઞાત' },
  'saved.data.sqlitePill': { en: 'SQLite on device', hi: 'डिवाइस पर SQLite', gu: 'ડિવાઇસ પર SQLite' },
  'saved.data.memoryPill': { en: 'Memory only', hi: 'सिर्फ़ मेमोरी', gu: 'ફક્ત મેમરી' },
  'saved.data.problems': { en: 'Data checks found problems', hi: 'डेटा जाँच में समस्याएँ मिलीं', gu: 'ડેટા તપાસમાં સમસ્યાઓ મળી' },
  'saved.data.checksPassed': {
    en: 'Built-in data checks passed: station links, corridor order and provenance are consistent.',
    hi: 'अंतर्निहित डेटा जाँच पास हुई: स्टेशन लिंक, लाइन का क्रम और स्रोत की जानकारी सुसंगत हैं।',
    gu: 'બિલ્ટ-ઇન ડેટા તપાસ પાસ થઈ: સ્ટેશન લિંક, લાઇનનો ક્રમ અને સ્ત્રોતની વિગતો સુસંગત છે.',
  },
  'saved.data.sources': { en: 'Sources', hi: 'स्रोत', gu: 'સ્ત્રોત' },
  'saved.data.checked': { en: 'Checked {date} · {by}', hi: 'जाँचा गया {date} · {by}', gu: 'તપાસ્યું {date} · {by}' },
  'saved.data.limitations': { en: 'Limitations: {text}', hi: 'सीमाएँ: {text}', gu: 'મર્યાદાઓ: {text}' },
  'saved.data.openPage': { en: 'Open page (needs internet)', hi: 'पेज खोलें (इंटरनेट चाहिए)', gu: 'પેજ ખોલો (ઇન્ટરનેટ જોઈએ)' },
  'saved.data.missing.title': { en: 'Not available yet', hi: 'अभी उपलब्ध नहीं', gu: 'હજુ ઉપલબ્ધ નથી' },
  'saved.data.missing.fares': {
    en: 'Fare amounts (GMRC’s Fare Rules page lists no amounts)',
    hi: 'किराये की राशि (GMRC के किराया नियम पेज पर कोई राशि नहीं दी गई है)',
    gu: 'ભાડાની રકમ (GMRC ના ભાડા નિયમ પેજ પર કોઈ રકમ આપેલી નથી)',
  },
  'saved.data.missing.times': {
    en: 'Per-station travel times and journey-time estimates',
    hi: 'हर स्टेशन के बीच का यात्रा समय और यात्रा-समय के अनुमान',
    gu: 'દરેક સ્ટેશન વચ્ચેનો મુસાફરી સમય અને મુસાફરી-સમયના અંદાજ',
  },
  'saved.data.missing.coords': {
    en: 'Station coordinates and walking distances',
    hi: 'स्टेशनों के निर्देशांक (कोऑर्डिनेट) और पैदल दूरी',
    gu: 'સ્ટેશનોના કોઓર્ડિનેટ અને ચાલવાનું અંતર',
  },
  'saved.data.missing.gates': {
    en: 'Entry/exit gates, platform numbers and boarding sides',
    hi: 'एंट्री/एग्ज़िट गेट, प्लेटफ़ॉर्म नंबर और ट्रेन में चढ़ने की तरफ़',
    gu: 'એન્ટ્રી/એક્ઝિટ ગેટ, પ્લેટફોર્મ નંબર અને ટ્રેનમાં ચઢવાની બાજુ',
  },
  'saved.data.missing.lifts': {
    en: 'Station-by-station lift and step-free information',
    hi: 'हर स्टेशन पर लिफ़्ट और बिना सीढ़ी वाली पहुँच की जानकारी',
    gu: 'દરેક સ્ટેશન પર લિફ્ટ અને સીડી વગરની પહોંચની માહિતી',
  },
  'saved.data.missing.type': {
    en: 'Underground vs elevated station type',
    hi: 'स्टेशन भूमिगत है या एलिवेटेड',
    gu: 'સ્ટેશન ભૂગર્ભ છે કે એલિવેટેડ',
  },
  'saved.data.missing.live': {
    en: 'Live train status (MetroMate shows static timetable information only)',
    hi: 'लाइव ट्रेन स्थिति (MetroMate सिर्फ़ निर्धारित समय-सारिणी की जानकारी दिखाता है)',
    gu: 'લાઇવ ટ્રેન સ્થિતિ (MetroMate ફક્ત નિર્ધારિત સમયપત્રકની માહિતી બતાવે છે)',
  },
  'saved.data.missing.note': {
    en: 'These stay blank rather than guessed. They can be added to the dataset files once verified.',
    hi: 'इन्हें अंदाज़े से भरने के बजाय खाली रखा गया है। सत्यापित होने पर इन्हें डेटासेट फ़ाइलों में जोड़ा जा सकता है।',
    gu: 'આને અંદાજથી ભરવાને બદલે ખાલી રાખ્યા છે. ચકાસણી થયા પછી તેમને ડેટાસેટ ફાઇલોમાં ઉમેરી શકાય છે.',
  },
});
