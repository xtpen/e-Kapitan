import React, { useRef, useState } from 'react';
import { CheckCircle2, Circle, Download, IdCard, Search } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { DocumentRequest, RequestStatus } from '../../types';
import {
  Button,
  Card,
  DataTable,
  Field,
  FilterChips,
  Input,
  PageHeader,
  Select,
  StatusPill,
  Textarea,
  documentStatus,
  dateTimeValue,
  formatPeso,
  formatShortDateTime,
} from '../ui';

type StatusFilter = 'all' | RequestStatus;

const STATUS_ORDER: RequestStatus[] = ['submitted', 'under_review', 'returned', 'approved', 'ready_for_release', 'completed', 'rejected'];

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

/** Table name without the law number, e.g. "First-Time Jobseeker Certificate". The detail panel keeps the full name. */
const shortName = (title: string) => title.replace(/\s*\(RA \d+\)\s*$/, '');

/** Fee in plain words. Long law titles become a short reason. */
const feeText = (d: DocumentRequest) => {
  if (d.isFreeDueToExemption || d.fee === 0) {
    const why = d.exemptionReason ?? '';
    if (/11261/.test(why)) return 'Free for first-time jobseekers (RA 11261)';
    return why ? `Free (${why.replace(/\s*exemption$/i, '')})` : 'Free';
  }
  return `${formatPeso(d.fee)}, paid at the hall`;
};

/** Smooth scroll, unless the person asked for less motion. */
const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

const pill = (d: DocumentRequest) => <StatusPill tone={documentStatus[d.status].tone}>{documentStatus[d.status].label}</StatusPill>;

/** Key-value rows. Label above value when the panel is narrow (DESIGN.md 5.14). */
const Details: React.FC<{ rows: [string, React.ReactNode][] }> = ({ rows }) => (
  <dl className="@container mt-3">
    {rows.map(([k, v]) => (
      <div key={k} className="grid @[18rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 gap-y-0.5 py-2 border-b border-line-soft last:border-b-0">
        <dt className="text-meta text-muted">{k}</dt>
        <dd className="text-meta font-semibold break-words">{v}</dd>
      </div>
    ))}
  </dl>
);

