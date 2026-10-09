import React, { useState, useEffect } from 'react';
import { Badge, Button, Modal, Input } from '@mana/ui';
import {
  Building2,
  Search,
  Plus,
  Filter,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  RefreshCw,
  Eye,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { AdminService } from '@mana/services';
import type { Business, BusinessProfile, Subscription } from '@mana/types';

export const AdminBusinessesScreen: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // New business form state
  const [createForm, setCreateForm] = useState({
    name: '',
    owner_name: '',
    email: '',
    phone: '',
    category: 'Jewellery & Retail',
    address: 'Dwaraka Nagar, Main Road',
    city: 'Visakhapatnam',
    plan_code: 'premium' as 'business' | 'premium',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await AdminService.listBusinesses({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        plan: planFilter !== 'all' ? planFilter : undefined,
      });
      setBusinesses(data);
    } catch (err) {
      console.error('Failed to load businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter, planFilter]);

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.owner_name || !createForm.email) return;

    try {
      const result = await AdminService.createBusiness({
        name: createForm.name,
        owner_name: createForm.owner_name,
        email: createForm.email,
        phone: createForm.phone,
        category: createForm.category,
        address: createForm.address,
        city: createForm.city,
        plan_code: createForm.plan_code,
      });

      setIsCreateOpen(false);
      setActionSuccessMessage(`Tenant ${result.business.business_id} (${result.business.name}) registered successfully with QR link & subscription!`);
      // Reset form
      setCreateForm({
        name: '',
        owner_name: '',
        email: '',
        phone: '',
        category: 'Jewellery & Retail',
        address: 'Dwaraka Nagar, Main Road',
        city: 'Visakhapatnam',
        plan_code: 'premium',
      });
      loadData();
    } catch (err) {
      console.error('Failed to create business:', err);
    }
  };

  const handleSuspendConfirm = async () => {
    if (!selectedBusiness || !suspendReason.trim()) return;

    try {
      await AdminService.suspendBusiness(
        selectedBusiness.business_id,
        suspendReason,
        'admin-owner-01'
      );
      setSuspendModalOpen(false);
      setSelectedBusiness(null);
      setSuspendReason('');
      setActionSuccessMessage(`Tenant ${selectedBusiness.business_id} suspended. Active campaigns paused and promotional banners hidden.`);
      loadData();
    } catch (err) {
      console.error('Failed to suspend business:', err);
    }
  };

  const handleReactivate = async (businessId: string) => {
    try {
      await AdminService.reactivateBusiness(businessId, 'admin-owner-01');
      setActionSuccessMessage(`Tenant ${businessId} reactivated successfully. Eligibility restored.`);
      if (selectedBusiness?.business_id === businessId) {
        setSelectedBusiness(null);
      }
      loadData();
    } catch (err) {
      console.error('Failed to reactivate business:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Business Tenants Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Registered commercial tenants inside Mana Calendar 2027 multi-tenant ecosystem
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Register New Tenant
        </Button>
      </div>

      {/* Success banner */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Controls & Filters */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs w-full md:w-80">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by ID (e.g. SLJ001), name, or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-900 w-full placeholder-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <Filter size={13} />
              <span>Status:</span>
            </div>
            {['all', 'active', 'suspended', 'expired'].map((st) => (
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

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <span>Plan:</span>
            </div>
            {['all', 'business', 'premium'].map((pl) => (
              <button
                key={pl}
                onClick={() => setPlanFilter(pl)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors font-medium ${
                  planFilter === pl
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Total Tenants: {businesses.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
            className="text-slate-600 hover:text-slate-900 text-xs"
          >
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Tenant ID</th>
                <th className="px-5 py-3">Business Name & Owner</th>
                <th className="px-5 py-3">Plan Tier</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">QR Link</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No matching tenants found.
                  </td>
                </tr>
              ) : (
                businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-600">
                      {b.business_id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{b.name}</div>
                      <div className="text-[11px] text-slate-400">{b.owner_name}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          b.plan_code === 'premium'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {b.plan_code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                          b.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'suspended'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      <a
                        href={`https://yourdomain.in/b/${b.business_id.toLowerCase()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        /b/{b.business_id.toLowerCase()}
                        <ExternalLink size={11} />
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : '2026-01-15'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2.5 border-slate-200 hover:bg-slate-100 text-slate-700"
                          onClick={() => setSelectedBusiness(b)}
                        >
                          <Eye size={12} className="mr-1" />
                          Details
                        </Button>

                        {b.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5 border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => {
                              setSelectedBusiness(b);
                              setSuspendModalOpen(true);
                            }}
                          >
                            <Ban size={12} className="mr-1" />
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleReactivate(b.business_id)}
                          >
                            <RotateCcw size={12} className="mr-1" />
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Tenant Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Tenant"
        size="lg"
      >
        <form onSubmit={handleCreateBusiness} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Provisioning a new commercial tenant automatically generates a unique <b>business_id</b>, dedicated QR destination URL, merchant profile, and an active 1-year subscription with campaign quotas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sri Venkateswara Silks"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Owner / Contact Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={createForm.owner_name}
                onChange={(e) => setCreateForm({ ...createForm, owner_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="owner@business.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone / WhatsApp Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="Jewellery & Retail">Jewellery & Retail</option>
                <option value="Groceries & Foods">Groceries & Foods</option>
                <option value="Shopping & Textiles">Shopping & Textiles</option>
                <option value="Healthcare & Pharmacy">Healthcare & Pharmacy</option>
                <option value="Restaurants & Sweets">Restaurants & Sweets</option>
                <option value="Automotive & Services">Automotive & Services</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={createForm.city}
                onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Initial Plan</label>
              <select
                value={createForm.plan_code}
                onChange={(e) => setCreateForm({ ...createForm, plan_code: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500 font-semibold"
              >
                <option value="premium">Premium (₹3,999/yr - Push Notifications Included)</option>
                <option value="business">Business (₹1,999/yr - Standard)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              value={createForm.address}
              onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Provision & Activate Tenant
            </Button>
          </div>
        </form>
      </Modal>

      {/* Business Details Drawer / Modal */}
      {selectedBusiness && !suspendModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBusiness(null)}
          title={`Tenant: ${selectedBusiness.business_id} — ${selectedBusiness.name}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Status</span>
                <span className="font-bold uppercase text-slate-900">{selectedBusiness.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Plan</span>
                <span className="font-bold uppercase text-blue-600">{selectedBusiness.plan_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Owner</span>
                <span className="font-bold text-slate-900">{selectedBusiness.owner_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Created</span>
                <span className="text-slate-700">
                  {selectedBusiness.created_at ? new Date(selectedBusiness.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
              <QrCode size={24} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-blue-900">Dedicated QR & Deep-Link Destination</div>
                <div className="font-mono text-blue-700 select-all mt-0.5">
                  https://yourdomain.in/b/{selectedBusiness.business_id.toLowerCase()}
                </div>
                <p className="text-[11px] text-blue-800 mt-1">
                  Scanning this QR routes customers directly into Mana Calendar Business Mode for {selectedBusiness.name}. If the app is not installed, deferred deep linking will attribute the user post-install.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 space-y-2">
              <h4 className="font-semibold text-slate-800">Administrative Governance</h4>
              <p className="text-slate-500">
                You can manage the lifecycle of this tenant. Suspending prevents access to the Business Dashboard, pauses all active campaigns, and stops push broadcasts while preserving merchant historical data.
              </p>
              <div className="flex gap-2 pt-2">
                {selectedBusiness.status === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-300 text-rose-700 hover:bg-rose-50"
                    onClick={() => setSuspendModalOpen(true)}
                  >
                    Suspend Tenant Access
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleReactivate(selectedBusiness.business_id)}
                  >
                    Reactivate Tenant
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedBusiness(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalOpen && selectedBusiness && (
        <Modal
          isOpen={true}
          onClose={() => setSuspendModalOpen(false)}
          title={`Suspend Tenant: ${selectedBusiness.business_id}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 flex items-start gap-2.5">
              <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-900">Enforced Suspension Cascading</div>
                <p className="text-[11px] text-rose-700 mt-1">
                  Suspending <b>{selectedBusiness.name}</b> will automatically:
                </p>
                <ul className="list-disc list-inside mt-1 text-[11px] text-rose-800 space-y-0.5">
                  <li>Revoke access to the Business Web Dashboard</li>
                  <li>Pause all active banner campaigns immediately</li>
                  <li>Hide promotional banners from customer calendar views</li>
                  <li>Block all outbound promotional push notifications</li>
                  <li>Safely retain all merchant records, history & assets</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reason for Suspension (Mandatory Audit Trail) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Non-payment of subscription renewal / Policy violation / Merchant request"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setSuspendModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
                disabled={!suspendReason.trim()}
                onClick={handleSuspendConfirm}
              >
                Confirm Suspension
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
