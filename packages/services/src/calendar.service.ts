/**
 * MANA CALENDAR 2027 — CALENDAR SERVICE
 * Core engine for multi-year monthly dates, festival lookup, date details, and search.
 */

import { supabase, isSupabaseConfigured } from './supabase.client';
import type {
  CalendarDate,
  Festival,
  UserEvent,
  LocationConfig,
  CalendarSearchResult,
  Panchangam,
} from '@mana/types';
import { DEFAULT_LOCATION } from '@mana/config';
import { VERIFIED_FESTIVALS_2027 } from './festivals.data';
import { PanchangamService } from './panchangam.service';
import { EventsService } from './events.service';
import { ephemerisCalculator } from './engine/ephemeris.calculator';
import { logger } from '@mana/utils';

export interface DateDetailsBundle {
  calendar_date: string;
  year: number;
  month: number;
  day: number;
  day_of_week: number;
  location: LocationConfig;
  panchangam: Panchangam;
  festivals: Festival[];
  userEvents: UserEvent[];
}

export class CalendarService {
  /**
   * Generates calendar dates for a given month and year.
   * Includes festival flags, holiday flags, personal event markers, and tithi tags.
   */
  static async getMonthDates(
    year: number,
    month: number,
    location: LocationConfig = DEFAULT_LOCATION,
    customerId?: string
  ): Promise<CalendarDate[]> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: CalendarDate[] = [];

    // Retrieve festivals and user events for the month
    const [monthFestivals, monthEvents] = await Promise.all([
      this.getFestivals(year, month),
      EventsService.getEventsForMonth(year, month, customerId),
    ]);

    // Build festival & event lookup maps by date string
    const festivalMap = new Map<string, Festival[]>();
    for (const f of monthFestivals) {
      const arr = festivalMap.get(f.calendar_date) || [];
      arr.push(f);
      festivalMap.set(f.calendar_date, arr);
    }

    const eventMap = new Map<string, UserEvent[]>();
    for (const e of monthEvents) {
      const arr = eventMap.get(e.event_date) || [];
      arr.push(e);
      eventMap.set(e.event_date, arr);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const d = new Date(year, month - 1, day);
      const dayOfWeek = d.getDay(); // 0 is Sunday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayFestivals = festivalMap.get(dateStr) || [];
      const dayEvents = eventMap.get(dateStr) || [];

      // Calculate quick tithi name from ephemeris without full Panchangam overhead
      let tithiEn = '';
      let tithiTe = '';
      try {
        const jd = ephemerisCalculator.calculateJulianDay(year, month, day, 6, 0);
        const { tithi } = ephemerisCalculator.calculateTithi(jd);
        tithiEn = tithi.name_en;
        tithiTe = tithi.name_te;
      } catch {
        // Safe fallback
      }

      const hasHoliday = dayFestivals.some((f) => f.is_holiday);
      const hasMajor = dayFestivals.some((f) => f.importance === 'major');

      dates.push({
        id: `date-${dateStr}`,
        calendar_date: dateStr,
        year,
        month,
        day,
        day_of_week: dayOfWeek,
        is_weekend: isWeekend,
        is_today: dateStr === todayStr,
        tithi_short_en: tithiEn,
        tithi_short_te: tithiTe,
        festivals: dayFestivals,
        has_holiday: hasHoliday,
        has_festival: dayFestivals.length > 0,
        has_event: dayEvents.length > 0,
        is_important: hasMajor,
        metadata: null,
        created_at: new Date().toISOString(),
      });
    }

    return dates;
  }

  /**
   * Bundles full details for a single selected date:
   * Panchangam, festivals, and personal events.
   */
  static async getDateDetails(
    date: string,
    location: LocationConfig = DEFAULT_LOCATION,
    customerId?: string
  ): Promise<DateDetailsBundle> {
    const [yearStr, monthStr, dayStr] = date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const [panchangam, festivals, userEvents] = await Promise.all([
      PanchangamService.getDailyPanchangam(date, location),
      this.getFestivalsForDate(date),
      EventsService.getEventsForDate(date, customerId),
    ]);

    return {
      calendar_date: date,
      year,
      month,
      day,
      day_of_week: dayOfWeek,
      location,
      panchangam,
      festivals,
      userEvents,
    };
  }

  /**
   * Fetches festivals for a given year and optional month.
   * Checks Supabase database first; falls back cleanly to VERIFIED_FESTIVALS_2027.
   */
  static async getFestivals(year: number, month?: number): Promise<Festival[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('festivals').select('*');

        if (month !== undefined) {
          const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
          const daysInMonth = new Date(year, month, 0).getDate();
          const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
          query = query.gte('calendar_date', startDate).lte('calendar_date', endDate);
        } else {
          query = query.gte('calendar_date', `${year}-01-01`).lte('calendar_date', `${year}-12-31`);
        }

        const { data, error } = await query.order('calendar_date', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as Festival[];
        }
      } catch (err) {
        logger.debug('Database festival lookup bypassed, falling back to verified dataset', err);
      }
    }

    // Fallback to verified dataset
    return VERIFIED_FESTIVALS_2027.filter((f) => {
      const [fYear, fMonth] = f.calendar_date.split('-').map(Number);
      if (fYear !== year) return false;
      if (month !== undefined && fMonth !== month) return false;
      return true;
    });
  }

  /**
   * Fetches festivals for a specific single date
   */
  static async getFestivalsForDate(date: string): Promise<Festival[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('festivals')
          .select('*')
          .eq('calendar_date', date);

        if (!error && data && data.length > 0) {
          return data as Festival[];
        }
      } catch {
        // Fallback
      }
    }

    return VERIFIED_FESTIVALS_2027.filter((f) => f.calendar_date === date);
  }

  /**
   * Calendar search engine
   * Supports searching by:
   * - Festival name (English or Telugu)
   * - Tag (sankranti, ekadashi, purnima, amavasya, holiday)
   * - Date numbers (e.g. "14", "2027-01-14", "Jan 14")
   */
  static async searchCalendar(query: string, year: number = 2027): Promise<CalendarSearchResult[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const results: CalendarSearchResult[] = [];
    const allFestivals = await this.getFestivals(year);

    for (const f of allFestivals) {
      const matchNameEn = f.name_en.toLowerCase().includes(trimmed);
      const matchNameTe = f.name_te.toLowerCase().includes(trimmed);
      const matchTag = f.tag ? f.tag.toLowerCase().includes(trimmed) : false;
      const matchDate = f.calendar_date.includes(trimmed);
      const matchDesc =
        (f.description_en && f.description_en.toLowerCase().includes(trimmed)) ||
        (f.description_te && f.description_te.toLowerCase().includes(trimmed));

      if (matchNameEn || matchNameTe || matchTag || matchDate || matchDesc) {
        const [y, m, d] = f.calendar_date.split('-').map(Number);
        const dayOfWeek = new Date(y, m - 1, d).getDay();

        results.push({
          calendar_date: f.calendar_date,
          day: d,
          month: m,
          year: y,
          day_of_week: dayOfWeek,
          title_en: f.name_en,
          title_te: f.name_te,
          type: f.is_holiday ? 'holiday' : 'festival',
          subtitle_en: f.description_en || undefined,
          subtitle_te: f.description_te || undefined,
          tag: f.tag,
        });
      }
    }

    // Sort search results chronologically
    return results.sort((a, b) => a.calendar_date.localeCompare(b.calendar_date));
  }
}
