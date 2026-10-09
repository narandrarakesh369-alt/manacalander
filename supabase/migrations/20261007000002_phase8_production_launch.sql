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
CREATE POLICY "Public read production releases" ON public.production_release_registry
    FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin manage production releases" ON public.production_release_registry
    FOR ALL TO authenticated USING (public.is_super_admin());

-- Account Deletion Requests (Public create deletion request, Super Admin view & process)
CREATE POLICY "Public submit account deletion" ON public.account_deletion_requests
    FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admin manage account deletions" ON public.account_deletion_requests
    FOR ALL TO authenticated USING (public.is_super_admin());

-- Deferred Deep Links (Public insert pending and claim, Business view own)
CREATE POLICY "Public register deferred deeplink" ON public.deferred_deeplinks
    FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public read pending deferred deeplink" ON public.deferred_deeplinks
    FOR SELECT TO public USING (status = 'pending');
CREATE POLICY "Business view own deferred deeplinks" ON public.deferred_deeplinks
    FOR SELECT TO authenticated
    USING (
        business_id = public.get_current_business_id()
        OR public.is_super_admin()
    );
