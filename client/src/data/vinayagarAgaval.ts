/**
 * Vinayagar Agaval — Complete Verse Data & 56-Day Program
 * By Avvaiyar (Ancient Tamil Poetess)
 * 
 * Bilingual: Tamil + English Transliteration + Meaning
 * Structured for daily learning: 4 lines per day
 */

/* ── Types ── */

export interface VerseLine {
  tamil: string;
  transliteration: string;
}

export interface DayLesson {
  day: number;
  phase: 'learning' | 'revision' | 'practice' | 'rehearsal' | 'grand-chanting';
  phaseName: { ta: string; en: string };
  phaseEmoji: string;
  lines: VerseLine[];
  meaning: { ta: string; en: string };
  revisionDays?: number[];       // For revision phase — which learning days to revise
  instruction: { ta: string; en: string };
}

export interface Badge {
  id: string;
  name: { ta: string; en: string };
  emoji: string;
  description: { ta: string; en: string };
  requirement: string;           // condition key for unlocking
  color: string;
}

export interface AgeGroup {
  id: string;
  label: { ta: string; en: string };
  minAge: number;
  maxAge: number;
  emoji: string;
}

/* ── Age Groups ── */

export const AGE_GROUPS: AgeGroup[] = [
  { id: 'bala', label: { ta: 'பால கணேசா', en: 'Bala Ganesha' }, minAge: 3, maxAge: 6, emoji: '🧒' },
  { id: 'taruna', label: { ta: 'தருண கணேசா', en: 'Taruna Ganesha' }, minAge: 7, maxAge: 10, emoji: '👦' },
  { id: 'vira', label: { ta: 'வீர கணேசா', en: 'Veera Ganesha' }, minAge: 11, maxAge: 13, emoji: '🧑' },
  { id: 'siddhi', label: { ta: 'சித்தி கணேசா', en: 'Siddhi Ganesha' }, minAge: 14, maxAge: 16, emoji: '🎓' },
];

/* ── Badges ── */

export const BADGES: Badge[] = [
  {
    id: 'first-step',
    name: { ta: 'முதல் அடி', en: 'First Step' },
    emoji: '🌟',
    description: { ta: 'முதல் நாள் பாடம் முடித்தீர்கள்!', en: 'Completed Day 1 lesson!' },
    requirement: 'day_1_complete',
    color: '#FFD700',
  },
  {
    id: 'melody-maker',
    name: { ta: 'இசைக் கலைஞர்', en: 'Melody Maker' },
    emoji: '🎵',
    description: { ta: 'முதல் ஒலிப்பதிவு செய்தீர்கள்!', en: 'Recorded your first audio!' },
    requirement: 'first_recording',
    color: '#FF6B35',
  },
  {
    id: 'week-champion',
    name: { ta: 'வாரச் சிறப்பு', en: 'Week Champion' },
    emoji: '📚',
    description: { ta: 'தொடர்ந்து 7 நாட்கள் கற்றீர்கள்!', en: '7 consecutive days of learning!' },
    requirement: 'streak_7',
    color: '#4CAF50',
  },
  {
    id: 'streak-star',
    name: { ta: 'தொடர் நட்சத்திரம்', en: 'Streak Star' },
    emoji: '🔥',
    description: { ta: '14 நாட்கள் தொடர் கற்றல்!', en: '14 days consecutive streak!' },
    requirement: 'streak_14',
    color: '#E23D28',
  },
  {
    id: 'halfway-hero',
    name: { ta: 'பாதிப் பயண வீரர்', en: 'Halfway Hero' },
    emoji: '🏅',
    description: { ta: '28 நாட்கள் முடித்தீர்கள்!', en: 'Reached Day 28 — halfway there!' },
    requirement: 'day_28_complete',
    color: '#9C27B0',
  },
  {
    id: 'diamond-learner',
    name: { ta: 'வைரக் கற்பவர்', en: 'Diamond Learner' },
    emoji: '💎',
    description: { ta: 'அனைத்து கற்றல் நாட்களும் முடிந்தன!', en: 'Completed all learning days!' },
    requirement: 'all_learning_complete',
    color: '#00BCD4',
  },
  {
    id: 'voice-devotion',
    name: { ta: 'பக்திக் குரல்', en: 'Voice of Devotion' },
    emoji: '🎤',
    description: { ta: '10+ ஒலிப்பதிவுகள் அனுப்பியுள்ளீர்கள்!', en: 'Submitted 10+ recordings!' },
    requirement: 'recordings_10',
    color: '#FF9800',
  },
  {
    id: 'agaval-master',
    name: { ta: 'அகவல் மாஸ்டர்', en: 'Agaval Master' },
    emoji: '👑',
    description: { ta: 'முழு விநாயகர் அகவலும் கற்றுவிட்டீர்கள்!', en: 'Mastered the entire Vinayagar Agaval!' },
    requirement: 'full_mastery',
    color: '#FF6B35',
  },
  {
    id: 'world-record',
    name: { ta: 'உலக சாதனை', en: 'World Record Participant' },
    emoji: '🏆',
    description: { ta: 'மகா ஒலிப்பு நிகழ்வில் பங்கேற்றீர்கள்!', en: 'Joined the Grand Chanting event!' },
    requirement: 'grand_chanting_joined',
    color: '#D4AF37',
  },
  {
    id: 'star-performer',
    name: { ta: 'நட்சத்திர நிகழ்ச்சி', en: 'Star Performer' },
    emoji: '⭐',
    description: { ta: 'சிறந்த ஒலிப்பதிவுக்காக தேர்வு செய்யப்பட்டீர்கள்!', en: 'Selected as best recording of the day!' },
    requirement: 'random_appreciation',
    color: '#E91E63',
  },
];

