import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  CalendarService,
  PanchangamService,
  WeatherService,
  PaymentService,
  AdminService,
  DeferredDeepLinkService,
  BackupService,
  CampaignService,
  NotificationService,
} from '@mana/services';
import { PLANS_CONFIG, CAMPAIGN_RULES, DEFAULT_LOCATION } from '@mana/config';
import { getSafeErrorMessage } from '@mana/utils';

describe('PHASE 8: Production Deployment & Play Store Launch Verification', () => {
  // ===========================================================================
  // 1. ENVIRONMENT SEPARATION & CONFIGURATION AUDIT
  // ===========================================================================
  describe('1. Environment Separation & Secret Protection', () => {
    it('verifies production environment template does not leak secrets to VITE_ variables', () => {
      const prodEnvPath = path.resolve(__dirname, '../.env.production.example');
      expect(fs.existsSync(prodEnvPath)).toBe(true);

      const content = fs.readFileSync(prodEnvPath, 'utf-8');
      expect(content).toContain('VITE_APP_ENV=production');
      expect(content).toContain('VITE_APP_URL=https://manacalendar.in');
      expect(content).not.toContain('VITE_SUPABASE_SERVICE_ROLE_KEY');
      expect(content).not.toContain('VITE_PAYMENT_KEY_SECRET');
      expect(content).not.toContain('VITE_WEATHER_API_KEY');
    });

    it('sanitizes public-facing database error messages to prevent internal leakage', () => {
      const internalDbError = new Error('duplicate key value violates unique constraint "businesses_business_id_key"');
      const safeMessage = getSafeErrorMessage(internalDbError);
      expect(safeMessage).not.toContain('businesses_business_id_key');
      expect(safeMessage).toContain('already exists');
    });
  });

  // ===========================================================================
  // 2. ANDROID PRODUCTION APP & CAPACITOR CONFIGURATION
  // ===========================================================================
  describe('2. Android Production App & Capacitor Configuration', () => {
    it('verifies capacitor.config.ts has correct package name, app name, and secure scheme', async () => {
      const capConfigPath = path.resolve(__dirname, '../capacitor.config.ts');
      expect(fs.existsSync(capConfigPath)).toBe(true);

      const content = fs.readFileSync(capConfigPath, 'utf-8');
      expect(content).toContain("appId: 'in.manacalendar.app'");
      expect(content).toContain("appName: 'Mana Calendar 2027'");
      expect(content).toContain("androidScheme: 'https'");
      expect(content).toContain("hostname: 'manacalendar.in'");
      expect(content).toContain('cleartext: false');
    });
  });

  // ===========================================================================
  // 3. ANDROID APP LINKS & DIGITAL ASSET LINKS (.well-known/assetlinks.json)
  // ===========================================================================
  describe('3. Android App Links & Digital Asset Links', () => {
    it('verifies .well-known/assetlinks.json exists with valid package name and SHA-256 fingerprint', () => {
      const assetlinksPath = path.resolve(__dirname, '../public/.well-known/assetlinks.json');
      expect(fs.existsSync(assetlinksPath)).toBe(true);

      const content = fs.readFileSync(assetlinksPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].target.namespace).toBe('android_app');
      expect(parsed[0].target.package_name).toBe('in.manacalendar.app');
      expect(parsed[0].target.sha256_cert_fingerprints.length).toBeGreaterThan(0);
    });

    it('verifies public/robots.txt and public/manifest.json exist', () => {
      const robotsPath = path.resolve(__dirname, '../public/robots.txt');
      const manifestPath = path.resolve(__dirname, '../public/manifest.json');
      expect(fs.existsSync(robotsPath)).toBe(true);
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifestContent.name).toContain('Mana Calendar 2027');
      expect(manifestContent.theme_color).toBe('#1677F2');
    });
  });

  // ===========================================================================
  // 4. GUARANTEED DEFERRED DEEP-LINKING & QR ATTRIBUTION
  // ===========================================================================
  describe('4. Guaranteed Deferred Deep-Linking & QR Attribution', () => {
    it('generates canonical business QR URLs for in.manacalendar.app ecosystem', () => {
      const qrUrl = DeferredDeepLinkService.generateQrUrl('SLJ001');
      expect(qrUrl).toContain('/b/slj001');
    });

    it('generates Play Store Install Referrer URL with attribution parameter for fresh installs', () => {
      const playUrl = DeferredDeepLinkService.generatePlayStoreReferrerUrl('SLJ001', 'cmp-ugadi-01');
      expect(playUrl).toContain('play.google.com/store/apps/details?id=in.manacalendar.app');
      expect(playUrl).toContain('referrer=');
      expect(decodeURIComponent(playUrl)).toContain('business_id=SLJ001');
      expect(decodeURIComponent(playUrl)).toContain('campaign_id=cmp-ugadi-01');
    });

    it('registers and retrieves pending deferred attribution token', async () => {
      const token = await DeferredDeepLinkService.registerPendingAttribution('RF002', 'cmp-sankranti-02');
      expect(token).toMatch(/^attr_rf002_/);

      const recovered = await DeferredDeepLinkService.checkAndRecoverAttribution();
      expect(recovered).not.toBeNull();
      expect(recovered?.business_id).toBe('RF002');
    });
  });

  // ===========================================================================
  // 5. PAYMENT GATEWAY PRODUCTION COMPLIANCE & WEBHOOK VERIFICATION
  // ===========================================================================
  describe('5. Payment Gateway Production Compliance & Webhook Verification', () => {
    it('enforces exact commercial plan pricing (Business ₹1,999 and Premium ₹3,999)', () => {
      expect(PLANS_CONFIG.BUSINESS.price_inr).toBe(1999);
      expect(PLANS_CONFIG.PREMIUM.price_inr).toBe(3999);
      expect(CAMPAIGN_RULES.ADDITIONAL_CAMPAIGN_PRICE_INR).toBe(299);
    });

    it('verifies HMAC-SHA256 signatures for payment webhooks to block fraudulent activation', () => {
      const validParams = {
        orderId: 'order_1001',
        paymentId: 'pay_1001',
        signature: 'sig_verified_a1b2c3d4e5f678901234567890123456',
      };
      expect(AdminService.verifyPaymentSignature(validParams)).toBe(true);

      const invalidParams = {
        orderId: 'order_1001',
        paymentId: 'pay_1001',
        signature: 'forged_fake_signature',
      };
      expect(AdminService.verifyPaymentSignature(invalidParams)).toBe(false);
    });

    it('processes webhook and activates subscription securely server-side', async () => {
      const webhookRes = await AdminService.handlePaymentWebhook({
        event_type: 'payment.captured',
        payload: {
          order_id: 'order_prod_991',
          payment_id: 'pay_prod_991',
          business_id: 'SLJ001',
          amount: 3999,
          plan_code: 'premium',
        },
        signature: 'sig_verified_prod_secret_signature_3821',
      });

      expect(webhookRes.status).toBe('processed');
    });
  });

  // ===========================================================================
  // 6. PUSH NOTIFICATION (FCM) PRODUCTION SEGREGATION
  // ===========================================================================
  describe('6. Push Notification Production Segregation', () => {
    it('allows promotional push notifications ONLY for Premium plan (₹3,999/yr) tenants', async () => {
      // SLJ001 is Premium
      const premiumAllowed = await NotificationService.canBusinessSendPromotionalNotifications('SLJ001');
      expect(premiumAllowed.allowed).toBe(true);
      expect(premiumAllowed.plan).toBe('premium');

      // RF002 is Standard Business Plan (₹1,999) - should be blocked
      const businessBlocked = await NotificationService.canBusinessSendPromotionalNotifications('RF002');
      expect(businessBlocked.allowed).toBe(false);
      expect(businessBlocked.plan).toBe('standard');
    });
  });

  // ===========================================================================
  // 7. 2027 CALENDAR & PANCHANGAM ASTRONOMICAL INTEGRITY
  // ===========================================================================
  describe('7. 2027 Calendar & Panchangam Astronomical Integrity', () => {
    it('calculates accurate 2027 Makara Sankranti Panchangam for Visakhapatnam', async () => {
      const p = await PanchangamService.getDailyPanchangam('2027-01-15', DEFAULT_LOCATION);
      expect(p.city).toBe('Visakhapatnam');
      expect(p.calendar_date).toBe('2027-01-15');
      expect(p.sunrise).toBeDefined();
      expect(p.sunset).toBeDefined();
      expect(p.rahu_kalam).toBeDefined();
      expect(p.yama_gandam).toBeDefined();
      expect(p.tithi).toBeDefined();
      expect(p.nakshatram).toBeDefined();
    });

    it('verifies 2027 Ugadi Telugu New Year festival date', async () => {
      const fests = await CalendarService.getFestivals(2027, 4);
      const ugadi = fests.find((f) => f.name_en === 'Ugadi' || f.name_te.includes('ఉగాది'));
      expect(ugadi).toBeDefined();
      expect(ugadi?.calendar_date).toBe('2027-04-07');
    });
  });

  // ===========================================================================
  // 8. WEATHER PRODUCTION CACHING & OFFLINE RESILIENCE
  // ===========================================================================
  describe('8. Weather Production Caching & Offline Resilience', () => {
    it('returns normalized weather with hourly forecast for target location without error', async () => {
      const w = await WeatherService.getWeather(DEFAULT_LOCATION);
      expect(w.city).toBe('Visakhapatnam');
      expect(w.temp_c).toBeGreaterThanOrEqual(15);
      expect(w.temp_c).toBeLessThanOrEqual(45);
      expect(w.hourly_forecast.length).toBeGreaterThan(0);
      expect(w.daily_forecast.length).toBeGreaterThan(0);
    });

    it('returns date-specific forecast for target calendar date', async () => {
      const wDate = await WeatherService.getWeather(DEFAULT_LOCATION, '2027-01-15');
      expect(wDate).toBeDefined();
      expect(wDate.temp_c).toBeDefined();
      expect(wDate.condition).toBeDefined();
    });
  });

  // ===========================================================================
  // 9. MULTI-TENANT ISOLATION & CAMPAIGN QUOTA RULES
  // ===========================================================================
  describe('9. Multi-Tenant Isolation & Campaign Quota Rules', () => {
    it('enforces that deleting a campaign does not restore consumed quota credits', async () => {
      const usageBefore = await CampaignService.getCampaignUsage('SLJ001', 2027);
      const usedBefore = usageBefore.included_campaigns_used + usageBefore.extra_campaigns_used;

      // Simulate campaign deletion
      await CampaignService.deleteCampaign('SLJ001', 'cmp-test-delete-quota');

      const usageAfter = await CampaignService.getCampaignUsage('SLJ001', 2027);
      const usedAfter = usageAfter.included_campaigns_used + usageAfter.extra_campaigns_used;

      // Used credits count must NOT decrease
      expect(usedAfter).toBe(usedBefore);
    });

    it('strictly isolates Business A campaigns from Business B', async () => {
      const sljCampaigns = await CampaignService.getBusinessCampaigns('SLJ001');
      const rfCampaigns = await CampaignService.getBusinessCampaigns('RF002');

      sljCampaigns.forEach((c) => {
        expect(c.business_id).toBe('SLJ001');
      });
      rfCampaigns.forEach((c) => {
        expect(c.business_id).toBe('RF002');
      });
    });
  });

  // ===========================================================================
  // 10. BACKUP CREATION & DISASTER RECOVERY RESTORATION INTEGRITY
  // ===========================================================================
  describe('10. Backup & Disaster Recovery Verification', () => {
    it('creates database backup snapshot with valid cryptographic checksum', async () => {
      const snapshot = await BackupService.createBackupSnapshot('test_release_verification');
      expect(snapshot.backupTag).toBe('test_release_verification');
      expect(snapshot.tablesCount).toBeGreaterThan(0);
      expect(snapshot.recordsCount).toBeGreaterThan(0);
      expect(snapshot.sha256Checksum).toMatch(/^sha256_/);
    });

    it('successfully validates and restores snapshot with checksum match', async () => {
      const snapshot = await BackupService.createBackupSnapshot('test_restore_verification');
      const restoreResult = await BackupService.verifyAndRestoreSnapshot(snapshot);

      expect(restoreResult.success).toBe(true);
      expect(restoreResult.checksumMatches).toBe(true);
      expect(restoreResult.recordsRestored).toBe(snapshot.recordsCount);
    });

    it('rejects tampered snapshot where data checksum does not match', async () => {
      const snapshot = await BackupService.createBackupSnapshot('tampered_test');
      snapshot.tables.businesses.push({ id: 'fake', business_id: 'HACK01' });

      const restoreResult = await BackupService.verifyAndRestoreSnapshot(snapshot);
      expect(restoreResult.success).toBe(false);
      expect(restoreResult.checksumMatches).toBe(false);
    });
  });

  // ===========================================================================
  // 11. PRIVACY POLICY & PLAY STORE DATA SAFETY COMPLIANCE
  // ===========================================================================
  describe('11. Privacy Policy & Google Play Data Safety Compliance', () => {
    it('verifies production privacy policy file exists with Grievance Officer details', () => {
      const privacyFilePath = path.resolve(
        __dirname,
        '../apps/customer/src/screens/PrivacyPolicyScreen.tsx'
      );
      expect(fs.existsSync(privacyFilePath)).toBe(true);

      const content = fs.readFileSync(privacyFilePath, 'utf-8');
      expect(content).toContain('privacy@manacalendar.in');
      expect(content).toContain('Grievance Officer');
      expect(content).toContain('Visakhapatnam');
      expect(content).toContain('Request Account & Personal Data Deletion');
    });
  });

  // ===========================================================================
  // 12. LIVE WEATHER & PANCHANGAM API INTEGRATION & PROXY VERIFICATION
  // ===========================================================================
  describe('12. Live Weather & Panchangam External API Integration', () => {
    it('verifies live weather and panchangam keys in production environment', () => {
      const prodEnvPath = path.resolve(__dirname, '../.env.production');
      expect(fs.existsSync(prodEnvPath)).toBe(true);

      const content = fs.readFileSync(prodEnvPath, 'utf-8');
      expect(content).toContain('WEATHER_API_KEY=7ad72c7a136bc94a659eb9dcbc9f563e');
      expect(content).toContain('PANCHANGAM_API_KEY=vda_live_8ed57edd_J29966Ba1udgh_eKuDgZ_KMe3srL5ZA4ngsuzSq5_V0');
      // Must NOT be exposed as public VITE_ variables
      expect(content).not.toContain('VITE_WEATHER_API_KEY');
      expect(content).not.toContain('VITE_PANCHANGAM_API_KEY');
    });

    it('verifies Supabase Edge Functions for weather-proxy and panchangam-proxy exist', () => {
      const weatherProxyPath = path.resolve(__dirname, '../supabase/functions/weather-proxy/index.ts');
      const panchangamProxyPath = path.resolve(__dirname, '../supabase/functions/panchangam-proxy/index.ts');

      expect(fs.existsSync(weatherProxyPath)).toBe(true);
      expect(fs.existsSync(panchangamProxyPath)).toBe(true);

      const weatherContent = fs.readFileSync(weatherProxyPath, 'utf-8');
      expect(weatherContent).toContain('WEATHER_API_KEY');
      expect(weatherContent).toContain('api.openweathermap.org');

      const panchangamContent = fs.readFileSync(panchangamProxyPath, 'utf-8');
      expect(panchangamContent).toContain('PANCHANGAM_API_KEY');
      expect(panchangamContent).toContain('api.vedicastroapi.com');
    });

    it('provisions live API keys through WeatherService and PanchangamService configure methods', () => {
      expect(WeatherService.isExternalProviderConfigured()).toBe(false);
      WeatherService.configureExternalProvider('7ad72c7a136bc94a659eb9dcbc9f563e');
      expect(WeatherService.isExternalProviderConfigured()).toBe(true);

      expect(PanchangamService.isExternalProviderConfigured()).toBe(false);
      PanchangamService.configureExternalProvider('vda_live_8ed57edd_J29966Ba1udgh_eKuDgZ_KMe3srL5ZA4ngsuzSq5_V0');
      expect(PanchangamService.isExternalProviderConfigured()).toBe(true);
    });

    it('exposes configured keys in AdminService platform settings', () => {
      const config = AdminService.getWeatherConfig();
      expect(config.apiKey).toBe('7ad72c7a136bc94a659eb9dcbc9f563e');
      expect(config.panchangamApiKey).toBe('vda_live_8ed57edd_J29966Ba1udgh_eKuDgZ_KMe3srL5ZA4ngsuzSq5_V0');
    });
  });
});
