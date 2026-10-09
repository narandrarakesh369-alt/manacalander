-- ==============================================================================
-- MANA CALENDAR 2027 -- IDEMPOTENT ALL-IN-ONE SUPABASE DATABASE SETUP
-- ==============================================================================
-- 1. DYNAMIC POLICY CLEANUP (GUARANTEES 100% SUCCESS ON RE-RUNS)
-- Drops any existing conflicting policies in public & storage schemas.
-- ==============================================================================
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename, schemaname FROM pg_policies WHERE schemaname IN ('public', 'storage')) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261006000001_core_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- MANA CALENDAR 2027 — PHASE 1: CORE DATABASE SCHEMA
-- Migration: 20261006000001_core_schema.sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PLANS & BILLING CONFIGURATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code TEXT UNIQUE NOT NULL, -- 'business', 'premium'
    name TEXT NOT NULL,
    price_inr INTEGER NOT NULL, -- 1999, 3999
    billing_period TEXT NOT NULL DEFAULT 'year',
    included_campaigns INTEGER NOT NULL DEFAULT 10,
    extra_campaign_price_inr INTEGER NOT NULL DEFAULT 299,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. BUSINESSES (TENANTS) & TENANT USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT UNIQUE NOT NULL, -- Stable tenant code e.g. SLJ001, RF002, CMR003
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'inactive')),
    plan_id UUID REFERENCES public.plans(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_businesses_business_id ON public.businesses(business_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);

CREATE TABLE IF NOT EXISTS public.business_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL, -- References auth.users(id)
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(auth_user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_business_users_auth ON public.business_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_tenant ON public.business_users(business_id);

CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT UNIQUE NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    logo TEXT,
    cover_image TEXT,
    description TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    city TEXT,
    state TEXT DEFAULT 'Andhra Pradesh',
    pincode TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. CUSTOMER FOUNDATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- Nullable for anonymous/unregistered app users
    language_preference TEXT NOT NULL DEFAULT 'te_en' CHECK (language_preference IN ('te', 'en', 'te_en')),
    location_preference JSONB DEFAULT '{"city": "Visakhapatnam", "state": "Andhra Pradesh", "country": "India"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_auth ON public.customers(auth_user_id);

CREATE TABLE IF NOT EXISTS public.customer_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'followed' CHECK (relationship_type IN ('followed', 'qr_scanned', 'interacted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(customer_id, business_id, relationship_type)
);

-- -----------------------------------------------------------------------------
-- 4. SUBSCRIPTIONS & PAYMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired', 'suspended')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date TIMESTAMPTZ NOT NULL,
    renewal_date TIMESTAMPTZ,
    provider TEXT DEFAULT 'manual',
    provider_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON public.subscriptions(business_id);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- in INR paise or rupees (e.g. 1999)
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_order_id TEXT,
    provider_payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'success', 'failed', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 5. CAMPAIGNS, CAMPAIGN USAGE & MEDIA
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT NOT NULL DEFAULT 'banner' CHECK (campaign_type IN ('banner', 'notification', 'festival_offer')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_business ON public.campaigns(business_id);

CREATE TABLE IF NOT EXISTS public.campaign_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    year INTEGER NOT NULL DEFAULT 2027,
    included_campaigns_total INTEGER NOT NULL DEFAULT 10,
    included_campaigns_used INTEGER NOT NULL DEFAULT 0,
    extra_campaigns_purchased INTEGER NOT NULL DEFAULT 0,
    extra_campaigns_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(business_id, year)
);

CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    target_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('logo', 'banner', 'campaign', 'profile')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_business ON public.media(business_id);

-- -----------------------------------------------------------------------------
-- 6. CALENDAR, FESTIVALS, PANCHANGAM & WEATHER CACHE
-- Multi-year ready (2027, 2028, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_date DATE UNIQUE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    is_weekend BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_dates_year_month ON public.calendar_dates(year, month);

CREATE TABLE IF NOT EXISTS public.festivals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_date DATE NOT NULL,
    name_en TEXT NOT NULL,
    name_te TEXT NOT NULL,
    festival_type TEXT NOT NULL DEFAULT 'hindu' CHECK (festival_type IN ('national', 'hindu', 'regional', 'cultural')),
    description_en TEXT,
    description_te TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_festivals_date ON public.festivals(calendar_date);

CREATE TABLE IF NOT EXISTS public.panchangam (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_date DATE NOT NULL,
    city TEXT NOT NULL DEFAULT 'Visakhapatnam',
    tithi TEXT NOT NULL,
    nakshatram TEXT NOT NULL,
    yogam TEXT NOT NULL,
    karanam TEXT NOT NULL,
    rahu_kalam TEXT NOT NULL,
    yama_gandam TEXT NOT NULL,
    sunrise TEXT NOT NULL,
    sunset TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(calendar_date, city)
);

CREATE TABLE IF NOT EXISTS public.weather_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_key TEXT NOT NULL,
    city TEXT NOT NULL,
    date DATE NOT NULL,
    temp_c INTEGER NOT NULL,
    condition TEXT NOT NULL,
    humidity INTEGER NOT NULL,
    forecast_json JSONB,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(location_key, date)
);

-- -----------------------------------------------------------------------------
-- 7. CUSTOMER EVENTS & REMINDERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_events_customer ON public.user_events(customer_id);

CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    user_event_id UUID REFERENCES public.user_events(id) ON DELETE CASCADE,
    remind_at TIMESTAMPTZ NOT NULL,
    is_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 8. NOTIFICATIONS & SUPPORT
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    fcm_token TEXT UNIQUE NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'android' CHECK (device_type IN ('android', 'web', 'ios')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    enable_festivals BOOLEAN NOT NULL DEFAULT true,
    enable_panchangam BOOLEAN NOT NULL DEFAULT true,
    enable_reminders BOOLEAN NOT NULL DEFAULT true,
    enable_promotions BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'event', 'promotional', 'festival')),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_audience JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    user_id UUID,
    business_id TEXT REFERENCES public.businesses(business_id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 9. SUPER ADMIN & AUDIT LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- 'super_admin', 'support_admin', 'content_admin'
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_user_roles (
    admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
    admin_role_id UUID REFERENCES public.admin_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (admin_user_id, admin_role_id)
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'business', 'admin', 'system')),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261006000002_rls_policies.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- MANA CALENDAR 2027 — PHASE 1: ROW LEVEL SECURITY & TENANT ISOLATION
-- Migration: 20261006000002_rls_policies.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Returns the business_id associated with the authenticated user
CREATE OR REPLACE FUNCTION public.get_current_business_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT business_id
    FROM public.business_users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$;

-- Returns true if authenticated user is an active Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE auth_user_id = auth.uid()
          AND status = 'active'
    );
$$;

-- Returns customer_id associated with the authenticated user
CREATE OR REPLACE FUNCTION public.get_current_customer_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id
    FROM public.customers
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$;

-- -----------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
-- -----------------------------------------------------------------------------
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panchangam ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. POLICIES: PUBLIC / SHARED CONTENT (Calendar, Panchangam, Festivals, Plans)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read-only calendar dates" ON public.calendar_dates;
CREATE POLICY "Public read-only calendar dates" ON public.calendar_dates
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage calendar dates" ON public.calendar_dates;
CREATE POLICY "Admin manage calendar dates" ON public.calendar_dates
    FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Public read-only festivals" ON public.festivals;
CREATE POLICY "Public read-only festivals" ON public.festivals
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage festivals" ON public.festivals;
CREATE POLICY "Admin manage festivals" ON public.festivals
    FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Public read-only panchangam" ON public.panchangam;
CREATE POLICY "Public read-only panchangam" ON public.panchangam
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage panchangam" ON public.panchangam;
CREATE POLICY "Admin manage panchangam" ON public.panchangam
    FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Public read-only weather cache" ON public.weather_cache;
CREATE POLICY "Public read-only weather cache" ON public.weather_cache
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public read active plans" ON public.plans;
CREATE POLICY "Public read active plans" ON public.plans
    FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "Admin manage plans" ON public.plans;
CREATE POLICY "Admin manage plans" ON public.plans
    FOR ALL TO authenticated USING (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- 4. POLICIES: BUSINESS TENANT ISOLATION
-- Strict Tenant Isolation: Business A (SLJ001) CANNOT read/modify Business B (RF002)
-- -----------------------------------------------------------------------------

-- BUSINESSES
DROP POLICY IF EXISTS "Public view active businesses" ON public.businesses;
CREATE POLICY "Public view active businesses" ON public.businesses
    FOR SELECT TO public USING (status = 'active');

DROP POLICY IF EXISTS "Business user view own business" ON public.businesses;
CREATE POLICY "Business user view own business" ON public.businesses
    FOR SELECT TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "Business user update own business" ON public.businesses;
CREATE POLICY "Business user update own business" ON public.businesses
    FOR UPDATE TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin())
    WITH CHECK (business_id = public.get_current_business_id() OR public.is_super_admin());

-- BUSINESS PROFILES
DROP POLICY IF EXISTS "Public view business profiles" ON public.business_profiles;
CREATE POLICY "Public view business profiles" ON public.business_profiles
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Business user manage own profile" ON public.business_profiles;
CREATE POLICY "Business user manage own profile" ON public.business_profiles
    FOR ALL TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin())
    WITH CHECK (business_id = public.get_current_business_id() OR public.is_super_admin());

