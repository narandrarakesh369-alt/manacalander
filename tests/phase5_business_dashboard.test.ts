import { describe, it, expect, beforeEach } from 'vitest';
import {
  BusinessService,
  CampaignService,
  MediaService,
  AnalyticsService,
  PaymentService,
  NotificationService,
  DeferredDeepLinkService,
} from '@mana/services';
import { PLANS_CONFIG } from '@mana/config';

describe('Phase 5 — Business Dashboard & Multi-Tenant Management', () => {
  beforeEach(() => {
    AnalyticsService.clearMemoryEvents();
  });

  // ===========================================================================
  // 1. MULTI-TENANT ISOLATION & PROFILE MANAGEMENT
  // ===========================================================================
  describe('Tenant Profile & Multi-Tenant Isolation', () => {
    it('retrieves distinct profiles for different tenants', async () => {
      const sljProfile = await BusinessService.getBusinessProfile('SLJ001');
      const rfProfile = await BusinessService.getBusinessProfile('RF002');

      expect(sljProfile).not.toBeNull();
      expect(sljProfile?.business_id).toBe('SLJ001');
      expect(sljProfile?.company_name).toBe('Sri Lakshmi Jewellers');
      expect(sljProfile?.city).toBe('Visakhapatnam');

      expect(rfProfile).not.toBeNull();
      expect(rfProfile?.business_id).toBe('RF002');
      expect(rfProfile?.company_name).toBe('Radha Flours & Foods');
      expect(rfProfile?.city).toBe('Vijayawada');
    });

    it('updates tenant profile with WhatsApp and operating hours without affecting other tenants', async () => {
      const updatedSlj = await BusinessService.updateBusinessProfile('SLJ001', {
        phone: '+91 891 999 8888',
        social_links: {
          whatsapp: '+918919998888',
          hours: '09:30 AM - 10:00 PM (Mon-Sat)',
        },
      });

      expect(updatedSlj.phone).toBe('+91 891 999 8888');
      expect(updatedSlj.social_links?.whatsapp).toBe('+918919998888');
      expect(updatedSlj.social_links?.hours).toBe('09:30 AM - 10:00 PM (Mon-Sat)');

      // Verify RF002 was not mutated
      const rfProfile = await BusinessService.getBusinessProfile('RF002');
      expect(rfProfile?.phone).toBe('+91 866 243 1122');
      expect(rfProfile?.social_links?.whatsapp).toBe('+918662431122');
    });
  });

  // ===========================================================================
  // 2. MEDIA LIBRARY & STORAGE VALIDATION
  // ===========================================================================
  describe('Media Library & Tenant Storage Security', () => {
    it('validates uploaded files against supported MIME types and size limit (5MB)', () => {
      // Valid JPEG, PNG, WebP
      const validJpeg = MediaService.validateFile({
        name: 'poster.jpg',
        size: 1024 * 1024 * 2, // 2MB
        type: 'image/jpeg',
      });
      expect(validJpeg.valid).toBe(true);

      const validPng = MediaService.validateFile({
        name: 'logo.png',
        size: 1024 * 500, // 500KB
        type: 'image/png',
      });
      expect(validPng.valid).toBe(true);

      // Invalid mime type (e.g. PDF or Executable)
      const invalidPdf = MediaService.validateFile({
        name: 'document.pdf',
        size: 1024 * 100,
        type: 'application/pdf',
      });
      expect(invalidPdf.valid).toBe(false);
      expect(invalidPdf.error).toContain('Unsupported file format');

      // Invalid size (> 5MB)
      const oversizeFile = MediaService.validateFile({
        name: 'huge_banner.jpg',
        size: 1024 * 1024 * 6, // 6MB
        type: 'image/jpeg',
      });
      expect(oversizeFile.valid).toBe(false);
      expect(oversizeFile.error).toContain('exceeds maximum limit of 5 MB');
    });

    it('enforces tenant folder isolation and prevents cross-tenant media access/deletion', async () => {
      const sljMedia = await MediaService.listBusinessMedia('SLJ001');
      const rfMedia = await MediaService.listBusinessMedia('RF002');

      expect(sljMedia.length).toBeGreaterThan(0);
      expect(rfMedia.length).toBeGreaterThan(0);

      // All SLJ media must have SLJ001 business_id
      sljMedia.forEach((m) => expect(m.business_id).toBe('SLJ001'));
      rfMedia.forEach((m) => expect(m.business_id).toBe('RF002'));

      // SLJ001 attempting to delete an RF002 asset must be rejected
      const targetRfAssetId = rfMedia[0].id;
      await expect(MediaService.deleteMedia('SLJ001', targetRfAssetId)).rejects.toThrow(
        /unauthorized/i
      );
    });

    it('simulates client-side image compression correctly', () => {
      const compressed = MediaService.compressImage(1024 * 1000, 0.75);
      expect(compressed.originalBytes).toBe(1024000);
      expect(compressed.compressedBytes).toBe(768000);
      expect(compressed.compressionRatio).toContain('25% smaller');
    });
  });

  // ===========================================================================
  // 3. CAMPAIGN CREDIT LEDGER & USAGE LIMITS
  // ===========================================================================
  describe('Campaign Credit Management & Quota Rules', () => {
    it('deducts 1 credit when publishing a campaign and enforces non-refundability on deletion', async () => {
      const tenant = 'RF002';
      const initialUsage = await CampaignService.getCampaignUsage(tenant, 2027);
      const usedBefore = initialUsage.included_campaigns_used;

      // Publish campaign
      const newCamp = await CampaignService.publishOrScheduleCampaign(tenant, {
        title: 'Ugadi Special Wheat Pack',
        description: 'Special Ugadi festival offer on 10kg Chakki fresh whole wheat flour.',
        campaign_type: 'festival_offer',
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
        cta_text: 'Order Now',
        cta_url: 'https://radhaflours.in',
        priority: 6,
        status: 'active',
        start_date: '2027-04-01T00:00:00Z',
        end_date: '2027-04-15T23:59:59Z',
      });

      expect(newCamp.id).toBeDefined();

      // Check usage incremented
      const usageAfter = await CampaignService.getCampaignUsage(tenant, 2027);
      expect(usageAfter.included_campaigns_used).toBe(usedBefore + 1);

      // Delete the campaign
      await CampaignService.deleteCampaign(tenant, newCamp.id);

      // Verify deletion did NOT restore the consumed credit
      const usageAfterDelete = await CampaignService.getCampaignUsage(tenant, 2027);
      expect(usageAfterDelete.included_campaigns_used).toBe(usedBefore + 1);
    });

    it('purchases extra campaigns at ₹299 each with auditable balance updating', async () => {
      const tenant = 'SLJ001';
      const initialUsage = await CampaignService.getCampaignUsage(tenant, 2027);
      const extraBefore = initialUsage.extra_campaigns_purchased;

      // Purchase 2 extra campaign boosters
      const purchaseResult = await CampaignService.purchaseExtraCampaigns(tenant, 2, 2027);
      expect(purchaseResult.success).toBe(true);
      expect(purchaseResult.amountInr).toBe(598); // 2 * 299

      const updatedUsage = await CampaignService.getCampaignUsage(tenant, 2027);
      expect(updatedUsage.extra_campaigns_purchased).toBe(extraBefore + 2);
    });
  });

  // ===========================================================================
  // 4. TENANT ANALYTICS & TIMEFRAME FILTERING
  // ===========================================================================
  describe('Tenant Analytics & Privacy Safeguards', () => {
    it('aggregates telemetry events across timeframes (7d, 30d, 3m, 1y) without PII', async () => {
      const analytics30d = await AnalyticsService.getTenantAnalytics('SLJ001', '30d');
      expect(analytics30d.totalImpressions).toBeGreaterThan(0);
      expect(analytics30d.totalClicks).toBeGreaterThan(0);
      expect(analytics30d.ctr).toBeGreaterThan(0);
      expect(analytics30d.qrScans).toBeGreaterThan(0);
      expect(analytics30d.profileViews).toBeGreaterThan(0);
      expect(analytics30d.followers).toBeGreaterThan(0);

      // 7d scale should be smaller than 30d
      const analytics7d = await AnalyticsService.getTenantAnalytics('SLJ001', '7d');
      expect(analytics7d.totalImpressions).toBeLessThan(analytics30d.totalImpressions);

      // 1y scale should be larger than 30d
      const analytics1y = await AnalyticsService.getTenantAnalytics('SLJ001', '1y');
      expect(analytics1y.totalImpressions).toBeGreaterThan(analytics30d.totalImpressions);
    });

    it('provides campaign-level performance breakdown with CTR calculation', async () => {
      const performance = await AnalyticsService.getCampaignPerformance('SLJ001');
      expect(performance.length).toBeGreaterThan(0);

      const firstCampaign = performance[0];
      expect(firstCampaign.campaignTitle).toBeDefined();
      expect(firstCampaign.impressions).toBeGreaterThan(0);
      expect(firstCampaign.clicks).toBeGreaterThan(0);

      const calculatedCtr = Number(((firstCampaign.clicks / firstCampaign.impressions) * 100).toFixed(2));
      expect(firstCampaign.ctr).toBeCloseTo(calculatedCtr, 1);
    });
  });

  // ===========================================================================
  // 5. SUBSCRIPTION TIERS & PLAN UPGRADES
  // ===========================================================================
  describe('Subscriptions, Plan Upgrades & GST Billing', () => {
    it('verifies standard vs premium subscription plans and upgrade transaction', async () => {
      // 1. Check plans config
      const plans = await PaymentService.getPlans();
      expect(plans.length).toBe(2);

      const businessPlan = plans.find((p) => p.plan_code === 'business');
      const premiumPlan = plans.find((p) => p.plan_code === 'premium');
      expect(businessPlan?.price_inr).toBe(1999);
      expect(premiumPlan?.price_inr).toBe(3999);

      // 2. Fetch subscription for RF002 (Business Plan)
      const rfSub = await PaymentService.getBusinessSubscription('RF002');
      expect(rfSub?.plan_id).toBe('plan-business');

      // 3. Upgrade RF002 to Premium Plan
      const upgradeRes = await PaymentService.upgradeSubscription('RF002', 'premium', 'UPI');
      expect(upgradeRes.success).toBe(true);
      expect(upgradeRes.subscription.plan_id).toBe('plan-premium');
      expect(upgradeRes.payment.amount).toBe(3999);
      expect(upgradeRes.payment.status).toBe('success');

      // 4. Verify upgraded state persists
      const refreshedSub = await PaymentService.getBusinessSubscription('RF002');
      expect(refreshedSub?.plan_id).toBe('plan-premium');

      // 5. Payment history includes the upgrade transaction
      const payments = await PaymentService.getPaymentHistory('RF002');
      expect(payments.length).toBeGreaterThan(0);
      expect(payments.some((p) => p.amount === 3999 && p.status === 'success')).toBe(true);
    });

    it('enforces that only Premium plan can send promotional push notifications', async () => {
      // SLJ001 is Premium
      const sljCheck = await NotificationService.canBusinessSendPromotionalNotifications('SLJ001');
      expect(sljCheck.allowed).toBe(true);

      // CMR003 without premium subscription should be blocked
      const nonPremiumCheck = await NotificationService.canBusinessSendPromotionalNotifications('UNKNOWN_TENANT');
      expect(nonPremiumCheck.allowed).toBe(false);
      expect(nonPremiumCheck.reason).toContain('Premium');
    });
  });

  // ===========================================================================
  // 6. QR CODE ATTRIBUTION
  // ===========================================================================
  describe('Store QR Code Attribution', () => {
    it('generates permanent QR destination URL formatted for deferred deep-linking', () => {
      const qrUrl = DeferredDeepLinkService.generateQrUrl('SLJ001');
      expect(qrUrl).toContain('/b/slj001');

      const rfUrl = DeferredDeepLinkService.generateQrUrl('RF002');
      expect(rfUrl).toContain('/b/rf002');
    });
  });
});
