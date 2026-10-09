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
CREATE POLICY "Public read-only calendar dates" ON public.calendar_dates
    FOR SELECT TO public USING (true);

CREATE POLICY "Admin manage calendar dates" ON public.calendar_dates
    FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Public read-only festivals" ON public.festivals
    FOR SELECT TO public USING (true);

CREATE POLICY "Admin manage festivals" ON public.festivals
    FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Public read-only panchangam" ON public.panchangam
    FOR SELECT TO public USING (true);

CREATE POLICY "Admin manage panchangam" ON public.panchangam
    FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Public read-only weather cache" ON public.weather_cache
    FOR SELECT TO public USING (true);

CREATE POLICY "Public read active plans" ON public.plans
    FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admin manage plans" ON public.plans
    FOR ALL TO authenticated USING (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- 4. POLICIES: BUSINESS TENANT ISOLATION
-- Strict Tenant Isolation: Business A (SLJ001) CANNOT read/modify Business B (RF002)
-- -----------------------------------------------------------------------------

-- BUSINESSES
CREATE POLICY "Public view active businesses" ON public.businesses
    FOR SELECT TO public USING (status = 'active');

CREATE POLICY "Business user view own business" ON public.businesses
    FOR SELECT TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin());

CREATE POLICY "Business user update own business" ON public.businesses
    FOR UPDATE TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin())
    WITH CHECK (business_id = public.get_current_business_id() OR public.is_super_admin());

-- BUSINESS PROFILES
CREATE POLICY "Public view business profiles" ON public.business_profiles
    FOR SELECT TO public USING (true);

CREATE POLICY "Business user manage own profile" ON public.business_profiles
    FOR ALL TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin())
    WITH CHECK (business_id = public.get_current_business_id() OR public.is_super_admin());

-- CAMPAIGNS (Tenant Isolated)
CREATE POLICY "Public view active published campaigns" ON public.campaigns
    FOR SELECT TO public USING (status = 'active');

CREATE POLICY "Business tenant manage own campaigns" ON public.campaigns
    FOR ALL TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin())
    WITH CHECK (business_id = public.get_current_business_id() OR public.is_super_admin());

-- CAMPAIGN USAGE (Tenant Isolated)
CREATE POLICY "Business view own campaign usage" ON public.campaign_usage
    FOR SELECT TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin());

CREATE POLICY "Admin manage campaign usage" ON public.campaign_usage
    FOR ALL TO authenticated USING (public.is_super_admin());

-- BANNERS
CREATE POLICY "Public view active banners" ON public.banners
    FOR SELECT TO public USING (status = 'active');

CREATE POLICY "Business manage own banners" ON public.banners
    FOR ALL TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin())
    WITH CHECK (business_id = public.get_current_business_id() OR public.is_super_admin());

-- MEDIA LIBRARY (Tenant Isolated)
CREATE POLICY "Business manage own media assets" ON public.media
    FOR ALL TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin())
    WITH CHECK (business_id = public.get_current_business_id() OR public.is_super_admin());

-- SUBSCRIPTIONS (Read own, manage server/admin only)
CREATE POLICY "Business view own subscription" ON public.subscriptions
    FOR SELECT TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin());

CREATE POLICY "Admin manage subscriptions" ON public.subscriptions
    FOR ALL TO authenticated USING (public.is_super_admin());

-- PAYMENTS (Read own, create/update via service/admin)
CREATE POLICY "Business view own payments" ON public.payments
    FOR SELECT TO authenticated
    USING (business_id = public.get_current_business_id() OR public.is_super_admin());

CREATE POLICY "Admin manage payments" ON public.payments
    FOR ALL TO authenticated USING (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- 5. POLICIES: CUSTOMER DATA PROTECTION
-- -----------------------------------------------------------------------------
CREATE POLICY "Customer manage own record" ON public.customers
    FOR ALL TO authenticated
    USING (auth_user_id = auth.uid() OR public.is_super_admin())
    WITH CHECK (auth_user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Customer manage own personal events" ON public.user_events
    FOR ALL TO authenticated
    USING (customer_id = public.get_current_customer_id() OR public.is_super_admin())
    WITH CHECK (customer_id = public.get_current_customer_id() OR public.is_super_admin());

CREATE POLICY "Customer manage own reminders" ON public.reminders
    FOR ALL TO authenticated
    USING (customer_id = public.get_current_customer_id() OR public.is_super_admin())
    WITH CHECK (customer_id = public.get_current_customer_id() OR public.is_super_admin());

CREATE POLICY "Customer manage own notification preferences" ON public.notification_preferences
    FOR ALL TO authenticated
    USING (auth_user_id = auth.uid() OR public.is_super_admin())
    WITH CHECK (auth_user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Customer manage own device tokens" ON public.notification_devices
    FOR ALL TO public
    USING (auth_user_id = auth.uid() OR auth_user_id IS NULL)
    WITH CHECK (auth_user_id = auth.uid() OR auth_user_id IS NULL);

-- -----------------------------------------------------------------------------
-- 6. POLICIES: SUPER ADMIN & AUDIT LOGS
-- -----------------------------------------------------------------------------
CREATE POLICY "Super admin manage admin users" ON public.admin_users
    FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Super admin manage platform settings" ON public.platform_settings
    FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Super admin view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated USING (public.is_super_admin());

CREATE POLICY "System insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);
