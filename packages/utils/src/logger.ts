/**
 * MANA CALENDAR 2027 — STRUCTURED LOGGER
 * Development logs are verbose. Production logs are sanitized to prevent leak of
 * passwords, auth tokens, secrets, or sensitive user/tenant data.
 */

import { ENV } from '@mana/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'service_role',
  'key',
  'authorization',
  'credit_card',
  'cvv',
];

function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    // If string contains JWT-like token, mask it
    if (data.startsWith('ey') && data.includes('.')) {
      return '[REDACTED_JWT]';
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }
  if (typeof data === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = sanitize(value);
      }
    }
    return clean;
  }
  return data;
}

function log(level: LogLevel, message: string, context?: unknown) {
  if (ENV.isProduction && level === 'debug') {
    return; // Don't log debug in production
  }

  const timestamp = new Date().toISOString();
  const sanitizedContext = sanitize(context);

  const payload = {
    timestamp,
    level,
    message,
    ...(sanitizedContext !== undefined ? { context: sanitizedContext } : {}),
  };

  switch (level) {
    case 'debug':
      console.debug(`[MANA DEBUG] ${message}`, sanitizedContext || '');
      break;
    case 'info':
      console.info(`[MANA INFO] ${message}`, sanitizedContext || '');
      break;
    case 'warn':
      console.warn(`[MANA WARN] ${message}`, sanitizedContext || '');
      break;
    case 'error':
      console.error(`[MANA ERROR] ${message}`, sanitizedContext || '');
      break;
  }

  return payload;
}

export const logger = {
  debug: (message: string, context?: unknown) => log('debug', message, context),
  info: (message: string, context?: unknown) => log('info', message, context),
  warn: (message: string, context?: unknown) => log('warn', message, context),
  error: (message: string, context?: unknown) => log('error', message, context),
};
