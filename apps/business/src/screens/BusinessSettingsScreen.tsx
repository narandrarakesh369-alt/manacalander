import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '@mana/ui';
import { useAuth } from '@mana/services';
import {
  Settings,
  Shield,
  Key,
  Bell,
  CheckCircle2,
  Lock,
  Mail,
  Smartphone,
  Users,
} from 'lucide-react';

export const BusinessSettingsScreen: React.FC = () => {
  const { businessId } = useAuth();
  const tenantId = (businessId || 'SLJ001').toUpperCase();

  // Password update form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Notification preferences
  const [campaignExpiryAlerts, setCampaignExpiryAlerts] = useState(true);
  const [weeklyAnalyticsDigest, setWeeklyAnalyticsDigest] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleSavePreferences = () => {
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Tenant Account Settings</h2>
        <p className="text-xs text-[#64748B]">
          Security controls, alert notifications, and access preferences for tenant: <strong>{tenantId}</strong>
        </p>
      </div>

      {/* Tenant Credentials Overview */}
      <Card title="Tenant Identity & Credentials" padding="md">
        <div className="space-y-4">
          <Input label="Tenant Identification Code" defaultValue={tenantId} disabled />
          <Input label="Primary Login Email" defaultValue={`owner@${tenantId.toLowerCase()}.in`} disabled />
          <p className="text-[11px] text-[#64748B]">
            * The unique Tenant Code is permanently linked to your store QR code and campaign attributions.
          </p>
        </div>
      </Card>

      {/* Security: Update Password */}
      <Card title="Change Account Password" padding="md">
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Password successfully changed!</span>
            </div>
          )}
          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {passwordError}
            </div>
          )}

          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" leftIcon={<Key size={14} />}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Notification Preferences */}
      <Card title="Merchant Alert Preferences" padding="md">
        <div className="space-y-4">
          {prefsSaved && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={14} />
              <span>Notification preferences updated.</span>
            </div>
          )}

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-800">Campaign Expiration Alerts</div>
              <div className="text-[11px] text-slate-500">Receive reminders 48 hours before an active campaign ends.</div>
            </div>
            <input
              type="checkbox"
              checked={campaignExpiryAlerts}
              onChange={(e) => setCampaignExpiryAlerts(e.target.checked)}
              className="w-4 h-4 text-[#1677F2] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-800">Weekly Performance Email Digest</div>
              <div className="text-[11px] text-slate-500">Summary of customer impressions, clicks, and QR scans.</div>
            </div>
            <input
              type="checkbox"
              checked={weeklyAnalyticsDigest}
              onChange={(e) => setWeeklyAnalyticsDigest(e.target.checked)}
              className="w-4 h-4 text-[#1677F2] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs font-bold text-slate-800">WhatsApp Merchant Updates</div>
              <div className="text-[11px] text-slate-500">Instant WhatsApp alerts when festival calendar peaks occur.</div>
            </div>
            <input
              type="checkbox"
              checked={whatsappAlerts}
              onChange={(e) => setWhatsappAlerts(e.target.checked)}
              className="w-4 h-4 text-[#1677F2] rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