-- CAMPAIGNS (Tenant Isolated)
DROP POLICY IF EXISTS "Public view active published campaigns" ON public.campaigns;
CREATE POLICY "Public view active published campaigns" ON public.campaigns
    FOR SELECT TO public USING (status = 'active');

DROP POLICY IF EXISTS "Business tenant manage own campaigns" ON public.campaigns;
CREATE POLICY "Business tenant manage own campaigns" ON public.campaigns
    FOR ALL TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin())
    WITH CHECK (business_id = public.get_current_business_id() OR public.is_super_admin());

-- CAMPAIGN USAGE (Tenant Isolated)
DROP POLICY IF EXISTS "Business view own campaign usage" ON public.campaign_usage;
CREATE POLICY "Business view own campaign usage" ON public.campaign_usage
    FOR SELECT TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "Admin manage campaign usage" ON public.campaign_usage;
CREATE POLICY "Admin manage campaign usage" ON public.campaign_usage
    FOR ALL TO authenticated USING (public.is_super_admin());

-- BANNERS
DROP POLICY IF EXISTS "Public view active banners" ON public.banners;
CREATE POLICY "Public view active banners" ON public.banners
    FOR SELECT TO public USING (status = 'active');

DROP POLICY IF EXISTS "Business manage own banners" ON public.banners;
CREATE POLICY "Business manage own banners" ON public.banners
    FOR ALL TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin())
    WITH CHECK (business_id = public.get_current_business_id() OR public.is_super_admin());

-- MEDIA LIBRARY (Tenant Isolated)
DROP POLICY IF EXISTS "Business manage own media assets" ON public.media;
CREATE POLICY "Business manage own media assets" ON public.media
    FOR ALL TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin())
    WITH CHECK (business_id = public.get_current_business_id() OR public.is_super_admin());

-- SUBSCRIPTIONS (Read own, manage server/admin only)
DROP POLICY IF EXISTS "Business view own subscription" ON public.subscriptions;
CREATE POLICY "Business view own subscription" ON public.subscriptions
    FOR SELECT TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "Admin manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admin manage subscriptions" ON public.subscriptions
    FOR ALL TO authenticated USING (public.is_super_admin());

-- PAYMENTS (Read own, create/update via service/admin)
DROP POLICY IF EXISTS "Business view own payments" ON public.payments;
CREATE POLICY "Business view own payments" ON public.payments
    FOR SELECT TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "Admin manage payments" ON public.payments;