/* ── Complete Vinayagar Agaval Verses ── */
/* 72 lines (36 couplets) — Standard Avvaiyar version */

export const ALL_VERSES: VerseLine[] = [
  // Day 1 — Lines 1-4
  { tamil: 'சீதக் களபச் செந்தாமரைப் பூம்', transliteration: 'Seedhak kalabach sendhamaraip poom' },
  { tamil: 'பாதச் சிலம்பு பலவிசை பாடப்', transliteration: 'Paadhach silambu palavisai paadap' },
  { tamil: 'பொன்னரை ஞாணும் பூந்துகில் ஆடையும்', transliteration: 'Ponnarai gnaanum poondhugil aadaiyum' },
  { tamil: 'வன்னமருங்கில் வளர்ந்தழ கெறிப்பப்', transliteration: 'Vannamarungil valarndhazha gerippap' },

  // Day 2 — Lines 5-8
  { tamil: 'பேழை வயிறும் பெரும்பாரக் கோடும்', transliteration: 'Pezhai vayirum perumbaarak kodum' },
  { tamil: 'வேழ முகமும் விளங்குசிந் தூரமும்', transliteration: 'Vezha mugamum vilangusin dhooramum' },
  { tamil: 'அஞ்சு கரமும் அங்குச பாசமும்', transliteration: 'Anju karamum angusa paasamum' },
  { tamil: 'நெஞ்சிற் குடிகொண்ட நீல மேனியும்', transliteration: 'Nenjir kudikonra neela meniyum' },

  // Day 3 — Lines 9-12
  { tamil: 'நான்ற வாயும் நாலிரு புயமும்', transliteration: 'Naandra vaayum naaliru buyamum' },
  { tamil: 'மூன்று கண்ணும் மும்மதச் சுவடும்', transliteration: 'Moondru kannum mummadhach chuvatum' },
  { tamil: 'இரண்டு செவியும் இலங்குபொன் முடியும்', transliteration: 'Irandu seviyum ilangupon mudiyum' },
  { tamil: 'திரண்டமுப் புரிநூல் திகழொளி மார்பும்', transliteration: 'Thirandamup purinool thigazholi maarbum' },

  // Day 4 — Lines 13-16
  { tamil: 'சொற்பதம் கடந்த துரியமெய்ஞ் ஞான', transliteration: 'Sorpadham kadandha thuriyameigng gnaana' },
  { tamil: 'அற்புதம் நின்ற கற்பகக் களிறே', transliteration: 'Arputham nindra karpagak kalire' },
  { tamil: 'முப்பழம் நுகரும் மூஷிக வாகனா', transliteration: 'Muppazham nugarum mooshiga vaaganaa' },
  { tamil: 'இப்பொழு தென்னை ஆட்கொள்ள வேண்டித்', transliteration: 'Ippozhu thennai aatkolla vendith' },

  // Day 5 — Lines 17-20
  { tamil: 'தாயாய் எனக்குத் தானெழுந் தருளி', transliteration: 'Thaayaai enakkuth thaanezhun dharuli' },
  { tamil: 'மாயாப் பிறவி மயக்கம் அறுத்தே', transliteration: 'Maayaap piravi mayakkam aruthe' },
  { tamil: 'திருந்திய முதலைந் தெழுத்தும் தெளிவாய்ப்', transliteration: 'Thirundhiya mudhalainh thezhuthum thelivaayp' },
  { tamil: 'பொருந்தவே வந்தென் உளந்தனில் புகுந்து', transliteration: 'Porundhave vandhenn ulanthanil pugundhu' },

  // Day 6 — Lines 21-24
  { tamil: 'குருவடி வாகிக் குவலயந் தன்னில்', transliteration: 'Guruvadi vaagik kuvalayam thannil' },
  { tamil: 'திருவடி வைத்துத் திறமிது பொருளென', transliteration: 'Thiruvadi vaiththuth thiramidhu porulena' },
  { tamil: 'வாடா வகைதான் மகிழ்ந்தெனக் கருளிக்', transliteration: 'Vaadaa vagaidhaan magizhndhenak karuli' },
  { tamil: 'கோடா யுதத்தால் கொடுவினை களைந்தே', transliteration: 'Kodaa yudhaththaal koduvinai kalainthe' },

  // Day 7 — Lines 25-28
  { tamil: 'உவட்டா உபதேசம் புகட்டியென் செவியில்', transliteration: 'Uvattaa upadesam pugattien seviyil' },
  { tamil: 'தெவிட்டாத ஞானத் தெளிவையுங் காட்டி', transliteration: 'Thevittaadha gnaanath thelivaiyung kaatti' },
  { tamil: 'ஐம்புலன் தன்னை அடக்கும் உபாயம்', transliteration: 'Aimpulan thannai adakkum ubaayam' },
  { tamil: 'இன்புறு கருணையின் இனிதெனக் கருளிக்', transliteration: 'Inburu karunaiyin inidhanak karulik' },

  // Day 8 — Lines 29-32
  { tamil: 'கருவிக ளொடுங்கும் கருத்தினை யறிவித்து', transliteration: 'Karuvig alodungum karuththinai yarivitthu' },
  { tamil: 'இருவினை தன்னை அறுத்திருள் கடிந்து', transliteration: 'Iruvinai thannai aruththirul kadindhu' },
  { tamil: 'தலமொரு நான்கும் தந்தெனக் கருளி', transliteration: 'Thalamoru naangum thanthanak karuli' },
  { tamil: 'மலமொரு மூன்றின் மயக்கம் அறுத்தே', transliteration: 'Malamoru moondrin mayakkam aruthe' },

  // Day 9 — Lines 33-36
  { tamil: 'ஒன்பது வாயில் ஒருமந் திரத்தால்', transliteration: 'Onbadhu vaayil oruman thirathaal' },
  { tamil: 'ஐம்புலக் கதவை அடைப்பதுங் காட்டி', transliteration: 'Aimpulak kadhavai adaippadhung kaatti' },
  { tamil: 'ஆறா தாரத்து அங்குச நிலையும்', transliteration: 'Aaraa dhaaraththu angusa nilaiyum' },
  { tamil: 'பேறா நிறுத்திப் பேச்சுரை யறுத்தே', transliteration: 'Peraa niruththip pechurai yaruthe' },

  // Day 10 — Lines 37-40
  { tamil: 'இடைபிங் கலையின் எழுத்தறி வித்துக்', transliteration: 'Idaiping kalaiyin ezhuthhari viththuk' },
  { tamil: 'கடையிற் சுழுமுனைக் கபாலமும் காட்டி', transliteration: 'Kadaiyir suzhumunaik kapalamum kaatti' },
  { tamil: 'மூன்றுமண் டலத்தின் முட்டிய தூணின்', transliteration: 'Moondru man dalaththin muttiya thoonin' },
  { tamil: 'நான்றெழு பாம்பின் நாவில் உணர்த்திக்', transliteration: 'Naandrezhu paambin naavil unarththik' },

  // Day 11 — Lines 41-44
  { tamil: 'குண்டலி யதனிற் கூடிய அசபை', transliteration: 'Kundali yadhanir koodiya asabai' },
  { tamil: 'விண்டெழு மந்திரம் வெளிப்பட உரைத்து', transliteration: 'Vindezhu mandhiram velippada uraiththu' },
  { tamil: 'மூலா தாரத்தின் மூண்டெழு கனலைக்', transliteration: 'Moolaa dhaaraththin moondezhu kanalaik' },
  { tamil: 'காலால் எழுப்பும் கருத்தறி வித்தே', transliteration: 'Kaalaal ezhuppum karuththari viththae' },

  // Day 12 — Lines 45-48
  { tamil: 'அமுத நிலையும் ஆதித்தன் இயக்கமும்', transliteration: 'Amudha nilaiyum aadhiththan iyakkamum' },
  { tamil: 'குமுத சகாயன் குணத்தையுங் கூறி', transliteration: 'Kumudha sagaayan gunaththaiyung koori' },
  { tamil: 'இடைச்சக் கரத்தின் ஈரெட்டு நிலையும்', transliteration: 'Idaichak karaththin eerettu nilaiyum' },
  { tamil: 'உடற்சக் கரத்தின் உறுப்பையுங் காட்டி', transliteration: 'Udarsak karaththin uruppiyung kaatti' },

  // Day 13 — Lines 49-52
  { tamil: 'சண்முக தூலமும் சதுர்முக சூக்கமும்', transliteration: 'Shanmuga thoolamum sadhur muga sookmamum' },
  { tamil: 'எண்முகமாக இனிதெனக் கருளிப்', transliteration: 'Enmugamaaga inidhenak karulip' },
  { tamil: 'புரியட்ட காயம் புலப்பட எனக்குத்', transliteration: 'Puriyatta kaayam pulappada enakkuth' },
  { tamil: 'தெரியெட்டு நிலையும் தெரிசனப் படுத்தி', transliteration: 'Theriyettu nilaiyum dharisanap paduththi' },

  // Day 14 — Lines 53-56
  { tamil: 'கருத்தினிற் கபால வாயில் காட்டி', transliteration: 'Karuththinil kabala vaayil kaatti' },
  { tamil: 'இருத்தி முத்தி யினிதெனக் கருளி', transliteration: 'Iruththi muththi yinidhanak karuli' },
  { tamil: 'என்னை யறிவித்து எனக்கருள் செய்து', transliteration: 'Ennai yarivitthu enakkarul seydhu' },
  { tamil: 'முன்னை வினையின் முடிச்சையும் அவிழ்த்துப்', transliteration: 'Munnai vinaiyin mudichiyum avizhththup' },

  // Day 15 — Lines 57-60
  { tamil: 'பண்டை நாளிற் பயின்ற பொருளைக்', transliteration: 'Pandai naalir payindra porulai' },
  { tamil: 'கண்டினுள்ளே கதிர்ப்பட வைத்து', transliteration: 'Kandinulle kadhirppada vaiththu' },
  { tamil: 'ஆறு நிலையின் அதுவது வாகி', transliteration: 'Aaru nilaiyin adhuvathu vaagi' },
  { tamil: 'பேறு நெறியில் பெருநெறி யருளிக்', transliteration: 'Peru neriyil peruneri yaruli' },

  // Day 16 — Lines 61-64
  { tamil: 'கட்டவிழ் ஞானக் கனிசுவை தோற்றி', transliteration: 'Kattavizh gnaanak kanisuvai thotri' },
  { tamil: 'எட்டிரண் டும்ஓர் மிட்டுநிலை காட்டி', transliteration: 'Ettiran dumor mittunilai kaatti' },
  { tamil: 'மாம்பழ மொன்று வழங்கினை யவ்வழி', transliteration: 'Maampazha mondru vazhangini avvazhi' },
  { tamil: 'நான்பழம் உண்டு நாடகங் கண்டேன்', transliteration: 'Naanpazham undu naadagam kanden' },

  // Day 17 — Lines 65-68
  { tamil: 'தித்திக்கும் தேனைப் பெருக்கித் தெவிட்டா', transliteration: 'Thiththikkum thenaip perukkith thevittaa' },
  { tamil: 'முத்திக் கனியை முழுதும் புசிப்பித்து', transliteration: 'Muththik kaniyai muzhuthum busippiththu' },
  { tamil: 'இன்னமு தூட்டி எனக்கருள் புரிந்த', transliteration: 'Innamu thoothi enakkarul purindha' },
  { tamil: 'கற்பகத் தருவே கண்கண்ட தெய்வமே', transliteration: 'Karpagath tharuve kankanda dheyvame' },

  // Day 18 — Lines 69-72
  { tamil: 'நற்பதம் உதவி நான்மறை யோர்களும்', transliteration: 'Narpadham udhavi naanmarai yorgalum' },
  { tamil: 'சொற்பதம் கடந்த சொரூபானந் தத்தில்', transliteration: 'Sorpadham kadandha soroopaa nandhaththil' },
  { tamil: 'சிற்பர ஆனந்தச் செந்தழல் வண்ணா', transliteration: 'Sirpara aanandha sendhazhzal vannaa' },
  { tamil: 'அற்புத நடனம் ஆடும் கணபதியே', transliteration: 'Arputha nadanam aadum ganapadhiye' },
];

