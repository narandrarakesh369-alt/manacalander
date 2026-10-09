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
