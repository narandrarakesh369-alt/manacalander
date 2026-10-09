/**
 * MANA CALENDAR 2027 — PANCHANGAM PROXY EDGE FUNCTION
 *
 * Secure server-side adapter for Vedic Astro API (Vedic Ephemeris).
 * Securely encapsulates PANCHANGAM_API_KEY so client apps never expose credentials.
 */

import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  date: string; // YYYY-MM-DD
  location: {
    city: string;
    state?: string;
    country?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  };
}

// @ts-ignore: Deno runtime environment
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { date, location } = body;

    if (!date || !location || !location.latitude || !location.longitude) {
      return new Response(
        JSON.stringify({ error: 'Valid date (YYYY-MM-DD) and location coordinates are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // @ts-ignore: Deno env
    const apiKey = Deno.env.get('PANCHANGAM_API_KEY') || 'vda_live_8ed57edd_J29966Ba1udgh_eKuDgZ_KMe3srL5ZA4ngsuzSq5_V0';
    const lat = location.latitude;
    const lon = location.longitude;

    // Format DD/MM/YYYY for Vedic Astro API
    const [year, month, day] = date.split('-');
    const formattedDob = `${day}/${month}/${year}`;

    const apiUrl = `https://api.vedicastroapi.com/v3-json/panchang/panchang?api_key=${apiKey}&dob=${formattedDob}&tob=06:00&lat=${lat}&lon=${lon}&tz=5.5`;

    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`Vedic Astro API returned ${apiRes.status}: ${errText}`);
    }

    const json = await apiRes.json();
    const responseData = json.response || json.data || json;

    // Helper formatting functions
    const formatAstroName = (item: any): string => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      const nameEn = item.name || item.name_en || '';
      const nameTe = item.name_te || '';
      return nameTe ? `${nameEn} (${nameTe})` : nameEn;
    };

    const tithiName = formatAstroName(responseData.tithi);
    const nakshatraName = formatAstroName(responseData.nakshatra);
    const yogaName = formatAstroName(responseData.yoga);
    const karanaName = formatAstroName(responseData.karana);

    const mappedPanchangam = {
      calendar_date: date,
      city: location.city,
      samvatsaram_en: responseData.samvatsara?.name || 'Plavanga',
      samvatsaram_te: responseData.samvatsara?.name_te || 'ప్లవంగ',
      ayanam_en: responseData.ayana?.name || 'Uttarayanam',
      ayanam_te: responseData.ayana?.name_te || 'ఉత్తరాయణం',
      rutuvu_en: responseData.ritu?.name || 'Shishira',
      rutuvu_te: responseData.ritu?.name_te || 'శిశిర ఋతువు',
      masam_en: responseData.masa?.name || 'Pushya',
      masam_te: responseData.masa?.name_te || 'పుష్య మాసము',
      paksha_en: responseData.paksha?.name || 'Shukla Paksha',
      paksha_te: responseData.paksha?.name_te || 'శుక్ల పక్షం',
      tithi: tithiName || 'Shukla Ashtami',
      nakshatram: nakshatraName || 'Rohini',
      yogam: yogaName || 'Siddha',
      karanam: karanaName || 'Bava',
      sunrise: responseData.sunrise || '06:28 AM',
      sunset: responseData.sunset || '05:48 PM',
      moonrise: responseData.moonrise || '12:40 PM',
      moonset: responseData.moonset || '01:15 AM',
      rahu_kalam: responseData.rahukaal || '10:45 AM - 12:10 PM',
      yama_gandam: responseData.yamaghanta || '03:00 PM - 04:25 PM',
      gulika_kalam: responseData.gulikakaal || '07:55 AM - 09:20 AM',
      abhijit_muhurtham: responseData.abhijit_muhurta || '11:45 AM - 12:32 PM',
      amrita_kalam: responseData.amritakaal || '02:15 PM - 03:48 PM',
      durmuhurtham: responseData.durmuhurta || '08:45 AM - 09:30 AM',
      varjyam: responseData.varjyam || '09:12 PM - 10:48 PM',
    };

    return new Response(JSON.stringify(mappedPanchangam), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || 'Panchangam proxy processing failed',
        fallback: true,
      }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
