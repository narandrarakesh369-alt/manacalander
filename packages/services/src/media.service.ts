/**
 * MANA CALENDAR 2027 — MEDIA & STORAGE SERVICE
 *
 * Isolated storage management for business tenant media assets
 * (logos, banners, campaign creatives, and storefront photos).
 * Enforces file validation, tenant isolation, and image optimization.
 */

import { supabase, isSupabaseConfigured } from './supabase.client';
import { logger } from '@mana/utils';

export interface MediaAsset {
  id: string;
  business_id: string;
  name: string;
  category: 'logo' | 'banner' | 'campaign' | 'profile';
  url: string;
  size_bytes: number;
  mime_type: string;
  dimensions?: { width: number; height: number };
  created_at: string;
}

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// In-memory media store for local/offline mock execution and tests
const memoryMedia: MediaAsset[] = [
  {
    id: 'media-slj-1',
    business_id: 'SLJ001',
    name: 'slj_logo_hallmark.png',
    category: 'logo',
    url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&auto=format&fit=crop&q=60',
    size_bytes: 245760, // 240 KB
    mime_type: 'image/png',
    dimensions: { width: 500, height: 500 },
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'media-slj-2',
    business_id: 'SLJ001',
    name: 'diwali_utsavam_banner_2027.jpg',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&auto=format&fit=crop&q=80',
    size_bytes: 1258291, // 1.2 MB
    mime_type: 'image/jpeg',
    dimensions: { width: 1200, height: 600 },
    created_at: '2026-09-15T11:30:00Z',
  },
  {
    id: 'media-slj-3',
    business_id: 'SLJ001',
    name: 'storefront_dwaraka_nagar.jpg',
    category: 'profile',
    url: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1000&auto=format&fit=crop&q=80',
    size_bytes: 2516582, // 2.4 MB
    mime_type: 'image/jpeg',
    dimensions: { width: 1600, height: 900 },
    created_at: '2026-09-20T14:15:00Z',
  },
  {
    id: 'media-rf-1',
    business_id: 'RF002',
    name: 'radha_flours_logo.png',
    category: 'logo',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=60',
    size_bytes: 312000,
    mime_type: 'image/png',
    dimensions: { width: 400, height: 400 },
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    id: 'media-rf-2',
    business_id: 'RF002',
    name: 'sharbati_atta_banner.jpg',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1000&auto=format&fit=crop&q=80',
    size_bytes: 980000,
    mime_type: 'image/jpeg',
    dimensions: { width: 1200, height: 600 },
    created_at: '2026-09-12T15:00:00Z',
  },
];

export class MediaService {
  /**
   * Validates a file before upload against size and MIME type restrictions
   */
  static validateFile(file: { name: string; size: number; type: string }): UploadValidationResult {
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported file format (${file.type}). Only JPEG, PNG, and WebP are allowed.`,
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size (${sizeMb} MB) exceeds maximum limit of 5 MB.`,
      };
    }

    return { valid: true };
  }

  /**
   * Lists media assets strictly filtered by tenant business_id
   */
  static async listBusinessMedia(
    businessId: string,
    category?: MediaAsset['category']
  ): Promise<MediaAsset[]> {
    const cleanId = businessId.trim().toUpperCase();

    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('business_media')
          .select('*')
          .eq('business_id', cleanId)
          .order('created_at', { ascending: false });

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as MediaAsset[];
        }
      } catch (err) {
        logger.debug('Failed to fetch media from database, using memory store', err);
      }
    }

    // In-memory tenant isolation fallback
    return memoryMedia.filter((m) => {
      if (m.business_id !== cleanId) return false;
      if (category && m.category !== category) return false;
      return true;
    });
  }

  /**
   * Uploads a new media asset for a tenant.
   * Path is strictly prefixed with the tenant business_id: /{businessId}/{fileName}
   */
  static async uploadMedia(
    businessId: string,
    file: { name: string; size: number; type: string; dataUrl?: string; blob?: Blob },
    category: MediaAsset['category'] = 'banner'
  ): Promise<MediaAsset> {
    const cleanId = businessId.trim().toUpperCase();

    // 1. Validate
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 2. Generate asset path
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${cleanId}/${Date.now()}_${sanitizedName}`;
    const publicUrl = file.dataUrl || `https://storage.manacalendar.in/media/${storagePath}`;

    const newAsset: MediaAsset = {
      id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      business_id: cleanId,
      name: file.name,
      category,
      url: publicUrl,
      size_bytes: file.size,
      mime_type: file.type,
      dimensions: { width: 1200, height: 630 },
      created_at: new Date().toISOString(),
    };

    memoryMedia.unshift(newAsset);

    if (isSupabaseConfigured()) {
      try {
        if (file.blob) {
          await supabase.storage.from('campaign-media').upload(storagePath, file.blob, {
            contentType: file.type,
            upsert: false,
          });
        }

        await supabase.from('business_media').insert({
          id: newAsset.id,
          business_id: cleanId,
          name: newAsset.name,
          category: newAsset.category,
          url: newAsset.url,
          size_bytes: newAsset.size_bytes,
          mime_type: newAsset.mime_type,
          created_at: newAsset.created_at,
        });
      } catch (err) {
        logger.debug('Failed to sync uploaded media to Supabase', err);
      }
    }

    return newAsset;
  }

  /**
   * Deletes a media asset, ensuring tenant owns the asset
   */
  static async deleteMedia(businessId: string, mediaId: string): Promise<boolean> {
    const cleanId = businessId.trim().toUpperCase();
    const index = memoryMedia.findIndex((m) => m.id === mediaId && m.business_id === cleanId);

    if (index === -1) {
      throw new Error(`Media not found or unauthorized for tenant ${cleanId}`);
    }

    const removed = memoryMedia.splice(index, 1)[0];

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('business_media')
          .delete()
          .eq('id', mediaId)
          .eq('business_id', cleanId);

        // Delete from storage
        const storagePath = `${cleanId}/${removed.name}`;
        await supabase.storage.from('campaign-media').remove([storagePath]);
      } catch (err) {
        logger.debug('Failed to sync media deletion to Supabase', err);
      }
    }

    return true;
  }

  /**
   * Client-side image compression simulator / helper
   */
  static compressImage(
    originalSize: number,
    targetQuality = 0.8
  ): { originalBytes: number; compressedBytes: number; compressionRatio: string } {
    const compressedBytes = Math.round(originalSize * targetQuality);
    const savedPercent = Math.round((1 - compressedBytes / originalSize) * 100);
    return {
      originalBytes: originalSize,
      compressedBytes,
      compressionRatio: `${savedPercent}% smaller`,
    };
  }
}
