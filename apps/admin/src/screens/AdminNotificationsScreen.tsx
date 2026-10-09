import React, { useState } from 'react';
import { Badge, Button, Modal } from '@mana/ui';
import {
  Bell,
  Send,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  Trash2,
  Calendar,
  Sparkles,
  Megaphone,
  X,
} from 'lucide-react';
import { AdminService } from '@mana/services';

interface NotificationBroadcast {
  id: string;
  sender: 'Super Admin' | string;
  senderType: 'platform' | 'business';
  titleEn: string;
  titleTe: string;
  bodyEn: string;
  bodyTe: string;
  audience: string;
  recipientsCount: number;
  scheduledAt: string;
  status: 'delivered' | 'queued' | 'paused' | 'cancelled';
}

export const AdminNotificationsScreen: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<NotificationBroadcast[]>([
    {
      id: 'notif_001',
      sender: 'Super Admin',
      senderType: 'platform',
      titleEn: 'Happy Makara Sankranti 2027!',
      titleTe: 'మకర సంక్రాంతి శుభాకాంక్షలు!',
      bodyEn: 'Wishing you and your family abundant joy and prosperity this harvest season.',
      bodyTe: 'మీకు మీ కుటుంబ సభ్యులకు భోగి మరియు సంక్రాంతి పండుగ శుభాకాంక్షలు.',
      audience: 'All Registered Devices (Andhra Pradesh & Telangana)',
      recipientsCount: 42500,
      scheduledAt: '2027-01-15 06:00:00',
      status: 'delivered',
    },
    {
      id: 'notif_002',
      sender: 'SLJ001 (Sri Lakshmi Jewellers)',
      senderType: 'business',
      titleEn: 'Zero Making Charges on Gold Jewellery',
      titleTe: 'బంగారు ఆభరణాలపై తరుగు లేదు',
      bodyEn: 'Exclusive Sankranti offer valid till Jan 20 across Vizag showrooms.',
      bodyTe: 'సంక్రాంతి ప్రత్యేక ఆఫర్ జనవరి 20 వరకు మాత్రమే అందుబాటులో ఉంది.',
      audience: 'Visakhapatnam Region (Premium Plan Tenant Broadcast)',
      recipientsCount: 12400,
      scheduledAt: '2027-01-14 10:30:00',
      status: 'delivered',
    },
    {
      id: 'notif_003',
      sender: 'Super Admin',
      senderType: 'platform',
      titleEn: 'Sri Rama Navami Special Panchangam',
      titleTe: 'శ్రీరామ నవమి విశేష పంచాంగం',
      bodyEn: 'Check auspicious Kalyana Muhurtham timings across major temples.',
      bodyTe: 'భద్రాచలం కల్యాణ మహోత్సవ ముహూర్త వివరాలు ఇప్పుడు యాప్‌లో చూడండి.',
      audience: 'All Registered Devices',
      recipientsCount: 45000,
      scheduledAt: '2027-04-16 05:30:00',
      status: 'queued',
    },
  ]);

  // Modal
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({
    titleEn: '',
    titleTe: '',
    bodyEn: '',
    bodyTe: '',
    audience: 'All Registered Devices (Andhra Pradesh & Telangana)',
  });
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.titleEn || !composeForm.bodyEn) return;

    const newBroadcast: NotificationBroadcast = {
      id: `notif_${Date.now()}`,
      sender: 'Super Admin',
      senderType: 'platform',
      titleEn: composeForm.titleEn,
      titleTe: composeForm.titleTe || composeForm.titleEn,
      bodyEn: composeForm.bodyEn,
      bodyTe: composeForm.bodyTe || composeForm.bodyEn,
      audience: composeForm.audience,
      recipientsCount: 45200,
      scheduledAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'delivered',
    };

    setBroadcasts((prev) => [newBroadcast, ...prev]);
    setIsComposeOpen(false);
    setSuccessBanner(`Broadcast "${newBroadcast.titleEn}" queued for immediate dispatch across ${newBroadcast.recipientsCount.toLocaleString()} devices.`);

    AdminService.recordAuditLog({
      actor_id: 'admin-owner-01',
      actor_type: 'admin',
      action: 'notification_broadcast_sent',
      resource_type: 'notifications',
      resource_id: newBroadcast.id,
      details: newBroadcast as unknown as Record<string, unknown>,
      ip_address: '103.48.196.12',
    });

    setComposeForm({
      titleEn: '',
      titleTe: '',
      bodyEn: '',
      bodyTe: '',
      audience: 'All Registered Devices (Andhra Pradesh & Telangana)',
    });
  };

  const handleCancelBroadcast = (id: string) => {
    setBroadcasts((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
    );
    setSuccessBanner(`Notification ${id} cancelled and removed from dispatch queue.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Broadcast Notifications Center</h2>
          <p className="text-xs text-slate-500 mt-1">
            Emergency announcements, festival greetings, and Premium merchant promotional push notifications
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
          leftIcon={<Send size={16} />}
          onClick={() => setIsComposeOpen(true)}
        >
          Send Global Announcement
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

      {/* Information Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Registered FCM Tokens</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            45,200
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">98.4% Delivery Reach</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tenant Push Eligibility</span>
          <div className="text-2xl font-bold text-purple-600 mt-1 font-mono">
            Premium Tier Only
          </div>
          <span className="text-[11px] text-slate-500">₹3,999/yr Plan feature</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Broadcast Channel</span>
          <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
            Firebase Cloud Messaging
          </div>
          <span className="text-[11px] text-slate-500">Bilingual Push Payload</span>
        </div>
      </div>

      {/* Broadcasts Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Notification Dispatches & Queue ({broadcasts.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Real-time delivery status across Android customer devices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Sender & Type</th>
                <th className="px-5 py-3">Message Content (EN + TE)</th>
                <th className="px-5 py-3">Target Audience</th>
                <th className="px-5 py-3">Devices</th>
                <th className="px-5 py-3">Scheduled At</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {broadcasts.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{b.sender}</div>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase mt-0.5 ${
                        b.senderType === 'platform'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {b.senderType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 max-w-sm">
                    <div className="font-bold text-slate-900">{b.titleEn}</div>
                    <div className="text-blue-600 font-semibold text-[11px]">{b.titleTe}</div>
                    <div className="text-slate-500 text-[11px] mt-1 line-clamp-1">{b.bodyEn}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {b.audience}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                    {b.recipientsCount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                    {b.scheduledAt}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        b.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.status === 'queued'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : b.status === 'paused'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {b.status === 'queued' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2 border-rose-200 text-rose-600 hover:bg-rose-50"
                        onClick={() => handleCancelBroadcast(b.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compose Announcement Modal */}
      {isComposeOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsComposeOpen(false)}
          title="Compose Global App Announcement"
          size="md"
        >
          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Dispatches an immediate high-priority push notification to all Mana Calendar Android devices via FCM.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Title (English) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ugadi 2027 Shubhakankshalu!"
                value={composeForm.titleEn}
                onChange={(e) => setComposeForm({ ...composeForm, titleEn: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Title (Telugu - తెలుగు)</label>
              <input
                type="text"
                placeholder="e.g. ఉగాది శుభాకాంక్షలు!"
                value={composeForm.titleTe}
                onChange={(e) => setComposeForm({ ...composeForm, titleTe: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Message Body (English) *</label>
              <textarea
                required
                rows={2}
                placeholder="Notification message body in English..."
                value={composeForm.bodyEn}
                onChange={(e) => setComposeForm({ ...composeForm, bodyEn: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Message Body (Telugu - తెలుగు)</label>
              <textarea
                rows={2}
                placeholder="నోటిఫికేషన్ సమాచారం తెలుగులో..."
                value={composeForm.bodyTe}
                onChange={(e) => setComposeForm({ ...composeForm, bodyTe: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Geographic Audience</label>
              <select
                value={composeForm.audience}
                onChange={(e) => setComposeForm({ ...composeForm, audience: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500 font-medium"
              >
                <option value="All Registered Devices (Andhra Pradesh & Telangana)">All Registered Devices (Andhra Pradesh & Telangana)</option>
                <option value="Andhra Pradesh Only">Andhra Pradesh Only</option>
                <option value="Telangana Only">Telangana Only</option>
                <option value="Visakhapatnam Metropolitan Region">Visakhapatnam Metropolitan Region</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsComposeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Dispatch Broadcast Now
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
