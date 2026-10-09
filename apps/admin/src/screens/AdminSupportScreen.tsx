import React, { useState, useEffect } from 'react';
import { Badge, Button, Modal } from '@mana/ui';
import {
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  X,
  User,
  Tag,
} from 'lucide-react';
import { AdminService } from '@mana/services';
import type { SupportTicket, TicketStatus, TicketPriority } from '@mana/types';

export const AdminSupportScreen: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Details
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [editStatus, setEditStatus] = useState<TicketStatus>('in_progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const loadTickets = () => {
    setTickets(AdminService.listSupportTickets());
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleUpdateTicket = () => {
    if (!selectedTicket) return;

    try {
      AdminService.updateTicketStatus(
        selectedTicket.id,
        editStatus,
        'admin-support-04',
        resolutionNotes
      );

      loadTickets();
      setSuccessBanner(`Ticket ${selectedTicket.id} updated to status "${editStatus}". Audit logged.`);
      setSelectedTicket(null);
      setResolutionNotes('');
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.business_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Support Desk & Merchant Assistance</h2>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin & Support Admin resolution queue for commercial tenant inquiries and system tickets
          </p>
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

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs w-full md:w-80">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by ticket ID, tenant, or subject..."
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
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors font-medium ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <span>Priority:</span>
            </div>
            {['all', 'high', 'medium', 'low'].map((pr) => (
              <button
                key={pr}
                onClick={() => setPriorityFilter(pr)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors font-medium ${
                  priorityFilter === pr
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Support Queue ({filteredTickets.length} tickets)
          </span>
          <span className="text-[11px] text-slate-500">
            SLA Response Target: Under 2 Hours
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Ticket ID</th>
                <th className="px-5 py-3">Tenant & Category</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created At</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-blue-600">
                    {t.id}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-slate-900 block">{t.business_id}</span>
                    <span className="text-[11px] text-slate-400 capitalize">{t.category}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900 max-w-sm">
                    {t.subject}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        t.priority === 'high'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : t.priority === 'medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        t.status === 'open'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : t.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : t.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                    {t.created_at ? new Date(t.created_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 border-slate-200 text-slate-700 hover:bg-slate-100"
                      onClick={() => {
                        setSelectedTicket(t);
                        setEditStatus(t.status);
                      }}
                    >
                      Inspect & Resolve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Resolution Modal */}
      {selectedTicket && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTicket(null)}
          title={`Support Ticket: ${selectedTicket.id}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tenant: <b className="text-slate-900 font-mono">{selectedTicket.business_id}</b></span>
                <span className="text-slate-500">Category: <b className="text-slate-900 capitalize">{selectedTicket.category}</b></span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{selectedTicket.subject}</h4>
              <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                {selectedTicket.description}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Update Status *</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium outline-none focus:border-blue-500"
              >
                <option value="open">Open (Unassigned / Pending Action)</option>
                <option value="in_progress">In Progress (Under Active Investigation)</option>
                <option value="resolved">Resolved (Solution Provided)</option>
                <option value="closed">Closed (Issue Finalized)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resolution Notes / Response to Merchant</label>
              <textarea
                rows={3}
                placeholder="e.g. Campaign banner resized and verified in sandbox preview. Merchant notified via email."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setSelectedTicket(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleUpdateTicket}
              >
                Save & Update Ticket
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
