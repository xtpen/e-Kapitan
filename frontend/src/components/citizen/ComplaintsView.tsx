import React, { useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { IncidentCategory, IncidentReport, IncidentStatus } from '../../types';
import {
  Button,
  Card,
  CardHeader,
  Checkbox,
  DataTable,
  Field,
  FileUpload,
  Input,
  PageHeader,
  ProgressTimeline,
  Select,
  StatusPill,
  Textarea,
  formatShortDateTime,
  incidentStatus,
  type TimelineStage,
} from '../ui';

const CATEGORIES: IncidentCategory[] = [
  'Noise Disturbance',
  'Neighbor Dispute',
  'Sanitation & Garbage',
  'Public Safety / Streetlight',
  'Stray Animal Concern',
  'Drainage / Flooding',
  'Other Community Concern',
];

const PUROKS = [
  'Purok 1 - Centro',
  'Purok 2 - Riverside',
  'Purok 3 - Bukidnon',
  'Purok 4 - Pag-asa',
  'Purok 5 - San Roque',
  'Purok 6 - Industrial Zone',
];

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

type Errors = Partial<Record<'date' | 'location' | 'description' | 'files' | 'consent', string>>;

/** Report progress: Received → Under review → Action taken → Resolved (DESIGN.md 5.12). */
export const buildReportStages = (r: IncidentReport): TimelineStage[] => {
  const order: IncidentStatus[] = ['received', 'assigned', 'in_progress', 'resolved'];
  const rank: Record<IncidentStatus, number> = {
    received: 0,
    assigned: 1,
    in_progress: 2,
    hearing_scheduled: 2,
    resolved: 3,
    dismissed: 3,
  };
  const current = rank[r.status];
  const entryFor = (s: IncidentStatus) =>
    [...r.statusHistory].reverse().find(h => h.status === s || (s === 'in_progress' && h.status === 'hearing_scheduled'));

  const stages: TimelineStage[] = order.map((s, i) => {
    const entry = entryFor(s);
    const isHearing = s === 'in_progress' && r.status === 'hearing_scheduled';
    const info = isHearing ? incidentStatus.hearing_scheduled : incidentStatus[s];
    return {
      label: info.label,
      tone: s === 'received' ? 'success' : info.tone,
      reached: i <= current && !(r.status === 'dismissed' && i === 3),
      detail: entry ? formatShortDateTime(entry.updatedAt) : undefined,
      note: entry && i === Math.min(current, 2) && r.status !== 'resolved' ? entry.note : undefined,
    };
  });

  if (r.status === 'dismissed') {
    const entry = entryFor('dismissed');
    stages[3] = {
      label: incidentStatus.dismissed.label,
      tone: 'danger',
      reached: true,
      detail: entry ? formatShortDateTime(entry.updatedAt) : undefined,
      note: entry?.note,
    };
  }
  if (r.status === 'resolved' && r.resolutionSummary) stages[3].note = r.resolutionSummary;
  if (r.assignedTo && current >= 1 && !stages[1].detail) stages[1].detail = 'Assigned to barangay staff';
  return stages;
};

/**
 * Resident · Complaints & Reports. Mockup: "Resident · Complaints" (desktop + mobile). See DESIGN.md.
 * Residents only see their own reports.
 */
export const ComplaintsView: React.FC = () => {
  const { incidents, createIncidentReport, currentUser } = useBarangay();

  const [category, setCategory] = useState<IncidentCategory>(CATEGORIES[0]);
  const [date, setDate] = useState(todayISO());
  const [purok, setPurok] = useState(PUROKS[1]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [justFiled, setJustFiled] = useState<IncidentReport | null>(null);
  const [myAnonymousIds, setMyAnonymousIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const myReports = incidents.filter(i => i.reporterName === currentUser.name || myAnonymousIds.includes(i.id));
  const selected = myReports.find(r => r.id === selectedId) ?? myReports[0];

  const validate = (): Errors => {
    const e: Errors = {};
    if (!date) e.date = 'Enter the date it happened.';
    else if (date > todayISO()) e.date = 'The date cannot be in the future.';
    if (!location.trim()) e.location = 'Enter a street or landmark so staff can find it.';
    if (description.trim().length < 15) e.description = 'Describe what happened in a sentence or two.';
    if (files.some(f => !FILE_TYPES.includes(f.type))) e.files = 'Attach JPG, PNG or PDF files only.';
    else if (files.some(f => f.size > MAX_FILE_BYTES)) e.files = 'Each file must be 5 MB or smaller.';
    if (!consent) e.consent = 'Check the box to agree before you submit.';
    return e;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const created = createIncidentReport({
      category,
      title: `${category}: ${location.trim()}`,
      description: description.trim(),
      location: location.trim(),
      purok,
      incidentDateTime: date,
      isAnonymous: anonymous,
      reporterName: currentUser.name,
      reporterContact: currentUser.email,
    });
    if (anonymous) setMyAnonymousIds(ids => [created.id, ...ids]);
    setJustFiled(created);
    setSelectedId(created.id);
    setLocation('');
    setDescription('');
    setFiles([]);
    setAnonymous(false);
    setConsent(false);
  };

  const statusPill = (r: IncidentReport) => (
    <StatusPill tone={incidentStatus[r.status].tone}>{incidentStatus[r.status].label}</StatusPill>
  );

  const selectReport = (r: IncidentReport) => {
    setSelectedId(r.id);
    if (window.matchMedia('(max-width: 1023px)').matches) {
      progressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Complaints & Reports"
        description="Tell the barangay about a concern. You will get a tracking number."
      />

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5 items-start">
        {/* ---------- Form ---------- */}
        <Card padded="lg">
          <h2 className="text-h3-lg font-semibold text-navy">File a new report</h2>

          {justFiled && (
            <div role="status" className="mt-4 flex gap-3 rounded-control bg-success-bg text-success-fg px-4 py-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" strokeWidth={1.8} aria-hidden="true" />
              <p>
                <b className="font-semibold">Report submitted.</b> Your tracking number is{' '}
                <b className="font-semibold whitespace-nowrap">{justFiled.referenceNumber}</b>. You can follow its progress
                under My reports.
              </p>
            </div>
          )}

          <form noValidate onSubmit={submit}>
            {Object.keys(errors).length > 0 && (
              <p role="alert" className="mt-4 rounded-control bg-danger-bg text-danger-fg font-semibold px-4 py-3">
                Please fix the fields marked below.
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-x-5">
              <Field label="Type of concern">
                {p => (
                  <Select {...p} value={category} onChange={e => setCategory(e.target.value as IncidentCategory)}>
                    {CATEGORIES.map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Date of incident" error={errors.date}>
                {p => <Input {...p} type="date" max={todayISO()} value={date} onChange={e => setDate(e.target.value)} />}
              </Field>
              <Field label="Purok">
                {p => (
                  <Select {...p} value={purok} onChange={e => setPurok(e.target.value)}>
                    {PUROKS.map(x => (
                      <option key={x}>{x}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Location" error={errors.location}>
                {p => (
                  <Input
                    {...p}
                    placeholder="Street or landmark"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                )}
              </Field>
            </div>
            <Field label="What happened?" error={errors.description}>
              {p => (
                <Textarea
                  {...p}
                  placeholder="Describe the concern in your own words"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              )}
            </Field>
            <Field label="Photos or documents" optional error={errors.files} help="JPG, PNG or PDF, up to 5 MB each.">
              {p => (
                <FileUpload
                  {...p}
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  hint="or choose photos or documents"
                  files={files}
                  onChange={setFiles}
                />
              )}
            </Field>

            <div className="mt-4">
              <Checkbox
                label="Hide my name from the person I'm reporting"
                description="Only authorized barangay staff will see who filed it. You can still track it here."
                checked={anonymous}
                onChange={e => setAnonymous(e.target.checked)}
              />
              <Checkbox
                label="I agree to the processing of my personal data"
                description="It is used only to act on this report, as required by the Data Privacy Act of 2012."
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                error={errors.consent}
              />
            </div>

            <Button type="submit" fullWidth className="mt-6">
              Submit report
            </Button>
          </form>
        </Card>

        {/* ---------- My reports + progress ---------- */}
        <div className="grid gap-3 sm:gap-5">
          <Card>
            <CardHeader title="My reports" />
            <DataTable<IncidentReport>
              rows={myReports}
              rowKey={r => r.id}
              onRowClick={selectReport}
              rowLabel={r => `Show progress of ${r.referenceNumber}`}
              columns={[
                {
                  header: 'Tracking no.',
                  cell: r => (
                    <span className={r.id === selected?.id ? 'font-semibold text-navy' : undefined}>{r.referenceNumber}</span>
                  ),
                  className: 'whitespace-nowrap',
                },
                { header: 'Concern', cell: r => r.category },
                { header: 'Status', cell: statusPill },
              ]}
              mobile={{ title: r => r.category, status: statusPill, meta: r => r.referenceNumber }}
              empty={<p className="text-meta text-muted py-2">You have not filed any reports yet.</p>}
            />
          </Card>

          {selected && (
            <div ref={progressRef} className="scroll-mt-24">
              <Card aria-live="polite">
                <h3 className="text-h3 font-semibold text-navy mb-1">Progress of {selected.referenceNumber}</h3>
                <p className="text-meta text-muted mb-4">
                  {selected.category} · {selected.location}
                </p>
                <ProgressTimeline stages={buildReportStages(selected)} />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
