import React, { useState } from 'react';
import { Check, ChevronDown, ClipboardList, Copy } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { DocumentRequest, RequestStatus } from '../../types';
import { Button, Expand, ProgressTimeline, StatusPill, formatPeso, formatShortDateTime, type TimelineStage } from '../ui';
import { buildReportStages } from '../shared/reportStages';
import { useResidentActivity, type ActivityRow } from './useResidentActivity';
import { CLAIM_HOURS, KindIcon, requestProgress, timeAgo } from './requestProgress';
import { EmptyState, List, Page, PageTitle, Section } from './kit';

/* Older imports still point here; the helpers live in requestProgress.tsx. */
export { CLAIM_HOURS, CLAIM_HOURS_INLINE, CLAIM_PLACE, ProgressBar, requestProgress } from './requestProgress';
export type { RequestProgress } from './requestProgress';

/*
 * Requests: one list of everything you asked for, ready ones first. Each row says what is
 * happening in one line; tap it for the steps, the tracking number and the details.
 */

type Filter = 'all' | 'active' | 'ready' | 'done';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Ongoing' },
  { id: 'ready', label: 'Ready' },
  { id: 'done', label: 'Done' },
];

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

/** Document steps in plain words. */
const documentStages = (d: DocumentRequest): TimelineStage[] => {
  const order: RequestStatus[] = ['submitted', 'under_review', 'approved', 'ready_for_release', 'completed'];
  const labels = ['Sent', 'Being checked', 'Approved', 'Ready to pick up', 'Picked up'];
  if (d.status === 'returned' || d.status === 'rejected') {
    return [
      { label: 'Sent', tone: 'success', reached: true, detail: formatShortDateTime(d.submittedAt) },
      { label: 'Being checked', tone: 'info', reached: true },
      d.status === 'returned'
        ? { label: 'Needs a fix from you', tone: 'warning', reached: true, detail: formatShortDateTime(d.updatedAt), note: d.staffNotes }
        : { label: 'Not approved', tone: 'danger', reached: true, detail: formatShortDateTime(d.updatedAt), note: d.rejectionReason },
    ];
  }
  const current = order.indexOf(d.status);
  return order.map((s, i) => ({
    label: labels[i],
    tone: i === 1 ? 'info' : 'success',
    reached: i <= current,
    detail: i === 0 ? formatShortDateTime(d.submittedAt) : i === current ? formatShortDateTime(d.updatedAt) : undefined,
    note: i === current && d.staffNotes ? d.staffNotes : undefined,
  }));
};

const Pairs: React.FC<{ rows: [string, React.ReactNode][] }> = ({ rows }) => (
  <dl className="divide-y divide-line-soft">
    {rows.map(([k, v]) => (
      <div key={k} className="flex justify-between gap-4 py-2.5 text-meta">
        <dt className="text-muted">{k}</dt>
        <dd className="font-semibold text-ink text-right break-words min-w-0">{v}</dd>
      </div>
    ))}
  </dl>
);

const OPEN_LABEL: Record<ActivityRow['kind'], string> = {
  document: 'Documents',
  report: 'Open my reports',
  printing: 'Open printing',
  court: 'Open my bookings',
  appointment: 'Open my visits',
};

