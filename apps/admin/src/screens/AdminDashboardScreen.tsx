import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '@mana/ui';
import { AdminService } from '@mana/services';
import type { SuperAdminDashboardMetrics, Business } from '@mana/types';
import {
  Building2,
  CreditCard,
  Megaphone,
  Users,
  ShieldCheck,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  DollarSign,
  Bell,
  Eye,
  MousePointerClick,
  Plus,
  ExternalLink,
} from 'lucide-react';

export const AdminDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<SuperAdminDashboardMetrics | null>(null);
  const [recentBusinesses, setRecentBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    const m = AdminService.getDashboardMetrics();
    setMetrics(m);
    AdminService.listBusinesses().then((biz) => setRecentBusinesses(biz.slice(0, 4)));
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Governance Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              System Health: Operational • 99.98% Uptime
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] mt-1">
            Super Admin Control Center • Mana Calendar 2027
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Unified ecosystem management across Andhra Pradesh & Telangana
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/businesses')}
            leftIcon={<Building2 size={16} />}
          >
            Manage Businesses
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/audit-logs')}
            leftIcon={<ShieldCheck size={16} />}
          >
            Audit Security Logs
          </Button>
        </div>
      </div>

      {/* 2. Top-Level Ecosystem Metrics (12 KPI requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Businesses */}
        <Card padding="md" className="border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Tenants</span>
            <Building2 size={18} className="text-[#1677F2]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0F172A]">
            {metrics?.totalBusinesses || 4}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <span>{metrics?.activeBusinesses} Active</span>
            <span>•</span>
            <span className="text-blue-600">+{metrics?.newBusinessesMonth} New this month</span>
          </div>
        </Card>

        {/* Total Customers */}
        <Card padding="md" className="border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Customers</span>
            <Users size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0F172A]">
            {metrics?.totalCustomers.toLocaleString() || '14,820'}
          </div>
          <span className="mt-1 block text-[11px] text-[#64748B]">
            Shared Android Application Users
          </span>
        </Card>

        {/* Subscription Revenue */}
        <Card padding="md" className="border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Net Revenue</span>
            <DollarSign size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ₹{metrics?.netRevenue.toLocaleString() || '90,926'}
          </div>
          <span className="mt-1 block text-[11px] text-[#64748B]">
            Sub: ₹{metrics?.subscriptionRevenue.toLocaleString()} • Boosters: ₹{metrics?.campaignRevenue.toLocaleString()}
          </span>
        </Card>

        {/* Campaign Impressions */}
        <Card padding="md" className="border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Campaign Impressions</span>
            <Eye size={18} className="text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {metrics?.totalImpressions.toLocaleString() || '184,200'}
          </div>
          <span className="mt-1 block text-[11px] text-purple-700 font-medium">
            {metrics?.totalClicks.toLocaleString()} Clicks (CTR: {metrics?.ctr}%)
          </span>
        </Card>
      </div>

      {/* 3. Secondary Tier & Feature Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tier Distribution */}
        <Card title="Subscription Tiers" padding="md">
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Badge variant="primary" size="sm">PREMIUM</Badge> ₹3,999/yr
              </span>
              <span className="font-bold text-slate-900">{metrics?.premiumBusinesses} Businesses</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-[#1677F2] h-2 rounded-full w-3/4" />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Badge variant="neutral" size="sm">BUSINESS</Badge> ₹1,999/yr
              </span>
              <span className="font-bold text-slate-900">{metrics?.businessPlanBusinesses} Businesses</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-slate-500 h-2 rounded-full w-1/4" />
            </div>
          </div>
        </Card>

        {/* Push Notification Activity */}
        <Card title="Push Notification Operations" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {metrics?.notificationUsage.toLocaleString() || '38,400'}
              </div>
              <span className="text-xs text-slate-500">Alerts Delivered in 2027</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            FCM push alerts dispatched across Telugu Panchangam festival dates and premium retail campaigns.
          </p>
        </Card>

        {/* Campaign Moderation Queue */}
        <Card title="Campaign Operations" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                {metrics?.activeCampaigns || 18} Active
              </div>
              <span className="text-xs text-slate-500">Live Promotional Banners</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Megaphone size={20} />
            </div>
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/admin/campaigns')}
            >
              Open Campaign Moderation
            </Button>
          </div>
        </Card>
      </div>

      {/* 4. Ecosystem Growth Velocity & Quick Action Menu (Section 27) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Growth Velocity Card */}
        <Card title="Ecosystem Growth Velocity" subtitle="Month-over-month performance" padding="md" className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Tenant Growth</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={13} /> +25%
                </span>
              </div>
              <div className="text-lg font-bold text-[#0F172A] mt-1">+12 Tenants</div>
              <div className="w-full bg-blue-100 rounded-full h-1.5 mt-2">
                <div className="bg-[#1677F2] h-1.5 rounded-full w-3/4" />
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Customer Installs</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={13} /> +42%
                </span>
              </div>
              <div className="text-lg font-bold text-[#0F172A] mt-1">+4,380 App Users</div>
              <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-2">
                <div className="bg-emerald-600 h-1.5 rounded-full w-4/5" />
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Net Revenue Run Rate</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={13} /> +38%
                </span>
              </div>
              <div className="text-lg font-bold text-[#0F172A] mt-1">₹90,926 ARR</div>
              <div className="w-full bg-amber-100 rounded-full h-1.5 mt-2">
                <div className="bg-amber-500 h-1.5 rounded-full w-2/3" />
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Action Menu */}
        <Card title="Quick Governance Actions" subtitle="One-click admin shortcuts" padding="md">
          <div className="space-y-2 mt-1">
            <button
              onClick={() => navigate('/admin/businesses')}
              className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-[#1677F2] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Building2 size={14} className="text-[#1677F2]" />
                Register New Business Tenant
              </span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => navigate('/admin/campaigns')}
              className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Megaphone size={14} className="text-emerald-600" />
                Moderate Retail Campaigns
              </span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => navigate('/admin/panchangam')}
              className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Calendar size={14} className="text-amber-600" />
                Verify Panchangam Tithis
              </span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => navigate('/admin/audit-logs')}
              className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-purple-600" />
                Review Immutable Audit Logs
              </span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </button>
          </div>
        </Card>
      </div>

      {/* 5. Recent Businesses Table */}
      <Card
        title="Recent Platform Tenants"
        subtitle="Manage status, plans, and verify retail merchants"
        padding="md"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/businesses')}
            leftIcon={<Plus size={14} />}
          >
            Add New Business
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-2.5 px-3">Tenant ID</th>
                <th className="py-2.5 px-3">Business Name</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBusinesses.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#1677F2]">{b.business_id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{b.name}</td>
                  <td className="py-3 px-3 text-slate-600">{b.owner_name}</td>
                  <td className="py-3 px-3">
                    <Badge variant={b.plan_code === 'premium' ? 'primary' : 'neutral'} size="sm">
                      {(b.plan_code || 'standard').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={
                        b.status === 'active'
                          ? 'success'
                          : b.status === 'suspended'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {b.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin/businesses')}
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6. Recent Platform Payments (Section 27) */}
      <Card
        title="Recent Platform Payments & Invoices"
        subtitle="Gateway-verified subscription and campaign booster transactions"
        padding="md"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/payments')}
            leftIcon={<DollarSign size={14} />}
          >
            View All Payments
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Tenant / Business</th>
                <th className="py-2.5 px-3">Plan / Purpose</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                {
                  id: 'pay_rzp_994101',
                  tenant: 'SLJ001 - Sri Lakshmi Jewellers',
                  purpose: 'Premium Plan (1 Year)',
                  amount: 3999,
                  provider: 'Razorpay UPI',
                  date: '2026-01-15 14:32',
                  status: 'success',
                },
                {
                  id: 'pay_rzp_994102',
                  tenant: 'RF002 - Radha Flours & Foods',
                  purpose: 'Business Plan (1 Year)',
                  amount: 1999,
                  provider: 'Razorpay NetBanking',
                  date: '2026-02-10 11:20',
                  status: 'success',
                },
                {
                  id: 'pay_phn_882031',
                  tenant: 'CMR003 - CMR Shopping Mall',
                  purpose: 'Premium Plan (1 Year)',
                  amount: 3999,
                  provider: 'PhonePe QR',
                  date: '2026-03-01 16:45',
                  status: 'success',
                },
                {
                  id: 'pay_rzp_994104',
                  tenant: 'SLJ001 - Sri Lakshmi Jewellers',
                  purpose: 'Extra Campaign Booster (1 Credit)',
                  amount: 299,
                  provider: 'Razorpay UPI',
                  date: '2026-03-25 09:12',
                  status: 'success',
                },
              ].map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-slate-700">{p.id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{p.tenant}</td>
                  <td className="py-3 px-3 text-slate-600">{p.purpose}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">₹{p.amount.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-500">{p.provider}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{p.date}</td>
                  <td className="py-3 px-3 text-right">
                    <Badge variant="success" size="sm">
                      SUCCESS
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
