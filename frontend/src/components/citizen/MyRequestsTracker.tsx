import React, { useRef, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { DocumentRequest, RequestStatus } from '../../types';
import {
  Button,
  Card,
  DataTable,
  FilterChips,
  Input,
  PageHeader,
  ProgressTimeline,
  StatusPill,
  formatPeso,
  formatShortDateTime,
  type TimelineStage,
} from '../ui';
import { buildReportStages } from './ComplaintsView';
import { useResidentActivity, type ActivityKind, type ActivityRow } from './useResidentActivity';

type Filter = 'all' | 'active' | ActivityKind;

const KIND_LABEL: Record<ActivityKind, string> = {
  document: 'Documents',
  report: 'Reports',
  printing: 'Printing',
  court: 'Court',
  appointment: 'Appointments',
};

const OPEN_LABEL: Record<ActivityKind, string> = {
  document: 'Go to Documents',
  report: 'Go to Complaints & Reports',
  printing: 'Go to Printing',
  court: 'Go to Court Reservation',
  appointment: 'Go to Appointments',
};

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const COLOR_LABEL = { black_and_white: 'Black and white', color: 'Color' } as const;
const SIDES_LABEL = { one_sided: 'One-sided', two_sided: 'Two-sided' } as const;

/** Document progress: Received → Under review → Approved → Ready for pickup → Claimed. */
const documentStages = (d: DocumentRequest): TimelineStage[] => {
  const order: RequestStatus[] = ['submitted', 'under_review', 'approved', 'ready_for_release', 'completed'];
  const labels = ['Received', 'Under review', 'Approved', 'Ready for pickup', 'Claimed'];
  const tones: TimelineStage['tone'][] = ['success', 'info', 'success', 'success', 'success'];
  if (d.status === 'returned') {
    return [
      { label: 'Received', tone: 'success', reached: true, detail: formatShortDateTime(d.submittedAt) },
      { label: 'Under review', tone: 'info', reached: true },
      { label: 'Returned for correction', tone: 'warning', reached: true, detail: formatShortDateTime(d.updatedAt), note: d.staffNotes },
    ];
  }
  if (d.status === 'rejected') {
    return [
      { label: 'Received', tone: 'success', reached: true, detail: formatShortDateTime(d.submittedAt) },
      { label: 'Under review', tone: 'info', reached: true },
      { label: 'Not approved', tone: 'danger', reached: true, detail: formatShortDateTime(d.updatedAt), note: d.rejectionReason },
    ];
  }
  const current = order.indexOf(d.status);
  return order.map((s, i) => ({
    label: labels[i],
    tone: tones[i],
    reached: i <= current,
    detail: i === 0 ? formatShortDateTime(d.submittedAt) : i === current ? formatShortDateTime(d.updatedAt) : undefined,
    note: i === current && d.staffNotes ? d.staffNotes : undefined,
  }));
};

const Details: React.FC<{ rows: [string, React.ReactNode][] }> = ({ rows }) => (
  <dl className="mt-4">
    {rows.map(([k, v]) => (
      <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2.5 border-b border-line-soft last:border-b-0">
        <dt className="text-meta text-muted">{k}</dt>
        <dd className="text-meta font-semibold break-words">{v}</dd>
      </div>
    ))}
  </dl>
);

/** Resident · My Requests. No mockup; built from DESIGN.md patterns (list + detail). */
export const MyRequestsTracker: React.FC = () => {
  const {
    documentRequests,
    incidents,
    printRequests,
    courtReservations,
    courtSlots,
    appointments,
    setActiveTab,
    setSelectedDocumentForPrint,
  } = useBarangay();
  const { rows } = useResidentActivity();

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const kinds = (Object.keys(KIND_LABEL) as ActivityKind[]).filter(k => rows.some(r => r.kind === k));
  const count = (f: Filter) =>
    f === 'all' ? rows.length : f === 'active' ? rows.filter(r => r.isActive).length : rows.filter(r => r.kind === f).length;

  const q = query.trim().toLowerCase();
  const shown = rows.filter(
    r =>
      (filter === 'all' || (filter === 'active' ? r.isActive : r.kind === filter)) &&
      (!q || r.reference.toLowerCase().includes(q) || r.service.toLowerCase().includes(q)),
  );
  const selected = shown.find(r => r.id === selectedId) ?? shown[0];

  const select = (r: ActivityRow) => {
    setSelectedId(r.id);
    setCopied(false);
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const copyReference = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const pill = (r: ActivityRow) => <StatusPill tone={r.status.tone}>{r.status.label}</StatusPill>;

  /* ---------- Detail panel per kind ---------- */
  const renderDetail = (r: ActivityRow) => {
    let body: React.ReactNode = null;
    let extraAction: React.ReactNode = null;

    if (r.kind === 'document') {
      const d = documentRequests.find(x => x.id === r.id);
      if (d) {
        const free = d.isFreeDueToExemption || d.fee === 0;
        body = (
          <>
            <ProgressTimeline className="mt-4" stages={documentStages(d)} />
            <Details
              rows={[
                ['Purpose', d.purpose],
                ['Claiming date', d.appointmentDate ? longDate(d.appointmentDate) : 'When we notify you'],
                ['Fee', free ? `Free${d.exemptionReason ? ` (${d.exemptionReason})` : ''}` : `${formatPeso(d.fee)}, paid at the hall`],
                ['Submitted', formatShortDateTime(d.submittedAt)],
              ]}
            />
          </>
        );
        if (d.status === 'approved' || d.status === 'ready_for_release' || d.status === 'completed') {
          extraAction = (
            <Button variant="secondary" size="sm" onClick={() => setSelectedDocumentForPrint(d)}>
              View certificate
            </Button>
          );
        }
      }
    } else if (r.kind === 'report') {
      const i = incidents.find(x => x.id === r.id);
      if (i) {
        body = (
          <>
            <ProgressTimeline className="mt-4" stages={buildReportStages(i)} />
            <Details
              rows={[
                ['Concern', i.category],
                ['Location', i.location],
                ['Filed', formatShortDateTime(i.submittedAt)],
              ]}
            />
          </>
        );
      }
    } else if (r.kind === 'printing') {
      const p = printRequests.find(x => x.id === r.id);
      if (p) {
        body = (
          <Details
            rows={[
              ['File', p.fileName],
              ['Pages × copies', `${p.pages} × ${p.copies}`],
              ['Options', `${p.paperSize}, ${COLOR_LABEL[p.color].toLowerCase()}, ${SIDES_LABEL[p.sides].toLowerCase()}`],
              ['Cost', 'Free'],
              ['Submitted', formatShortDateTime(p.submittedAt)],
              ...(p.rejectionReason ? ([['Reason', p.rejectionReason]] as [string, string][]) : []),
            ]}
          />
        );
      }
    } else if (r.kind === 'court') {
      const c = courtReservations.find(x => x.id === r.id);
      if (c) {
        body = (
          <Details
            rows={[
              ['Date', longDate(c.date)],
              ['Time', courtSlots.find(s => s.id === c.slotId)?.label ?? c.slotId],
              ['Activity', c.activity],
              ['Submitted', formatShortDateTime(c.submittedAt)],
              ...(c.notes ? ([['Note from staff', c.notes]] as [string, string][]) : []),
            ]}
          />
        );
      }
    } else if (r.kind === 'appointment') {
      const a = appointments.find(x => x.id === r.id);
      if (a) {
        body = (
          <Details
            rows={[
              ['Service', a.serviceTitle],
              ['Date', longDate(a.date)],
              ['Time', a.timeSlot],
            ]}
          />
        );
      }
    }

    return (
      <Card aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-meta text-muted">{KIND_LABEL[r.kind]}</p>
            <h2 className="text-h3 font-semibold text-navy leading-snug">{r.service}</h2>
          </div>
          {pill(r)}
        </div>
        <p className="mt-2 text-meta">
          Reference <b className="font-semibold">{r.reference}</b>
        </p>
        {body}
        <div className="flex flex-wrap gap-2.5 mt-5">
          {extraAction}
          <Button variant="secondary" size="sm" onClick={() => copyReference(r.reference)}>
            {copied ? 'Copied' : 'Copy reference'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setActiveTab(r.tab)}>
            {OPEN_LABEL[r.kind]}
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
        <span className="sr-only" role="status">
          {copied ? `Reference ${r.reference} copied` : ''}
        </span>
      </Card>
    );
  };

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="My Requests"
        description="Everything you have asked from the barangay, in one place."
        action={
          <Button size="sm" onClick={() => setActiveTab('services')}>
            Request a document
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <FilterChips
          className="flex-1"
          value={filter}
          onChange={f => {
            setFilter(f);
            setSelectedId(null);
          }}
          chips={[
            { id: 'all' as Filter, label: 'All', count: count('all') },
            { id: 'active' as Filter, label: 'Active', count: count('active') },
            ...kinds.map(k => ({ id: k as Filter, label: KIND_LABEL[k], count: count(k) })),
          ]}
        />
        <label className="relative sm:w-64 shrink-0">
          <span className="sr-only">Search by reference or service</span>
          <Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search reference"
            className="pl-11"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedId(null);
            }}
          />
        </label>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <Card>
          <DataTable<ActivityRow>
            rows={shown}
            rowKey={r => r.id}
            onRowClick={select}
            isSelected={r => r.id === selected?.id}
            rowLabel={r => `Show details of ${r.reference}, ${r.service}`}
            columns={[
              { header: 'Reference', cell: r => r.reference, className: 'whitespace-nowrap' },
              { header: 'Service', cell: r => r.service },
              { header: 'Updated', cell: r => formatShortDateTime(r.when), className: 'whitespace-nowrap text-muted' },
              { header: 'Status', cell: pill },
            ]}
            mobile={{ title: r => r.service, status: pill, meta: r => r.reference }}
            empty={
              <div className="py-6 text-center">
                <p className="font-semibold">{q ? `Nothing matches "${query.trim()}".` : 'No requests here yet.'}</p>
                <p className="text-meta text-muted mt-1">
                  {q ? 'Check the reference number and try again.' : 'Your requests will show up here once you make one.'}
                </p>
              </div>
            }
          />
        </Card>

        <div ref={detailRef} className="scroll-mt-24">
          {selected ? (
            renderDetail(selected)
          ) : (
            <Card>
              <h2 className="text-h3 font-semibold text-navy">Request details</h2>
              <p className="text-meta text-muted mt-1">Choose a request to see its progress.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
