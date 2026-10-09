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