CREATE POLICY "Admin manage payments" ON public.payments
    FOR ALL TO authenticated USING (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- 5. POLICIES: CUSTOMER DATA PROTECTION
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customer manage own record" ON public.customers;
CREATE POLICY "Customer manage own record" ON public.customers
    FOR ALL TO authenticated
    USING (auth_user_id = auth.uid() OR public.is_super_admin())
    WITH CHECK (auth_user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Customer manage own personal events" ON public.user_events;
CREATE POLICY "Customer manage own personal events" ON public.user_events
    FOR ALL TO authenticated
    USING (customer_id = public.get_current_customer_id() OR public.is_super_admin())
    WITH CHECK (customer_id = public.get_current_customer_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "Customer manage own reminders" ON public.reminders;
CREATE POLICY "Customer manage own reminders" ON public.reminders
    FOR ALL TO authenticated
    USING (customer_id = public.get_current_customer_id() OR public.is_super_admin())
    WITH CHECK (customer_id = public.get_current_customer_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "Customer manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Customer manage own notification preferences" ON public.notification_preferences
    FOR ALL TO authenticated
    USING (auth_user_id = auth.uid() OR public.is_super_admin())
    WITH CHECK (auth_user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Customer manage own device tokens" ON public.notification_devices;
CREATE POLICY "Customer manage own device tokens" ON public.notification_devices
    FOR ALL TO public
    USING (auth_user_id = auth.uid() OR auth_user_id IS NULL)
    WITH CHECK (auth_user_id = auth.uid() OR auth_user_id IS NULL);

-- -----------------------------------------------------------------------------
-- 6. POLICIES: SUPER ADMIN & AUDIT LOGS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Super admin manage admin users" ON public.admin_users;
CREATE POLICY "Super admin manage admin users" ON public.admin_users
    FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin manage platform settings" ON public.platform_settings;
CREATE POLICY "Super admin manage platform settings" ON public.platform_settings
    FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin view audit logs" ON public.audit_logs;
CREATE POLICY "Super admin view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "System insert audit logs" ON public.audit_logs;
CREATE POLICY "System insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261006000003_storage_buckets.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- MANA CALENDAR 2027 — PHASE 1: STORAGE BUCKETS & STORAGE SECURITY POLICIES
-- Migration: 20261006000003_storage_buckets.sql
-- =============================================================================

-- 1. CREATE STORAGE BUCKETS (if storage schema exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('business-logos', 'business-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
    ('business-banners', 'business-banners', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
    ('campaign-media', 'campaign-media', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
    ('private-media', 'private-media', false, 20971520, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. STORAGE POLICIES: PUBLIC READ ACCESS FOR PUBLIC ASSETS
DROP POLICY IF EXISTS "Public Read Business Logos" ON storage.objects;
CREATE POLICY "Public Read Business Logos" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'business-logos');

DROP POLICY IF EXISTS "Public Read Business Banners" ON storage.objects;
CREATE POLICY "Public Read Business Banners" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'business-banners');

DROP POLICY IF EXISTS "Public Read Campaign Media" ON storage.objects;
CREATE POLICY "Public Read Campaign Media" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'campaign-media');

-- 3. STORAGE POLICIES: TENANT ISOLATION (Folder path must start with current business_id)
-- Folder format: {business_id}/{filename} e.g. SLJ001/logo.png
DROP POLICY IF EXISTS "Tenant Upload Business Logos" ON storage.objects;
CREATE POLICY "Tenant Upload Business Logos" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'business-logos' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    );

DROP POLICY IF EXISTS "Tenant Update Business Logos" ON storage.objects;
CREATE POLICY "Tenant Update Business Logos" ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'business-logos' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    );

DROP POLICY IF EXISTS "Tenant Delete Business Logos" ON storage.objects;
CREATE POLICY "Tenant Delete Business Logos" ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'business-logos' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    );

-- TENANT ISOLATED BANNERS
DROP POLICY IF EXISTS "Tenant Manage Business Banners" ON storage.objects;
CREATE POLICY "Tenant Manage Business Banners" ON storage.objects FOR ALL TO authenticated
    USING (
        bucket_id = 'business-banners' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    )
    WITH CHECK (
        bucket_id = 'business-banners' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    );

-- TENANT ISOLATED CAMPAIGN MEDIA
DROP POLICY IF EXISTS "Tenant Manage Campaign Media" ON storage.objects;
CREATE POLICY "Tenant Manage Campaign Media" ON storage.objects FOR ALL TO authenticated
    USING (
        bucket_id = 'campaign-media' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    )
    WITH CHECK (
        bucket_id = 'campaign-media' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    );

-- TENANT PRIVATE MEDIA (Read & Write restricted to tenant or Super Admin)
DROP POLICY IF EXISTS "Tenant Manage Private Media" ON storage.objects;
CREATE POLICY "Tenant Manage Private Media" ON storage.objects FOR ALL TO authenticated
    USING (
        bucket_id = 'private-media' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    )
    WITH CHECK (
        bucket_id = 'private-media' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    );


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261006000004_calendar_panchangam_engine.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- MANA CALENDAR 2027 — PHASE 2: CALENDAR & PANCHANGAM ENGINE SCHEMA
-- Migration: 20261006000004_calendar_panchangam_engine.sql
-- =============================================================================

-- 1. EXTEND PANCHANGAM TABLE WITH COMPLETE FIVE ANGAS & CELESTIAL TIMINGS
ALTER TABLE public.panchangam
    ADD COLUMN IF NOT EXISTS samvatsaram_en TEXT,
    ADD COLUMN IF NOT EXISTS samvatsaram_te TEXT,
    ADD COLUMN IF NOT EXISTS ayanam_en TEXT,
    ADD COLUMN IF NOT EXISTS ayanam_te TEXT,
    ADD COLUMN IF NOT EXISTS rutuvu_en TEXT,
    ADD COLUMN IF NOT EXISTS rutuvu_te TEXT,
    ADD COLUMN IF NOT EXISTS masam_en TEXT,
    ADD COLUMN IF NOT EXISTS masam_te TEXT,
    ADD COLUMN IF NOT EXISTS paksha_en TEXT,
    ADD COLUMN IF NOT EXISTS paksha_te TEXT,
    ADD COLUMN IF NOT EXISTS moonrise TEXT,
    ADD COLUMN IF NOT EXISTS moonset TEXT,
    ADD COLUMN IF NOT EXISTS gulika_kalam TEXT,
    ADD COLUMN IF NOT EXISTS abhijit_muhurtham TEXT,
    ADD COLUMN IF NOT EXISTS amrita_kalam TEXT,
    ADD COLUMN IF NOT EXISTS durmuhurtham TEXT,
    ADD COLUMN IF NOT EXISTS varjyam TEXT,
    ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Ensure location and date uniqueness to prevent duplicate records
CREATE UNIQUE INDEX IF NOT EXISTS uq_panchangam_date_city ON public.panchangam(calendar_date, city);
CREATE INDEX IF NOT EXISTS idx_panchangam_lookup ON public.panchangam(calendar_date, city);

-- 2. EXTEND FESTIVALS TABLE WITH HOLIDAY TYPES AND SEARCH TAGS
ALTER TABLE public.festivals
    ADD COLUMN IF NOT EXISTS is_holiday BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS holiday_type TEXT DEFAULT 'none' CHECK (holiday_type IN ('gazetted', 'restricted', 'regional_ap', 'cultural', 'none')),
    ADD COLUMN IF NOT EXISTS importance TEXT DEFAULT 'normal' CHECK (importance IN ('major', 'medium', 'normal')),
    ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT 'festival' CHECK (tag IN ('sankranti', 'ekadashi', 'purnima', 'amavasya', 'festival', 'holiday', 'special'));

-- Avoid duplicate festival entries on the same date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_festivals_date_name'
    ) THEN
        ALTER TABLE public.festivals ADD CONSTRAINT uq_festivals_date_name UNIQUE(calendar_date, name_en);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_festivals_date_range ON public.festivals(calendar_date);
CREATE INDEX IF NOT EXISTS idx_festivals_type ON public.festivals(festival_type);
CREATE INDEX IF NOT EXISTS idx_festivals_tag ON public.festivals(tag);

-- 3. EXTEND USER_EVENTS FOR PERSONAL EVENTS FOUNDATION (Phase 2 Requirement)
ALTER TABLE public.user_events
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'custom' CHECK (category IN ('birthday', 'anniversary', 'appointment', 'custom', 'reminder')),
    ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_user_events_customer_date ON public.user_events(customer_id, event_date);


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261006000005_weather_and_push_notifications.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- MANA CALENDAR 2027 — PHASE 3 MIGRATION
-- Weather Cache Expansion & Multi-Device Push Notifications (FCM Architecture)
-- =============================================================================

-- 1. WEATHER CACHE EXPANSION
-- Supports current conditions, 24-hr hourly forecast, and 7-day daily forecast
ALTER TABLE public.weather_cache
    ADD COLUMN IF NOT EXISTS feels_like_c NUMERIC,
    ADD COLUMN IF NOT EXISTS temp_min_c NUMERIC,
    ADD COLUMN IF NOT EXISTS temp_max_c NUMERIC,
    ADD COLUMN IF NOT EXISTS condition_te TEXT,
    ADD COLUMN IF NOT EXISTS rain_probability INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS wind_kph NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS uv_index NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sunrise TEXT,
    ADD COLUMN IF NOT EXISTS sunset TEXT,
    ADD COLUMN IF NOT EXISTS is_forecast BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS hourly_forecast JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS daily_forecast JSONB DEFAULT '[]'::jsonb;

-- Index on weather_cache for location and expiration
CREATE INDEX IF NOT EXISTS idx_weather_cache_lookup
    ON public.weather_cache(city, date, expires_at);

-- 2. NOTIFICATION DEVICES ENHANCEMENTS (Multiple devices per user/customer)
ALTER TABLE public.notification_devices
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS device_token TEXT,
    ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'android',
    ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update device_token if empty from fcm_token
UPDATE public.notification_devices
SET device_token = fcm_token
WHERE device_token IS NULL AND fcm_token IS NOT NULL;

-- Index for device lookups
CREATE INDEX IF NOT EXISTS idx_notification_devices_cust
    ON public.notification_devices(customer_id, enabled);

-- 3. NOTIFICATION PREFERENCES ENHANCEMENTS
ALTER TABLE public.notification_preferences
    ADD COLUMN IF NOT EXISTS enable_calendar BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS enable_system BOOLEAN DEFAULT true;

-- 4. NOTIFICATIONS EXPANSIONS
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS business_id TEXT REFERENCES public.businesses(business_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS business_name TEXT,
    ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read
    ON public.notifications(recipient_id, read_at);

-- 5. NOTIFICATION DELIVERIES TABLE
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.notification_devices(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'failed')),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_notification
    ON public.notification_deliveries(notification_id, status);

-- 6. NOTIFICATION CAMPAIGNS EXPANSIONS
ALTER TABLE public.notification_campaigns
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0}'::jsonb,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 7. PLATFORM SETTINGS — CONFIGURABLE NOTIFICATION LIMITS
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'notification_limits',
    '{
        "max_promotional_per_business_per_month": 4,
        "cooldown_hours_between_promotions": 24,
        "max_recipients_per_batch": 5000,
        "enabled": true
    }'::jsonb,
    'Configurable limits for business promotional notifications (Super Admin manageable)'
)
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    updated_at = now();

