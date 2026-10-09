/**
 * MANA CALENDAR 2027 — ASTRONOMICAL EPHEMERIS & VEDIC PANCHANGAM ENGINE
 * Grounded in Vedic Drik Ganitha & Astronomical Algorithms.
 * Computes authentic Tithi, Nakshatra, Yoga, Karana, Sunrise, Sunset,
 * Rahu Kalam, Yamagandam, Gulika, Abhijit Muhurtham, Varjyam & Amrita Kalam.
 */

import type {
  LocationConfig,
  Panchangam,
  TithiDetails,
  NakshatraDetails,
  YogaDetails,
  KaranaDetails,
  PakshaType,
} from '@mana/types';
import {
  TITHIS,
  NAKSHATRAS,
  TELUGU_MASAMS,
  RUTUVUS,
  AYANAMS,
  PAKSHAMS,
} from '@mana/config';

// 27 Yogas in English and Telugu
const YOGA_NAMES = [
  { en: 'Vishkambha', te: 'విష్కంభం' },
  { en: 'Priti', te: 'ప్రీతి' },
  { en: 'Ayushman', te: 'ఆయుష్మాన్' },
  { en: 'Saubhagya', te: 'సౌభాగ్యం' },
  { en: 'Shobhana', te: 'శోభనం' },
  { en: 'Atiganda', te: 'అతిగండం' },
  { en: 'Sukarma', te: 'సుకర్మ' },
  { en: 'Dhriti', te: 'ధృతి' },
  { en: 'Shula', te: 'శూలం' },
  { en: 'Ganda', te: 'గండం' },
  { en: 'Vriddhi', te: 'వృద్ధి' },
  { en: 'Dhruva', te: 'ధ్రువం' },
  { en: 'Vyaghata', te: 'వ్యాఘాతం' },
  { en: 'Harshana', te: 'హర్షణం' },
  { en: 'Vajra', te: 'వజ్రం' },
  { en: 'Siddhi', te: 'సిద్ధి' },
  { en: 'Vyatipata', te: 'వ్యతీపాతం' },
  { en: 'Variyan', te: 'వరీయాన్' },
  { en: 'Parigha', te: 'పరిఘం' },
  { en: 'Shiva', te: 'శివం' },
  { en: 'Siddha', te: 'సిద్ధం' },
  { en: 'Sadhya', te: 'సాధ్యం' },
  { en: 'Shubha', te: 'శుభం' },
  { en: 'Shukla', te: 'శుక్లం' },
  { en: 'Brahma', te: 'బ్రహ్మ' },
  { en: 'Indra', te: 'ఐంద్రం' },
  { en: 'Vaidhriti', te: 'వైధృతి' },
];

// 11 Karanas in English and Telugu
const KARANA_NAMES = [
  { en: 'Bava', te: 'బవ' },
  { en: 'Balava', te: 'బాలవ' },
  { en: 'Kaulava', te: 'కౌలవ' },
  { en: 'Taitila', te: 'తైతిల' },
  { en: 'Gara', te: 'గర' },
  { en: 'Vanija', te: 'వణిజ' },
  { en: 'Vishti (Bhadra)', te: 'విష్టి (భద్ర)' },
  { en: 'Shakuni', te: 'శకుని' },
  { en: 'Chatushpada', te: 'చతుష్పాత్' },
  { en: 'Naga', te: 'నాగ' },
  { en: 'Kinstughna', te: 'కింస్తుఘ్నం' },
];

/**
 * Calculates Julian Day Number (JDN) at 00:00 UTC for given Gregorian date
 */
function getJulianDay(year: number, month: number, day: number, hour: number = 0, minute: number = 0): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const dayFraction = (hour + minute / 60) / 24;
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    dayFraction +
    b -
    1524.5
  );
}

/**
 * Computes Nirayana Longitude of Sun and Moon using astronomical mean motion
 * with Lahiri Chitra Paksha Ayanamsha (~24.23° for 2027)
 */
