import React, { useState } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { QueueTicket } from '../../types';
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  PlusCircle, 
  PhoneCall, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Volume2,
  XCircle,
  TrendingUp,
  Printer
} from 'lucide-react';

export const SmartQueueManagement: React.FC = () => {
  const { 
    queueTickets, 
    callQueueTicket, 
    completeQueueTicket, 
    dismissQueueTicket, 
    createQueueTicket, 
    largeTextMode 
  } = useBarangay();

  const [selectedTicketId, setSelectedTicketId] = useState<string>(queueTickets[0]?.id || '');
  const [showWalkInModal, setShowWalkInModal] = useState<boolean>(false);

  // Walk-in form states
  const [residentName, setResidentName] = useState<string>('');
  const [serviceTitle, setServiceTitle] = useState<string>('Barangay Clearance');
  const [isSenior, setIsSenior] = useState<boolean>(false);
  const [isPWD, setIsPWD] = useState<boolean>(false);
  const [isPregnant, setIsPregnant] = useState<boolean>(false);
  const [isEmergency, setIsEmergency] = useState<boolean>(false);

  // Counters definition
  const counters = [
    { number: 1, name: 'Counter 1 (Clearances)', clerk: 'Elena Ramos', service: 'Clearances & ID Verification' },
    { number: 2, name: 'Counter 2 (Certificates)', clerk: 'Grace Bautista', service: 'Residency, Indigency, First-Time Jobseeker' },
    { number: 3, name: 'Counter 3 (Cashier)', clerk: 'Ramon Perez', service: 'Fee Assessment & Official Receipts' },
    { number: 4, name: 'Counter 4 (Social & Lupon)', clerk: 'Officer Dizon', service: 'Blotter, Lupon Conciliation, Senior Aid' },
  ];

  // Group tickets by status
  const servingTickets = queueTickets.filter(t => t.status === 'in_service' || t.status === 'called');
  const waitingTickets = queueTickets.filter(t => t.status === 'waiting');
  const completedTickets = queueTickets.filter(t => t.status === 'completed');

  const activeTicket = queueTickets.find(t => t.id === selectedTicketId) || waitingTickets[0] || servingTickets[0];

  const handleIssueWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentName.trim()) return;

    const created = createQueueTicket({
      residentName: residentName.trim(),
      serviceTitle,
      isSenior,
      isPWD,
      isPregnant,
      isEmergency,
      hasAppointment: false
    });

    setSelectedTicketId(created.id);
    setShowWalkInModal(false);
    setResidentName('');
    setIsSenior(false);
    setIsPWD(false);
    setIsPregnant(false);
    setIsEmergency(false);
  };

  return (
    <div className={`space-y-6 ${largeTextMode ?'text-lg':'text-base'}`}>
      {/* Top Banner with Action */}
      <div className="bg-surface rounded-card p-6 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-strong text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Smart Priority Queue Orchestrator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink font-heading">
            Live Counter Queue & Service Board
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time physical desk queue, automated RA 9994/RA 7277 priority routing, and walk-in ticket dispenser.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWalkInModal(true)}
            className="px-4 py-2.5 bg-primary-strong hover:bg-primary-strong text-white font-bold rounded-control text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            id="issue-walkin-ticket-btn"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue walk-in ticket</span>
          </button>
        </div>
      </div>

      {/* Live Counter Display Grid (Simulating Hall Monitors) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Current Serving Counters (Hall Display Monitors)
          </h3>
          <span className="text-xs font-semibold text-primary-strong flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            Syncing Live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {counters.map((c) => {
            const currentServing = servingTickets.find(t => t.counterNumber === c.number);

            return (
              <div
                key={c.number}
                className="bg-navy text-white rounded-card p-5 border border-navy flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-warning-fg font-heading tracking-wide">
                      Counter {c.number}
                    </span>
                    <span className={`text-label font-bold uppercase px-2 py-0.5 rounded ${
 currentServing ?'bg-primary text-white':'bg-navy text-muted'
 }`}>
                      {currentServing ? 'NOW SERVING' : 'STANDBY'}
                    </span>
                  </div>
                  <p className="text-label text-muted">{c.service}</p>
                </div>

                <div className="my-5 text-center py-4 bg-navy-deep/60 rounded-control border border-navy">
                  <span className="text-3xl sm:text-4xl font-bold tracking-widest text-primary">
                    {currentServing ? currentServing.ticketNumber : '--'}
                  </span>
                  <p className="text-xs text-on-navy font-medium mt-1 truncate px-2">
                    {currentServing ? currentServing.residentName : 'No active ticket'}
                  </p>
                </div>

                <div className="pt-2 border-t border-navy flex items-center justify-between">
                  <span className="text-label text-muted">Clerk: {c.clerk.split(' ')[0]}</span>
                  <button
                    onClick={() => {
                      const nextWaiting = waitingTickets[0];
                      if (nextWaiting) {
                        callQueueTicket(nextWaiting.id, c.number);
                        setSelectedTicketId(nextWaiting.id);
                      } else {
                        alert('No tickets waiting in line.');
                      }
                    }}
                    className="px-3 py-1 bg-primary hover:bg-primary text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Call next</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Queue Management Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Waiting Tickets */}
        <div className="lg:col-span-6 bg-surface rounded-card border border-line p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line-soft">
            <div>
              <h3 className="text-base font-bold text-ink font-heading">
                Waiting Line ({waitingTickets.length})
              </h3>
              <p className="text-xs text-muted">Sorted automatically by Priority Score & Arrival Time</p>
            </div>
            <span className="text-xs font-bold text-muted bg-surface-muted px-2.5 py-1 rounded-lg">
              Total Today: {queueTickets.length}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {waitingTickets.map((t) => {
              const isSelected = activeTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-4 rounded-control border transition-all cursor-pointer ${
 isSelected
 ?'border-primary bg-primary-tint/70 ring-1 ring-primary'
 :'border-line bg-surface hover:border-field-line'
 }`}
                  id={`ticket-card-${t.ticketNumber}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-ink">
                        {t.ticketNumber}
                      </span>
                      {(t.isSenior || t.isPWD) && (
                        <span className="text-label font-bold uppercase px-2 py-0.5 rounded-full bg-danger-bg text-danger-fg border border-danger-bg">
                          Senior / PWD Priority
                        </span>
                      )}
                      {t.hasAppointment && (
                        <span className="text-label font-bold uppercase px-2 py-0.5 rounded-full bg-info-bg text-navy border border-line">
                          Appointment Pre-Booked
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted">{t.issuedAt}</span>
                  </div>

                  <h4 className="text-sm font-bold text-ink">{t.residentName}</h4>
                  <p className="text-xs text-muted mt-0.5">{t.serviceTitle}</p>

                  <div className="mt-2 pt-2 border-t border-line-soft flex items-center justify-between text-label text-muted">
                    <span>Priority Score: <strong className="text-primary-strong">{t.priorityScore} pts</strong></span>
                    <span>Est. wait: ~{t.estimatedWaitMinutes}m</span>
                  </div>
                </div>
              );
            })}

            {waitingTickets.length === 0 && (
              <div className="p-8 text-center text-muted text-xs">
                No tickets currently waiting in line.
              </div>
            )}
          </div>
        </div>

        {/* Right Active Ticket Detail & Counter Control Panel */}
        {activeTicket ? (
          <div className="lg:col-span-6 bg-surface rounded-card border border-line p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                  Active Ticket Console
                </span>
                <h3 className="text-2xl font-bold text-ink mt-0.5">
                  {activeTicket.ticketNumber}
                </h3>
              </div>

              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
 activeTicket.status ==='in_service'?'bg-primary-tint text-primary-strong border border-primary-tint-line animate-pulse':
 activeTicket.status ==='called'?'bg-info-bg text-navy border border-line':
 activeTicket.status ==='waiting'?'bg-warning-bg text-warning-fg border border-warning-bg':
'bg-surface-muted text-ink'
 }`}>
                Status: {activeTicket.status.toUpperCase()}
              </span>
            </div>

            {/* Priority Score Breakdown Card */}
            <div className="p-4 rounded-control border text-xs bg-surface-muted border-line text-ink space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-label">Algorithmic Priority Score</span>
                <span className="font-bold text-primary-strong text-sm">{activeTicket.priorityScore} Points</span>
              </div>
              <p className="text-muted text-label">
                Transparent priority allocation mandated by Republic Act 9994 (Senior Citizens Act) & Republic Act 7277 (Magna Carta for PWDs).
              </p>
              <div className="space-y-1 pt-1">
                {activeTicket.priorityFactors.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between text-label bg-surface p-1.5 rounded border border-line-soft">
                    <span className="text-ink font-medium">{f.factor}</span>
                    <span className="font-bold text-primary-strong ">+{f.points} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ticket Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface-muted rounded-control border border-line">
                <span className="text-muted block text-label uppercase font-bold">Resident Name</span>
                <span className="font-bold text-ink mt-0.5 block">{activeTicket.residentName}</span>
              </div>
              <div className="p-3 bg-surface-muted rounded-control border border-line">
                <span className="text-muted block text-label uppercase font-bold">Service Category</span>
                <span className="font-bold text-ink mt-0.5 block">{activeTicket.serviceTitle}</span>
              </div>
              <div className="p-3 bg-surface-muted rounded-control border border-line">
                <span className="text-muted block text-label uppercase font-bold">Counter Assignment</span>
                <span className="font-semibold text-ink mt-0.5 block">
                  {activeTicket.counterNumber ? `Counter ${activeTicket.counterNumber}` : 'Unassigned'}
                </span>
              </div>
              <div className="p-3 bg-surface-muted rounded-control border border-line">
                <span className="text-muted block text-label uppercase font-bold">Time Issued</span>
                <span className="font-semibold text-ink mt-0.5 block">{activeTicket.issuedAt}</span>
              </div>
            </div>

            {/* Counter Action Controls */}
            <div className="pt-2 border-t border-line space-y-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Counter Desk Operations:
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {activeTicket.status === 'waiting' ? (
                  <button
                    onClick={() => callQueueTicket(activeTicket.id, 1)}
                    className="py-2.5 px-4 bg-primary hover:bg-primary-strong text-white font-bold rounded-control text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer col-span-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Call to counter 1</span>
                  </button>
                ) : activeTicket.status === 'in_service' || activeTicket.status === 'called' ? (
                  <button
                    onClick={() => completeQueueTicket(activeTicket.id)}
                    className="py-2.5 px-4 bg-primary-strong hover:bg-primary-strong text-white font-bold rounded-control text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer col-span-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary-tint" />
                    <span>Mark as released</span>
                  </button>
                ) : null}

                <button
                  onClick={() => dismissQueueTicket(activeTicket.id)}
                  className="py-2 px-3 bg-surface-muted hover:bg-danger-bg hover:text-danger-fg text-ink rounded-control text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Mark as no-show</span>
                </button>

                <button
                  onClick={() => {
                    alert(`Audio Chime Triggered: "Calling Ticket ${activeTicket.ticketNumber}, please proceed to Counter ${activeTicket.counterNumber || 1}"`);
                  }}
                  className="py-2 px-3 bg-surface-muted hover:bg-info-bg hover:text-navy text-ink rounded-control text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Repeat chime</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-6 bg-surface rounded-card border border-line p-12 text-center">
            <p className="text-sm font-semibold text-ink">Select a ticket from the left to view controls.</p>
          </div>
        )}
      </div>

      {/* Walk-in Ticket Issuance Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 ">
          <div className="bg-surface rounded-card max-w-lg w-full p-6 border border-line shadow-float space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-line-soft">
              <div>
                <h3 className="text-lg font-bold text-ink font-heading">
                  Issue Walk-in Queue Ticket
                </h3>
                <p className="text-xs text-muted">Fast physical dispenser for counter walk-ins</p>
              </div>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueWalkIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">
                  Resident Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Juan dela Cruz"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-muted border border-line rounded-control text-xs sm:text-sm focus:bg-surface focus:outline-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">
                  Requested Barangay Service *
                </label>
                <select
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-muted border border-line rounded-control text-xs sm:text-sm"
                >
                  <option value="Barangay Clearance">Barangay Clearance</option>
                  <option value="Certificate of Residency">Certificate of Residency</option>
                  <option value="Certificate of Indigency">Certificate of Indigency</option>
                  <option value="Business Clearance">Barangay Business Clearance</option>
                  <option value="First-Time Jobseeker (RA 11261)">First-Time Jobseeker Certificate (RA 11261)</option>
                  <option value="General Public Inquiry">General Inquiry / Consultation</option>
                </select>
              </div>

              {/* Priority Checkboxes */}
              <div className="p-3.5 bg-surface-muted rounded-control border border-line space-y-2">
                <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Priority Lane Entitlements (RA 9994 / RA 7277)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-surface rounded-lg border border-line cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSenior}
                      onChange={(e) => setIsSenior(e.target.checked)}
                      className="rounded text-primary"
                    />
                    <span>Senior Citizen (60+)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface rounded-lg border border-line cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPWD}
                      onChange={(e) => setIsPWD(e.target.checked)}
                      className="rounded text-primary"
                    />
                    <span>Person with Disability</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface rounded-lg border border-line cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPregnant}
                      onChange={(e) => setIsPregnant(e.target.checked)}
                      className="rounded text-primary"
                    />
                    <span>Pregnant Mother</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface rounded-lg border border-line cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEmergency}
                      onChange={(e) => setIsEmergency(e.target.checked)}
                      className="rounded text-primary"
                    />
                    <span>Urgent Medical / Crisis</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-muted rounded-control"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-strong hover:bg-primary-strong text-white font-bold rounded-control text-xs "
                >
                  Print ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
