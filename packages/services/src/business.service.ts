/**
 * MANA CALENDAR 2027 — BUSINESS SERVICE FOUNDATION
 * Multi-tenant business management and profile services.
 */

import { supabase, isSupabaseConfigured } from './supabase.client';
import type { Business, BusinessProfile } from '@mana/types';
import { logger } from '@mana/utils';

export class BusinessService {
  /**
   * Fetches business core record by unique tenant code (e.g. 'SLJ001')
   */
  static async getBusinessByTenantId(businessId: string): Promise<Business | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error('Failed to fetch business by tenant ID', { businessId, err });
      return null;
    }
  }

  /**
   * Internal memory store for development, testing, and offline modes
   */
  private static memoryProfiles: Map<string, BusinessProfile> = new Map([
    [
      'SLJ001',
      {
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
          hours: '10:00 AM - 09:30 PM (Mon-Sat)',
          facebook: 'https://facebook.com/srilakshmijewellers',
        } as Record<string, string>,
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      },
    ],
    [
      'RF002',
      {
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
          hours: '08:00 AM - 08:30 PM (Mon-Sun)',
        } as Record<string, string>,
        created_at: '2026-02-10T10:00:00Z',
        updated_at: '2026-02-10T10:00:00Z',
      },
    ],
  ]);

  /**
   * Fetches business public profile
   */
  static async getBusinessProfile(businessId: string): Promise<BusinessProfile | null> {
    const cleanId = businessId.trim().toUpperCase();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('business_id', cleanId)
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        logger.debug('Failed to fetch business profile from database, using memory fallback', { cleanId, err });
      }
    }

    return this.memoryProfiles.get(cleanId) || null;
  }

  /**
   * Updates business profile for the authenticated tenant.
   * Row Level Security ensures Business A cannot modify Business B.
   */
  static async updateBusinessProfile(
    businessId: string,
    updates: Partial<Omit<BusinessProfile, 'id' | 'business_id' | 'created_at' | 'updated_at'>>
  ): Promise<BusinessProfile> {
    const cleanId = businessId.trim().toUpperCase();
    const existing = this.memoryProfiles.get(cleanId) || {
      id: `prof-${cleanId.toLowerCase()}`,
      business_id: cleanId,
      logo: null,
      cover_image: null,
      description: null,
      phone: null,
      email: null,
      website: null,
      address: null,
      latitude: null,
      longitude: null,
      city: null,
      state: null,
      pincode: null,
      social_links: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated: BusinessProfile = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.memoryProfiles.set(cleanId, updated);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('business_profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('business_id', cleanId)
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        logger.debug('Supabase update failed or offline, returning in-memory profile', err);
      }
    }

    return updated;
  }

  /**
   * Lists all businesses (Admin function or public catalog directory)
   */
  static async listBusinesses(): Promise<Business[]> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      logger.error('Failed to list businesses', err);
      return [];
    }
  }
}