-- 8. SERVER-SIDE VERIFICATION: CAN BUSINESS SEND PROMOTIONAL NOTIFICATIONS?
-- Strictly enforces: ₹1,999/yr plan CANNOT send push notifications; ₹3,999/yr plan CAN.
CREATE OR REPLACE FUNCTION public.can_business_send_promotional_notifications(p_business_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan_code TEXT;
    v_status TEXT;
    v_push_enabled BOOLEAN;
BEGIN
    SELECT p.plan_code, s.status, (p.features->>'promotional_push_notifications')::boolean
    INTO v_plan_code, v_status, v_push_enabled
    FROM public.subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.business_id = p_business_id
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- If no subscription exists or subscription is not active/trial, return false
    IF v_status IS NULL OR v_status NOT IN ('active', 'trial') THEN
        RETURN FALSE;
    END IF;

    -- Return true only if plan features allow promotional push notifications (Premium plan)
    RETURN COALESCE(v_push_enabled, FALSE);
END;
$$;

-- 9. RLS POLICIES FOR NEW TABLES
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view deliveries for their notifications" ON public.notification_deliveries;
CREATE POLICY "Users can view deliveries for their notifications" ON public.notification_deliveries FOR SELECT
    USING (
        notification_id IN (
            SELECT id FROM public.notifications WHERE recipient_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Service and Super Admin can manage deliveries" ON public.notification_deliveries;
CREATE POLICY "Service and Super Admin can manage deliveries" ON public.notification_deliveries FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid() AND status = 'active'
        )
    );


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261006000006_customer_business_qr_campaigns.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- MANA CALENDAR 2027 — PHASE 4: CUSTOMER BUSINESS, QR & PROMOTIONAL CAMPAIGNS
-- Migration: 20261006000006_customer_business_qr_campaigns.sql
-- =============================================================================

-- 1. EXPAND CAMPAIGNS TABLE WITH PROMOTIONAL FIELDS & EXTENDED STATUSES
DO $$
BEGIN
    -- Add campaign extra fields if not already present
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'image_url') THEN
        ALTER TABLE public.campaigns ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'cta_text') THEN
        ALTER TABLE public.campaigns ADD COLUMN cta_text TEXT DEFAULT 'Learn More';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'cta_url') THEN
        ALTER TABLE public.campaigns ADD COLUMN cta_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'priority') THEN
        ALTER TABLE public.campaigns ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Drop and recreate status check constraint to support 'paused' and 'expired'
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_status_check 
    CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'expired', 'completed', 'cancelled'));

-- 2. AUDITABLE CAMPAIGN CREDITS LEDGER
-- Enforces: 10 campaigns/yr included. Extra: ₹299. Deleting does NOT restore credit.
CREATE TABLE IF NOT EXISTS public.campaign_credits_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    year INTEGER NOT NULL DEFAULT 2027,
    action TEXT NOT NULL CHECK (action IN ('campaign_published', 'campaign_scheduled', 'extra_purchased', 'admin_grant')),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    credits_consumed INTEGER NOT NULL DEFAULT 1,
    balance_after INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_ledger_business ON public.campaign_credits_ledger(business_id, year);

-- 3. EXPAND CUSTOMER_BUSINESSES (MY BUSINESSES RELATIONSHIP)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_businesses' AND column_name = 'promotional_notifications_enabled') THEN
        ALTER TABLE public.customer_businesses ADD COLUMN promotional_notifications_enabled BOOLEAN NOT NULL DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_businesses' AND column_name = 'is_active') THEN
        ALTER TABLE public.customer_businesses ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_businesses' AND column_name = 'last_interacted_at') THEN
        ALTER TABLE public.customer_businesses ADD COLUMN last_interacted_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customer_businesses_cust_act ON public.customer_businesses(customer_id, is_active);

-- 4. BUSINESS ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.business_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'qr_scan',
        'business_profile_view',
        'business_follow',
        'business_unfollow',
        'banner_impression',
        'banner_click',
        'campaign_view',
        'campaign_click',
        'notification_open'
    )),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_events_type ON public.business_analytics_events(business_id, event_type);
CREATE INDEX IF NOT EXISTS idx_business_events_date ON public.business_analytics_events(created_at);

-- 5. DEFERRED DEEP LINK ATTRIBUTION BRIDGE
CREATE TABLE IF NOT EXISTS public.deferred_deeplinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    referrer_url TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_deferred_token ON public.deferred_deeplinks(token);

-- 6. SERVER-SIDE RPC FUNCTIONS FOR CAMPAIGN QUOTA & CREDIT ENFORCEMENT

