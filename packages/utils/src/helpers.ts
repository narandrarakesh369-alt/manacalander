/**
 * MANA CALENDAR 2027 — CORE COMMON HELPERS
 */

import type { LanguagePreference } from '@mana/types';

/**
 * Validates business ID format (e.g. SLJ001, RF002, CMR003)
 * Must be 2-6 uppercase letters followed by 2-6 digits.
 */
export function isValidBusinessId(businessId: string): boolean {
  if (!businessId || typeof businessId !== 'string') return false;
  return /^[A-Z0-9_-]{3,15}$/.test(businessId.trim());
}

/**
 * Formats Indian Rupee currency with proper comma grouping (e.g., ₹1,999)
 */
export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Resolves localized text according to user language preference
 */
export function getLocalizedText(
  telugu: string,
  english: string,
  preference: LanguagePreference = 'te_en'
): string {
  switch (preference) {
    case 'te':
      return telugu;
    case 'en':
      return english;
    case 'te_en':
    default:
      if (telugu && english && telugu !== english) {
        return `${telugu} (${english})`;
      }
      return english || telugu;
  }
}

/**
 * Clamps text length for cards and summaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Sanitizes input string by removing control characters, null bytes, and script tags
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}
