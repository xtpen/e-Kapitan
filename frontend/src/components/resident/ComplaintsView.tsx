import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Dog,
  Droplets,
  EyeOff,
  Lightbulb,
  MessageSquareWarning,
  MoreHorizontal,
  Trash2,
  Users,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { useT } from '../../i18n';
import type { IncidentCategory, IncidentReport, IncidentStatus } from '../../types';
import { INCIDENT_CATEGORIES, PUROKS } from '../../data/reference';
import { buildReportStages } from '../shared/reportStages';
import {
  Button,
  Checkbox,
  Expand,
  Field,
  FileUpload,
  Input,
  ProgressTimeline,
  Select,
  StatusPill,
  Switch,
  Textarea,
  dateTimeValue,
  formatShortDateTime,
  incidentStatus,
  todayISO,
} from '../ui';
import { Choice, EmptyState, FormActions, IconCircle, List, ListRow, Page, PageTitle, Section } from './kit';
import { useGuest } from '../guest/access';
import { rememberTracked } from '../guest/GuestTrack';
import { setPendingReference } from '../public/publicNav';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

type Errors = Partial<Record<'date' | 'location' | 'description' | 'files' | 'consent' | 'mobile', string>>;
const isMobile = (v: string) => /^09d{9}$/.test(v.replace(/[s-]/g, ''));

/** Everyday name and icon for each kind of problem. The stored category stays the same. */
const CATEGORY: Record<IncidentCategory, { label: string; icon: LucideIcon }> = {
  'Noise Disturbance': { label: 'Noise', icon: Volume2 },
  'Neighbor Dispute': { label: 'Neighbor', icon: Users },
  'Sanitation & Garbage': { label: 'Garbage', icon: Trash2 },
  'Public Safety / Streetlight': { label: 'Streetlight or safety', icon: Lightbulb },
  'Stray Animal Concern': { label: 'Stray animal', icon: Dog },
  'Drainage / Flooding': { label: 'Flooding', icon: Droplets },
  'Other Community Concern': { label: 'Something else', icon: MoreHorizontal },
};
const categoryInfo = (c: IncidentCategory) => CATEGORY[c] ?? { label: c, icon: MessageSquareWarning };

/** One short line: what happens next for each status. */
const NEXT_STEP: Record<IncidentStatus, string> = {
  received: 'Staff will read your report soon.',
  assigned: 'Staff are checking it. They may contact you.',
  in_progress: 'The barangay is working on it.',
  hearing_scheduled: 'A meeting has been set. Check your notifications and bring a valid ID.',
  resolved: 'Done. If it happens again, send a new report.',
  dismissed: 'This report was closed. Ask at the barangay hall if you have questions.',
};

/**
 * Report a problem: pick the kind, add the details, send. Your reports are listed below.
 * Guests (no account) may add a name and mobile number, or leave them out; they get a tracking
 * number with a Track button, and see the reports they sent in this visit.
 */