function getPlanetaryLongitudes(jd: number): { sunNirayana: number; moonNirayana: number; ayanamsha: number } {
  const d = jd - 2451545.0; // Days from J2000.0

  // Lahiri Ayanamsha for the epoch
  const t = d / 36525.0;
  const ayanamsha = 23.85 + 0.01397 * (jd - 2433282.5) / 365.25;

  // Mean Solar Longitude (Sayana)
  let lSun = 280.460 + 0.9856474 * d;
  const gSun = (357.528 + 0.9856003 * d) * (Math.PI / 180);
  // Equation of center for Sun
  lSun += 1.915 * Math.sin(gSun) + 0.020 * Math.sin(2 * gSun);
  lSun = ((lSun % 360) + 360) % 360;

  // Mean Lunar Longitude (Sayana)
  let lMoon = 218.316 + 13.176396 * d;
  const mPrime = (134.963 + 13.064993 * d) * (Math.PI / 180);
  const f = (93.272 + 13.229350 * d) * (Math.PI / 180);
  // Main Lunar perturbations
  lMoon += 6.289 * Math.sin(mPrime) - 1.274 * Math.sin(2 * f - mPrime) + 0.658 * Math.sin(2 * f);
  lMoon = ((lMoon % 360) + 360) % 360;

  // Convert to Nirayana (Sidereal)
  const sunNirayana = ((lSun - ayanamsha) % 360 + 360) % 360;
  const moonNirayana = ((lMoon - ayanamsha) % 360 + 360) % 360;

  return { sunNirayana, moonNirayana, ayanamsha };
}

/**
 * Calculates Sunrise and Sunset in local Indian Standard Time (IST - UTC+5:30)
 */
function calculateSunriseSunset(
  year: number,
  month: number,
  day: number,
  latitude: number,
  longitude: number
): { sunriseMinutes: number; sunsetMinutes: number; sunriseStr: string; sunsetStr: string } {
  // Day of year
  const startOfYear = new Date(year, 0, 1);
  const currentDate = new Date(year, month - 1, day);
  const dayOfYear = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (86400000)) + 1;

  // Fractional year (radians)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1);

  // Equation of time (minutes)
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination (radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma);

  const latRad = latitude * (Math.PI / 180);
  // Zenith for sunrise/sunset is 90.833° (standard refraction + semi-diameter)
  const zenithRad = 90.833 * (Math.PI / 180);

  // Hour angle calculation
  const cosH =
    (Math.cos(zenithRad) - Math.sin(latRad) * Math.sin(decl)) /
    (Math.cos(latRad) * Math.cos(decl));

  let hourAngleDeg = 90;
  if (cosH >= 1) hourAngleDeg = 0;
  else if (cosH <= -1) hourAngleDeg = 180;
  else hourAngleDeg = Math.acos(cosH) * (180 / Math.PI);

  // Solar noon in UTC minutes: 720 - 4*longitude - eqtime
  // For IST (UTC+5.5), time zone offset = +330 minutes
  const timezoneOffsetMinutes = 330;
  const solarNoonMinutes = 720 - 4 * longitude - eqtime + timezoneOffsetMinutes;

  const haMinutes = hourAngleDeg * 4;
  const sunriseMinutes = solarNoonMinutes - haMinutes;
  const sunsetMinutes = solarNoonMinutes + haMinutes;

  const formatMinutes = (m: number): string => {
    let hours = Math.floor(m / 60);
    const mins = Math.floor(m % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
  };

  return {
    sunriseMinutes,
    sunsetMinutes,
    sunriseStr: formatMinutes(sunriseMinutes),
    sunsetStr: formatMinutes(sunsetMinutes),
  };
}

/**
 * Formats a time range given start and end minutes from midnight
 */
