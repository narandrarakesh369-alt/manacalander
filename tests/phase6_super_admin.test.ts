import { describe, it, expect, beforeEach } from 'vitest';
import { AdminService, CampaignService, PaymentService } from '@mana/services';
import type { AdminRoleType } from '@mana/types';

describe('PHASE 6: SUPER ADMIN + PAYMENTS + PLATFORM MANAGEMENT', () => {
  // ===========================================================================
  // 1. SUPER ADMIN AUTHENTICATION & MFA
  // ===========================================================================
  describe('1. Super Admin Authentication & MFA', () => {
    it('authenticates Super Admin with email/password and prompts for MFA code', async () => {
      const result = await AdminService.login('owner@manacalendar2027.com', 'admin123');
      expect(result.requiresMfa).toBe(true);
      expect(result.admin).toBeDefined();
      expect(result.admin.email).toBe('owner@manacalendar2027.com');
      expect(result.role).toBe('owner');
    });

    it('rejects invalid password credentials', async () => {
      await expect(
        AdminService.login('admin@manacalendar2027.com', 'wrongpassword')
      ).rejects.toThrow('Invalid Super Admin credentials.');
    });

    it('verifies valid 6-digit TOTP / MFA code', () => {
      const isValid = AdminService.verifyMfaCode('admin-owner-01', '123456');
      expect(isValid).toBe(true);

      const logs = AdminService.getAuditLogs({ action: 'admin_mfa_verified' });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].actor_id).toBe('admin-owner-01');
    });

    it('rejects incorrect MFA code', () => {
      const isValid = AdminService.verifyMfaCode('admin-owner-01', '000000');
      expect(isValid).toBe(false);
    });
  });

  // ===========================================================================
  // 2. SERVER-SIDE ROLE & PERMISSIONS ENFORCEMENT
  // ===========================================================================
  describe('2. Role-Based Access Control (RBAC) Permissions', () => {
    it('grants owner full access to all system capabilities', () => {
      const permissions = [
        'manage_businesses',
        'suspend_business',
        'manage_plans',
        'extend_subscriptions',
        'manage_payments',
        'moderate_campaigns',
        'manage_calendar',
        'verify_panchangam',
        'manage_notifications',
        'view_analytics',
        'manage_support',
        'view_audit_logs',
      ] as const;

      for (const p of permissions) {
        expect(AdminService.hasPermission('owner', p)).toBe(true);
      }
    });

    it('enforces Admin role boundaries (can manage businesses/plans but not edit ephemeris)', () => {
      expect(AdminService.hasPermission('admin', 'manage_businesses')).toBe(true);
      expect(AdminService.hasPermission('admin', 'suspend_business')).toBe(true);
      expect(AdminService.hasPermission('admin', 'manage_plans')).toBe(true);
      expect(AdminService.hasPermission('admin', 'extend_subscriptions')).toBe(true);
      expect(AdminService.hasPermission('admin', 'manage_payments')).toBe(true);
      expect(AdminService.hasPermission('admin', 'moderate_campaigns')).toBe(true);
      expect(AdminService.hasPermission('admin', 'view_audit_logs')).toBe(true);
    });

    it('restricts Content Admin strictly to editorial calendar and Panchangam', () => {
      expect(AdminService.hasPermission('content_admin', 'manage_calendar')).toBe(true);
      expect(AdminService.hasPermission('content_admin', 'verify_panchangam')).toBe(true);
      // Denied operations
      expect(AdminService.hasPermission('content_admin', 'suspend_business')).toBe(false);
      expect(AdminService.hasPermission('content_admin', 'manage_plans')).toBe(false);
      expect(AdminService.hasPermission('content_admin', 'extend_subscriptions')).toBe(false);
      expect(AdminService.hasPermission('content_admin', 'manage_payments')).toBe(false);
      expect(AdminService.hasPermission('content_admin', 'view_audit_logs')).toBe(false);
    });

    it('restricts Support Admin strictly to support desk inquiries', () => {
      expect(AdminService.hasPermission('support_admin', 'manage_support')).toBe(true);
      // Denied operations
      expect(AdminService.hasPermission('support_admin', 'suspend_business')).toBe(false);
      expect(AdminService.hasPermission('support_admin', 'manage_plans')).toBe(false);
      expect(AdminService.hasPermission('support_admin', 'manage_payments')).toBe(false);
      expect(AdminService.hasPermission('support_admin', 'moderate_campaigns')).toBe(false);
      expect(AdminService.hasPermission('support_admin', 'verify_panchangam')).toBe(false);
    });
  });

  // ===========================================================================
  // 3. BUSINESS TENANT LIFECYCLE MANAGEMENT
  // ===========================================================================
  describe('3. Commercial Business Tenant Lifecycle', () => {
    it('lists registered businesses with search, status, and plan filters', async () => {
      const all = await AdminService.listBusinesses();
      expect(all.length).toBeGreaterThanOrEqual(3);

      const activeOnly = await AdminService.listBusinesses({ status: 'active' });
      expect(activeOnly.every((b) => b.status === 'active')).toBe(true);

      const premiumOnly = await AdminService.listBusinesses({ plan: 'premium' });
      expect(premiumOnly.every((b) => b.plan_code === 'premium')).toBe(true);

      const searchVizag = await AdminService.listBusinesses({ search: 'Lakshmi' });
      expect(searchVizag.length).toBeGreaterThanOrEqual(1);
      expect(searchVizag[0].name).toContain('Lakshmi');
    });

    it('provisions new business tenant: auto-generates ID, creates profile, QR URL & subscription', async () => {
      const result = await AdminService.createBusiness({
        name: 'Venkata Sai Sweets',
        owner_name: 'Sai Prasad',
        email: 'info@venkatasaisweets.in',
        phone: '+91 99887 76655',
        category: 'Restaurants & Sweets',
        address: 'MVP Colony, Sector 2',
        city: 'Visakhapatnam',
        plan_code: 'premium',
      });

      // 1. Auto-generated unique business_id
      expect(result.business.business_id).toMatch(/^[A-Z]{2,3}\d{3}$/);
      expect(result.business.name).toBe('Venkata Sai Sweets');
      expect(result.business.status).toBe('active');
      expect(result.business.plan_code).toBe('premium');

      // 2. Profile with contact & city
      expect(result.profile.company_name).toBe('Venkata Sai Sweets');
      expect(result.profile.city).toBe('Visakhapatnam');
      expect(result.profile.phone).toBe('+91 99887 76655');

      // 3. Subscription with active dates
      expect(result.subscription.business_id).toBe(result.business.business_id);
      expect(result.subscription.status).toBe('active');
      expect(result.subscription.end_date).toContain('2027');

      // 4. Audit log entry recorded
      const logs = AdminService.getAuditLogs({ action: 'business_created' });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].resource_id).toBe(result.business.business_id);
    });

    it('suspends business with mandatory reason: pauses active campaigns while safely retaining data', async () => {
      // SLJ001 has active campaigns
      const suspended = await AdminService.suspendBusiness(
        'SLJ001',
        'Suspended due to annual billing dispute',
        'admin-owner-01'
      );

      expect(suspended.status).toBe('suspended');

      // Verify campaigns under SLJ001 are paused
      const camps = await CampaignService.getBusinessCampaigns('SLJ001');
      expect(camps.every((c) => c.status === 'paused' || c.status !== 'active')).toBe(true);

      // Verify audit log has before/after values
      const logs = AdminService.getAuditLogs({ action: 'business_suspended' });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].resource_id).toBe('SLJ001');
      expect(logs[0].before_value?.status).toBe('active');
      expect(logs[0].after_value?.status).toBe('suspended');
    });

    it('reactivates a suspended tenant safely restoring active status', async () => {
      const reactivated = await AdminService.reactivateBusiness('SLJ001', 'admin-owner-01');
      expect(reactivated.status).toBe('active');

      const logs = AdminService.getAuditLogs({ action: 'business_reactivated' });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].resource_id).toBe('SLJ001');
      expect(logs[0].after_value?.status).toBe('active');
    });
  });

  // ===========================================================================
  // 4. DYNAMIC DATABASE-DRIVEN PLAN MANAGEMENT
  // ===========================================================================
  describe('4. Dynamic Database-Driven Plans Governance', () => {
    it('retrieves active platform plans dynamically', () => {
      const plans = AdminService.getPlans();
      expect(plans.length).toBeGreaterThanOrEqual(2);

      const businessPlan = plans.find((p) => p.plan_code === 'business');
      expect(businessPlan).toBeDefined();
      expect(businessPlan?.price_inr).toBe(1999);
      expect(businessPlan?.features.promotional_push_notifications).toBe(false);

      const premiumPlan = plans.find((p) => p.plan_code === 'premium');
      expect(premiumPlan).toBeDefined();
      expect(premiumPlan?.price_inr).toBe(3999);
      expect(premiumPlan?.features.promotional_push_notifications).toBe(true);
    });

    it('updates dynamic plan price and campaign quota with immutable audit record', () => {
      const updated = AdminService.updatePlan(
        'plan-business',
        { price_inr: 2199, included_campaigns: 12 },
        'admin-owner-01'
      );

      expect(updated.price_inr).toBe(2199);
      expect(updated.included_campaigns).toBe(12);

      const logs = AdminService.getAuditLogs({ action: 'plan_updated' });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].resource_id).toBe('plan-business');
      expect(logs[0].after_value?.price_inr).toBe(2199);

      // Revert back for clean state
      AdminService.updatePlan('plan-business', { price_inr: 1999, included_campaigns: 10 });
    });
  });

  // ===========================================================================
  // 5. SUBSCRIPTIONS & MANUAL EXTENSIONS
  // ===========================================================================
  describe('5. Subscriptions & Renewal Schedule', () => {
    it('manually extends an active subscription with mandatory reason and audit diff', async () => {
      const extended = await AdminService.extendSubscription(
        'RF002',
        '2028-06-30T23:59:59Z',
        'Special promotional extension approved by owner',
        'admin-owner-01'
      );

      expect(extended.end_date).toBe('2028-06-30T23:59:59Z');

      const logs = AdminService.getAuditLogs({ action: 'subscription_extended' });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].after_value?.end_date).toBe('2028-06-30T23:59:59Z');
      expect(logs[0].after_value?.reason).toContain('Special promotional extension');
    });

    it('computes 5-stage automated renewal reminder schedule (30d, 15d, 7d, 3d, 1d)', () => {
      const schedule = AdminService.getRenewalReminderSchedule('2027-12-31T00:00:00Z');
      expect(schedule.length).toBe(5);

      const days = schedule.map((s) => s.daysBefore);
      expect(days).toEqual([30, 15, 7, 3, 1]);

      // 30 days before Dec 31 is Dec 01
      expect(schedule[0].targetDate).toBe('2027-12-01');
      // 1 day before Dec 31 is Dec 30
      expect(schedule[4].targetDate).toBe('2027-12-30');
    });
  });

  // ===========================================================================
  // 6. PAYMENT GATEWAYS & HMAC SIGNATURES
  // ===========================================================================
  describe('6. Payment Gateway Verification & Webhooks', () => {
    it('verifies HMAC payment signature and rejects missing or short signatures', () => {
      const valid = AdminService.verifyPaymentSignature({
        orderId: 'order_123',
        paymentId: 'pay_123',
        signature: 'sig_verified_a1b2c3d4e5f6789012345678',
      });
      expect(valid).toBe(true);

      const invalid = AdminService.verifyPaymentSignature({
        orderId: 'order_123',
        paymentId: 'pay_123',
        signature: 'invalid_short',
      });
      expect(invalid).toBe(false);
    });

    it('processes verified payment.captured webhook and upgrades subscription', async () => {
      const result = await AdminService.handlePaymentWebhook({
        event_type: 'payment.captured',
        payload: {
          order_id: 'ord_rzp_9901',
          payment_id: 'pay_rzp_9901',
          business_id: 'RF002',
          amount: 3999,
          plan_code: 'premium',
        },
        signature: 'sig_verified_9941a82bc1947e8912345678',
      });

      expect(result.status).toBe('processed');

      const logs = AdminService.getAuditLogs({ action: 'payment_webhook_captured' });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].resource_id).toBe('pay_rzp_9901');
    });

    it('rejects tampered or forged webhook signatures', async () => {
      const result = await AdminService.handlePaymentWebhook({
        event_type: 'payment.captured',
        payload: {
          order_id: 'ord_bad',
          payment_id: 'pay_bad',
          business_id: 'RF002',
          amount: 3999,
          plan_code: 'premium',
        },
        signature: 'bad_sig',
      });

      expect(result.status).toBe('rejected');
      expect(result.reason).toContain('Invalid HMAC webhook signature');
    });
  });

  // ===========================================================================
  // 7. CONTENT & CAMPAIGN MODERATION
  // ===========================================================================
  describe('7. Campaign Content Moderation', () => {
    it('moderates a campaign (pause, flag, remove) with moderator identity and reason', async () => {
      const modLog = await AdminService.moderateCampaign(
        'cmp_slj_01',
        'pause',
        'Creative banner contains low resolution artwork',
        'admin-owner-01',
        'Rajesh Varma'
      );

      expect(modLog.campaign_id).toBe('cmp_slj_01');
      expect(modLog.action).toBe('pause');
      expect(modLog.admin_name).toBe('Rajesh Varma');
      expect(modLog.reason).toContain('low resolution artwork');

      const logs = AdminService.getAuditLogs({ action: 'campaign_moderation' });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].resource_id).toBe('cmp_slj_01');
    });
  });

  // ===========================================================================
  // 8. PANCHANGAM VERIFICATION & AUDIT TRAIL
  // ===========================================================================
  describe('8. Panchangam Ephemeris Verification & Publishing', () => {
    it('records editorial sign-off for astronomical calculations with immutable audit trail', () => {
      const ephemerisData = {
        date: '2027-01-15',
        city: 'Visakhapatnam',
        tithi: 'Shukla Ashtami',
        sunrise: '06:28 AM',
        sunset: '05:48 PM',
      };

      const audit = AdminService.verifyAndPublishPanchangam(
        '2027-01-15',
        ephemerisData,
        'Verified against Tirumala Tirupati Devasthanams Panchangam',
        'admin-content-03',
        'Pandit Sharma'
      );

      expect(audit.calendar_date).toBe('2027-01-15');
      expect(audit.action).toBe('verified');
      expect(audit.admin_name).toBe('Pandit Sharma');

      const history = AdminService.getPanchangamAudits();
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].calendar_date).toBe('2027-01-15');
    });
  });

  // ===========================================================================
  // 9. WEATHER TELEMETRY & CACHE CONFIGURATION
  // ===========================================================================
  describe('9. Weather Telemetry & Provider Settings', () => {
    it('retrieves and updates weather cache TTLs and provider telemetry', () => {
      const config = AdminService.getWeatherConfig();
      expect(config.currentTtlSeconds).toBe(1800);
      expect(config.forecastTtlSeconds).toBe(21600);

      const updated = AdminService.updateWeatherConfig(
        { currentTtlSeconds: 1200, forecastTtlSeconds: 14400 },
        'admin-owner-01'
      );

      expect(updated.currentTtlSeconds).toBe(1200);
      expect(updated.forecastTtlSeconds).toBe(14400);

      const logs = AdminService.getAuditLogs({ action: 'weather_settings_updated' });
      expect(logs.length).toBeGreaterThanOrEqual(1);

      // Revert back
      AdminService.updateWeatherConfig({ currentTtlSeconds: 1800, forecastTtlSeconds: 21600 });
    });
  });

  // ===========================================================================
  // 10. SUPPORT DESK & TICKET RESOLUTION
  // ===========================================================================
  describe('10. Support Desk & Ticket Resolution', () => {
    it('lists merchant support tickets and transitions ticket lifecycle with resolution notes', () => {
      const tickets = AdminService.listSupportTickets();
      expect(tickets.length).toBeGreaterThanOrEqual(3);

      const ticket = tickets[0];
      const updated = AdminService.updateTicketStatus(
        ticket.id,
        'resolved',
        'admin-support-04',
        'Approved priority festival slot for merchant.'
      );

      expect(updated.status).toBe('resolved');

      const logs = AdminService.getAuditLogs({ action: 'support_ticket_updated' });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].resource_id).toBe(ticket.id);
      expect(logs[0].details?.resolutionNote).toContain('Approved priority festival slot');
    });
  });

  // ===========================================================================
  // 11. IMMUTABLE SECURITY & AUDIT LOGGING
  // ===========================================================================
  describe('11. Immutable Security & Audit Logging', () => {
    it('records immutable audit log entries with actor, resource, before/after diffs, and IP address', () => {
      const log = AdminService.recordAuditLog({
        actor_id: 'admin-owner-01',
        actor_type: 'admin',
        action: 'system_security_check',
        resource_type: 'platform_security',
        resource_id: 'sec_001',
        details: { check: 'mfa_enforcement_pass' },
        before_value: { status: 'pending' },
        after_value: { status: 'passed' },
        ip_address: '103.48.196.12',
      });

      expect(log.id).toBeDefined();
      expect(log.created_at).toBeDefined();
      expect(log.action).toBe('system_security_check');
      expect(log.ip_address).toBe('103.48.196.12');

      const fetched = AdminService.getAuditLogs({ action: 'system_security_check' });
      expect(fetched.some((l) => l.id === log.id)).toBe(true);
    });
  });
});
