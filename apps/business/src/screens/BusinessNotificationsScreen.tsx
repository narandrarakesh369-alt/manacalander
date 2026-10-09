import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Modal } from '@mana/ui';
import { useAuth, NotificationService, CampaignService } from '@mana/services';
import type { NotificationCampaign, Campaign, NotificationLimits } from '@mana/types';
import {
  Bell,
  Sparkles,
  Send,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Plus,
  Users,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const BusinessNotificationsScreen: React.FC = () => {
  const { businessId } = useAuth();
  const tenantId = businessId || 'SLJ001';

  const [canSend, setCanSend] = useState<boolean>(true);
  const [restrictionReason, setRestrictionReason] = useState<string>('');
  const [limits, setLimits] = useState<NotificationLimits | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recentBroadcasts, setRecentBroadcasts] = useState<NotificationCampaign[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Form states
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [audienceType, setAudienceType] = useState<'all' | 'city'>('all');
  const [targetCity, setTargetCity] = useState<string>('Visakhapatnam');
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  const loadData = async () => {
    // 1. Verify subscription plan permission server-side
    const check = await NotificationService.canBusinessSendPromotionalNotifications(tenantId);
    setCanSend(check.allowed);
    if (!check.allowed && check.reason) {
      setRestrictionReason(check.reason);
    }

    // 2. Fetch configurable platform limits
    const lim = await NotificationService.getNotificationLimits();
    setLimits(lim);

    // 3. Fetch active business campaigns
    CampaignService.getBusinessCampaigns(tenantId).then(setCampaigns);

    // Initial mock history if empty
    setRecentBroadcasts([
      {
        id: 'bc-1',
        business_id: tenantId,
        campaign_id: 'DIWALI2027',
        title: 'సంక్రాంతి ప్రత్యేక బంగారు ఆభరణాల ఆఫర్ (Sri Lakshmi Jewellery)',
        body: 'అన్ని బంగారు మరియు వజ్రాభరణాలపై తయారీ కూలిలో 50% తగ్గింపు! ద్వారకా నగర్, వైజాగ్.',
        target_audience: { all: true },
        status: 'sent',
        sent_at: '2027-01-10T10:00:00Z',
        stats: {
          sent: 480,
          delivered: 472,
          opened: 312,
          clicked: 145,
        },
        created_at: '2027-01-10T09:45:00Z',
      },
    ]);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title.trim() || !body.trim()) {
      setFormError('Please enter both title and message.');
      return;
    }

    setIsSending(true);

    try {
      const scheduledIso =
        scheduleType === 'scheduled' && scheduledTime
          ? new Date(scheduledTime).toISOString()
          : undefined;

      const newBroadcast = await NotificationService.createAndSendPromotionalCampaign({
        businessId: tenantId,
        campaignId: selectedCampaignId || undefined,
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || undefined,
        targetAudience: audienceType === 'all' ? { all: true } : { all: false, city: targetCity },
        scheduledAt: scheduledIso,
      });

      setRecentBroadcasts((prev) => [newBroadcast, ...prev]);
      setFormSuccess('Promotional push alert successfully created and dispatched!');
      setIsSending(false);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setFormSuccess('');
        setTitle('');
        setBody('');
        setImageUrl('');
      }, 1200);
    } catch (err: any) {
      setIsSending(false);
      setFormError(err.message || 'Failed to dispatch promotional notification.');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* 1. Header with Plan Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Promotional Push Notifications</h2>
          <p className="text-xs text-[#64748B]">
            Direct customer broadcast alerts for business tenant: <strong>{tenantId}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={canSend ? 'primary' : 'neutral'} size="sm">
            {canSend ? 'Premium Plan (₹3,999/yr)' : 'Business Plan (₹1,999/yr)'}
          </Badge>
          {canSend && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Notification
            </Button>
          )}
        </div>
      </div>

      {/* 2. Plan Restriction Banner if Standard ₹1,999 Plan */}
      {!canSend ? (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5 text-amber-900">
          <Lock size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <h4 className="font-bold text-sm text-amber-950">
              Promotional Push Notifications Locked
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              {restrictionReason ||
                'Promotional push alerts are exclusive to the Premium ₹3,999/year plan. Standard Business subscriptions (₹1,999/year) do not include push broadcast privileges.'}
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => (window.location.href = '/business/subscription')}
              >
                Upgrade to Premium Plan (₹3,999/year)
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. Platform Limits & Quota Info Card */
        <div className="p-4 bg-[#EAF3FF] border border-[#bfdbfe] rounded-2xl flex items-start gap-3">
          <Info size={20} className="text-[#1677F2] flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#0F172A] space-y-1">
            <span className="font-bold">Fair Usage & Frequency Limits: </span>
            <p className="text-[#475569]">
              To protect customer retention, businesses may send up to{' '}
              <strong>{limits?.max_promotional_per_business_per_month || 4} promotional alerts/month</strong> with a{' '}
              <strong>{limits?.cooldown_hours_between_promotions || 24}-hour cooldown</strong> between sends.
              All notifications deep-link directly to your selected campaign details.
            </p>
          </div>
        </div>
      )}

      {/* 4. Analytics Summary & Delivery Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] shadow-subtle">
          <span className="text-[#64748B] block text-[11px] font-medium">Broadcasts Sent</span>
          <span className="text-xl font-bold text-[#0F172A] mt-1 block">
            {recentBroadcasts.length} / {limits?.max_promotional_per_business_per_month || 4}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">This Month</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] shadow-subtle">
          <span className="text-[#64748B] block text-[11px] font-medium">Delivered</span>
          <span className="text-xl font-bold text-[#0F172A] mt-1 block">
            {recentBroadcasts.reduce((acc, b) => acc + (b.stats?.delivered || 0), 0)}
          </span>
          <span className="text-[10px] text-[#64748B] mt-0.5 block">FCM Delivery</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] shadow-subtle">
          <span className="text-[#64748B] block text-[11px] font-medium">Opened</span>
          <span className="text-xl font-bold text-[#1677F2] mt-1 block">
            {recentBroadcasts.reduce((acc, b) => acc + (b.stats?.opened || 0), 0)}
          </span>
          <span className="text-[10px] text-[#64748B] mt-0.5 block">Customer Reads</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] shadow-subtle">
          <span className="text-[#64748B] block text-[11px] font-medium">Deep Link Clicks</span>
          <span className="text-xl font-bold text-emerald-600 mt-1 block">
            {recentBroadcasts.reduce((acc, b) => acc + (b.stats?.clicked || 0), 0)}
          </span>
          <span className="text-[10px] text-[#64748B] mt-0.5 block">Campaign Views</span>
        </div>
      </div>

      {/* 5. Recent Broadcast History */}
      <Card title="Broadcast Logs & Engagement History" padding="md">
        <div className="divide-y divide-[#E2E8F0] text-xs">
          {recentBroadcasts.map((b) => (
            <div key={b.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[#0F172A] text-xs">{b.title}</h4>
                  <Badge variant={b.status === 'sent' ? 'success' : 'warning'} size="sm">
                    {b.status}
                  </Badge>
                </div>
                <p className="text-[#64748B] text-[11px] mt-0.5 line-clamp-1">{b.body}</p>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-[#94a3b8]">
                  <span>Sent: {new Date(b.created_at).toLocaleDateString()}</span>
                  <span>Target: {b.target_audience && 'all' in b.target_audience ? 'All Customers' : 'City Filter'}</span>
                  {b.campaign_id && <span>Campaign: {b.campaign_id}</span>}
                </div>
              </div>

              {b.stats && (
                <div className="flex items-center gap-3 self-end sm:self-center bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                  <div className="text-center">
                    <span className="text-[9px] text-[#64748B] block uppercase">Sent</span>
                    <span className="font-bold text-[#0F172A]">{b.stats.sent}</span>
                  </div>
                  <div className="h-5 w-px bg-[#E2E8F0]" />
                  <div className="text-center">
                    <span className="text-[9px] text-[#64748B] block uppercase">Opened</span>
                    <span className="font-bold text-[#1677F2]">{b.stats.opened}</span>
                  </div>
                  <div className="h-5 w-px bg-[#E2E8F0]" />
                  <div className="text-center">
                    <span className="text-[9px] text-[#64748B] block uppercase">Clicked</span>
                    <span className="font-bold text-emerald-600">{b.stats.clicked}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 6. Modal: Create Promotional Notification Flow */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Send size={18} className="text-[#1677F2]" />
            <span>Create Promotional Notification</span>
          </div>
        }
      >
        <form onSubmit={handleSendNotification} className="space-y-3.5 text-left text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Select Campaign */}
          <div>
            <label className="block font-semibold text-[#475569] mb-1">
              Link to Campaign (Deep-Link Destination)
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#1677F2]"
            >
              <option value="">-- General Business Alert (No Campaign) --</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.status})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Notification Title *"
            placeholder="e.g. సంక్రాంతి ప్రత్యేక ఆభరణాల ఆఫర్"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block font-semibold text-[#475569] mb-1">
              Notification Message *
            </label>
            <textarea
              rows={3}
              placeholder="e.g. బంగారు ఆభరణాలపై 50% తగ్గింపు! ద్వారకా నగర్, విశాఖపట్నం షోరూమ్‌ను సందర్శించండి."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#1677F2]"
              required
            />
          </div>

          <Input
            label="Optional Banner Image URL"
            placeholder="https://images.unsplash.com/..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />

          {/* Target Audience */}
          <div>
            <label className="block font-semibold text-[#475569] mb-1">Target Audience</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAudienceType('all')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  audienceType === 'all'
                    ? 'border-[#1677F2] bg-[#EAF3FF] text-[#1677F2] font-bold'
                    : 'border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A]'
                }`}
              >
                All Customers
              </button>
              <button
                type="button"
                onClick={() => setAudienceType('city')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  audienceType === 'city'
                    ? 'border-[#1677F2] bg-[#EAF3FF] text-[#1677F2] font-bold'
                    : 'border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A]'
                }`}
              >
                Location-Based
              </button>
            </div>
            {audienceType === 'city' && (
              <div className="mt-2">
                <select
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#E2E8F0] bg-white"
                >
                  <option value="Visakhapatnam">Visakhapatnam (విశాఖపట్నం)</option>
                  <option value="Vijayawada">Vijayawada (విజయవాడ)</option>
                  <option value="Hyderabad">Hyderabad (హైదరాబాద్)</option>
                  <option value="Tirupati">Tirupati (తిరుపతి)</option>
                </select>
              </div>
            )}
          </div>

          {/* Scheduling */}
          <div>
            <label className="block font-semibold text-[#475569] mb-1">Dispatch Time</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScheduleType('now')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  scheduleType === 'now'
                    ? 'border-[#1677F2] bg-[#EAF3FF] text-[#1677F2] font-bold'
                    : 'border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A]'
                }`}
              >
                Send Now
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('scheduled')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  scheduleType === 'scheduled'
                    ? 'border-[#1677F2] bg-[#EAF3FF] text-[#1677F2] font-bold'
                    : 'border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A]'
                }`}
              >
                Schedule Alert
              </button>
            </div>
            {scheduleType === 'scheduled' && (
              <div className="mt-2">
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#E2E8F0] bg-white"
                  required
                />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSending}
              leftIcon={<Send size={14} />}
            >
              {isSending ? 'Sending Broadcast...' : 'Confirm & Dispatch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
