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
CREATE POLICY "Public read verified panchangam audits" ON public.panchangam_audits
    FOR SELECT TO public USING (true);
CREATE POLICY "Admin manage panchangam audits" ON public.panchangam_audits
    FOR ALL TO authenticated USING (public.is_super_admin());

-- Campaign Moderation Logs (Business read own, admin manage)
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
CREATE POLICY "Admin manage campaign moderation" ON public.campaign_moderation_logs
    FOR ALL TO authenticated USING (public.is_super_admin());

-- Rate Limits (Service role / admin only)
CREATE POLICY "Admin view auth rate limits" ON public.auth_rate_limits
    FOR SELECT TO authenticated USING (public.is_super_admin());

-- Database Backup Registry (Admin only)
CREATE POLICY "Admin manage database backups" ON public.database_backup_registry
    FOR ALL TO authenticated USING (public.is_super_admin());
