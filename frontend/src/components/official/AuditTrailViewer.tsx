import React, { useState } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  User, 
  FileText, 
  Lock,
  Download
} from 'lucide-react';

export const AuditTrailViewer: React.FC = () => {
  const { auditLogs, largeTextMode } = useBarangay();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('All');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesModule = filterModule === 'All' || log.category === filterModule;
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const modules = ['All', 'Records', 'Documents', 'Queue', 'Security', 'Configuration'];

  return (
    <div className={`space-y-6 ${largeTextMode ?'text-lg':'text-base'}`}>
      {/* Header Banner */}
      <div className="bg-surface rounded-card p-6 border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-info-fg text-xs font-bold uppercase tracking-wider mb-1">
            <Lock className="w-4 h-4" />
            <span>Good Governance & DILG Audit Compliance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink font-heading">
            System Transparency & Audit Trail
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Tamper-evident logs of all administrative actions, document approvals, clearance status transitions, and user logins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              alert('Exporting encrypted CSV audit ledger for Commission on Audit (COA) / DILG review...');
            }}
            className="px-4 py-2.5 bg-navy hover:bg-navy text-white font-bold rounded-control text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export audit log</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-surface rounded-card p-4 border border-line flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search action, user, or target ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-muted border border-line rounded-control text-xs sm:text-sm focus:bg-surface focus:outline-navy"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setFilterModule(m)}
              className={`px-3 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
 filterModule === m
 ?'bg-navy text-white'
 :'bg-surface-muted text-ink hover:bg-surface-muted border border-line'
 }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-surface rounded-card border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-surface-muted text-muted font-bold uppercase text-label tracking-wider border-b border-line-soft">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Operator</th>
                <th className="px-5 py-3">Action Event</th>
                <th className="px-5 py-3">Module</th>
                <th className="px-5 py-3">Target Entity</th>
                <th className="px-5 py-3">Details / Audit Payload</th>
                <th className="px-5 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft text-ink">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-muted/80 transition-colors">
                  <td className="px-5 py-3 text-label text-muted whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    {log.userName}
                    <span className="block text-label text-muted capitalize font-normal">{log.userRole}</span>
                  </td>
                  <td className="px-5 py-3 font-bold text-ink text-xs">
                    {log.action}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-label font-bold bg-surface-muted text-ink px-2 py-0.5 rounded-full">
                      {log.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-label text-info-fg font-bold">
                    {log.id}
                  </td>
                  <td className="px-5 py-3 text-muted text-xs max-w-xs">
                    {log.details}
                  </td>
                  <td className="px-5 py-3 text-label text-muted">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-muted text-xs">
            No audit logs found for the search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
