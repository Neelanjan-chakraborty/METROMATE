import { defineCatalog } from '../catalog';

/** The station detail page: hero, actions, line cards, neighbours, gates, amenities, nearby, buses, data notes. */
export default defineCatalog({
  // ---- not found
  'station.notFound.title': { en: 'Station not found', hi: 'स्टेशन नहीं मिला', gu: 'સ્ટેશન મળ્યું નથી' },
  'station.notFound.body': { en: 'This station is not in the offline data.', hi: 'यह स्टेशन ऑफ़लाइन डेटा में नहीं है।', gu: 'આ સ્ટેશન ઑફલાઇન ડેટામાં નથી.' },
  'station.notFound.back': { en: 'Back to stations', hi: 'स्टेशनों पर वापस', gu: 'સ્ટેશનો પર પાછા' },

  // ---- station type and line names
  'station.type.underground': { en: 'Underground', hi: 'भूमिगत', gu: 'ભૂગર્ભ' },
  'station.type.elevated': { en: 'Elevated', hi: 'एलिवेटेड', gu: 'એલિવેટેડ' },
  'station.line.named': { en: '{name} Line', hi: '{name} लाइन', gu: '{name} લાઇન' },
  'station.line.phase': { en: 'Phase {phase}', hi: 'फेज़ {phase}', gu: 'ફેઝ {phase}' },
  'station.line.a11y': { en: '{name}, phase {phase}. Between {ends}', hi: '{name}, फेज़ {phase}। {ends} के बीच', gu: '{name}, ફેઝ {phase}. {ends} વચ્ચે' },
  'station.line.a11yTyped': { en: '{name}, phase {phase}, {type}. Between {ends}', hi: '{name}, फेज़ {phase}, {type}। {ends} के बीच', gu: '{name}, ફેઝ {phase}, {type}. {ends} વચ્ચે' },

  // ---- notices
  'station.interchange.title': { en: 'Changing trains here', hi: 'यहाँ ट्रेन बदलें', gu: 'અહીં ટ્રેન બદલો' },
  'station.serviceNote.title': { en: 'Check before you go', hi: 'जाने से पहले जाँच लें', gu: 'જતાં પહેલાં તપાસી લો' },
  'station.gps.title': { en: 'No GPS underground', hi: 'भूमिगत में GPS नहीं', gu: 'ભૂગર્ભમાં GPS નથી' },
  'station.gps.body': {
    en: 'GPS does not work underground, so Live tracking will show “signal lost” here.',
    hi: 'भूमिगत में GPS काम नहीं करता, इसलिए यहाँ लाइव ट्रैकिंग में “सिग्नल खो गया” दिखेगा।',
    gu: 'ભૂગર્ભમાં GPS કામ કરતું નથી, તેથી અહીં લાઇવ ટ્રેકિંગમાં “સિગ્નલ ખોવાયો” દેખાશે.',
  },

  // ---- hero
  'station.hero.back': { en: 'Back', hi: 'वापस', gu: 'પાછા' },
  'station.hero.maps': { en: 'Open in Maps (needs internet)', hi: 'मैप्स में खोलें (इंटरनेट चाहिए)', gu: 'મૅપ્સમાં ખોલો (ઇન્ટરનેટ જોઈએ)' },
  'station.hero.interchange': { en: 'Interchange station', hi: 'इंटरचेंज स्टेशन', gu: 'ઇન્ટરચેન્જ સ્ટેશન' },
  'station.hero.running': { en: 'Trains running', hi: 'ट्रेनें चल रही हैं', gu: 'ટ્રેનો ચાલુ છે' },
  'station.hero.notStarted': { en: 'Not started yet', hi: 'अभी शुरू नहीं हुआ', gu: 'હજુ શરૂ થયું નથી' },
  'station.hero.ended': { en: 'Service ended', hi: 'सेवा समाप्त', gu: 'સેવા પૂરી થઈ' },
  'station.hero.unknown': { en: 'Timings unknown', hi: 'समय पता नहीं', gu: 'સમય ખબર નથી' },
  'station.hero.hoursA11y': { en: 'Line hours {first} to {last}', hi: 'लाइन का समय {first} से {last} तक', gu: 'લાઇનનો સમય {first} થી {last} સુધી' },
  'station.hero.photoA11y': {
    en: 'Photo credit: {credit}, {license}. Opens Wikimedia Commons',
    hi: 'फ़ोटो क्रेडिट: {credit}, {license}। Wikimedia Commons खुलेगा',
    gu: 'ફોટો ક્રેડિટ: {credit}, {license}. Wikimedia Commons ખુલશે',
  },
  'station.hero.illustrationA11y': { en: 'Illustration, not a photo of this station', hi: 'चित्र, इस स्टेशन की असली फ़ोटो नहीं', gu: 'ચિત્ર, આ સ્ટેશનનો અસલી ફોટો નથી' },
  'station.hero.photo': { en: 'Photo: {credit} · {license}', hi: 'फ़ोटो: {credit} · {license}', gu: 'ફોટો: {credit} · {license}' },
  'station.hero.illustration': { en: 'Illustration', hi: 'चित्र', gu: 'ચિત્ર' },

  // ---- actions
  'station.action.start': { en: 'Start here', hi: 'यहाँ से शुरू करें', gu: 'અહીંથી શરૂ કરો' },
  'station.action.startSub': { en: 'Plan a route', hi: 'रूट प्लान करें', gu: 'રૂટ પ્લાન કરો' },
  'station.action.startA11y': { en: 'Start from here. Plan a route', hi: 'यहाँ से शुरू करें। रूट प्लान करें', gu: 'અહીંથી શરૂ કરો. રૂટ પ્લાન કરો' },
  'station.action.go': { en: 'Go here', hi: 'यहाँ जाएँ', gu: 'અહીં જાઓ' },
  'station.action.goSub': { en: 'Route to here', hi: 'यहाँ का रूट', gu: 'અહીંનો રૂટ' },
  'station.action.goA11y': { en: 'Go here. Route to this station', hi: 'यहाँ जाएँ। इस स्टेशन तक का रूट', gu: 'અહીં જાઓ. આ સ્ટેશન સુધીનો રૂટ' },

  // ---- neighbours strip
  'station.strip.title': { en: 'Next & nearby', hi: 'अगले और पास के स्टेशन', gu: 'આગળના અને નજીકના સ્ટેશન' },
  'station.strip.lineMap': { en: 'Line map', hi: 'लाइन नक्शा', gu: 'લાઇન નકશો' },
  'station.strip.min': { en: '~{m} min', hi: '~{m} मिनट', gu: '~{m} મિનિટ' },
  'station.strip.nodeA11y': { en: '{name}, towards {towards}. Open station', hi: '{name}, {towards} की ओर। स्टेशन खोलें', gu: '{name}, {towards} તરફ. સ્ટેશન ખોલો' },
  'station.strip.nodeA11yMin': {
    en: '{name}, about {minutes}, towards {towards}. Open station',
    hi: '{name}, लगभग {minutes}, {towards} की ओर। स्टेशन खोलें',
    gu: '{name}, લગભગ {minutes}, {towards} તરફ. સ્ટેશન ખોલો',
  },
  'station.strip.here': { en: 'YOU’RE HERE', hi: 'आप यहाँ हैं', gu: 'તમે અહીં છો' },
  'station.strip.hereA11y': { en: '{name}, you are viewing this station', hi: '{name}, आप यही स्टेशन देख रहे हैं', gu: '{name}, તમે આ જ સ્ટેશન જોઈ રહ્યા છો' },
  'station.strip.endA11y': { en: 'End of the line in this direction', hi: 'इस दिशा में लाइन यहीं खत्म होती है', gu: 'આ દિશામાં લાઇન અહીં પૂરી થાય છે' },
  'station.strip.end': { en: 'End of line', hi: 'लाइन का अंत', gu: 'લાઇનનો અંત' },
  'station.strip.towards': { en: 'Towards {name}', hi: '{name} की ओर', gu: '{name} તરફ' },
  'station.minutes.one': { en: '{n} minute', hi: '{n} मिनट', gu: '{n} મિનિટ' },
  'station.minutes.other': { en: '{n} minutes', hi: '{n} मिनट', gu: '{n} મિનિટ' },

  // ---- gates and platforms
  'station.gates.title': { en: 'Gates & platforms', hi: 'गेट और प्लेटफ़ॉर्म', gu: 'ગેટ અને પ્લેટફોર્મ' },
  'station.gates.notListed': { en: 'GMRC’s gate table does not list this station.', hi: 'GMRC की गेट तालिका में यह स्टेशन नहीं है।', gu: 'GMRC ના ગેટ કોષ્ટકમાં આ સ્ટેશન નથી.' },
  'station.gates.none': {
    en: 'No gate information is published for this station.',
    hi: 'इस स्टेशन के लिए गेट की जानकारी प्रकाशित नहीं है।',
    gu: 'આ સ્ટેશન માટે ગેટની માહિતી પ્રકાશિત નથી.',
  },
  'station.gates.gate': { en: 'Gate {n}', hi: 'गेट {n}', gu: 'ગેટ {n}' },
  'station.gates.lift': { en: 'Lift {nums}', hi: 'लिफ़्ट {nums}', gu: 'લિફ્ટ {nums}' },
  'station.gates.link': { en: '{kind} link (unverified)', hi: '{kind} लिंक (असत्यापित)', gu: '{kind} લિંક (ચકાસ્યા વગરની)' },
  'station.gates.noLiftLink': {
    en: 'No lift or link is listed for this gate.',
    hi: 'इस गेट के लिए कोई लिफ़्ट या लिंक सूचीबद्ध नहीं है।',
    gu: 'આ ગેટ માટે કોઈ લિફ્ટ કે લિંક નોંધાયેલી નથી.',
  },
  'station.gates.towards': { en: 'TRAINS STOP TOWARDS', hi: 'इन दिशाओं की ट्रेनें रुकती हैं', gu: 'આ દિશાઓની ટ્રેનો અહીં ઊભી રહે છે' },
  'station.gates.caption': {
    en: 'Illustration, not the real layout. GMRC publishes gate numbers but not which street each gate faces, nor platform numbers; follow the signs.',
    hi: 'यह चित्र असली लेआउट नहीं है। GMRC गेट के नंबर बताता है, पर यह नहीं कि हर गेट किस सड़क की ओर खुलता है, और प्लेटफ़ॉर्म नंबर भी नहीं बताता; साइन बोर्ड देखकर चलें।',
    gu: 'આ ચિત્ર અસલી લેઆઉટ નથી. GMRC ગેટના નંબર આપે છે, પણ દરેક ગેટ કઈ શેરી તરફ ખુલે છે તે કે પ્લેટફોર્મ નંબર આપતું નથી; સાઇન બોર્ડ જોઈને ચાલો.',
  },
  'station.kind.rail': { en: 'Rail', hi: 'रेल', gu: 'રેલ' },
  'station.kind.bus': { en: 'Bus', hi: 'बस', gu: 'બસ' },

  // ---- gate illustration
  'station.scene.a11y': { en: 'Illustration of Gate {gate}. Not the real layout.', hi: 'गेट {gate} का चित्र। असली लेआउट नहीं है।', gu: 'ગેટ {gate} નું ચિત્ર. અસલી લેઆઉટ નથી.' },
  'station.scene.a11yLift': {
    en: 'Illustration of Gate {gate} with lift {lifts}. Not the real layout.',
    hi: 'गेट {gate} का चित्र, लिफ़्ट {lifts} के साथ। असली लेआउट नहीं है।',
    gu: 'ગેટ {gate} નું ચિત્ર, લિફ્ટ {lifts} સાથે. અસલી લેઆઉટ નથી.',
  },
  'station.scene.and': { en: 'and', hi: 'और', gu: 'અને' },
  'station.scene.link': { en: '{kind} link ?', hi: '{kind} लिंक ?', gu: '{kind} લિંક ?' },

  // ---- amenities
  'station.amenities.title': { en: 'Amenities', hi: 'सुविधाएँ', gu: 'સુવિધાઓ' },
  'station.amenities.here': { en: 'AT THIS STATION', hi: 'इस स्टेशन पर', gu: 'આ સ્ટેશન પર' },
  'station.amenities.network': { en: 'ACROSS THE NETWORK', hi: 'पूरे नेटवर्क में', gu: 'આખા નેટવર્કમાં' },
  'station.amenities.note': {
    en: 'Faded icons are listed by GMRC for the whole network; they are not confirmed for this station.',
    hi: 'हल्के आइकन GMRC ने पूरे नेटवर्क के लिए बताए हैं; इस स्टेशन के लिए इनकी पुष्टि नहीं है।',
    gu: 'ઝાંખા આઇકન GMRC એ આખા નેટવર્ક માટે જણાવ્યા છે; આ સ્ટેશન માટે તેની પુષ્ટિ નથી.',
  },
  'station.amenities.faded': {
    en: 'listed network-wide, not confirmed for this station',
    hi: 'पूरे नेटवर्क के लिए सूचीबद्ध, इस स्टेशन के लिए पुष्टि नहीं',
    gu: 'આખા નેટવર્ક માટે નોંધાયેલ, આ સ્ટેશન માટે પુષ્ટિ નથી',
  },
  'station.amenity.lift': { en: 'Lift', hi: 'लिफ़्ट', gu: 'લિફ્ટ' },
  'station.amenity.lifts': { en: 'Lifts', hi: 'लिफ़्ट', gu: 'લિફ્ટ' },
  'station.amenity.ramp': { en: 'Ramp', hi: 'रैंप', gu: 'રૅમ્પ' },
  'station.amenity.wheelchairRamp': { en: 'Wheelchair ramp', hi: 'व्हीलचेयर रैंप', gu: 'વ્હીલચેર રૅમ્પ' },
  'station.amenity.gate': { en: 'Gate', hi: 'गेट', gu: 'ગેટ' },
  'station.amenity.gates': { en: 'Gates', hi: 'गेट', gu: 'ગેટ' },
  'station.amenity.escalator': { en: 'Escalators', hi: 'एस्केलेटर', gu: 'એસ્કેલેટર' },
  'station.amenity.signage': { en: 'Signage', hi: 'साइन बोर्ड', gu: 'સાઇન બોર્ડ' },
  'station.amenity.card': { en: 'Smart card', hi: 'स्मार्ट कार्ड', gu: 'સ્માર્ટ કાર્ડ' },
  'station.amenity.tickets': { en: 'Ticket machines', hi: 'टिकट मशीन', gu: 'ટિકિટ મશીન' },
  'station.amenity.water': { en: 'Drinking water', hi: 'पीने का पानी', gu: 'પીવાનું પાણી' },
  'station.amenity.firstaid': { en: 'First aid', hi: 'प्राथमिक उपचार', gu: 'પ્રાથમિક સારવાર' },
  'station.amenity.seating': { en: 'Seating', hi: 'बैठने की जगह', gu: 'બેસવાની જગ્યા' },
  'station.amenity.display': { en: 'Info displays', hi: 'सूचना डिस्प्ले', gu: 'માહિતી ડિસ્પ્લે' },
  'station.amenity.toilets': { en: 'Washrooms', hi: 'वॉशरूम', gu: 'વૉશરૂમ' },
  'station.amenity.wideGates': { en: 'Wide gates', hi: 'चौड़े गेट', gu: 'પહોળા ગેટ' },
  'station.amenity.tactile': { en: 'Tactile path', hi: 'स्पर्श पथ', gu: 'સ્પર્શ પથ' },
  'station.amenity.wheelchair': { en: 'Wheelchair', hi: 'व्हीलचेयर', gu: 'વ્હીલચેર' },
  'station.amenity.braille': { en: 'Braille lifts', hi: 'ब्रेल लिफ़्ट', gu: 'બ્રેઇલ લિફ્ટ' },
  'station.amenity.trainSpace': { en: 'Train space', hi: 'ट्रेन में जगह', gu: 'ટ્રેનમાં જગ્યા' },
  'station.amenity.accToilets': { en: 'Accessible toilets', hi: 'दिव्यांग वॉशरूम', gu: 'દિવ્યાંગ વૉશરૂમ' },
  'station.amenity.lowCounter': { en: 'Low counter', hi: 'नीचा काउंटर', gu: 'નીચું કાઉન્ટર' },

  // ---- nearby places
  'station.nearby.title': { en: 'Nearby', hi: 'आसपास', gu: 'આસપાસ' },
  'station.nearby.maps': { en: 'Maps', hi: 'मैप्स', gu: 'મૅપ્સ' },
  'station.nearby.distance': { en: 'Distance not verified', hi: 'दूरी सत्यापित नहीं', gu: 'અંતર ચકાસેલ નથી' },
  'station.nearby.unverified': { en: 'Unverified', hi: 'असत्यापित', gu: 'ચકાસ્યા વગરનું' },
  'station.nearby.placeA11y': {
    en: '{name}. Near this station, from the station name; distance not verified',
    hi: '{name}। इस स्टेशन के पास, स्टेशन के नाम के आधार पर; दूरी सत्यापित नहीं',
    gu: '{name}. આ સ્ટેશન પાસે, સ્ટેશનના નામ પરથી; અંતર ચકાસેલ નથી',
  },
  'station.nearby.linkA11y': {
    en: '{note}. From an unofficial map, unverified',
    hi: '{note}। एक अनौपचारिक नक्शे से, असत्यापित',
    gu: '{note}. બિનસત્તાવાર નકશા પરથી, ચકાસ્યા વગરનું',
  },
  'station.nearby.caption': {
    en: 'Dashed = not verified. “Maps” opens your maps app (needs internet).',
    hi: 'बिंदीदार किनारा = सत्यापित नहीं। “मैप्स” आपका मैप ऐप खोलता है (इंटरनेट चाहिए)।',
    gu: 'ટપકાંવાળી કિનાર = ચકાસેલ નથી. “મૅપ્સ” તમારી મૅપ એપ ખોલે છે (ઇન્ટરનેટ જોઈએ).',
  },

  // ---- buses nearby
  'station.buses.title': { en: 'Buses nearby', hi: 'पास की बसें', gu: 'નજીકની બસો' },
  'station.buses.loading': { en: 'Loading bus stops…', hi: 'बस स्टॉप लोड हो रहे हैं…', gu: 'બસ સ્ટોપ લોડ થઈ રહ્યા છે…' },
  'station.buses.none': {
    en: 'The bus timetable lists no stop within 600 m of this station.',
    hi: 'बस समय-सारिणी में इस स्टेशन से 600 मी. के भीतर कोई स्टॉप नहीं है।',
    gu: 'બસ સમયપત્રકમાં આ સ્ટેશનથી 600 મી. ની અંદર કોઈ સ્ટોપ નથી.',
  },
  'station.buses.a11y': {
    en: '{name}, about {minutes} walk. Routes {routes}. Plan a journey from this stop',
    hi: '{name}, पैदल लगभग {minutes}। रूट {routes}। इस स्टॉप से यात्रा प्लान करें',
    gu: '{name}, ચાલીને લગભગ {minutes}. રૂટ {routes}. આ સ્ટોપથી મુસાફરી પ્લાન કરો',
  },
  'station.buses.walk': { en: '~{min} min walk · ~{m} m', hi: '~{min} मिनट पैदल · ~{m} मी.', gu: '~{min} મિનિટ ચાલીને · ~{m} મી.' },
  'station.buses.metroName': { en: '“Metro” in the stop name', hi: 'स्टॉप के नाम में “Metro”', gu: 'સ્ટોપના નામમાં “Metro”' },
  'station.buses.more': { en: '+{n} more', hi: '+{n} और', gu: '+{n} વધુ' },
  'station.buses.caption': {
    en: 'From the bus timetable feed (unofficial, scheduled). Distances use the station’s approximate pin; red = BRTS, blue = city bus. Tap a stop to plan from it.',
    hi: 'बस समय-सारिणी फ़ीड से (अनौपचारिक, निर्धारित)। दूरी स्टेशन के अनुमानित पिन से है; लाल = BRTS, नीला = शहर की बस। किसी स्टॉप पर टैप करके वहाँ से प्लान करें।',
    gu: 'બસ સમયપત્રક ફીડ પરથી (બિનસત્તાવાર, નિર્ધારિત). અંતર સ્ટેશનના અંદાજિત પિન પરથી છે; લાલ = BRTS, વાદળી = શહેરની બસ. કોઈ સ્ટોપ પર ટૅપ કરીને ત્યાંથી પ્લાન કરો.',
  },

  // ---- about this data
  'station.about.title': { en: 'About this data', hi: 'इस डेटा के बारे में', gu: 'આ ડેટા વિશે' },
  'station.about.sub': { en: 'Source, position, how recent', hi: 'स्रोत, स्थान, कितना ताज़ा', gu: 'સ્ત્રોત, સ્થાન, કેટલું તાજું' },
  'station.about.source': { en: 'Source', hi: 'स्रोत', gu: 'સ્ત્રોત' },
  'station.about.checked': { en: 'Checked', hi: 'जाँच की तारीख़', gu: 'તપાસની તારીખ' },
  'station.about.checkedValue': {
    en: '{date} · GMRC page updated {pageDate}',
    hi: '{date} · GMRC पेज अपडेट हुआ {pageDate}',
    gu: '{date} · GMRC પેજ અપડેટ થયું {pageDate}',
  },
  'station.about.position': { en: 'Position', hi: 'स्थान', gu: 'સ્થાન' },
  'station.about.positionValue': {
    en: '{coords} · {status}, from an unofficial map pin, so it may be off by a block',
    hi: '{coords} · {status}; अनौपचारिक मैप पिन से लिया गया है, इसलिए एक ब्लॉक का फ़र्क़ हो सकता है',
    gu: '{coords} · {status}; બિનસત્તાવાર નકશાના પિન પરથી લીધેલ છે, તેથી એક બ્લૉક જેટલો ફેર હોઈ શકે',
  },
  'station.about.na': { en: 'Not available', hi: 'उपलब्ध नहीं', gu: 'ઉપલબ્ધ નથી' },
  'station.about.alias': { en: 'Also called', hi: 'अन्य नाम', gu: 'અન્ય નામ' },
  'station.about.notes': { en: 'Notes', hi: 'नोट', gu: 'નોંધ' },
  'station.about.website': { en: 'GMRC website (needs internet)', hi: 'GMRC वेबसाइट (इंटरनेट चाहिए)', gu: 'GMRC વેબસાઇટ (ઇન્ટરનેટ જોઈએ)' },
  'station.coord.estimated': { en: 'estimated', hi: 'अनुमानित', gu: 'અંદાજિત' },
  'station.coord.verified': { en: 'verified', hi: 'सत्यापित', gu: 'ચકાસેલ' },
  'station.coord.unverified': { en: 'unverified', hi: 'असत्यापित', gu: 'ચકાસ્યા વગરનું' },
  'station.coord.unknown': { en: 'unknown', hi: 'अज्ञात', gu: 'અજ્ઞાત' },

  // ---- metro map card
  'station.map.title': { en: 'Metro map', hi: 'मेट्रो नक्शा', gu: 'મેટ્રો નકશો' },
  'station.map.sub': { en: 'See the whole network', hi: 'पूरा नेटवर्क देखें', gu: 'આખું નેટવર્ક જુઓ' },
  'station.map.a11y': { en: 'Metro map. See the whole network', hi: 'मेट्रो नक्शा। पूरा नेटवर्क देखें', gu: 'મેટ્રો નકશો. આખું નેટવર્ક જુઓ' },
});
