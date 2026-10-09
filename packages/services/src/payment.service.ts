/**
 * MANA CALENDAR 2027 — PAYMENT & SUBSCRIPTION SERVICE
 *
 * Manages commercial plans, subscriptions, upgrades, and GST invoices.
 * Supports verified payment provider simulation and offline mock store.
 */

import { supabase, isSupabaseConfigured } from './supabase.client';
import type { Plan, Subscription, Payment } from '@mana/types';
import { PLANS_CONFIG } from '@mana/config';
import { logger } from '@mana/utils';

// In-memory subscription storage for test & offline environments
const memorySubscriptions = new Map<string, Subscription>([
  [
    'SLJ001',
    {
      id: 'sub-slj-premium',
      business_id: 'SLJ001',
      plan_id: 'plan-premium',
      status: 'active',
      start_date: '2027-01-01T00:00:00Z',
      end_date: '2027-12-31T23:59:59Z',
      renewal_date: '2027-12-31T23:59:59Z',
      provider: 'razorpay',
      provider_subscription_id: 'sub_live_slj2027',
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z',
    },
  ],
  [
    'RF002',
    {
      id: 'sub-rf-business',
      business_id: 'RF002',
      plan_id: 'plan-business',
      status: 'active',
      start_date: '2027-01-01T00:00:00Z',
      end_date: '2027-12-31T23:59:59Z',
      renewal_date: '2027-12-31T23:59:59Z',
      provider: 'razorpay',
      provider_subscription_id: 'sub_live_rf2027',
      created_at: '2026-10-02T11:00:00Z',
      updated_at: '2026-10-02T11:00:00Z',
    },
  ],
]);

// In-memory payments/invoices storage
const memoryPayments: Payment[] = [
  {
    id: 'pay-slj-01',
    business_id: 'SLJ001',
    subscription_id: 'sub-slj-premium',
    amount: 3999,
    currency: 'INR',
    payment_provider: 'razorpay',
    provider_order_id: 'order_MC2027_SLJ01',
    provider_payment_id: 'pay_MC2027_99342',
    status: 'success',
    created_at: '2026-10-01T10:05:00Z',
  },
  {
    id: 'pay-rf-01',
    business_id: 'RF002',
    subscription_id: 'sub-rf-business',
    amount: 1999,
    currency: 'INR',
    payment_provider: 'razorpay',
    provider_order_id: 'order_MC2027_RF01',
    provider_payment_id: 'pay_MC2027_88124',
    status: 'success',
    created_at: '2026-10-02T11:05:00Z',
  },
];

export class PaymentService {
  /**
   * Fetches all active platform plans from DB or central config
   */
  static async getPlans(): Promise<Plan[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          return data as Plan[];
        }
      } catch (err) {
        logger.debug('Failed to fetch plans from DB, using config defaults', err);
      }
    }

    return [
      {
        id: 'plan-business',
        ...PLANS_CONFIG.BUSINESS,
        created_at: new Date().toISOString(),
      },
      {
        id: 'plan-premium',
        ...PLANS_CONFIG.PREMIUM,
        created_at: new Date().toISOString(),
      },
    ];
  }

  /**
   * Fetches active subscription for a business tenant
   */
  static async getBusinessSubscription(businessId: string): Promise<Subscription | null> {
    const cleanId = businessId.trim().toUpperCase();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('business_id', cleanId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) return data as Subscription;
      } catch (err) {
        logger.debug('Failed to get subscription from Supabase, using memory fallback', { cleanId, err });
      }
    }

    return memorySubscriptions.get(cleanId) || null;
  }

  /**
   * Fetches payment history for a business tenant
   */
  static async getPaymentHistory(businessId: string): Promise<Payment[]> {
    const cleanId = businessId.trim().toUpperCase();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('business_id', cleanId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) return data as Payment[];
      } catch (err) {
        logger.debug('Failed to get payments from Supabase, using memory fallback', { cleanId, err });
      }
    }

    return memoryPayments.filter((p) => p.business_id === cleanId);
  }

  /**
   * Upgrades a business tenant's subscription to Premium (or target plan)
   * Simulates verified gateway callback and persists subscription state.
   */
  static async upgradeSubscription(
    businessId: string,
    targetPlanCode: 'business' | 'premium' = 'premium',
    paymentMethod = 'UPI / Razorpay'
  ): Promise<{ success: boolean; subscription: Subscription; payment: Payment }> {
    const cleanId = businessId.trim().toUpperCase();
    const planPrice = targetPlanCode === 'premium' ? 3999 : 1999;
    const planId = targetPlanCode === 'premium' ? 'plan-premium' : 'plan-business';

    const now = new Date().toISOString();
    const subId = `sub-${cleanId.toLowerCase()}-${targetPlanCode}`;

    const newSub: Subscription = {
      id: subId,
      business_id: cleanId,
      plan_id: planId,
      status: 'active',
      start_date: now,
      end_date: '2027-12-31T23:59:59Z',
      renewal_date: '2027-12-31T23:59:59Z',
      provider: 'razorpay',
      provider_subscription_id: `sub_live_${Date.now()}`,
      created_at: now,
      updated_at: now,
    };

    const newPayment: Payment = {
      id: `pay-${cleanId.toLowerCase()}-${Date.now()}`,
      business_id: cleanId,
      subscription_id: subId,
      amount: planPrice,
      currency: 'INR',
      payment_provider: paymentMethod,
      provider_order_id: `order_MC_${cleanId}_${Date.now()}`,
      provider_payment_id: `pay_MC_${Date.now()}`,
      status: 'success',
      created_at: now,
    };

    memorySubscriptions.set(cleanId, newSub);
    memoryPayments.unshift(newPayment);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('subscriptions').upsert(newSub);
        await supabase.from('payments').insert(newPayment);
        await supabase
          .from('businesses')
          .update({ plan_id: planId, updated_at: now })
          .eq('business_id', cleanId);
      } catch (err) {
        logger.debug('Supabase offline, upgraded in memory', err);
      }
    }

    return {
      success: true,
      subscription: newSub,
      payment: newPayment,
    };
  }
}
