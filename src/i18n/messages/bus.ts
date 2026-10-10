import { defineCatalog } from '../catalog';

/** Bus tab, bus route and stop screens, and the shared bus pieces (agency names, counts, "in 5 min"). */
export default defineCatalog({
  // ---- shared bus pieces
  'bus.scheduled': { en: 'Scheduled · not live', hi: 'निर्धारित · लाइव नहीं', gu: 'નિર્ધારિત · લાઇવ નથી' },
  'bus.scheduled.a11y': { en: 'Scheduled times from the timetable, not live', hi: 'समय-सारिणी के निर्धारित समय, लाइव नहीं', gu: 'સમયપત્રક મુજબના નિર્ધારિત સમય, લાઇવ નથી' },
  'bus.routeBadge.a11y': { en: '{agency} route {short}', hi: '{agency} रूट {short}', gu: '{agency} રૂટ {short}' },

  'bus.routes.one': { en: '{n} route', hi: '{n} रूट', gu: '{n} રૂટ' },
  'bus.routes.other': { en: '{n} routes', hi: '{n} रूट', gu: '{n} રૂટ' },
  'bus.buses.one': { en: '{n} bus', hi: '{n} बस', gu: '{n} બસ' },
  'bus.buses.other': { en: '{n} buses', hi: '{n} बसें', gu: '{n} બસો' },
  'bus.stops.one': { en: '{n} stop', hi: '{n} स्टॉप', gu: '{n} સ્ટોપ' },
  'bus.stops.other': { en: '{n} stops', hi: '{n} स्टॉप', gu: '{n} સ્ટોપ' },
  'bus.tripsADay.one': { en: '{n} trip a day', hi: 'रोज़ {n} फेरी', gu: 'દરરોજ {n} ફેરી' },
  'bus.tripsADay.other': { en: '{n} trips a day', hi: 'रोज़ {n} फेरियाँ', gu: 'દરરોજ {n} ફેરીઓ' },

  'bus.when.now': { en: 'now', hi: 'अभी', gu: 'હમણાં' },
  'bus.when.inMin': { en: 'in {n} min', hi: '{n} मिनट में', gu: '{n} મિનિટમાં' },
  'bus.when.later': { en: 'later', hi: 'बाद में', gu: 'પછી' },

  // ---- Bus tab
  'bus.search.placeholder': { en: 'Route number, stop or place', hi: 'रूट नंबर, स्टॉप या जगह', gu: 'રૂટ નંબર, સ્ટોપ કે જગ્યા' },
  'bus.search.a11y': { en: 'Search bus routes and stops', hi: 'बस रूट और स्टॉप खोजें', gu: 'બસ રૂટ અને સ્ટોપ શોધો' },
  'bus.search.clear': { en: 'Clear search', hi: 'खोज हटाएँ', gu: 'શોધ સાફ કરો' },
  'bus.quick.plan': { en: 'Plan bus + metro', hi: 'बस + मेट्रो प्लान करें', gu: 'બસ + મેટ્રો પ્લાન કરો' },
  'bus.quick.map': { en: 'Bus map', hi: 'बस नक्शा', gu: 'બસ નકશો' },
  'bus.loading.timetable': { en: 'Loading the timetable stored on your phone…', hi: 'आपके फ़ोन में सहेजी समय-सारिणी लोड हो रही है…', gu: 'તમારા ફોનમાં સાચવેલું સમયપત્રક લોડ થઈ રહ્યું છે…' },
  'bus.loadError.inline': {
    en: 'Bus data could not be loaded. Restart the app and try again.',
    hi: 'बस का डेटा लोड नहीं हो सका। ऐप फिर से शुरू करें और दोबारा कोशिश करें।',
    gu: 'બસનો ડેટા લોડ થઈ શક્યો નથી. એપ ફરી શરૂ કરો અને ફરી પ્રયાસ કરો.',
  },
  'bus.head.routes': { en: 'Routes', hi: 'रूट', gu: 'રૂટ' },
  'bus.head.stops': { en: 'Stops', hi: 'स्टॉप', gu: 'સ્ટોપ' },
  'bus.stopRow.a11y': { en: 'Stop {name}, {routes}', hi: 'स्टॉप {name}, {routes}', gu: 'સ્ટોપ {name}, {routes}' },
  'bus.routeRow.a11y': { en: '{agency} route {short}, {long}, {trips}', hi: '{agency} रूट {short}, {long}, {trips}', gu: '{agency} રૂટ {short}, {long}, {trips}' },
  'bus.empty.title': { en: 'No matching route or stop', hi: 'कोई मिलता-जुलता रूट या स्टॉप नहीं', gu: 'મેળ ખાતો કોઈ રૂટ કે સ્ટોપ નથી' },
  'bus.empty.hint': {
    en: 'Try a route number like 101 or a place like Maninagar.',
    hi: 'कोई रूट नंबर, जैसे 101, या कोई जगह, जैसे Maninagar, आज़माएँ।',
    gu: 'રૂટ નંબર, જેમ કે 101, અથવા જગ્યા, જેમ કે Maninagar, અજમાવો.',
  },
  'bus.about.title': { en: 'About the bus data', hi: 'बस डेटा के बारे में', gu: 'બસ ડેટા વિશે' },
  // **bold** marks the words shown in bold
  'bus.about.coverage': {
    en: 'Covers **AMTS** city buses, **BRTS** (Janmarg) and **Gandhinagar** buses. State GSRTC timetables are not included.',
    hi: '**AMTS** की शहर की बसें, **BRTS** (Janmarg) और **Gandhinagar** की बसें शामिल हैं। राज्य की GSRTC की समय-सारिणी शामिल नहीं है।',
    gu: '**AMTS** ની શહેરની બસો, **BRTS** (Janmarg) અને **Gandhinagar** બસોનો સમાવેશ થાય છે. રાજ્યની GSRTC ના સમયપત્રક સામેલ નથી.',
  },
  'bus.about.source': {
    en: 'Times come from an unofficial third-party timetable feed, valid {from} to {to}. They are scheduled, not live: buses may run early, late or not at all.',
    hi: 'समय एक अनौपचारिक थर्ड-पार्टी समय-सारिणी फ़ीड से लिए गए हैं, जो {from} से {to} तक मान्य है। ये निर्धारित हैं, लाइव नहीं: बसें समय से पहले या देर से चल सकती हैं, या चलें ही नहीं।',
    gu: 'સમય બિનસત્તાવાર થર્ડ-પાર્ટી સમયપત્રક ફીડમાંથી લીધેલા છે, જે {from} થી {to} સુધી માન્ય છે. આ નિર્ધારિત છે, લાઇવ નથી: બસો વહેલી કે મોડી ચાલી શકે, અથવા ન પણ ચાલે.',
  },

  // ---- route and stop screens: loading and errors
  'bus.unavailable.title': { en: 'Bus data not available', hi: 'बस का डेटा उपलब्ध नहीं', gu: 'બસનો ડેટા ઉપલબ્ધ નથી' },
  'bus.loading.route': { en: 'Loading route…', hi: 'रूट लोड हो रहा है…', gu: 'રૂટ લોડ થઈ રહ્યો છે…' },
  'bus.loading.stop': { en: 'Loading stop…', hi: 'स्टॉप लोड हो रहा है…', gu: 'સ્ટોપ લોડ થઈ રહ્યો છે…' },
  'bus.loadError.title': { en: 'Could not load bus data', hi: 'बस का डेटा लोड नहीं हो सका', gu: 'બસનો ડેટા લોડ થઈ શક્યો નથી' },
  'bus.loadError.body': {
    en: 'The metro screens still work. Restart the app and try again.',
    hi: 'मेट्रो वाली स्क्रीन अब भी चलती हैं। ऐप फिर से शुरू करें और दोबारा कोशिश करें।',
    gu: 'મેટ્રોની સ્ક્રીન હજુ ચાલે છે. એપ ફરી શરૂ કરો અને ફરી પ્રયાસ કરો.',
  },
  'bus.backToBuses': { en: 'Back to buses', hi: 'बसों पर वापस', gu: 'બસો પર પાછા' },
  'bus.expired.title': { en: 'Timetable may be out of date', hi: 'समय-सारिणी पुरानी हो सकती है', gu: 'સમયપત્રક જૂનું હોઈ શકે' },
  'bus.expired.body': {
    en: 'The bus timetable in the app ended on {date}. Times below may no longer be right.',
    hi: 'ऐप में दी गई बस समय-सारिणी {date} को खत्म हो गई थी। नीचे दिए समय अब सही नहीं भी हो सकते।',
    gu: 'એપમાં રહેલું બસ સમયપત્રક {date} ના રોજ પૂરું થયું. નીચેના સમય હવે કદાચ સાચા ન પણ હોય.',
  },

  // ---- route screen
  'bus.route.notFound': { en: 'Route not found', hi: 'रूट नहीं मिला', gu: 'રૂટ મળ્યો નથી' },
  'bus.route.noTrips.title': { en: 'No scheduled trips', hi: 'कोई निर्धारित फेरी नहीं', gu: 'કોઈ નિર્ધારિત ફેરી નથી' },
  'bus.route.noTrips.body': {
    en: 'The timetable feed lists this route but has no trips for it, so there is nothing to show.',
    hi: 'समय-सारिणी फ़ीड में यह रूट दिया गया है, पर इसकी कोई फेरी नहीं है, इसलिए दिखाने को कुछ नहीं है।',
    gu: 'સમયપત્રક ફીડમાં આ રૂટ છે, પણ તેની કોઈ ફેરી નથી, એટલે બતાવવા માટે કંઈ નથી.',
  },
  'bus.route.notInData': { en: 'This route is not in the offline bus data.', hi: 'यह रूट ऑफ़लाइन बस डेटा में नहीं है।', gu: 'આ રૂટ ઑફલાઇન બસ ડેટામાં નથી.' },
  'bus.towards.label': { en: 'Towards', hi: 'दिशा', gu: 'દિશા' },
  'bus.towards.a11y': { en: 'Towards {place}', hi: '{place} की ओर', gu: '{place} તરફ' },
  'bus.showOnMap': { en: 'Show on map', hi: 'नक्शे पर दिखाएँ', gu: 'નકશા પર બતાવો' },
  'bus.showOnMap.a11y': { en: 'Show this route on the map', hi: 'इस रूट को नक्शे पर दिखाएँ', gu: 'આ રૂટ નકશા પર બતાવો' },
  'bus.planTrip': { en: 'Plan a trip', hi: 'यात्रा की योजना बनाएँ', gu: 'મુસાફરીનું આયોજન કરો' },
  'bus.planTrip.a11y': { en: 'Plan a trip from {origin}', hi: '{origin} से यात्रा की योजना बनाएँ', gu: '{origin} થી મુસાફરીનું આયોજન કરો' },
  'bus.next.from': { en: 'Next from {origin}', hi: '{origin} से अगली बसें', gu: '{origin} થી હવે પછીની બસો' },
  'bus.next.none': {
    en: 'No more scheduled departures in the next 24 hours.',
    hi: 'अगले 24 घंटों में कोई और निर्धारित बस रवाना नहीं होगी।',
    gu: 'આગામી 24 કલાકમાં ઉપડનારી કોઈ વધુ નિર્ધારિત બસ નથી.',
  },
  'bus.howOften': { en: 'How often', hi: 'कितनी बार', gu: 'કેટલી વાર' },
  'bus.wholeRoute': { en: 'Whole route ≈ {n} min', hi: 'पूरा रूट ≈ {n} मिनट', gu: 'આખો રૂટ ≈ {n} મિનિટ' },
  'bus.noBuses': { en: 'No buses', hi: 'कोई बस नहीं', gu: 'કોઈ બસ નથી' },
  'bus.every': { en: 'every ~{n} min', hi: 'हर ~{n} मिनट में', gu: 'દર ~{n} મિનિટે' },
  'bus.band.every.a11y': { en: 'About every {min} minutes, {buses}', hi: 'लगभग हर {min} मिनट में, {buses}', gu: 'લગભગ દર {min} મિનિટે, {buses}' },
  'bus.band.gaps': { en: '{buses} · gaps {min}–{max} min', hi: '{buses} · अंतर {min}–{max} मिनट', gu: '{buses} · અંતર {min}–{max} મિનિટ' },
  'bus.band.early': { en: 'Early 04:00–07:00', hi: 'तड़के 04:00–07:00', gu: 'વહેલી સવાર 04:00–07:00' },
  'bus.band.morning': { en: 'Morning 07:00–10:00', hi: 'सुबह 07:00–10:00', gu: 'સવાર 07:00–10:00' },
  'bus.band.midday': { en: 'Midday 10:00–16:00', hi: 'दिन में 10:00–16:00', gu: 'દિવસ દરમિયાન 10:00–16:00' },
  'bus.band.evening': { en: 'Evening 16:00–20:00', hi: 'शाम 16:00–20:00', gu: 'સાંજ 16:00–20:00' },
  'bus.band.night': { en: 'Night 20:00 onwards', hi: 'रात 20:00 से आगे', gu: 'રાત 20:00 થી આગળ' },
  'bus.minAfterLeaving': { en: 'min after leaving', hi: 'रवाना होने के बाद मिनट', gu: 'ઉપડ્યા પછી મિનિટ' },
  'bus.stopItem.a11y': {
    en: '{name}, about {n} minutes after leaving. Open stop',
    hi: '{name}, रवाना होने के लगभग {n} मिनट बाद। स्टॉप खोलें',
    gu: '{name}, ઉપડ્યાના લગભગ {n} મિનિટ પછી. સ્ટોપ ખોલો',
  },
  'bus.stopItem.a11yNoTime': { en: '{name}. Open stop', hi: '{name}। स्टॉप खोलें', gu: '{name}. સ્ટોપ ખોલો' },
  'bus.start': { en: 'start', hi: 'शुरू', gu: 'શરૂ' },
  'bus.showFewer': { en: 'Show fewer stops', hi: 'कम स्टॉप दिखाएँ', gu: 'ઓછા સ્ટોપ બતાવો' },
  'bus.showAll': { en: 'Show all {n} stops', hi: 'सभी {n} स्टॉप दिखाएँ', gu: 'બધા {n} સ્ટોપ બતાવો' },
  'bus.route.footnote': {
    en: 'Times are the published timetable (unofficial feed), not live positions. Minutes after leaving are the scheduled run of a typical trip.',
    hi: 'समय प्रकाशित समय-सारिणी (अनौपचारिक फ़ीड) के हैं, बसों की लाइव लोकेशन के नहीं। रवाना होने के बाद के मिनट एक सामान्य फेरी के निर्धारित सफ़र के हैं।',
    gu: 'સમય પ્રકાશિત સમયપત્રક (બિનસત્તાવાર ફીડ) મુજબના છે, બસની લાઇવ સ્થિતિ નથી. ઉપડ્યા પછીની મિનિટ એક સામાન્ય ફેરીના નિર્ધારિત પ્રવાસ મુજબની છે.',
  },

  // ---- stop screen
  'bus.stop.notFound': { en: 'Stop not found', hi: 'स्टॉप नहीं मिला', gu: 'સ્ટોપ મળ્યો નથી' },
  'bus.stop.notInData': { en: 'This stop is not in the offline bus data.', hi: 'यह स्टॉप ऑफ़लाइन बस डेटा में नहीं है।', gu: 'આ સ્ટોપ ઑફલાઇન બસ ડેટામાં નથી.' },
  'bus.stop.subtitle': { en: 'Bus stop · {agencies}', hi: 'बस स्टॉप · {agencies}', gu: 'બસ સ્ટોપ · {agencies}' },
  'bus.planFrom': { en: 'Plan from here', hi: 'यहाँ से प्लान करें', gu: 'અહીંથી પ્લાન કરો' },
  'bus.planTo': { en: 'Plan to here', hi: 'यहाँ तक प्लान करें', gu: 'અહીં સુધી પ્લાન કરો' },
  'bus.stop.next': { en: 'Next buses from here', hi: 'यहाँ से अगली बसें', gu: 'અહીંથી હવે પછીની બસો' },
  'bus.stop.noDepartures': {
    en: 'No scheduled departures in the next 24 hours. Buses on the routes below may only arrive at this stop.',
    hi: 'अगले 24 घंटों में यहाँ से कोई निर्धारित बस नहीं है। नीचे दिए रूट की बसें शायद यहाँ सिर्फ़ पहुँचती हैं।',
    gu: 'આગામી 24 કલાકમાં અહીંથી કોઈ નિર્ધારિત બસ નથી. નીચેના રૂટની બસો કદાચ અહીં ફક્ત પહોંચે છે.',
  },
  'bus.dep.a11y': {
    en: '{agency} {short} {towards}. Next at {time}. Scheduled.',
    hi: '{agency} {short}, {towards}। अगली बस {time} पर। निर्धारित।',
    gu: '{agency} {short}, {towards}. હવે પછીની બસ {time} વાગ્યે. નિર્ધારિત.',
  },
  'bus.dep.a11yThen': {
    en: '{agency} {short} {towards}. Next at {time}, then {more}. Scheduled.',
    hi: '{agency} {short}, {towards}। अगली बस {time} पर, फिर {more}। निर्धारित।',
    gu: '{agency} {short}, {towards}. હવે પછીની બસ {time} વાગ્યે, પછી {more}. નિર્ધારિત.',
  },
  'bus.dep.then': { en: 'Then {times}', hi: 'फिर {times}', gu: 'પછી {times}' },
  'bus.dep.last': { en: 'Last one in the next 24 hours', hi: 'अगले 24 घंटों में यह आखिरी है', gu: 'આગામી 24 કલાકમાં આ છેલ્લી છે' },
  'bus.stop.moreRoutes.one': {
    en: '+ {n} more route leaves from this stop. See the list below.',
    hi: '+ {n} और रूट इस स्टॉप से चलता है। नीचे सूची देखें।',
    gu: '+ {n} વધુ રૂટ આ સ્ટોપથી ઉપડે છે. નીચેની યાદી જુઓ.',
  },
  'bus.stop.moreRoutes.other': {
    en: '+ {n} more routes leave from this stop. See the list below.',
    hi: '+ {n} और रूट इस स्टॉप से चलते हैं। नीचे सूची देखें।',
    gu: '+ {n} વધુ રૂટ આ સ્ટોપથી ઉપડે છે. નીચેની યાદી જુઓ.',
  },
  'bus.metro.title': { en: 'Metro nearby', hi: 'आस-पास मेट्रो', gu: 'નજીકમાં મેટ્રો' },
  'bus.metro.a11y': { en: '{name}, about {m} metres', hi: '{name}, लगभग {m} मीटर', gu: '{name}, લગભગ {m} મીટર' },
  'bus.metro.sub': { en: 'About {m} m · estimated', hi: 'लगभग {m} मी. · अनुमान', gu: 'લગભગ {m} મી. · અંદાજ' },
  'bus.metro.subNamed': {
    en: 'About {m} m · estimated · stop is named for the metro',
    hi: 'लगभग {m} मी. · अनुमान · स्टॉप का नाम मेट्रो के नाम पर है',
    gu: 'લગભગ {m} મી. · અંદાજ · સ્ટોપનું નામ મેટ્રો પરથી છે',
  },
  'bus.routesHere.one': { en: '{n} route stops here', hi: '{n} रूट यहाँ रुकता है', gu: '{n} રૂટ અહીં રોકાય છે' },
  'bus.routesHere.other': { en: '{n} routes stop here', hi: '{n} रूट यहाँ रुकते हैं', gu: '{n} રૂટ અહીં રોકાય છે' },
  'bus.routeChip.a11y': { en: 'Route {short}', hi: 'रूट {short}', gu: 'રૂટ {short}' },
  'bus.stop.footnote': {
    en: 'Times are the published timetable (unofficial feed), not live positions. Buses may run early, late or not at all.',
    hi: 'समय प्रकाशित समय-सारिणी (अनौपचारिक फ़ीड) के हैं, बसों की लाइव लोकेशन के नहीं। बसें समय से पहले या देर से चल सकती हैं, या चलें ही नहीं।',
    gu: 'સમય પ્રકાશિત સમયપત્રક (બિનસત્તાવાર ફીડ) મુજબના છે, બસની લાઇવ સ્થિતિ નથી. બસો વહેલી કે મોડી ચાલી શકે, અથવા ન પણ ચાલે.',
  },
});
