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
