/**
 * MANA CALENDAR 2027 — DEFERRED DEEP-LINK & QR ATTRIBUTION SERVICE
 *
 * Implements a tested, production-grade deferred deep linking engine for post-install
 * attribution and direct Android App Links routing:
 * Flow: QR Scan → Landing Page → Play Store (with Referrer) → App Install → First Launch → Business Recovery
 */

import type { DeferredDeepLinkAttribution } from '@mana/types';
import { ENV } from '@mana/config';
import { logger } from '@mana/utils';
import { supabase, isSupabaseConfigured } from '../supabase.client';

const DEFERRED_STORAGE_KEY = 'mana_deferred_attribution';
const PLAY_STORE_PACKAGE_ID = 'in.manacalendar.app';

// In-memory simulation bridge for tests & SSR
let memoryAttributionToken: DeferredDeepLinkAttribution | null = null;

export class DeferredDeepLinkService {
  /**
   * Generates public QR destination URL for a tenant
   * Example: https://yourdomain.in/b/slj001 or http://localhost:3000/b/slj001
   */
  static generateQrUrl(businessId: string, campaignId?: string): string {
    const cleanId = businessId.trim().toUpperCase();
    const base = `${ENV.appUrl}/b/${cleanId.toLowerCase()}`;
    return campaignId ? `${base}?c=${encodeURIComponent(campaignId)}` : base;
  }

  /**
   * Generates Play Store install URL with Play Install Referrer parameters
   * for reliable deferred attribution upon first app launch.
   */
  static generatePlayStoreReferrerUrl(businessId: string, campaignId?: string): string {
    const cleanId = businessId.trim().toUpperCase();
    const params = new URLSearchParams({
      utm_source: 'qr',
      utm_medium: 'deferred_deeplink',
      business_id: cleanId,
    });
    if (campaignId) {
      params.set('campaign_id', campaignId);
    }

    const referrerParam = encodeURIComponent(params.toString());
    return `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE_ID}&referrer=${referrerParam}`;
  }

  /**
   * Registers a pending deferred attribution record when a user scans QR in mobile browser
   * before installing the application.
   */
  static async registerPendingAttribution(
    businessId: string,
    campaignId?: string,
    source: 'qr' | 'web' | 'referral' = 'qr'
  ): Promise<string> {
    const cleanId = businessId.trim().toUpperCase();
    const token = `attr_${cleanId.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const attribution: DeferredDeepLinkAttribution = {
      token,
      business_id: cleanId,
      campaign_id: campaignId || null,
      source,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      timestamp: Date.now(),
    };

    // Store in browser storage bridge
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(DEFERRED_STORAGE_KEY, JSON.stringify(attribution));
      } catch (e) {
        logger.debug('Failed to write deferred attribution to localStorage', e);
      }
    }
    memoryAttributionToken = attribution;

    // Persist to backend if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('deferred_deeplinks').insert({
          token,
          business_id: cleanId,
          campaign_id: campaignId || null,
          referrer_url: attribution.referrer,
          status: 'pending',
        });
      } catch (err) {
        logger.debug('Failed to persist deferred attribution to database', err);
      }
    }

    return token;
  }

  /**
   * Alias for registerPendingAttribution
   */
  static async createDeferredAttributionToken(
    businessId: string,
    campaignId?: string,
    source: 'qr' | 'web' | 'referral' = 'qr'
  ): Promise<string> {
    return this.registerPendingAttribution(businessId, campaignId, source);
  }

  /**
   * Recovers attribution on app launch:
   * 1. Checks URL query params (e.g. ?b=SLJ001 or ?referrer=...)
   * 2. Checks local attribution bridge storage
   * 3. Checks in-memory test attribution bridge
   */
  static async checkAndRecoverAttribution(): Promise<DeferredDeepLinkAttribution | null> {
    // 1. Direct URL inspection (e.g. Android intent link or web link)
    if (typeof window !== 'undefined' && window.location) {
      const searchParams = new URLSearchParams(window.location.search);
      const urlBiz = searchParams.get('b') || searchParams.get('business_id');
      if (urlBiz) {
        const attr: DeferredDeepLinkAttribution = {
          business_id: urlBiz.trim().toUpperCase(),
          campaign_id: searchParams.get('c') || searchParams.get('campaign_id') || null,
          source: 'qr',
          timestamp: Date.now(),
        };
        this.clearAttribution();
        return attr;
      }

      // Check Play Install Referrer param format in URL (e.g. ?referrer=utm_source%3Dqr%26business_id%3DSLJ001)
      const rawReferrer = searchParams.get('referrer');
      if (rawReferrer) {
        try {
          const parsed = new URLSearchParams(decodeURIComponent(rawReferrer));
          const refBiz = parsed.get('business_id');
          if (refBiz) {
            const attr: DeferredDeepLinkAttribution = {
              business_id: refBiz.trim().toUpperCase(),
              campaign_id: parsed.get('campaign_id') || null,
              source: 'referral',
              timestamp: Date.now(),
            };
            this.clearAttribution();
            return attr;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    // 2. Check LocalStorage attribution bridge
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(DEFERRED_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as DeferredDeepLinkAttribution;
          // Expire after 7 days
          if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
            this.clearAttribution();
            return parsed;
          }
        } catch {
          this.clearAttribution();
        }
      }
    }

    // 3. In-memory fallback
    if (memoryAttributionToken) {
      const attr = { ...memoryAttributionToken };
      memoryAttributionToken = null;
      return attr;
    }

    return null;
  }

  /**
   * Simulates full install & first app launch for automated tests & QA
   */
  static async simulateInstallAndLaunch(referrerStringOrToken: string): Promise<DeferredDeepLinkAttribution | null> {
    let bizId: string | null = null;
    let campId: string | null = null;

    if (referrerStringOrToken.includes('business_id=')) {
      const params = new URLSearchParams(
        referrerStringOrToken.startsWith('http') || referrerStringOrToken.startsWith('market')
          ? new URL(referrerStringOrToken).searchParams.get('referrer') || ''
          : referrerStringOrToken
      );
      bizId = params.get('business_id');
      campId = params.get('campaign_id');
    } else if (memoryAttributionToken && memoryAttributionToken.token === referrerStringOrToken) {
      bizId = memoryAttributionToken.business_id;
      campId = memoryAttributionToken.campaign_id ?? null;
    }

    if (!bizId) return null;

    const result: DeferredDeepLinkAttribution = {
      business_id: bizId.toUpperCase(),
      campaign_id: campId || null,
      source: 'qr',
      timestamp: Date.now(),
    };

    this.clearAttribution();
    return result;
  }

  /**
   * Clears pending attribution so it never triggers repeatedly
   */
  static clearAttribution(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(DEFERRED_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    memoryAttributionToken = null;
  }
}
