/**
 * MANA CALENDAR 2027 — CENTRAL LOCALIZATION DICTIONARY
 * Complete English, Telugu & Bilingual Support for Calendar & Panchangam Engine
 */

import type { LanguagePreference } from '@mana/types';

export interface I18nItem {
  en: string;
  te: string;
}

export const MONTHS: I18nItem[] = [
  { en: 'January', te: 'జనవరి' },
  { en: 'February', te: 'ఫిబ్రవరి' },
  { en: 'March', te: 'మార్చి' },
  { en: 'April', te: 'ఏప్రిల్' },
  { en: 'May', te: 'మే' },
  { en: 'June', te: 'జూన్' },
  { en: 'July', te: 'జూలై' },
  { en: 'August', te: 'ఆగస్టు' },
  { en: 'September', te: 'సెప్టెంబరు' },
  { en: 'October', te: 'అక్టోబరు' },
  { en: 'November', te: 'నవంబరు' },
  { en: 'December', te: 'డిసెంబరు' },
];

export const WEEKDAYS: { full: I18nItem; short: I18nItem }[] = [
  { full: { en: 'Sunday', te: 'ఆదివారం' }, short: { en: 'Sun', te: 'ఆది' } },
  { full: { en: 'Monday', te: 'సోమవారం' }, short: { en: 'Mon', te: 'సోమ' } },
  { full: { en: 'Tuesday', te: 'మంగళవారం' }, short: { en: 'Tue', te: 'మంగళ' } },
  { full: { en: 'Wednesday', te: 'బుధవారం' }, short: { en: 'Wed', te: 'బుధ' } },
  { full: { en: 'Thursday', te: 'గురువారం' }, short: { en: 'Thu', te: 'గురు' } },
  { full: { en: 'Friday', te: 'శుక్రవారం' }, short: { en: 'Fri', te: 'శుక్ర' } },
  { full: { en: 'Saturday', te: 'శనివారం' }, short: { en: 'Sat', te: 'శని' } },
];

export const TELUGU_MASAMS: I18nItem[] = [
  { en: 'Chaitram', te: 'చైత్రం' },
  { en: 'Vaishakham', te: 'వైశాఖం' },
  { en: 'Jyeshtham', te: 'జ్యేష్ఠం' },
  { en: 'Ashadham', te: 'ఆషాఢం' },
  { en: 'Shravanam', te: 'శ్రావణం' },
  { en: 'Bhadrapadam', te: 'భాద్రపదం' },
  { en: 'Ashwayujam', te: 'ఆశ్వయుజం' },
  { en: 'Karthikam', te: 'కార్తీకం' },
  { en: 'Margashirsham', te: 'మార్గశిర' },
  { en: 'Pushyam', te: 'పుష్యం' },
  { en: 'Magham', te: 'మాఘం' },
  { en: 'Phalgunam', te: 'ఫాల్గుణం' },
];

export const RUTUVUS: I18nItem[] = [
  { en: 'Vasanta Rutuvu', te: 'వసంత ఋతువు' },
  { en: 'Greeshma Rutuvu', te: 'గ్రీష్మ ఋతువు' },
  { en: 'Varsha Rutuvu', te: 'వర్ష ఋతువు' },
  { en: 'Sharad Rutuvu', te: 'శరద్ ఋతువు' },
  { en: 'Hemanta Rutuvu', te: 'హేమంత ఋతువు' },
  { en: 'Shishira Rutuvu', te: 'శిశిర ఋతువు' },
];

export const AYANAMS: I18nItem[] = [
  { en: 'Uttarayanam', te: 'ఉత్తరాయణం' },
  { en: 'Dakshinayanam', te: 'దక్షిణాయనం' },
];

export const PAKSHAMS: I18nItem[] = [
  { en: 'Shukla Paksham', te: 'శుక్ల పక్షం' },
  { en: 'Krishna Paksham', te: 'కృష్ణ పక్షం' },
];

export const TITHIS: I18nItem[] = [
  { en: 'Pratipada / Padyami', te: 'పాడ్యమి' },
  { en: 'Dwitiya / Vidiya', te: 'విదియ' },
  { en: 'Tritiya / Thadiya', te: 'తదియ' },
  { en: 'Chaturthi / Chavithi', te: 'చవితి' },
  { en: 'Panchami', te: 'పంచమి' },
  { en: 'Shashthi', te: 'షష్ఠి' },
  { en: 'Saptami', te: 'సప్తమి' },
  { en: 'Ashtami', te: 'అష్టమి' },
  { en: 'Navami', te: 'నవమి' },
  { en: 'Dashami', te: 'దశమి' },
  { en: 'Ekadashi', te: 'ఏకాదశి' },
  { en: 'Dwadashi', te: 'ద్వాదశి' },
  { en: 'Trayodashi', te: 'త్రయోదశి' },
  { en: 'Chaturdashi', te: 'చతుర్దశి' },
  { en: 'Purnima (Pournami)', te: 'పౌర్ణమి' },
  { en: 'Amavasya', te: 'అమావాస్య' },
];

