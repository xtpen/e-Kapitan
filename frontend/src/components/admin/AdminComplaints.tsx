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
    label: 'Assign',
    field: 'Message to the resident',
    button: 'Assign report',
    help: 'For example: "Assigned to the Tanod for inspection."',
  },
  update: {
    label: 'Record action taken',
    field: 'What was done?',
    button: 'Save update',
    help: 'For example: "Notice served to the household. Will follow up on Friday."',
  },
  hearing: {
    label: 'Schedule hearing',
    field: 'Hearing date, time and place',
    button: 'Schedule hearing',
    help: 'For example: "Sept 15, 2:00 PM at the Barangay Hall, with both parties."',
  },
  resolve: {
    label: 'Mark as resolved',
    field: 'How was it resolved?',
    button: 'Mark as resolved',
    help: 'This summary is shown to the resident.',
  },
  dismiss: {
    label: 'Close without action',
    field: 'Reason for closing',
    button: 'Close report',
    help: 'For example: "Duplicate of INC-2026-0312" or "Outside the barangay\'s jurisdiction."',
  },
};

const pill = (r: IncidentReport) => <StatusPill tone={incidentStatus[r.status].tone}>{incidentStatus[r.status].label}</StatusPill>;

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
    // New and unassigned first, then most recently updated.
    .sort((a, b) => Number(b.status === 'received') - Number(a.status === 'received'));
  const selected = shown.find(r => r.id === selectedId) ?? shown[0];

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
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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
      ['Reference', 'Category', 'Location', 'Purok', 'Reported by', 'Reported', 'Status', 'Assigned to'],
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
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-h3 font-semibold text-navy-ink">{r.referenceNumber}</h2>
          {pill(r)}
        </div>
        <p className="text-meta text-muted">{r.category}</p>

        <dl className="mt-3">
          {[
            ['Location', `${r.location} (${r.purok})`],
            ['Happened', formatShortDateTime(r.incidentDateTime)],
            ['Reported by', r.isAnonymous ? `${r.reporterName} (asked to hide their name)` : `${r.reporterName}${r.reporterContact ? `, ${r.reporterContact}` : ''}`],
            ['Reported', formatShortDateTime(r.submittedAt)],
            ['Assigned to', r.assignedTo ?? 'Not assigned yet'],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2 border-b border-line-soft last:border-b-0">
              <dt className="text-meta text-muted">{k}</dt>
              <dd className="text-meta font-semibold break-words">{v}</dd>
            </div>
          ))}
        </dl>

        <h3 className="font-semibold mt-4 mb-1">What happened</h3>
        <p className="text-meta">{r.description}</p>

        <h3 className="font-semibold mt-5 mb-2">History</h3>
        <ProgressTimeline
          stages={r.statusHistory.map((h, i) => ({
            // Repeated statuses (several updates while "Action taken") get "(update)" so each row has a unique label.
            label: incidentStatus[h.status].label + (i > 0 && r.statusHistory[i - 1].status === h.status ? ` (update ${i})` : ''),
            tone: h.status === 'received' ? 'success' : incidentStatus[h.status].tone,
            reached: true,
            detail: `${formatShortDateTime(h.updatedAt)} · ${h.updatedBy}`,
            note: i === 0 ? undefined : h.note,
          }))}
        />
        <p className="text-caption text-muted mt-2">The resident sees these updates in their report progress.</p>

        {/* Staff-only note */}
        <div className="mt-5 rounded-control border border-line bg-surface-muted px-4 py-3">
          <p className="flex items-center gap-2 font-semibold text-meta">
            <Lock className="w-4 h-4" aria-hidden="true" /> Staff-only note
          </p>
          {internal === null ? (
            <>
              <p className="text-meta mt-1">{r.internalNotes || <span className="text-muted">No note yet.</span>}</p>
              <button
                type="button"
                onClick={() => setInternal(r.internalNotes ?? '')}
                className="mt-1 text-meta font-semibold text-primary-strong hover:underline underline-offset-4 cursor-pointer min-h-11"
              >
                {r.internalNotes ? 'Edit note' : 'Add note'}
              </button>
            </>
          ) : (
            <>
              <Field label="Note (never shown to the resident)">
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

        {/* Actions */}
        {r.resolutionSummary && r.status === 'resolved' && (
          <p className="mt-4 text-meta rounded-control bg-success-bg text-success-fg px-3 py-2">
            <b className="font-semibold">Resolution: </b>
            {r.resolutionSummary}
          </p>
        )}

        {action ? (
          <div className="mt-4">
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
      </Card>
    );
  };

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Complaints"
        description="Assign, act on and resolve concerns reported by residents and guests."
        action={
          <span className="hidden md:block">
            <Button variant="secondary" size="sm" onClick={exportList} icon={<Download className="w-5 h-5" aria-hidden="true" />}>
              Export list
            </Button>
          </span>
        }
      />

      <Card className="mb-5">
        <div className="grid md:grid-cols-[2fr_1fr_1fr] gap-x-4 -mt-4">
          <Field label="Search">
            {p => (
              <div className="relative">
                <Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <Input
                  {...p}
                  type="search"
                  className="pl-11"
                  placeholder="Reference, name or location"
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
                <option value="open">Open (not resolved)</option>
                <option value="all">All statuses</option>
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
            { id: 'open', label: 'Open' },
            { id: 'received', label: 'New' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'all', label: 'All' },
          ]}
        />
      </Card>

      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-5 items-start">
        <Card>
          <DataTable<IncidentReport>
            rows={shown}
            rowKey={r => r.id}
            onRowClick={select}
            isSelected={r => r.id === selected?.id}
            rowLabel={r => `Open ${r.referenceNumber}, ${r.category}`}
            columns={[
              { header: 'Reference', cell: r => r.referenceNumber, className: 'whitespace-nowrap', sortValue: r => r.referenceNumber },
              {
                header: 'Concern',
                sortValue: r => r.category,
                cell: r => (
                  <>
                    {r.category}
                    <span className="block text-muted">{r.location}</span>
                  </>
                ),
              },
              {
                header: 'Reported',
                cell: r => formatShortDateTime(r.submittedAt),
                className: 'whitespace-nowrap text-muted',
                sortValue: r => dateTimeValue(r.submittedAt),
                sortLabels: ['oldest first', 'newest first'],
              },
              { header: 'Status', cell: pill, sortValue: r => STATUS_ORDER.indexOf(r.status), sortLabels: ['by stage', 'by stage, reversed'] },
            ]}
            mobile={{ title: r => r.category, status: pill, meta: r => `${r.location} · ${r.referenceNumber}` }}
            empty={
              <div className="py-6 text-center">
                <p className="font-semibold">No reports match.</p>
                <p className="text-meta text-muted mt-1">Try another status or clear the search.</p>
              </div>
            }
          />
        </Card>
        <div ref={detailRef} className="scroll-mt-24">
          {selected ? (
            renderDetail(selected)
          ) : (
            <Card>
              <h2 className="text-h3 font-semibold text-navy-ink">Report details</h2>
              <p className="text-meta text-muted mt-1">Choose a report to review it.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