/** Admin · Document Requests. Mockups: "Admin · Document requests" (desktop) and "Mobile Admin Requests". See DESIGN.md. */
export const AdminDocumentRequests: React.FC = () => {
  const {
    documentRequests,
    services,
    staffFor,
    updateDocumentRequestStatus,
    assignDocumentRequest,
    setSelectedDocumentForPrint,
  } = useBarangay();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [docType, setDocType] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<'return' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | undefined>();
  const detailRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const shown = documentRequests.filter(
    d =>
      (status === 'all' || d.status === status) &&
      (docType === 'all' || d.documentType === docType) &&
      (!q || d.referenceNumber.toLowerCase().includes(q) || d.residentName.toLowerCase().includes(q)),
  )
    // Same starting order as the table (oldest first), so the panel opens the top row.
    .sort((a, b) => dateTimeValue(a.submittedAt) - dateTimeValue(b.submittedAt));
  const selected = shown.find(d => d.id === selectedId) ?? shown[0];

  const newCount = documentRequests.filter(d => d.status === 'submitted').length;
  const readyCount = documentRequests.filter(d => d.status === 'ready_for_release').length;

  const select = (d: DocumentRequest) => {
    setSelectedId(d.id);
    setPending(null);
    setNote('');
    setNoteError(undefined);
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }));
    }
  };

  const setFilter = (s: StatusFilter) => {
    setStatus(s);
    setSelectedId(null);
  };

  const exportList = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ['Reference', 'Resident', 'Document', 'Purpose', 'Status', 'Received', 'Handled by'],
      ...shown.map(d => [
        d.referenceNumber,
        d.residentName,
        d.documentTitle,
        d.purpose,
        documentStatus[d.status].label,
        formatShortDateTime(d.submittedAt),
        d.assignedStaffName ?? '',
      ]),
    ];
    const url = URL.createObjectURL(new Blob([rows.map(r => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmNote = () => {
    if (!selected || !pending) return;
    if (note.trim().length < 5) {
      setNoteError(pending === 'return' ? 'Tell the resident what to fix.' : 'Give the reason for rejecting.');
      return;
    }
    if (pending === 'return') updateDocumentRequestStatus(selected.id, 'returned', note.trim());
    else updateDocumentRequestStatus(selected.id, 'rejected', undefined, note.trim());
    setPending(null);
    setNote('');
    setNoteError(undefined);
  };

  const renderDetail = (d: DocumentRequest) => {
    const reviewable = d.status === 'submitted' || d.status === 'under_review' || d.status === 'returned';
    const issued = d.status === 'approved' || d.status === 'ready_for_release' || d.status === 'completed';
    const missing = d.requirementsSubmitted.filter(r => !r.submitted).length;

    return (
      <Card aria-live="polite">
        {/* Who and what first, then the status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-h3 font-semibold text-navy-ink">{d.residentName}</h2>
            <p className="text-meta text-muted">
              {d.documentTitle} · {d.referenceNumber}
            </p>
          </div>
          {pill(d)}
        </div>

        <Details
          rows={[
            ['Purpose', d.purpose],
            ['Pickup date', d.appointmentDate ? longDate(d.appointmentDate) : 'Not set yet'],
            ['Fee', feeText(d)],
            ['Contact', d.contactNumber],
            ['Purok', d.purok],
            ['Received', formatShortDateTime(d.submittedAt)],
          ]}
        />

        {d.staffNotes && d.status !== 'rejected' && (
          <p className="mt-3 text-meta rounded-control bg-warning-bg text-warning-fg px-3 py-2">
            <b className="font-semibold">Note to resident: </b>
            {d.staffNotes}
          </p>
        )}
        {d.status === 'rejected' && d.rejectionReason && (
          <p className="mt-3 text-meta rounded-control bg-danger-bg text-danger-fg px-3 py-2">
            <b className="font-semibold">Reason: </b>
            {d.rejectionReason}
          </p>
        )}

        {/* Requirements + ID */}
        <h3 className="font-semibold text-meta mt-4 mb-2">
          Requirements
          {missing > 0 && <span className="font-normal text-muted"> · {missing} to bring to the hall</span>}
        </h3>
        <ul className="space-y-1.5" aria-label="Requirements">
          {d.requirementsSubmitted.map(r => (
            <li key={r.name} className="flex items-start gap-2 text-meta">
              {r.submitted ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-success-fg" strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <Circle className="w-5 h-5 shrink-0 text-muted" strokeWidth={1.8} aria-hidden="true" />
              )}
              <span>
                {r.name}
                <span className="text-muted"> · {r.submitted ? 'uploaded' : 'bring to the hall'}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-control bg-surface-muted px-3 py-2.5 flex items-center gap-3 text-meta text-muted">
          <IdCard className="w-5 h-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          <span>Valid ID photo shows here once uploaded.</span>
        </div>

        <Field label="Handled by">
          {p => (
            <Select
              {...p}
              value={d.assignedStaffName ?? ''}
              disabled={!reviewable}
              onChange={e => {
                assignDocumentRequest(d.id, e.target.value);
                if (d.status === 'submitted') updateDocumentRequestStatus(d.id, 'under_review');
              }}
            >
              <option value="" disabled>
                Not assigned yet
              </option>
              {staffFor('documents').map(s => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          )}
        </Field>

        {/* Actions depend on where the request is */}
        {pending ? (
          <div className="mt-4">
            <Field
              label={pending === 'return' ? 'What should the resident fix?' : 'Reason for rejecting'}
              error={noteError}
              help="The resident sees this in My Requests."
            >
              {p => <Textarea {...p} autoFocus value={note} onChange={e => setNote(e.target.value)} />}
            </Field>
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <Button variant="secondary" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button variant={pending === 'reject' ? 'danger' : 'primary'} onClick={confirmNote}>
                {pending === 'return' ? 'Send back' : 'Reject request'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-2.5">
            {reviewable && (
              <>
                <Button fullWidth onClick={() => updateDocumentRequestStatus(d.id, 'approved')}>
                  Approve request
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button variant="secondary" onClick={() => setPending('return')}>
                    Send back to fix
                  </Button>
                  <Button variant="danger" onClick={() => setPending('reject')}>
                    Reject
                  </Button>
                </div>
              </>
            )}
            {d.status === 'approved' && (
              <Button fullWidth onClick={() => updateDocumentRequestStatus(d.id, 'ready_for_release')}>
                Mark ready for pickup
              </Button>
            )}
            {d.status === 'ready_for_release' && (
              <Button fullWidth onClick={() => updateDocumentRequestStatus(d.id, 'completed')}>
                Mark as picked up
              </Button>
            )}
            {d.status === 'completed' && (
              <p className="text-meta text-muted">Picked up{d.completedAt ? ` on ${formatShortDateTime(d.completedAt)}` : ''}.</p>
            )}
            {issued && (
              <Button variant="secondary" fullWidth onClick={() => setSelectedDocumentForPrint(d)}>
                View certificate
              </Button>
            )}
          </div>
        )}
      </Card>
    );
  };

  const summary = [
    newCount > 0 && `${newCount} new`,
    readyCount > 0 && `${readyCount} ready for pickup`,
  ].filter(Boolean).join(', ');

  return (
    <div className="max-w-[1280px]">
      <PageHeader
        title="Document requests"
        description={
          summary ? `${summary}. Check each request, then approve or send it back.` : 'Check each request, then approve or send it back.'
        }
        action={
          <span className="hidden md:block">
            <Button variant="secondary" size="sm" onClick={exportList} icon={<Download className="w-5 h-5" aria-hidden="true" />}>
              Download list
            </Button>
          </span>
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] gap-4 items-start">
        {/* List card: filters on top (one row on tablet/desktop; search + chips on phones), then the table. */}
        <Card>
          <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-3 [&_label]:mt-0">
            <Field label="Search">
              {p => (
                <div className="relative">
                  <Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <Input
                    {...p}
                    type="search"
                    className="pl-11"
                    placeholder="Name or reference number"
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value);
                      setSelectedId(null);
                    }}
                  />
                </div>
              )}
            </Field>
            <Field label="Status" className="hidden md:block">
              {p => (
                <Select {...p} value={status} onChange={e => setFilter(e.target.value as StatusFilter)}>
                  <option value="all">All</option>
                  {STATUS_ORDER.map(s => (
                    <option key={s} value={s}>
                      {documentStatus[s].label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Document" className="hidden md:block">
              {p => (
                <Select
                  {...p}
                  value={docType}
                  onChange={e => {
                    setDocType(e.target.value);
                    setSelectedId(null);
                  }}
                >
                  <option value="all">All documents</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {shortName(s.title)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <FilterChips<StatusFilter>
            className="md:hidden mt-3"
            label="Status"
            value={status}
            onChange={setFilter}
            chips={[
              { id: 'all', label: 'All' },
              { id: 'submitted', label: 'New' },
              { id: 'under_review', label: 'Under review' },
              { id: 'ready_for_release', label: 'Ready for pickup' },
            ]}
          />

          <div className="mt-4">
            <DataTable<DocumentRequest>
              rows={shown}
              rowKey={d => d.id}
              onRowClick={select}
              isSelected={d => d.id === selected?.id}
              rowLabel={d => `Open ${d.referenceNumber}, ${d.residentName}`}
              defaultSort={{ header: 'Received', direction: 'asc' }}
              columns={[
                {
                  header: 'Resident',
                  sortValue: d => d.residentName,
                  cell: d => (
                    <>
                      <span className="block font-semibold text-ink">{d.residentName}</span>
                      <span className="block text-caption text-muted whitespace-nowrap">{d.referenceNumber}</span>
                    </>
                  ),
                },
                { header: 'Document', cell: d => shortName(d.documentTitle), sortValue: d => d.documentTitle },
                {
                  header: 'Received',
                  cell: d => formatShortDateTime(d.submittedAt),
                  className: 'whitespace-nowrap text-muted',
                  sortValue: d => dateTimeValue(d.submittedAt),
                  sortLabels: ['oldest first', 'newest first'],
                },
                { header: 'Status', cell: pill, sortValue: d => STATUS_ORDER.indexOf(d.status), sortLabels: ['by step', 'by step, reversed'] },
              ]}
              mobile={{ title: d => d.residentName, status: pill, meta: d => `${shortName(d.documentTitle)} · ${d.referenceNumber}` }}
              empty={
                <div className="py-6 text-center">
                  <p className="font-semibold">No requests found.</p>
                  <p className="text-meta text-muted mt-1">Try another status or clear the search.</p>
                </div>
              }
            />
          </div>
        </Card>

        {/* Detail panel: sticks beside the list on desktop, scrolls on its own if it is taller than the screen. */}
        <div ref={detailRef} className="scroll-mt-24 lg:sticky lg:top-[96px] lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto lg:rounded-card">
          {selected ? (
            renderDetail(selected)
          ) : (
            <Card>
              <h2 className="text-h3 font-semibold text-navy-ink">Request details</h2>
              <p className="text-meta text-muted mt-1">Choose a request from the list to check it.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