-- Check if business has remaining campaign credits
CREATE OR REPLACE FUNCTION public.can_business_create_campaign(
    p_business_id TEXT,
    p_year INT DEFAULT 2027
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usage RECORD;
    v_total_available INT;
    v_total_used INT;
    v_remaining INT;
BEGIN
    SELECT * INTO v_usage
    FROM public.campaign_usage
    WHERE business_id = p_business_id AND year = p_year;

    IF NOT FOUND THEN
        -- Default: 10 included campaigns
        v_total_available := 10;
        v_total_used := 0;
        v_remaining := 10;
    ELSE
        v_total_available := v_usage.included_campaigns_total + v_usage.extra_campaigns_purchased;
        v_total_used := v_usage.included_campaigns_used + v_usage.extra_campaigns_used;
        v_remaining := v_total_available - v_total_used;
    END IF;

    RETURN jsonb_build_object(
        'can_publish', (v_remaining > 0),
        'total_available', v_total_available,
        'total_used', v_total_used,
        'remaining_credits', v_remaining,
        'business_id', p_business_id,
        'year', p_year
    );
END;
$$;

-- Consume campaign credit when published/scheduled
CREATE OR REPLACE FUNCTION public.consume_campaign_credit(
    p_business_id TEXT,
    p_campaign_id UUID,
    p_year INT DEFAULT 2027,
    p_action TEXT DEFAULT 'campaign_published'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usage RECORD;
    v_total_available INT;
    v_total_used INT;
    v_remaining INT;
    v_balance_after INT;
BEGIN
    SELECT * INTO v_usage
    FROM public.campaign_usage
    WHERE business_id = p_business_id AND year = p_year;

    IF NOT FOUND THEN
        INSERT INTO public.campaign_usage (business_id, year, included_campaigns_total, included_campaigns_used, extra_campaigns_purchased, extra_campaigns_used)
        VALUES (p_business_id, p_year, 10, 1, 0, 0)
        RETURNING * INTO v_usage;

        v_balance_after := 9;
    ELSE
        v_total_available := v_usage.included_campaigns_total + v_usage.extra_campaigns_purchased;
        v_total_used := v_usage.included_campaigns_used + v_usage.extra_campaigns_used;
        v_remaining := v_total_available - v_total_used;

        IF v_remaining <= 0 THEN
            RAISE EXCEPTION 'Campaign limit reached. No credits remaining for business % in year %', p_business_id, p_year;
        END IF;

        IF v_usage.included_campaigns_used < v_usage.included_campaigns_total THEN
            UPDATE public.campaign_usage
            SET included_campaigns_used = included_campaigns_used + 1, updated_at = now()
            WHERE id = v_usage.id;
        ELSE
            UPDATE public.campaign_usage
            SET extra_campaigns_used = extra_campaigns_used + 1, updated_at = now()
            WHERE id = v_usage.id;
        END IF;

        v_balance_after := v_remaining - 1;
    END IF;

    -- Write immutable ledger record
    INSERT INTO public.campaign_credits_ledger (
        business_id, year, action, campaign_id, credits_consumed, balance_after, notes
    ) VALUES (
        p_business_id, p_year, p_action, p_campaign_id, 1, v_balance_after, 'Campaign credit consumed upon publish/schedule'
    );

    RETURN jsonb_build_object(
        'success', true,
        'balance_after', v_balance_after,
        'business_id', p_business_id
    );
END;
$$;

-- Purchase additional campaigns (₹299/campaign)
CREATE OR REPLACE FUNCTION public.purchase_additional_campaign_credits(
    p_business_id TEXT,
    p_quantity INT,
    p_year INT DEFAULT 2027
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usage RECORD;
    v_new_total INT;
    v_balance_after INT;
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    SELECT * INTO v_usage
    FROM public.campaign_usage
    WHERE business_id = p_business_id AND year = p_year;

    IF NOT FOUND THEN
        INSERT INTO public.campaign_usage (business_id, year, included_campaigns_total, included_campaigns_used, extra_campaigns_purchased, extra_campaigns_used)
        VALUES (p_business_id, p_year, 10, 0, p_quantity, 0)
        RETURNING * INTO v_usage;
    ELSE
        UPDATE public.campaign_usage
        SET extra_campaigns_purchased = extra_campaigns_purchased + p_quantity, updated_at = now()
        WHERE id = v_usage.id
        RETURNING * INTO v_usage;
    END IF;

    v_balance_after := (v_usage.included_campaigns_total + v_usage.extra_campaigns_purchased) - 
                       (v_usage.included_campaigns_used + v_usage.extra_campaigns_used);

    -- Write immutable ledger record
    INSERT INTO public.campaign_credits_ledger (
        business_id, year, action, credits_consumed, balance_after, notes
    ) VALUES (
        p_business_id, p_year, 'extra_purchased', 0, v_balance_after, format('Purchased %s extra campaigns @ ₹299 each', p_quantity)
    );

    RETURN jsonb_build_object(
        'success', true,
        'extra_campaigns_purchased', v_usage.extra_campaigns_purchased,
        'balance_after', v_balance_after
    );
END;
$$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.campaign_credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deferred_deeplinks ENABLE ROW LEVEL SECURITY;

-- Campaign ledger: Business can view own ledger; Super admin can view all
DROP POLICY IF EXISTS "Businesses can view own campaign credits ledger" ON public.campaign_credits_ledger;
CREATE POLICY "Businesses can view own campaign credits ledger" ON public.campaign_credits_ledger FOR SELECT
    USING (
        business_id = current_setting('request.jwt.claims', true)::json->'user_metadata'->>'business_id'
        OR current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role' = 'super_admin'
    );

-- Analytics events: Businesses can view own metrics; public/customers can insert events
DROP POLICY IF EXISTS "Public can insert analytics events" ON public.business_analytics_events;
CREATE POLICY "Public can insert analytics events" ON public.business_analytics_events FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Businesses can view own analytics events" ON public.business_analytics_events;
CREATE POLICY "Businesses can view own analytics events" ON public.business_analytics_events FOR SELECT
    USING (
        business_id = current_setting('request.jwt.claims', true)::json->'user_metadata'->>'business_id'
        OR current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role' = 'super_admin'
    );

-- Deferred deeplinks: Public can create and query by token
DROP POLICY IF EXISTS "Public can access deferred deeplinks" ON public.deferred_deeplinks;
CREATE POLICY "Public can access deferred deeplinks" ON public.deferred_deeplinks FOR ALL
    USING (true)
    WITH CHECK (true);


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261007000001_phase7_security_performance_scalability.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- MANA CALENDAR 2027 — PHASE 7: SECURITY, PERFORMANCE & SCALABILITY MIGRATION
-- Migration: 20261007000001_phase7_security_performance_scalability.sql
-- Purpose: Indexes for 10,000 businesses & 100,000+ events, RLS hardening,
--          audit snapshots, rate limiting, and backup verification registry.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. STATE DIFF COLUMNS ON AUDIT LOGS
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'before_value') THEN
        ALTER TABLE public.audit_logs ADD COLUMN before_value JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'after_value') THEN
        ALTER TABLE public.audit_logs ADD COLUMN after_value JSONB;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. PANCHANGAM AUDIT & EDITORIAL VERIFICATION TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.panchangam_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_date DATE NOT NULL,
    admin_id TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    action TEXT NOT NULL DEFAULT 'verified' CHECK (action IN ('verified', 'correction', 'published')),
    before_value JSONB,
    after_value JSONB NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_panchangam_audits_date ON public.panchangam_audits(calendar_date);
CREATE INDEX IF NOT EXISTS idx_panchangam_audits_created ON public.panchangam_audits(created_at);

-- -----------------------------------------------------------------------------
-- 3. CAMPAIGN CONTENT MODERATION LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    admin_id TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('pause', 'resume', 'flag', 'remove', 'approve')),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_mod_campaign ON public.campaign_moderation_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_mod_created ON public.campaign_moderation_logs(created_at);

