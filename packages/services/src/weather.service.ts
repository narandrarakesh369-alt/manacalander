/**
 * MANA CALENDAR 2027 — WEATHER SERVICE
 * Production engine for current weather, hourly forecast, and 7-day outlook.
 * Coordinates in-memory caching, Supabase database storage, and dual-provider architecture.
 */

import { supabase, isSupabaseConfigured } from './supabase.client';
import type { WeatherData, LocationConfig, DailyForecast } from '@mana/types';
import { DEFAULT_LOCATION } from '@mana/config';
import { ExternalWeatherProvider } from './weather/external.weather.provider';
import { ClimatologicalWeatherProvider } from './weather/climatological.weather.provider';
import { logger } from '@mana/utils';

// In-memory cache for high-performance weather queries (city:date -> WeatherData)
const weatherMemoryCache = new Map<string, { data: WeatherData; expiresAt: number }>();

const externalProvider = new ExternalWeatherProvider();
const climatologicalProvider = new ClimatologicalWeatherProvider();

export class WeatherService {
  /**
   * Fetches weather information for a given location and optional date.
   * Checks: 1. In-memory cache -> 2. Supabase DB cache -> 3. Provider Engine
   */
  static async getWeather(
    location: LocationConfig = DEFAULT_LOCATION,
    date?: string
  ): Promise<WeatherData> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const cacheKey = `${location.city.toLowerCase()}:${targetDate}`;
    const now = Date.now();

    // 1. Check in-memory cache
    const memCached = weatherMemoryCache.get(cacheKey);
    if (memCached && memCached.expiresAt > now) {
      return memCached.data;
    }

    // 2. Check Supabase database cache if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('weather_cache')
          .select('*')
          .eq('city', location.city)
          .eq('date', targetDate)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (!error && data && data.temp_c !== undefined) {
          const mappedData = this.mapDbRecordToWeatherData(data, location);
          weatherMemoryCache.set(cacheKey, {
            data: mappedData,
            expiresAt: new Date(data.expires_at).getTime(),
          });
          return mappedData;
        }
      } catch (err) {
        logger.debug('Database weather cache lookup bypassed', err);
      }
    }

    // 3. Provider calculation
    let weatherResult: WeatherData;
    try {
      // Try external server proxy if configured
      weatherResult = await externalProvider.getWeather(location, targetDate);
    } catch {
      // Graceful fallback to location-based climatological & ephemeris model
      weatherResult = await climatologicalProvider.getWeather(location, targetDate);
    }

    // Save to memory cache (2 hours TTL)
    const expiresAtMs = now + 2 * 60 * 60 * 1000;
    weatherMemoryCache.set(cacheKey, {
      data: weatherResult,
      expiresAt: expiresAtMs,
    });

    // Asynchronously write back to Supabase database cache if enabled
    if (isSupabaseConfigured()) {
      this.cacheWeatherToDatabase(weatherResult).catch((err) => {
        logger.debug('Async weather database cache write skipped', err);
      });
    }

    return weatherResult;
  }

  /**
   * Retrieves weather forecast for a specific calendar date (if within 7-day forecast window)
   */
  static async getForecastForDate(
    date: string,
    location: LocationConfig = DEFAULT_LOCATION
  ): Promise<DailyForecast | null> {
    try {
      const fullWeather = await this.getWeather(location);
      const match = fullWeather.daily_forecast.find((d) => d.date === date);
      return match || null;
    } catch {
      return null;
    }
  }

  /**
   * Maps database record into WeatherData structure
   */
  private static mapDbRecordToWeatherData(
    dbRecord: any,
    location: LocationConfig
  ): WeatherData {
    return {
      city: dbRecord.city || location.city,
      state: location.state,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
      date: dbRecord.date,
      temp_c: dbRecord.temp_c,
      feels_like_c: dbRecord.feels_like_c || dbRecord.temp_c,
      temp_min_c: dbRecord.temp_min_c || dbRecord.temp_c - 5,
      temp_max_c: dbRecord.temp_max_c || dbRecord.temp_c + 4,
      condition: dbRecord.condition,
      condition_te: dbRecord.condition_te || dbRecord.condition,
      humidity: dbRecord.humidity,
      rain_probability: dbRecord.rain_probability || 0,
      wind_kph: dbRecord.wind_kph || 0,
      uv_index: dbRecord.uv_index || 0,
      sunrise: dbRecord.sunrise || '06:00 AM',
      sunset: dbRecord.sunset || '06:00 PM',
      is_forecast: dbRecord.is_forecast ?? true,
      hourly_forecast: dbRecord.hourly_forecast || [],
      daily_forecast: dbRecord.daily_forecast || [],
      fetched_at: dbRecord.fetched_at,
      expires_at: dbRecord.expires_at,
    };
  }

  /**
   * Persists weather result into Supabase database cache
   */
  private static async cacheWeatherToDatabase(w: WeatherData): Promise<void> {
    try {
      await supabase.from('weather_cache').upsert(
        {
          location_key: `${w.latitude.toFixed(2)},${w.longitude.toFixed(2)}`,
          city: w.city,
          date: w.date,
          temp_c: w.temp_c,
          feels_like_c: w.feels_like_c,
          temp_min_c: w.temp_min_c,
          temp_max_c: w.temp_max_c,
          condition: w.condition,
          condition_te: w.condition_te,
          humidity: w.humidity,
          rain_probability: w.rain_probability,
          wind_kph: w.wind_kph,
          uv_index: w.uv_index,
          sunrise: w.sunrise,
          sunset: w.sunset,
          is_forecast: w.is_forecast,
          hourly_forecast: w.hourly_forecast,
          daily_forecast: w.daily_forecast,
          fetched_at: w.fetched_at,
          expires_at: w.expires_at,
        },
        { onConflict: 'location_key,date' }
      );
    } catch (err) {
      logger.debug('Database cache insertion bypassed', err);
    }
  }

  /**
   * Clears in-memory weather cache (useful for testing or manual refresh)
   */
  static clearMemoryCache(): void {
    weatherMemoryCache.clear();
  }

  /**
   * Configures external weather provider with live API key (e.g. OpenWeatherMap)
   */
  static configureExternalProvider(apiKey: string): void {
    externalProvider.configure(apiKey);
  }

  /**
   * Returns whether external weather provider is configured with credentials
   */
  static isExternalProviderConfigured(): boolean {
    return externalProvider.isConfigured();
  }
}
