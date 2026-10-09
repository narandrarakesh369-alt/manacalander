import React, { useState } from 'react';
import { Badge, Button } from '@mana/ui';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  CreditCard,
  Smartphone,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  Download,
} from 'lucide-react';

export const AdminAnalyticsScreen: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'ytd' | '2027'>('30d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Platform-Wide Telemetry & Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated commercial performance, Android customer reach, and regional distribution
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
            {[
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'ytd', label: 'Year to Date' },
              { id: '2027', label: 'All 2027' },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeframe === tf.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="md"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
            leftIcon={<Download size={14} />}
            onClick={() => alert('Exporting platform CSV analytics report...')}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Customer Installs</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Smartphone size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">48,250</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1 font-medium">
            <TrendingUp size={12} />
            <span>+14.2% vs previous period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Annual Platform ARR</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CreditCard size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">₹9,997</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1 font-medium">
            <TrendingUp size={12} />
            <span>3 active annual tenant contracts</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Promotional Impressions</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Eye size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">14,280</div>
          <div className="flex items-center gap-1 text-[11px] text-purple-600 mt-1 font-medium">
            <span>Calendar banner slots</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Promotional CTR</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <MousePointerClick size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">3.00%</div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <span>428 verified tenant leads</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Engagement */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              Customer Engagement & App Telemetry
            </h3>
            <span className="text-[11px] font-mono text-slate-400">ANDROID-METRICS</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span className="text-slate-600">Daily Active Users (DAU):</span>
              <span className="font-bold text-slate-900 font-mono">18,400</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span className="text-slate-600">Monthly Active Users (MAU):</span>
              <span className="font-bold text-slate-900 font-mono">42,100</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span className="text-slate-600">DAU / MAU Stickiness Ratio:</span>
              <span className="font-bold text-emerald-600 font-mono">43.7%</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span className="text-slate-600">Avg Daily Session Length:</span>
              <span className="font-bold text-slate-900 font-mono">4.2 minutes</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-600">Push Notification Permission Rate:</span>
              <span className="font-bold text-purple-600 font-mono">84.2%</span>
            </div>
          </div>
        </div>

        {/* Regional Audience Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MapPin size={16} className="text-rose-500" />
              Geographic Concentration (Andhra Pradesh & Telangana)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">GEO-DIST</span>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { city: 'Visakhapatnam (HQ)', percentage: 48, count: '23,160 users', color: 'bg-blue-600' },
              { city: 'Vijayawada & Guntur', percentage: 24, count: '11,580 users', color: 'bg-emerald-500' },
              { city: 'Hyderabad Metropolitan', percentage: 18, count: '8,685 users', color: 'bg-purple-500' },
              { city: 'Tirupati & Rayalaseema', percentage: 10, count: '4,825 users', color: 'bg-amber-500' },
            ].map((reg) => (
              <div key={reg.city} className="space-y-1">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>{reg.city}</span>
                  <span className="font-mono">{reg.percentage}% ({reg.count})</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${reg.color} h-full rounded-full`}
                    style={{ width: `${reg.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commercial Tenant Leaderboard */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden text-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="font-semibold text-slate-700">
            Tenant Performance & Campaign Telemetry Leaderboard
          </span>
          <span className="text-[11px] text-slate-500">Sorted by lead conversion volume</span>
        </div>

        <table className="w-full text-left text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Tenant ID</th>
              <th className="px-5 py-3">Business Name</th>
              <th className="px-5 py-3">Plan</th>
              <th className="px-5 py-3">Impressions</th>
              <th className="px-5 py-3">Clicks</th>
              <th className="px-5 py-3">CTR</th>
              <th className="px-5 py-3">Revenue Contribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50/70 transition-colors">
              <td className="px-5 py-3.5 font-mono font-bold text-blue-600">SLJ001</td>
              <td className="px-5 py-3.5 font-semibold text-slate-900">Sri Lakshmi Jewellers</td>
              <td className="px-5 py-3.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                  Premium
                </span>
              </td>
              <td className="px-5 py-3.5 font-mono font-semibold">8,420</td>
              <td className="px-5 py-3.5 font-mono font-bold text-blue-600">342</td>
              <td className="px-5 py-3.5 font-mono font-bold text-emerald-600">4.06%</td>
              <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">₹3,999</td>
            </tr>
            <tr className="hover:bg-slate-50/70 transition-colors">
              <td className="px-5 py-3.5 font-mono font-bold text-blue-600">RF002</td>
              <td className="px-5 py-3.5 font-semibold text-slate-900">Radha Flours & Foods</td>
              <td className="px-5 py-3.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  Business
                </span>
              </td>
              <td className="px-5 py-3.5 font-mono font-semibold">3,120</td>
              <td className="px-5 py-3.5 font-mono font-bold text-blue-600">86</td>
              <td className="px-5 py-3.5 font-mono font-bold text-emerald-600">2.76%</td>
              <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">₹1,999</td>
            </tr>
            <tr className="hover:bg-slate-50/70 transition-colors">
              <td className="px-5 py-3.5 font-mono font-bold text-blue-600">CMR003</td>
              <td className="px-5 py-3.5 font-semibold text-slate-900">CMR Shopping Mall</td>
              <td className="px-5 py-3.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                  Premium
                </span>
              </td>
              <td className="px-5 py-3.5 font-mono font-semibold">2,740</td>
              <td className="px-5 py-3.5 font-mono font-bold text-blue-600">0 (Scheduled)</td>
              <td className="px-5 py-3.5 font-mono text-slate-400">N/A</td>
              <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">₹3,999</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
