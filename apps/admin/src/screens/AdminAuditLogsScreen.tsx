import React, { useState, useEffect } from 'react';
import { Badge, Button, Modal } from '@mana/ui';
import {
  FileText,
  ShieldAlert,
  KeyRound,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  Terminal,
  Shield,
  X,
} from 'lucide-react';
import { AdminService } from '@mana/services';
import type { AuditLog } from '@mana/types';

export const AdminAuditLogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actorTypeFilter, setActorTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = () => {
    setLogs(AdminService.getAuditLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const matchesActor = actorTypeFilter === 'all' || l.actor_type === actorTypeFilter;
    const matchesAction = actionFilter === 'all' || l.action.toLowerCase().includes(actionFilter.toLowerCase());
    const matchesSearch =
      (l.resource_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actor_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.resource_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesActor && matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Security & Governance Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system and administrative telemetry stored in <code>audit_logs</code> with state snapshots
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
          leftIcon={<RefreshCw size={14} />}
          onClick={loadLogs}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs w-full md:w-80">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by resource, actor, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-900 w-full placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <Filter size={13} />
              <span>Actor Type:</span>
            </div>
            {['all', 'admin', 'business', 'system'].map((at) => (
              <button
                key={at}
                onClick={() => setActorTypeFilter(at)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors font-medium ${
                  actorTypeFilter === at
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {at}
              </button>
            ))}

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <span>Action:</span>
            </div>
            {['all', 'business', 'plan', 'subscription', 'campaign', 'panchangam', 'login'].map((act) => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors font-medium ${
                  actionFilter === act
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Audit Records ({filteredLogs.length} events)
          </span>
          <span className="text-[11px] text-slate-500">
            Immutable append-only write architecture
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Timestamp (IST)</th>
                <th className="px-5 py-3">Actor & Type</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Target Resource</th>
                <th className="px-5 py-3">Client IP</th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-900 block">{log.actor_id}</span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase mt-0.5 ${
                        log.actor_type === 'admin'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : log.actor_type === 'business'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {log.actor_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-medium text-slate-800">
                    {log.action}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-slate-600">
                      <span className="text-slate-400">{log.resource_type}:</span>{' '}
                      <span className="font-bold text-slate-900">{log.resource_id || 'n/a'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px]">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 border-slate-200 text-slate-700 hover:bg-slate-100"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye size={12} className="mr-1" />
                      View Diff
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff / Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Actor ID</span>
                <span className="font-mono font-bold text-slate-900">{selectedLog.actor_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Resource</span>
                <span className="font-mono font-bold text-slate-900">{selectedLog.resource_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Resource ID</span>
                <span className="font-mono font-bold text-blue-600">{selectedLog.resource_id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">IP Address</span>
                <span className="font-mono text-slate-700">{selectedLog.ip_address}</span>
              </div>
            </div>

            {/* Before vs After Diff if available */}
            {(selectedLog.before_value || selectedLog.after_value) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 border-b border-slate-200">
                    State Before Mutation
                  </div>
                  <pre className="p-3 bg-slate-50 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-56">
                    {JSON.stringify(selectedLog.before_value, null, 2) || '(null - new entity created)'}
                  </pre>
                </div>

                <div className="border border-emerald-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800 border-b border-emerald-200">
                    State After Mutation
                  </div>
                  <pre className="p-3 bg-emerald-50/30 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-56">
                    {JSON.stringify(selectedLog.after_value, null, 2) || '(null - entity removed)'}
                  </pre>
                </div>
              </div>
            ) : null}

            {/* Raw Details JSON */}
            {selectedLog.details && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 border-b border-slate-200">
                  Event Metadata & Details
                </div>
                <pre className="p-3 bg-slate-50 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close Viewer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
