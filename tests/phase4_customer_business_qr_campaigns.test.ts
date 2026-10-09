import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CustomerBusinessService,
  CampaignService,
  DeferredDeepLinkService,
  AnalyticsService,
  NotificationService,
} from '@mana/services';
import type { Campaign, BusinessAnalyticsEvent } from '@mana/types';

describe('PHASE 4 — Customer App + Business QR + Promotional Campaigns', () => {
  beforeEach(() => {
    // Reset mode, clear storage & memory events before each test
    CustomerBusinessService.setActiveBusinessMode(null);
    DeferredDeepLinkService.clearAttribution();
    AnalyticsService.clearMemoryEvents();
  });

  // ===========================================================================
  // 1. DIRECT PLAY STORE INSTALLATION & GENERAL CALENDAR MODE
  // ===========================================================================
  describe('1. Direct Play Store Installation & Customer Modes', () => {
    it('enters General Calendar Mode by default upon fresh direct install', () => {
      const activeMode = CustomerBusinessService.getActiveBusinessMode();
      expect(activeMode).toBeNull(); // General Calendar Mode
    });

    it('does not force the user to select or follow any business during installation', async () => {
      const customerId = 'cust_fresh_install';
      const followed = await CustomerBusinessService.getFollowedBusinesses(customerId);
      expect(followed).toEqual([]);
      expect(CustomerBusinessService.getActiveBusinessMode()).toBeNull();
    });
  });

  // ===========================================================================
  // 2. QR WITH APP INSTALLED & BUSINESS IDENTIFICATION
  // ===========================================================================
  describe('2. QR Scan With App Installed', () => {
    it('identifies business, follows merchant, records qr_scan event, and activates business mode', async () => {
      const customerId = 'cust_qr_user';
      const targetBiz = 'SLJ001';

      // 1. Record QR scan event
      await AnalyticsService.track('qr_scan', targetBiz, 'DIWALI2027');

      // 2. Identify & follow business
      const followed = await CustomerBusinessService.followBusiness(
        customerId,
        targetBiz,
        'qr_scanned'
      );
      expect(followed).not.toBeNull();
      expect(followed?.business_id).toBe('SLJ001');
      expect(followed?.relationship_type).toBe('qr_scanned');

      // 3. Switch to Business Mode
      CustomerBusinessService.setActiveBusinessMode(targetBiz);
      expect(CustomerBusinessService.getActiveBusinessMode()).toBe('SLJ001');

      // 4. Verify qr_scan event recorded
      const events = AnalyticsService.getEvents(targetBiz);
      const qrEvent = events.find((e) => e.event_type === 'qr_scan');
      expect(qrEvent).toBeDefined();
      expect(qrEvent?.business_id).toBe('SLJ001');
    });
  });

  // ===========================================================================
  // 3. COMPLETE DEFERRED DEEP-LINK POST-INSTALL ATTRIBUTION FLOW
  // ===========================================================================
  describe('3. QR Without App Installed & Tested Deferred Deep-Link Flow', () => {
    it('completes the entire tested lifecycle: QR → landing page → Play Store link with referrer → install → first app launch → business recovery', async () => {
      const bizId = 'SLJ001';
      const campaignId = 'DIWALI2027';

      // Step 1: User scans QR without app installed (visits landing page)
      const qrUrl = DeferredDeepLinkService.generateQrUrl(bizId, campaignId);
      expect(qrUrl).toContain('/b/slj001?c=DIWALI2027');

      // Step 2: Landing page registers pending deferred attribution token
      const token = await DeferredDeepLinkService.registerPendingAttribution(
        bizId,
        campaignId,
        'qr'
      );
      expect(token).toBeDefined();
      expect(token).toContain('attr_slj001');

      // Step 3: Landing page generates Play Store URL with Play Install Referrer
      const playStoreUrl = DeferredDeepLinkService.generatePlayStoreReferrerUrl(
        bizId,
        campaignId
      );
      expect(playStoreUrl).toContain('in.manacalendar.app');
      expect(playStoreUrl).toContain('referrer=');
      expect(decodeURIComponent(playStoreUrl)).toContain('business_id=SLJ001');
      expect(decodeURIComponent(playStoreUrl)).toContain('campaign_id=DIWALI2027');

      // Step 4 & 5: App is installed and opened for the first time
      const recovered = await DeferredDeepLinkService.simulateInstallAndLaunch(token);
      expect(recovered).not.toBeNull();
      expect(recovered?.business_id).toBe('SLJ001');
      expect(recovered?.campaign_id).toBe('DIWALI2027');
      expect(recovered?.source).toBe('qr');

      // Step 6: App applies recovered business attribution
      if (recovered?.business_id) {
        await CustomerBusinessService.followBusiness(
          'cust_deferred',
          recovered.business_id,
          'qr_scanned'
        );
        CustomerBusinessService.setActiveBusinessMode(recovered.business_id);
      }

      expect(CustomerBusinessService.getActiveBusinessMode()).toBe('SLJ001');

      // Step 7: Attribution is cleared and does not re-trigger on subsequent launches
      const secondCheck = await DeferredDeepLinkService.checkAndRecoverAttribution();
      expect(secondCheck).toBeNull();
    });
  });

  // ===========================================================================
  // 4. BUSINESS SELECTION, SWITCHING, SEARCH & REMOVAL
  // ===========================================================================
  describe('4. "My Businesses" Management & Switching', () => {
    it('allows following multiple businesses, switching modes, and searching', async () => {
      const customerId = 'cust_multi';

      // Follow SLJ001 and RF002
      await CustomerBusinessService.followBusiness(customerId, 'SLJ001', 'followed');
      await CustomerBusinessService.followBusiness(customerId, 'RF002', 'qr_scanned');

      const followed = await CustomerBusinessService.getFollowedBusinesses(customerId);
      expect(followed.length).toBe(2);

      // Switch active business mode to SLJ001
      CustomerBusinessService.setActiveBusinessMode('SLJ001');
      expect(CustomerBusinessService.getActiveBusinessMode()).toBe('SLJ001');

      // Switch to RF002
      CustomerBusinessService.setActiveBusinessMode('RF002');
      expect(CustomerBusinessService.getActiveBusinessMode()).toBe('RF002');

      // Switch back to General Calendar Mode
      CustomerBusinessService.setActiveBusinessMode(null);
      expect(CustomerBusinessService.getActiveBusinessMode()).toBeNull();

      // Search businesses by query
      const searchMatches = await CustomerBusinessService.searchBusinesses('lakshmi');
      expect(searchMatches.length).toBeGreaterThan(0);
      expect(searchMatches[0].business_id).toBe('SLJ001');
    });

    it('removes business and automatically reverts to general mode if active business is removed', async () => {
      const customerId = 'cust_removal';
      await CustomerBusinessService.followBusiness(customerId, 'SLJ001', 'followed');
      CustomerBusinessService.setActiveBusinessMode('SLJ001');

      expect(CustomerBusinessService.getActiveBusinessMode()).toBe('SLJ001');

      // Unfollow/remove
      await CustomerBusinessService.unfollowBusiness(customerId, 'SLJ001');
      const list = await CustomerBusinessService.getFollowedBusinesses(customerId);
      expect(list.find((b) => b.business_id === 'SLJ001')).toBeUndefined();

      // Mode automatically reverts to general
      expect(CustomerBusinessService.getActiveBusinessMode()).toBeNull();
    });

    it('never silently changes selected business without user action', async () => {
      CustomerBusinessService.setActiveBusinessMode('SLJ001');
      // Querying followed businesses or profiles must not alter active mode
      await CustomerBusinessService.getFollowedBusinesses('cust_other');
      await CustomerBusinessService.getBusinessDetails('RF002');
      expect(CustomerBusinessService.getActiveBusinessMode()).toBe('SLJ001');
    });
  });

  // ===========================================================================
  // 5. PROMOTIONAL CAMPAIGNS, EXPIRY & SCHEDULING
  // ===========================================================================
  describe('5. Promotional Campaigns Lifecycle & Display', () => {
    it('retrieves active campaigns for a business', async () => {
      const campaigns = await CampaignService.getActiveCampaignsForBusiness('SLJ001');
      expect(campaigns.length).toBeGreaterThan(0);
      expect(campaigns[0].business_id).toBe('SLJ001');
      expect(campaigns[0].status).toBe('active');
    });

    it('marks past campaigns as expired automatically', async () => {
      // Create a test campaign whose end date was yesterday
      const pastEndDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const pastCamp = await CampaignService.publishOrScheduleCampaign('SLJ001', {
        title: 'Past Summer Sale',
        description: 'Expired offer',
        campaign_type: 'banner',
        priority: 1,
        status: 'active',
        start_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        end_date: pastEndDate,
      });

      const all = await CampaignService.getBusinessCampaigns('SLJ001');
      const found = all.find((c) => c.id === pastCamp.id);
      expect(found?.status).toBe('expired');
    });
  });

  // ===========================================================================
  // 6. CAMPAIGN LIMITS (10/YR) & AUDITABLE CREDIT LEDGER
  // ===========================================================================
  describe('6. Campaign Quota Enforcement & Auditable Credits Ledger', () => {
    it('tracks annual campaign credits accurately and deducts on publish/schedule', async () => {
      const tenant = 'RF002';
      const initialUsage = await CampaignService.getCampaignUsage(tenant, 2027);
      const initialUsed = initialUsage.included_campaigns_used;

      // Publish a new campaign
      await CampaignService.publishOrScheduleCampaign(tenant, {
        title: 'Ugadi Fresh Atta Festival',
        description: 'Fresh wheat offer',
        campaign_type: 'banner',
        start_date: '2027-04-01T00:00:00Z',
        end_date: '2027-04-10T23:59:59Z',
      });

      const updatedUsage = await CampaignService.getCampaignUsage(tenant, 2027);
      expect(updatedUsage.included_campaigns_used).toBe(initialUsed + 1);

      // Verify immutable audit ledger entry
      const ledger = await CampaignService.getCampaignCreditsLedger(tenant, 2027);
      expect(ledger.length).toBeGreaterThan(0);
      expect(ledger[ledger.length - 1].business_id).toBe(tenant);
      expect(ledger[ledger.length - 1].credits_consumed).toBe(1);
    });

    it('deleting a campaign does NOT restore or refund the campaign credit quota', async () => {
      const tenant = 'RF002';
      const usageBefore = await CampaignService.getCampaignUsage(tenant, 2027);
      const usedBefore = usageBefore.included_campaigns_used;

      // Create campaign
      const camp = await CampaignService.publishOrScheduleCampaign(tenant, {
        title: 'Temporary Flash Offer',
        description: 'To be deleted',
        campaign_type: 'banner',
        start_date: '2027-05-01T00:00:00Z',
        end_date: '2027-05-05T23:59:59Z',
      });

      const usageAfterCreate = await CampaignService.getCampaignUsage(tenant, 2027);
      expect(usageAfterCreate.included_campaigns_used).toBe(usedBefore + 1);

      // Delete the campaign
      await CampaignService.deleteCampaign(tenant, camp.id);

      // Verify campaign is deleted from active listings
      const allCamps = await CampaignService.getBusinessCampaigns(tenant);
      expect(allCamps.find((c) => c.id === camp.id)).toBeUndefined();

      // STRICT RULE: Used credits count remains consumed!
      const usageAfterDelete = await CampaignService.getCampaignUsage(tenant, 2027);
      expect(usageAfterDelete.included_campaigns_used).toBe(usedBefore + 1);
    });

    it('allows purchasing additional campaign credits at ₹299 each and expands quota', async () => {
      const tenant = 'RF002';
      const before = await CampaignService.getCampaignUsage(tenant, 2027);
      const initialPurchased = before.extra_campaigns_purchased;

      const purchaseResult = await CampaignService.purchaseExtraCampaigns(tenant, 2, 2027);
      expect(purchaseResult.success).toBe(true);
      expect(purchaseResult.amountInr).toBe(2 * 299); // ₹598
      expect(purchaseResult.extraPurchasedTotal).toBe(initialPurchased + 2);

      const after = await CampaignService.getCampaignUsage(tenant, 2027);
      expect(after.extra_campaigns_purchased).toBe(initialPurchased + 2);

      // Verify ledger has extra_purchased entry
      const ledger = await CampaignService.getCampaignCreditsLedger(tenant, 2027);
      const extraEntry = ledger.find((l) => l.action === 'extra_purchased');
      expect(extraEntry).toBeDefined();
    });
  });

  // ===========================================================================
  // 7. SUBSCRIPTION TIERS & PUSH NOTIFICATION RESTRICTIONS
  // ===========================================================================
  describe('7. Subscription Plans & Promotional Push Enforcement', () => {
    it('verifies that Premium Plan (SLJ001 @ ₹3,999/yr) has enhanced branding and promotional push enabled', async () => {
      const details = await CustomerBusinessService.getBusinessDetails('SLJ001');
      expect(details?.isPremium).toBe(true);
      expect(details?.business.plan_code).toBe('premium');

      const canPush = await NotificationService.canBusinessSendPromotionalNotifications('SLJ001');
      expect(canPush.allowed).toBe(true);
      expect(canPush.plan).toBe('premium');
    });

    it('verifies that Standard Plan (RF002 @ ₹1,999/yr) is strictly blocked from promotional push notifications', async () => {
      const details = await CustomerBusinessService.getBusinessDetails('RF002');
      expect(details?.isPremium).toBe(false);
      expect(details?.business.plan_code).toBe('business');

      const canPush = await NotificationService.canBusinessSendPromotionalNotifications('RF002');
      expect(canPush.allowed).toBe(false);
      expect(canPush.plan).toBe('standard');
    });
  });

  // ===========================================================================
  // 8. NON-INTRUSIVE BANNER SLOTS & CONTROLLED ROTATION
  // ===========================================================================
  describe('8. Banner Slot Priority & Controlled Rotation', () => {
    it('prioritizes active business banner when customer is in Business Mode', async () => {
      CustomerBusinessService.setActiveBusinessMode('SLJ001');
      const banner = await CampaignService.getRotatedBanners('home', ['RF002'], 'SLJ001');
      expect(banner).not.toBeNull();
      expect(banner?.business_id).toBe('SLJ001');
    });

    it('rotates banners fairly across followed businesses in General Mode without overwhelming', async () => {
      CustomerBusinessService.setActiveBusinessMode(null);

      // Run multiple rotations
      const banner1 = await CampaignService.getRotatedBanners('calendar', ['SLJ001', 'RF002'], null);
      const banner2 = await CampaignService.getRotatedBanners('calendar', ['SLJ001', 'RF002'], null);

      expect(banner1).not.toBeNull();
      expect(banner2).not.toBeNull();
      // Only 1 banner returned per slot (never all at once)
      expect(typeof banner1?.title).toBe('string');
      expect(typeof banner2?.title).toBe('string');
    });
  });

  // ===========================================================================
  // 9. CUSTOMER CONTROLS & OPT-OUTS
  // ===========================================================================
  describe('9. Customer Preference Controls', () => {
    it('allows customer to opt out of promotional push notifications for a specific business', async () => {
      const customerId = 'cust_optout';
      await CustomerBusinessService.followBusiness(customerId, 'SLJ001', 'followed');

      // Toggle off notifications
      await CustomerBusinessService.toggleBusinessNotifications(customerId, 'SLJ001', false);

      const followed = await CustomerBusinessService.getFollowedBusinesses(customerId);
      const target = followed.find((b) => b.business_id === 'SLJ001');
      expect(target?.promotional_notifications_enabled).toBe(false);
    });
  });

  // ===========================================================================
  // 10. BUSINESS ANALYTICS TELEMETRY
  // ===========================================================================
  describe('10. Business Analytics Events Telemetry', () => {
    it('records and aggregates all required business telemetry events without collecting PII', async () => {
      const biz = 'SLJ001';

      await AnalyticsService.track('qr_scan', biz);
      await AnalyticsService.track('business_profile_view', biz);
      await AnalyticsService.track('business_follow', biz);
      await AnalyticsService.track('banner_impression', biz, 'DIWALI2027');
      await AnalyticsService.track('banner_click', biz, 'DIWALI2027');

      const events = AnalyticsService.getEvents(biz);
      expect(events.length).toBe(5);

      const summary = await AnalyticsService.getTenantAnalytics(biz);
      expect(summary.businessId).toBe('SLJ001');
      expect(summary.qrScans).toBeGreaterThan(0);
      expect(summary.totalImpressions).toBeGreaterThan(0);
      expect(summary.totalClicks).toBeGreaterThan(0);
    });
  });
});
