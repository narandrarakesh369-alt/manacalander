import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@mana/ui';
import { useAuth, AnalyticsService } from '@mana/services';
import type { TenantAnalyticsSummary, CampaignPerformanceMetrics } from '@mana/types';
import {
  BarChart3,
  TrendingUp,
  Eye,
  MousePointerClick,
  QrCode,
  Users,
  Bell,
  Building2,
  Calendar,
  ShieldCheck,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const BusinessAnalyticsScreen: React.FC = () => {
  const { businessId } = useAuth();
  const tenantId = (businessId || 'SLJ001').toUpperCase();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '3m' | '1y'>('30d');
  const [metrics, setMetrics] = useState<TenantAnalyticsSummary | null>(null);
  const [campaignBreakdown, setCampaignBreakdown] = useState<CampaignPerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      AnalyticsService.getTenantAnalytics(tenantId, timeframe),
      AnalyticsService.getCampaignPerformance(tenantId),
    ]).then(([m, camps]) => {
      setMetrics(m);
      setCampaignBreakdown(camps);
      setLoading(false);
    });
  }, [tenantId, timeframe]);

  const timeframeLabels = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '3m': 'Last 3 Months',
    '1y': 'This Year (2027)',
  };

  return (
    <div className="space-y-6">
      {/* Header and Time Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Tenant Analytics & Performance</h2>
          <p className="text-xs text-[#64748B]">
            Audience engagement telemetry for {tenantId} • Privacy-compliant non-PII metrics
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          {(['7d', '30d', '3m', '1y'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeframe === tf
                  ? 'bg-[#1677F2] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {timeframeLabels[tf]}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Banner Impressions */}
        <Card padding="md">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Calendar Impressions</span>
            <Eye size={18} className="text-[#1677F2]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0F172A]">
            {loading ? '...' : metrics?.totalImpressions.toLocaleString() || '0'}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <ArrowUpRight size={14} />
            <span>+14.2% organic calendar views</span>
          </div>
        </Card>

        {/* Clicks */}
        <Card padding="md">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Clicks</span>
            <MousePointerClick size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0F172A]">
            {loading ? '...' : metrics?.totalClicks.toLocaleString() || '0'}
          </div>
          <span className="text-[11px] text-[#64748B] block mt-1">
            CTR: <strong className="text-slate-900">{metrics?.ctr || 0}%</strong>
          </span>
        </Card>

        {/* Store Profile Views */}
        <Card padding="md">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Store Profile Views</span>
            <Building2 size={18} className="text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0F172A]">
            {loading ? '...' : metrics?.profileViews?.toLocaleString() || '1,420'}
          </div>
          <span className="text-[11px] text-purple-700 font-medium block mt-1">
            Direct store engagements
          </span>
        </Card>

        {/* In-Store QR Scans */}
        <Card padding="md">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Counter QR Scans</span>
            <QrCode size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0F172A]">
            {loading ? '...' : metrics?.qrScans || '118'}
          </div>
          <span className="text-[11px] text-amber-700 font-medium block mt-1">
            Retail customer attributions
          </span>
        </Card>
      </div>

      {/* Secondary Row: Followers & Push Notification Opens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#1677F2]" />
              <h4 className="font-bold text-sm text-slate-900">App Customer Followers</h4>
            </div>
            <Badge variant="primary" size="sm">Active Audience</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {metrics?.followers?.toLocaleString() || '860'}
            </span>
            <span className="text-xs text-slate-500">customers following {tenantId}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Customers who followed your business in Mana Calendar 2027 receive quick calendar bookmarking and festival offers.
          </p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-amber-500" />
              <h4 className="font-bold text-sm text-slate-900">Notification Engagement</h4>
            </div>
            <Badge variant="warning" size="sm">Premium Feature</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {metrics?.notificationOpens?.toLocaleString() || '312'}
            </span>
            <span className="text-xs text-slate-500">festival push notifications opened</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Average open rate: <strong>66.1%</strong> across Telugu push alerts sent on Ugadi and Diwali.
          </p>
        </Card>
      </div>

      {/* Visual Chart Graphic */}
      <Card title={`Engagement Trend (${timeframeLabels[timeframe]})`} padding="md">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="h-44 flex items-end justify-between gap-2 px-4 pt-6">
            {[45, 62, 58, 80, 95, 88, 110, 125, 115, 140, 130, 160].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className="w-full bg-[#1677F2] rounded-t-md hover:bg-blue-600 transition-all cursor-pointer relative group"
                  style={{ height: `${(val / 160) * 100}%` }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {val * 12} Views
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  W{idx + 1}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200">
            <span>📅 Periodic Trend in {timeframeLabels[timeframe]}</span>
            <span className="font-semibold text-slate-800">Total Impressions Recorded: {metrics?.totalImpressions.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      {/* Campaign-Level Performance Breakdown */}
      <Card title="Campaign-Level Performance Breakdown" subtitle="Detailed views, clicks, and CTR per promotion" padding="md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Campaign Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Dates</th>
                <th className="py-2.5 px-3 text-right">Impressions</th>
                <th className="py-2.5 px-3 text-right">Clicks</th>
                <th className="py-2.5 px-3 text-right">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaignBreakdown.map((camp) => (
                <tr key={camp.campaignId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {camp.campaignTitle}
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={camp.status === 'active' ? 'success' : 'neutral'} size="sm">
                      {camp.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {camp.startDate} to {camp.endDate}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-800">
                    {camp.impressions.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700">
                    {camp.clicks.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#1677F2]">
                    {camp.ctr}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Privacy Guarantee Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
        <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
        <div className="text-xs text-slate-600">
          <strong>Privacy & Non-PII Compliance: </strong> All telemetry metrics in Mana Calendar 2027 are aggregated and anonymized. No customer telephone numbers, device identifiers, or personally identifiable information are stored in business analytics.
        </div>
      </div>
    </div>
  );
};
