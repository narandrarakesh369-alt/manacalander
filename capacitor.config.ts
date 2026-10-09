import type { CapacitorConfig } from '@capacitor/cli';

/**
 * MANA CALENDAR 2027 — PRODUCTION CAPACITOR CONFIGURATION
 * Single shared customer Android application across Andhra Pradesh & Telangana.
 * Package Name: in.manacalendar.app
 * Version Name: 1.0.0 (Version Code: 1)
 */
const config: CapacitorConfig = {
  appId: 'in.manacalendar.app',
  appName: 'Mana Calendar 2027',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'manacalendar.in',
    cleartext: false, // Disallow insecure cleartext HTTP traffic in production
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Disabled in production release builds
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#FFFFFF',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
