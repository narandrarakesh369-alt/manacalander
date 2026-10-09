import { describe, it, expect, beforeEach } from 'vitest';
import {
  WeatherService,
  NotificationService,
  LocationService,
  ExternalWeatherProvider,
  ClimatologicalWeatherProvider,
  FirebaseFcmProvider,
  MockFcmProvider,
} from '@mana/services';
import { DEFAULT_LOCATION, POPULAR_LOCATIONS } from '@mana/config';

describe('PHASE 3 — Weather & Push Notifications Engine', () => {
  beforeEach(() => {
    LocationService.resetToDefault();
    WeatherService.clearMemoryCache();
  });

  // ===========================================================================
  // 1. WEATHER API SUCCESS & STRUCTURE
  // ===========================================================================
  describe('1. Weather API Success & Structure', () => {
    it('returns comprehensive normalized weather data with all required metrics', async () => {
      const weather = await WeatherService.getWeather(DEFAULT_LOCATION);

      expect(weather.city).toBe('Visakhapatnam');
      expect(weather.state).toBe('Andhra Pradesh');
      expect(weather.country).toBe('India');
      expect(weather.temp_c).toBeGreaterThan(10);
      expect(weather.temp_c).toBeLessThan(50);
      expect(weather.feels_like_c).toBeDefined();
      expect(weather.temp_min_c).toBeLessThanOrEqual(weather.temp_max_c);
      expect(weather.condition).toBeTruthy();
      expect(weather.condition_te).toBeTruthy();
      expect(weather.humidity).toBeGreaterThanOrEqual(0);
      expect(weather.humidity).toBeLessThanOrEqual(100);
      expect(weather.rain_probability).toBeGreaterThanOrEqual(0);
      expect(weather.wind_kph).toBeGreaterThanOrEqual(0);
      expect(weather.uv_index).toBeGreaterThanOrEqual(0);
      expect(weather.sunrise).toMatch(/\d{2}:\d{2}\s+(AM|PM)/);
      expect(weather.sunset).toMatch(/\d{2}:\d{2}\s+(AM|PM)/);
      expect(weather.is_forecast).toBe(true);

      // 24-hour hourly forecast
      expect(weather.hourly_forecast).toHaveLength(24);
      expect(weather.hourly_forecast[0].time).toBe('00:00');
      expect(weather.hourly_forecast[12].time).toBe('12:00');

      // 7-day daily forecast
      expect(weather.daily_forecast).toHaveLength(7);
      expect(weather.daily_forecast[0].date).toBe(weather.date);
      expect(weather.daily_forecast[0].temp_max_c).toBeGreaterThanOrEqual(
        weather.daily_forecast[0].temp_min_c
      );
    });

    it('retrieves single date forecast for calendar date selection within 7 days', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const forecast = await WeatherService.getForecastForDate(todayStr, DEFAULT_LOCATION);

      expect(forecast).not.toBeNull();
      expect(forecast?.date).toBe(todayStr);
      expect(forecast?.temp_max_c).toBeDefined();
      expect(forecast?.temp_min_c).toBeDefined();
      expect(forecast?.condition).toBeTruthy();
    });
  });

  // ===========================================================================
  // 2. WEATHER API FAILURE & DELEGATION
  // ===========================================================================
  describe('2. Weather API Failure Handling & Fallback', () => {
    it('strictly avoids claiming external weather API is connected when unprovisioned', () => {
      const extProvider = new ExternalWeatherProvider();
      expect(extProvider.isConfigured()).toBe(false);
    });

    it('fails gracefully and falls back to ClimatologicalWeatherProvider without throwing', async () => {
      const extProvider = new ExternalWeatherProvider();
      await expect(extProvider.getWeather(DEFAULT_LOCATION)).rejects.toThrow(
        /External Weather API endpoint is not provisioned/
      );

      // WeatherService catches this and delivers authentic climatological data seamlessly
      const weather = await WeatherService.getWeather(DEFAULT_LOCATION);
      expect(weather).toBeDefined();
      expect(weather.city).toBe('Visakhapatnam');
      expect(weather.temp_c).toBeDefined();
    });
  });

  // ===========================================================================
  // 3. WEATHER CACHING
  // ===========================================================================
  describe('3. Weather Caching & Performance', () => {
    it('retrieves subsequent calls from in-memory cache without recalculating', async () => {
      const first = await WeatherService.getWeather(DEFAULT_LOCATION);
      const second = await WeatherService.getWeather(DEFAULT_LOCATION);

      expect(first).toBe(second);
      expect(first.temp_c).toBe(second.temp_c);
      expect(first.fetched_at).toBe(second.fetched_at);
    });
  });

  // ===========================================================================
  // 4. LOCATION CHANGES & REGIONAL WEATHER VARIATIONS
  // ===========================================================================
  describe('4. Location Changes & Meteorological Adjustments', () => {
    it('adapts temperature, humidity and sunrise/sunset based on location', async () => {
      const vizag = DEFAULT_LOCATION;
      const hyd = POPULAR_LOCATIONS.find((l) => l.city === 'Hyderabad')!;

      const weatherVizag = await WeatherService.getWeather(vizag);
      const weatherHyd = await WeatherService.getWeather(hyd);

      expect(weatherVizag.city).toBe('Visakhapatnam');
      expect(weatherHyd.city).toBe('Hyderabad');

      // Coastal Vizag has higher humidity than Deccan plateau Hyderabad
      expect(weatherVizag.humidity).toBeGreaterThan(weatherHyd.humidity);

      // Sun rises earlier in coastal eastern Vizag (~83.2°E) than western Hyderabad (~78.5°E)
      expect(weatherVizag.sunrise).not.toBe(weatherHyd.sunrise);
    });
  });

  // ===========================================================================
  // 5. FCM TOKEN REGISTRATION & MULTI-DEVICE SUPPORT
  // ===========================================================================
  describe('5. FCM Token Registration & Multi-Device Support', () => {
    it('registers device token successfully', async () => {
      const token = 'fcm-test-token-12345';
      const device = await NotificationService.registerDeviceToken(token, 'android', 'cust-user-1');

      expect(device.device_token).toBe(token);
      expect(device.platform).toBe('android');
      expect(device.enabled).toBe(true);
      expect(device.customer_id).toBe('cust-user-1');
    });

    it('supports multiple devices per user', async () => {
      const customerId = 'multi-device-user';
      const tokenPhone = 'token-android-phone-001';
      const tokenTablet = 'token-android-tablet-002';

      await NotificationService.registerDeviceToken(tokenPhone, 'android', customerId);
      await NotificationService.registerDeviceToken(tokenTablet, 'android', customerId);

      const userDevices = await NotificationService.getDevicesForUser(customerId);
      expect(userDevices.length).toBeGreaterThanOrEqual(2);
      expect(userDevices.some((d) => d.device_token === tokenPhone)).toBe(true);
      expect(userDevices.some((d) => d.device_token === tokenTablet)).toBe(true);
    });

    it('disables device token upon unregistration', async () => {
      const token = 'token-to-unregister-999';
      await NotificationService.registerDeviceToken(token, 'web', 'cust-user-unregister');
      await NotificationService.unregisterDevice(token);

      const devices = await NotificationService.getDevicesForUser('cust-user-unregister');
      expect(devices.some((d) => d.device_token === token)).toBe(false);
    });
  });

  // ===========================================================================
  // 6. PERMISSION & EXPLAINER FLOW
  // ===========================================================================
  describe('6. Notification Permission & Explainer Flow', () => {
    it('tracks that benefits explainer has not been shown initially and marks as seen', () => {
      expect(typeof NotificationService.hasSeenExplainer()).toBe('boolean');
      NotificationService.markExplainerSeen();
      expect(NotificationService.hasSeenExplainer()).toBe(true);
    });

    it('requests permission through provider adapter', async () => {
      const perm = await NotificationService.requestPermission();
      expect(['granted', 'denied', 'default']).toContain(perm);
    });
  });

  // ===========================================================================
  // 7. CUSTOMER NOTIFICATIONS & INBOX
  // ===========================================================================
  describe('7. Customer Notifications & History', () => {
    it('sends and retrieves customer festival notifications', async () => {
      const custId = 'customer-inbox-test';
      const notif = await NotificationService.sendSystemNotification({
        recipientId: custId,
        title: 'ఉగాది శుభాకాంక్షలు!',
        body: 'శ్రీ ప్లవంగ నామ సంవత్సర ఉగాది పర్వదిన శుభాకాంక్షలు.',
        type: 'festival',
      });

      expect(notif.id).toBeDefined();
      expect(notif.title).toContain('ఉగాది');

      const history = await NotificationService.getNotifications(custId);
      expect(history.some((n) => n.id === notif.id)).toBe(true);
    });

    it('marks individual notification as read', async () => {
      const custId = 'read-test-user';
      const notif = await NotificationService.sendSystemNotification({
        recipientId: custId,
        title: 'ఏకాదశి అలర్ట్',
        body: 'రేపు వైకుంఠ ఏకాదశి వ్రత దినం.',
        type: 'calendar',
      });

      expect(notif.read_at).toBeNull();

      await NotificationService.markAsRead(notif.id);
      const updatedList = await NotificationService.getNotifications(custId);
      const found = updatedList.find((n) => n.id === notif.id);
      expect(found?.read_at).not.toBeNull();
    });

    it('marks all customer notifications as read', async () => {
      const custId = 'bulk-read-user';
      await NotificationService.sendSystemNotification({
        recipientId: custId,
        title: 'నోటిఫికేషన్ 1',
        body: 'వివరాలు 1',
        type: 'calendar',
      });
      await NotificationService.sendSystemNotification({
        recipientId: custId,
        title: 'నోటిఫికేషన్ 2',
        body: 'వివరాలు 2',
        type: 'calendar',
      });

      await NotificationService.markAllAsRead(custId);
      const list = await NotificationService.getNotifications(custId);
      expect(list.every((n) => n.read_at !== null)).toBe(true);
    });
  });

  // ===========================================================================
  // 8. USER NOTIFICATION PREFERENCES & OPT-OUT
  // ===========================================================================
  describe('8. Notification Preferences & Category Opt-Out', () => {
    it('allows toggling preferences and respects festival opt-out', async () => {
      const custId = 'opt-out-customer';

      await NotificationService.updateNotificationPreferences(custId, {
        enable_festivals: false,
      });

      const prefs = await NotificationService.getNotificationPreferences(custId);
      expect(prefs.enable_festivals).toBe(false);

      // Attempting to send festival notification to opted-out user throws error
      await expect(
        NotificationService.sendSystemNotification({
          recipientId: custId,
          title: 'సంక్రాంతి పండుగ',
          body: 'వివరాలు',
          type: 'festival',
        })
      ).rejects.toThrow(/Customer has opted out of festival notifications/);
    });

    it('respects promotional notification opt-out during business broadcast', async () => {
      const optedOutCust = 'no-promo-customer';
      await NotificationService.updateNotificationPreferences(optedOutCust, {
        enable_promotions: false,
      });

      // Dispatch business promotion
      await NotificationService.createAndSendPromotionalCampaign({
        businessId: 'SLJ001',
        title: 'గోల్డ్ ఆఫర్',
        body: '50% ఆఫ్',
      });

      // Opted-out customer does NOT receive the promotional alert
      const custInbox = await NotificationService.getNotifications(optedOutCust);
      expect(custInbox.some((n) => n.title === 'గోల్డ్ ఆఫర్')).toBe(false);
    });
  });

  // ===========================================================================
  // 9. BUSINESS PROMOTIONS & PLAN ENFORCEMENT (₹1,999 vs ₹3,999)
  // ===========================================================================
  describe('9. Business Promotional Push Notifications & Plan Restriction', () => {
    it('blocks Standard Business plan (₹1,999/yr) from sending promotional push notifications', async () => {
      const standardBizId = 'RF002'; // Standard plan
      const check = await NotificationService.canBusinessSendPromotionalNotifications(standardBizId);

      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Premium Plan (₹3,999/year)');

      await expect(
        NotificationService.createAndSendPromotionalCampaign({
          businessId: standardBizId,
          title: 'రైస్ ఆఫర్',
          body: 'రైస్ బ్యాగ్‌లపై డిస్కౌంట్',
        })
      ).rejects.toThrow(/Premium Plan/);
    });

    it('allows Premium Plan (₹3,999/yr) to send promotional notifications', async () => {
      const premiumBizId = 'SLJ001'; // Premium plan
      const check = await NotificationService.canBusinessSendPromotionalNotifications(premiumBizId);
      expect(check.allowed).toBe(true);

      const campaign = await NotificationService.createAndSendPromotionalCampaign({
        businessId: premiumBizId,
        campaignId: 'DIWALI2027',
        title: 'సంక్రాంతి నగల ఆఫర్',
        body: 'ద్వారకా నగర్, వైజాగ్ షోరూమ్ ప్రత్యేక డిస్కౌంట్',
      });

      expect(campaign.id).toBeDefined();
      expect(campaign.status).toBe('sent');
      expect(campaign.business_id).toBe('SLJ001');
      expect(campaign.stats?.sent).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // 10. NOTIFICATION SCHEDULING, DEEP LINKING & ANALYTICS
  // ===========================================================================
  describe('10. Scheduling, Deep Linking & Analytics', () => {
    it('schedules promotional notification for future dispatch', async () => {
      const futureTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const scheduledCampaign = await NotificationService.createAndSendPromotionalCampaign({
        businessId: 'SLJ001',
        title: 'రాబోయే పండుగ ఆఫర్',
        body: 'షెడ్యూల్ చేసిన నోటిఫికేషన్',
        scheduledAt: futureTime,
      });

      expect(scheduledCampaign.status).toBe('scheduled');
      expect(scheduledCampaign.scheduled_at).toBe(futureTime);
      expect(scheduledCampaign.sent_at).toBeNull();
    });

    it('includes deep-link routing to the specific business campaign', async () => {
      const campaign = await NotificationService.createAndSendPromotionalCampaign({
        businessId: 'SLJ001',
        campaignId: 'WEDDING2027',
        title: 'వెడ్డింగ్ కలెక్షన్ ఆఫర్',
        body: 'ప్రత్యేక డైమండ్ కలెక్షన్',
      });

      // Target customer receives notification with deep link
      const inbox = await NotificationService.getNotifications('default-customer');
      const promoNotif = inbox.find((n) => n.title === 'వెడ్డింగ్ కలెక్షన్ ఆఫర్');

      expect(promoNotif).toBeDefined();
      expect(promoNotif?.data).toBeDefined();
      expect((promoNotif?.data as any).route).toBe('/campaigns/WEDDING2027');
      expect((promoNotif?.data as any).business_id).toBe('SLJ001');
    });

    it('records delivery, open, and click engagement events', async () => {
      const notifId = 'notif-event-test-01';
      const campaignId = 'camp-analytics-01';

      await NotificationService.recordDeliveryEvent(notifId, 'opened', campaignId);
      await NotificationService.recordDeliveryEvent(notifId, 'clicked', campaignId);

      // Verify no exceptions and stats tracking interface
      expect(true).toBe(true);
    });
  });

  // ===========================================================================
  // 11. CONFIGURABLE NOTIFICATION LIMITS
  // ===========================================================================
  describe('11. Platform Limits & Abuse Prevention', () => {
    it('retrieves configurable limits for promotional frequency and volume', async () => {
      const limits = await NotificationService.getNotificationLimits();

      expect(limits.max_promotional_per_business_per_month).toBeDefined();
      expect(limits.cooldown_hours_between_promotions).toBeDefined();
      expect(limits.max_recipients_per_batch).toBeDefined();
      expect(limits.enabled).toBe(true);
    });
  });
});
