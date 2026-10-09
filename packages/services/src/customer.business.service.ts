/**
 * MANA CALENDAR 2027 — CUSTOMER BUSINESS & "MY BUSINESSES" SERVICE
 *
 * Manages followed businesses, business selection, switching, search,
 * and General Calendar vs. Business Mode states.
 */

import type { Business, BusinessProfile, FollowedBusiness } from '@mana/types';
import { logger } from '@mana/utils';
import { supabase, isSupabaseConfigured } from './supabase.client';
import { BusinessService } from './business.service';

const ACTIVE_MODE_STORAGE_KEY = 'mana_active_business_mode';
const FOLLOWED_BIZ_STORAGE_KEY = 'mana_customer_followed_businesses';

// Pre-seeded businesses for verified local evaluation & offline mode
const SEEDED_BUSINESSES: Record<string, { business: Business; profile: BusinessProfile; plan: 'business' | 'premium' }> = {
  SLJ001: {
    business: {
      id: 'biz-slj001',
      business_id: 'SLJ001',
      name: 'Sri Lakshmi Jewellers',
      slug: 'sri-lakshmi-jewellers',
      owner_name: 'Lakshmi Narayana',
      status: 'active',
      plan_id: 'plan-premium',
      plan_code: 'premium',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    },
    profile: {
      id: 'prof-slj001',
      business_id: 'SLJ001',
      company_name: 'Sri Lakshmi Jewellers',
      tagline: 'Pure 916 BIS Hallmarked Gold & Diamond Jewellery',
      logo: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&auto=format&fit=crop&q=60',
      logo_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&auto=format&fit=crop&q=60',
      cover_image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&auto=format&fit=crop&q=80',
      category: 'Jewellery & Ornaments',
      description: 'Serving Visakhapatnam since 1984 with trusted 916 BIS hallmarked traditional and contemporary gold ornaments, diamond collections, and bridal jewellery.',
      phone: '+91 891 275 8899',
      email: 'contact@srilakshmijewellers.in',
      website: 'https://srilakshmijewellers.in',
      address: 'Shop No. 14-16, Jagadamba Junction, Main Road',
      latitude: 17.7126,
      longitude: 83.3012,
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530002',
      social_links: {
        instagram: 'https://instagram.com/srilakshmijewellers',
        whatsapp: '+918912758899',
      },
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    },
    plan: 'premium',
  },
  RF002: {
    business: {
      id: 'biz-rf002',
      business_id: 'RF002',
      name: 'Radha Flours & Foods',
      slug: 'radha-flours-and-foods',
      owner_name: 'Radha Krishna Murthy',
      status: 'active',
      plan_id: 'plan-business',
      plan_code: 'business',
      created_at: '2026-02-10T10:00:00Z',
      updated_at: '2026-02-10T10:00:00Z',
    },
    profile: {
      id: 'prof-rf002',
      business_id: 'RF002',
      company_name: 'Radha Flours & Foods',
      tagline: '100% Traditional Chakki Fresh Whole Wheat & Spices',
      logo: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=60',
      logo_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=60',
      cover_image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1000&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1000&auto=format&fit=crop&q=80',
      category: 'Groceries & Organic Staples',
      description: 'Fresh stone-ground wheat flours, cold-pressed oils, organic pulses, and genuine Andhra spice blends delivered fresh daily across Vijayawada.',
      phone: '+91 866 243 1122',
      email: 'info@radhaflours.in',
      website: 'https://radhaflours.in',
      address: 'Plot 42, Besant Road, Governorpet',
      latitude: 16.5131,
      longitude: 80.6272,
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      pincode: '520002',
      social_links: {
        whatsapp: '+918662431122',
      },
      created_at: '2026-02-10T10:00:00Z',
      updated_at: '2026-02-10T10:00:00Z',
    },
    plan: 'business',
  },
};

// In-memory fallback map for test environments
const memoryFollowed = new Map<string, FollowedBusiness>();
let memoryActiveBusinessMode: string | null = null;

