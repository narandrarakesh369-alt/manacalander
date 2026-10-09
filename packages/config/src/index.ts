/// <reference types="vite/client" />
/**
 * MANA CALENDAR 2027 — CENTRAL CONFIGURATION SYSTEM
 * Centralized settings for multi-tenant, bilingual calendar architecture
 */

import type { LanguagePreference, LocationConfig, Plan } from '@mana/types';

export * from './i18n/translations';

export const APP_CONFIG = {
  name: 'Mana Calendar 2027',
  shortName: 'Mana Calendar',
  version: '1.0.0',
  description: 'Telugu + English Commercial Multi-Tenant Calendar Platform for Indian Users',
  supportedYears: [2027, 2028, 2029, 2030],
  defaultYear: 2027,
} as const;

export const LANGUAGE_CONFIG: {
  supportedLanguages: { code: LanguagePreference; label: string; nativeLabel: string }[];
  defaultLanguage: LanguagePreference;
} = {
  supportedLanguages: [
    { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'te_en', label: 'Telugu + English', nativeLabel: 'తెలుగు + English' },
  ],
  defaultLanguage: 'te_en',
};

export const DEFAULT_LOCATION: LocationConfig = {
  code: 'VIZAG',
  city: 'Visakhapatnam',
  name_te: 'విశాఖపట్నం',
  state: 'Andhra Pradesh',
  state_te: 'ఆంధ్ర ప్రదేశ్',
  country: 'India',
  latitude: 17.6868,
  longitude: 83.2185,
  timezone: 'Asia/Kolkata',
};

export const POPULAR_LOCATIONS: LocationConfig[] = [
  DEFAULT_LOCATION,
  {
    code: 'BZA',
    city: 'Vijayawada',
    name_te: 'విజయవాడ',
    state: 'Andhra Pradesh',
    state_te: 'ఆంధ్ర ప్రదేశ్',
    country: 'India',
    latitude: 16.5062,
    longitude: 80.6480,
    timezone: 'Asia/Kolkata',
  },
  {
    code: 'HYD',
    city: 'Hyderabad',
    name_te: 'హైదరాబాద్',
    state: 'Telangana',
    state_te: 'తెలంగాణ',
    country: 'India',
    latitude: 17.3850,
    longitude: 78.4867,
    timezone: 'Asia/Kolkata',
  },
  {
    code: 'TPT',
    city: 'Tirupati',
    name_te: 'తిరుపతి',
    state: 'Andhra Pradesh',
    state_te: 'ఆంధ్ర ప్రదేశ్',
    country: 'India',
    latitude: 13.6288,
    longitude: 79.4192,
    timezone: 'Asia/Kolkata',
  },
  {
    code: 'GNT',
    city: 'Guntur',
    name_te: 'గుంటూరు',
    state: 'Andhra Pradesh',
    state_te: 'ఆంధ్ర ప్రదేశ్',
    country: 'India',
    latitude: 16.3067,
    longitude: 80.4365,
    timezone: 'Asia/Kolkata',
  },
  {
    code: 'RJY',
    city: 'Rajahmundry',
    name_te: 'రాజమండ్రి',
    state: 'Andhra Pradesh',
    state_te: 'ఆంధ్ర ప్రదేశ్',
    country: 'India',
    latitude: 17.0005,
    longitude: 81.8040,
    timezone: 'Asia/Kolkata',
  },
  {
    code: 'WGL',
    city: 'Warangal',
    name_te: 'వరంగల్',
    state: 'Telangana',
    state_te: 'తెలంగాణ',
    country: 'India',
    latitude: 17.9689,
    longitude: 79.5941,
    timezone: 'Asia/Kolkata',
  },
];

export const PLANS_CONFIG: Record<'BUSINESS' | 'PREMIUM', Omit<Plan, 'id' | 'created_at'>> = {
  BUSINESS: {
    plan_code: 'business',
    name: 'Business Plan',
    price_inr: 1999,
    billing_period: 'year',
    included_campaigns: 10,
    extra_campaign_price_inr: 299,
    features: {
      calendar_ecosystem_access: true,
      business_profile: true,
      logo: true,
      qr_code: true,
      promotional_banners: true,
      campaigns: true,
      analytics: true,
      scheduling: true,
      promotional_push_notifications: false,
      enhanced_branding: false,
    },
    is_active: true,
  },
  PREMIUM: {
    plan_code: 'premium',
    name: 'Premium Plan',
    price_inr: 3999,
    billing_period: 'year',
    included_campaigns: 10,
    extra_campaign_price_inr: 299,
    features: {
      calendar_ecosystem_access: true,
      business_profile: true,
      logo: true,
      qr_code: true,
      promotional_banners: true,
      campaigns: true,
      analytics: true,
      scheduling: true,
      promotional_push_notifications: true,
      enhanced_branding: true,
    },
    is_active: true,
  },
};

export const CAMPAIGN_RULES = {
  INCLUDED_ANNUAL_CAMPAIGNS: 10,
  ADDITIONAL_CAMPAIGN_PRICE_INR: 299,
  DELETING_RESTORES_CREDIT: false,
};

export const FEATURE_FLAGS = {
  enablePanchangamPlaceholders: true,
  enableWeatherPlaceholders: true,
  enableBusinessDashboard: true,
  enableSuperAdmin: true,
  enableCustomerAuth: true,
  livePaymentGateway: false,
  livePushNotifications: false,
  liveDeepLinking: false,
};

export const ENV = {
  supabaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://placeholder.supabase.co',
  supabaseAnonKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'placeholder-anon-key',
  appEnv: ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_ENV) || 'development') as 'development' | 'staging' | 'production',
  appUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) || 'http://localhost:3000',
  isProduction: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_ENV === 'production'),
  isDevelopment: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_ENV !== 'production'),
};
