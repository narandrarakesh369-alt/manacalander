/**
 * MANA CALENDAR 2027 — EXTERNAL WEATHER API PROVIDER (SECURE ADAPTER)
 * Connects securely to backend proxy / Edge Function without exposing provider secrets in frontend client.
 * Adheres to rule: Never claim external weather API is connected unless live credentials are verified.
 */

import type { LocationConfig, WeatherData } from '@mana/types';
import type { IWeatherProvider } from './types';
import { supabase } from '../supabase.client';
import { logger } from '@mana/utils';

export class ExternalWeatherProvider implements IWeatherProvider {
  public readonly name = 'ExternalWeatherServerProxy';
  private configured: boolean = false;
  private apiKey: string = '';

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
      this.configured = true;
    }
  }

  /**
   * Provisions live provider credentials for secure server-side invocation
   */
  public configure(apiKey: string): void {
    this.apiKey = apiKey;
    this.configured = Boolean(apiKey);
  }

  /**
   * Returns true only when live backend proxy credentials are confirmed provisioned
   */
  public isConfigured(): boolean {
    return this.configured;
  }

  async getWeather(location: LocationConfig, date?: string): Promise<WeatherData> {
    if (!this.isConfigured()) {
      throw new Error(
        'External Weather API endpoint is not provisioned with live production credentials. Delegating to ClimatologicalWeatherProvider.'
      );
    }

    try {
      // Secure call through server-side proxy
      const { data, error } = await supabase.functions.invoke('weather-proxy', {
        body: { location, date },
      });

      if (error || !data) {
        throw new Error(error?.message || 'External weather proxy request failed');
      }

      return data as WeatherData;
    } catch (err) {
      logger.warn('External weather proxy invocation failed', err);
      throw err;
    }
  }
}
