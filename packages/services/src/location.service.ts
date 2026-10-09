/**
 * MANA CALENDAR 2027 — LOCATION SERVICE
 * Manages active location preference for astronomical and Panchangam calculations.
 * Default location: Visakhapatnam, Andhra Pradesh, India.
 */

import type { LocationConfig } from '@mana/types';
import { DEFAULT_LOCATION, POPULAR_LOCATIONS } from '@mana/config';
import { logger } from '@mana/utils';

type LocationListener = (location: LocationConfig) => void;

const STORAGE_KEY = 'mana_user_location';

export class LocationService {
  private static currentLocation: LocationConfig = LocationService.loadInitialLocation();
  private static listeners: Set<LocationListener> = new Set();

  /**
   * Loads saved location from localStorage if available, otherwise defaults to Visakhapatnam.
   */
  private static loadInitialLocation(): LocationConfig {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.city && parsed.latitude && parsed.longitude) {
            return parsed as LocationConfig;
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to load saved location from storage, using default', err);
    }
    return DEFAULT_LOCATION;
  }

  /**
   * Returns the currently active location
   */
  static getCurrentLocation(): LocationConfig {
    return this.currentLocation;
  }

  /**
   * Sets the active location and notifies all subscribers
   */
  static setLocation(location: LocationConfig): void {
    if (!location || !location.city) return;
    this.currentLocation = location;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
      }
    } catch (err) {
      logger.warn('Failed to persist location to storage', err);
    }

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentLocation);
      } catch (err) {
        logger.error('Error in location listener', err);
      }
    });
  }

  /**
   * Subscribes to location changes
   */
  static subscribe(listener: LocationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Returns list of popular / pre-configured AP and Telangana locations
   */
  static getPopularLocations(): LocationConfig[] {
    return POPULAR_LOCATIONS;
  }

  /**
   * Resets active location to Visakhapatnam
   */
  static resetToDefault(): void {
    this.setLocation(DEFAULT_LOCATION);
  }
}
