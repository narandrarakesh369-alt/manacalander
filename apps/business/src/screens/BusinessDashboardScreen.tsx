import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '@mana/ui';
import { useAuth, CampaignService, AnalyticsService, BusinessService } from '@mana/services';
import {
  Megaphone,
  QrCode,
  TrendingUp,
  CreditCard,
  Building2,
  Users,
  Eye,
  MousePointerClick,
  Sparkles,
  Upload,
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { CampaignUsage, TenantAnalyticsSummary, BusinessProfile, Campaign } from '@mana/types';

export const BusinessDashboardScreen: React.FC = () => {
  const { businessId } = useAuth();
  const navigate = useNavigate();
  const tenantId = (businessId || 'SLJ001').toUpperCase();

  const [usage, setUsage] = useState<CampaignUsage | null>(null);
  const [metrics, setMetrics] = useState<TenantAnalyticsSummary | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    CampaignService.getCampaignUsage(tenantId, 2027).then(setUsage);
    AnalyticsService.getTenantAnalytics(tenantId, '30d').then(setMetrics);
    BusinessService.getBusinessProfile(tenantId).then(setProfile);
    CampaignService.getActiveCampaignsForBusiness(tenantId).then(setActiveCampaigns);
  }, [tenantId]);

  const isPremium = tenantId === 'SLJ001' || tenantId === 'CMR003';
  const businessName =
    profile?.company_name ||
    (tenantId === 'SLJ001'
      ? 'Sri Lakshmi Jewellery'
      : tenantId === 'RF002'
      ? 'Radha Flours & Foods'
      : tenantId);

  const totalAllowed = (usage?.included_campaigns_total || 10) + (usage?.extra_campaigns_purchased || 0);
  const totalUsed = (usage?.included_campaigns_used || 6) + (usage?.extra_campaigns_used || 0);
  const remainingCredits = Math.max(0, totalAllowed - totalUsed);

  const currentCampaign = activeCampaigns[0] || {
    id: 'DIWALI2027',
    title: 'Diwali Swarna Utsavam — 0% Making Charges',
    description: 'Special Diwali 2027 offer on all 916 BIS Hallmarked bridal necklace sets & antique gold ornaments.',
    start_date: '2026-10-01',
    end_date: '2027-11-30',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
    cta_text: 'View Diwali Collection',
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* 1. TOP HEADER & TENANT PLAN BANNER (Section 23) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          {profile?.logo ? (
            <img
              src={profile.logo}
              alt={businessName}
              className="w-16 h-16 rounded-[14px] object-cover border border-[#E2E8F0] shadow-xs"
            />
          ) : (
            <div className="w-16 h-16 rounded-[14px] bg-[#EAF3FF] text-[#1677F2] flex items-center justify-center font-bold text-2xl border border-[#BFDBFE]">
              {tenantId.slice(0, 2)}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[24px] font-bold text-[#0F172A] tracking-tight">
                {businessName}
              </h1>
              <span className="font-mono text-xs font-bold text-[#1677F2] bg-[#EAF3FF] px-2.5 py-0.5 rounded-full">
                ID: {tenantId}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] bg-[#ECFDF3] border border-[#D1FADF] px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Active Tenant
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1 font-medium">
              Mana Calendar 2027 Partner • {profile?.city || 'Visakhapatnam'}, {profile?.state || 'Andhra Pradesh'}
            </p>
          </div>
        </div>

        {/* Plan Card */}
        <div className="flex items-center gap-4 bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-[12px]">
          <div>
            <span className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider block">
              Active Plan
            </span>
            <div className="text-sm font-bold text-[#0F172A]">
              {isPremium ? 'Premium Plan' : 'Business Plan'}
            </div>
            <div className="text-xs font-semibold text-[#1677F2]">
              {isPremium ? '₹3,999 / year' : '₹1,999 / year'}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/business/subscription')}
          >
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* 2. CAMPAIGN USAGE (Section 23: 6 / 10 Campaigns Used, 4 Remaining) */}
      <Card padding="lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#1677F2]" />
              <h3 className="font-bold text-base text-[#0F172A]">
                Annual Promotional Campaign Usage (2027)
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-1 max-w-xl leading-relaxed">
              Plan includes 10 annual promotional campaigns placed inside the customer calendar.
              Extra campaigns can be purchased for ₹299 each. Deleting a campaign does not restore quota.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-3xl font-black text-[#0F172A]">
                {totalUsed} / {totalAllowed}
              </span>
              <span className="text-xs text-[#64748B] font-medium block">Campaigns Used</span>
            </div>
            <div className="text-right border-l border-[#E2E8F0] pl-6">
              <span className="text-3xl font-black text-[#16A34A]">
                {remainingCredits}
              </span>
              <span className="text-xs text-[#64748B] font-medium block">Remaining Credits</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-[#EEF2F7] rounded-full h-3 overflow-hidden">
          <div
            className="bg-[#1677F2] h-3 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (totalUsed / (totalAllowed || 10)) * 100)}%`,
            }}
          />
        </div>
      </Card>

      {/* 3. KPI CARDS (Section 23: Profile Views, Banner Impressions, Campaign Clicks, QR Scans) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Views */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[12px] font-bold uppercase tracking-wider">Profile Views</span>
            <div className="w-9 h-9 rounded-full bg-[#EAF3FF] text-[#1677F2] flex items-center justify-center">
              <Building2 size={18} strokeWidth={2} />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold text-[#0F172A] leading-tight">
            {metrics?.profileViews?.toLocaleString() || '1,420'}
          </div>
          <span className="text-xs text-[#16A34A] font-semibold mt-1 inline-block">
            +18% from last month
          </span>
        </div>

        {/* Banner Impressions */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[12px] font-bold uppercase tracking-wider">Banner Impressions</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Eye size={18} strokeWidth={2} />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold text-[#0F172A] leading-tight">
            {metrics?.totalImpressions?.toLocaleString() || '4,820'}
          </div>
          <span className="text-xs text-[#16A34A] font-semibold mt-1 inline-block">
            Calendar view placements
          </span>
        </div>

        {/* Campaign Clicks */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[12px] font-bold uppercase tracking-wider">Campaign Clicks</span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <MousePointerClick size={18} strokeWidth={2} />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold text-[#0F172A] leading-tight">
            {metrics?.totalClicks?.toLocaleString() || '342'}
          </div>
          <span className="text-xs text-[#64748B] font-medium mt-1 inline-block">
            CTR: {metrics?.ctr || 7.09}%
          </span>
        </div>

        {/* QR Scans */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[12px] font-bold uppercase tracking-wider">QR Scans</span>
            <div className="w-9 h-9 rounded-full bg-amber-50 text-[#F59E0B] flex items-center justify-center">
              <QrCode size={18} strokeWidth={2} />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold text-[#0F172A] leading-tight">
            {metrics?.qrScans || '118'}
          </div>
          <span className="text-xs text-amber-700 font-semibold mt-1 inline-block">
            Retail counter scans
          </span>
        </div>
      </div>

      {/* 4. CURRENT CAMPAIGN CARD & QUICK ACTIONS (Section 23) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Campaign Card (Takes 2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between pb-4 border-b border-[#EEF2F7]">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-[#1677F2]" />
              <h3 className="font-bold text-base text-[#0F172A]">
                Current Active Campaign
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] bg-[#ECFDF3] border border-[#D1FADF] px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              Live on Calendar
            </span>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start">
            {currentCampaign.image_url && (
              <img
                src={currentCampaign.image_url}
                alt={currentCampaign.title}
                className="w-full sm:w-48 h-32 rounded-[12px] object-cover border border-[#E2E8F0]"
              />
            )}
            <div className="flex-1">
              <h4 className="text-base font-bold text-[#0F172A]">
                {currentCampaign.title}
              </h4>
              <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
                {currentCampaign.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate('/business/campaigns')}
                >
                  Manage All Campaigns
                </Button>
                <button
                  onClick={() => navigate(`/campaigns/${currentCampaign.id}`)}
                  className="text-xs text-[#1677F2] font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Preview as Customer</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions (Section 23: Create Campaign, Upload Banner, View Analytics, Download QR) */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.05)] space-y-3">
          <h3 className="font-bold text-base text-[#0F172A] pb-3 border-b border-[#EEF2F7]">
            Quick Actions
          </h3>

          <button
            onClick={() => navigate('/business/campaigns')}
            className="w-full p-3 rounded-[12px] bg-[#F8FAFC] hover:bg-[#EAF3FF] hover:border-[#1677F2] border border-[#E2E8F0] flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#1677F2] text-white flex items-center justify-center shadow-xs">
                <Megaphone size={17} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#1677F2]">
                  Create Campaign
                </div>
                <div className="text-[11px] text-[#64748B]">Launch a festival offer</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#94A3B8] group-hover:text-[#1677F2]" />
          </button>

          <button
            onClick={() => navigate('/business/media')}
            className="w-full p-3 rounded-[12px] bg-[#F8FAFC] hover:bg-[#EAF3FF] hover:border-[#1677F2] border border-[#E2E8F0] flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-blue-100 text-[#1677F2] flex items-center justify-center">
                <Upload size={17} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#1677F2]">
                  Upload Banner
                </div>
                <div className="text-[11px] text-[#64748B]">Add creatives & photos</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#94A3B8] group-hover:text-[#1677F2]" />
          </button>

          <button
            onClick={() => navigate('/business/analytics')}
            className="w-full p-3 rounded-[12px] bg-[#F8FAFC] hover:bg-[#EAF3FF] hover:border-[#1677F2] border border-[#E2E8F0] flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-emerald-100 text-[#16A34A] flex items-center justify-center">
                <BarChart3 size={17} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#1677F2]">
                  View Analytics
                </div>
                <div className="text-[11px] text-[#64748B]">Audience & CTR metrics</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#94A3B8] group-hover:text-[#1677F2]" />
          </button>

          <button
            onClick={() => navigate('/business/qr')}
            className="w-full p-3 rounded-[12px] bg-[#F8FAFC] hover:bg-[#EAF3FF] hover:border-[#1677F2] border border-[#E2E8F0] flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-amber-100 text-amber-700 flex items-center justify-center">
                <Download size={17} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#1677F2]">
                  Download QR
                </div>
                <div className="text-[11px] text-[#64748B]">Print desk sticker & badge</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#94A3B8] group-hover:text-[#1677F2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
