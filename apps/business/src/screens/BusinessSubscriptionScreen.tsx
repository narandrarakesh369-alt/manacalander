import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '@mana/ui';
import { useAuth, PaymentService, CampaignService } from '@mana/services';
import { PLANS_CONFIG } from '@mana/config';
import type { Subscription, Payment, CampaignUsage } from '@mana/types';
import {
  Check,
  ShieldCheck,
  Zap,
  AlertCircle,
  FileText,
  CreditCard,
  Download,
  Sparkles,
  CheckCircle2,
  Calendar,
  Building2,
} from 'lucide-react';

export const BusinessSubscriptionScreen: React.FC = () => {
  const { businessId } = useAuth();
  const tenantId = (businessId || 'SLJ001').toUpperCase();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [usage, setUsage] = useState<CampaignUsage | null>(null);
  const [loading, setLoading] = useState(true);

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

  // Invoice Receipt Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);

  const loadData = async () => {
    try {
      const [sub, pays, u] = await Promise.all([
        PaymentService.getBusinessSubscription(tenantId),
        PaymentService.getPaymentHistory(tenantId),
        CampaignService.getCampaignUsage(tenantId, 2027),
      ]);
      setSubscription(sub);
      setPayments(pays);
      setUsage(u);
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const isPremium = subscription?.plan_id === 'plan-premium' || tenantId === 'SLJ001';

  const handleUpgradeToPremium = async () => {
    setIsUpgrading(true);
    try {
      const res = await PaymentService.upgradeSubscription(tenantId, 'premium', 'UPI / Razorpay');
      setUpgradeSuccess('Congratulations! Upgraded to Premium Plan (₹3,999/yr) successfully.');
      setTimeout(() => {
        setIsUpgradeModalOpen(false);
        setUpgradeSuccess(null);
      }, 1500);
      await loadData();
    } catch (err: any) {
      alert('Upgrade failed: ' + err.message);
    } finally {
      setIsUpgrading(false);
    }
  };

  const totalAllowed = (usage?.included_campaigns_total || 10) + (usage?.extra_campaigns_purchased || 0);
  const totalUsed = (usage?.included_campaigns_used || 0) + (usage?.extra_campaigns_used || 0);
  const remainingCredits = Math.max(0, totalAllowed - totalUsed);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Subscription & Billing</h2>
          <p className="text-xs text-[#64748B]">
            Tenant: {tenantId} • Annual Commercial Membership for Mana Calendar 2027
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPremium ? 'primary' : 'neutral'} size="md">
            {isPremium ? 'PREMIUM PLAN (₹3,999/yr)' : 'BUSINESS PLAN (₹1,999/yr)'}
          </Badge>
          <Badge variant="success" size="md">
            Status: ACTIVE
          </Badge>
        </div>
      </div>

      {/* Subscription Status Card */}
      <Card padding="md" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#1677F2] uppercase tracking-wider">
              Active Subscription Details
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              {isPremium ? PLANS_CONFIG.PREMIUM.name : PLANS_CONFIG.BUSINESS.name}
            </h3>
            <p className="text-xs text-slate-600">
              Valid: <strong className="font-mono">01-Jan-2027</strong> through <strong className="font-mono">31-Dec-2027</strong> • Auto-renewal active
            </p>
          </div>

          {!isPremium && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsUpgradeModalOpen(true)}
              leftIcon={<Sparkles size={16} />}
            >
              Upgrade to Premium
            </Button>
          )}
        </div>
      </Card>

      {/* Quota Usage Breakdown */}
      <Card title="Campaign Credit Quota Breakdown (2027)" padding="md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Included in Plan</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">10 Campaigns</div>
            <span className="text-[11px] text-slate-400">Annual Quota</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Campaigns Used</span>
            <div className="text-2xl font-bold text-amber-800 mt-1">{totalUsed} Campaigns</div>
            <span className="text-[11px] text-slate-400">Scheduled / Published</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Credits Remaining</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{remainingCredits} Campaigns</div>
            <span className="text-[11px] text-slate-400">Ready to use</span>
          </div>
        </div>
      </Card>

      {/* Plan Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Plan */}
        <Card padding="lg" className={`border-2 ${!isPremium ? 'border-[#1677F2]' : 'border-[#E2E8F0]'}`}>
          {!isPremium && (
            <div className="mb-2">
              <Badge variant="primary" size="sm">Your Current Plan</Badge>
            </div>
          )}
          <div>
            <Badge variant="neutral" size="sm">Standard Commercial</Badge>
            <h3 className="text-lg font-bold text-[#0F172A] mt-2">{PLANS_CONFIG.BUSINESS.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#0F172A]">₹1,999</span>
              <span className="text-xs text-[#64748B]">/ year</span>
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              Essential calendar presence for retail merchants & local businesses.
            </p>
          </div>

          <div className="mt-6 space-y-2.5 text-xs text-[#0F172A] border-t border-[#E2E8F0] pt-4">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-emerald-500" />
              <span>Calendar ecosystem & profile access</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-emerald-500" />
              <span>Logo & storefront images</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-emerald-500" />
              <span>10 promotional campaigns / year</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-emerald-500" />
              <span>Store counter QR code generator</span>
            </div>
            <div className="flex items-center gap-2 text-[#94a3b8] line-through">
              <span>Promotional push notifications (Not included)</span>
            </div>
          </div>
        </Card>

        {/* Premium Plan */}
        <Card padding="lg" className={`border-2 ${isPremium ? 'border-[#1677F2] shadow-card' : 'border-[#E2E8F0]'}`}>
          {isPremium && (
            <div className="mb-2">
              <Badge variant="primary" size="sm">Your Current Plan</Badge>
            </div>
          )}
          <div>
            <Badge variant="primary" size="sm">All Features Included</Badge>
            <h3 className="text-lg font-bold text-[#0F172A] mt-2">{PLANS_CONFIG.PREMIUM.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#1677F2]">₹3,999</span>
              <span className="text-xs text-[#64748B]">/ year</span>
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              Maximum reach across Telugu audience with push notifications and priority placement.
            </p>
          </div>

          <div className="mt-6 space-y-2.5 text-xs text-[#0F172A] border-t border-[#E2E8F0] pt-4">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-emerald-500" />
              <span>Everything in Business Plan</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-[#1677F2]">
              <Check size={16} className="text-[#1677F2]" />
              <span>Promotional push notifications to followers</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-[#1677F2]">
              <Check size={16} className="text-[#1677F2]" />
              <span>Enhanced business branding inside shared app</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-emerald-500" />
              <span>Priority banner rotation on festival dates</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-emerald-500" />
              <span>Extra campaign booster: ₹299 / each</span>
            </div>
          </div>

          {!isPremium && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setIsUpgradeModalOpen(true)}
                leftIcon={<Sparkles size={16} />}
              >
                Upgrade to Premium (₹3,999)
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Invoices & Payment History */}
      <Card title="GST Invoices & Payment History" subtitle="Tax compliant receipts for accounting" padding="md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-2.5 px-3">Invoice No.</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {pay.provider_order_id || pay.id}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {pay.created_at.split('T')[0]}
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    Mana Calendar 2027 Annual Subscription ({pay.amount === 3999 ? 'Premium' : 'Standard'})
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    ₹{pay.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant="success" size="sm">PAID</Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoice(pay)}
                      leftIcon={<FileText size={12} />}
                    >
                      View Invoice
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* UPGRADE MODAL */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Upgrade to Premium Plan (₹3,999/yr)"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsUpgradeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpgradeToPremium}
              isLoading={isUpgrading}
              leftIcon={<CreditCard size={14} />}
            >
              Pay ₹3,999 via Razorpay / UPI
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          {upgradeSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{upgradeSuccess}</span>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2">
            <h5 className="font-bold text-sm">Unlock Premium Partner Capabilities:</h5>
            <ul className="list-disc pl-4 space-y-1">
              <li>Send direct festival push notifications to your store followers.</li>
              <li>High-priority banner rotations during Sankranti, Ugadi, and Diwali.</li>
              <li>Enhanced branding badge in customer app searches.</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan Amount:</span>
              <span className="font-semibold text-slate-900">₹3,388.98</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GST (18%):</span>
              <span className="font-semibold text-slate-900">₹610.02</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-base">
              <span>Total Payable:</span>
              <span className="text-[#1677F2]">₹3,999</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* INVOICE RECEIPT MODAL */}
      {selectedInvoice && (
        <Modal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          title={`Tax Invoice #${selectedInvoice.provider_order_id || selectedInvoice.id}`}
          size="lg"
        >
          <div className="space-y-4 text-left p-2">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h4 className="font-bold text-base text-[#1677F2]">MANA CALENDAR 2027</h4>
                <p className="text-xs text-slate-500">Telugu Calendar Platform • Mana Media Technologies Pvt Ltd</p>
                <p className="text-xs text-slate-500">GSTIN: 37AAAAA0000A1Z5</p>
              </div>
              <div className="text-right text-xs">
                <span className="font-bold block text-slate-900">INVOICE</span>
                <span className="font-mono text-slate-500">{selectedInvoice.provider_order_id}</span>
                <span className="text-slate-400 block">{selectedInvoice.created_at.split('T')[0]}</span>
              </div>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Billed To (Tenant Partner):</span>
              <div className="text-slate-900 font-semibold">{tenantId}</div>
              <div className="text-slate-500">Visakhapatnam, Andhra Pradesh, India</div>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-right">Taxable</th>
                  <th className="py-2 text-right">GST (18%)</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 font-semibold text-slate-800">
                    Annual Commercial Calendar Subscription 2027
                  </td>
                  <td className="py-2 text-right font-mono">
                    ₹{((selectedInvoice.amount / 1.18)).toFixed(2)}
                  </td>
                  <td className="py-2 text-right font-mono">
                    ₹{((selectedInvoice.amount - selectedInvoice.amount / 1.18)).toFixed(2)}
                  </td>
                  <td className="py-2 text-right font-mono font-bold text-slate-900">
                    ₹{selectedInvoice.amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.print?.();
                }}
                leftIcon={<Download size={14} />}
              >
                Print / Save PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
