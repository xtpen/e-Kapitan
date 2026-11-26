import React, { useState } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { DocumentRequest, RequestStatus } from '../../types';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Printer, 
  User, 
  Calendar, 
  Filter,
  Check,
  AlertCircle,
  QrCode,
  ArrowRight
} from 'lucide-react';
import { BARANGAY } from '../../config/barangay';

export const DocumentProcessingQueue: React.FC = () => {
  const { 
    documentRequests, 
    updateDocumentRequestStatus, 
    setSelectedDocumentForPrint, 
    largeTextMode 
  } = useBarangay();

  const [selectedReqId, setSelectedReqId] = useState<string>(documentRequests[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [staffNotesInput, setStaffNotesInput] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  const filteredRequests = documentRequests.filter((req) => {
    const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
    const matchesSearch = 
      req.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.purok.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.documentTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeRequest = documentRequests.find(r => r.id === selectedReqId) || filteredRequests[0];

  const handleStatusChange = (status: RequestStatus) => {
    if (!activeRequest) return;
    updateDocumentRequestStatus(activeRequest.id, status, staffNotesInput.trim() || undefined);
    setStaffNotesInput('');
  };

  const handleConfirmReject = () => {
    if (!activeRequest || !rejectReason.trim()) return;
    updateDocumentRequestStatus(activeRequest.id, 'rejected', rejectReason.trim());
    setShowRejectModal(false);
    setRejectReason('');
  };

  return (
    <div className={`space-y-6 ${largeTextMode ?'text-lg':'text-base'}`}>
      {/* Header Bar */}
      <div className="bg-surface rounded-card p-6 border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-strong text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Records & Civil Documentation Desk</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink font-heading">
            Document Requests Processing Queue
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Review online applications, verify civil records, apply fee waivers, and authorize cryptographic QR signatures.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search ref or applicant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-muted border border-line rounded-control text-xs sm:text-sm focus:bg-surface focus:outline-primary"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'submitted', 'under_review', 'approved', 'ready_for_release', 'completed', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3.5 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
 filterStatus === status
 ?'bg-primary-strong text-white'
 :'bg-surface text-ink hover:bg-surface-muted border border-line'
 }`}
          >
            {status === 'All' ? 'All Applications' : status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
          {filteredRequests.map((req) => {
            const isSelected = activeRequest?.id === req.id;
            return (
              <div
                key={req.id}
                onClick={() => setSelectedReqId(req.id)}
                className={`p-4 rounded-control border transition-all cursor-pointer ${
 isSelected
 ?'border-primary bg-primary-tint/70 ring-1 ring-primary'
 :'border-line bg-surface hover:border-field-line'
 }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-ink">{req.referenceNumber}</span>
                  <span className={`text-label font-bold uppercase px-2 py-0.5 rounded-full ${
 req.status ==='completed'?'bg-primary-tint text-primary-strong':
 req.status ==='ready_for_release'?'bg-info-bg text-navy-ink':
 req.status ==='approved'?'bg-info-bg text-navy-ink':
 req.status ==='rejected'?'bg-danger-bg text-danger-fg':
'bg-warning-bg text-warning-fg'
 }`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-ink">{req.documentTitle}</h4>
                <p className="text-xs text-muted mt-0.5">{req.residentName} • {req.purok}</p>

                <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-label text-muted">
                  <span>{req.submittedAt}</span>
                  <span className="font-bold text-ink">
                    {req.isFreeDueToExemption ? 'FREE (Exempt)' : `₱${req.fee}.00`}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredRequests.length === 0 && (
            <div className="bg-surface rounded-control p-8 text-center border border-line">
              <p className="text-xs text-muted">No applications match the current filter.</p>
            </div>
          )}
        </div>

        {/* Right Active Processing Console */}
        {activeRequest ? (
          <div className="lg:col-span-7 bg-surface rounded-card border border-line p-6 space-y-6">
            {/* Header & QR Hash */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-line">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary-strong bg-primary-tint px-2 py-0.5 rounded border border-primary-tint-line">
                    {activeRequest.referenceNumber}
                  </span>
                  <span className="text-label text-muted">
                    QR Hash: {activeRequest.verificationCode}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-ink font-heading mt-1">
                  {activeRequest.documentTitle}
                </h3>
              </div>

              {/* Inspect Printable Certificate */}
              <button
                onClick={() => setSelectedDocumentForPrint(activeRequest)}
                className="px-4 py-2 bg-primary-strong hover:bg-primary-strong text-white rounded-control text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                id="staff-inspect-cert-btn"
              >
                <Printer className="w-4 h-4" />
                <span>View certificate</span>
              </button>
            </div>

            {/* Applicant & Background Check Verification Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 rounded-control bg-surface-muted border border-line">
                <span className="text-label uppercase font-bold text-muted block">Applicant Name</span>
                <span className="font-bold text-ink text-sm mt-0.5 block">{activeRequest.residentName}</span>
                <span className="text-muted">{activeRequest.purok}</span>
              </div>

              <div className="p-3.5 rounded-control bg-surface-muted border border-line">
                <span className="text-label uppercase font-bold text-muted block">Contact & Delivery</span>
                <span className="font-semibold text-ink mt-0.5 block">{activeRequest.contactNumber}</span>
                <span className="text-muted capitalize">Method: {activeRequest.processingMethod.replace('_', ' ')}</span>
              </div>

              <div className="p-3.5 rounded-control bg-surface-muted border border-line">
                <span className="text-label uppercase font-bold text-muted block">Declared Purpose</span>
                <span className="font-medium text-ink mt-0.5 block">{activeRequest.purpose}</span>
              </div>

              <div className="p-3.5 rounded-control bg-surface-muted border border-line">
                <span className="text-label uppercase font-bold text-muted block">Fee Assessment</span>
                <span className="font-bold text-ink mt-0.5 block">
                  {activeRequest.isFreeDueToExemption ? 'FREE OF CHARGE' : `₱${activeRequest.fee}.00`}
                </span>
                {activeRequest.isFreeDueToExemption && (
                  <span className="text-primary-strong font-medium text-label block">
                    {activeRequest.exemptionReason || 'Legal Exemption (RA 11261 / Indigent)'}
                  </span>
                )}
              </div>
            </div>

            {/* Clearance Derogatory Records Validation Stamp */}
            <div className="p-3.5 rounded-control bg-primary-tint border border-primary-tint-line flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-primary-strong shrink-0" />
                <div>
                  <span className="font-bold text-primary-strong block">Barangay {BARANGAY} Civil Blotter Verification</span>
                  <span className="text-primary-strong">Clear Record: No active warrant, pending Lupon mediation, or citation.</span>
                </div>
              </div>
              <span className="text-label font-bold bg-primary-tint-line text-primary-strong px-2 py-0.5 rounded">
                PASSED
              </span>
            </div>

            {/* Submitted Requirements Checklist */}
            <div>
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">
                Mandatory Supporting Documents Submitted:
              </h4>
              <div className="space-y-1.5">
                {activeRequest.requirementsSubmitted.map((req, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-surface-muted border border-line flex items-center justify-between text-xs">
                    <span className="text-ink">{req.name}</span>
                    <span className="text-label font-bold text-primary-strong bg-primary-tint px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" /> Uploaded & Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Internal Note Input */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                Add Clerk Internal Notes / Pickup Instructions
              </label>
              <input
                type="text"
                placeholder="e.g. Verified cedula # 109281. Ready for Punong Barangay dry seal..."
                value={staffNotesInput}
                onChange={(e) => setStaffNotesInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-muted border border-line rounded-control text-xs sm:text-sm focus:bg-surface"
              />
            </div>

            {/* Operational Action Buttons by Workflow Stage */}
            <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {activeRequest.status === 'submitted' && (
                  <button
                    onClick={() => handleStatusChange('under_review')}
                    className="px-4 py-2 bg-navy hover:bg-navy text-white font-bold rounded-control text-xs transition-all cursor-pointer"
                  >
                    Start review
                  </button>
                )}

                {activeRequest.status === 'under_review' && (
                  <button
                    onClick={() => handleStatusChange('approved')}
                    className="px-4 py-2 bg-navy hover:bg-navy text-white font-bold rounded-control text-xs transition-all cursor-pointer"
                  >
                    Approve request
                  </button>
                )}

                {activeRequest.status === 'approved' && (
                  <button
                    onClick={() => handleStatusChange('ready_for_release')}
                    className="px-4 py-2 bg-primary hover:bg-primary-strong text-white font-bold rounded-control text-xs transition-all cursor-pointer"
                  >
                    Mark ready for pickup
                  </button>
                )}

                {activeRequest.status === 'ready_for_release' && (
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="px-4 py-2 bg-primary-strong hover:bg-primary-strong text-white font-bold rounded-control text-xs transition-all cursor-pointer"
                  >
                    Mark as released
                  </button>
                )}
              </div>

              {activeRequest.status !== 'rejected' && activeRequest.status !== 'completed' && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-3 py-2 bg-danger-bg hover:bg-danger-bg text-danger-fg font-semibold rounded-control text-xs transition-colors cursor-pointer"
                >
                  Reject request
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-surface rounded-card border border-line p-12 text-center">
            <p className="text-sm font-semibold text-ink">Select an application from the left to process.</p>
          </div>
        )}
      </div>

      {/* Reject Application Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 ">
          <div className="bg-surface rounded-card max-w-md w-full p-6 border border-line shadow-float space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-ink font-heading">
              Reject Document Application
            </h3>
            <p className="text-xs text-muted">
              Please specify the official reason for rejection (e.g. incomplete cedula, address outside jurisdiction). The applicant will be notified immediately.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Official reason for rejection..."
              className="w-full p-3 border border-line rounded-control text-xs sm:text-sm focus:outline-danger-fg"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-muted rounded-control"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold bg-danger-fg hover:bg-danger-fg text-white rounded-control "
              >
                Reject request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
