import React, { useState } from 'react';
import { Badge, Button, Modal } from '@mana/ui';
import {
  Users,
  Shield,
  Plus,
  CheckCircle2,
  Lock,
  KeyRound,
  ShieldAlert,
  Check,
  X as CloseIcon,
  X,
} from 'lucide-react';
import { AdminService } from '@mana/services';
import type { AdminRoleType } from '@mana/types';

interface AdminPersonnel {
  id: string;
  name: string;
  email: string;
  role: AdminRoleType;
  status: 'active' | 'suspended';
  mfaEnabled: boolean;
  lastLogin: string;
}

export const AdminUsersScreen: React.FC = () => {
  const [admins, setAdmins] = useState<AdminPersonnel[]>([
    {
      id: 'admin-owner-01',
      name: 'Rajesh Varma (Platform Founder)',
      email: 'admin@manacalendar2027.com',
      role: 'owner',
      status: 'active',
      mfaEnabled: true,
      lastLogin: '2026-10-06 14:32:00',
    },
    {
      id: 'admin-admin-02',
      name: 'Suresh Kumar (Platform Operations)',
      email: 'ops@manacalendar2027.com',
      role: 'admin',
      status: 'active',
      mfaEnabled: true,
      lastLogin: '2026-10-06 11:15:22',
    },
    {
      id: 'admin-content-03',
      name: 'Pandit Sharma (Content & Panchangam)',
      email: 'content@manacalendar2027.com',
      role: 'content_admin',
      status: 'active',
      mfaEnabled: true,
      lastLogin: '2026-10-05 18:40:10',
    },
    {
      id: 'admin-support-04',
      name: 'Kavitha Devi (Partner Support)',
      email: 'support@manacalendar2027.com',
      role: 'support_admin',
      status: 'active',
      mfaEnabled: true,
      lastLogin: '2026-10-06 09:20:45',
    },
  ]);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'content_admin' as AdminRoleType,
  });
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const permissionsList = [
    { key: 'manage_businesses', label: 'Manage Businesses & Tenants' },
    { key: 'suspend_business', label: 'Suspend / Reactivate Tenants' },
    { key: 'manage_plans', label: 'Edit Dynamic Plans & Pricing' },
    { key: 'extend_subscriptions', label: 'Manual Subscription Extensions' },
    { key: 'manage_payments', label: 'Manage Payments & Webhooks' },
    { key: 'moderate_campaigns', label: 'Moderate Promotional Campaigns' },
    { key: 'manage_calendar', label: 'Publish Calendar & Festivals' },
    { key: 'verify_panchangam', label: 'Verify Panchangam Ephemeris' },
    { key: 'manage_notifications', label: 'Send Broadcast Notifications' },
    { key: 'view_analytics', label: 'View Platform Telemetry & ARR' },
    { key: 'manage_support', label: 'Resolve Support Tickets' },
    { key: 'view_audit_logs', label: 'View Immutable Audit Logs' },
  ];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;

    const newAdmin: AdminPersonnel = {
      id: `admin-${Date.now()}`,
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      status: 'active',
      mfaEnabled: true,
      lastLogin: 'Pending first login',
    };

    setAdmins((prev) => [...prev, newAdmin]);
    setIsInviteOpen(false);
    setSuccessBanner(`Admin user ${newAdmin.name} (${newAdmin.email}) invited with role ${newAdmin.role}!`);

    AdminService.recordAuditLog({
      actor_id: 'admin-owner-01',
      actor_type: 'admin',
      action: 'admin_user_invited',
      resource_type: 'admin_users',
      resource_id: newAdmin.id,
      details: newAdmin as unknown as Record<string, unknown>,
      ip_address: '103.48.196.12',
    });

    setInviteForm({
      name: '',
      email: '',
      role: 'content_admin',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin Personnel & RBAC Governance</h2>
          <p className="text-xs text-slate-500 mt-1">
            Role-Based Access Control matrix with server-side enforcement and enforced MFA authentication
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsInviteOpen(true)}
        >
          Add Admin User
        </Button>
      </div>

      {/* Success banner */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-600 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Admin Personnel Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Governance Personnel ({admins.length} active administrators)
          </span>
          <span className="text-[11px] text-slate-500">
            All administrative actions are tied to these identities
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Admin Name</th>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-5 py-3">Role Tier</th>
                <th className="px-5 py-3">MFA Status</th>
                <th className="px-5 py-3">Account Status</th>
                <th className="px-5 py-3">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {u.name}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">
                    {u.email}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        u.role === 'owner'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'admin'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : u.role === 'content_admin'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Lock size={11} className="text-emerald-600" />
                      MFA Active
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                    {u.lastLogin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-4 text-xs">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Shield size={16} className="text-blue-600" />
            Server-Side RBAC Enforcement Matrix
          </h3>
          <p className="text-slate-500 mt-1">
            Permissions are evaluated strictly on the backend using <code>AdminService.hasPermission()</code> before processing mutations.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <th className="py-2.5 px-3">Platform Capability</th>
                <th className="py-2.5 px-3 text-center">Owner</th>
                <th className="py-2.5 px-3 text-center">Admin</th>
                <th className="py-2.5 px-3 text-center">Content Admin</th>
                <th className="py-2.5 px-3 text-center">Support Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsList.map((p) => {
                const ownerAllowed = AdminService.hasPermission('owner', p.key as any);
                const adminAllowed = AdminService.hasPermission('admin', p.key as any);
                const contentAllowed = AdminService.hasPermission('content_admin', p.key as any);
                const supportAllowed = AdminService.hasPermission('support_admin', p.key as any);

                return (
                  <tr key={p.key} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{p.label}</td>
                    <td className="py-2.5 px-3 text-center">
                      {ownerAllowed ? (
                        <Check size={16} className="text-emerald-600 mx-auto" />
                      ) : (
                        <CloseIcon size={16} className="text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {adminAllowed ? (
                        <Check size={16} className="text-emerald-600 mx-auto" />
                      ) : (
                        <CloseIcon size={16} className="text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {contentAllowed ? (
                        <Check size={16} className="text-emerald-600 mx-auto" />
                      ) : (
                        <CloseIcon size={16} className="text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {supportAllowed ? (
                        <Check size={16} className="text-emerald-600 mx-auto" />
                      ) : (
                        <CloseIcon size={16} className="text-slate-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsInviteOpen(false)}
          title="Invite New Platform Administrator"
          size="md"
        >
          <form onSubmit={handleInvite} className="space-y-4 text-xs">
            <p className="text-slate-600">
              New administrators must verify their email and setup two-factor authentication (TOTP) before gaining access.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Naidu"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email Address *</label>
              <input
                type="email"
                required
                placeholder="admin@manacalendar2027.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assign Role Tier *</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500 font-medium"
              >
                <option value="admin">Admin (Tenants, Campaigns, Payments)</option>
                <option value="content_admin">Content Admin (Calendar, Festivals, Panchangam)</option>
                <option value="support_admin">Support Admin (Partner Desk, User Assistance)</option>
                <option value="owner">Owner (Full Unrestricted Super-User)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Send Administrator Invitation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
