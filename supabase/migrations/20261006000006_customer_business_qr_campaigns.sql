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
CREATE POLICY "Businesses can view own campaign credits ledger"
    ON public.campaign_credits_ledger FOR SELECT
    USING (
        business_id = current_setting('request.jwt.claims', true)::json->'user_metadata'->>'business_id'
        OR current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role' = 'super_admin'
    );

-- Analytics events: Businesses can view own metrics; public/customers can insert events
CREATE POLICY "Public can insert analytics events"
    ON public.business_analytics_events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Businesses can view own analytics events"
    ON public.business_analytics_events FOR SELECT
    USING (
        business_id = current_setting('request.jwt.claims', true)::json->'user_metadata'->>'business_id'
        OR current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role' = 'super_admin'
    );

-- Deferred deeplinks: Public can create and query by token
CREATE POLICY "Public can access deferred deeplinks"
    ON public.deferred_deeplinks FOR ALL
    USING (true)
    WITH CHECK (true);
