/**
 * MANA CALENDAR 2027 — WEATHER PROXY EDGE FUNCTION
 *
 * Secure server-side adapter for OpenWeatherMap API.
 * Securely encapsulates WEATHER_API_KEY so client apps never expose credentials.
 */

import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  location: {
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  };
  date?: string;
}

const TELUGU_WEATHER_MAP: Record<string, string> = {
  Clear: 'నిర్మలమైన ఆకాశం',
  Clouds: 'మేఘావృతం',
  Rain: 'వర్షం',
  Drizzle: 'చినుకులు',
  Thunderstorm: 'ఉరుములతో కూడిన వర్షం',
  Haze: 'పొగమంచు',
  Mist: 'మంచు',
  Smoke: 'పొగ',
  Dust: 'ధూళి',
  Fog: 'దట్టమైన మంచు',
  Sunny: 'ఎండగా ఉంది',
  PartlyCloudy: 'పాక్షిక మేఘావృతం',
};

// @ts-ignore: Deno runtime environment
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { location, date } = body;

    if (!location || !location.latitude || !location.longitude) {
      return new Response(
        JSON.stringify({ error: 'Valid location with latitude and longitude is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // @ts-ignore: Deno env
    const apiKey = Deno.env.get('WEATHER_API_KEY') || '7ad72c7a136bc94a659eb9dcbc9f563e';
    const lat = location.latitude;
    const lon = location.longitude;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Fetch OpenWeather Current Weather
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl),
    ]);

    if (!currentRes.ok) {
      const errText = await currentRes.text();
      throw new Error(`OpenWeather API returned ${currentRes.status}: ${errText}`);
    }

    const currentData = await currentRes.json();
    const forecastData = forecastRes.ok ? await forecastRes.json() : null;

    const conditionEn = currentData.weather?.[0]?.main || 'Clear';
    const conditionTe = TELUGU_WEATHER_MAP[conditionEn] || conditionEn;

    const sunriseDate = new Date(currentData.sys.sunrise * 1000);
    const sunsetDate = new Date(currentData.sys.sunset * 1000);
    const formatTime = (d: Date) =>
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Map hourly forecasts (next 24 hours / 8 steps of 3h intervals)
    const hourlyForecast: Array<{
      time: string;
      temp_c: number;
      condition: string;
      rain_probability: number;
      is_day: boolean;
    }> = [];

    if (forecastData?.list && Array.isArray(forecastData.list)) {
      for (const item of forecastData.list.slice(0, 8)) {
        const itemDate = new Date(item.dt * 1000);
        const cond = item.weather?.[0]?.main || 'Clear';
        hourlyForecast.push({
          time: itemDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
          temp_c: Math.round(item.main.temp),
          condition: cond,
          rain_probability: Math.round((item.pop || 0) * 100),
          is_day: item.sys?.pod === 'd',
        });
      }
    }

    // Map 7-day daily forecasts
    const dailyForecast: Array<{
      date: string;
      day_of_week: string;
      temp_max_c: number;
      temp_min_c: number;
      condition: string;
      condition_te: string;
      rain_probability: number;
    }> = [];

    if (forecastData?.list && Array.isArray(forecastData.list)) {
      const dailyMap = new Map<string, { temps: number[]; conditions: string[]; pops: number[] }>();

      for (const item of forecastData.list) {
        const dayStr = item.dt_txt ? item.dt_txt.split(' ')[0] : new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyMap.has(dayStr)) {
          dailyMap.set(dayStr, { temps: [], conditions: [], pops: [] });
        }
        const entry = dailyMap.get(dayStr)!;
        entry.temps.push(item.main.temp);
        if (item.weather?.[0]?.main) entry.conditions.push(item.weather[0].main);
        if (item.pop !== undefined) entry.pops.push(item.pop);
      }

      for (const [dayKey, vals] of dailyMap.entries()) {
        const dObj = new Date(dayKey + 'T00:00:00Z');
        const dayOfWeek = dObj.toLocaleDateString('en-US', { weekday: 'short' });
        const maxT = Math.round(Math.max(...vals.temps));
        const minT = Math.round(Math.min(...vals.temps));
        const mainCond = vals.conditions[0] || 'Clear';
        const avgPop = vals.pops.length > 0 ? Math.round((vals.pops.reduce((a, b) => a + b, 0) / vals.pops.length) * 100) : 0;

        dailyForecast.push({
          date: dayKey,
          day_of_week: dayOfWeek,
          temp_max_c: maxT,
          temp_min_c: minT,
          condition: mainCond,
          condition_te: TELUGU_WEATHER_MAP[mainCond] || mainCond,
          rain_probability: avgPop,
        });
      }
    }

    const mappedWeatherData = {
      city: location.city,
      state: location.state,
      country: location.country,
      latitude: lat,
      longitude: lon,
      timezone: location.timezone || 'Asia/Kolkata',
      date: targetDate,
      temp_c: Math.round(currentData.main.temp),
      feels_like_c: Math.round(currentData.main.feels_like),
      temp_min_c: Math.round(currentData.main.temp_min),
      temp_max_c: Math.round(currentData.main.temp_max),
      condition: conditionEn,
      condition_te: conditionTe,
      humidity: currentData.main.humidity,
      rain_probability: hourlyForecast[0]?.rain_probability || 0,
      wind_kph: Math.round((currentData.wind?.speed || 0) * 3.6),
      uv_index: 6, // Standard daylight UV index for AP/Telangana
      sunrise: formatTime(sunriseDate),
      sunset: formatTime(sunsetDate),
      is_forecast: true,
      hourly_forecast: hourlyForecast,
      daily_forecast: dailyForecast,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    return new Response(JSON.stringify(mappedWeatherData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || 'Weather proxy processing failed',
        fallback: true,
      }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
