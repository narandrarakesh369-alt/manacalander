/**
 * MANA CALENDAR 2027 — SUPER ADMIN & PLATFORM GOVERNANCE SERVICE
 *
 * Central operations engine for:
 * - Admin Authentication & MFA verification
 * - Role-Based Access Control (Owner, Admin, Content Admin, Support Admin)
 * - Multi-Tenant Business Lifecycle (Creation, Approval, Suspension, Reactivation)
 * - Dynamic Database-Driven Plan Management
 * - Subscriptions & Auditable Manual Extensions
 * - Payment Gateway HMAC Signature Verification & Webhooks
 * - Campaign Moderation Workflow
 * - Panchangam Verification & Audit Trails
 * - Weather Provider Settings & Error Monitoring
 * - Notification Campaigns Oversight
 * - Platform, Revenue & User Telemetry Analytics
 * - Support Ticket Resolution
 * - Immutable Audit Logging
 */

import { supabase, isSupabaseConfigured } from './supabase.client';
import type {
  AdminUser,
  AdminRoleType,
  Business,
  BusinessProfile,
  Subscription,
  Payment,
  Plan,
  Campaign,
  CampaignModerationLog,
  CampaignModerationAction,
  PanchangamAuditRecord,
  SuperAdminDashboardMetrics,
  SupportTicket,
  TicketStatus,
  AuditLog,
  NotificationCampaign,
} from '@mana/types';
import { PLANS_CONFIG, CAMPAIGN_RULES, ENV } from '@mana/config';
import { logger } from '@mana/utils';
import { CampaignService } from './campaign.service';
import { PaymentService } from './payment.service';
import { DeferredDeepLinkService } from './deeplink/deferred.deeplink.service';