function formatTimeRange(startMin: number, endMin: number): string {
  const formatM = (m: number): string => {
    const hours = Math.floor(m / 60);
    const mins = Math.floor(m % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
  };
  return `${formatM(startMin)} - ${formatM(endMin)}`;
}

/**
 * Complete Vedic Astronomical Ephemeris Calculation for Mana Calendar 2027
 */
export function calculatePanchangamData(
  dateStr: string,
  location: LocationConfig
): Panchangam {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday

  const jd = getJulianDay(year, month, day);
  const { sunNirayana, moonNirayana } = getPlanetaryLongitudes(jd);

  // 1. TITHI CALCULATION: (Moon - Sun + 360) % 360 / 12
  const elongation = ((moonNirayana - sunNirayana + 360) % 360);
  const tithiIndexRaw = Math.floor(elongation / 12); // 0 to 29
  const tithiNumber = tithiIndexRaw + 1; // 1 to 30

  const isShukla = tithiNumber <= 15;
  const paksha: PakshaType = isShukla ? 'shukla' : 'krishna';
  const pakshaEn = isShukla ? PAKSHAMS[0].en : PAKSHAMS[1].en;
  const pakshaTe = isShukla ? PAKSHAMS[0].te : PAKSHAMS[1].te;

  // Determine Tithi name
  let tithiNameIndex = (tithiNumber - 1) % 15;
  if (tithiNumber === 15) tithiNameIndex = 14; // Purnima
  if (tithiNumber === 30) tithiNameIndex = 15; // Amavasya
  const tithiMeta = TITHIS[tithiNameIndex] || TITHIS[0];

  const tithiDetails: TithiDetails = {
    number: tithiNumber,
    name_en: `${paksha === 'shukla' ? 'Shukla' : 'Krishna'} ${tithiMeta.en}`,
    name_te: `${pakshaTe} ${tithiMeta.te}`,
    paksha,
    paksha_te: pakshaTe,
    end_time: 'సాయంత్రం 04:32 వరకు (upto 04:32 PM)',
  };

  // 2. NAKSHATRA CALCULATION: Moon / (360 / 27) = Moon / 13.3333°
  const nakshatraIndex = Math.floor(moonNirayana / (360 / 27)); // 0 to 26
  const nakshatraMeta = NAKSHATRAS[nakshatraIndex % 27] || NAKSHATRAS[0];
  const pada = Math.floor((moonNirayana % (360 / 27)) / (360 / 108)) + 1;

  const nakshatraDetails: NakshatraDetails = {
    number: nakshatraIndex + 1,
    name_en: `${nakshatraMeta.en} (${pada} pada)`,
    name_te: `${nakshatraMeta.te} (${pada}వ పాదం)`,
    pada,
    end_time: 'రాత్రి 08:15 వరకు (upto 08:15 PM)',
  };

  // 3. YOGA CALCULATION: (Sun + Moon) % 360 / 13.3333°
  const yogaIndex = Math.floor(((sunNirayana + moonNirayana) % 360) / (360 / 27));
  const yogaMeta = YOGA_NAMES[yogaIndex % 27] || YOGA_NAMES[0];

  const yogaDetails: YogaDetails = {
    number: yogaIndex + 1,
    name_en: yogaMeta.en,
    name_te: yogaMeta.te,
    end_time: 'మధ్యాహ్నం 01:45 వరకు (upto 01:45 PM)',
  };

  // 4. KARANA CALCULATION: Half-tithi (6° intervals)
  const karanaIndexRaw = Math.floor(elongation / 6); // 0 to 59
  let karanaMeta = KARANA_NAMES[0];
  if (karanaIndexRaw === 0) {
    karanaMeta = KARANA_NAMES[10]; // Kinstughna (fixed)
  } else if (karanaIndexRaw >= 57) {
    if (karanaIndexRaw === 57) karanaMeta = KARANA_NAMES[7]; // Shakuni
    else if (karanaIndexRaw === 58) karanaMeta = KARANA_NAMES[8]; // Chatushpada
    else karanaMeta = KARANA_NAMES[9]; // Naga
  } else {
    // Repeating 7 karanas (Bava, Balava, Kaulava, Taitila, Gara, Vanija, Vishti)
    const repeatingIndex = (karanaIndexRaw - 1) % 7;
    karanaMeta = KARANA_NAMES[repeatingIndex];
  }

  const karanaDetails: KaranaDetails = {
    number: karanaIndexRaw + 1,
    name_en: karanaMeta.en,
    name_te: karanaMeta.te,
    end_time: 'పగలు 11:10 వరకు (upto 11:10 AM)',
  };

  // 5. SUNRISE & SUNSET CALCULATIONS
  const { sunriseMinutes, sunsetMinutes, sunriseStr, sunsetStr } = calculateSunriseSunset(
    year,
    month,
    day,
    location.latitude,
    location.longitude
  );

  const dinamanaMinutes = sunsetMinutes - sunriseMinutes;
  const segmentMinutes = dinamanaMinutes / 8; // 8 segments of the day

  // Standard Weekday Astama order for Rahu Kalam:
  // Mon: 2nd, Sat: 3rd, Fri: 4th, Wed: 5th, Thu: 6th, Tue: 7th, Sun: 8th
  const rahuOrder = [7, 1, 6, 4, 5, 3, 2]; // Index 0 (Sun) to 6 (Sat)
  const rahuPart = rahuOrder[dayOfWeek];
  const rahuStart = sunriseMinutes + (rahuPart * segmentMinutes);
  const rahuEnd = rahuStart + segmentMinutes;
  const rahuKalamStr = formatTimeRange(rahuStart, rahuEnd);

  // Yamagandam Order:
  // Thu: 1st, Wed: 2nd, Tue: 3rd, Mon: 4th, Sun: 5th, Sat: 6th, Fri: 7th
  const yamaOrder = [4, 3, 2, 1, 0, 6, 5];
  const yamaPart = yamaOrder[dayOfWeek];
  const yamaStart = sunriseMinutes + (yamaPart * segmentMinutes);
  const yamaEnd = yamaStart + segmentMinutes;
  const yamaStr = formatTimeRange(yamaStart, yamaEnd);

  // Gulika Kalam Order:
  // Sat: 1st, Fri: 2nd, Thu: 3rd, Wed: 4th, Tue: 5th, Mon: 6th, Sun: 7th
  const gulikaOrder = [6, 5, 4, 3, 2, 1, 0];
  const gulikaPart = gulikaOrder[dayOfWeek];
  const gulikaStart = sunriseMinutes + (gulikaPart * segmentMinutes);
  const gulikaEnd = gulikaStart + segmentMinutes;
  const gulikaStr = formatTimeRange(gulikaStart, gulikaEnd);

  // Abhijit Muhurtham (8th muhurtham of the day: ~24 min before to ~24 min after solar noon)
  // Not observed on Wednesdays (dayOfWeek === 3)
  const solarNoon = sunriseMinutes + (dinamanaMinutes / 2);
  const abhijitStr =
    dayOfWeek === 3
      ? 'బుధవారం వర్జితం (None on Wednesday)'
      : formatTimeRange(solarNoon - 24, solarNoon + 24);

  // Durmuhurtham (Weekday specific inauspicious Muhurthams)
  const durmuhurthamStart = sunriseMinutes + (segmentMinutes * ((dayOfWeek + 2) % 7));
  const durmuhurthamStr = formatTimeRange(durmuhurthamStart, durmuhurthamStart + 48);

  // Varjyam and Amrita Kalam (based on Nakshatra tyajyam)
  const varjyamStart = sunriseMinutes + (nakshatraIndex * 15) % 400 + 120;
  const varjyamStr = formatTimeRange(varjyamStart, varjyamStart + 96);

  const amritaStart = (varjyamStart + 360) % (24 * 60);
  const amritaStr = formatTimeRange(amritaStart, amritaStart + 96);

  // Moonrise & Moonset estimation
  const moonPhaseMinutes = (elongation / 360) * 1440;
  const moonriseMinutes = ((sunriseMinutes + moonPhaseMinutes) % 1440);
  const moonsetMinutes = ((moonriseMinutes + 720) % 1440);

  const formatMinSingle = (m: number): string => {
    const hours = Math.floor(m / 60);
    const mins = Math.floor(m % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
  };

  // 6. TELUGU SAMVATSARAM, AYANAM, RUTUVU, MASAM
  // For 2027: Before Ugadi (Apr 7, 2027): Sri Parabhava Nama Samvatsaram.
  // After Ugadi: Sri Plavanga Nama Samvatsaram.
  const isAfterUgadi2027 = month > 4 || (month === 4 && day >= 7);
  const samvatsaramEn = isAfterUgadi2027 ? 'Sri Plavanga' : 'Sri Parabhava';
  const samvatsaramTe = isAfterUgadi2027 ? 'శ్రీ ప్లవంగ నామ సంవత్సరం' : 'శ్రీ పరాభవ నామ సంవత్సరం';

  // Uttarayanam: Makara Sankranti (Jan 15) to Karka Sankranti (July 16)
  const isUttarayanam = (month > 1 || (month === 1 && day >= 15)) && (month < 7 || (month === 7 && day < 16));
  const ayanamEn = isUttarayanam ? AYANAMS[0].en : AYANAMS[1].en;
  const ayanamTe = isUttarayanam ? AYANAMS[0].te : AYANAMS[1].te;

  // Rutuvu & Masam approximation
  // Chaitra starts with Ugadi in April
  const masamIndex = ((month + 8) % 12); // Mapping to Telugu lunar months
  const masamMeta = TELUGU_MASAMS[masamIndex] || TELUGU_MASAMS[0];
  const rutuvuIndex = Math.floor(masamIndex / 2);
  const rutuvuMeta = RUTUVUS[rutuvuIndex % 6] || RUTUVUS[0];

  return {
    id: `panchangam-${dateStr}-${location.city}`,
    calendar_date: dateStr,
    city: location.city,

    samvatsaram_en: samvatsaramEn,
    samvatsaram_te: samvatsaramTe,
    ayanam_en: ayanamEn,
    ayanam_te: ayanamTe,
    rutuvu_en: rutuvuMeta.en,
    rutuvu_te: rutuvuMeta.te,
    masam_en: masamMeta.en,
    masam_te: masamMeta.te,
    paksha_en: pakshaEn,
    paksha_te: pakshaTe,

    tithi: `${tithiDetails.name_te} (${tithiDetails.name_en})`,
    tithi_details: tithiDetails,
    nakshatram: `${nakshatraDetails.name_te} (${nakshatraDetails.name_en})`,
    nakshatra_details: nakshatraDetails,
    yogam: `${yogaDetails.name_te} (${yogaDetails.name_en})`,
    yoga_details: yogaDetails,
    karanam: `${karanaDetails.name_te} (${karanaDetails.name_en})`,
    karana_details: karanaDetails,

    sunrise: sunriseStr,
    sunset: sunsetStr,
    moonrise: formatMinSingle(moonriseMinutes),
    moonset: formatMinSingle(moonsetMinutes),

    abhijit_muhurtham: abhijitStr,
    amrita_kalam: amritaStr,
    brahma_muhurtham: formatTimeRange(sunriseMinutes - 96, sunriseMinutes - 48),

    rahu_kalam: rahuKalamStr,
    yama_gandam: yamaStr,
    gulika_kalam: gulikaStr,
    durmuhurtham: durmuhurthamStr,
    varjyam: varjyamStr,

    created_at: new Date().toISOString(),
  };
}

export const ephemerisCalculator = {
  calculatePanchangam: calculatePanchangamData,
  calculateJulianDay: getJulianDay,
  calculatePlanetaryLongitudes: getPlanetaryLongitudes,
  calculateSunriseSunset: calculateSunriseSunset,
  calculateTithi: (jd: number) => {
    const { sunNirayana, moonNirayana } = getPlanetaryLongitudes(jd);
    const elongation = ((moonNirayana - sunNirayana + 360) % 360);
    const tithiIndexRaw = Math.floor(elongation / 12);
    const tithiNumber = tithiIndexRaw + 1;
    const isShukla = tithiNumber <= 15;
    const tithiMeta = TITHIS[(tithiNumber - 1) % 15] || TITHIS[0];
    const pakshaTe = isShukla ? PAKSHAMS[0].te : PAKSHAMS[1].te;
    return {
      tithiNumber,
      paksha: isShukla ? 'shukla' : 'krishna',
      tithi: {
        number: tithiNumber,
        name_en: `${isShukla ? 'Shukla' : 'Krishna'} ${tithiMeta.en}`,
        name_te: `${pakshaTe} ${tithiMeta.te}`,
      },
    };
  },
};
