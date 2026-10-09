/**
 * MANA CALENDAR 2027 — EXTERNAL PANCHANGAM API PROVIDER (ADAPTER)
 * Connects securely to backend proxy / Edge Function without exposing provider secrets in client code.
 * Follows Rule 15: If credentials or endpoint are unconfigured, cleanly signals status and defers.
 */

import type { LocationConfig, Panchangam } from '@mana/types';
import type { IPanchangamProvider } from './types';
import { supabase } from '../supabase.client';
import { logger } from '@mana/utils';

export class ExternalPanchangamProvider implements IPanchangamProvider {
  public readonly name = 'ExternalServerProxyProvider';
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

  public isConfigured(): boolean {
    return this.configured;
  }

  async getPanchangam(date: string, location: LocationConfig): Promise<Panchangam> {
    if (!this.isConfigured()) {
      throw new Error(
        'External Panchangam API endpoint is not provisioned with live production credentials. Delegating to AstronomicalEphemerisProvider.'
      );
    }

    try {
      // Secure call through server-side proxy
      const { data, error } = await supabase.functions.invoke('panchangam-proxy', {
        body: { date, location },
      });

      if (error || !data) {
        throw new Error(error?.message || 'External Panchangam provider request failed');
      }

      return data as Panchangam;
    } catch (err) {
      logger.warn('External Panchangam API invocation failed', err);
      throw err;
    }
  }
}
