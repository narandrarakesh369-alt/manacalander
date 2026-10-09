import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@mana/services';
import { ToastProvider, LoadingState, ProtectedRoute, NotFoundState } from '@mana/ui';

// =============================================================================
// LAZY-LOADED APPS & SCREENS FOR CODE SPLITTING & OPTIMAL CHUNKING
// =============================================================================

// Customer App
import { CustomerLayout } from '@customer/CustomerLayout';
const HomeScreen = lazy(() =>
  import('@customer/screens/HomeScreen').then((m) => ({ default: m.HomeScreen }))
);
const CalendarScreen = lazy(() =>
  import('@customer/screens/CalendarScreen').then((m) => ({ default: m.CalendarScreen }))
);
const EventsScreen = lazy(() =>
  import('@customer/screens/EventsScreen').then((m) => ({ default: m.EventsScreen }))
);
const MoreScreen = lazy(() =>
  import('@customer/screens/MoreScreen').then((m) => ({ default: m.MoreScreen }))
);
const SettingsScreen = lazy(() =>
  import('@customer/screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen }))
);
const WeatherScreen = lazy(() =>
  import('@customer/screens/WeatherScreen').then((m) => ({ default: m.WeatherScreen }))
);
const NotificationsHistoryScreen = lazy(() =>
  import('@customer/screens/NotificationsHistoryScreen').then((m) => ({
    default: m.NotificationsHistoryScreen,
  }))
);
const CampaignDetailsScreen = lazy(() =>
  import('@customer/screens/CampaignDetailsScreen').then((m) => ({
    default: m.CampaignDetailsScreen,
  }))
);
const BusinessLandingScreen = lazy(() =>
  import('@customer/screens/BusinessLandingScreen').then((m) => ({
    default: m.BusinessLandingScreen,
  }))
);
const CustomerBusinessProfileScreen = lazy(() =>
  import('@customer/screens/CustomerBusinessProfileScreen').then((m) => ({
    default: m.CustomerBusinessProfileScreen,
  }))
);
const DateDetailsScreen = lazy(() =>
  import('@customer/screens/DateDetailsScreen').then((m) => ({
    default: m.DateDetailsScreen,
  }))
);
const MyBusinessesScreen = lazy(() =>
  import('@customer/screens/MyBusinessesScreen').then((m) => ({
    default: m.MyBusinessesScreen,
  }))
);
const PrivacyPolicyScreen = lazy(() =>
  import('@customer/screens/PrivacyPolicyScreen').then((m) => ({
    default: m.PrivacyPolicyScreen,
  }))
);

// Business Portal
import { BusinessLayout } from '@business/BusinessLayout';
const BusinessLoginScreen = lazy(() =>
  import('@business/screens/BusinessLoginScreen').then((m) => ({
    default: m.BusinessLoginScreen,
  }))
);
const BusinessDashboardScreen = lazy(() =>
  import('@business/screens/BusinessDashboardScreen').then((m) => ({
    default: m.BusinessDashboardScreen,
  }))
);
const BusinessProfileScreen = lazy(() =>
  import('@business/screens/BusinessProfileScreen').then((m) => ({
    default: m.BusinessProfileScreen,
  }))
);
const BusinessCampaignsScreen = lazy(() =>
  import('@business/screens/BusinessCampaignsScreen').then((m) => ({
    default: m.BusinessCampaignsScreen,
  }))
);
const BusinessMediaScreen = lazy(() =>
  import('@business/screens/BusinessMediaScreen').then((m) => ({
    default: m.BusinessMediaScreen,
  }))
);
const BusinessQrScreen = lazy(() =>
  import('@business/screens/BusinessQrScreen').then((m) => ({
    default: m.BusinessQrScreen,
  }))
);
const BusinessAnalyticsScreen = lazy(() =>
  import('@business/screens/BusinessAnalyticsScreen').then((m) => ({
    default: m.BusinessAnalyticsScreen,
  }))
);
const BusinessSubscriptionScreen = lazy(() =>
  import('@business/screens/BusinessSubscriptionScreen').then((m) => ({
    default: m.BusinessSubscriptionScreen,
  }))
);
const BusinessNotificationsScreen = lazy(() =>
  import('@business/screens/BusinessNotificationsScreen').then((m) => ({
    default: m.BusinessNotificationsScreen,
  }))
);
const BusinessSettingsScreen = lazy(() =>
  import('@business/screens/BusinessSettingsScreen').then((m) => ({
    default: m.BusinessSettingsScreen,
  }))
);
const BusinessSupportScreen = lazy(() =>
  import('@business/screens/BusinessSupportScreen').then((m) => ({
    default: m.BusinessSupportScreen,
  }))
);

// Super Admin Console
import { AdminLayout } from '@admin/AdminLayout';
const AdminLoginScreen = lazy(() =>
  import('@admin/screens/AdminLoginScreen').then((m) => ({
    default: m.AdminLoginScreen,
  }))
);
const AdminDashboardScreen = lazy(() =>
  import('@admin/screens/AdminDashboardScreen').then((m) => ({
    default: m.AdminDashboardScreen,
  }))
);
const AdminBusinessesScreen = lazy(() =>
  import('@admin/screens/AdminBusinessesScreen').then((m) => ({
    default: m.AdminBusinessesScreen,
  }))
);
const AdminSubscriptionsScreen = lazy(() =>
  import('@admin/screens/AdminSubscriptionsScreen').then((m) => ({
    default: m.AdminSubscriptionsScreen,
  }))
);
const AdminPaymentsScreen = lazy(() =>
  import('@admin/screens/AdminPaymentsScreen').then((m) => ({
    default: m.AdminPaymentsScreen,
  }))
);
const AdminCampaignsScreen = lazy(() =>
  import('@admin/screens/AdminCampaignsScreen').then((m) => ({
    default: m.AdminCampaignsScreen,
  }))
);
const AdminCalendarScreen = lazy(() =>
  import('@admin/screens/AdminCalendarScreen').then((m) => ({
    default: m.AdminCalendarScreen,
  }))
);
const AdminPanchangamScreen = lazy(() =>
  import('@admin/screens/AdminPanchangamScreen').then((m) => ({
    default: m.AdminPanchangamScreen,
  }))
);
const AdminNotificationsScreen = lazy(() =>
  import('@admin/screens/AdminNotificationsScreen').then((m) => ({
    default: m.AdminNotificationsScreen,
  }))
);
const AdminAnalyticsScreen = lazy(() =>
  import('@admin/screens/AdminAnalyticsScreen').then((m) => ({
    default: m.AdminAnalyticsScreen,
  }))
);
const AdminSupportScreen = lazy(() =>
  import('@admin/screens/AdminSupportScreen').then((m) => ({
    default: m.AdminSupportScreen,
  }))
);
const AdminUsersScreen = lazy(() =>
  import('@admin/screens/AdminUsersScreen').then((m) => ({
    default: m.AdminUsersScreen,
  }))
);
const AdminSettingsScreen = lazy(() =>
  import('@admin/screens/AdminSettingsScreen').then((m) => ({
    default: m.AdminSettingsScreen,
  }))
);
const AdminAuditLogsScreen = lazy(() =>
  import('@admin/screens/AdminAuditLogsScreen').then((m) => ({
    default: m.AdminAuditLogsScreen,
  }))
);

// =============================================================================
// DEVELOPMENT ROLE SWITCHER BANNER
// Provides convenient evaluation switching between Customer, Business tenants, & Admin
// STRICTLY HIDDEN IN PRODUCTION
// =============================================================================
const DevSwitcherBanner: React.FC = () => {
  const { role, businessId, switchDevRole } = useAuth();

  // Guard: Never render role switcher in production
  if (import.meta.env.VITE_APP_ENV === 'production') {
    return null;
  }

  return (
    <div className="bg-[#0F172A] text-white text-[11px] px-3 py-1 flex items-center justify-between border-b border-slate-800 z-50">
      <div className="flex items-center gap-2">
        <span className="font-bold text-amber-400">DEV MODE:</span>
        <span>
          Current Role: <strong className="text-emerald-400">{role}</strong>
          {businessId && <span className="text-blue-300"> ({businessId})</span>}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            switchDevRole('customer');
            window.location.href = '/';
          }}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          Customer App
        </button>
        <button
          onClick={() => {
            switchDevRole('business_user', 'SLJ001');
            window.location.href = '/business/dashboard';
          }}
          className="px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700 transition-colors"
        >
          Biz (SLJ001)
        </button>
        <button
          onClick={() => {
            switchDevRole('business_user', 'RF002');
            window.location.href = '/business/dashboard';
          }}
          className="px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700 transition-colors"
        >
          Biz (RF002)
        </button>
        <button
          onClick={() => {
            switchDevRole('super_admin');
            window.location.href = '/admin/dashboard';
          }}
          className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 transition-colors"
        >
          Super Admin
        </button>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <DevSwitcherBanner />
          <Suspense fallback={<LoadingState message="Loading Mana Calendar..." fullScreen />}>
            <Routes>
              {/* ============================================================= */}
              {/* 1. CUSTOMER ROUTES (Shared Customer Android App Foundation)   */}
              {/* ============================================================= */}
              <Route element={<CustomerLayout />}>
                <Route index element={<HomeScreen />} />
                <Route path="home" element={<HomeScreen />} />
                <Route path="calendar" element={<CalendarScreen />} />
                <Route path="date/:date" element={<DateDetailsScreen />} />
                <Route path="calendar/date/:date" element={<DateDetailsScreen />} />
                <Route path="events" element={<EventsScreen />} />
                <Route path="more" element={<MoreScreen />} />
                <Route path="settings" element={<SettingsScreen />} />
                <Route path="weather" element={<WeatherScreen />} />
                <Route path="notifications" element={<NotificationsHistoryScreen />} />
                <Route path="campaigns/:id" element={<CampaignDetailsScreen />} />
                <Route path="b/:businessId" element={<BusinessLandingScreen />} />
                <Route path="business-profile/:businessId" element={<CustomerBusinessProfileScreen />} />
                <Route path="my-businesses" element={<Navigate to="/home" replace />} />
                <Route path="privacy" element={<PrivacyPolicyScreen />} />
              </Route>

              {/* ============================================================= */}
              {/* 2. BUSINESS ROUTES (Protected Tenant Dashboard)               */}
              {/* ============================================================= */}
              <Route path="business/login" element={<BusinessLoginScreen />} />
              <Route
                path="business"
                element={
                  <ProtectedRoute allowedRoles={['business_user', 'super_admin']} redirectPath="/business/login">
                    <BusinessLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<BusinessDashboardScreen />} />
                <Route path="profile" element={<BusinessProfileScreen />} />
                <Route path="campaigns" element={<BusinessCampaignsScreen />} />
                <Route path="media" element={<BusinessMediaScreen />} />
                <Route path="qr" element={<BusinessQrScreen />} />
                <Route path="analytics" element={<BusinessAnalyticsScreen />} />
                <Route path="subscription" element={<BusinessSubscriptionScreen />} />
                <Route path="notifications" element={<BusinessNotificationsScreen />} />
                <Route path="settings" element={<BusinessSettingsScreen />} />
                <Route path="support" element={<BusinessSupportScreen />} />
              </Route>

              {/* ============================================================= */}
              {/* 3. SUPER ADMIN ROUTES (Protected Platform Governance)         */}
              {/* ============================================================= */}
              <Route path="admin/login" element={<AdminLoginScreen />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']} redirectPath="/admin/login">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardScreen />} />
                <Route path="businesses" element={<AdminBusinessesScreen />} />
                <Route path="subscriptions" element={<AdminSubscriptionsScreen />} />
                <Route path="payments" element={<AdminPaymentsScreen />} />
                <Route path="campaigns" element={<AdminCampaignsScreen />} />
                <Route path="calendar" element={<AdminCalendarScreen />} />
                <Route path="panchangam" element={<AdminPanchangamScreen />} />
                <Route path="notifications" element={<AdminNotificationsScreen />} />
                <Route path="analytics" element={<AdminAnalyticsScreen />} />
                <Route path="support" element={<AdminSupportScreen />} />
                <Route path="users" element={<AdminUsersScreen />} />
                <Route path="settings" element={<AdminSettingsScreen />} />
                <Route path="audit-logs" element={<AdminAuditLogsScreen />} />
              </Route>

              {/* 404 CATCH-ALL */}
              <Route path="*" element={<NotFoundState homePath="/" />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
