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
CREATE POLICY "Public Read Business Logos"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'business-logos');

CREATE POLICY "Public Read Business Banners"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'business-banners');

CREATE POLICY "Public Read Campaign Media"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'campaign-media');

-- 3. STORAGE POLICIES: TENANT ISOLATION (Folder path must start with current business_id)
-- Folder format: {business_id}/{filename} e.g. SLJ001/logo.png
CREATE POLICY "Tenant Upload Business Logos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'business-logos' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    );

CREATE POLICY "Tenant Update Business Logos"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'business-logos' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    );

CREATE POLICY "Tenant Delete Business Logos"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'business-logos' AND
        (
            (storage.foldername(name))[1] = public.get_current_business_id()
            OR public.is_super_admin()
        )
    );

-- TENANT ISOLATED BANNERS
CREATE POLICY "Tenant Manage Business Banners"
    ON storage.objects FOR ALL TO authenticated
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
CREATE POLICY "Tenant Manage Campaign Media"
    ON storage.objects FOR ALL TO authenticated
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
CREATE POLICY "Tenant Manage Private Media"
    ON storage.objects FOR ALL TO authenticated
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
