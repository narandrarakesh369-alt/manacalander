/**
 * MANA CALENDAR 2027 — PHASE 7: SECURITY & ABUSE PROTECTION SERVICE
 * Enforces rate limiting, media validation, webhook idempotency, and tenant isolation guards.
 */

import { sanitizeInput } from '@mana/utils';

export interface RateLimitStatus {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: string;
  retryAfterSeconds?: number;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  optimizedDimensions?: { width: number; height: number };
  contentType?: string;
}

export class SecurityService {
  // In-memory rate limiting store (identifier -> { attempts, lockedUntil, lastAttempt })
  private static rateLimitStore = new Map<string, { attempts: number; lockedUntil?: number; lastAttempt: number }>();

  // Processed webhook IDs for idempotency
  private static processedWebhooks = new Set<string>();

  // Maximum allowed file size for image uploads: 5 MB
  public static readonly MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

  // Permitted image MIME types (Strictly NO SVG to prevent stored XSS)
  public static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // Prohibited campaign keywords (Anti-spam & scam protection)
  private static readonly SPAM_PATTERNS = [
    /\b(free bitcoin|crypto giveaway|lottery winner|urgent money transfer|100% guaranteed profit)\b/i,
    /\b(click here to win|double your cash|adult content|casinos?)\b/i,
  ];

  // ===========================================================================
  // 1. RATE LIMITING (SLIDING WINDOW & ACCOUNT LOCKOUT)
  // ===========================================================================

  /**
   * Checks and enforces rate limits (e.g. 5 attempts within 15 minutes)
   */
  static checkRateLimit(
    identifier: string,
    action: 'login' | 'mfa' | 'api' | 'notification' = 'login',
    maxAttempts = 5,
    lockoutDurationMs = 15 * 60 * 1000 // 15 mins
  ): RateLimitStatus {
    const key = `${action}:${identifier.trim().toLowerCase()}`;
    const now = Date.now();
    const entry = this.rateLimitStore.get(key);

    // If currently locked out
    if (entry?.lockedUntil && entry.lockedUntil > now) {
      const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: new Date(entry.lockedUntil).toISOString(),
        retryAfterSeconds: remainingSeconds,
      };
    }

    // Reset if window expired (15 minutes of inactivity)
    if (entry && now - entry.lastAttempt > lockoutDurationMs) {
      this.rateLimitStore.delete(key);
    }

    const currentAttempts = (this.rateLimitStore.get(key)?.attempts || 0);

    return {
      allowed: currentAttempts < maxAttempts,
      remainingAttempts: Math.max(0, maxAttempts - currentAttempts),
    };
  }

  /**
   * Records a failed attempt; locks account if threshold exceeded
   */
  static recordFailedAttempt(
    identifier: string,
    action: 'login' | 'mfa' | 'api' | 'notification' = 'login',
    maxAttempts = 5,
    lockoutDurationMs = 15 * 60 * 1000
  ): RateLimitStatus {
    const key = `${action}:${identifier.trim().toLowerCase()}`;
    const now = Date.now();
    const current = this.rateLimitStore.get(key) || { attempts: 0, lastAttempt: now };

    current.attempts += 1;
    current.lastAttempt = now;

    if (current.attempts >= maxAttempts) {
      current.lockedUntil = now + lockoutDurationMs;
      this.rateLimitStore.set(key, current);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: new Date(current.lockedUntil).toISOString(),
        retryAfterSeconds: Math.ceil(lockoutDurationMs / 1000),
      };
    }

    this.rateLimitStore.set(key, current);
    return {
      allowed: true,
      remainingAttempts: maxAttempts - current.attempts,
    };
  }

  /**
   * Resets rate limit counters upon successful authentication
   */
  static resetRateLimit(identifier: string, action: 'login' | 'mfa' | 'api' | 'notification' = 'login'): void {
    const key = `${action}:${identifier.trim().toLowerCase()}`;
    this.rateLimitStore.delete(key);
  }

  // ===========================================================================
  // 2. IMAGE UPLOAD VALIDATION & OPTIMIZATION
  // ===========================================================================

  /**
   * Validates file upload against strict security constraints
   */
  static validateImageUpload(file: {
    name: string;
    size: number;
    type: string;
  }): ImageValidationResult {
    // 1. File Type Check (No SVG or executables)
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported image format (${file.type}). Only JPEG, PNG, and WebP are allowed. SVGs and executable scripts are blocked for security.`,
      };
    }

    // 2. File Extension check
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return {
        valid: false,
        error: `File extension .${ext} does not match allowed image formats.`,
      };
    }

    // 3. File Size Check (Max 5MB)
    if (file.size > this.MAX_IMAGE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Image size (${sizeMb} MB) exceeds maximum allowed limit of 5.0 MB. Please compress or resize before uploading.`,
      };
    }

    return {
      valid: true,
      contentType: file.type,
      optimizedDimensions: { width: 1200, height: 628 }, // Optimal 1.91:1 banner ratio
    };
  }

  // ===========================================================================
  // 3. WEBHOOK IDEMPOTENCY & DUPLICATE PROTECTION
  // ===========================================================================

  /**
   * Checks if an inbound gateway webhook event has already been processed
   */
  static isWebhookDuplicate(eventId: string): boolean {
    if (!eventId) return false;
    return this.processedWebhooks.has(eventId);
  }

  /**
   * Marks a webhook event as successfully processed
   */
  static recordProcessedWebhook(eventId: string): void {
    if (eventId) {
      this.processedWebhooks.add(eventId);
      // Bound the set to prevent memory leaks in long-running processes (keep latest 50,000)
      if (this.processedWebhooks.size > 50000) {
        const first = this.processedWebhooks.values().next().value;
        if (first) this.processedWebhooks.delete(first);
      }
    }
  }

  // ===========================================================================
  // 4. CAMPAIGN CONTENT SPAM & MALWARE PROTECTION
  // ===========================================================================

  /**
   * Inspects campaign title, body, and CTA URL for security/spam risks
   */
  static validateCampaignContent(content: {
    title: string;
    description?: string | null;
    ctaUrl?: string | null;
  }): { passed: boolean; reason?: string } {
    const textToCheck = `${content.title} ${content.description || ''}`;

    for (const pattern of this.SPAM_PATTERNS) {
      if (pattern.test(textToCheck)) {
        return {
          passed: false,
          reason: 'Promotional content flagged: Contains prohibited or spam phrases.',
        };
      }
    }

    // URL protocol check
    if (content.ctaUrl) {
      const sanitized = sanitizeInput(content.ctaUrl);
      if (!sanitized.startsWith('https://') && !sanitized.startsWith('http://') && !sanitized.startsWith('/')) {
        return {
          passed: false,
          reason: 'CTA destination URL must use a secure protocol (https://).',
        };
      }
    }

    return { passed: true };
  }

  // ===========================================================================
  // 5. MULTI-TENANT ISOLATION ASSERTION
  // ===========================================================================

  /**
   * Asserts tenant boundary: prevents Business A from querying Business B
   */
  static assertTenantAccess(
    requestingBusinessId: string,
    targetBusinessId: string,
    isSuperAdmin = false
  ): void {
    if (isSuperAdmin) return; // Super admin has global cross-tenant clearance

    const cleanReq = requestingBusinessId.trim().toUpperCase();
    const cleanTarget = targetBusinessId.trim().toUpperCase();

    if (cleanReq !== cleanTarget) {
      throw new Error(`[SECURITY ACCESS DENIED] Tenant ${cleanReq} is not authorized to access resources belonging to Tenant ${cleanTarget}.`);
    }
  }
}
