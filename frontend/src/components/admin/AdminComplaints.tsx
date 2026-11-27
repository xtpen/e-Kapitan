import React, { useRef, useState } from 'react';
import { Download, Lock, Search } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { IncidentCategory, IncidentReport, IncidentStatus } from '../../types';
import {
  Button,
  Card,
  DataTable,
  Field,
  FilterChips,
  Input,
  PageHeader,
  ProgressTimeline,
  Select,
  StatusPill,
  Textarea,
  dateTimeValue,
  formatShortDateTime,
  incidentStatus,
} from '../ui';

type StatusFilter = 'all' | 'open' | IncidentStatus;
type Action = 'assign' | 'update' | 'hearing' | 'resolve' | 'dismiss' | null;

const CATEGORIES: IncidentCategory[] = [
  'Noise Disturbance',
  'Neighbor Dispute',
  'Sanitation & Garbage',
  'Public Safety / Streetlight',
  'Stray Animal Concern',
  'Drainage / Flooding',
  'Other Community Concern',
];

const STATUS_ORDER: IncidentStatus[] = ['received', 'assigned', 'in_progress', 'hearing_scheduled', 'resolved', 'dismissed'];
const isOpen = (s: IncidentStatus) => s !== 'resolved' && s !== 'dismissed';

const ACTION_COPY: Record<Exclude<Action, null>, { label: string; field: string; button: string; help: string }> = {
  assign: {
    label: 'Assign someone',
    field: 'Message to the resident',
    button: 'Assign',
    help: 'For example: "The Tanod will check it today."',
  },
  update: {
    label: 'Add an update',
    field: 'What was done?',
    button: 'Save update',
    help: 'For example: "We talked to the household. We will check again on Friday."',
  },
  hearing: {
    label: 'Set a hearing',
    field: 'Hearing date, time and place',
    button: 'Set hearing',
    help: 'For example: "Sept 15, 2:00 PM at the Barangay Hall, with both sides."',
  },
  resolve: {
    label: 'Mark as resolved',
    field: 'How was it settled?',
    button: 'Mark as resolved',
    help: 'The resident sees this.',
  },
  dismiss: {
    label: 'Close without action',
    field: 'Reason for closing',
    button: 'Close report',
    help: 'For example: "Same as report INC-2026-0312" or "Outside our barangay."',
  },
};

/** Smooth scroll, unless the person asked for less motion. */
const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

const pill = (r: IncidentReport) => <StatusPill tone={incidentStatus[r.status].tone}>{incidentStatus[r.status].label}</StatusPill>;

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

