import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Check, ChevronDown, ClipboardList, Copy, PenLine, Plus, SlidersHorizontal, X } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { DocumentRequest, RequestStatus } from '../../types';
import { Button, Expand, ProgressTimeline, StatusPill, formatPeso, formatShortDateTime, type TimelineStage } from '../ui';
import { buildReportStages } from '../shared/reportStages';
import { useResidentActivity, type ActivityKind, type ActivityRow } from './useResidentActivity';
import { CLAIM_HOURS_INLINE, KindIcon, ProgressBar, kindName, requestProgress, timeAgo } from './requestProgress';
import { Choice, EmptyState, List, Page, PageTitle, Section, Sheet } from './kit';
import { ReturnedFixSheet } from './ReturnedFixSheet';
import { useLanguage, useT, type Vars } from '../../i18n';

/* Older imports still point here; the helpers live in requestProgress.tsx. */
export { CLAIM_HOURS, CLAIM_HOURS_INLINE, CLAIM_PLACE, ProgressBar, requestProgress } from './requestProgress';
export type { RequestProgress } from './requestProgress';

/*
 * Requests: everything you asked for.
 *   Status tabs (All · Ongoing · Ready · Done) with a sliding underline
 *   Filter (sheet): which kinds to show, newest or oldest first; active filters show as chips
 *   "Needs you" first: anything ready to pick up or waiting for your fix, with the action on it
 *   Then the rest by time (This week · Earlier). Every row shows its status, kind and age, and a
 *   step bar while it is moving; tap a row for steps and details
 *   New request: a round + button (floating on phones, beside the title on desktop)
 */

type Status = 'all' | 'active' | 'ready' | 'done';
type Sort = 'newest' | 'oldest';

const STATUSES: { id: Status; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Ongoing' },
  { id: 'ready', label: 'Ready' },
  { id: 'done', label: 'Done' },
];

const KINDS: { id: ActivityKind; label: string }[] = [
  { id: 'document', label: 'Documents' },
  { id: 'report', label: 'Problem reports' },
  { id: 'printing', label: 'Printing' },
  { id: 'court', label: 'Court bookings' },
  { id: 'appointment', label: 'Hall visits' },
];

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

