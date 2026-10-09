/**
 * MANA CALENDAR 2027 — PANCHANGAM ENGINE PROVIDER CONTRACTS
 */

import type { LocationConfig, Panchangam } from '@mana/types';

export interface IPanchangamProvider {
  /**
   * Unique name of the provider implementation
   */
  readonly name: string;

  /**
   * Fetches or calculates complete Panchangam for a date and location
   */
  getPanchangam(date: string, location: LocationConfig): Promise<Panchangam>;
}
