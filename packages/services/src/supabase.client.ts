/**
 * MANA CALENDAR 2027 — SUPABASE CLIENT FOUNDATION
 * Singleton client initialized with public anon key and Row Level Security.
 * Server role keys are strictly prohibited in the client layer.
 */

import { createClient } from '@supabase/supabase-js';
import { ENV } from '@mana/config';
import { logger } from '@mana/utils';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    ENV.supabaseUrl &&
    !ENV.supabaseUrl.includes('placeholder') &&
    ENV.supabaseAnonKey &&
    !ENV.supabaseAnonKey.includes('placeholder')
  );
};

if (!isSupabaseConfigured()) {
  logger.debug('Supabase is running in local/offline mock mode with placeholder URL.');
}

export const supabase = createClient(
  ENV.supabaseUrl || 'https://placeholder.supabase.co',
  ENV.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'mana_auth_token',
    },
  }
);