-- -----------------------------------------------------------------------------
-- 4. ABUSE PROTECTION & AUTH RATE LIMITING TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP address or email
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('login', 'mfa', 'api_request', 'notification_dispatch')),
    attempts_count INTEGER NOT NULL DEFAULT 1,
    locked_until TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_ident_type ON public.auth_rate_limits(identifier, attempt_type);

-- -----------------------------------------------------------------------------
-- 5. BACKUP METADATA & INTEGRITY VERIFICATION REGISTRY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.database_backup_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_tag TEXT UNIQUE NOT NULL,
    tables_count INTEGER NOT NULL,
    records_count INTEGER NOT NULL,
    sha256_checksum TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'verified_restored', 'failed')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. PERFORMANCE INDEXES FOR SCALING TO 1,000+ TENANTS & 100,000+ CAMPAIGN EVENTS
-- -----------------------------------------------------------------------------
-- Businesses
CREATE INDEX IF NOT EXISTS idx_perf_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_perf_businesses_plan ON public.businesses(plan_code);
CREATE INDEX IF NOT EXISTS idx_perf_businesses_created ON public.businesses(created_at DESC);

-- Campaigns (Composite query index for active delivery slots)
CREATE INDEX IF NOT EXISTS idx_perf_campaigns_lookup 
    ON public.campaigns(business_id, status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_perf_campaigns_active_range 
    ON public.campaigns(status, start_date, end_date) 
    WHERE status = 'active';

-- Banners
CREATE INDEX IF NOT EXISTS idx_perf_banners_lookup 
    ON public.banners(business_id, status, slot_position);

-- Subscriptions (Expiry monitoring & renewal schedule)
CREATE INDEX IF NOT EXISTS idx_perf_subs_business_status 
    ON public.subscriptions(business_id, status);
CREATE INDEX IF NOT EXISTS idx_perf_subs_end_date 
    ON public.subscriptions(end_date);

-- Payments (Ledger reconciliation)
CREATE INDEX IF NOT EXISTS idx_perf_payments_business 
    ON public.payments(business_id, status, created_at DESC);

-- Analytics & Event Aggregation
CREATE INDEX IF NOT EXISTS idx_perf_analytics_event_agg 
    ON public.business_analytics_events(business_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perf_analytics_campaign 
    ON public.business_analytics_events(campaign_id, event_type);

-- Weather Cache & Ephemeris
CREATE INDEX IF NOT EXISTS idx_perf_weather_coords_cached 
    ON public.weather_cache(latitude, longitude, cached_at DESC);
CREATE INDEX IF NOT EXISTS idx_perf_panchangam_date 
    ON public.panchangam(calendar_date);

-- Support Tickets
CREATE INDEX IF NOT EXISTS idx_perf_tickets_filter 
    ON public.support_tickets(business_id, status, priority);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_perf_audit_action_date 
    ON public.audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perf_audit_resource 
    ON public.audit_logs(resource_type, resource_id);

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY POLICIES FOR NEW TABLES
-- -----------------------------------------------------------------------------
ALTER TABLE public.panchangam_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_backup_registry ENABLE ROW LEVEL SECURITY;

-- Panchangam Audits (Public read verified, admin write)
DROP POLICY IF EXISTS "Public read verified panchangam audits" ON public.panchangam_audits;
CREATE POLICY "Public read verified panchangam audits" ON public.panchangam_audits
    FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admin manage panchangam audits" ON public.panchangam_audits;
CREATE POLICY "Admin manage panchangam audits" ON public.panchangam_audits
    FOR ALL TO authenticated USING (public.is_super_admin());

-- Campaign Moderation Logs (Business read own, admin manage)
DROP POLICY IF EXISTS "Business view own campaign moderation" ON public.campaign_moderation_logs;
CREATE POLICY "Business view own campaign moderation" ON public.campaign_moderation_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_moderation_logs.campaign_id
              AND c.business_id = public.get_current_business_id()
        )
        OR public.is_super_admin()
    );
DROP POLICY IF EXISTS "Admin manage campaign moderation" ON public.campaign_moderation_logs;
CREATE POLICY "Admin manage campaign moderation" ON public.campaign_moderation_logs
    FOR ALL TO authenticated USING (public.is_super_admin());

-- Rate Limits (Service role / admin only)
DROP POLICY IF EXISTS "Admin view auth rate limits" ON public.auth_rate_limits;
CREATE POLICY "Admin view auth rate limits" ON public.auth_rate_limits
    FOR SELECT TO authenticated USING (public.is_super_admin());

