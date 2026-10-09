import { describe, it, expect } from 'vitest';
import { APP_CONFIG, DEFAULT_LOCATION, PLANS_CONFIG } from '@mana/config';
import { formatCurrencyINR, getSafeErrorMessage, getLocalizedText } from '@mana/utils';

describe('Config, Security Sanitization & Common Utilities', () => {
  it('loads multi-year calendar configuration correctly', () => {
    expect(APP_CONFIG.name).toBe('Mana Calendar 2027');
    expect(APP_CONFIG.defaultYear).toBe(2027);
    expect(APP_CONFIG.supportedYears).toContain(2027);
    expect(APP_CONFIG.supportedYears).toContain(2028);
    expect(APP_CONFIG.supportedYears).toContain(2029);
  });

  it('provides default location parameters', () => {
    expect(DEFAULT_LOCATION.city).toBe('Visakhapatnam');
    expect(DEFAULT_LOCATION.state).toBe('Andhra Pradesh');
    expect(DEFAULT_LOCATION.country).toBe('India');
    expect(DEFAULT_LOCATION.timezone).toBe('Asia/Kolkata');
  });

  it('formats Indian Rupee currency correctly', () => {
    expect(formatCurrencyINR(1999)).toContain('1,999');
    expect(formatCurrencyINR(3999)).toContain('3,999');
    expect(formatCurrencyINR(299)).toContain('299');
  });

  it('sanitizes PostgreSQL database error messages to prevent internal leakage', () => {
    const rawSqlError = new Error('duplicate key value violates unique constraint "businesses_business_id_key"');
    const safeMessage = getSafeErrorMessage(rawSqlError);

    expect(safeMessage).not.toContain('businesses_business_id_key');
    expect(safeMessage).toContain('already exists');

    const rawRlsError = new Error('new row violates row-level security policy for table "campaigns"');
    const safeRlsMessage = getSafeErrorMessage(rawRlsError);

    expect(safeRlsMessage).not.toContain('table "campaigns"');
    expect(safeRlsMessage).toContain('Access denied');
  });

  it('resolves bilingual localized text based on preference', () => {
    const te = 'మకర సంక్రాంతి';
    const en = 'Makara Sankranti';

    expect(getLocalizedText(te, en, 'te')).toBe(te);
    expect(getLocalizedText(te, en, 'en')).toBe(en);
    expect(getLocalizedText(te, en, 'te_en')).toBe('మకర సంక్రాంతి (Makara Sankranti)');
  });
});
