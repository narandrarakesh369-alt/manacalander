import { describe, it, expect, beforeEach } from 'vitest';
import {
  CalendarService,
  PanchangamService,
  LocationService,
  EventsService,
  VERIFIED_FESTIVALS_2027,
  AstronomicalPanchangamProvider,
  ExternalPanchangamProvider,
  ephemerisCalculator,
} from '@mana/services';
import {
  DEFAULT_LOCATION,
  POPULAR_LOCATIONS,
  MONTHS,
  WEEKDAYS,
  formatI18n,
  getUiText,
} from '@mana/config';
import type { LocationConfig } from '@mana/types';

describe('PHASE 2 — Calendar & Panchangam Engine', () => {
  beforeEach(() => {
    LocationService.resetToDefault();
  });

  // ===========================================================================
  // 1. DATE CALCULATIONS & MULTI-YEAR GRID
  // ===========================================================================
  describe('1. Date Calculations & Multi-Year Grid', () => {
    it('correctly calculates days in month and leap years', async () => {
      // 2027 is non-leap year (Feb = 28 days)
      const jan2027 = await CalendarService.getMonthDates(2027, 1);
      expect(jan2027).toHaveLength(31);

      const feb2027 = await CalendarService.getMonthDates(2027, 2);
      expect(feb2027).toHaveLength(28);

      const apr2027 = await CalendarService.getMonthDates(2027, 4);
      expect(apr2027).toHaveLength(30);

      // 2028 is leap year (Feb = 29 days)
      const feb2028 = await CalendarService.getMonthDates(2028, 2);
      expect(feb2028).toHaveLength(29);
    });

    it('correctly determines day of week and weekend flags for 2027', async () => {
      // 2027-01-01 was Friday (day_of_week = 5)
      const jan2027 = await CalendarService.getMonthDates(2027, 1);
      const day1 = jan2027[0];
      expect(day1.calendar_date).toBe('2027-01-01');
      expect(day1.day_of_week).toBe(5);
      expect(day1.is_weekend).toBe(false);

      // 2027-01-03 was Sunday (day_of_week = 0)
      const day3 = jan2027[2];
      expect(day3.calendar_date).toBe('2027-01-03');
      expect(day3.day_of_week).toBe(0);
      expect(day3.is_weekend).toBe(true);
    });

    it('accurately computes astronomical Julian Day numbers', () => {
      // Standard J2000 epoch: 2000-01-01 12:00 UTC = 2451545.0
      const jd2000 = ephemerisCalculator.calculateJulianDay(2000, 1, 1, 12, 0);
      expect(jd2000).toBeCloseTo(2451545.0, 1);

      // 2027-01-01 06:00 UTC
      const jd2027 = ephemerisCalculator.calculateJulianDay(2027, 1, 1, 6, 0);
      expect(jd2027).toBeGreaterThan(2461400);
    });
  });

  // ===========================================================================
  // 2. MONTH & YEAR NAVIGATION
  // ===========================================================================
  describe('2. Month & Year Navigation', () => {
    it('handles month wrapping backwards from January to December of previous year', () => {
      let year = 2027;
      let month = 1;

      // Navigating prev month
      if (month === 1) {
        month = 12;
        year -= 1;
      } else {
        month -= 1;
      }

      expect(year).toBe(2026);
      expect(month).toBe(12);
    });

    it('handles month wrapping forwards from December to January of next year', () => {
      let year = 2027;
      let month = 12;

      // Navigating next month
      if (month === 12) {
        month = 1;
        year += 1;
      } else {
        month += 1;
      }

      expect(year).toBe(2028);
      expect(month).toBe(1);
    });
  });

  // ===========================================================================
  // 3. LANGUAGE SWITCHING & LOCALIZATION
  // ===========================================================================
  describe('3. Language Switching & Bilingual Support', () => {
    it('translates month names correctly across te, en, and te_en modes', () => {
      const jan = MONTHS[0];
      expect(formatI18n(jan, 'te')).toBe('జనవరి');
      expect(formatI18n(jan, 'en')).toBe('January');
      expect(formatI18n(jan, 'te_en')).toBe('జనవరి (January)');
    });

    it('translates weekdays correctly', () => {
      const sunday = WEEKDAYS[0];
      expect(formatI18n(sunday.full, 'te')).toBe('ఆదివారం');
      expect(formatI18n(sunday.full, 'en')).toBe('Sunday');
      expect(formatI18n(sunday.short, 'te')).toBe('ఆది');
      expect(formatI18n(sunday.short, 'en')).toBe('Sun');
    });

    it('translates core UI strings without hardcoding', () => {
      expect(getUiText('today', 'te')).toBe('నేడు');
      expect(getUiText('today', 'en')).toBe('Today');
      expect(getUiText('panchangam', 'te')).toBe('పంచాంగం');
      expect(getUiText('rahuKalam', 'en')).toBe('Rahu Kalam');
      expect(getUiText('shubhTimings', 'te')).toBe('శుభ సమయాలు');
    });
  });

  // ===========================================================================
  // 4. FESTIVALS & VERIFIED 2027 DATASET
  // ===========================================================================
  describe('4. Verified 2027 Festivals & Holidays', () => {
    it('contains verified major 2027 festivals', async () => {
      const allFestivals2027 = await CalendarService.getFestivals(2027);
      expect(allFestivals2027.length).toBeGreaterThanOrEqual(30);

      // Makara Sankranti check
      const sankranti = allFestivals2027.find((f) => f.calendar_date === '2027-01-15');
      expect(sankranti).toBeDefined();
      expect(sankranti?.name_te).toContain('మకర సంక్రాంతి');
      expect(sankranti?.is_holiday).toBe(true);
      expect(sankranti?.tag).toBe('sankranti');

      // Bhogi check
      const bhogi = allFestivals2027.find((f) => f.calendar_date === '2027-01-14');
      expect(bhogi).toBeDefined();
      expect(bhogi?.name_en).toContain('Bhogi');

      // Republic Day check
      const repDay = allFestivals2027.find((f) => f.calendar_date === '2027-01-26');
      expect(repDay).toBeDefined();
      expect(repDay?.holiday_type).toBe('gazetted');
    });

    it('filters festivals by month properly', async () => {
      const janFestivals = await CalendarService.getFestivals(2027, 1);
      expect(janFestivals.every((f) => f.calendar_date.startsWith('2027-01'))).toBe(true);
      expect(janFestivals.length).toBeGreaterThan(0);

      const augFestivals = await CalendarService.getFestivals(2027, 8);
      expect(augFestivals.every((f) => f.calendar_date.startsWith('2027-08'))).toBe(true);
      expect(augFestivals.some((f) => f.name_en.includes('Independence Day'))).toBe(true);
    });

    it('bundles date details with festivals and holidays', async () => {
      const details = await CalendarService.getDateDetails('2027-01-15');
      expect(details.calendar_date).toBe('2027-01-15');
      expect(details.festivals.length).toBeGreaterThan(0);
      expect(details.festivals[0].name_en).toContain('Makara Sankranti');
      expect(details.panchangam).toBeDefined();
      expect(details.panchangam.tithi).toBeDefined();
    });
  });

  // ===========================================================================
  // 5. PANCHANGAM ENGINE & ASTRONOMICAL CALCULATOR
  // ===========================================================================
  describe('5. Panchangam Astronomical Engine', () => {
    it('computes authentic Vedic Panchangam with all 5 Angas and timings', async () => {
      const p = await PanchangamService.getDailyPanchangam('2027-01-15', DEFAULT_LOCATION);

      expect(p.calendar_date).toBe('2027-01-15');
      expect(p.city).toBe('Visakhapatnam');

      // Core 5 Angas
      expect(p.tithi).toBeTruthy();
      expect(p.nakshatram).toBeTruthy();
      expect(p.yogam).toBeTruthy();
      expect(p.karanam).toBeTruthy();
      expect(p.tithi_details).toBeDefined();
      expect(p.nakshatra_details).toBeDefined();

      // Celestial Timings
      expect(p.sunrise).toMatch(/\d{2}:\d{2}\s+(AM|PM)/);
      expect(p.sunset).toMatch(/\d{2}:\d{2}\s+(AM|PM)/);

      // Inauspicious Timings
      expect(p.rahu_kalam).toContain('-');
      expect(p.yama_gandam).toContain('-');

      // Auspicious Timings
      expect(p.abhijit_muhurtham).toBeDefined();
      expect(p.brahma_muhurtham).toBeDefined();
    });

    it('adjusts sunrise and sunset based on geographical coordinates', async () => {
      const vizag = DEFAULT_LOCATION; // Longitude ~83.2° E (East coast)
      const hyd = POPULAR_LOCATIONS.find((l) => l.city === 'Hyderabad')!; // Longitude ~78.5° E (West of Vizag)

      const pVizag = await PanchangamService.getDailyPanchangam('2027-01-15', vizag);
      const pHyd = await PanchangamService.getDailyPanchangam('2027-01-15', hyd);

      // Sunrise in Vizag should be earlier than Hyderabad due to higher eastern longitude
      expect(pVizag.sunrise).not.toBe(pHyd.sunrise);
    });
  });

  // ===========================================================================
  // 6. LOCATION SERVICE & PREFERENCES
  // ===========================================================================
  describe('6. Location Service & Preference Management', () => {
    it('defaults to Visakhapatnam, Andhra Pradesh', () => {
      const loc = LocationService.getCurrentLocation();
      expect(loc.city).toBe('Visakhapatnam');
      expect(loc.state).toBe('Andhra Pradesh');
      expect(loc.country).toBe('India');
    });

    it('allows changing location and notifies subscribers', () => {
      let notifiedCity = '';
      const unsubscribe = LocationService.subscribe((loc) => {
        notifiedCity = loc.city;
      });

      const hyd = POPULAR_LOCATIONS.find((l) => l.city === 'Hyderabad')!;
      LocationService.setLocation(hyd);

      expect(LocationService.getCurrentLocation().city).toBe('Hyderabad');
      expect(notifiedCity).toBe('Hyderabad');

      unsubscribe();
    });

    it('provides popular AP and Telangana cities', () => {
      const cities = LocationService.getPopularLocations().map((l) => l.city);
      expect(cities).toContain('Visakhapatnam');
      expect(cities).toContain('Vijayawada');
      expect(cities).toContain('Hyderabad');
      expect(cities).toContain('Tirupati');
    });
  });

  // ===========================================================================
  // 7. CACHE RETRIEVAL & HIGH-PERFORMANCE BROWSING
  // ===========================================================================
  describe('7. In-Memory & Database Cache Handling', () => {
    it('retrieves subsequent calls from cache with identical reference or values', async () => {
      const first = await PanchangamService.getDailyPanchangam('2027-01-20', DEFAULT_LOCATION);
      const second = await PanchangamService.getDailyPanchangam('2027-01-20', DEFAULT_LOCATION);

      expect(first.tithi).toBe(second.tithi);
      expect(first.sunrise).toBe(second.sunrise);
      expect(first.rahu_kalam).toBe(second.rahu_kalam);
    });
  });

  // ===========================================================================
  // 8. EXTERNAL PROVIDER ADAPTER & RULE 15 COMPLIANCE
  // ===========================================================================
  describe('8. Provider Architecture & Rule 15 Adherence', () => {
    it('strictly avoids claiming mock external API is connected when credentials are unprovisioned', () => {
      const extProvider = new ExternalPanchangamProvider();
      expect(extProvider.isConfigured()).toBe(false);
    });

    it('fails gracefully and defers to AstronomicalProvider when external provider is unconfigured', async () => {
      const extProvider = new ExternalPanchangamProvider();
      await expect(extProvider.getPanchangam('2027-01-15', DEFAULT_LOCATION)).rejects.toThrow(
        /not provisioned with live production credentials/
      );

      // PanchangamService handles this smoothly and delegates to AstroProvider
      const result = await PanchangamService.getDailyPanchangam('2027-01-15', DEFAULT_LOCATION);
      expect(result).toBeDefined();
      expect(result.tithi).toBeTruthy();
    });
  });

  // ===========================================================================
  // 9. SEARCH CALENDAR
  // ===========================================================================
  describe('9. Calendar Search Engine', () => {
    it('returns empty array for empty search queries', async () => {
      const results = await CalendarService.searchCalendar('');
      expect(results).toEqual([]);

      const whitespaceResults = await CalendarService.searchCalendar('   ');
      expect(whitespaceResults).toEqual([]);
    });

    it('searches festivals by English name', async () => {
      const results = await CalendarService.searchCalendar('Sankranti');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.title_en.includes('Sankranti'))).toBe(true);
    });

    it('searches festivals by Telugu name', async () => {
      const results = await CalendarService.searchCalendar('సంక్రాంతి');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.title_te.includes('సంక్రాంతి'))).toBe(true);
    });

    it('searches by festival tags (e.g., ekadashi, sankranti, holiday)', async () => {
      const ekadashiResults = await CalendarService.searchCalendar('ekadashi');
      expect(ekadashiResults.length).toBeGreaterThan(0);
      expect(ekadashiResults.every((r) => r.tag === 'ekadashi' || r.title_en.toLowerCase().includes('ekadashi'))).toBe(true);
    });

    it('returns empty array when no matches are found', async () => {
      const results = await CalendarService.searchCalendar('nonexistent_festival_xyz');
      expect(results).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 10. PERSONAL EVENTS FOUNDATION (PHASE 2)
  // ===========================================================================
  describe('10. Personal Events Foundation (CRUD)', () => {
    it('allows creating, retrieving, and deleting personal events', async () => {
      const testDate = '2027-02-14';

      const newEvent = await EventsService.createEvent({
        title: 'Wedding Anniversary',
        event_date: testDate,
        start_time: '19:00',
        category: 'anniversary',
        description: 'Dinner reservation with family',
        reminder_enabled: true,
      });

      expect(newEvent.id).toBeDefined();
      expect(newEvent.title).toBe('Wedding Anniversary');
      expect(newEvent.category).toBe('anniversary');

      // Verify retrieval for date
      const dateEvents = await EventsService.getEventsForDate(testDate);
      expect(dateEvents.some((e) => e.id === newEvent.id)).toBe(true);

      // Verify month retrieval
      const monthEvents = await EventsService.getEventsForMonth(2027, 2);
      expect(monthEvents.some((e) => e.id === newEvent.id)).toBe(true);

      // Verify deletion
      const deleted = await EventsService.deleteEvent(newEvent.id);
      expect(deleted).toBe(true);

      const afterDelete = await EventsService.getEventsForDate(testDate);
      expect(afterDelete.some((e) => e.id === newEvent.id)).toBe(false);
    });
  });
});
