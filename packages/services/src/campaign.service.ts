/**
 * MANA CALENDAR 2027 — CAMPAIGN & USAGE SERVICE
 *
 * Manages promotional campaigns, limits (10/yr included, ₹299 extra),
 * auditable credit ledger, expiry lifecycle, and non-intrusive banner rotation.
 */

import { supabase, isSupabaseConfigured } from './supabase.client';
import type {
  Campaign,
  CampaignStatus,
  CampaignUsage,
  CampaignCreditLedgerEntry,
  Banner,
  BannerSlotScreen,
} from '@mana/types';
import { CAMPAIGN_RULES } from '@mana/config';
import { logger } from '@mana/utils';

// Pre-seeded campaigns for verification & offline support
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'DIWALI2027',
    business_id: 'SLJ001',
    title: 'Diwali Swarna Utsavam — 0% Making Charges',
    description: 'Special Diwali 2027 offer on all 916 BIS Hallmarked bridal necklace sets & antique gold ornaments.',
    campaign_type: 'festival_offer',
    image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
    cta_text: 'View Diwali Collection',
    cta_url: 'https://srilakshmijewellers.in/diwali-2027',
    priority: 10,
    status: 'active',
    start_date: '2026-10-01T00:00:00Z',
    end_date: '2027-11-30T23:59:59Z',
    created_at: '2026-09-15T10:00:00Z',
    updated_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'UGADI2027_SLJ',
    business_id: 'SLJ001',
    title: 'Ugadi Shubhakankshalu — Free Silver Coin',
    description: 'Get an authentic 10g pure silver coin on gold purchases above ₹50,000 this Ugadi Telugu New Year.',
    campaign_type: 'festival_offer',
    image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    cta_text: 'Claim Ugadi Gift',
    cta_url: 'https://srilakshmijewellers.in/ugadi',
    priority: 8,
    status: 'active',
    start_date: '2027-04-01T00:00:00Z',
    end_date: '2027-04-15T23:59:59Z',
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'RF_ORGANIC_2027',
    business_id: 'RF002',
    title: 'Chakki Fresh Sharbati Atta — Flat 20% Off',
    description: '100% stone-ground MP Sharbati wheat flour delivered farm-fresh to your doorstep across Vijayawada.',
    campaign_type: 'banner',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    cta_text: 'Order Fresh Atta',
    cta_url: 'https://radhaflours.in/sharbati',
    priority: 5,
    status: 'active',
    start_date: '2026-09-01T00:00:00Z',
    end_date: '2027-12-31T23:59:59Z',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
];

// In-memory campaign storage
const memoryCampaigns = new Map<string, Campaign>(
  INITIAL_CAMPAIGNS.map((c) => [c.id, { ...c }])
);

// In-memory campaign usage storage
const memoryUsage = new Map<string, CampaignUsage>();
// In-memory audit ledger
const memoryLedger: CampaignCreditLedgerEntry[] = [];

// Track rotation indices for fair round-robin banner placement
let rotationIndex = 0;