export class CustomerBusinessService {
  /**
   * Returns current customer app mode:
   * null = General Calendar Mode
   * 'SLJ001' = Business Mode for SLJ001
   */
  static getActiveBusinessMode(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(ACTIVE_MODE_STORAGE_KEY) || null;
    }
    return memoryActiveBusinessMode;
  }

  /**
   * Sets active business mode or returns to general mode (null).
   * Note: Never silently changed; must be explicitly triggered.
   */
  static setActiveBusinessMode(businessId: string | null): void {
    const cleanId = businessId ? businessId.trim().toUpperCase() : null;
    if (typeof window !== 'undefined' && window.localStorage) {
      if (cleanId) {
        window.localStorage.setItem(ACTIVE_MODE_STORAGE_KEY, cleanId);
      } else {
        window.localStorage.removeItem(ACTIVE_MODE_STORAGE_KEY);
      }
    }
    memoryActiveBusinessMode = cleanId;
  }

  /**
   * Fetches business and public profile by ID, verifying premium status
   */
  static async getBusinessDetails(businessId: string): Promise<{
    business: Business;
    profile: BusinessProfile | null;
    isPremium: boolean;
  } | null> {
    const cleanId = businessId.trim().toUpperCase();

    // Check pre-seeded tenants first
    if (SEEDED_BUSINESSES[cleanId]) {
      const item = SEEDED_BUSINESSES[cleanId];
      return {
        business: item.business,
        profile: item.profile,
        isPremium: item.plan === 'premium',
      };
    }

    if (isSupabaseConfigured()) {
      try {
        const [biz, prof] = await Promise.all([
          BusinessService.getBusinessByTenantId(cleanId),
          BusinessService.getBusinessProfile(cleanId),
        ]);

        if (biz) {
          return {
            business: biz,
            profile: prof,
            isPremium: biz.plan_code === 'premium',
          };
        }
      } catch (err) {
        logger.debug('Failed to fetch business details from database', err);
      }
    }

    return null;
  }

  /**
   * Alias for getBusinessDetails by business code (e.g., 'SLJ001')
   */
  static async getBusinessByCode(businessId: string) {
    return this.getBusinessDetails(businessId);
  }

  /**
   * Fetches all followed businesses for a customer
   */
  static async getFollowedBusinesses(customerId: string): Promise<FollowedBusiness[]> {
    // Check localStorage in browser
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(`${FOLLOWED_BIZ_STORAGE_KEY}_${customerId}`);
      if (stored) {
        try {
          const list = JSON.parse(stored) as FollowedBusiness[];
          return list.filter((b) => b.is_active !== false);
        } catch {
          // ignore
        }
      }
    }

    const memoryList = Array.from(memoryFollowed.values()).filter(
      (b) => b.customer_id === customerId && b.is_active !== false
    );
    return memoryList;
  }

  /**
   * Follows a business (e.g. via QR scan or manual search)
   */
  static async followBusiness(
    customerId: string,
    businessId: string,
    relationship: 'followed' | 'qr_scanned' | 'interacted' = 'followed'
  ): Promise<FollowedBusiness | null> {
    const details = await this.getBusinessDetails(businessId);
    if (!details) {
      logger.warn('Cannot follow unknown business', { businessId });
      return null;
    }

    const cleanId = businessId.trim().toUpperCase();
    const followedObj: FollowedBusiness = {
      id: `fb-${customerId}-${cleanId}`,
      customer_id: customerId,
      business_id: cleanId,
      relationship_type: relationship,
      promotional_notifications_enabled: true,
      is_active: true,
      business: details.business,
      profile: details.profile || undefined,
      created_at: new Date().toISOString(),
      last_interacted_at: new Date().toISOString(),
    };

    memoryFollowed.set(`${customerId}_${cleanId}`, followedObj);

    if (typeof window !== 'undefined' && window.localStorage) {
      const list = await this.getFollowedBusinesses(customerId);
      const filtered = list.filter((b) => b.business_id !== cleanId);
      filtered.push(followedObj);
      window.localStorage.setItem(`${FOLLOWED_BIZ_STORAGE_KEY}_${customerId}`, JSON.stringify(filtered));
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('customer_businesses').upsert(
          {
            customer_id: customerId,
            business_id: cleanId,
            relationship_type: relationship,
            promotional_notifications_enabled: true,
            is_active: true,
            last_interacted_at: new Date().toISOString(),
          },
          { onConflict: 'customer_id,business_id,relationship_type' }
        );
      } catch (err) {
        logger.debug('Failed to sync followed business to database', err);
      }
    }

    return followedObj;
  }

  /**
   * Unfollows or removes a business from customer's list
   */
  static async unfollowBusiness(customerId: string, businessId: string): Promise<boolean> {
    const cleanId = businessId.trim().toUpperCase();
    memoryFollowed.delete(`${customerId}_${cleanId}`);

    if (typeof window !== 'undefined' && window.localStorage) {
      const list = await this.getFollowedBusinesses(customerId);
      const updated = list.filter((b) => b.business_id !== cleanId);
      window.localStorage.setItem(`${FOLLOWED_BIZ_STORAGE_KEY}_${customerId}`, JSON.stringify(updated));
    }

    // If currently in this business's mode, revert to General Mode
    if (this.getActiveBusinessMode() === cleanId) {
      this.setActiveBusinessMode(null);
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('customer_businesses')
          .update({ is_active: false })
          .eq('customer_id', customerId)
          .eq('business_id', cleanId);
      } catch (err) {
        logger.debug('Failed to sync unfollow to database', err);
      }
    }

    return true;
  }

  /**
   * Toggles promotional notifications for a specific business
   */
  static async toggleBusinessNotifications(
    customerId: string,
    businessId: string,
    enabled: boolean
  ): Promise<boolean> {
    const cleanId = businessId.trim().toUpperCase();
    const existing = memoryFollowed.get(`${customerId}_${cleanId}`);
    if (existing) {
      existing.promotional_notifications_enabled = enabled;
      memoryFollowed.set(`${customerId}_${cleanId}`, existing);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const list = await this.getFollowedBusinesses(customerId);
      const target = list.find((b) => b.business_id === cleanId);
      if (target) {
        target.promotional_notifications_enabled = enabled;
        window.localStorage.setItem(`${FOLLOWED_BIZ_STORAGE_KEY}_${customerId}`, JSON.stringify(list));
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('customer_businesses')
          .update({ promotional_notifications_enabled: enabled })
          .eq('customer_id', customerId)
          .eq('business_id', cleanId);
      } catch (err) {
        logger.debug('Failed to update business notification preference', err);
      }
    }

    return true;
  }

  /**
   * Searches businesses by name, business_id code, or city
   */
  static async searchBusinesses(query: string): Promise<Business[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const seededMatches = Object.values(SEEDED_BUSINESSES)
      .filter(
        (b) =>
          b.business.name.toLowerCase().includes(q) ||
          b.business.business_id.toLowerCase().includes(q) ||
          (b.profile.city && b.profile.city.toLowerCase().includes(q))
      )
      .map((b) => b.business);

    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('businesses')
          .select('*')
          .or(`name.ilike.%${q}%,business_id.ilike.%${q}%`)
          .eq('status', 'active')
          .limit(10);

        if (data && data.length > 0) return data;
      } catch {
        // Fallback to seeded
      }
    }

    return seededMatches;
  }
}