/** Document steps in plain words. */
const documentStages = (d: DocumentRequest, t: (s: string, v?: Vars) => string): TimelineStage[] => {
  const order: RequestStatus[] = ['submitted', 'under_review', 'approved', 'ready_for_release', 'completed'];
  const labels = ['Sent', 'Being checked', 'Approved', 'Ready to pick up', 'Picked up'].map(l => t(l));
  if (d.status === 'returned' || d.status === 'rejected') {
    return [
      { label: t('Sent'), tone: 'success', reached: true, detail: formatShortDateTime(d.submittedAt) },
      { label: t('Being checked'), tone: 'info', reached: true },
      d.status === 'returned'
        ? { label: t('Needs a fix from you'), tone: 'warning', reached: true, detail: formatShortDateTime(d.updatedAt), note: d.staffNotes }
        : { label: t('Not approved'), tone: 'danger', reached: true, detail: formatShortDateTime(d.updatedAt), note: d.rejectionReason },
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

const OPEN_LABEL: Record<ActivityKind, string> = {
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
  const reduce = useReducedMotion();
  const sources = { documentRequests, incidents, printRequests, courtReservations, appointments };

  const [status, setStatus] = useState<Status>('all');
  const [kinds, setKinds] = useState<ActivityKind[]>([]);
  const [sort, setSort] = useState<Sort>('newest');
  const [sheet, setSheet] = useState(false);
  // Draft values while the filter sheet is open; applied on "Show results".
  const [draftKinds, setDraftKinds] = useState<ActivityKind[]>([]);
  const [draftSort, setDraftSort] = useState<Sort>('newest');
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [fixing, setFixing] = useState<DocumentRequest | null>(null);
  const t = useT();
  const lang = useLanguage();

  const statusOf = (r: ActivityRow, s: Status) =>
    s === 'all' ? true : s === 'active' ? r.isActive && !r.isReadyToClaim : s === 'ready' ? r.isReadyToClaim : !r.isActive;

  /** Waiting on the resident: a document staff sent back. */
  const needsFix = (r: ActivityRow) => r.kind === 'document' && documentRequests.find(x => x.id === r.id)?.status === 'returned';

  // "Needs you" (fix or pick up) first, then the rest by time.
  const { attention, groups, shownCount } = useMemo(() => {
    const shown = rows
      .filter(r => statusOf(r, status) && (kinds.length === 0 || kinds.includes(r.kind)))
      .sort((a, b) => (sort === 'newest' ? b.sortKey - a.sortKey : a.sortKey - b.sortKey));
    const attention = shown.filter(r => needsFix(r) || r.isReadyToClaim);
    const rest = shown.filter(r => !attention.includes(r));
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const byTime = [
      { id: 'week', label: 'This week', items: rest.filter(r => r.sortKey >= weekAgo) },
      { id: 'earlier', label: 'Earlier', items: rest.filter(r => r.sortKey < weekAgo) },
    ].filter(g => g.items.length > 0);
    return { attention, groups: sort === 'newest' ? byTime : byTime.reverse(), shownCount: shown.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, status, kinds, sort, documentRequests]);

  const filterCount = kinds.length + (sort !== 'newest' ? 1 : 0);

  const openSheet = () => {
    setDraftKinds(kinds);
    setDraftSort(sort);
    setSheet(true);
  };
  const toggleDraftKind = (k: ActivityKind) => setDraftKinds(ks => (ks.includes(k) ? ks.filter(x => x !== k) : [...ks, k]));

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
        timeline = <ProgressTimeline stages={documentStages(d, t)} />;
        info = [
          [t('For'), d.purpose],
          [t('Pick up'), d.appointmentDate ? longDate(d.appointmentDate) : t('We will tell you when')],
          [t('Fee'), d.isFreeDueToExemption || d.fee === 0 ? t('Free') : t('{fee}, pay at the hall', { fee: formatPeso(d.fee) })],
        ];
        if (d.status === 'approved' || d.status === 'ready_for_release' || d.status === 'completed') {
          action = (
            <Button variant="secondary" size="sm" onClick={() => setSelectedDocumentForPrint(d)}>
              {t('See the certificate')}
            </Button>
          );
        }
      }
    } else if (r.kind === 'report') {
      const i = incidents.find(x => x.id === r.id);
      if (i) {
        timeline = <ProgressTimeline stages={buildReportStages(i)} />;
        info = [
          [t('About'), i.category],
          [t('Where'), i.location],
        ];
      }
    } else if (r.kind === 'printing') {
      const p = printRequests.find(x => x.id === r.id);
      if (p)
        info = [
          [t('File'), p.fileName],
          [t('Pages'), t(p.copies === 1 ? '{pages} × {copies} copy' : '{pages} × {copies} copies', { pages: p.pages, copies: p.copies })],
          [t('Cost'), t('Free')],
          ...(p.rejectionReason ? ([[t('Why'), p.rejectionReason]] as [string, string][]) : []),
        ];
    } else if (r.kind === 'court') {
      const c = courtReservations.find(x => x.id === r.id);
      if (c)
        info = [
          [t('Day'), longDate(c.date)],
          [t('Time'), courtSlots.find(s => s.id === c.slotId)?.label ?? c.slotId],
          [t('For'), c.activity],
          ...(c.notes ? ([[t('Note'), c.notes]] as [string, string][]) : []),
        ];
    } else {
      const a = appointments.find(x => x.id === r.id);
      if (a)
        info = [
          [t('For'), a.serviceTitle],
          [t('Day'), longDate(a.date)],
          [t('Time'), a.timeSlot],
        ];
    }

    return (
      <div className="px-4 sm:px-5 pb-4 grid gap-4">
        <div className="flex items-center justify-between gap-3 rounded-control bg-surface-muted pl-3 pr-1 py-1">
          <span className="text-meta min-w-0">
            <span className="text-muted">{t('Tracking no.')} </span>
            <b className="font-semibold text-ink">{r.reference}</b>
          </span>
          <button
            type="button"
            onClick={() => copy(r.reference)}
            aria-label={copied === r.reference ? t('Copied') : t('Copy tracking number {ref}', { ref: r.reference })}
            className="shrink-0 inline-flex items-center gap-1.5 min-h-10 px-3 rounded-control text-meta font-semibold text-navy-ink hover:bg-surface cursor-pointer"
          >
            {copied === r.reference ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            {copied === r.reference ? t('Copied') : t('Copy')}
          </button>
        </div>
        {timeline}
        {info.length > 0 && <Pairs rows={info} />}
        {(action || r.kind !== 'document') && (
          <div className="flex flex-wrap gap-2">
            {action}
            {r.kind !== 'document' && (
              <Button variant="outline" size="sm" onClick={() => setActiveTab(r.tab)}>
                {t(OPEN_LABEL[r.kind])}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  /** One request: icon, name, status · kind · when, a step bar while it moves, details on tap. */
  const requestRow = (r: ActivityRow, urgent: boolean) => {
    const open = openId === r.id;
    const fix = needsFix(r);
    const progress = requestProgress(r, sources, lang);
    const doc = fix ? documentRequests.find(x => x.id === r.id) : undefined;
    return (
      <div key={r.id} className={urgent ? (fix ? 'bg-warning-bg/45' : 'bg-success-bg/45') : ''}>
        <button
          type="button"
          onClick={() => setOpenId(open ? null : r.id)}
          aria-expanded={open}
          aria-controls={`req-${r.id}`}
          className="w-full min-h-16 flex items-start gap-3 px-4 sm:px-5 py-3.5 text-left cursor-pointer hover:bg-surface-muted/60 transition-colors"
        >
          <KindIcon kind={r.kind} ready={r.isReadyToClaim} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink leading-snug">{r.service}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <StatusPill tone={fix ? 'warning' : r.isReadyToClaim ? 'success' : r.status.tone} className="!px-2 !py-0.5">
                {t(fix ? 'Needs a fix from you' : r.isReadyToClaim ? 'Ready to pick up' : r.status.label)}
              </StatusPill>
              <span className="text-caption text-muted">
                {kindName(r.kind, lang)} · {timeAgo(r.when, Date.now(), lang)}
              </span>
            </span>
            {urgent ? (
              <span className={`mt-1.5 block text-meta leading-snug ${fix ? 'text-warning-fg' : 'text-success-fg'}`}>
                {fix
                  ? doc?.staffNotes ?? t('Open it to see what to change.')
                  : t('Pick it up {hours} at the barangay hall. Bring a valid ID.', { hours: t(CLAIM_HOURS_INLINE) })}
              </span>
            ) : (
              progress &&
              r.isActive && <ProgressBar progress={progress} className="mt-2 max-w-[260px]" />
            )}
          </span>
          <ChevronDown
            className={`mt-2.5 w-5 h-5 shrink-0 text-muted transition-transform duration-300 ease-out-strong ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
        {urgent && fix && doc && (
          <div className="px-4 sm:px-5 pb-3.5 -mt-1 pl-[68px] sm:pl-[72px]">
            <Button variant="brand" size="sm" onClick={() => setFixing(doc)}>
              <PenLine className="w-4 h-4" aria-hidden="true" /> {t('Fix and resend')}
            </Button>
          </div>
        )}
        <div id={`req-${r.id}`}>
          <Expand show={open}>{details(r)}</Expand>
        </div>
      </div>
    );
  };

  const newButton = (className: string) => (
    <button
      type="button"
      onClick={() => setActiveTab('services')}
      aria-label={t('New request')}
      title={t('New request')}
      data-tour="req-new"
      className={`grid place-items-center rounded-full bg-navy text-white cursor-pointer
        transition-[scale,box-shadow,background-color] duration-150 ease-out-strong hover:bg-navy-deep active:scale-[0.92] ${className}`}
    >
      <Plus className="w-6 h-6" strokeWidth={2.4} aria-hidden="true" />
    </button>
  );

  return (
    <Page>
      <PageTitle title={t('Requests')} action={newButton('hidden lg:grid w-11 h-11 shadow-[0_4px_12px_-2px_rgb(18_48_79/0.4)]')} />

      {/* Status tabs + filter */}
      <div className="flex items-end gap-2 border-b border-line" data-tour="req-tabs">
        <div role="tablist" aria-label={t('Status')} className="flex-1 flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATUSES.map(s => {
            const n = rows.filter(r => statusOf(r, s.id)).length;
            const on = status === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setStatus(s.id);
                  setOpenId(null);
                }}
                className={`relative shrink-0 min-h-12 px-3 font-semibold cursor-pointer transition-colors duration-150
                  ${on ? 'text-navy-ink' : 'text-muted hover:text-ink'}`}
              >
                {t(s.label)}
                {s.id === 'ready' && n > 0 && (
                <span
                  className={`ml-1.5 inline-grid place-items-center min-w-6 h-6 px-1.5 rounded-full text-caption tabular-nums
                    ${on ? 'bg-navy-tint text-navy-ink' : 'bg-surface-muted text-muted'}`}
                >
                  {n}
                </span>
                )}
                {on && (
                  <motion.span
                    layoutId="req-status"
                    aria-hidden="true"
                    className="absolute left-2 right-2 -bottom-px h-[3px] rounded-t-full bg-navy-ink"
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          data-tour="req-filter"
          onClick={openSheet}
          aria-label={filterCount ? t('Filter, {n} on', { n: filterCount }) : t('Filter')}
          className={`relative mb-1.5 shrink-0 h-10 px-3 inline-flex items-center gap-2 rounded-full border font-semibold text-meta cursor-pointer transition-colors
            ${filterCount ? 'border-navy-ink bg-navy-tint text-navy-ink' : 'border-line bg-surface text-ink hover:bg-surface-muted'}`}
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('Filter')}</span>
          {filterCount > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-navy text-white text-[0.6875rem] grid place-items-center">{filterCount}</span>}
        </button>
      </div>

      {/* Active filters */}
      {filterCount > 0 && (
        <div className="flex flex-wrap gap-2 -mt-1">
          {kinds.map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKinds(ks => ks.filter(x => x !== k))}
              className="inline-flex items-center gap-1.5 min-h-9 pl-3 pr-2 rounded-full bg-navy-tint text-navy-ink text-meta font-semibold cursor-pointer"
            >
              {t(KINDS.find(x => x.id === k)?.label ?? '')}
              <X className="w-4 h-4" aria-label={t('Remove')} />
            </button>
          ))}
          {sort !== 'newest' && (
            <button
              type="button"
              onClick={() => setSort('newest')}
              className="inline-flex items-center gap-1.5 min-h-9 pl-3 pr-2 rounded-full bg-navy-tint text-navy-ink text-meta font-semibold cursor-pointer"
            >
              {t('Oldest first')}
              <X className="w-4 h-4" aria-label={t('Remove')} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setKinds([]);
              setSort('newest');
            }}
            className="min-h-9 px-2 text-meta font-semibold text-muted hover:text-ink cursor-pointer"
          >
            {t('Clear all')}
          </button>
        </div>
      )}

      {/* Results */}
      {shownCount === 0 ? (
        <Section>
          <EmptyState
            icon={<ClipboardList />}
            title={rows.length === 0 ? t('No requests yet') : t('Nothing here')}
            sub={rows.length === 0 ? t('What you ask the barangay for shows up here.') : t('Try another tab or clear the filters.')}
            action={
              rows.length === 0 ? (
                <Button variant="brand" size="sm" onClick={() => setActiveTab('services')}>
                  {t('See services')}
                </Button>
              ) : undefined
            }
          />
        </Section>
      ) : (
        <>
          {attention.length > 0 && (
            <Section flush title={t('Needs you · {n}', { n: attention.length })} id="req-needs">
              <List>{attention.map(r => requestRow(r, true))}</List>
            </Section>
          )}
          {groups.map(g => (
            <Section key={g.id} flush title={t(g.label)} id={`req-group-${g.id}`}>
              <List>{g.items.map(r => requestRow(r, false))}</List>
            </Section>
          ))}
        </>
      )}

      {/* Phones: floating + above the bottom bar (rendered outside the page so the page transition can't move it) */}
      {createPortal(newButton('lg:hidden fixed right-4 z-30 w-14 h-14 shadow-[0_8px_20px_-4px_rgb(18_48_79/0.5)] bottom-[calc(80px+env(safe-area-inset-bottom))]'), document.body)}

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title={t('Filter requests')}
        footer={
          <div className="grid grid-cols-[auto_1fr] gap-2.5">
            <Button
              variant="secondary"
              onClick={() => {
                setDraftKinds([]);
                setDraftSort('newest');
              }}
            >
              {t('Reset')}
            </Button>
            <Button
              variant="brand"
              onClick={() => {
                setKinds(draftKinds);
                setSort(draftSort);
                setOpenId(null);
                setSheet(false);
              }}
            >
              {t('Show results')}
            </Button>
          </div>
        }
      >
        <p className="font-semibold text-ink mt-1 mb-2">{t('Type')}</p>
        <div className="grid gap-2" role="group" aria-label={t('Type')}>
          {KINDS.map(k => {
            const on = draftKinds.includes(k.id);
            return (
              <button
                key={k.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggleDraftKind(k.id)}
                className={`w-full min-h-12 flex items-center gap-3 px-3.5 rounded-control border-[1.5px] text-left cursor-pointer transition-colors
                  ${on ? 'border-navy-ink bg-navy-tint' : 'border-line hover:border-field-line'}`}
              >
                <KindIcon kind={k.id} />
                <span className={`flex-1 font-semibold ${on ? 'text-navy-ink' : 'text-ink'}`}>{t(k.label)}</span>
                <span className="text-caption text-muted tabular-nums mr-1">{rows.filter(r => r.kind === k.id).length}</span>
                <span
                  aria-hidden="true"
                  className={`w-5 h-5 rounded-md border-2 grid place-items-center ${on ? 'bg-navy border-navy text-white' : 'border-field-line'}`}
                >
                  {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
        <p className="font-semibold text-ink mt-5 mb-2">{t('Order')}</p>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('Order')}>
          <Choice selected={draftSort === 'newest'} onSelect={() => setDraftSort('newest')} label={t('Newest first')} />
          <Choice selected={draftSort === 'oldest'} onSelect={() => setDraftSort('oldest')} label={t('Oldest first')} />
        </div>
      </Sheet>
      <ReturnedFixSheet request={fixing} onClose={() => setFixing(null)} />
    </Page>
  );
};
