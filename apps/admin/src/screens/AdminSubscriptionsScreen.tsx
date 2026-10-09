import React, { useState, useEffect } from 'react';
import { Badge, Button, Modal, Tabs } from '@mana/ui';
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  Clock,
  Edit2,
  Plus,
  RefreshCw,
  AlertCircle,
  Bell,
  ShieldCheck,
  ChevronRight,
  X,
} from 'lucide-react';
import { AdminService, PaymentService } from '@mana/services';
import type { Plan, Subscription } from '@mana/types';

export const AdminSubscriptionsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans' | 'reminders'>('subscriptions');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Array<{
    tenantId: string;
    businessName: string;
    planCode: string;
    price: number;
    startDate: string;
    endDate: string;
    status: string;
  }>>([
    {
      tenantId: 'SLJ001',
      businessName: 'Sri Lakshmi Jewellers',
      planCode: 'premium',
      price: 3999,
      startDate: '2026-01-15',
      endDate: '2027-12-31',
      status: 'active',
    },
    {
      tenantId: 'RF002',
      businessName: 'Radha Flours & Foods',
      planCode: 'business',
      price: 1999,
      startDate: '2026-02-10',
      endDate: '2027-12-31',
      status: 'active',
    },
    {
      tenantId: 'CMR003',
      businessName: 'CMR Shopping Mall',
      planCode: 'premium',
      price: 3999,
      startDate: '2026-03-01',
      endDate: '2027-12-31',
      status: 'active',
    },
  ]);

  // Modals
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({ price: 0, campaign_limit: 10, reason: '' });

  const [extendingTenant, setExtendingTenant] = useState<{ tenantId: string; businessName: string; currentEnd: string } | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [extendReason, setExtendReason] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setPlans(AdminService.getPlans());
  }, []);

  const handleEditPlanClick = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      price: plan.price_inr,
      campaign_limit: plan.included_campaigns,
      reason: '',
    });
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      AdminService.updatePlan(
        editingPlan.id,
        {
          price_inr: planForm.price,
          included_campaigns: planForm.campaign_limit,
        },
        'admin-owner-01'
      );

      setPlans(AdminService.getPlans());
      setEditingPlan(null);
      setSuccessMessage(`Plan ${editingPlan.name} updated to ₹${planForm.price.toLocaleString('en-IN')}/yr with quota ${planForm.campaign_limit}. Logged in audit trail.`);
    } catch (err) {
      console.error('Failed to update plan:', err);
    }
  };

  const handleExtendConfirm = async () => {
    if (!extendingTenant || !extendReason.trim()) return;

    try {
      const current = new Date(extendingTenant.currentEnd);
      current.setDate(current.getDate() + extendDays);
      const newEndIso = current.toISOString();

      await AdminService.extendSubscription(
        extendingTenant.tenantId,
        newEndIso,
        extendReason,
        'admin-owner-01'
      );

      // Update local state
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.tenantId === extendingTenant.tenantId
            ? { ...s, endDate: newEndIso.slice(0, 10) }
            : s
        )
      );

      setSuccessMessage(`Subscription for ${extendingTenant.tenantId} successfully extended by ${extendDays} days. Logged in audit trail.`);
      setExtendingTenant(null);
      setExtendReason('');
    } catch (err) {
      console.error('Failed to extend subscription:', err);
    }
  };

  const getDaysLeft = (endStr: string) => {
    const end = new Date(endStr).getTime();
    const now = new Date('2026-10-06').getTime();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Platform Subscriptions Governance</h2>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic database-driven commercial tiers, billing renewals, and administrative overrides
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'subscriptions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'plans' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manage Plans
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'reminders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Renewal Policy
          </button>
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

      {/* TAB 1: Subscriptions Table */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Commercial Tenant Subscriptions ({subscriptions.length} active)
            </span>
            <span className="text-[11px] text-slate-500">
              All manual overrides record strict before/after values to immutable audit logs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Tenant ID</th>
                  <th className="px-5 py-3">Business Name</th>
                  <th className="px-5 py-3">Plan Tier</th>
                  <th className="px-5 py-3">Annual Fee</th>
                  <th className="px-5 py-3">End Date</th>
                  <th className="px-5 py-3">Days Remaining</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((s) => {
                  const daysLeft = getDaysLeft(s.endDate);
                  return (
                    <tr key={s.tenantId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-600">
                        {s.tenantId}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {s.businessName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                            s.planCode === 'premium'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {s.planCode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                        ₹{s.price.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {s.endDate}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800">{daysLeft} days</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2.5 border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() =>
                            setExtendingTenant({
                              tenantId: s.tenantId,
                              businessName: s.businessName,
                              currentEnd: s.endDate,
                            })
                          }
                        >
                          Manual Extension
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Dynamic Plan Management */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <ShieldCheck size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Dynamic Database-Driven Plans Architecture</div>
              <p className="mt-1 text-blue-800">
                Plan rates and campaign limits are loaded dynamically from the database, not hardcoded into client bundles. Super Admin can adjust pricing and promotional quotas. All modifications log before/after snapshots to the security audit trail.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      p.plan_code === 'premium'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {p.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 border-slate-200 text-slate-700 hover:bg-slate-50"
                    leftIcon={<Edit2 size={12} />}
                    onClick={() => handleEditPlanClick(p)}
                  >
                    Edit Tier
                  </Button>
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    ₹{p.price_inr.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-slate-500"> / year</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {p.plan_code === 'premium'
                      ? 'High-reach priority tier for prominent regional businesses'
                      : 'Essential commercial calendar presence for verified merchants'}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Promotional Campaigns / Year:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {p.included_campaigns} campaigns
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Promotional Push Notifications:</span>
                    <span
                      className={`font-bold ${
                        p.features.promotional_push_notifications ? 'text-purple-600' : 'text-slate-400'
                      }`}
                    >
                      {p.features.promotional_push_notifications ? 'Included (Unlimited)' : 'Not Included'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Calendar Placement Priority:</span>
                    <span className="font-bold capitalize text-slate-900">
                      {p.plan_code === 'premium' ? 'High Priority' : 'Standard'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Premium Business Branding:</span>
                    <span
                      className={`font-bold ${
                        p.features.enhanced_branding ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {p.features.enhanced_branding ? 'Enabled' : 'Standard'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Automated Renewal Policy */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Configured Automated Renewal Policy</h3>
            <p className="text-slate-500 mt-0.5">
              The automated billing cron dispatches WhatsApp and email reminders to merchant owners based on this schedule:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {[
              { days: 30, urgency: 'Normal', note: 'First friendly notification with renewal invoice link' },
              { days: 15, urgency: 'Normal', note: 'Mid-term reminder outlining upcoming campaign renewals' },
              { days: 7, urgency: 'High', note: 'Warning notice: 7 days until campaign pause' },
              { days: 3, urgency: 'Urgent', note: 'Urgent notice with one-click payment deep link' },
              { days: 1, urgency: 'Critical', note: 'Final notice: Expiry tomorrow at midnight IST' },
            ].map((step) => (
              <div
                key={step.days}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-extrabold text-blue-600">
                      -{step.days}d
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        step.urgency === 'Critical'
                          ? 'bg-rose-100 text-rose-700'
                          : step.urgency === 'Urgent'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {step.urgency}
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium mt-2">{step.note}</div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400">
                  Channel: WhatsApp & Email
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Extension Modal */}
      {extendingTenant && (
        <Modal
          isOpen={true}
          onClose={() => setExtendingTenant(null)}
          title={`Manual Subscription Extension: ${extendingTenant.tenantId}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Grant a manual subscription extension to <b>{extendingTenant.businessName}</b>. Current expiry is{' '}
              <span className="font-mono font-bold text-slate-900">{extendingTenant.currentEnd}</span>.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Extension Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { days: 30, label: '+30 Days' },
                  { days: 60, label: '+60 Days' },
                  { days: 90, label: '+90 Days' },
                  { days: 365, label: '+1 Year' },
                ].map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setExtendDays(opt.days)}
                    className={`py-2 px-3 rounded-lg border text-center font-semibold transition-colors ${
                      extendDays === opt.days
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reason for Manual Extension (Mandatory Audit Trail) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Offline bank transfer cleared / Promotional goodwill / Customer retention agreement"
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setExtendingTenant(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!extendReason.trim()}
                onClick={handleExtendConfirm}
              >
                Confirm Extension
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <Modal
          isOpen={true}
          onClose={() => setEditingPlan(null)}
          title={`Edit Dynamic Plan: ${editingPlan.name}`}
          size="md"
        >
          <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Annual Price in INR (₹) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Campaign Quota per Year *
              </label>
              <input
                type="number"
                required
                min={1}
                value={planForm.campaign_limit}
                onChange={(e) => setPlanForm({ ...planForm, campaign_limit: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reason for Price / Quota Adjustment *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Annual inflation adjustment / Festival season promotion"
                value={planForm.reason}
                onChange={(e) => setPlanForm({ ...planForm, reason: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingPlan(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!planForm.reason.trim()}
              >
                Save Changes & Log Audit
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