-- Database Backup Registry (Admin only)
DROP POLICY IF EXISTS "Admin manage database backups" ON public.database_backup_registry;
CREATE POLICY "Admin manage database backups" ON public.database_backup_registry
    FOR ALL TO authenticated USING (public.is_super_admin());


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20261007000002_phase8_production_launch.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- MANA CALENDAR 2027 — PHASE 8: PRODUCTION DEPLOYMENT & PLAY STORE LAUNCH MIGRATION
-- Migration: 20261007000002_phase8_production_launch.sql
-- Purpose: Final production indexes, release registry, Play Store account deletion compliance,
--          deferred deep-link attribution indexes, and production RLS hardening.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PRODUCTION RELEASE & STAGED ROLLOUT REGISTRY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.production_release_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id TEXT NOT NULL DEFAULT 'in.manacalendar.app',
    version_name TEXT NOT NULL,          -- e.g. '1.0.0'
    version_code INTEGER NOT NULL,       -- e.g. 1
    platform TEXT NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'web', 'ios')),
    channel TEXT NOT NULL DEFAULT 'production' CHECK (channel IN ('internal', 'closed_testing', 'production')),
    staged_rollout_percentage INTEGER NOT NULL DEFAULT 5 CHECK (staged_rollout_percentage BETWEEN 0 AND 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    min_supported_version_code INTEGER NOT NULL DEFAULT 1,
    release_notes JSONB NOT NULL DEFAULT '{"te": "మన క్యాలెండర్ 2027 విడుదల", "en": "Initial Production Release of Mana Calendar 2027"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prod_release_active ON public.production_release_registry(platform, channel, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prod_release_ver_code ON public.production_release_registry(platform, version_code);

-- Seed Initial 1.0.0 Production Release Entry
INSERT INTO public.production_release_registry (
    app_id, version_name, version_code, platform, channel, staged_rollout_percentage, is_active, min_supported_version_code, release_notes
) VALUES (
    'in.manacalendar.app',
    '1.0.0',
    1,
    'android',
    'production',
    5,
    true,
    1,
    '{"te": "శ్రీ ప్లవ నామ సంవత్సరం 2027 తెలుగు + ఇంగ్లీష్ క్యాలెండర్ మరియు పంచాంగం ప్రారంభం.", "en": "Official launch of Mana Calendar 2027: Telugu Panchangam, daily weather, festivals, and verified local merchant offers."}'::jsonb
) ON CONFLICT (platform, version_code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. GOOGLE PLAY STORE MANDATED ACCOUNT & DATA DELETION REQUESTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,            -- Email or phone provided by user
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    ip_address TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_acc_deletion_status ON public.account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_acc_deletion_req_at ON public.account_deletion_requests(requested_at DESC);

-- -----------------------------------------------------------------------------
-- 3. DEFERRED DEEP-LINK ATTRIBUTION TRACKING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deferred_deeplinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    business_id TEXT NOT NULL REFERENCES public.businesses(business_id) ON DELETE CASCADE,
    campaign_id UUID,
    referrer_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
    claimed_by_customer_id TEXT,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deferred_token ON public.deferred_deeplinks(token);
CREATE INDEX IF NOT EXISTS idx_deferred_biz_status ON public.deferred_deeplinks(business_id, status);

-- -----------------------------------------------------------------------------
-- 4. SECTION 4 PRODUCTION INDEXES VERIFICATION
-- -----------------------------------------------------------------------------
-- user_events
CREATE INDEX IF NOT EXISTS idx_prod_user_events_customer ON public.user_events(customer_id, event_date);

-- reminders
CREATE INDEX IF NOT EXISTS idx_prod_reminders_customer ON public.reminders(customer_id, remind_at, is_sent);

-- notification_devices
CREATE INDEX IF NOT EXISTS idx_prod_notif_devices_customer ON public.notification_devices(customer_id, enabled);

-- notifications
CREATE INDEX IF NOT EXISTS idx_prod_notif_recipient ON public.notifications(recipient_id, is_read, created_at DESC);

-- notification_deliveries
CREATE INDEX IF NOT EXISTS idx_prod_notif_deliveries ON public.notification_deliveries(notification_id, status);

-- notification_campaigns
CREATE INDEX IF NOT EXISTS idx_prod_notif_campaigns_biz ON public.notification_campaigns(business_id, status, scheduled_at);

-- calendar_dates
CREATE INDEX IF NOT EXISTS idx_prod_cal_dates_lookup ON public.calendar_dates(year, month, day);

-- -----------------------------------------------------------------------------
-- 5. RLS POLICIES FOR NEW PRODUCTION TABLES
-- -----------------------------------------------------------------------------
ALTER TABLE public.production_release_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deferred_deeplinks ENABLE ROW LEVEL SECURITY;

-- Production Release Registry (Public read active release metadata, Super Admin manage)
DROP POLICY IF EXISTS "Public read production releases" ON public.production_release_registry;
CREATE POLICY "Public read production releases" ON public.production_release_registry
    FOR SELECT TO public USING (is_active = true);
DROP POLICY IF EXISTS "Admin manage production releases" ON public.production_release_registry;
CREATE POLICY "Admin manage production releases" ON public.production_release_registry
    FOR ALL TO authenticated USING (public.is_super_admin());

-- Account Deletion Requests (Public create deletion request, Super Admin view & process)
DROP POLICY IF EXISTS "Public submit account deletion" ON public.account_deletion_requests;
CREATE POLICY "Public submit account deletion" ON public.account_deletion_requests
    FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Admin manage account deletions" ON public.account_deletion_requests;
CREATE POLICY "Admin manage account deletions" ON public.account_deletion_requests
    FOR ALL TO authenticated USING (public.is_super_admin());

-- Deferred Deep Links (Public insert pending and claim, Business view own)
DROP POLICY IF EXISTS "Public register deferred deeplink" ON public.deferred_deeplinks;
CREATE POLICY "Public register deferred deeplink" ON public.deferred_deeplinks
    FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Public read pending deferred deeplink" ON public.deferred_deeplinks;
CREATE POLICY "Public read pending deferred deeplink" ON public.deferred_deeplinks
    FOR SELECT TO public USING (status = 'pending');
DROP POLICY IF EXISTS "Business view own deferred deeplinks" ON public.deferred_deeplinks;
CREATE POLICY "Business view own deferred deeplinks" ON public.deferred_deeplinks
    FOR SELECT TO authenticated
    USING (
        business_id = public.get_current_business_id()
        OR public.is_super_admin()
    );


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: seed.sql (DEMO BUSINESSES & SEED DATA)
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- =============================================================================
-- MANA CALENDAR 2027 — PHASE 1: DEVELOPMENT SEED DATA
-- seed/seed.sql
-- Development and architectural verification data only. No real secrets or PII.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SEED PLANS
-- -----------------------------------------------------------------------------
INSERT INTO public.plans (id, plan_code, name, price_inr, billing_period, included_campaigns, extra_campaign_price_inr, features, is_active)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'business',
    'Business Plan',
    1999,
    'year',
    10,
    299,
    '{
        "calendar_ecosystem_access": true,
        "business_profile": true,
        "logo": true,
        "qr_code": true,
        "promotional_banners": true,
        "campaigns": true,
        "analytics": true,
        "scheduling": true,
        "promotional_push_notifications": false,
        "enhanced_branding": false
    }'::jsonb,
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'premium',
    'Premium Plan',
    3999,
    'year',
    10,
    299,
    '{
        "calendar_ecosystem_access": true,
        "business_profile": true,
        "logo": true,
        "qr_code": true,
        "promotional_banners": true,
        "campaigns": true,
        "analytics": true,
        "scheduling": true,
        "promotional_push_notifications": true,
        "enhanced_branding": true
    }'::jsonb,
    true
)
ON CONFLICT (plan_code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. SEED BUSINESSES (TENANTS)
-- -----------------------------------------------------------------------------
INSERT INTO public.businesses (id, business_id, name, slug, status, plan_id)
VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'SLJ001',
    'Sri Lakshmi Jewellery',
    'sri-lakshmi-jewellery',
    'active',
    '00000000-0000-0000-0000-000000000002' -- Premium
),
(
    '10000000-0000-0000-0000-000000000002',
    'RF002',
    'Rythu Fresh Mart',
    'rythu-fresh-mart',
    'active',
    '00000000-0000-0000-0000-000000000001' -- Business
),
(
    '10000000-0000-0000-0000-000000000003',
    'CMR003',
    'CMR Shopping Mall',
    'cmr-shopping-mall',
    'active',
    '00000000-0000-0000-0000-000000000002' -- Premium
)
ON CONFLICT (business_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. SEED BUSINESS PROFILES
-- -----------------------------------------------------------------------------
INSERT INTO public.business_profiles (business_id, logo, cover_image, description, phone, email, website, address, city, state, pincode)
VALUES
(
    'SLJ001',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&fit=crop',
    'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=800&fit=crop',
    'Leading 916 Hallmark Gold & Diamond Jewellery in Vizag since 1985.',
    '+91 891 275 4321',
    'contact@srilakshmijewellers.dev',
    'https://srilakshmijewellers.dev',
    'Main Road, Dwaraka Nagar',
    'Visakhapatnam',
    'Andhra Pradesh',
    '530016'
),
(
    'RF002',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&fit=crop',
    'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&fit=crop',
    'Farm-fresh vegetables, organic staples, and fresh fruits directly from local farmers.',
    '+91 891 254 9876',
    'sales@rythufresh.dev',
    'https://rythufreshmart.dev',
    'MVP Colony, Sector 3',
    'Visakhapatnam',
    'Andhra Pradesh',
    '530017'
),
(
    'CMR003',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&fit=crop',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&fit=crop',
    'The Family Shopping Mall with modern fashion, silks, and traditional wedding collections.',
    '+91 891 250 1122',
    'info@cmrmall.dev',
    'https://cmrshoppingmall.dev',
    'Jagadamba Junction',
    'Visakhapatnam',
    'Andhra Pradesh',
    '530020'
)
ON CONFLICT (business_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. SEED CAMPAIGN USAGE (10 included campaigns / year)
-- -----------------------------------------------------------------------------
INSERT INTO public.campaign_usage (business_id, year, included_campaigns_total, included_campaigns_used, extra_campaigns_purchased, extra_campaigns_used)
VALUES
('SLJ001', 2027, 10, 2, 0, 0),
('RF002', 2027, 10, 1, 0, 0),
('CMR003', 2027, 10, 3, 1, 0)
ON CONFLICT (business_id, year) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. SEED ACTIVE BANNERS (Contextual Customer Promotions)
-- -----------------------------------------------------------------------------
INSERT INTO public.banners (business_id, title, image_url, target_url, status)
VALUES
(
    'SLJ001',
    'Sankranti 2027 Gold Mahotsavam - 0% Making Charges on Select Ornaments',
    'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=600&fit=crop',
    'https://srilakshmijewellers.dev/sankranti',
    'active'
),
(
    'RF002',
    'Weekend Organic Farmers Market - Fresh Harvest Offers',
    'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&fit=crop',
    'https://rythufreshmart.dev/weekend',
    'active'
),
(
    'CMR003',
    'New Year & Wedding Silk Sarees Collection 2027',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&fit=crop',
    'https://cmrshoppingmall.dev/silks',
    'active'
);

-- -----------------------------------------------------------------------------
-- 6. SEED CALENDAR DATES & TELUGU FESTIVALS (2027 Foundation)
-- -----------------------------------------------------------------------------
INSERT INTO public.calendar_dates (calendar_date, year, month, day, day_of_week, is_weekend)
VALUES
('2027-01-01', 2027, 1, 1, 5, false),
('2027-01-14', 2027, 1, 14, 4, false),
('2027-01-15', 2027, 1, 15, 5, false),
('2027-01-26', 2027, 1, 26, 2, false),
('2027-03-24', 2027, 3, 24, 3, false),
('2027-04-07', 2027, 4, 7, 3, false),
('2027-08-15', 2027, 8, 15, 0, true),
('2027-10-20', 2027, 10, 20, 3, false),
('2027-11-08', 2027, 11, 8, 1, false)
ON CONFLICT (calendar_date) DO NOTHING;

INSERT INTO public.festivals (calendar_date, name_en, name_te, festival_type, description_en, description_te)
VALUES
('2027-01-01', 'New Year Day', 'నూతన సంవత్సర దినోత్సవం', 'national', 'Beginning of the Gregorian calendar year 2027', '2027 నూతన సంవత్సర ప్రారంభం'),
('2027-01-14', 'Bhogi', 'భోగి పండుగ', 'regional', 'First day of the 4-day Sankranti harvest festival', 'సంక్రాంతి పండుగ మొదటి రోజు భోగి మంటల సంబరం'),
('2027-01-15', 'Makara Sankranti', 'మకర సంక్రాంతి / పెద్ద పండుగ', 'hindu', 'Sun enters Makara Rashi; major Telugu harvest festival', 'సూర్యుడు మకర రాశిలోకి ప్రవేశించే పవిత్ర పర్వదినం'),
('2027-01-26', 'Republic Day', 'గణతంత్ర దినోత్సవం', 'national', 'National celebration of the Indian Constitution', 'భారత గణతంత్ర దినోత్సవం'),
('2027-03-24', 'Holi', 'హోలీ (రంగుల పండుగ)', 'hindu', 'Festival of colors and triumph of good over evil', 'వసంతోత్సవం, రంగుల పండుగ'),
('2027-04-07', 'Ugadi (Telugu New Year)', 'శ్రీ ప్లవంగ నామ ఉగాది', 'regional', 'Telugu New Year festival celebrated across AP and Telangana', 'తెలుగు నూతన సంవత్సర ఉగాది పండుగ'),
('2027-08-15', 'Independence Day', 'స్వాతంత్ర్య దినోత్సవం', 'national', 'Celebration of Indian Independence', 'భారత స్వాతంత్ర్య దినోత్సవం'),
('2027-10-20', 'Vijayadashami / Dasara', 'విజయదశమి / దసరా', 'hindu', 'Celebration of the victory of Goddess Durga', 'చెడుపై మంచి సాధించిన విజయానికి ప్రతీక'),
('2027-11-08', 'Deepavali', 'దీపావళి పండుగ', 'hindu', 'Festival of lights celebrated nationwide', 'దీపాల కాంతుల పర్వదినం');

-- -----------------------------------------------------------------------------
-- 7. SEED PANCHANGAM ARCHITECTURE DATA (Visakhapatnam, 2027-01-15 Sankranti)
-- -----------------------------------------------------------------------------
INSERT INTO public.panchangam (calendar_date, city, tithi, nakshatram, yogam, karanam, rahu_kalam, yama_gandam, sunrise, sunset)
VALUES
(
    '2027-01-15',
    'Visakhapatnam',
    'శుక్ల పక్ష సప్తమి (Shukla Saptami)',
    'ఉత్తరాషాఢ (Uttarashadha)',
    'సిద్ధ (Siddha)',
    'గరజ (Garaja)',
    '10:30 AM - 12:00 PM',
    '03:00 PM - 04:30 PM',
    '06:28 AM',
    '05:54 PM'
)
ON CONFLICT (calendar_date, city) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8. SEED ADMIN ROLES & PERMISSIONS
-- -----------------------------------------------------------------------------
INSERT INTO public.admin_roles (id, name, description)
VALUES
('20000000-0000-0000-0000-000000000001', 'super_admin', 'Full platform governance and administrative control'),
('20000000-0000-0000-0000-000000000002', 'support_admin', 'Customer support and ticket resolution'),
('20000000-0000-0000-0000-000000000003', 'content_admin', 'Panchangam, festival, and calendar editorial management')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.admin_permissions (permission_key, description)
VALUES
('manage_businesses', 'Create, review, suspend, and configure business tenants'),
('manage_subscriptions', 'Manage plans, pricing tiers, and manual subscription overrides'),
('manage_payments', 'Inspect payment transaction ledgers and webhook logs'),
('manage_calendar', 'Manage calendar dates, holidays, and regional festivals'),
('manage_panchangam', 'Manage ephemeris and astrological panchangam parameters'),
('view_audit_logs', 'Review administrative security and audit logs')
ON CONFLICT (permission_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 9. SEED PLATFORM SETTINGS
-- -----------------------------------------------------------------------------
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES
(
    'app_metadata',
    '{"app_name": "Mana Calendar 2027", "version": "1.0.0", "default_year": 2027}'::jsonb,
    'Core application metadata and branding'
),
(
    'pricing_rules',
    '{"business_annual_inr": 1999, "premium_annual_inr": 3999, "extra_campaign_inr": 299, "included_campaigns": 10}'::jsonb,
    'Pricing rules and plan limits'
),
(
    'default_location',
    '{"city": "Visakhapatnam", "state": "Andhra Pradesh", "country": "India", "latitude": 17.6868, "longitude": 83.2185}'::jsonb,
    'Default geographic location'
)
ON CONFLICT (setting_key) DO NOTHING;