/* ── 56-Day Program Schedule ── */

function buildSchedule(): DayLesson[] {
  const schedule: DayLesson[] = [];
  const totalLearningDays = 18;

  // Phase 1: Learning (Days 1-18) — 4 new lines per day
  for (let d = 1; d <= totalLearningDays; d++) {
    const startIdx = (d - 1) * 4;
    const lines = ALL_VERSES.slice(startIdx, startIdx + 4);
    schedule.push({
      day: d,
      phase: 'learning',
      phaseName: { ta: 'கற்றல்', en: 'Learning' },
      phaseEmoji: '🌱',
      lines,
      meaning: MEANINGS[d - 1] || { ta: '', en: '' },
      instruction: {
        ta: `காலை: புதிய 4 வரிகளை கற்றுக்கொள்ளுங்கள். மாலை: அதே வரிகளை மீண்டும் சொல்லுங்கள்.`,
        en: `Morning: Learn the 4 new lines. Evening: Repeat the same lines.`,
      },
    });
  }

  // Phase 2: Revision (Days 19-36) — Revise previous learning in blocks
  for (let d = 19; d <= 36; d++) {
    const revBlock = Math.floor((d - 19) / 2);
    const revStart = revBlock * 4;
    const revEnd = Math.min(revStart + 8, ALL_VERSES.length);
    const revisionLines = ALL_VERSES.slice(revStart, revEnd);
    const revDays = [revBlock * 2 + 1, revBlock * 2 + 2].filter(x => x <= totalLearningDays);
    schedule.push({
      day: d,
      phase: 'revision',
      phaseName: { ta: 'மீட்டல்', en: 'Revision' },
      phaseEmoji: '🔄',
      lines: revisionLines,
      meaning: { ta: 'முன்பு கற்ற வரிகளை மீட்டுப்பார்க்கவும்', en: 'Revise previously learned lines' },
      revisionDays: revDays,
      instruction: {
        ta: `நாள் ${revDays.join(' & ')} இல் கற்ற வரிகளை மீண்டும் சொல்லுங்கள். ஒலிப்பதிவு செய்யுங்கள்.`,
        en: `Revise lines from Day ${revDays.join(' & ')}. Record yourself reciting.`,
      },
    });
  }

  // Phase 3: Practice (Days 37-50) — Full section recitation
  for (let d = 37; d <= 50; d++) {
    const sectionSize = Math.min(((d - 36) * 6), ALL_VERSES.length);
    const practiceLines = ALL_VERSES.slice(0, sectionSize);
    schedule.push({
      day: d,
      phase: 'practice',
      phaseName: { ta: 'பயிற்சி', en: 'Practice' },
      phaseEmoji: '💪',
      lines: practiceLines.slice(-8),  // Show last 8 lines as focus, full recitation expected
      meaning: { ta: 'முழு பகுதியை தொடர்ந்து சொல்லுங்கள்', en: 'Recite the growing section continuously' },
      instruction: {
        ta: `வரி 1 முதல் ${sectionSize} வரை தொடர்ந்து சொல்லுங்கள். படிப்படியாக முழு அகவலையும் சொல்லப் பழகுங்கள்.`,
        en: `Recite lines 1 to ${sectionSize} continuously. Gradually build up to the full Agaval.`,
      },
    });
  }

  // Phase 4: Rehearsal (Days 51-55) — Full Agaval recitation
  for (let d = 51; d <= 55; d++) {
    schedule.push({
      day: d,
      phase: 'rehearsal',
      phaseName: { ta: 'ஒத்திகை', en: 'Rehearsal' },
      phaseEmoji: '⭐',
      lines: ALL_VERSES.slice(0, 8), // Show first 8 as reminder, full recitation expected
      meaning: { ta: 'முழு விநாயகர் அகவலை ஒப்பிக்கவும்', en: 'Recite the complete Vinayagar Agaval' },
      instruction: {
        ta: `முழு 72 வரிகளையும் ஒரே மூச்சில் சொல்ல பழகுங்கள். ஒலிப்பதிவு செய்து அனுப்புங்கள்!`,
        en: `Practice reciting all 72 lines fluently. Record and submit your full recitation!`,
      },
    });
  }

  // Day 56: Grand Chanting Day
  schedule.push({
    day: 56,
    phase: 'grand-chanting',
    phaseName: { ta: 'மகா ஒலிப்பு', en: 'Grand Chanting' },
    phaseEmoji: '🏆',
    lines: ALL_VERSES.slice(0, 4), // Show opening lines
    meaning: { ta: 'உலக சாதனை நாள்! அனைவரும் ஒன்றாக சொல்வோம்!', en: 'World Record Day! Everyone chants together!' },
    instruction: {
      ta: `🏆 இன்று மகா ஒலிப்பு நாள்! குறிப்பிட்ட நேரத்தில் அனைவரும் ஒன்றாக விநாயகர் அகவலை சொல்வோம்!`,
      en: `🏆 Today is the Grand Chanting Day! At the scheduled time, everyone chants the Vinayagar Agaval together!`,
    },
  });

  return schedule;
}

