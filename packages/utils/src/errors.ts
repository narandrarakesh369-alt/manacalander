/**
 * MANA CALENDAR 2027 — ERROR HANDLING FOUNDATION
 * Safe error wrappers preventing exposure of raw SQL or backend stack traces.
 */

import { logger } from './logger';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code = 'INTERNAL_ERROR', statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TenantAccessError extends AppError {
  constructor(message = 'Unauthorized tenant access attempt detected') {
    super(message, 'TENANT_ACCESS_DENIED', 403);
    this.name = 'TenantAccessError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required to access this resource') {
    super(message, 'UNAUTHENTICATED', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions for this action') {
    super(message, 'PERMISSION_DENIED', 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Sanitizes errors before presenting them to the user.
 * Strips raw PostgreSQL error codes, table names, or internal stack traces.
 */
export function getSafeErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  if (error instanceof AppError && error.isOperational) {
    return error.message;
  }

  const rawMessage = (error as Error)?.message || String(error);

  logger.error('Intercepted unexpected error', { rawMessage });

  // Map common Postgres/Supabase errors to safe human messages
  if (rawMessage.includes('violates foreign key') || rawMessage.includes('violates not-null')) {
    return 'The requested operation references invalid or missing records.';
  }
  if (rawMessage.includes('duplicate key value') || rawMessage.includes('unique constraint')) {
    return 'This record or identifier already exists in the system.';
  }
  if (rawMessage.includes('row-level security') || rawMessage.includes('permission denied')) {
    return 'Access denied. You do not have permission to view or modify this resource.';
  }
  if (rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError')) {
    return 'Network connection issue. Please check your internet connection.';
  }

  return 'A system error occurred. Please try again or contact support.';
}