export class CampaignService {
  /**
   * Fetches all campaigns for a business tenant, automatically evaluating expiry
   */
  static async getBusinessCampaigns(businessId: string): Promise<Campaign[]> {
    const cleanId = businessId.trim().toUpperCase();
    const now = new Date();

    // Check memory store
    const list = Array.from(memoryCampaigns.values())
      .filter((c) => c.business_id === cleanId)
      .map((c) => {
        // Auto-expire if end_date is past
        if (new Date(c.end_date) < now && c.status === 'active') {
          c.status = 'expired';
        }
        return c;
      });

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('business_id', cleanId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as Campaign[];
        }
      } catch (err) {
        logger.debug('Failed to get campaigns from database', err);
      }
    }

    return list;
  }

  /**
   * Fetches only active, currently-valid campaigns for a business
   */
  static async getActiveCampaignsForBusiness(businessId: string): Promise<Campaign[]> {
    const all = await this.getBusinessCampaigns(businessId);
    const now = new Date();
    return all.filter((c) => {
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      return c.status === 'active' && now >= start && now <= end;
    });
  }

  /**
   * Fetches campaign by unique ID
   */
  static async getCampaignById(campaignId: string): Promise<Campaign | null> {
    const cached = memoryCampaigns.get(campaignId);
    if (cached) return cached;

    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .maybeSingle();

        if (data) return data as Campaign;
      } catch {
        // fallback
      }
    }

    return null;
  }

  /**
   * Fetches annual campaign usage for a tenant.
   * Enforces architectural rule: 10 campaigns included per year. Extra: ₹299 each.
   */
  static async getCampaignUsage(businessId: string, year = 2027): Promise<CampaignUsage> {
    const cleanId = businessId.trim().toUpperCase();
    const key = `${cleanId}_${year}`;

    if (memoryUsage.has(key)) {
      return memoryUsage.get(key)!;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('campaign_usage')
          .select('*')
          .eq('business_id', cleanId)
          .eq('year', year)
          .maybeSingle();

        if (!error && data) {
          memoryUsage.set(key, data as CampaignUsage);
          return data as CampaignUsage;
        }
      } catch (err) {
        logger.debug('Failed to get campaign usage from database', err);
      }
    }

    // Default 10 included campaigns per year
    const defaultUsage: CampaignUsage = {
      id: `usage-${cleanId}-${year}`,
      business_id: cleanId,
      subscription_id: 'sub-active',
      year,
      included_campaigns_total: CAMPAIGN_RULES.INCLUDED_ANNUAL_CAMPAIGNS,
      included_campaigns_used: cleanId === 'SLJ001' ? 2 : 1, // Pre-seeded SLJ001 has 2, RF002 has 1
      extra_campaigns_purchased: 0,
      extra_campaigns_used: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryUsage.set(key, defaultUsage);
    return defaultUsage;
  }

  /**
   * Checks remaining campaign balance for the year
   */
  static async getRemainingCredits(businessId: string, year = 2027): Promise<{
    canPublish: boolean;
    totalAvailable: number;
    totalUsed: number;
    remaining: number;
  }> {
    const usage = await this.getCampaignUsage(businessId, year);
    const totalAvailable = usage.included_campaigns_total + usage.extra_campaigns_purchased;
    const totalUsed = usage.included_campaigns_used + usage.extra_campaigns_used;
    const remaining = Math.max(0, totalAvailable - totalUsed);

    return {
      canPublish: remaining > 0,
      totalAvailable,
      totalUsed,
      remaining,
    };
  }

  /**
   * Publishes or schedules a campaign, consuming 1 credit and recording an immutable ledger entry.
   * Throws error if quota is exceeded.
   */
  static async publishOrScheduleCampaign(
    businessId: string,
    campaignData: Omit<Campaign, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'status'> & {
      id?: string;
      business_id?: string;
      status?: CampaignStatus;
    },
    year = 2027
  ): Promise<Campaign> {
    const cleanId = businessId.trim().toUpperCase();
    const quota = await this.getRemainingCredits(cleanId, year);

    if (!quota.canPublish) {
      throw new Error(
        `Campaign limit reached. No credits remaining for business ${cleanId} in ${year}. Purchase an additional campaign for ₹299.`
      );
    }

    const campaignId = campaignData.id || `camp_${cleanId}_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const campaign: Campaign = {
      ...campaignData,
      id: campaignId,
      business_id: cleanId,
      status: campaignData.status || 'active',
      priority: campaignData.priority || 0,
      created_at: nowIso,
      updated_at: nowIso,
    };

    memoryCampaigns.set(campaignId, campaign);

    // Consume 1 credit
    const usage = await this.getCampaignUsage(cleanId, year);
    if (usage.included_campaigns_used < usage.included_campaigns_total) {
      usage.included_campaigns_used += 1;
    } else {
      usage.extra_campaigns_used += 1;
    }
    usage.updated_at = nowIso;
    memoryUsage.set(`${cleanId}_${year}`, usage);

    const balanceAfter = (usage.included_campaigns_total + usage.extra_campaigns_purchased) -
      (usage.included_campaigns_used + usage.extra_campaigns_used);

    // Record immutable audit ledger
    const ledgerEntry: CampaignCreditLedgerEntry = {
      id: `ledg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      business_id: cleanId,
      year,
      action: campaign.status === 'scheduled' ? 'campaign_scheduled' : 'campaign_published',
      campaign_id: campaignId,
      credits_consumed: 1,
      balance_after: balanceAfter,
      notes: `Published campaign: ${campaign.title}`,
      created_at: nowIso,
    };
    memoryLedger.push(ledgerEntry);

    // Sync with Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('campaigns').upsert(campaign);
        await supabase.rpc('consume_campaign_credit', {
          p_business_id: cleanId,
          p_campaign_id: campaignId,
          p_year: year,
          p_action: ledgerEntry.action,
        });
      } catch (err) {
        logger.debug('Database campaign publish bypassed in offline mode', err);
      }
    }

    return campaign;
  }

  /**
   * Deletes a campaign.
   * STRICT BUSINESS RULE: Deleting a campaign does NOT restore or refund the campaign credit!
   */
  static async deleteCampaign(businessId: string, campaignId: string): Promise<boolean> {
    const cleanId = businessId.trim().toUpperCase();
    const existing = memoryCampaigns.get(campaignId);

    if (existing && existing.business_id === cleanId) {
      memoryCampaigns.delete(campaignId);
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('campaigns')
          .delete()
          .eq('id', campaignId)
          .eq('business_id', cleanId);
      } catch (err) {
        logger.debug('Failed to delete campaign from database', err);
      }
    }

    return true;
  }

  /**
   * Purchases additional campaigns at ₹299 per campaign.
   */
  static async purchaseExtraCampaigns(
    businessId: string,
    quantity: number,
    year = 2027
  ): Promise<{
    success: boolean;
    extraPurchasedTotal: number;
    remainingCredits: number;
    amountInr: number;
  }> {
    if (quantity <= 0) {
      throw new Error('Quantity must be at least 1');
    }

    const cleanId = businessId.trim().toUpperCase();
    const usage = await this.getCampaignUsage(cleanId, year);
    usage.extra_campaigns_purchased += quantity;
    usage.updated_at = new Date().toISOString();
    memoryUsage.set(`${cleanId}_${year}`, usage);

    const remaining = (usage.included_campaigns_total + usage.extra_campaigns_purchased) -
      (usage.included_campaigns_used + usage.extra_campaigns_used);

    // Record audit ledger
    memoryLedger.push({
      id: `ledg_${Date.now()}_extra`,
      business_id: cleanId,
      year,
      action: 'extra_purchased',
      campaign_id: null,
      credits_consumed: 0,
      balance_after: remaining,
      notes: `Purchased ${quantity} extra campaigns @ ₹299 each (Total: ₹${quantity * 299})`,
      created_at: new Date().toISOString(),
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase.rpc('purchase_additional_campaign_credits', {
          p_business_id: cleanId,
          p_quantity: quantity,
          p_year: year,
        });
      } catch (err) {
        logger.debug('Database credit purchase bypassed in offline mode', err);
      }
    }

    return {
      success: true,
      extraPurchasedTotal: usage.extra_campaigns_purchased,
      remainingCredits: remaining,
      amountInr: quantity * 299,
    };
  }

  /**
   * Fetches auditable campaign credit ledger entries
   */
  static async getCampaignCreditsLedger(businessId: string, year = 2027): Promise<CampaignCreditLedgerEntry[]> {
    const cleanId = businessId.trim().toUpperCase();
    return memoryLedger.filter((l) => l.business_id === cleanId && l.year === year);
  }

  /**
   * Controlled Banner Rotation & Priority Engine
   *
   * Rules:
   * 1. If in Business Mode (activeBusinessId): Priority given to that business's active campaign.
   * 2. If in General Mode: Controlled round-robin / priority rotation across followed businesses.
   * 3. Never displays all banners simultaneously.
   * 4. Never lets one business overwhelm.
   * 5. Non-intrusive slot design.
   */
  static async getRotatedBanners(
    screen: BannerSlotScreen,
    followedBusinessIds?: string[],
    activeBusinessId?: string | null
  ): Promise<Campaign | null> {
    const now = new Date();
    const activeCampaigns = Array.from(memoryCampaigns.values()).filter((c) => {
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      return c.status === 'active' && now >= start && now <= end;
    });

    if (activeCampaigns.length === 0) return null;

    // 1. If user is in Business Mode, show active campaign for this business
    if (activeBusinessId) {
      const bizCampaigns = activeCampaigns.filter(
        (c) => c.business_id === activeBusinessId.toUpperCase()
      );
      if (bizCampaigns.length > 0) {
        // Return highest priority campaign
        bizCampaigns.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        return bizCampaigns[0];
      }
    }

    // 2. If user follows specific businesses, prioritize followed businesses
    let candidateCampaigns = activeCampaigns;
    if (followedBusinessIds && followedBusinessIds.length > 0) {
      const cleanFollowed = followedBusinessIds.map((id) => id.toUpperCase());
      const followedCampaigns = activeCampaigns.filter((c) =>
        cleanFollowed.includes(c.business_id)
      );
      if (followedCampaigns.length > 0) {
        candidateCampaigns = followedCampaigns;
      }
    }

    // 3. Controlled fair rotation
    rotationIndex = (rotationIndex + 1) % candidateCampaigns.length;
    return candidateCampaigns[rotationIndex] || candidateCampaigns[0] || null;
  }

  /**
   * Fetches active banners for the customer application
   */
  static async getActiveBanners(_slot?: BannerSlotScreen | string): Promise<Banner[]> {
    try {
      if (isSupabaseConfigured()) {
        const { data } = await supabase
          .from('banners')
          .select('*')
          .eq('status', 'active');
        if (data && data.length > 0) return data as Banner[];
      }
    } catch {
      // fallback
    }

    // Offline / test fallback derived from active campaigns
    const now = new Date();
    const activeCampaigns = Array.from(memoryCampaigns.values()).filter((c) => {
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      return c.status === 'active' && now >= start && now <= end;
    });

    return activeCampaigns.map((c) => ({
      id: `banner-${c.id}`,
      business_id: c.business_id,
      campaign_id: c.id,
      title: c.title,
      image_url: c.image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
      target_url: c.cta_url || null,
      status: 'active' as const,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
  }
}
