/**
 * MANA CALENDAR 2027 — WEATHER PROVIDER CONTRACT
 * Standardized interface for external backend proxies and local climatological fallback providers.
 */

import type { LocationConfig, WeatherData } from '@mana/types';

export interface IWeatherProvider {
  readonly name: string;
  isConfigured(): boolean;
  getWeather(location: LocationConfig, date?: string): Promise<WeatherData>;
}