/* ── Meanings for each learning day (4 lines) ── */

const MEANINGS: { ta: string; en: string }[] = [
  {
    ta: 'குளிர்ந்த சந்தனம் பூசிய செந்தாமரை மலர் போன்ற திருப்பாதங்களில் சிலம்புகள் பலவிதமான இசையை எழுப்ப, பொன் அரைஞாணும் பூவேலைப்பாடுடைய ஆடையும் அழகிய இடையில் விளங்க...',
    en: 'With cool sandalwood paste adorning lotus-like feet, anklets singing many musical notes, golden waistband and flower-embroidered garments shining at the beautiful waist...',
  },
  {
    ta: 'பெரிய வயிறும் பெரும் கொம்பும், யானை முகமும் ஒளிரும் சிந்தூரமும், ஐந்து கைகளும் அங்குசம் பாசமும், நெஞ்சில் குடிகொண்ட நீல நிற உடலும்...',
    en: 'With a large belly and grand tusk, elephant face gleaming with vermillion, five hands holding goad and noose, the blue-hued body dwelling in the heart...',
  },
  {
    ta: 'தொங்கும் வாயும் எட்டு தோள்களும், மூன்று கண்களும் மூன்று மதச் சுவடுகளும், இரண்டு காதுகளும் ஒளிரும் பொன் கிரீடமும், உருண்டை முப்புரி நூலும் ஒளிரும் மார்பும்...',
    en: 'With hanging mouth and eight shoulders, three eyes and three lines of ichor, two ears and shining golden crown, twisted sacred thread on the glowing chest...',
  },
  {
    ta: 'சொல்லுக்கு அப்பாற்பட்ட துரிய மெய்ஞ்ஞான அற்புதமே! கற்பக மரம் போன்ற களிறே! மூன்று பழங்களை உண்ணும் மூஷிக வாகனா! இப்பொழுது என்னை ஆட்கொள்ள வேண்டி...',
    en: 'O wonder of the supreme true knowledge beyond words! O wish-fulfilling elephant! O rider of the mouse who enjoys three fruits! Desiring to claim me now...',
  },
  {
    ta: 'தாயாக எனக்கு எழுந்தருளி, மாயையான பிறவி மயக்கத்தை அறுத்து, திருந்திய முதல் ஐந்து எழுத்தும் தெளிவாக பொருந்தி வந்து என் உள்ளத்தில் புகுந்து...',
    en: 'Rising as my mother, cutting the delusion of illusory birth, the refined five primal letters clearly entering and dwelling in my heart...',
  },
  {
    ta: 'குரு வடிவமாகி இவ்வுலகில் திருவடி வைத்து, இதுதான் உண்மைப் பொருள் என்று வாடாத வகையில் மகிழ்ச்சியுடன் அருளி, கோடாயுதத்தால் தீவினைகளை நீக்கி...',
    en: 'Assuming the form of Guru, placing sacred feet on this earth, graciously revealing the true meaning with unfading joy, removing evil karma with the axe...',
  },
  {
    ta: 'சலிக்காத உபதேசத்தை என் செவியில் புகட்டி, தெவிட்டாத ஞானத் தெளிவையும் காட்டி, ஐந்து புலன்களை அடக்கும் வழியை இன்பமான கருணையுடன் இனிமையாக அருளி...',
    en: 'Pouring unfailing teachings in my ears, showing the clarity of inexhaustible wisdom, graciously revealing the way to control the five senses with blissful compassion...',
  },
  {
    ta: 'கருவிகள் ஒடுங்கும் கருத்தினை அறிவித்து, இருவினையை அறுத்து இருள் கடிந்து, நான்கு தலங்களையும் தந்தருளி, மூன்று மலங்களின் மயக்கத்தை அறுத்தே...',
    en: 'Revealing the thought where instruments dissolve, cutting both karmas and dispelling darkness, granting the four sacred grounds, breaking the illusion of the three impurities...',
  },
  {
    ta: 'ஒன்பது வாயில்களில் ஒரு மந்திரத்தால் ஐந்து புலன்களின் கதவை அடைப்பதைக் காட்டி, ஆறு ஆதாரங்களில் அங்குச நிலையையும் பேற்றை நிறுத்திப் பேச்சுரையை அறுத்தே...',
    en: 'Showing how to close the five sense-doors through one mantra at nine gates, establishing the goad-state in six chakras, stopping speech and cutting discourse...',
  },
  {
    ta: 'இடகலை பிங்கலையின் எழுத்தை அறிவித்து, கடையில் சுழுமுனை கபாலத்தையும் காட்டி, மூன்று மண்டலத்தின் பொருந்திய தூணில் உயர்ந்தெழும் பாம்பின் நாவில் உணர்த்தி...',
    en: 'Teaching the letter of Ida and Pingala channels, showing the Sushumna and the skull, in the pillar joined at three spheres, awakening at the tongue of the rising serpent...',
  },
  {
    ta: 'குண்டலினியில் கூடிய அசபை, வெடித்தெழும் மந்திரத்தை வெளிப்பட உரைத்து, மூலாதாரத்தின் மூண்டெழு நெருப்பை காலால் எழுப்பும் கருத்தை அறிவித்தே...',
    en: 'Revealing the Ajapa joined in Kundalini, openly stating the bursting mantra, teaching the art of raising the fire from Mooladhara through breath...',
  },
  {
    ta: 'அமுத நிலையும் சூரியனின் இயக்கமும், சந்திரனின் குணத்தையும் கூறி, இடைச் சக்கரத்தின் பதினாறு நிலைகளையும், உடல் சக்கரத்தின் உறுப்புகளையும் காட்டி...',
    en: 'Describing the state of nectar and the sun\'s movement, explaining the moon\'s quality, showing sixteen states of the middle wheel and the parts of the body wheel...',
  },
  {
    ta: 'ஆறுமுக தூலமும் நான்முக சூக்கமும் எட்டு முகமாக இனிமையாக அருளி, எட்டுவகை உடலும் புலப்பட எனக்கு எட்டு நிலைகளையும் காட்சிப்படுத்தி...',
    en: 'Graciously revealing six-faced gross and four-faced subtle as eight faces, showing me the eight-fold body and displaying the eight states...',
  },
  {
    ta: 'கருத்தினில் கபால வாயிலைக் காட்டி, அங்கு முக்தியை இருத்தி இனிமையாக அருளி, என்னை எனக்கே அறிவித்து அருள் செய்து, முன்வினையின் கட்டுகளையும் அவிழ்த்து...',
    en: 'Showing the skull-gate in the mind, establishing liberation there graciously, revealing myself to me and granting grace, untying the knots of past karma...',
  },
  {
    ta: 'பண்டைய நாளில் பயின்ற பொருளை உள்ளே கதிர்போல ஒளிரவைத்து, ஆறு நிலைகளின் அந்த நிலையாகி, பேறு நெறியில் பெரும் நெறியை அருளி...',
    en: 'Placing the long-practiced truth to shine like a ray within, becoming that state of the six stages, granting the great path in the way of attainment...',
  },
  {
    ta: 'கட்டவிழ் ஞானக் கனியின் சுவையை தோற்றுவித்து, எட்டும் இரண்டும் ஒன்றான நிலையைக் காட்டி, ஒரு மாம்பழத்தை வழங்கினை, அவ்வழியில் நான் பழம் உண்டு ஆனந்தக் காட்சி கண்டேன்...',
    en: 'Revealing the taste of the knowledge-fruit that unties bonds, showing the state where eight and two become one, granting a mango — eating that fruit, I witnessed the divine spectacle...',
  },
  {
    ta: 'இனிக்கும் தேனைப் பெருக்கி தெவிட்டாத முக்திக் கனியை முழுதும் உண்ணவைத்து, அமுதம் ஊட்டி எனக்கு அருள் புரிந்த கற்பக விருட்சமே! கண்கண்ட தெய்வமே!',
    en: 'Multiplying the sweet honey, having me consume the inexhaustible fruit of liberation fully, feeding me nectar — O wish-fulfilling tree! O God whom my eyes have seen!',
  },
  {
    ta: 'நல்ல பதவியை அளித்து, நான்மறை அறிஞர்களும் சொல்லுக்கு அப்பாற்பட்ட ஆனந்தத்தில், சிற்பர ஆனந்தமான செந்தழல் நிறமுடைய அற்புத நடனம் ஆடும் கணபதியே!',
    en: 'Granting the noble state, where even Vedic scholars dwell in bliss beyond words — O Ganapathi of supreme bliss with flame-red hue, dancing the wondrous dance!',
  },
];

