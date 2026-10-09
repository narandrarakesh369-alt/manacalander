/**
 * MANA CALENDAR 2027 — PERSONAL EVENTS SERVICE (PHASE 2 FOUNDATION)
 * Foundation for customer personal events (Birthdays, Anniversaries, Appointments, Custom Events, Reminders).
 * Push notifications deferred to Phase 3.
 */

import { supabase, isSupabaseConfigured } from './supabase.client';
import type { UserEvent, EventCategory } from '@mana/types';
import { logger } from '@mana/utils';

// In-memory store fallback for offline / mock sessions
const localEventsStore: Map<string, UserEvent> = new Map();

export class EventsService {
  /**
   * Retrieves user events for a specific calendar date (YYYY-MM-DD)
   */
  static async getEventsForDate(date: string, customerId?: string): Promise<UserEvent[]> {
    if (!isSupabaseConfigured()) {
      return this.getLocalEventsForDate(date, customerId);
    }

    try {
      let query = supabase.from('user_events').select('*').eq('event_date', date);
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query.order('start_time', { ascending: true });

      if (error) {
        logger.debug('Database events lookup failed, using local fallback', error);
        return this.getLocalEventsForDate(date, customerId);
      }

      const dbEvents = (data || []) as UserEvent[];
      // Merge with any local offline events
      const localMatches = this.getLocalEventsForDate(date, customerId);
      const combined = [...dbEvents];
      for (const loc of localMatches) {
        if (!combined.some((e) => e.id === loc.id)) {
          combined.push(loc);
        }
      }
      return combined;
    } catch {
      return this.getLocalEventsForDate(date, customerId);
    }
  }

  /**
   * Retrieves all user events within a specific year and month
   */
  static async getEventsForMonth(
    year: number,
    month: number,
    customerId?: string
  ): Promise<UserEvent[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    if (!isSupabaseConfigured()) {
      return Array.from(localEventsStore.values()).filter((e) => {
        const matchesDate = e.event_date >= startDate && e.event_date <= endDate;
        const matchesCust = !customerId || e.customer_id === customerId;
        return matchesDate && matchesCust;
      });
    }

    try {
      let query = supabase
        .from('user_events')
        .select('*')
        .gte('event_date', startDate)
        .lte('event_date', endDate);

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      const dbEvents = (data || []) as UserEvent[];

      // Merge local events
      const localMatches = Array.from(localEventsStore.values()).filter((e) => {
        const matchesDate = e.event_date >= startDate && e.event_date <= endDate;
        const matchesCust = !customerId || e.customer_id === customerId;
        return matchesDate && matchesCust;
      });

      const combined = [...dbEvents];
      for (const loc of localMatches) {
        if (!combined.some((e) => e.id === loc.id)) {
          combined.push(loc);
        }
      }
      return combined;
    } catch {
      return Array.from(localEventsStore.values()).filter((e) => {
        const matchesDate = e.event_date >= startDate && e.event_date <= endDate;
        const matchesCust = !customerId || e.customer_id === customerId;
        return matchesDate && matchesCust;
      });
    }
  }

  /**
   * Creates a new personal event
   */
  static async createEvent(
    params: {
      customerId?: string;
      title: string;
      event_date: string; // 'YYYY-MM-DD'
      start_time?: string | null;
      end_time?: string | null;
      category?: EventCategory;
      description?: string | null;
      reminder_enabled?: boolean;
      remind_at?: string | null;
    }
  ): Promise<UserEvent> {
    const newId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const nowIso = new Date().toISOString();

    const eventRecord: UserEvent = {
      id: newId,
      customer_id: params.customerId || 'default-customer',
      title: params.title.trim(),
      event_date: params.event_date,
      start_time: params.start_time || null,
      end_time: params.end_time || null,
      category: params.category || 'custom',
      description: params.description ? params.description.trim() : null,
      reminder_enabled: !!params.reminder_enabled,
      remind_at: params.remind_at || null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Store in local memory store
    localEventsStore.set(newId, eventRecord);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_events')
          .insert({
            customer_id: eventRecord.customer_id,
            title: eventRecord.title,
            event_date: eventRecord.event_date,
            start_time: eventRecord.start_time,
            end_time: eventRecord.end_time,
            category: eventRecord.category,
            description: eventRecord.description,
            reminder_enabled: eventRecord.reminder_enabled,
            remind_at: eventRecord.remind_at,
          })
          .select()
          .single();

        if (!error && data) {
          const saved = data as UserEvent;
          localEventsStore.set(saved.id, saved);
          return saved;
        }
      } catch (err) {
        logger.debug('Database event insertion bypassed, using local memory record', err);
      }
    }

    return eventRecord;
  }

  /**
   * Deletes a personal event by ID
   */
  static async deleteEvent(id: string): Promise<boolean> {
    localEventsStore.delete(id);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('user_events').delete().eq('id', id);
        if (error) {
          logger.debug('Database delete failed or offline', error);
        }
        return true;
      } catch {
        return true;
      }
    }

    return true;
  }

  /**
   * Filter local memory events
   */
  private static getLocalEventsForDate(date: string, customerId?: string): UserEvent[] {
    return Array.from(localEventsStore.values()).filter((e) => {
      const matchesDate = e.event_date === date;
      const matchesCust = !customerId || e.customer_id === customerId;
      return matchesDate && matchesCust;
    });
  }
}
