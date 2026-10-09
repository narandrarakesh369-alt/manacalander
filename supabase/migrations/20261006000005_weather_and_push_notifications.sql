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

CREATE POLICY "Users can view deliveries for their notifications"
    ON public.notification_deliveries FOR SELECT
    USING (
        notification_id IN (
            SELECT id FROM public.notifications WHERE recipient_id = auth.uid()
        )
    );

CREATE POLICY "Service and Super Admin can manage deliveries"
    ON public.notification_deliveries FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid() AND status = 'active'
        )
    );