/** Admin · Complaints. No dedicated mockup; follows the Admin list + detail pattern (Document Requests). */
export const AdminComplaints: React.FC = () => {
  const { incidents, officials, staffFor, updateIncidentReportStatus, setIncidentInternalNote } = useBarangay();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [note, setNote] = useState('');
  const [assignee, setAssignee] = useState('');
  const [errors, setErrors] = useState<{ note?: string; assignee?: string }>({});
  const [internal, setInternal] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const assignees = [
    ...officials
      .filter(o => o.status === 'Active (Incumbent)' && /kagawad|captain|tanod/i.test(o.position))
      .map(o => `${o.name} (${o.position.replace('Barangay ', '')})`),
    ...staffFor('complaints'),
    'Barangay Tanod',
    'Lupon Tagapamayapa',
  ];

  const q = query.trim().toLowerCase();
  const shown = incidents
    .filter(
      r =>
        (status === 'all' || (status === 'open' ? isOpen(r.status) : r.status === status)) &&
        (category === 'all' || r.category === category) &&
        (!q ||
          r.referenceNumber.toLowerCase().includes(q) ||
          r.reporterName.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q)),
    )
    // New and not yet assigned first, then most recently updated.
    .sort((a, b) => Number(b.status === 'received') - Number(a.status === 'received'));
  const selected = shown.find(r => r.id === selectedId) ?? shown[0];

  const newCount = incidents.filter(r => r.status === 'received').length;
  const openCount = incidents.filter(r => isOpen(r.status)).length;

  const resetAction = () => {
    setAction(null);
    setNote('');
    setAssignee('');
    setErrors({});
  };

  const select = (r: IncidentReport) => {
    setSelectedId(r.id);
    resetAction();
    setInternal(null);
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }));
    }
  };

  const setFilter = (s: StatusFilter) => {
    setStatus(s);
    setSelectedId(null);
  };

  const submitAction = (r: IncidentReport) => {
    if (!action) return;
    const e: typeof errors = {};
    if (action === 'assign' && !assignee) e.assignee = 'Choose who will handle it.';
    if (note.trim().length < 5) e.note = 'Write a short message for the resident.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const next: Record<Exclude<Action, null>, IncidentStatus> = {
      assign: 'assigned',
      update: 'in_progress',
      hearing: 'hearing_scheduled',
      resolve: 'resolved',
      dismiss: 'dismissed',
    };
    updateIncidentReportStatus(r.id, next[action], note.trim(), action === 'assign' ? assignee : undefined);
    resetAction();
  };

  const exportList = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ['Reference', 'Concern', 'Location', 'Purok', 'Reported by', 'Reported', 'Status', 'Handled by'],
      ...shown.map(r => [
        r.referenceNumber,
        r.category,
        r.location,
        r.purok,
        r.isAnonymous ? 'Name hidden' : r.reporterName,
        formatShortDateTime(r.submittedAt),
        incidentStatus[r.status].label,
        r.assignedTo ?? '',
      ]),
    ];
    const url = URL.createObjectURL(new Blob([rows.map(x => x.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderDetail = (r: IncidentReport) => {
    const open = isOpen(r.status);
    const available: Exclude<Action, null>[] =
      r.status === 'received'
        ? ['assign', 'dismiss']
        : open
          ? ['update', 'hearing', 'resolve', 'dismiss']
          : [];

    return (
      <Card aria-live="polite">
        {/* What and where first, then the status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-h3 font-semibold text-navy-ink">{r.category}</h2>
            <p className="text-meta text-muted">
              {r.referenceNumber} · reported {formatShortDateTime(r.submittedAt)}
            </p>
          </div>
          {pill(r)}
        </div>

        <Details
          rows={[
            ['Where', `${r.location} (${r.purok})`],
            ['When it happened', formatShortDateTime(r.incidentDateTime)],
            [
              'Reported by',
              r.isAnonymous
                ? `${r.reporterName} (asked to hide their name)`
                : `${r.reporterName}${r.reporterContact ? `, ${r.reporterContact}` : ''}`,
            ],
            ['Handled by', r.assignedTo ?? 'Not assigned yet'],
          ]}
        />

        <h3 className="font-semibold text-meta mt-4 mb-1">What happened</h3>
        <p className="text-meta">{r.description}</p>

        {r.resolutionSummary && r.status === 'resolved' && (
          <p className="mt-3 text-meta rounded-control bg-success-bg text-success-fg px-3 py-2">
            <b className="font-semibold">How it was settled: </b>
            {r.resolutionSummary}
          </p>
        )}

        {/* Actions, kept near the top so they are easy to reach */}
        {action ? (
          <div className="mt-4 pt-4 border-t border-line-soft">
            <h3 className="font-semibold">{ACTION_COPY[action].label}</h3>
            {action === 'assign' && (
              <Field label="Handled by" error={errors.assignee}>
                {p => (
                  <Select {...p} value={assignee} onChange={e => setAssignee(e.target.value)}>
                    <option value="" disabled>
                      Choose a person or team
                    </option>
                    {assignees.map(a => (
                      <option key={a}>{a}</option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
            <Field label={ACTION_COPY[action].field} error={errors.note} help={ACTION_COPY[action].help}>
              {p => <Textarea {...p} autoFocus={action !== 'assign'} value={note} onChange={e => setNote(e.target.value)} />}
            </Field>
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <Button variant="secondary" onClick={resetAction}>
                Cancel
              </Button>
              <Button variant={action === 'dismiss' ? 'danger' : 'primary'} onClick={() => submitAction(r)}>
                {ACTION_COPY[action].button}
              </Button>
            </div>
          </div>
        ) : (
          available.length > 0 && (
            <div className="mt-4 grid gap-2.5">
              <Button fullWidth onClick={() => setAction(available[0])}>
                {ACTION_COPY[available[0]].label}
              </Button>
              <div className="grid grid-cols-2 gap-2.5">
                {available.slice(1).map(a => (
                  <Button
                    key={a}
                    variant={a === 'dismiss' ? 'danger' : 'secondary'}
                    className={available.length === 4 && a === 'dismiss' ? 'col-span-2' : ''}
                    onClick={() => setAction(a)}
                  >
                    {ACTION_COPY[a].label}
                  </Button>
                ))}
              </div>
            </div>
          )
        )}

        <h3 className="font-semibold text-meta mt-5 mb-2">Updates</h3>
        <ProgressTimeline
          stages={r.statusHistory.map((h, i) => ({
            // Repeated statuses (several updates while "Action taken") get "(update n)" so each row has a unique label.
            label: incidentStatus[h.status].label + (i > 0 && r.statusHistory[i - 1].status === h.status ? ` (update ${i})` : ''),
            tone: h.status === 'received' ? 'success' : incidentStatus[h.status].tone,
            reached: true,
            detail: `${formatShortDateTime(h.updatedAt)} · ${h.updatedBy}`,
            note: i === 0 ? undefined : h.note,
          }))}
        />
        <p className="text-caption text-muted mt-2">The resident sees these updates.</p>

        {/* Staff-only note */}
        <div className="mt-4 rounded-control border border-line bg-surface-muted px-3 py-2.5">
          <p className="flex items-center gap-2 font-semibold text-meta">
            <Lock className="w-4 h-4" aria-hidden="true" /> Staff-only note
          </p>
          {internal === null ? (
            <div className="flex flex-wrap items-center justify-between gap-x-3">
              <p className="text-meta mt-1">{r.internalNotes || <span className="text-muted">No note yet.</span>}</p>
              <button
                type="button"
                onClick={() => setInternal(r.internalNotes ?? '')}
                className="text-meta font-semibold text-primary-strong hover:underline underline-offset-4 cursor-pointer min-h-11"
              >
                {r.internalNotes ? 'Edit note' : 'Add note'}
              </button>
            </div>
          ) : (
            <>
              <Field label="Note (residents never see this)">
                {p => <Textarea {...p} autoFocus value={internal} onChange={e => setInternal(e.target.value)} />}
              </Field>
              <div className="flex gap-2.5 mt-3">
                <Button variant="secondary" size="sm" onClick={() => setInternal(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIncidentInternalNote(r.id, internal.trim());
                    setInternal(null);
                  }}
                >
                  Save note
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  };

  const summary = [newCount > 0 && `${newCount} new`, openCount > 0 && `${openCount} still open`].filter(Boolean).join(', ');

  return (
    <div className="max-w-[1280px]">
      <PageHeader
        title="Complaints"
        description={
          summary
            ? `${summary}. Assign each one, add updates, then mark it resolved.`
            : 'Concerns from residents and guests. Assign each one, add updates, then mark it resolved.'
        }
        action={
          <span className="hidden md:block">
            <Button variant="secondary" size="sm" onClick={exportList} icon={<Download className="w-5 h-5" aria-hidden="true" />}>
              Download list
            </Button>
          </span>
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-4 items-start">
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
                    placeholder="Name, place or reference"
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
                  <option value="open">Still open</option>
                  <option value="all">All</option>
                  {STATUS_ORDER.map(s => (
                    <option key={s} value={s}>
                      {incidentStatus[s].label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Concern" className="hidden md:block">
              {p => (
                <Select
                  {...p}
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    setSelectedId(null);
                  }}
                >
                  <option value="all">All concerns</option>
                  {CATEGORIES.map(c => (
                    <option key={c}>{c}</option>
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
              { id: 'open', label: 'Still open' },
              { id: 'received', label: 'New' },
              { id: 'resolved', label: 'Resolved' },
              { id: 'all', label: 'All' },
            ]}
          />

          <div className="mt-4">
            <DataTable<IncidentReport>
              rows={shown}
              rowKey={r => r.id}
              onRowClick={select}
              isSelected={r => r.id === selected?.id}
              rowLabel={r => `Open ${r.referenceNumber}, ${r.category}`}
              columns={[
                {
                  header: 'Concern',
                  sortValue: r => r.category,
                  cell: r => (
                    <>
                      <span className="block font-semibold text-ink">{r.category}</span>
                      <span className="block text-caption text-muted">
                        {r.location} · {r.referenceNumber}
                      </span>
                    </>
                  ),
                },
                {
                  header: 'Handled by',
                  sortValue: r => r.assignedTo ?? '',
                  cell: r => r.assignedTo ?? <span className="text-muted">Not assigned yet</span>,
                },
                {
                  header: 'Reported',
                  cell: r => formatShortDateTime(r.submittedAt),
                  className: 'whitespace-nowrap text-muted',
                  sortValue: r => dateTimeValue(r.submittedAt),
                  sortLabels: ['oldest first', 'newest first'],
                },
                { header: 'Status', cell: pill, sortValue: r => STATUS_ORDER.indexOf(r.status), sortLabels: ['by step', 'by step, reversed'] },
              ]}
              mobile={{ title: r => r.category, status: pill, meta: r => `${r.location} · ${r.referenceNumber}` }}
              empty={
                <div className="py-6 text-center">
                  <p className="font-semibold">No reports found.</p>
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
              <h2 className="text-h3 font-semibold text-navy-ink">Report details</h2>
              <p className="text-meta text-muted mt-1">Choose a report from the list to see it here.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
