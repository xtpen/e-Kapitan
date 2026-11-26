import React, { useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { IncidentCategory, IncidentReport } from '../../types';
import { Button, Card, Checkbox, Field, FileUpload, Input, PageHeader, Select, Textarea, todayISO } from '../ui';
import { INCIDENT_CATEGORIES, PUROKS } from '../../data/reference';
import { setPendingReference } from './publicNav';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const isMobile = (v: string) => /^09\d{9}$/.test(v.replace(/[\s-]/g, ''));

type Errors = Partial<Record<'date' | 'location' | 'description' | 'files' | 'mobile' | 'consent', string>>;

/**
 * Public · Report a concern (guests). Mockup: "Resident · Report a concern (mobile)", with the desktop
 * layout of "Resident · Complaints" (form + aside). Name and mobile are optional for guests.
 */
export const ReportConcern: React.FC = () => {
  const { createIncidentReport, setActiveTab } = useBarangay();

  const [category, setCategory] = useState<IncidentCategory>(INCIDENT_CATEGORIES[0]);
  const [date, setDate] = useState(todayISO());
  const [purok, setPurok] = useState(PUROKS[0]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [filed, setFiled] = useState<IncidentReport | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!date) e.date = 'Enter the date it happened.';
    else if (date > todayISO()) e.date = 'The date cannot be in the future.';
    if (!location.trim()) e.location = 'Enter a street or landmark so staff can find it.';
    if (description.trim().length < 15) e.description = 'Describe what happened in a sentence or two.';
    if (files.some(f => !FILE_TYPES.includes(f.type))) e.files = 'Attach JPG, PNG or PDF files only.';
    else if (files.some(f => f.size > MAX_FILE_BYTES)) e.files = 'Each file must be 5 MB or smaller.';
    if (mobile.trim() && !isMobile(mobile)) e.mobile = 'Enter an 11-digit mobile number that starts with 09, or leave it blank.';
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
      isAnonymous: !name.trim(),
      reporterName: name.trim() || 'Anonymous Guest',
      reporterContact: mobile.trim() || 'Not provided',
    });
    setFiled(created);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const reset = () => {
    setFiled(null);
    setLocation('');
    setDescription('');
    setFiles([]);
    setConsent(false);
    setErrors({});
  };

  const track = () => {
    if (!filed) return;
    setPendingReference(filed.referenceNumber);
    setActiveTab('report_status');
  };

  const whatNext = (
    <Card tone="callout">
      <h2 className="text-h3 font-semibold text-navy-ink mb-3">What happens next</h2>
      <ol className="grid gap-2.5">
        {[
          'You get a tracking number right away.',
          'Barangay staff review your report.',
          'Staff act on the concern, or set a hearing if needed.',
          'The report is marked resolved.',
        ].map((step, i) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden="true"
              className="w-7 h-7 shrink-0 rounded-full bg-surface text-primary-strong border border-primary-tint-line grid place-items-center text-caption font-semibold"
            >
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="text-meta text-ink mt-4">For emergencies, call 911 instead of filing a report.</p>
    </Card>
  );

  return (
    <div ref={topRef} className="scroll-mt-24">
      <PageHeader title="Report a concern" description="Tell the barangay about a concern. You will get a tracking number." />

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5 items-start">
        <Card padded="lg">
          {filed ? (
            <div role="status">
              <div className="flex gap-3 rounded-control bg-success-bg text-success-fg px-4 py-3">
                <CheckCircle2 className="w-6 h-6 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                <p>
                  <b className="font-semibold">Report submitted.</b> Your tracking number is{' '}
                  <b className="font-semibold whitespace-nowrap">{filed.referenceNumber}</b>.
                </p>
              </div>
              <p className="mt-4">
                Write it down or take a screenshot. You will need it to check the progress of your report.
                {mobile.trim() && ' We will also send updates to your mobile number.'}
              </p>
              <div className="grid sm:grid-cols-2 gap-2.5 mt-6">
                <Button onClick={track}>Track this report</Button>
                <Button variant="secondary" onClick={reset}>
                  Report another concern
                </Button>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={submit}>
              <h2 className="text-h3-lg font-semibold text-navy-ink">File a new report</h2>
              {Object.keys(errors).length > 0 && (
                <p role="alert" className="mt-4 rounded-control bg-danger-bg text-danger-fg font-semibold px-4 py-3">
                  Please fix the fields marked below.
                </p>
              )}
              <div className="grid sm:grid-cols-2 gap-x-5">
                <Field label="Type of concern">
                  {p => (
                    <Select {...p} value={category} onChange={e => setCategory(e.target.value as IncidentCategory)}>
                      {INCIDENT_CATEGORIES.map(c => (
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
                  {p => <Input {...p} placeholder="Street or landmark" value={location} onChange={e => setLocation(e.target.value)} />}
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
              <Field label="Add a photo" optional error={errors.files} help="JPG, PNG or PDF, up to 5 MB each.">
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

              <div className="grid sm:grid-cols-2 gap-x-5">
                <Field label="Your name" optional help="Leave blank to report without your name.">
                  {p => <Input {...p} autoComplete="name" value={name} onChange={e => setName(e.target.value)} />}
                </Field>
                <Field label="Mobile number" optional error={errors.mobile} help="For text updates about this report.">
                  {p => (
                    <Input
                      {...p}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="09XX XXX XXXX"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                    />
                  )}
                </Field>
              </div>

              <Checkbox
                className="mt-4"
                label="I agree to the processing of my personal data"
                description="It is used only to act on this report, as required by the Data Privacy Act of 2012."
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                error={errors.consent}
              />

              <Button type="submit" fullWidth className="mt-6">
                Submit report
              </Button>
            </form>
          )}
        </Card>

        <div className="grid gap-3 sm:gap-5">
          {whatNext}
          <Card>
            <h2 className="text-h3 font-semibold text-navy-ink">Already filed a report?</h2>
            <p className="text-meta text-muted mt-1 mb-4">Check its progress with your tracking number.</p>
            <Button variant="secondary" onClick={() => setActiveTab('report_status')}>
              Track a report
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