export const ComplaintsView: React.FC = () => {
  const { incidents, createIncidentReport, currentUser, setActiveTab } = useBarangay();
  const { isGuest } = useGuest();
  const t = useT();
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');

  const [category, setCategory] = useState<IncidentCategory>(INCIDENT_CATEGORIES[0]);
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
  const [openId, setOpenId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const myReports = incidents
    .filter(i => (!isGuest && i.reporterName === currentUser.name) || myAnonymousIds.includes(i.id))
    .sort((a, b) => dateTimeValue(b.submittedAt) - dateTimeValue(a.submittedAt));

  const validate = (): Errors => {
    const e: Errors = {};
    if (!date) e.date = t('Enter the date it happened.');
    else if (date > todayISO()) e.date = t('The date cannot be in the future.');
    if (!location.trim()) e.location = t('Enter a street or landmark.');
    if (description.trim().length < 15) e.description = t('Tell us what happened in a sentence or two.');
    if (files.some(f => !FILE_TYPES.includes(f.type))) e.files = t('Use a JPG, PNG or PDF file.');
    else if (files.some(f => f.size > MAX_FILE_BYTES)) e.files = t('Each file must be 5 MB or smaller.');
    if (isGuest && guestMobile.trim() && !isMobile(guestMobile)) e.mobile = t('Enter an 11-digit mobile number that starts with 09, or leave it blank.');
    if (!consent) e.consent = t('Tick this box to send your report.');
    return e;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // Take the resident to the first thing to fix.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    const created = createIncidentReport({
      category,
      title: `${category}: ${location.trim()}`,
      description: description.trim(),
      location: location.trim(),
      purok,
      incidentDateTime: date,
      ...(isGuest
        ? { isAnonymous: !guestName.trim(), reporterName: guestName.trim() || 'Anonymous Guest', reporterContact: guestMobile.trim() || 'Not provided' }
        : { isAnonymous: anonymous, reporterName: currentUser.name, reporterContact: currentUser.email }),
    });
    if (anonymous || isGuest) setMyAnonymousIds(ids => [created.id, ...ids]);
    if (isGuest) rememberTracked(created.referenceNumber);
    setJustFiled(created);
    setOpenId(created.id);
    setLocation('');
    setDescription('');
    setFiles([]);
    setAnonymous(false);
    setConsent(false);
  };

  return (
    <Page>
      <PageTitle title={t('Report a problem')} sub={t("Tell the barangay what's wrong.")} />

      <Section title={t("What's the problem?")} id="report-kind-title">
        <div role="radiogroup" aria-labelledby="report-kind-title" className="grid grid-cols-2 gap-2">
          {INCIDENT_CATEGORIES.map(c => {
            const { label, icon: Icon } = categoryInfo(c);
            return <Choice key={c} selected={category === c} onSelect={() => setCategory(c)} label={t(label)} icon={<Icon />} />;
          })}
        </div>
      </Section>

      <Section title={t('Details')}>
        <form ref={formRef} noValidate onSubmit={submit}>
          <div className="grid sm:grid-cols-2 gap-x-4 -mt-4">
            <Field label={t('Purok')}>
              {p => (
                <Select {...p} value={purok} onChange={e => setPurok(e.target.value)}>
                  {PUROKS.map(x => (
                    <option key={x}>{x}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('Street or landmark')} error={errors.location}>
              {p => <Input {...p} placeholder={t('Example: Near the chapel')} value={location} onChange={e => setLocation(e.target.value)} />}
            </Field>
          </div>

          <Field label={t('When did it happen?')} error={errors.date}>
            {p => <Input {...p} type="date" max={todayISO()} value={date} onChange={e => setDate(e.target.value)} />}
          </Field>

          <Field label={t('What happened?')} error={errors.description}>
            {p => <Textarea {...p} placeholder={t('Tell us in your own words')} value={description} onChange={e => setDescription(e.target.value)} />}
          </Field>

          <Field label={t('Add a photo')} optional error={errors.files}>
            {p => (
              <FileUpload {...p} multiple accept=".jpg,.jpeg,.png,.pdf" hint={t('JPG, PNG or PDF, up to 5 MB')} files={files} onChange={setFiles} />
            )}
          </Field>

          {isGuest && (
            <div className="grid sm:grid-cols-2 gap-x-4">
              <Field label={t('Your name')} optional help={t('Leave blank to report without your name.')}>
                {p => <Input {...p} autoComplete="name" value={guestName} onChange={e => setGuestName(e.target.value)} />}
              </Field>
              <Field label={t('Mobile number')} optional error={errors.mobile} help={t('For text updates about this report.')}>
                {p => (
                  <Input {...p} type="tel" inputMode="tel" autoComplete="tel" placeholder="09XX XXX XXXX" value={guestMobile} onChange={e => setGuestMobile(e.target.value)} />
                )}
              </Field>
            </div>
          )}

          <div className="mt-4 border-t border-line-soft pt-1">
            {!isGuest && (
            <Switch
              icon={<EyeOff />}
              label={t('Hide my name')}
              description={t('Only barangay staff will know it was you.')}
              checked={anonymous}
              onChange={setAnonymous}
            />
            )}
            <Checkbox
              label={t('The barangay may use my details for this report.')}
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              error={errors.consent}
            />
          </div>

          <FormActions>
            <Button type="submit" variant="brand">
              {t('Send report')}
            </Button>
          </FormActions>
        </form>
      </Section>

      {justFiled && (
        <Section tone="success">
          <div role="status" className="flex items-center gap-3">
            <IconCircle tone="green">
              <CheckCircle2 />
            </IconCircle>
            <p className="text-ink">
              <b className="font-semibold">{t('Report sent.')}</b> {t('Tracking number')}{' '}
              <b className="font-semibold whitespace-nowrap">{justFiled.referenceNumber}</b>
            </p>
          </div>
          {isGuest && (
            <div className="mt-3 pl-[52px] flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-meta text-ink w-full">{t('Write it down or take a screenshot. You need it to check on your report.')}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPendingReference(justFiled.referenceNumber);
                  setActiveTab('tracking');
                }}
              >
                {t('Track this report')}
              </Button>
            </div>
          )}
        </Section>
      )}

      {(!isGuest || myReports.length > 0) && (
      <Section title={isGuest ? t('Reports you sent') : t('My reports')} flush>
        {myReports.length === 0 ? (
          <EmptyState icon={<MessageSquareWarning />} title={t('No reports yet')} />
        ) : (
          <List>
            {myReports.map(r => {
              const { label, icon: Icon } = categoryInfo(r.category);
              const open = openId === r.id;
              const status = incidentStatus[r.status];
              return (
                <div key={r.id}>
                  <ListRow
                    icon={
                      <IconCircle>
                        <Icon />
                      </IconCircle>
                    }
                    title={t(label)}
                    sub={formatShortDateTime(r.submittedAt)}
                    chevron={false}
                    trailing={
                      <span className="flex items-center gap-2">
                        <StatusPill tone={status.tone}>{t(status.label)}</StatusPill>
                        <ChevronDown
                          aria-hidden="true"
                          className={`w-5 h-5 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                        />
                        <span className="sr-only">{open ? t('Hide details') : t('Show details')}</span>
                      </span>
                    }
                    onClick={() => setOpenId(open ? null : r.id)}
                  />
                  <Expand show={open}>
                    <div className="pr-4 sm:pr-5 pb-4 pl-[68px] sm:pl-[72px] grid gap-3">
                      <p className="text-meta text-muted">
                        {t('Tracking number')} <b className="font-semibold text-ink">{r.referenceNumber}</b>
                      </p>
                      <ProgressTimeline stages={buildReportStages(r)} />
                      <p className="text-meta text-ink">{t(NEXT_STEP[r.status])}</p>
                    </div>
                  </Expand>
                </div>
              );
            })}
          </List>
        )}
      </Section>
      )}
    </Page>
  );
};
