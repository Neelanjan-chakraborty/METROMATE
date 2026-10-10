import { defineCatalog } from '../catalog';

/** The Settings tab: saved routes, preferences, database details, about and credits. */
export default defineCatalog({
  'settings.title': { en: 'Settings', hi: 'सेटिंग्स', gu: 'સેટિંગ્સ' },
  'settings.subtitle': {
    en: 'Saved routes, preferences, data and credits. Stored on this device, no account needed.',
    hi: 'सहेजे रूट, पसंद, डेटा और क्रेडिट। इसी डिवाइस में रखा जाता है, खाते की ज़रूरत नहीं।',
    gu: 'સાચવેલા રૂટ, પસંદગીઓ, ડેટા અને ક્રેડિટ. આ ડિવાઇસમાં જ રહે છે, ખાતાની જરૂર નથી.',
  },

  'settings.saved.title': { en: 'Saved routes', hi: 'सहेजे रूट', gu: 'સાચવેલા રૂટ' },
  'settings.quick.title': { en: 'Quick routes', hi: 'क्विक रूट', gu: 'ક્વિક રૂટ' },
  'settings.quick.empty.title': { en: 'No quick routes', hi: 'कोई क्विक रूट नहीं', gu: 'કોઈ ક્વિક રૂટ નથી' },
  'settings.quick.empty.body': {
    en: 'On the Plan tab, choose two places, then tap Home, Campus or Work to save a shortcut.',
    hi: 'योजना टैब पर दो जगहें चुनें, फिर शॉर्टकट सहेजने के लिए घर, कैंपस या ऑफ़िस पर टैप करें।',
    gu: 'પ્લાન ટૅબ પર બે જગ્યાઓ પસંદ કરો, પછી શૉર્ટકટ સાચવવા ઘર, કૅમ્પસ કે ઑફિસ પર ટૅપ કરો.',
  },
  'settings.quick.remove': { en: 'Remove shortcut', hi: 'शॉर्टकट हटाएँ', gu: 'શૉર્ટકટ કાઢી નાખો' },

  'settings.prefs.title': { en: 'Preferences', hi: 'पसंद', gu: 'પસંદગીઓ' },
  'settings.prefs.positions.title': { en: 'Recorded station positions', hi: 'रिकॉर्ड की गई स्टेशन लोकेशन', gu: 'રેકોર્ડ કરેલા સ્ટેશન લોકેશન' },
  'settings.prefs.positions.count.one': {
    en: '{n} station position is recorded on this phone from your GPS.',
    hi: 'आपके GPS से इस फ़ोन में {n} स्टेशन की लोकेशन रिकॉर्ड है।',
    gu: 'તમારા GPS પરથી આ ફોનમાં {n} સ્ટેશનનું લોકેશન રેકોર્ડ થયેલું છે.',
  },
  'settings.prefs.positions.count.other': {
    en: '{n} station positions are recorded on this phone from your GPS.',
    hi: 'आपके GPS से इस फ़ोन में {n} स्टेशनों की लोकेशन रिकॉर्ड हैं।',
    gu: 'તમારા GPS પરથી આ ફોનમાં {n} સ્ટેશનોનાં લોકેશન રેકોર્ડ થયેલાં છે.',
  },
  'settings.prefs.positions.none': {
    en: 'None yet. You can record a station’s position from the Live tab.',
    hi: 'अभी कोई नहीं। आप लाइव टैब से किसी स्टेशन की लोकेशन रिकॉर्ड कर सकते हैं।',
    gu: 'હજુ કોઈ નથી. તમે લાઇવ ટૅબ પરથી કોઈ સ્ટેશનનું લોકેશન રેકોર્ડ કરી શકો છો.',
  },
  'settings.prefs.positions.clear': { en: 'Clear recorded positions', hi: 'रिकॉर्ड की लोकेशन साफ़ करें', gu: 'રેકોર્ડ કરેલાં લોકેશન સાફ કરો' },

  'settings.db.title': { en: 'Database & storage', hi: 'डेटाबेस और स्टोरेज', gu: 'ડેટાબેઝ અને સ્ટોરેજ' },
  'settings.db.engine': { en: 'Database', hi: 'डेटाबेस', gu: 'ડેટાબેઝ' },
  'settings.db.stations': { en: 'Stations in the dataset', hi: 'डेटासेट में स्टेशन', gu: 'ડેટાસેટમાં સ્ટેશન' },
  'settings.db.favourites': { en: 'Favourite routes saved', hi: 'सहेजे पसंदीदा रूट', gu: 'સાચવેલા મનપસંદ રૂટ' },
  'settings.db.recents': { en: 'Recent journeys kept', hi: 'रखी गई हाल की यात्राएँ', gu: 'રાખેલી તાજેતરની મુસાફરીઓ' },
  'settings.db.quick': { en: 'Quick routes saved', hi: 'सहेजे क्विक रूट', gu: 'સાચવેલા ક્વિક રૂટ' },
  'settings.db.positions': { en: 'Recorded positions', hi: 'रिकॉर्ड की लोकेशन', gu: 'રેકોર્ડ કરેલાં લોકેશન' },
  'settings.db.note': {
    en: 'Everything above lives only on this phone. Resetting clears your saved routes and restores the bundled dataset; your language and recorded positions are kept.',
    hi: 'ऊपर की हर चीज़ सिर्फ़ इसी फ़ोन में रहती है। रीसेट करने पर आपके सहेजे रूट साफ़ हो जाते हैं और बंडल किया हुआ डेटासेट वापस आ जाता है; आपकी भाषा और रिकॉर्ड की लोकेशन बनी रहती हैं।',
    gu: 'ઉપરની દરેક વસ્તુ ફક્ત આ ફોનમાં જ રહે છે. રીસેટ કરવાથી તમારા સાચવેલા રૂટ સાફ થાય છે અને બંડલ કરેલો ડેટાસેટ પાછો આવે છે; તમારી ભાષા અને રેકોર્ડ કરેલાં લોકેશન જળવાઈ રહે છે.',
  },

  'settings.about.title': { en: 'About MetroMate', hi: 'MetroMate के बारे में', gu: 'MetroMate વિશે' },
  'settings.about.tagline': {
    en: 'An offline companion for the Ahmedabad–Gandhinagar Metro, with BRTS, AMTS and Gandhinagar buses.',
    hi: 'अहमदाबाद–गांधीनगर मेट्रो का ऑफ़लाइन साथी, BRTS, AMTS और गांधीनगर बसों के साथ।',
    gu: 'અમદાવાદ–ગાંધીનગર મેટ્રોનો ઑફલાઇન સાથી, BRTS, AMTS અને ગાંધીનગર બસો સાથે.',
  },
  'settings.about.version': { en: 'App version', hi: 'ऐप संस्करण', gu: 'એપ આવૃત્તિ' },
  'settings.about.privacy': {
    en: 'Everything works offline. Your location is used only on this phone while you track a journey, and is never uploaded.',
    hi: 'सब कुछ ऑफ़लाइन चलता है। आपकी लोकेशन सिर्फ़ इसी फ़ोन पर, यात्रा ट्रैक करते समय इस्तेमाल होती है, और कभी अपलोड नहीं की जाती।',
    gu: 'બધું ઑફલાઇન ચાલે છે. તમારું લોકેશન ફક્ત આ ફોન પર, મુસાફરી ટ્રૅક કરતી વખતે વપરાય છે, અને ક્યારેય અપલોડ થતું નથી.',
  },
  'settings.about.independent': {
    en: 'MetroMate is an independent project. It is not affiliated with GMRC, AMTS, Janmarg (BRTS) or GTSL.',
    hi: 'MetroMate एक स्वतंत्र प्रोजेक्ट है। इसका GMRC, AMTS, Janmarg (BRTS) या GTSL से कोई संबंध नहीं है।',
    gu: 'MetroMate એક સ્વતંત્ર પ્રોજેક્ટ છે. તેનો GMRC, AMTS, Janmarg (BRTS) કે GTSL સાથે કોઈ સંબંધ નથી.',
  },

  'settings.credits.title': { en: 'Credits', hi: 'क्रेडिट', gu: 'ક્રેડિટ' },
  'settings.credits.love': { en: 'Made with Love by Neelanjan', hi: 'Neelanjan द्वारा प्यार से बनाया गया', gu: 'Neelanjan દ્વારા પ્રેમથી બનાવેલ' },
  'settings.credits.event': {
    en: 'for Road to DevFest : Metro Hacks hackathon',
    hi: 'Road to DevFest : Metro Hacks हैकाथॉन के लिए',
    gu: 'Road to DevFest : Metro Hacks હેકાથોન માટે',
  },
  'settings.credits.love.a11y': {
    en: 'Made with love by Neelanjan for the Road to DevFest : Metro Hacks hackathon',
    hi: 'Neelanjan द्वारा Road to DevFest : Metro Hacks हैकाथॉन के लिए प्यार से बनाया गया',
    gu: 'Neelanjan દ્વારા Road to DevFest : Metro Hacks હેકાથોન માટે પ્રેમથી બનાવેલ',
  },
  'settings.credits.thanks': { en: 'Data and thanks', hi: 'डेटा और आभार', gu: 'ડેટા અને આભાર' },
  'settings.credits.gmrc': {
    en: 'Metro network, timings, gates and lifts: public information from Gujarat Metro Rail Corporation (GMRC).',
    hi: 'मेट्रो नेटवर्क, समय, गेट और लिफ़्ट: गुजरात मेट्रो रेल कॉर्पोरेशन (GMRC) की सार्वजनिक जानकारी।',
    gu: 'મેટ્રો નેટવર્ક, સમય, ગેટ અને લિફ્ટ: ગુજરાત મેટ્રો રેલ કૉર્પોરેશન (GMRC) ની જાહેર માહિતી.',
  },
  'settings.credits.gtfs': {
    en: 'Bus timetable: an unofficial GTFS feed compiled by BLRTransit (AMTS, BRTS and Gandhinagar buses).',
    hi: 'बस समय-सारिणी: BLRTransit द्वारा तैयार किया गया अनौपचारिक GTFS फ़ीड (AMTS, BRTS और गांधीनगर बसें)।',
    gu: 'બસ સમયપત્રક: BLRTransit દ્વારા તૈયાર કરેલી બિનસત્તાવાર GTFS ફીડ (AMTS, BRTS અને ગાંધીનગર બસો).',
  },
  'settings.credits.photos': {
    en: 'Station photos: Wikimedia Commons contributors, credited on each station page.',
    hi: 'स्टेशन की तस्वीरें: Wikimedia Commons के योगदानकर्ता, हर स्टेशन पेज पर क्रेडिट के साथ।',
    gu: 'સ્ટેશનના ફોટા: Wikimedia Commons ના યોગદાનકર્તાઓ, દરેક સ્ટેશન પેજ પર ક્રેડિટ સાથે.',
  },
  'settings.credits.tools': {
    en: 'Icons by Lucide. Welcome guide headings in Manrope (SIL Open Font License).',
    hi: 'आइकन Lucide के हैं। स्वागत गाइड के शीर्षक Manrope (SIL Open Font License) में हैं।',
    gu: 'આઇકન Lucide ના છે. સ્વાગત માર્ગદર્શિકાના શીર્ષકો Manrope (SIL Open Font License) માં છે.',
  },
});