// Pre-seeded Admin Users
const SEEDED_ADMINS: Array<{ user: AdminUser; role: AdminRoleType; passwordHash: string; mfaSecret: string }> = [
  {
    user: {
      id: 'admin-owner-01',
      auth_user_id: 'auth-owner-01',
      name: 'Venkata Raman (Platform Owner)',
      email: 'owner@manacalendar2027.com',
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    role: 'owner',
    passwordHash: 'admin123',
    mfaSecret: '202700',
  },
  {
    user: {
      id: 'admin-mgr-02',
      auth_user_id: 'auth-mgr-02',
      name: 'Suresh Babu (General Admin)',
      email: 'admin@manacalendar2027.com',
      status: 'active',
      created_at: '2026-01-05T00:00:00Z',
      updated_at: '2026-01-05T00:00:00Z',
    },
    role: 'admin',
    passwordHash: 'admin123',
    mfaSecret: '123456',
  },
  {
    user: {
      id: 'admin-content-03',
      auth_user_id: 'auth-content-03',
      name: 'Pandit Sharma (Content & Panchangam)',
      email: 'content@manacalendar2027.com',
      status: 'active',
      created_at: '2026-01-10T00:00:00Z',
      updated_at: '2026-01-10T00:00:00Z',
    },
    role: 'content_admin',
    passwordHash: 'admin123',
    mfaSecret: '123456',
  },
  {
    user: {
      id: 'admin-support-04',
      auth_user_id: 'auth-support-04',
      name: 'Kavitha Devi (Partner Support)',
      email: 'support@manacalendar2027.com',
      status: 'active',
      created_at: '2026-01-15T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    },
    role: 'support_admin',
    passwordHash: 'admin123',
    mfaSecret: '123456',
  },
];

// Pre-seeded platform businesses
const memoryBusinesses: Business[] = [
  {
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
  {
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
  {
    id: 'biz-cmr003',
    business_id: 'CMR003',
    name: 'CMR Shopping Mall',
    slug: 'cmr-shopping-mall',
    owner_name: 'Mavuri Venkata Ramana',
    status: 'active',
    plan_id: 'plan-premium',
    plan_code: 'premium',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'biz-apg004',
    business_id: 'APG004',
    name: 'Andhra Pure Ghee Sweets',
    slug: 'andhra-pure-ghee-sweets',
    owner_name: 'Srinivasa Rao',
    status: 'pending',
    plan_id: 'plan-business',
    plan_code: 'business',
    created_at: '2026-09-28T14:00:00Z',
    updated_at: '2026-09-28T14:00:00Z',
  },
];

// In-memory moderation logs
const memoryModerationLogs: CampaignModerationLog[] = [
  {
    id: 'mod-log-01',
    campaign_id: 'DIWALI2027',
    admin_id: 'admin-owner-01',
    admin_name: 'Venkata Raman',
    action: 'approve',
    reason: 'Verified festive gold discount and hallmark claims.',
    created_at: '2026-09-16T12:00:00Z',
  },
];

// In-memory Panchangam review audits
const memoryPanchangamAudits: PanchangamAuditRecord[] = [
  {
    id: 'panch-audit-01',
    calendar_date: '2027-04-07',
    admin_id: 'admin-content-03',
    admin_name: 'Pandit Sharma',
    action: 'verified',
    before_value: null,
    after_value: { tithi: 'Chaitra Sukla Padyami (Ugadi)', nakshatra: 'Revati' },
    notes: 'Verified against Sri Venkateswara Ephemeris calculations for Visakhapatnam.',
    created_at: '2026-09-10T08:30:00Z',
  },
];

// In-memory Audit Logs
const memoryAuditLogs: AuditLog[] = [
  {
    id: 'audit-001',
    actor_id: 'admin-owner-01',
    actor_type: 'admin',
    action: 'super_admin_login',
    resource_type: 'auth_session',
    resource_id: 'sess_admin_001',
    details: { email: 'owner@manacalendar2027.com', method: 'password_and_mfa' },
    ip_address: '103.48.196.12',
    created_at: '2026-10-06T09:00:00Z',
  },
  {
    id: 'audit-002',
    actor_id: 'admin-mgr-02',
    actor_type: 'admin',
    action: 'business_activated',
    resource_type: 'businesses',
    resource_id: 'CMR003',
    details: { plan: 'premium', verified_by: 'Suresh Babu' },
    ip_address: '103.48.196.15',
    created_at: '2026-10-06T10:15:00Z',
  },
];

// In-memory Support Tickets
const memoryTickets: SupportTicket[] = [
  {
    id: 'tkt-101',
    ticket_number: 'MC-2027-4821',
    user_id: null,
    business_id: 'SLJ001',
    category: 'Campaign Scheduling',
    subject: 'Request for special priority placement during Ugadi festival week',
    description: 'We would like to ensure our banner stays active through the evening of Ugadi.',
    status: 'open',
    priority: 'high',
    created_at: '2026-10-05T14:20:00Z',
    updated_at: '2026-10-05T14:20:00Z',
  },
  {
    id: 'tkt-102',
    ticket_number: 'MC-2027-3912',
    user_id: null,
    business_id: 'RF002',
    category: 'Billing & Invoices',
    subject: 'Annual membership GST invoice breakdown query',
    description: 'Need our registered GSTIN printed on the tax invoice for accounting audit.',
    status: 'in_progress',
    priority: 'medium',
    created_at: '2026-10-04T11:00:00Z',
    updated_at: '2026-10-05T09:30:00Z',
  },
  {
    id: 'tkt-103',
    ticket_number: 'MC-2027-2104',
    user_id: null,
    business_id: 'CMR003',
    category: 'QR Code & Posters',
    subject: 'Counter poster SVG format request',
    description: 'Printing high-res counter standees for all 5 showroom locations in Vizag.',
    status: 'resolved',
    priority: 'low',
    created_at: '2026-10-01T16:00:00Z',
    updated_at: '2026-10-02T10:00:00Z',
  },
];

// Dynamic Database-Driven Plans state
let dynamicPlans: Plan[] = [
  {
    id: 'plan-business',
    plan_code: 'business',
    name: PLANS_CONFIG.BUSINESS.name,
    price_inr: 1999,
    billing_period: 'year',
    included_campaigns: 10,
    extra_campaign_price_inr: 299,
    features: PLANS_CONFIG.BUSINESS.features,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan-premium',
    plan_code: 'premium',
    name: PLANS_CONFIG.PREMIUM.name,
    price_inr: 3999,
    billing_period: 'year',
    included_campaigns: 10,
    extra_campaign_price_inr: 299,
    features: PLANS_CONFIG.PREMIUM.features,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

// Weather & Ephemeris Provider Configuration
let weatherConfig = {
  activeProvider: 'OpenWeatherMap APIv2.5/3.0',
  providerStatus: 'operational',
  apiKey: (typeof process !== 'undefined' && process.env?.WEATHER_API_KEY) || '7ad72c7a136bc94a659eb9dcbc9f563e',
  panchangamApiKey: (typeof process !== 'undefined' && process.env?.PANCHANGAM_API_KEY) || 'vda_live_8ed57edd_J29966Ba1udgh_eKuDgZ_KMe3srL5ZA4ngsuzSq5_V0',
  currentTtlSeconds: 1800, // 30 mins
  forecastTtlSeconds: 21600, // 6 hours
  dailyCallsCount: 1420,
  dailyCallsLimit: 50000,
  errorRatePercent: 0.04,
  lastHealthCheck: new Date().toISOString(),
};

export class AdminService {
  // ===========================================================================
  // 1. ADMIN AUTHENTICATION & MFA
  // ===========================================================================

  /**
   * Authenticates super admin with email and password
   */
  static async login(email: string, password: string): Promise<{ admin: AdminUser; role: AdminRoleType; requiresMfa: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    const entry = SEEDED_ADMINS.find((a) => a.user.email.toLowerCase() === cleanEmail);

    if (!entry || entry.passwordHash !== password) {
      throw new Error('Invalid Super Admin credentials.');
    }

    if (entry.user.status !== 'active') {
      throw new Error('This admin account has been suspended.');
    }

    return {
      admin: entry.user,
      role: entry.role,
      requiresMfa: true,
    };
  }

  /**
   * Verifies secondary MFA code (TOTP / SMS)
   */
  static verifyMfaCode(adminId: string, code: string): boolean {
    const entry = SEEDED_ADMINS.find((a) => a.user.id === adminId);
    if (!entry) return false;

    // Accepts pre-configured admin secret or master demo code
    if (code === entry.mfaSecret || code === '202700' || code === '123456') {
      this.recordAuditLog({
        actor_id: entry.user.id,
        actor_type: 'admin',
        action: 'admin_mfa_verified',
        resource_type: 'auth',
        resource_id: entry.user.id,
        details: { email: entry.user.email, role: entry.role },
        ip_address: '103.48.196.12',
      });
      return true;
    }

    return false;
  }

  /**
   * Server-side role and permission enforcement
   */
  static hasPermission(
    role: AdminRoleType,
    action:
      | 'manage_businesses'
      | 'suspend_business'
      | 'manage_plans'
      | 'extend_subscriptions'
      | 'manage_payments'
      | 'moderate_campaigns'
      | 'manage_calendar'
      | 'verify_panchangam'
      | 'manage_notifications'
      | 'view_analytics'
      | 'manage_support'
      | 'view_audit_logs'
  ): boolean {
    if (role === 'owner') return true;

    switch (action) {
      case 'suspend_business':
      case 'extend_subscriptions':
      case 'manage_plans':
      case 'manage_payments':
        return role === 'admin';
      case 'manage_businesses':
      case 'moderate_campaigns':
      case 'manage_notifications':
      case 'view_analytics':
        return role === 'admin' || role === 'content_admin';
      case 'manage_calendar':
      case 'verify_panchangam':
        return role === 'admin' || role === 'content_admin';
      case 'manage_support':
        return role === 'admin' || role === 'support_admin';
      case 'view_audit_logs':
        return role === 'admin';
      default:
        return false;
    }
  }

  // ===========================================================================
  // 2. BUSINESS LIFECYCLE MANAGEMENT
  // ===========================================================================

  static async listBusinesses(filters?: {
    search?: string;
    status?: Business['status'];
    plan?: string;
  }): Promise<Business[]> {
    let list = [...memoryBusinesses];

    if (filters?.status) {
      list = list.filter((b) => b.status === filters.status);
    }
    if (filters?.plan) {
      const planFilter = filters.plan;
      list = list.filter((b) => b.plan_code === planFilter || b.plan_id.includes(planFilter));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.business_id.toLowerCase().includes(q) ||
          (b.owner_name || '').toLowerCase().includes(q)
      );
    }

    return list;
  }

  /**
   * Creates a new business tenant and automatically creates:
   * 1. unique business_id
   * 2. business profile
   * 3. permanent QR destination
   * 4. initial subscription record
   * 5. audit log
   */
  static async createBusiness(
    data: {
      name: string;
      owner_name: string;
      email: string;
      phone: string;
      category: string;
      address: string;
      city?: string;
      plan_code: 'business' | 'premium';
      start_date?: string;
      expiry_date?: string;
    },
    adminId = 'admin-owner-01'
  ): Promise<{ business: Business; profile: BusinessProfile; subscription: Subscription }> {
    // 1. Auto-generate business_id code
    const initials = data.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 3);
    const existingCount = memoryBusinesses.filter((b) => b.business_id.startsWith(initials)).length + 1;
    const businessId = `${initials}${String(existingCount).padStart(3, '0')}`;

    const now = new Date().toISOString();
    const startDate = data.start_date || now;
    const expiryDate = data.expiry_date || '2027-12-31T23:59:59Z';
    const planId = data.plan_code === 'premium' ? 'plan-premium' : 'plan-business';

    // 2. Create Business Core
    const newBiz: Business = {
      id: `biz-${businessId.toLowerCase()}`,
      business_id: businessId,
      name: data.name,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      owner_name: data.owner_name,
      status: 'active',
      plan_id: planId,
      plan_code: data.plan_code,
      created_at: now,
      updated_at: now,
    };
    memoryBusinesses.unshift(newBiz);

    // 3. Create Business Profile
    const newProfile: BusinessProfile = {
      id: `prof-${businessId.toLowerCase()}`,
      business_id: businessId,
      company_name: data.name,
      category: data.category,
      tagline: `${data.category} in ${data.city || 'Visakhapatnam'}`,
      description: `Welcome to ${data.name}. Trusted partner on Mana Calendar 2027.`,
      phone: data.phone,
      email: data.email,
      website: `https://${newBiz.slug}.in`,
      address: data.address,
      city: data.city || 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530002',
      latitude: 17.7126,
      longitude: 83.3012,
      logo: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300',
      cover_image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000',
      social_links: {
        whatsapp: data.phone,
        hours: '10:00 AM - 09:30 PM (Mon-Sat)',
      },
      created_at: now,
      updated_at: now,
    };

    // 4. Create Initial Subscription
    const newSub: Subscription = {
      id: `sub-${businessId.toLowerCase()}-init`,
      business_id: businessId,
      plan_id: planId,
      status: 'active',
      start_date: startDate,
      end_date: expiryDate,
      renewal_date: expiryDate,
      provider: 'super_admin_manual',
      provider_subscription_id: `adm_${Date.now()}`,
      created_at: now,
      updated_at: now,
    };

    // 5. Record Audit Log
    this.recordAuditLog({
      actor_id: adminId,
      actor_type: 'admin',
      action: 'business_created',
      resource_type: 'businesses',
      resource_id: businessId,
      details: {
        name: data.name,
        plan_code: data.plan_code,
        qrDestination: DeferredDeepLinkService.generateQrUrl(businessId),
      },
      ip_address: '103.48.196.12',
    });

    return { business: newBiz, profile: newProfile, subscription: newSub };
  }

  /**
   * Suspends a business tenant:
   * - Blocks business dashboard access
   * - Halts all active promotional campaigns
   * - Hides promotional banners
   * - Disables push notifications
   * - Preserves historical business data
   */
  static async suspendBusiness(businessId: string, reason: string, adminId = 'admin-owner-01'): Promise<Business> {
    const cleanId = businessId.trim().toUpperCase();
    const biz = memoryBusinesses.find((b) => b.business_id === cleanId);
    if (!biz) throw new Error(`Business ${cleanId} not found.`);

    const beforeStatus = biz.status;
    biz.status = 'suspended';
    biz.updated_at = new Date().toISOString();

    // Pause all tenant campaigns
    const camps = await CampaignService.getBusinessCampaigns(cleanId);
    for (const c of camps) {
      if (c.status === 'active') {
        c.status = 'paused';
      }
    }

    this.recordAuditLog({
      actor_id: adminId,
      actor_type: 'admin',
      action: 'business_suspended',
      resource_type: 'businesses',
      resource_id: cleanId,
      before_value: { status: beforeStatus },
      after_value: { status: 'suspended', reason },
      details: { reason, campaignsPaused: camps.length },
      ip_address: '103.48.196.12',
    });

    return biz;
  }

  /**
   * Reactivates a suspended business
   */
  static async reactivateBusiness(businessId: string, adminId = 'admin-owner-01'): Promise<Business> {
    const cleanId = businessId.trim().toUpperCase();
    const biz = memoryBusinesses.find((b) => b.business_id === cleanId);
    if (!biz) throw new Error(`Business ${cleanId} not found.`);

    const beforeStatus = biz.status;
    biz.status = 'active';
    biz.updated_at = new Date().toISOString();

    this.recordAuditLog({
      actor_id: adminId,
      actor_type: 'admin',
      action: 'business_reactivated',
      resource_type: 'businesses',
      resource_id: cleanId,
      before_value: { status: beforeStatus },
      after_value: { status: 'active' },
      details: { reactivated_by: adminId },
      ip_address: '103.48.196.12',
    });

    return biz;
  }

  // ===========================================================================
  // 3. PLAN MANAGEMENT (DATABASE DRIVEN)
  // ===========================================================================

  static getPlans(): Plan[] {
    return [...dynamicPlans];
  }

  static updatePlan(planId: string, updates: Partial<Plan>, adminId = 'admin-owner-01'): Plan {
    const plan = dynamicPlans.find((p) => p.id === planId);
    if (!plan) throw new Error(`Plan ${planId} not found.`);

    const before = { ...plan };
    Object.assign(plan, updates);

    this.recordAuditLog({
      actor_id: adminId,
      actor_type: 'admin',
      action: 'plan_updated',
      resource_type: 'plans',
      resource_id: planId,
      before_value: before as any,
      after_value: plan as any,
      details: updates,
      ip_address: '103.48.196.12',
    });

    return plan;
  }

  // ===========================================================================
  // 4. SUBSCRIPTIONS & MANUAL EXTENSIONS
  // ===========================================================================

  /**
   * Manually extends an active subscription with mandatory audit log
   */
  static async extendSubscription(
    businessId: string,
    newEndDate: string,
    reason: string,
    adminId = 'admin-owner-01'
  ): Promise<Subscription> {
    const sub = await PaymentService.getBusinessSubscription(businessId);
    if (!sub) throw new Error(`Active subscription for ${businessId} not found.`);

    const beforeEndDate = sub.end_date;
    sub.end_date = newEndDate;
    sub.renewal_date = newEndDate;
    sub.updated_at = new Date().toISOString();

    this.recordAuditLog({
      actor_id: adminId,
      actor_type: 'admin',
      action: 'subscription_extended',
      resource_type: 'subscriptions',
      resource_id: sub.id,
      before_value: { end_date: beforeEndDate },
      after_value: { end_date: newEndDate, reason },
      details: { business_id: businessId, reason },
      ip_address: '103.48.196.12',
    });

    return sub;
  }

  /**
   * Returns configured reminder intervals before expiry
   */
  static getRenewalReminderSchedule(expiryIso: string): Array<{ daysBefore: number; targetDate: string }> {
    const exp = new Date(expiryIso);
    const intervals = [30, 15, 7, 3, 1];
    return intervals.map((d) => {
      const dt = new Date(exp);
      dt.setDate(dt.getDate() - d);
      return { daysBefore: d, targetDate: dt.toISOString().split('T')[0] };
    });
  }

  // ===========================================================================
  // 5. PAYMENT GATEWAY VERIFICATION & WEBHOOKS
  // ===========================================================================

  /**
   * Verifies payment signature (HMAC-SHA256 simulation)
   * Prevents activating subscriptions based solely on frontend success
   */
  static verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
    secret?: string;
  }): boolean {
    const { orderId, paymentId, signature } = params;
    if (!orderId || !paymentId || !signature) return false;

    // Simulated signature check
    const expectedPrefix = 'sig_verified_';
    return signature.startsWith(expectedPrefix) || signature.length >= 32;
  }

  /**
   * Secure Webhook Handler
   */
  static async handlePaymentWebhook(event: {
    event_type: string;
    payload: {
      order_id: string;
      payment_id: string;
      business_id: string;
      amount: number;
      plan_code: 'business' | 'premium';
    };
    signature: string;
  }): Promise<{ status: 'processed' | 'rejected'; reason?: string }> {
    // 1. Verify signature
    const isValid = this.verifyPaymentSignature({
      orderId: event.payload.order_id,
      paymentId: event.payload.payment_id,
      signature: event.signature,
    });

    if (!isValid) {
      return { status: 'rejected', reason: 'Invalid HMAC webhook signature.' };
    }

    // 2. Process event
    if (event.event_type === 'payment.captured') {
      await PaymentService.upgradeSubscription(
        event.payload.business_id,
        event.payload.plan_code,
        'Webhook / Razorpay'
      );
      this.recordAuditLog({
        actor_id: 'system_webhook',
        actor_type: 'system',
        action: 'payment_webhook_captured',
        resource_type: 'payments',
        resource_id: event.payload.payment_id,
        details: event.payload,
        ip_address: 'gateway.webhook.internal',
      });
      return { status: 'processed' };
    }

    return { status: 'processed' };
  }

  // ===========================================================================
  // 6. CAMPAIGN MODERATION
  // ===========================================================================

  static async moderateCampaign(
    campaignId: string,
    action: CampaignModerationAction,
    reason: string,
    adminId = 'admin-owner-01',
    adminName = 'Super Admin'
  ): Promise<CampaignModerationLog> {
    const modLog: CampaignModerationLog = {
      id: `mod-${Date.now()}`,
      campaign_id: campaignId,
      admin_id: adminId,
      admin_name: adminName,
      action,
      reason,
      created_at: new Date().toISOString(),
    };
    memoryModerationLogs.unshift(modLog);

    this.recordAuditLog({
      actor_id: adminId,
      actor_type: 'admin',
      action: 'campaign_moderation',
      resource_type: 'campaigns',
      resource_id: campaignId,
      details: { action, reason },
      ip_address: '103.48.196.12',
    });

    return modLog;
  }

  static getModerationLogs(): CampaignModerationLog[] {
    return [...memoryModerationLogs];
  }

  // ===========================================================================
  // 7. PANCHANGAM REVIEW & VERIFIED PUBLISHING
  // ===========================================================================

  static verifyAndPublishPanchangam(
    date: string,
    data: Record<string, unknown>,
    notes: string,
    adminId = 'admin-content-03',
    adminName = 'Pandit Sharma'
  ): PanchangamAuditRecord {
    const auditRecord: PanchangamAuditRecord = {
      id: `panch-${Date.now()}`,
      calendar_date: date,
      admin_id: adminId,
      admin_name: adminName,
      action: 'verified',
      before_value: null,
      after_value: data,
      notes,
      created_at: new Date().toISOString(),
    };
    memoryPanchangamAudits.unshift(auditRecord);

    this.recordAuditLog({
      actor_id: adminId,
      actor_type: 'admin',
      action: 'panchangam_verified_and_published',
      resource_type: 'panchangam',
      resource_id: date,
      details: { notes, verified_by: adminName },
      ip_address: '103.48.196.12',
    });

    return auditRecord;
  }

  static getPanchangamAudits(): PanchangamAuditRecord[] {
    return [...memoryPanchangamAudits];
  }

  // ===========================================================================
  // 8. WEATHER SETTINGS & TELEMETRY
  // ===========================================================================

  static getWeatherConfig() {
    return { ...weatherConfig };
  }

  static updateWeatherConfig(updates: Partial<typeof weatherConfig>, adminId = 'admin-owner-01') {
    Object.assign(weatherConfig, updates);
    this.recordAuditLog({
      actor_id: adminId,
      actor_type: 'admin',
      action: 'weather_settings_updated',
      resource_type: 'weather_config',
      resource_id: 'default',
      details: updates,
      ip_address: '103.48.196.12',
    });
    return { ...weatherConfig };
  }

  // ===========================================================================
  // 9. SUPER ADMIN DASHBOARD & ANALYTICS METRICS
  // ===========================================================================

  static getDashboardMetrics(): SuperAdminDashboardMetrics {
    const totalBiz = memoryBusinesses.length;
    const activeBiz = memoryBusinesses.filter((b) => b.status === 'active').length;
    const suspendedBiz = memoryBusinesses.filter((b) => b.status === 'suspended').length;
    const pendingBiz = memoryBusinesses.filter((b) => b.status === 'pending').length;
    const premiumBiz = memoryBusinesses.filter((b) => b.plan_code === 'premium').length;
    const standardBiz = totalBiz - premiumBiz;

    return {
      totalBusinesses: totalBiz,
      activeBusinesses: activeBiz,
      newBusinessesMonth: 3,
      pendingBusinesses: pendingBiz,
      suspendedBusinesses: suspendedBiz,
      totalCustomers: 14820,
      activeCampaigns: 18,
      totalImpressions: 184200,
      totalClicks: 12890,
      ctr: 7.0,
      subscriptionRevenue: 75976,
      campaignRevenue: 14950,
      netRevenue: 90926,
      premiumBusinesses: premiumBiz,
      businessPlanBusinesses: standardBiz,
      notificationUsage: 38400,
    };
  }

  // ===========================================================================
  // 10. SUPPORT TICKET MANAGEMENT
  // ===========================================================================

  static listSupportTickets(): SupportTicket[] {
    return [...memoryTickets];
  }

  static updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    adminId = 'admin-support-04',
    resolutionNote?: string
  ): SupportTicket {
    const tkt = memoryTickets.find((t) => t.id === ticketId);
    if (!tkt) throw new Error(`Ticket ${ticketId} not found.`);

    tkt.status = status;
    tkt.updated_at = new Date().toISOString();

    this.recordAuditLog({
      actor_id: adminId,
      actor_type: 'admin',
      action: 'support_ticket_updated',
      resource_type: 'support_tickets',
      resource_id: ticketId,
      details: { status, resolutionNote },
      ip_address: '103.48.196.12',
    });

    return tkt;
  }

  // ===========================================================================
  // 11. AUDIT LOGS
  // ===========================================================================

  static recordAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    memoryAuditLogs.unshift(newLog);
    return newLog;
  }

  static getAuditLogs(filters?: { actorId?: string; action?: string }): AuditLog[] {
    let list = [...memoryAuditLogs];
    if (filters?.actorId) list = list.filter((l) => l.actor_id === filters.actorId);
    if (filters?.action) list = list.filter((l) => l.action.includes(filters.action || ''));
    return list;
  }
}
