import { Injectable, signal, inject } from '@angular/core';
import { TranslationApiService } from './translation-api.service';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export const EIGHTH_SCHEDULE_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर / کٲشُر' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mni', name: 'Manipuri (Meitei)', nativeName: 'মৈতৈলোন্' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'sd', name: 'Sindhi', nativeName: 'सिन्धी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' }
];

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translationApi = inject(TranslationApiService);

  readonly languages: SupportedLanguage[] = EIGHTH_SCHEDULE_LANGUAGES;
  private currentLang = signal<string>('en');
  readonly lang = this.currentLang.asReadonly();

  // Dynamic translated keys cache for fast UI lookup
  private dynamicTranslations = signal<Record<string, string>>({});

  private translations: Record<string, Record<string, string>> = {
    en: {
      'app.title': 'Akhand Bharat Seva',
      'app.tagline': 'Your City. Your Voice. Our Responsibility.',
      'gov.subtitle': 'Unified National Civic Grievance & Smart Prioritization Platform',
      'gov.dept': 'Ministry of Housing & Urban Affairs &bull; Government of Bharat',
      
      'nav.home': 'Home',
      'nav.report': 'Report a Problem',
      'nav.track': 'Track Complaint',
      'nav.public': 'Public Grievances',
      'nav.faq': 'Help / FAQ',
      'nav.admin': 'Officer Portal',
      
      'portal.main': 'MAIN WEBSITE',
      'portal.mainSub': 'Public Transparency Feed',
      'portal.report': 'REPORT A PROBLEM',
      'portal.reportSub': 'Photo & GPS Submission',
      'portal.track': 'TRACK COMPLAINT',
      'portal.trackSub': 'Live Redressal Timeline',
      'portal.admin': 'OFFICER COMMAND DESK',
      'portal.adminSub': 'Smart Priority Queue',

      'hero.badge': 'Citizen Grievance Redressal & Smart Priority Engine',
      'hero.headline': "Let's Make Our City Better Together",
      'hero.subtitle': 'Report civic issues directly with geo-tagging, track transparent resolution timelines, and experience transparent, rules-based priority management.',
      'hero.btnReport': 'Report a Problem Now',
      'hero.btnTrack': 'Track Your Complaint',
      'hero.btnPublic': 'View Public Issues',

      'stats.total': 'Total Grievances',
      'stats.resolved': 'Issues Resolved',
      'stats.inProgress': 'Under Action',
      'stats.avgTime': 'Avg Resolution',
      'stats.hotspots': 'Monitored Hotspots',

      'cat.roads': 'Roads & Potholes',
      'cat.garbage': 'Garbage & Sanitation',
      'cat.sewage': 'Sewage & Drainage',
      'cat.water': 'Water Supply',
      'cat.streetlights': 'Streetlights & Electricity',
      'cat.parks': 'Parks & Gardens',
      'cat.footpaths': 'Footpaths',
      'cat.toilets': 'Public Toilets',
      'cat.animals': 'Stray Animals',
      'cat.other': 'Other Issues',

      'prio.p0': 'P0 — Emergency',
      'prio.p1': 'P1 — High',
      'prio.p2': 'P2 — Medium',
      'prio.p3': 'P3 — Low',

      'status.submitted': 'Submitted',
      'status.underReview': 'Under Review',
      'status.assigned': 'Assigned',
      'status.inProgress': 'In Progress',
      'status.resolved': 'Resolved',
      'status.closed': 'Closed',

      'lang.selectLabel': 'Select Language',
      'footer.disclaimer': 'Hackathon Demo Platform — Model based on Guidelines for Indian Government Websites (GIGW). Not an official Government of India portal.',
      'footer.rights': 'All rights reserved. Dedicated to transparent civic governance in Bharat.'
    },
    hi: {
      'app.title': 'अखंड भारत सेवा',
      'app.tagline': 'आपका शहर. आपकी आवाज़. हमारा दायित्व.',
      'gov.subtitle': 'एकीकृत राष्ट्रीय नागरिक शिकायत निवारण एवं स्मार्ट प्राथमिकता प्रणाली',
      'gov.dept': 'आवासन और शहरी कार्य मंत्रालय &bull; भारत सरकार',
      
      'nav.home': 'मुख्य पृष्ठ',
      'nav.report': 'शिकायत दर्ज करें',
      'nav.track': 'स्थिति ट्रैक करें',
      'nav.public': 'सार्वजनिक शिकायतें',
      'nav.faq': 'सहायता / एफएक्यू',
      'nav.admin': 'अधिकारी पोर्टल',

      'portal.main': 'मुख्य वेबसाइट',
      'portal.mainSub': 'सार्वजनिक पारदर्शिता पटल',
      'portal.report': 'शिकायत दर्ज करें',
      'portal.reportSub': 'फोटो एवं जीपीएस विवरण',
      'portal.track': 'स्थिति ट्रैक करें',
      'portal.trackSub': 'सजीव निवारण प्रगति',
      'portal.admin': 'अधिकारी डैशबोर्ड',
      'portal.adminSub': 'प्राथमिकता कमान केंद्र',

      'hero.badge': 'नागरिक शिकायत निवारण एवं स्मार्ट प्राथमिकता प्रणाली',
      'hero.headline': 'आइए मिलकर अपने शहर को बेहतर बनाएं',
      'hero.subtitle': 'जीपीएस लोकेशन और फोटो के साथ नागरिक समस्याओं की सूचना दें, पारदर्शी समाधान ट्रैक करें और नियम-आधारित प्राथमिकता प्रणाली का अनुभव करें।',
      'hero.btnReport': 'अभी समस्या दर्ज करें',
      'hero.btnTrack': 'शिकायत की स्थिति ट्रैक करें',
      'hero.btnPublic': 'सार्वजनिक समस्याएं देखें',

      'stats.total': 'कुल दर्ज शिकायतें',
      'stats.resolved': 'सफलतापूर्वक हल',
      'stats.inProgress': 'कार्य प्रगति पर',
      'stats.avgTime': 'औसत समाधान समय',
      'stats.hotspots': 'सक्रिय हॉटस्पॉट क्षेत्र',

      'cat.roads': 'सड़कें एवं गड्ढे',
      'cat.garbage': 'कचरा एवं स्वच्छता',
      'cat.sewage': 'सीवेज एवं जल निकासी',
      'cat.water': 'पेयजल आपूर्ति',
      'cat.streetlights': 'स्ट्रीट लाइट एवं बिजली',
      'cat.parks': 'पार्क एवं उद्यान',
      'cat.footpaths': 'फुटपाथ एवं पैदल मार्ग',
      'cat.toilets': 'सार्वजनिक शौचालय',
      'cat.animals': 'आवारा पशु',
      'cat.other': 'अन्य नागरिक समस्याएं',

      'prio.p0': 'P0 — आपातकालीन (Emergency)',
      'prio.p1': 'P1 — उच्च प्राथमिकता (High)',
      'prio.p2': 'P2 — मध्यम प्राथमिकता (Medium)',
      'prio.p3': 'P3 — सामान्य (Low)',

      'status.submitted': 'दर्ज की गई',
      'status.underReview': 'समीक्षाधीन',
      'status.assigned': 'विभाग को प्रेषित',
      'status.inProgress': 'कार्य प्रगति पर',
      'status.resolved': 'हल कर दी गई',
      'status.closed': 'समाप्त',

      'lang.selectLabel': 'भाषा चुनें',
      'footer.disclaimer': 'हैकथॉन डेमो प्लेटफॉर्म — यह भारतीय सरकारी वेबसाइट दिशानिर्देशों (GIGW) पर आधारित एक प्रोटोटाइप है।',
      'footer.rights': 'सर्वाधिकार सुरक्षित। भारत में पारदर्शी नागरिक शासन को समर्पित।'
    },
    te: {
      'app.title': 'అఖండ భారత్ సేవ',
      'app.tagline': 'మీ నగరం. మీ గళం. మా బాధ్యత.',
      'gov.subtitle': 'సమగ్ర జాతీయ పౌర సమస్యల పరిష్కార & స్మార్ట్ ప్రాధాన్యత వేదిక',
      'gov.dept': 'పట్టణాభివృద్ధి మరియు పౌర పరిపాలన విభాగం &bull; భారత ప్రభుత్వం',
      
      'nav.home': 'ప్రధాన పేజీ',
      'nav.report': 'సమస్యను నివేదించండి',
      'nav.track': 'ఫిర్యాదు ట్రాకింగ్',
      'nav.public': 'ప్రజా సమస్యలు',
      'nav.faq': 'సహాయం / FAQ',
      'nav.admin': 'అధికారుల పోర్టల్',

      'portal.main': 'ప్రధాన వెబ్‌సైట్',
      'portal.mainSub': 'వార్డు ప్రజా సమస్యలు',
      'portal.report': 'ఫిర్యాదు చేయండి',
      'portal.reportSub': 'ఫోటో & జీపీఎస్ నమోదు',
      'portal.track': 'స్థితి ట్రాక్ చేయండి',
      'portal.trackSub': 'లైవ్ పురోగతి కాలక్రమం',
      'portal.admin': 'అధికారి డెస్క్',
      'portal.adminSub': 'కమాండ్ & కంట్రోల్ సెంటర్',
      
      'hero.badge': 'పౌర సమస్యల పరిష్కార & స్మార్ట్ ప్రాధాన్యత వ్యవస్థ',
      'hero.headline': 'మన నగరాన్ని కలిసి ఉన్నతంగా మార్చుకుందాం',
      'hero.subtitle': 'జియో-లొకేషన్ సహాయంతో పౌర సమస్యలను నివేదించండి, పారదర్శక పురోగతిని ట్రాక్ చేయండి మరియు నిబంధనల ఆధారిత ప్రాధాన్యత పరిష్కారాన్ని పొందండి.',
      'hero.btnReport': 'ఇప్పుడే సమస్యను నివేదించండి',
      'hero.btnTrack': 'మీ ఫిర్యాదును ట్రాక్ చేయండి',
      'hero.btnPublic': 'ప్రజా సమస్యలను చూడండి',

      'stats.total': 'మొత్తం ఫిర్యాదులు',
      'stats.resolved': 'పరిష్కరించబడినవి',
      'stats.inProgress': 'పురోగతిలో ఉన్నవి',
      'stats.avgTime': 'సగటు పరిష్కార సమయం',
      'stats.hotspots': 'హాట్‌స్పాట్ ప్రాంతాలు',

      'cat.roads': 'రహదారులు & గుంతలు',
      'cat.garbage': 'చెత్త & పారిశుధ్యం',
      'cat.sewage': 'డ్రైనేజీ & మురుగునీరు',
      'cat.water': 'తాగునీటి సరఫరా',
      'cat.streetlights': 'వీధి దీపాలు & విద్యుత్',
      'cat.parks': 'పార్కులు & ఉద్యానవనాలు',
      'cat.footpaths': 'పాదచారుల బాటలు',
      'cat.toilets': 'ప్రజా మరుగుదొడ్లు',
      'cat.animals': 'వీధి జంతువులు',
      'cat.other': 'ఇతర పౌర సమస్యలు',

      'prio.p0': 'P0 — అత్యవసరం (Emergency)',
      'prio.p1': 'P1 — అధిక ప్రాధాన్యత (High)',
      'prio.p2': 'P2 — మధ్యమ ప్రాధాన్యత (Medium)',
      'prio.p3': 'P3 — సాధారణం (Low)',

      'status.submitted': 'దాఖలు చేయబడింది',
      'status.underReview': 'పరిశీలనలో ఉంది',
      'status.assigned': 'కేటాయించబడింది',
      'status.inProgress': 'పురోగతిలో ఉంది',
      'status.resolved': 'పరిష్కరించబడింది',
      'status.closed': 'ముగించబడింది',

      'lang.selectLabel': 'భాషను ఎంచుకోండి',
      'footer.disclaimer': 'హ్యాకథాన్ డెమో ప్లాట్‌ఫామ్ — ఇది భారత ప్రభుత్వ వెబ్‌సైట్ల మార్గదర్శకాల (GIGW) నమూనా.',
      'footer.rights': 'సర్వ హక్కులు ప్రత్యేకించబడ్డాయి. భారతదేశ పారదర్శక పౌర పాలన కోసం సమర్పితం.'
    },
    ta: {
      'app.title': 'அகண்ட பாரத சேவை',
      'app.tagline': 'உங்கள் நகரம். உங்கள் குரல். எங்கள் பொறுப்பு.',
      'nav.home': 'முகப்பு',
      'nav.report': 'புகார் பதிவு செய்ய',
      'nav.track': 'புகார் நிலை அறிய',
      'nav.public': 'பொதுப் புகார்கள்',
      'nav.faq': 'உதவி / கேள்விகள்',
      'nav.admin': 'அதிகாரி போர்ட்டல்',
      'portal.main': 'முதன்மை வலைத்தளம்',
      'portal.report': 'புகார் பதிவு செய்ய',
      'portal.track': 'நிலை அறிய',
      'portal.admin': 'அதிகாரி மேசை',
      'hero.headline': 'நமது நகரத்தை ஒன்றிணைந்து மேம்படுத்துவோம்',
      'stats.total': 'மொத்த புகார்கள்',
      'stats.resolved': 'தீர்க்கப்பட்டவை',
      'stats.inProgress': 'நடவடிக்கையில்'
    },
    bn: {
      'app.title': 'অখণ্ড ভারত সেবা',
      'app.tagline': 'আপনার শহর। আপনার কণ্ঠ। আমাদের দায়িত্ব।',
      'nav.home': 'হোম',
      'nav.report': 'সমস্যা জানান',
      'nav.track': 'অভিযোগ ট্র্যাক করুন',
      'nav.public': 'জনসাধারণের সমস্যা',
      'nav.faq': 'সাহায্য / প্রশ্নাবলী',
      'nav.admin': 'অফিসার পোর্টাল',
      'portal.main': 'মূল ওয়েবসাইট',
      'portal.report': 'সমস্যা জানান',
      'portal.track': 'অবস্থা দেখুন',
      'portal.admin': 'অফিসার ডেস্ক',
      'hero.headline': 'আসুন একসাথে আমাদের শহরকে সুন্দর করি',
      'stats.total': 'মোট অভিযোগ',
      'stats.resolved': 'সমাধানকৃত',
      'stats.inProgress': 'চলমান'
    },
    mr: {
      'app.title': 'अखंड भारत सेवा',
      'app.tagline': 'तुमचे शहर. तुमचा आवाज. आमची जबाबदारी.',
      'nav.home': 'मुख्यपृष्ठ',
      'nav.report': 'तक्रार नोंदवा',
      'nav.track': 'तक्रार ट्रॅक करा',
      'nav.public': 'सार्वजनिक तक्रारी',
      'nav.faq': 'मदत / वारंवार विचारले जाणारे प्रश्न',
      'nav.admin': 'अधिकारी पोर्टल',
      'portal.main': 'मुख्य वेबसाइट',
      'portal.report': 'तक्रार नोंदवा',
      'portal.track': 'स्थिती तपासा',
      'portal.admin': 'अधिकारी डेस्क',
      'hero.headline': 'आपले शहर एकत्र मिळून अधिक चांगले करूया',
      'stats.total': 'एकूण तक्रारी',
      'stats.resolved': 'निवारण झालेल्या',
      'stats.inProgress': 'प्रगतीपथावर'
    },
    gu: {
      'app.title': 'અખંડ ભારત સેવા',
      'app.tagline': 'તમારું શહેર. તમારો અવાજ. અમારી જવાબદારી.',
      'nav.home': 'મુખ્ય પૃષ્ઠ',
      'nav.report': 'સમસ્યા નોંધાવો',
      'nav.track': 'ફરિયાદ ટ્રેક કરો',
      'nav.public': 'જાહેર ફરિયાદો',
      'nav.faq': 'મદદ / પ્રશ્નોત્તરી',
      'nav.admin': 'અધિકારી પોર્ટલ',
      'portal.main': 'મુખ્ય વેબસાઇટ',
      'portal.report': 'સમસ્યા નોંધાવો',
      'portal.track': 'સ્થિતિ તપાસો',
      'portal.admin': 'અધિકારી ડેસ્ક',
      'hero.headline': 'ચાલો સાથે મળીને આપણા શહેરને વધુ સારું બનાવીએ'
    },
    kn: {
      'app.title': 'ಅಖಂಡ ಭಾರತ ಸೇವಾ',
      'app.tagline': 'ನಿಮ್ಮ ನಗರ. ನಿಮ್ಮ ಧ್ವನಿ. ನಮ್ಮ ಜವಾಬ್ದಾರಿ.',
      'nav.home': 'ಮುಖಪುಟ',
      'nav.report': 'ದೂರು ದಾಖಲಿಸಿ',
      'nav.track': 'ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
      'nav.public': 'ಸಾರ್ವಜನಿಕ ದೂರುಗಳು',
      'nav.faq': 'ಸಹಾಯ / ಪ್ರಶ್ನೋತ್ತರ',
      'nav.admin': 'ಅಧಿಕಾರಿ ಪೋರ್ಟಲ್',
      'portal.main': 'ಮುಖ್ಯ ಜಾಲತಾಣ',
      'portal.report': 'ದೂರು ದಾಖಲಿಸಿ',
      'portal.track': 'ಸ್ಥಿತಿ ತಿಳಿಯಿರಿ',
      'portal.admin': 'ಅಧಿಕಾರಿ ಡೆಸ್ಕ್',
      'hero.headline': 'ನಮ್ಮ ನಗರವನ್ನು ಒಟ್ಟಾಗಿ ಉತ್ತಮಗೊಳಿಸೋಣ'
    },
    ml: {
      'app.title': 'അഖണ്ഡ ഭാരത സേവ',
      'app.tagline': 'നിങ്ങളുടെ നഗരം. നിങ്ങളുടെ ശബ്ദം. ഞങ്ങളുടെ ഉത്തരവാദിത്തം.',
      'nav.home': 'ഹോം',
      'nav.report': 'പരാതി അറിയിക്കുക',
      'nav.track': 'പരാതി നില അറിയുക',
      'nav.public': 'പൊതു പരാതികൾ',
      'nav.faq': 'സഹായം',
      'nav.admin': 'ഉദ്യോഗസ്ഥ പോർട്ടൽ',
      'portal.main': 'പ്രധാന വെബ്സൈറ്റ്',
      'portal.report': 'പരാതി അറിയിക്കുക',
      'portal.track': 'നില പരിശോധിക്കുക',
      'portal.admin': 'ഉദ്യോഗസ്ഥ ഡെസ്ക്'
    },
    pa: {
      'app.title': 'ਅਖੰਡ ਭਾਰਤ ਸੇਵਾ',
      'app.tagline': 'ਤੁਹਾਡਾ ਸ਼ਹਿਰ। ਤੁਹਾਡੀ ਆਵਾਜ਼। ਸਾਡੀ ਜ਼ਿੰਮੇਵਾਰੀ।',
      'nav.home': 'ਮੁੱਖ ਪੰਨਾ',
      'nav.report': 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ',
      'nav.track': 'ਸਥਿਤੀ ਟ੍ਰੈਕ ਕਰੋ',
      'nav.public': 'ਜਨਤਕ ਸਮੱਸਿਆਵਾਂ',
      'nav.faq': 'ਮਦਦ',
      'nav.admin': 'ਅਧਿਕਾਰੀ ਪੋਰਟਲ',
      'portal.main': 'ਮੁੱਖ ਵੈੱਬਸਾਈਟ',
      'portal.report': 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ',
      'portal.track': 'ਸਥਿਤੀ ਟ੍ਰੈਕ ਕਰੋ',
      'portal.admin': 'ਅਧਿਕਾਰੀ ਡੈਸਕ'
    },
    ur: {
      'app.title': 'اکھنڈ بھارت سیوا',
      'app.tagline': 'آپ کا شہر۔ آپ کی آواز۔ ہماری ذمہ داری۔',
      'nav.home': 'صفحۂ اول',
      'nav.report': 'شکایت درج کریں',
      'nav.track': 'شکایت کی حیثیت جانیں',
      'nav.public': 'عوامی شکایات',
      'nav.faq': 'مدد / سوالات',
      'nav.admin': 'افسر پورٹل',
      'portal.main': 'مرکزی ویب سائٹ',
      'portal.report': 'شکایت درج کریں',
      'portal.track': 'حیثیت دیکھیں',
      'portal.admin': 'افسر ڈیسک'
    },
    or: {
      'app.title': 'ଅଖଣ୍ଡ ଭାରତ ସେବା',
      'app.tagline': 'ଆପଣଙ୍କ ସହର | ଆପଣଙ୍କ ସ୍ୱର | ଆମର ଦାୟିତ୍ୱ |',
      'nav.home': 'ମୁଖ୍ୟ ପୃଷ୍ଠା',
      'nav.report': 'ଅଭିଯୋଗ ଦାଖଲ କରନ୍ତୁ',
      'nav.track': 'ଅଭିଯୋଗ ଟ୍ରାକ୍ କରନ୍ତୁ',
      'nav.public': 'ସର୍ବସାଧାରଣ ଅଭିଯୋଗ',
      'nav.faq': 'ସହାୟତା',
      'nav.admin': 'ଅଧିକାରୀ ପୋର୍ଟାଲ'
    },
    sa: {
      'app.title': 'अखण्ड भारत सेवा',
      'app.tagline': 'भवतः नगरम्। भवतः वाणी। अस्माकं दायित्वम्।',
      'nav.home': 'मुख्यपृष्ठम्',
      'nav.report': 'समस्यां सूचयतु',
      'nav.track': 'स्थितिं पश्यतु',
      'nav.public': 'सार्वजनिकसमस्याः',
      'nav.faq': 'साहाय्यम्',
      'nav.admin': 'अधिकारिपोsubject'
    }
  };

  constructor() {
    const saved = localStorage.getItem('abs_lang');
    if (saved && this.languages.some(l => l.code === saved)) {
      this.currentLang.set(saved);
      document.documentElement.lang = saved;
    }
  }

  setLanguage(langCode: string): void {
    if (!this.languages.some(l => l.code === langCode)) return;
    this.currentLang.set(langCode);
    localStorage.setItem('abs_lang', langCode);
    document.documentElement.lang = langCode;

    // Trigger dynamic API prefetch for common interface strings if live API is enabled
    if (this.translationApi.isLiveApiConfigured() && langCode !== 'en') {
      this.prefetchTranslations(langCode);
    }
  }

  getCurrentLanguageInfo(): SupportedLanguage {
    const code = this.currentLang();
    return this.languages.find(l => l.code === code) || this.languages[0];
  }

  private async prefetchTranslations(targetLang: string): Promise<void> {
    const sampleKeys = ['nav.home', 'nav.report', 'nav.track', 'nav.public', 'hero.headline'];
    for (const key of sampleKeys) {
      const enText = this.translations['en']?.[key];
      if (enText) {
        const res = await this.translationApi.translateText(enText, targetLang);
        if (res) {
          const current = this.dynamicTranslations();
          this.dynamicTranslations.set({ ...current, [`${targetLang}:${key}`]: res });
        }
      }
    }
  }

  t(key: string): string {
    const lang = this.currentLang();

    // 1. Check dynamic API cache for this language
    const dynamicVal = this.dynamicTranslations()[`${lang}:${key}`];
    if (dynamicVal) return dynamicVal;

    // 2. Check built-in dictionary for current language
    if (this.translations[lang]?.[key]) {
      return this.translations[lang][key];
    }

    // 3. Fallback chain: If Hindi available, or fallback to English
    if (lang !== 'hi' && this.translations['hi']?.[key]) {
      return this.translations['hi'][key];
    }

    return this.translations['en']?.[key] || key;
  }
}