export const NAKSHATRAS: I18nItem[] = [
  { en: 'Ashwini', te: 'అశ్విని' },
  { en: 'Bharani', te: 'భరణి' },
  { en: 'Krittika', te: 'కృత్తిక' },
  { en: 'Rohini', te: 'రోహిణి' },
  { en: 'Mrigashira', te: 'మృగశిర' },
  { en: 'Ardra', te: 'ఆర్ద్ర' },
  { en: 'Punarvasu', te: 'పునర్వసు' },
  { en: 'Pushyami', te: 'పుష్యమి' },
  { en: 'Ashlesha', te: 'ఆశ్లేష' },
  { en: 'Magha', te: 'మఘ' },
  { en: 'Purva Phalguni (Pubba)', te: 'పుబ్బ' },
  { en: 'Uttara Phalguni (Uttara)', te: 'ఉత్తర' },
  { en: 'Hasta', te: 'హస్త' },
  { en: 'Chitra', te: 'చిత్త' },
  { en: 'Swati', te: 'స్వాతి' },
  { en: 'Vishakha', te: 'విశాఖ' },
  { en: 'Anuradha', te: 'అనూరాధ' },
  { en: 'Jyeshtha', te: 'జ్యేష్ఠ' },
  { en: 'Mula', te: 'మూల' },
  { en: 'Purva Ashadha', te: 'పూర్వాషాఢ' },
  { en: 'Uttara Ashadha', te: 'ఉత్తరాషాఢ' },
  { en: 'Shravana', te: 'శ్రవణం' },
  { en: 'Dhanishta', te: 'ధనిష్ఠ' },
  { en: 'Shatabhisha', te: 'శతభిషం' },
  { en: 'Purva Bhadrapada', te: 'పూర్వాభాద్ర' },
  { en: 'Uttara Bhadrapada', te: 'ఉత్తరాభాద్ర' },
  { en: 'Revati', te: 'రేవతి' },
];

export const UI_STRINGS: Record<string, I18nItem> = {
  appName: { en: 'Mana Calendar 2027', te: 'మన క్యాలెండర్ 2027' },
  today: { en: 'Today', te: 'నేడు' },
  calendar: { en: 'Calendar', te: 'క్యాలెండర్' },
  panchangam: { en: 'Panchangam', te: 'పంచాంగం' },
  festivals: { en: 'Festivals & Holidays', te: 'పండుగలు & సెలవులు' },
  importantDays: { en: 'Important Days', te: 'ముఖ్యమైన దినాలు' },
  events: { en: 'Personal Events', te: 'వ్యక్తిగత ఈవెంట్లు' },
  addEvent: { en: 'Add Event', te: 'ఈవెంట్ జోడించండి' },
  search: { en: 'Search', te: 'వెతకండి' },
  searchPlaceholder: {
    en: 'Search festival, tithi or date (e.g. Sankranti, Ekadashi)...',
    te: 'పండుగలు, తిథులు లేదా తేదీని వెతకండి (ఉదా: సంక్రాంతి, ఏకాదశి)...',
  },
  location: { en: 'Location', te: 'ప్రాంతం' },
  language: { en: 'Language', te: 'భాష' },
  year: { en: 'Year', te: 'సంవత్సరం' },
  month: { en: 'Month', te: 'మాసం' },
  sunrise: { en: 'Sunrise', te: 'సూర్యోదయం' },
  sunset: { en: 'Sunset', te: 'సూర్యాస్తమయం' },
  moonrise: { en: 'Moonrise', te: 'చంద్రోదయం' },
  moonset: { en: 'Moonset', te: 'చంద్రాస్తమయం' },
  rahuKalam: { en: 'Rahu Kalam', te: 'రాహుకాలం' },
  yamagandam: { en: 'Yamagandam', te: 'యమగండం' },
  gulikaKalam: { en: 'Gulika Kalam', te: 'గుళిక కాలం' },
  abhijitMuhurtham: { en: 'Abhijit Muhurtham', te: 'అభిజిత్ ముహూర్తం' },
  amritaKalam: { en: 'Amrita Kalam', te: 'అమృత ఘడియలు' },
  durmuhurtham: { en: 'Durmuhurtham', te: 'దుర్ముహూర్తం' },
  varjyam: { en: 'Varjyam', te: 'వర్జ్యం' },
  tithi: { en: 'Tithi', te: 'తిథి' },
  nakshatram: { en: 'Nakshatra', te: 'నక్షత్రం' },
  yogam: { en: 'Yoga', te: 'యోగం' },
  karanam: { en: 'Karana', te: 'కరణం' },
  samvatsaram: { en: 'Samvatsaram', te: 'సంవత్సరం' },
  rutuvu: { en: 'Rutuvu', te: 'ఋతువు' },
  ayanam: { en: 'Ayanam', te: 'ఆయనం' },
  paksham: { en: 'Paksham', te: 'పక్షం' },
  shubhTimings: { en: 'Auspicious Timings', te: 'శుభ సమయాలు' },
  ashubhTimings: { en: 'Inauspicious Timings', te: 'అశుభ సమయాలు' },
  noEvents: { en: 'No events scheduled for this day', te: 'ఈ రోజుకు ఎటువంటి ఈవెంట్లు లేవు' },
  noFestivals: { en: 'No major festivals on this date', te: 'ఈ రోజు ప్రత్యేక పండుగలు లేవు' },
  close: { en: 'Close', te: 'మూసివేయి' },
  back: { en: 'Back', te: 'వెనుకకు' },
  holiday: { en: 'Holiday', te: 'సెలవు' },
  governmentHoliday: { en: 'Government / Gazetted Holiday', te: 'ప్రభుత్వ సెలవు దినం' },
  bilingualLabel: { en: 'Telugu + English', te: 'తెలుగు + English' },
};

/**
 * Resolves a bilingual item into the active language preference
 */
export function formatI18n(item: I18nItem, pref: LanguagePreference = 'te_en'): string {
  switch (pref) {
    case 'te':
      return item.te;
    case 'en':
      return item.en;
    case 'te_en':
    default:
      if (item.te && item.en && item.te !== item.en) {
        return `${item.te} (${item.en})`;
      }
      return item.te || item.en;
  }
}

/**
 * Gets localized UI text by dictionary key
 */
export function getUiText(key: string, pref: LanguagePreference = 'te_en'): string {
  const item = UI_STRINGS[key];
  if (!item) return key;
  return formatI18n(item, pref);
}
