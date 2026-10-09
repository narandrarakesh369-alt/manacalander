/**
 * MANA CALENDAR 2027 — PANCHANGAM SERVICE
 * Production engine with ephemeris calculation, dual provider architecture,
 * and multi-level caching (in-memory + Supabase storage).
 */

import { supabase, isSupabaseConfigured } from './supabase.client';
import type { Panchangam, LocationConfig } from '@mana/types';
import { DEFAULT_LOCATION } from '@mana/config';
import { AstronomicalPanchangamProvider } from './engine/astronomical.provider';
import { ExternalPanchangamProvider } from './engine/external.provider';
import { logger } from '@mana/utils';

// In-memory cache for high-performance date browsing
const panchangamMemoryCache = new Map<string, Panchangam>();

const astroProvider = new AstronomicalPanchangamProvider();
const externalProvider = new ExternalPanchangamProvider();

export class PanchangamService {
  /**
   * Retrieves Panchangam for a given date and location.
   * Checks: 1. In-memory cache -> 2. Supabase DB cache -> 3. Calculation engine.
   */
  static async getDailyPanchangam(
    date: string,
    location: LocationConfig = DEFAULT_LOCATION
  ): Promise<Panchangam> {
    const cacheKey = `${date}:${location.city.toLowerCase()}`;

    // 1. Check in-memory cache
    if (panchangamMemoryCache.has(cacheKey)) {
      return panchangamMemoryCache.get(cacheKey)!;
    }

    if (isSupabaseConfigured()) {
      try {
        // 2. Check Supabase database cache
        const { data, error } = await supabase
          .from('panchangam')
          .select('*')
          .eq('calendar_date', date)
          .eq('city', location.city)
          .maybeSingle();

        if (!error && data && data.tithi) {
          const panchangamObj = data as Panchangam;
          panchangamMemoryCache.set(cacheKey, panchangamObj);
          return panchangamObj;
        }
      } catch (err) {
        logger.debug('Database cache check bypassed or offline', err);
      }
    }

    // 3. Fallback to server proxy or astronomical calculation engine
    let computedPanchangam: Panchangam;
    try {
      // Try external server proxy if provisioned
      computedPanchangam = await externalProvider.getPanchangam(date, location);
    } catch {
      // Clean fallback to reliable astronomical ephemeris calculation
      computedPanchangam = await astroProvider.getPanchangam(date, location);
    }

    // Store in memory cache
    panchangamMemoryCache.set(cacheKey, computedPanchangam);

    // Asynchronously cache into Supabase if possible without blocking UI
    this.cachePanchangamToDatabase(computedPanchangam).catch((err) => {
      logger.debug('Async database cache write skipped', err);
    });

    return computedPanchangam;
  }

  /**
   * Persists computed Panchangam record to Supabase database cache
   */
  private static async cachePanchangamToDatabase(p: Panchangam): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.from('panchangam').upsert(
        {
          calendar_date: p.calendar_date,
          city: p.city,
          samvatsaram_en: p.samvatsaram_en,
          samvatsaram_te: p.samvatsaram_te,
          ayanam_en: p.ayanam_en,
          ayanam_te: p.ayanam_te,
          rutuvu_en: p.rutuvu_en,
          rutuvu_te: p.rutuvu_te,
          masam_en: p.masam_en,
          masam_te: p.masam_te,
          paksha_en: p.paksha_en,
          paksha_te: p.paksha_te,
          tithi: p.tithi,
          nakshatram: p.nakshatram,
          yogam: p.yogam,
          karanam: p.karanam,
          sunrise: p.sunrise,
          sunset: p.sunset,
          moonrise: p.moonrise,
          moonset: p.moonset,
          rahu_kalam: p.rahu_kalam,
          yama_gandam: p.yama_gandam,
          gulika_kalam: p.gulika_kalam,
          abhijit_muhurtham: p.abhijit_muhurtham,
          amrita_kalam: p.amrita_kalam,
          durmuhurtham: p.durmuhurtham,
          varjyam: p.varjyam,
        },
        { onConflict: 'calendar_date,city' }
      );
    } catch {
      // Ignored in client-mode / offline dev
    }
  }

  /**
   * Clears in-memory cache (useful for testing and city switches)
   */
  static clearMemoryCache(): void {
    panchangamMemoryCache.clear();
  }

  /**
   * Configures external Panchangam provider with live API key (e.g. Vedic Astro API)
   */
  static configureExternalProvider(apiKey: string): void {
    externalProvider.configure(apiKey);
  }

  /**
   * Returns whether external Panchangam provider is configured with credentials
   */
  static isExternalProviderConfigured(): boolean {
    return externalProvider.isConfigured();
  }
}
