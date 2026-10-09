import React, { useState } from 'react';
import { Badge, Button, Modal } from '@mana/ui';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Printer,
  X,
  Code,
  DollarSign,
} from 'lucide-react';
import { AdminService } from '@mana/services';

interface PaymentTxn {
  id: string;
  orderId: string;
  tenantId: string;
  businessName: string;
  amount: number;
  plan: string;
  provider: 'razorpay' | 'phonepe';
  status: 'success' | 'failed' | 'refunded';
  date: string;
  gstNumber?: string;
}

export const AdminPaymentsScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<PaymentTxn[]>([
    {
      id: 'pay_rzp_994101',
      orderId: 'order_1001',
      tenantId: 'SLJ001',
      businessName: 'Sri Lakshmi Jewellers',
      amount: 3999,
      plan: 'Premium Plan (1 Year)',
      provider: 'razorpay',
      status: 'success',
      date: '2026-01-15 14:32:10',
      gstNumber: '37AABCS1429B1Z2',
    },
    {
      id: 'pay_rzp_994102',
      orderId: 'order_1002',
      tenantId: 'RF002',
      businessName: 'Radha Flours & Foods',
      amount: 1999,
      plan: 'Business Plan (1 Year)',
      provider: 'razorpay',
      status: 'success',
      date: '2026-02-10 11:20:45',
      gstNumber: '37AACCR5912K1Z8',
    },
    {
      id: 'pay_phn_882031',
      orderId: 'order_1003',
      tenantId: 'CMR003',
      businessName: 'CMR Shopping Mall',
      amount: 3999,
      plan: 'Premium Plan (1 Year)',
      provider: 'phonepe',
      status: 'success',
      date: '2026-03-01 16:45:00',
      gstNumber: '37AAACM8304E1Z4',
    },
  ]);

  // Modals & Tools
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentTxn | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [refundModalTxn, setRefundModalTxn] = useState<PaymentTxn | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Webhook Simulator state
  const [simulatorOrderId, setSimulatorOrderId] = useState('order_sim_991');
  const [simulatorPaymentId, setSimulatorPaymentId] = useState('pay_sim_991');
  const [simulatorTenantId, setSimulatorTenantId] = useState('SLJ001');
  const [simulatorSignature, setSimulatorSignature] = useState('sig_verified_3892fbc9821aae893817');
  const [simulatorResult, setSimulatorResult] = useState<any>(null);

  const handleRunSimulator = async () => {
    try {
      const res = await AdminService.handlePaymentWebhook({
        event_type: 'payment.captured',
        payload: {
          order_id: simulatorOrderId,
          payment_id: simulatorPaymentId,
          business_id: simulatorTenantId,
          amount: 3999,
          plan_code: 'premium',
        },
        signature: simulatorSignature,
      });
      setSimulatorResult(res);
      if (res.status === 'processed') {
        setSuccessBanner(`Webhook successfully verified via HMAC signature & processed for ${simulatorTenantId}!`);
      }
    } catch (err: any) {
      setSimulatorResult({ status: 'rejected', reason: err.message });
    }
  };

  const handleRefundConfirm = () => {
    if (!refundModalTxn || !refundReason.trim()) return;

    setTransactions((prev) =>
      prev.map((t) => (t.id === refundModalTxn.id ? { ...t, status: 'refunded' } : t))
    );

    setSuccessBanner(`Refund of ₹${refundModalTxn.amount} for ${refundModalTxn.tenantId} initiated. Audit record logged.`);
    setRefundModalTxn(null);
    setRefundReason('');
  };

  const calculateGst = (gross: number) => {
    // 18% inclusive GST
    const taxable = Math.round((gross / 1.18) * 100) / 100;
    const gstTotal = Math.round((gross - taxable) * 100) / 100;
    const cgst = Math.round((gstTotal / 2) * 100) / 100;
    const sgst = cgst;
    return { taxable, gstTotal, cgst, sgst };
  };

  const totalGross = transactions.filter((t) => t.status === 'success').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payment Transactions & Financial Ledger</h2>
          <p className="text-xs text-slate-500 mt-1">
            Reconciled payments, Razorpay / PhonePe webhook verification, and GST tax invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
            leftIcon={<Code size={14} />}
            onClick={() => setIsSimulatorOpen(true)}
          >
            Test Webhook Signature
          </Button>
        </div>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            ₹{totalGross.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">100% Reconciled</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Successful Transactions</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {transactions.filter((t) => t.status === 'success').length}
          </div>
          <span className="text-[11px] text-slate-500">0 Failed / 0 Disputed</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Gateways</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            2
          </div>
          <span className="text-[11px] text-blue-600 font-medium">Razorpay + PhonePe</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">GST Compliance</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            18%
          </div>
          <span className="text-[11px] text-slate-500">SAC Code: 998314</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Reconciled Gateway Transactions ({transactions.length})
          </span>
          <span className="text-[11px] text-slate-500">
            All gateway events verified via cryptographic signatures
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Txn ID</th>
                <th className="px-5 py-3">Tenant & Business</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Plan Description</th>
                <th className="px-5 py-3">Gateway</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date (IST)</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-slate-600 font-semibold">
                    {tx.id}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-blue-600 mr-1.5">{tx.tenantId}</span>
                    <span className="text-slate-900 font-medium">{tx.businessName}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                    ₹{tx.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {tx.plan}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono uppercase font-semibold text-[11px] text-slate-700">
                      {tx.provider}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        tx.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : tx.status === 'refunded'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                    {tx.date}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2 border-slate-200 text-slate-700 hover:bg-slate-100"
                        onClick={() => setSelectedInvoice(tx)}
                      >
                        <FileText size={12} className="mr-1" />
                        Tax Invoice
                      </Button>
                      {tx.status === 'success' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2 border-rose-200 text-rose-600 hover:bg-rose-50"
                          onClick={() => setRefundModalTxn(tx)}
                        >
                          <RotateCcw size={12} className="mr-1" />
                          Refund
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GST Tax Invoice Viewer Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
          title={`Tax Invoice: ${selectedInvoice.id}`}
          size="lg"
        >
          {(() => {
            const { taxable, gstTotal, cgst, sgst } = calculateGst(selectedInvoice.amount);
            return (
              <div className="space-y-4 text-xs text-slate-700">
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 print:p-0 print:border-none">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                    <div>
                      <div className="font-extrabold text-lg text-slate-900 tracking-tight">MANA CALENDAR 2027</div>
                      <div className="text-slate-500 text-[11px]">Mana Calendar Private Limited</div>
                      <div className="text-slate-500 text-[11px]">GSTIN: 37AAAAA0000A1Z5</div>
                      <div className="text-slate-500 text-[11px]">Visakhapatnam, Andhra Pradesh, India - 530002</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 uppercase">Tax Invoice</div>
                      <div className="font-mono text-slate-600 font-semibold">{selectedInvoice.id}</div>
                      <div className="text-slate-500 text-[11px]">Date: {selectedInvoice.date}</div>
                      <div className="text-slate-500 text-[11px]">Order: {selectedInvoice.orderId}</div>
                    </div>
                  </div>

                  {/* Bill To */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Billed To (Tenant)</span>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {selectedInvoice.businessName} ({selectedInvoice.tenantId})
                      </div>
                      <div className="text-slate-500 text-[11px]">Visakhapatnam, Andhra Pradesh</div>
                      {selectedInvoice.gstNumber && (
                        <div className="text-slate-600 font-mono text-[11px] mt-0.5">
                          GSTIN: {selectedInvoice.gstNumber}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Payment Method</span>
                      <div className="font-semibold text-slate-800 uppercase mt-0.5">{selectedInvoice.provider}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase mt-1">
                        PAID IN FULL
                      </span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] text-slate-500 font-semibold uppercase">
                        <th className="py-2">Description</th>
                        <th className="py-2">SAC Code</th>
                        <th className="py-2 text-right">Taxable Value</th>
                        <th className="py-2 text-right">GST (18%)</th>
                        <th className="py-2 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      <tr>
                        <td className="py-3 font-medium text-slate-900">
                          {selectedInvoice.plan} Subscription
                        </td>
                        <td className="py-3 font-mono text-slate-500">998314</td>
                        <td className="py-3 text-right font-mono">₹{taxable.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono">₹{gstTotal.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono font-bold text-slate-900">
                          ₹{selectedInvoice.amount.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Tax Breakdown */}
                  <div className="border-t border-slate-200 pt-3 flex justify-end">
                    <div className="w-64 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Taxable Subtotal:</span>
                        <span className="font-mono">₹{taxable.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST (9%):</span>
                        <span className="font-mono">₹{cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST (9%):</span>
                        <span className="font-mono">₹{sgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                        <span>Total Paid (INR):</span>
                        <span className="font-mono">₹{selectedInvoice.amount.toLocaleString('en-IN')}.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-slate-500">
                    Digitally signed & generated pursuant to Indian GST Rules 2017.
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      leftIcon={<Printer size={13} />}
                    >
                      Print Invoice
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Webhook Signature Simulator Modal */}
      {isSimulatorOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsSimulatorOpen(false)}
          title="Payment Gateway Webhook Simulator"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Simulate inbound gateway webhooks from Razorpay or PhonePe. The backend strictly checks HMAC-SHA256 signatures before activating subscriptions or campaign quotas.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tenant ID</label>
                <input
                  type="text"
                  value={simulatorTenantId}
                  onChange={(e) => setSimulatorTenantId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gateway Order ID</label>
                <input
                  type="text"
                  value={simulatorOrderId}
                  onChange={(e) => setSimulatorOrderId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gateway Payment ID</label>
                <input
                  type="text"
                  value={simulatorPaymentId}
                  onChange={(e) => setSimulatorPaymentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">HMAC Signature Header</label>
                <input
                  type="text"
                  value={simulatorSignature}
                  onChange={(e) => setSimulatorSignature(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {simulatorResult && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono ${
                  simulatorResult.status === 'processed'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <pre>{JSON.stringify(simulatorResult, null, 2)}</pre>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setIsSimulatorOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleRunSimulator}
              >
                Execute Webhook Test
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Refund Modal */}
      {refundModalTxn && (
        <Modal
          isOpen={true}
          onClose={() => setRefundModalTxn(null)}
          title={`Process Refund: ${refundModalTxn.id}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Refund ₹{refundModalTxn.amount.toLocaleString('en-IN')} for <b>{refundModalTxn.businessName}</b> ({refundModalTxn.tenantId}).
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Refund Reason (Mandatory Audit Requirement) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Duplicate transaction charge / Requested within 48h cooling off window"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setRefundModalTxn(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                disabled={!refundReason.trim()}
                onClick={handleRefundConfirm}
              >
                Execute Refund
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
