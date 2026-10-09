/**
 * MANA CALENDAR 2027 — ASTRONOMICAL PANCHANGAM PROVIDER
 * Reliable mathematical ephemeris calculation provider.
 */

import type { LocationConfig, Panchangam } from '@mana/types';
import type { IPanchangamProvider } from './types';
import { calculatePanchangamData } from './ephemeris.calculator';

export class AstronomicalPanchangamProvider implements IPanchangamProvider {
  public readonly name = 'AstronomicalEphemerisProvider';

  /**
   * Computes authentic Vedic Panchangam data for the given date and location
   */
  async getPanchangam(date: string, location: LocationConfig): Promise<Panchangam> {
    return calculatePanchangamData(date, location);
  }
}
