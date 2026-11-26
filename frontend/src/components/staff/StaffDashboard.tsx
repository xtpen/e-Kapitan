import React from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { 
  Users, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  PlusCircle, 
  PhoneCall, 
  Search, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { BARANGAY } from '../../config/barangay';

interface StaffDashboardProps {
  onOpenWalkInModal?: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onOpenWalkInModal }) => {
  const { 
    documentRequests, 
    queueTickets, 
    incidents, 
    residents, 
    setActiveTab, 
    callNextQueueTicket,
    largeTextMode 
  } = useBarangay();

  const pendingRequests = documentRequests.filter(r => r.status === 'submitted' || r.status === 'under_review');
  const waitingTickets = queueTickets.filter(t => t.status === 'waiting');
  const openIncidents = incidents.filter(i => i.status !== 'resolved');
  const seniorCount = residents.filter(r => r.isSenior).length;

  // Calculate today's revenue & waivers
  const todayPaid = documentRequests
    .filter(r => r.status === 'completed' && !r.isFreeDueToExemption)
    .reduce((acc, curr) => acc + curr.fee, 0);

  const waivedCount = documentRequests.filter(r => r.isFreeDueToExemption).length;

  return (
    <div className={`space-y-6 ${largeTextMode ?'text-lg':'text-base'}`}>
      {/* Top Operations Header */}
      <div className="bg-surface rounded-card p-6 border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-strong text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Barangay {BARANGAY} Operations Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink font-heading">
            Staff Operations & Service Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Live monitoring for document processing, counter queue flow, incident blotter, and civil registry.
          </p>
        </div>

        {/* Quick Operational Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => callNextQueueTicket(1)}
            className="px-4 py-2.5 bg-primary-strong hover:bg-primary-strong text-white font-bold rounded-control text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            id="call-next-ticket-quick-btn"
          >
            <Clock className="w-4 h-4 text-gold" />
            <span>Call next ticket</span>
          </button>
          <button
            onClick={() => setActiveTab('staff_queue')}
            className="px-4 py-2.5 bg-navy hover:bg-navy text-white font-semibold rounded-control text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue walk-in ticket</span>
          </button>
        </div>
      </div>

      {/* 4 Core Operational KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Requests */}
        <div 
          onClick={() => setActiveTab('staff_documents')}
          className="bg-surface rounded-card p-5 border border-line hover:border-primary transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Pending Documents</span>
            <div className="p-2 bg-warning-bg text-warning-fg rounded-control">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink font-heading">{pendingRequests.length}</span>
            <span className="text-xs font-bold text-warning-fg bg-warning-bg px-2 py-0.5 rounded-full">
              Requires Review
            </span>
          </div>
          <p className="text-xs text-muted mt-2 flex items-center justify-between">
            <span>Avg. Turnaround: 2.1 hrs</span>
            <span className="text-primary-strong font-semibold">Open Desk →</span>
          </p>
        </div>

        {/* Counter Queue */}
        <div 
          onClick={() => setActiveTab('staff_queue')}
          className="bg-surface rounded-card p-5 border border-line hover:border-navy-ink transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Live Queue Waiting</span>
            <div className="p-2 bg-info-bg text-info-fg rounded-control">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink font-heading">{waitingTickets.length}</span>
            <span className="text-xs font-bold text-info-fg bg-info-bg px-2 py-0.5 rounded-full">
              Active Counter Line
            </span>
          </div>
          <p className="text-xs text-muted mt-2 flex items-center justify-between">
            <span>Priority Lanes Active</span>
            <span className="text-info-fg font-semibold">Manage Queue →</span>
          </p>
        </div>

        {/* Community Incidents */}
        <div 
          onClick={() => setActiveTab('staff_incidents')}
          className="bg-surface rounded-card p-5 border border-line hover:border-danger-fg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Open Incidents / Blotter</span>
            <div className="p-2 bg-danger-bg text-danger-fg rounded-control">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink font-heading">{openIncidents.length}</span>
            <span className="text-xs font-bold text-danger-fg bg-danger-bg px-2 py-0.5 rounded-full">
              Active Cases
            </span>
          </div>
          <p className="text-xs text-muted mt-2 flex items-center justify-between">
            <span>Tanod / Lupon Assigned</span>
            <span className="text-danger-fg font-semibold">Incident Desk →</span>
          </p>
        </div>

        {/* Civil Registry */}
        <div 
          onClick={() => setActiveTab('staff_residents')}
          className="bg-surface rounded-card p-5 border border-line hover:border-navy-ink transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Registered Population</span>
            <div className="p-2 bg-info-bg text-info-fg rounded-control">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink font-heading">{residents.length}</span>
            <span className="text-xs font-bold text-info-fg bg-info-bg px-2 py-0.5 rounded-full">
              {seniorCount} Seniors
            </span>
          </div>
          <p className="text-xs text-muted mt-2 flex items-center justify-between">
            <span>Purok 1-6 Masterlist</span>
            <span className="text-info-fg font-semibold">View Registry →</span>
          </p>
        </div>
      </div>

      {/* Operational Congestion Alert / Status Banner */}
      <div className="p-4 rounded-card bg-primary-tint border border-primary-tint-line/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary animate-ping shrink-0"></div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-ink">
              Counter Operational Flow: Normal Flow • Average Wait 8.4 Minutes
            </h4>
            <p className="text-xs text-muted">
              Counters 1, 2, 3, and 4 are staffed and responding. RA 11261 / RA 9994 fee exemptions automatically applied.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-ink shrink-0">
          <span>Today Collected: <strong>₱{todayPaid}.00</strong></span>
          <span>•</span>
          <span className="text-primary-strong">Waivers Issued: <strong>{waivedCount}</strong></span>
        </div>
      </div>

      {/* Split Section: Real-time Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applications Awaiting Review */}
        <div className="lg:col-span-7 bg-surface rounded-card border border-line p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line-soft">
            <div>
              <h3 className="text-base font-bold text-ink font-heading">
                Recent Document Requests
              </h3>
              <p className="text-xs text-muted">Applications submitted online requiring clerk verification</p>
            </div>
            <button
              onClick={() => setActiveTab('staff_documents')}
              className="text-xs font-semibold text-primary-strong hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({documentRequests.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {documentRequests.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                onClick={() => setActiveTab('staff_documents')}
                className="p-3.5 rounded-control bg-surface-muted border border-line hover:border-primary-tint-line hover:bg-primary-tint/30 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink">{doc.referenceNumber}</span>
                    <span className={`text-label font-bold uppercase px-2 py-0.5 rounded-full ${
 doc.status ==='completed'?'bg-primary-tint text-primary-strong':
 doc.status ==='ready_for_release'?'bg-info-bg text-navy-ink':
 doc.status ==='approved'?'bg-info-bg text-navy-ink':
'bg-warning-bg text-warning-fg'
 }`}>
                      {doc.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-ink mt-1">{doc.documentTitle}</h4>
                  <p className="text-xs text-muted">{doc.residentName} • {doc.purok}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-ink block">
                    {doc.isFreeDueToExemption ? 'FREE (Waiver)' : `₱${doc.fee}.00`}
                  </span>
                  <span className="text-label text-muted block mt-0.5">{doc.submittedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Counters Snapshot */}
        <div className="lg:col-span-5 bg-surface rounded-card border border-line p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line-soft">
            <div>
              <h3 className="text-base font-bold text-ink font-heading">
                Active Service Counters
              </h3>
              <p className="text-xs text-muted">Live physical queue boards</p>
            </div>
            <button
              onClick={() => setActiveTab('staff_queue')}
              className="text-xs font-semibold text-info-fg hover:underline cursor-pointer"
            >
              Open queue board
            </button>
          </div>

          <div className="space-y-3">
            {[
              { counter: 'Counter 1', name: 'Document Clearances', ticket: 'A-012', status: 'SERVING', staff: 'Elena Ramos' },
              { counter: 'Counter 2', name: 'Certificates & Indigency', ticket: 'B-008', status: 'SERVING', staff: 'Grace Bautista' },
              { counter: 'Counter 3', name: 'Cashier & Assessment', ticket: 'C-019', status: 'SERVING', staff: 'Ramon Perez' },
              { counter: 'Counter 4', name: 'Community Blotter & Lupon', ticket: 'D-004', status: 'SERVING', staff: 'Officer Dizon' }
            ].map((c, idx) => (
              <div key={idx} className="p-3.5 rounded-control border border-line bg-surface-muted flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink">{c.counter}</span>
                    <span className="text-label text-muted">({c.name})</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">Clerk: {c.staff}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-primary-strong bg-surface px-2.5 py-1 rounded-lg border border-line">
                    {c.ticket}
                  </span>
                  <span className="text-label font-bold text-primary-strong block mt-1 uppercase tracking-wider">
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('staff_queue')}
              className="w-full py-2.5 bg-navy hover:bg-navy text-white rounded-control text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-primary" />
              <span>Open queue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