export const PROGRAM_SCHEDULE = buildSchedule();

/* ── Grand Chanting Event Config ── */
export const GRAND_CHANTING_EVENT = {
  title: { ta: 'மகா ஒலிப்பு — உலக சாதனை முயற்சி', en: 'Grand Chanting — World Record Attempt' },
  description: {
    ta: 'அனைத்து பங்கேற்பாளர்களும் ஒரே நேரத்தில் விநாயகர் அகவலை ஒன்றாக சொல்வோம்!',
    en: 'All participants chant Vinayagar Agaval together at the same time!',
  },
  // Configurable date — admin can update this
  eventDate: '2026-05-22T06:00:00+05:30',
  eventDateDisplay: { ta: '22 மே 2026, காலை 6:00 மணி', en: 'May 22, 2026 at 6:00 AM IST' },
};

/* ── Program Info ── */
export const PROGRAM_INFO = {
  title: { ta: 'விநாயகர் அகவல் கற்றல் பயணம்', en: 'Vinayagar Agaval Learning Journey' },
  subtitle: { ta: '"என் நண்பன் கணேசா" கற்றல் திட்டம்', en: '"My Friend Ganesha" Learning Program' },
  totalDays: 56,
  totalLines: ALL_VERSES.length,
  linesPerDay: 4,
  description: {
    ta: '56 நாட்களில் விநாயகர் அகவலை முழுமையாக கற்றுக்கொள்ளுங்கள்! தினமும் காலை 4 வரிகள் கற்று, மாலை மீண்டும் சொல்லுங்கள். ஒலிப்பதிவு செய்து, பேட்ஜ்கள் பெறுங்கள்!',
    en: 'Master the complete Vinayagar Agaval in 56 days! Learn 4 lines every morning, repeat them in the evening. Record yourself, earn badges, and join the world record attempt!',
  },
  worldRecord: {
    ta: '🏆 இலக்கு: அதிகமான குழந்தைகள் ஒரே நேரத்தில் விநாயகர் அகவல் சொல்லும் உலக சாதனை!',
    en: '🏆 Goal: World record for the most children chanting Vinayagar Agaval simultaneously!',
  },
  benefits: {
    ta: [
      'மேம்பட்ட கவனம் & ஒருநிலைப்பாடு',
      'அறிவு வளர்ச்சி & புத்திக்கூர்மை',
      'நினைவாற்றல் & நினைவுத்திறன் மேம்படும்',
      'மனஅமைதி & நிலைத்தன்மை',
      'தடைகளை நீக்கும் தன்னம்பிக்கை',
      'ஒழுங்குமுறை & சுய கட்டுப்பாடு',
      'சுயமரியாதை & தன்னம்பிக்கை வளர்ச்சி',
      'பக்தி & ஆன்மீக விழிப்புணர்வு',
      'தமிழ் மொழி அறிவு & உச்சரிப்பு',
      'கட்டமைக்கப்பட்ட கற்றல் திறன்',
    ],
    en: [
      'Enhanced Focus & Concentration',
      'Intellectual Growth & Sharpness',
      'Improved Memory & Recall',
      'Mental Calmness & Inner Peace',
      'Removes Obstacles & Builds Confidence',
      'Fosters Discipline & Self-Control',
      'Boosts Self-Esteem & Self-Worth',
      'Encourages Devotion & Spiritual Awareness',
      'Tamil Language Knowledge & Pronunciation',
      'Structured Learning Skills from Young Age',
    ],
  },
  benefitCategories: [
    {
      icon: '🧠',
      title: { ta: 'அறிவு வளர்ச்சி', en: 'Intellectual Growth' },
      items: {
        ta: ['மேம்பட்ட நினைவாற்றல்', 'கவனம் & ஒருநிலைப்பாடு', 'புத்திக்கூர்மை & பகுப்பாய்வு திறன்'],
        en: ['Improved memory & recall', 'Enhanced focus & concentration', 'Sharpened analytical thinking'],
      },
    },
    {
      icon: '🧘',
      title: { ta: 'மன வளர்ச்சி', en: 'Mental Wellness' },
      items: {
        ta: ['மனஅமைதி & நிலைத்தன்மை', 'மன அழுத்தம் குறையும்', 'உணர்ச்சிக் கட்டுப்பாடு'],
        en: ['Mental calmness & stability', 'Reduced anxiety & stress', 'Emotional regulation'],
      },
    },
    {
      icon: '💪',
      title: { ta: 'ஆளுமை வளர்ச்சி', en: 'Personality Development' },
      items: {
        ta: ['ஒழுங்குமுறை & சுய கட்டுப்பாடு', 'சுயமரியாதை & தன்னம்பிக்கை', 'தடைகளை எதிர்கொள்ளும் திடம்'],
        en: ['Discipline & self-control', 'Self-esteem & confidence', 'Resilience to overcome obstacles'],
      },
    },
    {
      icon: '🙏',
      title: { ta: 'ஆன்மீக வளர்ச்சி', en: 'Spiritual Growth' },
      items: {
        ta: ['பக்தி & ஆன்மீக விழிப்புணர்வு', 'நன்றியுணர்வு & பணிவு', 'சிறு வயதிலேயே ஆன்மீக அடிப்படை'],
        en: ['Devotion & spiritual awareness', 'Gratitude & humility', 'Spiritual foundation from young age'],
      },
    },
  ],
};
