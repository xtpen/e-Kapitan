import React, { useState } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { 
  DollarSign, 
  FileText, 
  Search, 
  CheckCircle2, 
  Printer, 
  Calendar, 
  ShieldCheck, 
  TrendingUp,
  CreditCard,
  Building
} from 'lucide-react';

export const CashierRevenueDesk: React.FC = () => {
  const { documentRequests, largeTextMode } = useBarangay();
  const [filterPeriod, setFilterPeriod] = useState<string>('Today');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const completedOrPaid = documentRequests.filter(
    d => d.status === 'completed' || d.status === 'approved' || d.status === 'ready_for_release'
  );

  const totalCollected = completedOrPaid
    .filter(d => !d.isFreeDueToExemption)
    .reduce((sum, d) => sum + d.fee, 0);

  const totalWaivedValue = completedOrPaid
    .filter(d => d.isFreeDueToExemption)
    .reduce((sum, d) => sum + (d.fee > 0 ? d.fee : 50), 0);

  const totalWaiversCount = completedOrPaid.filter(d => d.isFreeDueToExemption).length;

  const filteredRecords = completedOrPaid.filter((d) => {
    return (
      d.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.documentTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className={`space-y-6 ${largeTextMode ?'text-lg':'text-base'}`}>
      {/* Header Banner */}
      <div className="bg-surface rounded-card p-6 border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-strong text-xs font-bold uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Office of the Barangay Treasurer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink font-heading">
            Treasury, Cashier & Fee Waiver Ledger
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Official receipt issuance, municipal clearance revenue tracking, and statutory exemptions audit (RA 11261 / RA 9994).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-navy hover:bg-navy text-white font-bold rounded-control text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print daily report</span>
          </button>
        </div>
      </div>

      {/* Revenue KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-card p-5 border border-line ">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block">
            Total Revenue Remitted
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-ink font-heading ">
              ₱{totalCollected.toLocaleString()}.00
            </span>
            <span className="text-xs font-bold text-primary-strong bg-primary-tint px-2 py-0.5 rounded-full">
              Audited
            </span>
          </div>
          <p className="text-xs text-muted mt-2">
            Deposited into Barangay General Fund
          </p>
        </div>

        <div className="bg-surface rounded-card p-5 border border-line ">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block">
            Statutory Fee Waivers Issued
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-primary-strong font-heading">
              {totalWaiversCount}
            </span>
            <span className="text-xs font-bold text-primary-strong bg-primary-tint px-2 py-0.5 rounded-full">
              100% Subsidized
            </span>
          </div>
          <p className="text-xs text-muted mt-2">
            First-Time Jobseeker (RA 11261) & Indigency
          </p>
        </div>

        <div className="bg-surface rounded-card p-5 border border-line ">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block">
            Subsidy Value Granted
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-info-fg font-heading ">
              ₱{totalWaivedValue.toLocaleString()}.00
            </span>
          </div>
          <p className="text-xs text-muted mt-2">
            Direct citizen financial relief delivered
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface rounded-card border border-line overflow-hidden">
        <div className="p-5 border-b border-line-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-ink font-heading">
            Official Receipts & Collections Ledger
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search receipt or citizen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-muted border border-line rounded-control text-xs sm:text-sm focus:bg-surface focus:outline-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-surface-muted text-muted font-bold uppercase text-label tracking-wider border-b border-line-soft">
              <tr>
                <th className="px-5 py-3">Receipt / Ref</th>
                <th className="px-5 py-3">Citizen Name</th>
                <th className="px-5 py-3">Service Document</th>
                <th className="px-5 py-3">Assessment Type</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft text-ink">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-surface-muted/80 transition-colors">
                  <td className="px-5 py-3 font-bold text-ink text-xs">
                    {rec.referenceNumber}
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    {rec.residentName}
                    <span className="block text-label text-muted font-normal">{rec.purok}</span>
                  </td>
                  <td className="px-5 py-3">
                    {rec.documentTitle}
                  </td>
                  <td className="px-5 py-3">
                    {rec.isFreeDueToExemption ? (
                      <span className="inline-flex items-center gap-1 text-label font-bold text-primary-strong bg-primary-tint px-2 py-0.5 rounded-full border border-primary-tint-line">
                        <CheckCircle2 className="w-3 h-3" /> Fee Exemption (Waiver)
                      </span>
                    ) : (
                      <span className="text-label font-bold text-ink bg-surface-muted px-2 py-0.5 rounded-full">
                        Official Barangay Fee
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-bold ">
                    {rec.isFreeDueToExemption ? '₱0.00' : `₱${rec.fee}.00`}
                  </td>
                  <td className="px-5 py-3 text-muted text-xs">
                    {rec.submittedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
