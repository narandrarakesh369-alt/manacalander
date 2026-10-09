import React, { useState } from 'react';
import { Badge, Button, Modal } from '@mana/ui';
import {
  Megaphone,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Flag,
  Trash2,
  Calendar,
  MousePointerClick,
  ExternalLink,
  X,
} from 'lucide-react';
import { AdminService } from '@mana/services';
import type { CampaignModerationAction } from '@mana/types';

interface PlatformCampaign {
  id: string;
  tenantId: string;
  businessName: string;
  title: string;
  placement: 'home_top' | 'month_view' | 'day_details';
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  status: 'active' | 'scheduled' | 'paused' | 'flagged' | 'removed';
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
}

export const AdminCampaignsScreen: React.FC = () => {
  const [campaigns, setCampaigns] = useState<PlatformCampaign[]>([
    {
      id: 'cmp_slj_01',
      tenantId: 'SLJ001',
      businessName: 'Sri Lakshmi Jewellers',
      title: 'Sankranti 2027 Gold Mahotsavam',
      placement: 'home_top',
      startDate: '2027-01-10',
      endDate: '2027-01-20',
      impressions: 8420,
      clicks: 342,
      status: 'active',
      imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
      ctaText: 'Explore Sankranti Gold Collection',
      ctaUrl: 'https://srilakshmijewellers.in/sankranti2027',
    },
    {
      id: 'cmp_rf_01',
      tenantId: 'RF002',
      businessName: 'Radha Flours & Foods',
      title: 'Weekend Organic Millet Mela',
      placement: 'month_view',
      startDate: '2027-01-12',
      endDate: '2027-01-18',
      impressions: 3120,
      clicks: 86,
      status: 'active',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      ctaText: 'Order Farm Fresh Online',
      ctaUrl: 'https://radhafoods.in/millet-fest',
    },
    {
      id: 'cmp_cmr_01',
      tenantId: 'CMR003',
      businessName: 'CMR Shopping Mall',
      title: 'Grand Ugadi Silk Saree Fest',
      placement: 'day_details',
      startDate: '2027-04-01',
      endDate: '2027-04-08',
      impressions: 0,
      clicks: 0,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
      ctaText: 'Visit CMR Mall Visakhapatnam',
      ctaUrl: 'https://cmrmalls.in',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [inspectCampaign, setInspectCampaign] = useState<PlatformCampaign | null>(null);
  const [moderateCampaign, setModerateCampaign] = useState<PlatformCampaign | null>(null);
  const [modAction, setModAction] = useState<CampaignModerationAction>('pause');
  const [modReason, setModReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tenantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  const handleModerateSubmit = async () => {
    if (!moderateCampaign || !modReason.trim()) return;

    try {
      await AdminService.moderateCampaign(
        moderateCampaign.id,
        modAction,
        modReason,
        'admin-owner-01',
        'Super Admin'
      );

      // Map action to state
      let nextStatus = moderateCampaign.status;
      if (modAction === 'pause') nextStatus = 'paused';
      if (modAction === 'resume') nextStatus = 'active';
      if (modAction === 'flag') nextStatus = 'flagged';
      if (modAction === 'remove') nextStatus = 'removed';

      setCampaigns((prev) =>
        prev.map((c) => (c.id === moderateCampaign.id ? { ...c, status: nextStatus } : c))
      );

      setSuccessMessage(`Campaign "${moderateCampaign.title}" updated to ${nextStatus}. Audit logged.`);
      setModerateCampaign(null);
      setModReason('');
    } catch (err) {
      console.error('Failed to moderate campaign:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Platform Promotional Campaigns</h2>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin content moderation, creative review, and advertising quality controls
          </p>
        </div>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Campaigns</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {campaigns.length}
          </div>
          <span className="text-[11px] text-blue-600 font-medium">Across all tenants</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Impressions</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {totalImpressions.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Customer App Views</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Clicks</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {totalClicks.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">CTA Taps</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg CTR</span>
          <div className="text-2xl font-bold text-purple-600 mt-1 font-mono">
            {overallCtr}%
          </div>
          <span className="text-[11px] text-slate-500">Benchmark: 2.5%</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs w-full md:w-80">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by title, tenant ID, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-900 w-full placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <Filter size={13} />
              <span>Status:</span>
            </div>
            {['all', 'active', 'scheduled', 'paused', 'flagged'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors font-medium ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            All Promotional Campaigns ({filteredCampaigns.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Enforce compliance with platform advertising standards
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Tenant</th>
                <th className="px-5 py-3">Campaign Title</th>
                <th className="px-5 py-3">Slot Placement</th>
                <th className="px-5 py-3">Schedule</th>
                <th className="px-5 py-3">Impressions</th>
                <th className="px-5 py-3">Clicks / CTR</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.map((c) => {
                const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-blue-600">{c.tenantId}</div>
                      <div className="text-[11px] text-slate-400">{c.businessName}</div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {c.title}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                        {c.placement.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      {c.startDate} to {c.endDate}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                      {c.impressions.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <span className="font-semibold text-slate-900">{c.clicks}</span>
                      <span className="text-[11px] text-slate-400 ml-1">({ctr}%)</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.status === 'scheduled'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : c.status === 'paused'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2 border-slate-200 text-slate-700 hover:bg-slate-100"
                          onClick={() => setInspectCampaign(c)}
                        >
                          <Eye size={12} className="mr-1" />
                          Creative
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2 border-slate-200 text-slate-700 hover:bg-slate-100"
                          onClick={() => {
                            setModerateCampaign(c);
                            setModAction(c.status === 'active' ? 'pause' : 'resume');
                          }}
                        >
                          Moderate
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creative Inspection Modal */}
      {inspectCampaign && (
        <Modal
          isOpen={true}
          onClose={() => setInspectCampaign(null)}
          title={`Creative Preview: ${inspectCampaign.title}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
              <img
                src={inspectCampaign.imageUrl}
                alt={inspectCampaign.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-blue-600 font-bold">{inspectCampaign.tenantId}</span>
                  <span className="text-[11px] font-medium text-slate-400 capitalize">
                    Slot: {inspectCampaign.placement.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{inspectCampaign.title}</h4>
                <div className="flex items-center justify-between pt-2">
                  <a
                    href={inspectCampaign.ctaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium text-xs hover:bg-blue-700"
                  >
                    <span>{inspectCampaign.ctaText}</span>
                    <ExternalLink size={12} />
                  </a>
                  <span className="font-mono text-slate-400 text-[11px] select-all">
                    {inspectCampaign.ctaUrl}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setInspectCampaign(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Moderation Modal */}
      {moderateCampaign && (
        <Modal
          isOpen={true}
          onClose={() => setModerateCampaign(null)}
          title={`Moderate Campaign: ${moderateCampaign.id}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Apply administrative moderation to <b>{moderateCampaign.title}</b> ({moderateCampaign.tenantId}).
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Action *</label>
              <select
                value={modAction}
                onChange={(e) => setModAction(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500 font-medium"
              >
                <option value="pause">Pause Campaign (Hold temporary delivery)</option>
                <option value="resume">Resume Campaign (Restore active delivery)</option>
                <option value="flag">Flag for Content Review (Notify merchant of policy issue)</option>
                <option value="remove">Remove / Reject Campaign (Permanently terminate)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Moderation Reason (Mandatory Audit Requirement) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Creative violates promotional text guidelines / Low resolution image / Misleading discount claims"
                value={modReason}
                onChange={(e) => setModReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setModerateCampaign(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!modReason.trim()}
                onClick={handleModerateSubmit}
              >
                Confirm Moderation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
