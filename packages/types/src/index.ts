/**
 * MANA CALENDAR 2027 — CORE TYPE DEFINITIONS
 * Strict TypeScript models for Multi-Tenant Architecture & Calendar Engine
 */

// =============================================================================
// 1. AUTH & ROLES
// =============================================================================

export type UserRole = 'customer' | 'business_user' | 'super_admin';

export type BusinessUserRole = 'owner' | 'manager' | 'staff';

export type AdminRoleType = 'owner' | 'admin' | 'content_admin' | 'support_admin' | 'super_admin';

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  businessId?: string; // Associated tenant identifier (e.g. SLJ001) for business users
  adminRoles?: string[];
}

export interface UserSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// =============================================================================
// 2. CONFIGURATION & PREFERENCES
// =============================================================================

export type LanguagePreference = 'te' | 'en' | 'te_en';

export interface LocationConfig {
  code?: string;
  city: string;
  name_te?: string;
  state: string;
  state_te?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// =============================================================================
// 3. CORE DATABASE ENTITIES
// =============================================================================

export type BusinessStatus = 'active' | 'suspended' | 'pending' | 'inactive';

export interface Business {
  id: string; // Internal UUID
  business_id: string; // Tenant code, e.g. 'SLJ001', 'RF002', 'CMR003'
  name: string;
  slug: string;
  status: BusinessStatus;
  plan_id: string;
  plan_code?: PlanCode;
  owner_name?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessUser {
  id: string;
  auth_user_id: string;
  business_id: string;
  role: BusinessUserRole;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: string;
  business_id: string;
  company_name?: string;
  tagline?: string | null;
  category?: string;
  logo: string | null;
  logo_url?: string | null;
  cover_image: string | null;
  banner_url?: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  social_links: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  auth_user_id: string | null;
  language_preference: LanguagePreference;
  location_preference: LocationConfig | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerBusiness {
  id: string;
  customer_id: string;
  business_id: string;
  relationship_type: 'followed' | 'qr_scanned' | 'interacted';
  promotional_notifications_enabled?: boolean;
  is_active?: boolean;
  last_interacted_at?: string;
  created_at: string;
}

export type CustomerAppMode = 'general' | 'business';

export interface FollowedBusiness extends CustomerBusiness {
  business?: Business;
  profile?: BusinessProfile;
}

// =============================================================================
// 4. PLANS & BILLING
// =============================================================================

export type PlanCode = 'business' | 'premium';

export interface PlanFeatures {
  calendar_ecosystem_access: boolean;
  business_profile: boolean;
  logo: boolean;
  qr_code: boolean;
  promotional_banners: boolean;
  campaigns: boolean;
  analytics: boolean;
  scheduling: boolean;
  promotional_push_notifications: boolean;
  enhanced_branding: boolean;
}

export interface Plan {
  id: string;
  plan_code: PlanCode;
  name: string;
  price_inr: number;
  billing_period: 'year';
  included_campaigns: number;
  extra_campaign_price_inr: number;
  features: PlanFeatures;
  is_active: boolean;
  created_at: string;
}

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'suspended';

export interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  renewal_date: string | null;
  provider: string | null;
  provider_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'success'
  | 'failed'
  | 'refunded';

export interface Payment {
  id: string;
  business_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  payment_provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  status: PaymentStatus;
  created_at: string;
}

export interface PaymentWebhook {
  id: string;
  provider: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processed' | 'failed';
  processed_at: string | null;
  created_at: string;
}

// =============================================================================
// 5. CAMPAIGNS & MEDIA
// =============================================================================

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  campaign_type: 'banner' | 'notification' | 'festival_offer';
  image_url?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  priority?: number;
  status: CampaignStatus;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignCreditLedgerEntry {
  id: string;
  business_id: string;
  year: number;
  action: 'campaign_published' | 'campaign_scheduled' | 'extra_purchased' | 'admin_grant';
  campaign_id: string | null;
  credits_consumed: number;
  balance_after: number;
  notes?: string | null;
  created_at: string;
}

export interface CampaignUsage {
  id: string;
  business_id: string;
  subscription_id: string;
  year: number;
  included_campaigns_total: number; // Defaults to 10
  included_campaigns_used: number;
  extra_campaigns_purchased: number;
  extra_campaigns_used: number;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  business_id: string;
  campaign_id: string | null;
  title: string;
  image_url: string;
  target_url: string | null;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
}

export type MediaType = 'logo' | 'banner' | 'campaign' | 'profile';

export interface Media {
  id: string;
  business_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  media_type: MediaType;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// 6. CALENDAR, FESTIVALS, PANCHANGAM & WEATHER
// =============================================================================

export type FestivalType = 'national' | 'hindu' | 'regional' | 'cultural' | 'observance';
export type HolidayType = 'gazetted' | 'restricted' | 'regional_ap' | 'cultural' | 'none';
export type FestivalTag = 'sankranti' | 'ekadashi' | 'purnima' | 'amavasya' | 'festival' | 'holiday' | 'special';

export interface Festival {
  id: string;
  calendar_date: string; // 'YYYY-MM-DD'
  name_en: string;
  name_te: string;
  festival_type: FestivalType;
  is_holiday?: boolean;
  holiday_type?: HolidayType;
  importance?: 'major' | 'medium' | 'normal';
  tag?: FestivalTag;
  description_en: string | null;
  description_te: string | null;
  created_at?: string;
}

export interface CalendarDate {
  id: string;
  calendar_date: string; // 'YYYY-MM-DD'
  year: number;
  month: number;
  day: number;
  day_of_week: number;
  is_weekend: boolean;
  is_today?: boolean;
  tithi_short_te?: string;
  tithi_short_en?: string;
  festivals?: Festival[];
  has_holiday?: boolean;
  has_festival?: boolean;
  has_event?: boolean;
  is_important?: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type PakshaType = 'shukla' | 'krishna';

export interface TithiDetails {
  number: number; // 1 - 30
  name_en: string;
  name_te: string;
  paksha: PakshaType;
  paksha_te: string;
  end_time?: string;
}

export interface NakshatraDetails {
  number: number; // 1 - 27
  name_en: string;
  name_te: string;
  pada?: number;
  end_time?: string;
}

export interface YogaDetails {
  number: number; // 1 - 27
  name_en: string;
  name_te: string;
  end_time?: string;
}

export interface KaranaDetails {
  number: number; // 1 - 60
  name_en: string;
  name_te: string;
  end_time?: string;
}

export interface Panchangam {
  id: string;
  calendar_date: string; // 'YYYY-MM-DD'
  city: string;

  // Telugu Samvatsara & Kala details
  samvatsaram_en?: string;
  samvatsaram_te?: string;
  ayanam_en?: string;
  ayanam_te?: string;
  rutuvu_en?: string;
  rutuvu_te?: string;
  masam_en?: string;
  masam_te?: string;
  paksha_en?: string;
  paksha_te?: string;

  // Core 5 Angas
  tithi: string;
  tithi_details?: TithiDetails;
  nakshatram: string;
  nakshatra_details?: NakshatraDetails;
  yogam: string;
  yoga_details?: YogaDetails;
  karanam: string;
  karana_details?: KaranaDetails;

  // Celestial Timings
  sunrise: string;
  sunset: string;
  moonrise?: string;
  moonset?: string;

  // Auspicious (Shubh) Timings
  abhijit_muhurtham?: string;
  amrita_kalam?: string;
  brahma_muhurtham?: string;

  // Inauspicious (Ashubh) Timings
  rahu_kalam: string;
  yama_gandam: string;
  gulika_kalam?: string;
  durmuhurtham?: string;
  varjyam?: string;

  created_at: string;
}

export interface HourlyForecast {
  time: string; // "14:00"
  temp_c: number;
  condition: string;
  condition_te?: string;
  rain_probability: number;
  icon?: string;
}

export interface DailyForecast {
  date: string; // 'YYYY-MM-DD'
  day_of_week: number;
  temp_max_c: number;
  temp_min_c: number;
  condition: string;
  condition_te?: string;
  rain_probability: number;
  humidity: number;
  uv_index: number;
  wind_kph: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherData {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  date: string;
  temp_c: number;
  feels_like_c: number;
  temp_min_c: number;
  temp_max_c: number;
  condition: string;
  condition_te: string;
  humidity: number;
  rain_probability: number;
  wind_kph: number;
  uv_index: number;
  sunrise: string;
  sunset: string;
  is_forecast: boolean;
  hourly_forecast: HourlyForecast[];
  daily_forecast: DailyForecast[];
  fetched_at: string;
  expires_at: string;
}

export interface WeatherCache {
  id: string;
  location_key: string;
  city: string;
  date: string;
  temp_c: number;
  feels_like_c?: number;
  temp_min_c?: number;
  temp_max_c?: number;
  condition: string;
  condition_te?: string;
  humidity: number;
  rain_probability?: number;
  wind_kph?: number;
  uv_index?: number;
  sunrise?: string;
  sunset?: string;
  is_forecast?: boolean;
  forecast_json: Record<string, unknown> | null;
  hourly_forecast?: HourlyForecast[];
  daily_forecast?: DailyForecast[];
  fetched_at: string;
  expires_at: string;
}

// =============================================================================
// 7. USER EVENTS & REMINDERS (Personal Events Foundation)
// =============================================================================

export type EventCategory = 'birthday' | 'anniversary' | 'appointment' | 'custom' | 'reminder';

export interface UserEvent {
  id: string;
  customer_id: string;
  title: string;
  event_date: string; // 'YYYY-MM-DD'
  start_time: string | null;
  end_time: string | null;
  category?: EventCategory;
  description: string | null;
  reminder_enabled?: boolean;
  remind_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  customer_id: string;
  user_event_id: string | null;
  remind_at: string;
  is_sent: boolean;
  created_at: string;
}

// =============================================================================
// 8. NOTIFICATIONS & SUPPORT
// =============================================================================

export type NotificationType = 'festival' | 'calendar' | 'reminder' | 'promotional' | 'system' | 'general' | 'event';

export interface NotificationDevice {
  id: string;
  user_id?: string | null;
  auth_user_id?: string | null;
  customer_id?: string | null;
  device_token: string;
  fcm_token?: string;
  platform: 'android' | 'web' | 'ios';
  enabled: boolean;
  is_active?: boolean;
  last_seen_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface NotificationPreference {
  id: string;
  auth_user_id?: string | null;
  customer_id?: string | null;
  enable_festivals: boolean;
  enable_panchangam?: boolean;
  enable_calendar?: boolean;
  enable_reminders: boolean;
  enable_promotions: boolean;
  enable_system?: boolean;
  updated_at: string;
}

export interface NotificationDeepLink {
  route: string;
  business_id?: string;
  campaign_id?: string;
  calendar_date?: string;
  url?: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  type: NotificationType;
  business_id?: string | null;
  business_name?: string | null;
  campaign_id?: string | null;
  image_url?: string | null;
  data?: NotificationDeepLink | Record<string, unknown> | null;
  read_at: string | null;
  is_read?: boolean;
  created_at: string;
}

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  device_id: string;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  delivered_at: string | null;
  opened_at: string | null;
  created_at: string;
}

export interface NotificationCampaign {
  id: string;
  business_id: string;
  campaign_id?: string | null;
  title: string;
  body: string;
  image_url?: string | null;
  target_audience: {
    all?: boolean;
    city?: string;
    state?: string;
    customer_ids?: string[];
  } | Record<string, unknown> | null;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled' | 'failed' | 'pending';
  scheduled_at?: string | null;
  sent_at: string | null;
  stats?: {
    sent: number;
    delivered?: number;
    opened: number;
    clicked: number;
  } | null;
  created_at: string;
  updated_at?: string;
}

export interface NotificationLimits {
  max_promotional_per_business_per_month: number;
  cooldown_hours_between_promotions: number;
  max_recipients_per_batch: number;
  enabled: boolean;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string | null;
  business_id: string | null;
  category: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// 9. SUPER ADMIN & AUDIT
// =============================================================================

export interface AdminUser {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface AdminRole {
  id: string;
  name: AdminRoleType;
  description: string;
  created_at: string;
}

export interface AdminPermission {
  id: string;
  permission_key: string;
  description: string;
  created_at: string;
}

export interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
  description: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_type: 'customer' | 'business' | 'admin' | 'system';
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  before_value?: Record<string, unknown> | null;
  after_value?: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export type CampaignModerationAction = 'pause' | 'resume' | 'flag' | 'remove' | 'approve';

export interface CampaignModerationLog {
  id: string;
  campaign_id: string;
  admin_id: string;
  admin_name: string;
  action: CampaignModerationAction;
  reason: string;
  created_at: string;
}

export interface PanchangamAuditRecord {
  id: string;
  calendar_date: string;
  admin_id: string;
  admin_name: string;
  action: 'verified' | 'correction' | 'published';
  before_value?: Record<string, unknown> | null;
  after_value: Record<string, unknown>;
  notes: string;
  created_at: string;
}

export interface SuperAdminDashboardMetrics {
  totalBusinesses: number;
  activeBusinesses: number;
  newBusinessesMonth: number;
  pendingBusinesses: number;
  suspendedBusinesses: number;
  totalCustomers: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  subscriptionRevenue: number;
  campaignRevenue: number;
  netRevenue: number;
  premiumBusinesses: number;
  businessPlanBusinesses: number;
  notificationUsage: number;
}

// =============================================================================
// 10. ANALYTICS & SEARCH MODELS
// =============================================================================

export interface TenantAnalyticsSummary {
  businessId: string;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  qrScans: number;
  activeCampaigns: number;
  profileViews?: number;
  followers?: number;
  notificationOpens?: number;
}

export interface CampaignPerformanceMetrics {
  campaignId: string;
  campaignTitle: string;
  status: string;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface PlatformAnalyticsSummary {
  totalTenants: number;
  activeSubscriptions: number;
  totalCustomers: number;
  totalCampaignsRan: number;
}

export interface CalendarSearchResult {
  calendar_date: string;
  day: number;
  month: number;
  year: number;
  day_of_week: number;
  title_en: string;
  title_te: string;
  type: 'festival' | 'holiday' | 'important_day' | 'event' | 'date';
  subtitle_en?: string;
  subtitle_te?: string;
  tag?: string;
}

// =============================================================================
// 11. PHASE 4: PROMOTIONS, QR & DEFERRED DEEP LINKING
// =============================================================================

export type BusinessAnalyticsEventType =
  | 'qr_scan'
  | 'business_profile_view'
  | 'business_follow'
  | 'business_unfollow'
  | 'banner_impression'
  | 'banner_click'
  | 'campaign_view'
  | 'campaign_click'
  | 'notification_open';

export interface BusinessAnalyticsEvent {
  id?: string;
  business_id: string;
  campaign_id?: string | null;
  customer_id?: string | null;
  event_type: BusinessAnalyticsEventType;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface DeferredDeepLinkAttribution {
  token?: string;
  business_id: string;
  campaign_id?: string | null;
  source: 'qr' | 'web' | 'referral';
  referrer?: string;
  timestamp: number;
}

export type BannerSlotScreen =
  | 'home'
  | 'calendar'
  | 'date_details'
  | 'panchangam'
  | 'weather'
  | 'festivals'
  | 'events'
  | 'business_page';

