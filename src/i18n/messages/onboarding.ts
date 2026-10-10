import { defineCatalog } from '../catalog';

/** The welcome walkthrough: one headline and one sentence per scene, plus controls and the Saved-tab replay row. */
export default defineCatalog({
  'onboarding.s1.title': { en: 'Your city. Your way.', hi: 'आपका शहर, आपका तरीका।', gu: 'તમારું શહેર, તમારી રીતે.' },
  'onboarding.s1.body': { en: 'Metro, buses & every connection.', hi: 'मेट्रो, बसें और हर कनेक्शन।', gu: 'મેટ્રો, બસ અને દરેક કનેક્શન.' },
  'onboarding.s1.primary': { en: 'Get started', hi: 'शुरू करें', gu: 'શરૂ કરો' },
  'onboarding.s1.secondary': { en: 'I already know the way', hi: 'मुझे रास्ता पता है', gu: 'મને રસ્તો ખબર છે' },
  'onboarding.s1.art': {
    en: 'Illustration: a metro over a bridge and a bus on the road below, in a city at sunrise.',
    hi: 'चित्र: सूर्योदय के समय शहर में पुल पर मेट्रो और नीचे सड़क पर बस।',
    gu: 'ચિત્ર: સૂર્યોદય સમયે શહેરમાં પુલ પર મેટ્રો અને નીચે રસ્તા પર બસ.',
  },

  'onboarding.s2.title': { en: 'The smartest way there.', hi: 'वहाँ पहुँचने का सबसे स्मार्ट तरीका।', gu: 'ત્યાં પહોંચવાની સૌથી સ્માર્ટ રીત.' },
  'onboarding.s2.body': { en: 'Compare routes, stops & connections.', hi: 'रूट, स्टॉप और कनेक्शन की तुलना करें।', gu: 'રૂટ, સ્ટોપ અને કનેક્શનની સરખામણી કરો.' },
  'onboarding.s2.art': {
    en: 'Illustration: a route from a home station by metro to an interchange, then by bus to a destination.',
    hi: 'चित्र: घर के स्टेशन से मेट्रो में इंटरचेंज तक, फिर बस से मंज़िल तक का रूट।',
    gu: 'ચિત્ર: ઘર પાસેના સ્ટેશનથી મેટ્રોમાં ઇન્ટરચેન્જ સુધી, પછી બસમાં ગંતવ્ય સુધીનો રૂટ.',
  },

  'onboarding.s3.title': { en: 'Never miss your stop.', hi: 'आपका स्टॉप कभी न छूटे।', gu: 'તમારો સ્ટોપ ક્યારેય ચૂકશો નહીં.' },
  'onboarding.s3.body': { en: 'Follow your trip, stop by stop.', hi: 'अपनी यात्रा स्टॉप-दर-स्टॉप देखें।', gu: 'તમારી મુસાફરી સ્ટોપ-દર-સ્ટોપ જુઓ.' },
  'onboarding.s3.note': {
    en: 'Your position comes from your phone’s GPS, and only when you start tracking.',
    hi: 'आपकी लोकेशन आपके फ़ोन के GPS से आती है, और सिर्फ़ तब जब आप ट्रैकिंग शुरू करें।',
    gu: 'તમારું લોકેશન તમારા ફોનના GPS પરથી મળે છે, અને ફક્ત ત્યારે જ જ્યારે તમે ટ્રેકિંગ શરૂ કરો.',
  },
  'onboarding.s3.art': {
    en: 'Illustration: a train moving from an underground tunnel onto an elevated track while the next stops light up.',
    hi: 'चित्र: भूमिगत सुरंग से एलिवेटेड ट्रैक पर आती ट्रेन, जबकि अगले स्टॉप एक-एक करके जलते हैं।',
    gu: 'ચિત્ર: ભૂગર્ભ ટનલમાંથી એલિવેટેડ ટ્રેક પર આવતી ટ્રેન, જ્યારે આગળના સ્ટોપ એક પછી એક ઝળહળે છે.',
  },

  'onboarding.s4.title': { en: 'Your city, even offline.', hi: 'आपका शहर, ऑफ़लाइन भी।', gu: 'તમારું શહેર, ઑફલાઇન પણ.' },
  'onboarding.s4.body': { en: 'Maps and saved routes live on your phone.', hi: 'नक्शे और सहेजे रूट आपके फ़ोन में रहते हैं।', gu: 'નકશા અને સાચવેલા રૂટ તમારા ફોનમાં જ રહે છે.' },
  'onboarding.s4.note': {
    en: 'Live location needs GPS. Bus times are scheduled, not live.',
    hi: 'लाइव लोकेशन के लिए GPS चाहिए। बस के समय निर्धारित हैं, लाइव नहीं।',
    gu: 'લાઇવ લોકેશન માટે GPS જોઈએ. બસના સમય નિર્ધારિત છે, લાઇવ નથી.',
  },
  'onboarding.s4.art': {
    en: 'Illustration: a phone showing a metro map and saved routes, with a symbol showing it works without internet.',
    hi: 'चित्र: मेट्रो नक्शा और सहेजे रूट दिखाता फ़ोन, और इंटरनेट के बिना चलने का निशान।',
    gu: 'ચિત્ર: મેટ્રો નકશો અને સાચવેલા રૂટ બતાવતો ફોન, અને ઇન્ટરનેટ વગર ચાલવાની નિશાની.',
  },

  'onboarding.s5.title': { en: 'Let’s get moving.', hi: 'चलिए, चलें!', gu: 'ચાલો, નીકળીએ!' },
  'onboarding.s5.body': { en: 'Your next journey starts here.', hi: 'आपकी अगली यात्रा यहीं से शुरू होती है।', gu: 'તમારી આગલી મુસાફરી અહીંથી શરૂ થાય છે.' },
  'onboarding.s5.primary': { en: 'Plan my first trip', hi: 'पहली यात्रा की योजना बनाएँ', gu: 'મારી પહેલી મુસાફરી પ્લાન કરો' },
  'onboarding.s5.secondary': { en: 'Explore the map first', hi: 'पहले नक्शा देखें', gu: 'પહેલા નકશો જુઓ' },
  'onboarding.s5.art': {
    en: 'Illustration: a metro and a bus travelling past a station entrance and a pedestrian crossing along a violet route.',
    hi: 'चित्र: स्टेशन के प्रवेश और पैदल पार-पथ के पास से बैंगनी रूट पर चलती मेट्रो और बस।',
    gu: 'ચિત્ર: સ્ટેશનના પ્રવેશ અને ઝેબ્રા ક્રોસિંગ પાસેથી જાંબલી રૂટ પર ચાલતી મેટ્રો અને બસ.',
  },

  'onboarding.next': { en: 'Next', hi: 'आगे', gu: 'આગળ' },
  'onboarding.back': { en: 'Back', hi: 'पीछे', gu: 'પાછળ' },
  'onboarding.skip': { en: 'Skip', hi: 'छोड़ें', gu: 'છોડો' },
  'onboarding.step': { en: 'Step {n} of {total}', hi: 'चरण {n}/{total}', gu: 'પગલું {n}/{total}' },
  'onboarding.pager.a11y': {
    en: 'Welcome guide. Swipe left or right to change step.',
    hi: 'स्वागत गाइड। चरण बदलने के लिए बाएँ या दाएँ स्वाइप करें।',
    gu: 'સ્વાગત માર્ગદર્શિકા. પગલું બદલવા ડાબે કે જમણે સ્વાઇપ કરો.',
  },

  'onboarding.replay.title': { en: 'Welcome guide', hi: 'स्वागत गाइड', gu: 'સ્વાગત માર્ગદર્શિકા' },
  'onboarding.replay.body': { en: 'Replay the quick tour of MetroMate.', hi: 'MetroMate का छोटा टूर फिर से देखें।', gu: 'MetroMate નો ટૂંકો પરિચય ફરી જુઓ.' },
  'onboarding.replay.button': { en: 'Show guide', hi: 'गाइड दिखाएँ', gu: 'માર્ગદર્શિકા બતાવો' },
});