export const MyRequestsTracker: React.FC = () => {
  const { documentRequests, incidents, printRequests, courtReservations, courtSlots, appointments, setActiveTab, setSelectedDocumentForPrint } =
    useBarangay();
  const { rows } = useResidentActivity();
  const sources = { documentRequests, incidents, printRequests, courtReservations, appointments };
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const matches = (r: ActivityRow, f: Filter) =>
    f === 'all' ? true : f === 'active' ? r.isActive && !r.isReadyToClaim : f === 'ready' ? r.isReadyToClaim : !r.isActive;
  const shown = rows.filter(r => matches(r, filter)).sort((a, b) => Number(b.isReadyToClaim) - Number(a.isReadyToClaim));

  const copy = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(ref);
      setTimeout(() => setCopied(c => (c === ref ? null : c)), 2500);
    } catch {
      /* clipboard blocked: the number is on screen */
    }
  };

  const details = (r: ActivityRow) => {
    let timeline: React.ReactNode = null;
    let info: [string, React.ReactNode][] = [];
    let action: React.ReactNode = null;

    if (r.kind === 'document') {
      const d = documentRequests.find(x => x.id === r.id);
      if (d) {
        timeline = <ProgressTimeline stages={documentStages(d)} />;
        info = [
          ['For', d.purpose],
          ['Pick up', d.appointmentDate ? longDate(d.appointmentDate) : 'We will tell you when'],
          ['Fee', d.isFreeDueToExemption || d.fee === 0 ? 'Free' : `${formatPeso(d.fee)}, pay at the hall`],
        ];
        if (d.status === 'approved' || d.status === 'ready_for_release' || d.status === 'completed') {
          action = (
            <Button variant="secondary" size="sm" onClick={() => setSelectedDocumentForPrint(d)}>
              See the certificate
            </Button>
          );
        }
      }
    } else if (r.kind === 'report') {
      const i = incidents.find(x => x.id === r.id);
      if (i) {
        timeline = <ProgressTimeline stages={buildReportStages(i)} />;
        info = [
          ['About', i.category],
          ['Where', i.location],
        ];
      }
    } else if (r.kind === 'printing') {
      const p = printRequests.find(x => x.id === r.id);
      if (p)
        info = [
          ['File', p.fileName],
          ['Pages', `${p.pages} × ${p.copies} ${p.copies === 1 ? 'copy' : 'copies'}`],
          ['Cost', 'Free'],
          ...(p.rejectionReason ? ([['Why', p.rejectionReason]] as [string, string][]) : []),
        ];
    } else if (r.kind === 'court') {
      const c = courtReservations.find(x => x.id === r.id);
      if (c)
        info = [
          ['Day', longDate(c.date)],
          ['Time', courtSlots.find(s => s.id === c.slotId)?.label ?? c.slotId],
          ['For', c.activity],
          ...(c.notes ? ([['Note', c.notes]] as [string, string][]) : []),
        ];
    } else {
      const a = appointments.find(x => x.id === r.id);
      if (a)
        info = [
          ['For', a.serviceTitle],
          ['Day', longDate(a.date)],
          ['Time', a.timeSlot],
        ];
    }

    return (
      <div className="px-4 sm:px-5 pb-4 grid gap-4">
        {r.isReadyToClaim && (
          <p className="rounded-control bg-success-bg text-success-fg text-meta px-3 py-2.5">
            Pick it up {CLAIM_HOURS.toLowerCase()} at the barangay hall. Bring a valid ID.
          </p>
        )}
        <div className="flex items-center justify-between gap-3 rounded-control bg-surface-muted pl-3 pr-1 py-1">
          <span className="text-meta min-w-0">
            <span className="text-muted">Tracking no. </span>
            <b className="font-semibold text-ink">{r.reference}</b>
          </span>
          <button
            type="button"
            onClick={() => copy(r.reference)}
            aria-label={copied === r.reference ? 'Copied' : `Copy tracking number ${r.reference}`}
            className="shrink-0 inline-flex items-center gap-1.5 min-h-10 px-3 rounded-control text-meta font-semibold text-navy-ink hover:bg-surface cursor-pointer"
          >
            {copied === r.reference ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            {copied === r.reference ? 'Copied' : 'Copy'}
          </button>
        </div>
        {timeline}
        {info.length > 0 && <Pairs rows={info} />}
        {(action || r.kind !== 'document') && (
          <div className="flex flex-wrap gap-2">
            {action}
            {r.kind !== 'document' && (
              <Button variant="outline" size="sm" onClick={() => setActiveTab(r.tab)}>
                {OPEN_LABEL[r.kind]}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Page>
      <PageTitle
        title="Requests"
        sub="Tap one to see where it is."
        action={
          <Button variant="brand" size="sm" onClick={() => setActiveTab('services')}>
            New request
          </Button>
        }
      />

      {/* Filter */}
      <div role="tablist" aria-label="Show" className="grid grid-cols-4 gap-1 p-1 rounded-control bg-surface-muted">
        {FILTERS.map(f => {
          const n = rows.filter(r => matches(r, f.id)).length;
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setFilter(f.id);
                setOpenId(null);
              }}
              className={`min-h-10 rounded-lg text-meta font-semibold cursor-pointer transition-[background-color,color,box-shadow] duration-150
                ${on ? 'bg-surface text-navy-ink shadow-[0_1px_2px_rgb(0_0_0/0.12)]' : 'text-muted hover:text-ink'}`}
            >
              {f.label} <span className="tabular-nums font-normal opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      <Section flush>
        {shown.length === 0 ? (
          <EmptyState
            icon={<ClipboardList />}
            title={filter === 'all' ? 'No requests yet' : 'Nothing here'}
            sub={filter === 'all' ? 'What you ask the barangay for shows up here.' : undefined}
            action={
              filter === 'all' ? (
                <Button variant="brand" size="sm" onClick={() => setActiveTab('services')}>
                  See services
                </Button>
              ) : undefined
            }
          />
        ) : (
          <List>
            {shown.map(r => {
              const open = openId === r.id;
              return (
                <div key={r.id} className={r.isReadyToClaim ? 'bg-success-bg/40' : ''}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : r.id)}
                    aria-expanded={open}
                    aria-controls={`req-${r.id}`}
                    className="w-full min-h-16 flex items-center gap-3 px-4 sm:px-5 py-3 text-left cursor-pointer hover:bg-surface-muted/60 transition-colors"
                  >
                    <KindIcon kind={r.kind} ready={r.isReadyToClaim} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink leading-snug">{r.service}</span>
                      <span className="block text-meta text-muted leading-snug mt-0.5">
                        {requestProgress(r, sources)?.next ?? timeAgo(r.when)}
                      </span>
                    </span>
                    <span className="shrink-0 flex items-center gap-2">
                      <span className="hidden sm:inline-flex">
                        <StatusPill tone={r.status.tone}>{r.status.label}</StatusPill>
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted transition-transform duration-300 ease-out-strong ${open ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                  <div id={`req-${r.id}`}>
                    <Expand show={open}>{details(r)}</Expand>
                  </div>
                </div>
              );
            })}
          </List>
        )}
      </Section>
    </Page>
  );
};
