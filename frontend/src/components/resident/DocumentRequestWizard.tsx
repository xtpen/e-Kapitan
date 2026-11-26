import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { DocumentRequest, DocumentType } from '../../types';
import { Button, Checkbox, Field, FileUpload, Input, Select, Switch, formatPeso, todayISO } from '../ui';
import { FormActions, IconCircle, Page, PageTitle, Section } from './kit';
import { PUROKS } from '../../data/reference';

interface DocumentRequestWizardProps {
  initialServiceId?: string;
}

/** One small screen per step. The last one is the short summary before sending. */
const STEPS = ['About you', 'Pick-up day', 'Your ID', 'Check and send'] as const;
type Step = 0 | 1 | 2 | 3;

const PURPOSES = [
  'Employment',
  'Scholarship or school requirement',
  'Bank or loan requirement',
  'Government ID application',
  'Medical or financial assistance',
  'Other',
];

/** `value` is what staff see (unchanged); `label` is what residents read. */
const WAIVERS = [
  { value: 'First-Time Jobseeker (RA 11261)', label: 'First-time jobseeker' },
  { value: 'Senior Citizen (RA 9994)', label: 'Senior citizen' },
  { value: 'Registered Indigent Household', label: 'Low-income (indigent) family' },
  { value: 'Person with Disability (RA 7277)', label: 'Person with disability (PWD)' },
];

const MAX_ID_BYTES = 5 * 1024 * 1024;
const ID_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const formatPickUpDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const plainTitle = (t: string) => t.replace(/\s*\(RA\s*\d+\)/i, '');
const readyIn = (t: string) => {
  const s = t
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+upon validation/i, '')
    .split(/\s+or\s+/i)[0]
    .trim();
  return /^same day$/i.test(s) ? 'Ready same day' : `Ready in ${s}`;
};
const freeNote = (t: string) => t.replace(/\s+under Republic Act\s*\d+/i, '').replace(/\s*\(RA\s*\d+\)/i, '');

type Errors = Partial<Record<'name' | 'purpose' | 'otherPurpose' | 'claimDate' | 'mobile' | 'validId' | 'consent', string>>;

/** Label / value row in the summary. */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-3 border-b border-line-soft last:border-b-0">
    <dt className="text-meta text-muted shrink-0">{label}</dt>
    <dd className="text-meta font-semibold text-ink text-right min-w-0 break-words">{children}</dd>
  </div>
);

/**
 * Resident · Request a document (tab id `request_wizard`). Opened from the Documents list.
 * A few fields per step, a short summary before sending, then a simple confirmation.
 */
export const DocumentRequestWizard: React.FC<DocumentRequestWizardProps> = ({ initialServiceId }) => {
  const { services, currentUser, createDocumentRequest, setActiveTab } = useBarangay();
  const service = services.find(s => s.id === initialServiceId);

  const [step, setStep] = useState<Step>(0);
  const [submitted, setSubmitted] = useState<DocumentRequest | null>(null);

  const [name, setName] = useState(currentUser.name);
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [otherPurpose, setOtherPurpose] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [mobile, setMobile] = useState('');
  const [purok, setPurok] = useState(PUROKS[1]);
  const [validId, setValidId] = useState<File | null>(null);
  const [wantsWaiver, setWantsWaiver] = useState(false);
  const [waiverReason, setWaiverReason] = useState(WAIVERS[0].value);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLDivElement>(null);

  // Arrived here without choosing a document: go back to the list.
  useEffect(() => {
    if (!service) setActiveTab('documents');
  }, [service, setActiveTab]);

  // Move focus to the top of the step so screen readers and keyboards follow along.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    formRef.current?.focus({ preventScroll: true });
  }, [step, submitted]);

  if (!service) return null;

  const title = plainTitle(service.title);
  const canWaive = service.fee > 0 && service.isFreeForEligible;
  const fee = canWaive && wantsWaiver ? 0 : service.fee;
  const finalPurpose = purpose === 'Other' ? otherPurpose.trim() : purpose;
  const waiverLabel = WAIVERS.find(w => w.value === waiverReason)?.label ?? waiverReason;

  const feeText =
    service.fee === 0
      ? 'Free'
      : canWaive && wantsWaiver
        ? `Free (${waiverLabel.toLowerCase()})`
        : `${formatPeso(fee)}, pay at the hall`;

  /* ---------- Validation, one step at a time (same rules as before) ---------- */
  const validateStep = (s: Step): Errors => {
    const e: Errors = {};
    if (s === 0) {
      if (!name.trim()) e.name = 'Enter your full name.';
      const digits = mobile.replace(/[\s-]/g, '');
      if (!digits) e.mobile = 'Enter your mobile number.';
      else if (!/^09\d{9}$/.test(digits)) e.mobile = 'Enter an 11-digit number that starts with 09.';
    }
    if (s === 1) {
      if (purpose === 'Other' && !otherPurpose.trim()) e.otherPurpose = 'Tell us what the document is for.';
      if (!claimDate) e.claimDate = 'Choose the day you want to pick it up.';
      else if (claimDate < todayISO()) e.claimDate = 'Choose today or a later date.';
      else {
        const day = new Date(`${claimDate}T00:00:00`).getDay();
        if (day === 0 || day === 6) e.claimDate = 'Choose a weekday (Monday to Friday).';
      }
    }
    if (s === 2) {
      if (!validId) e.validId = 'Upload a photo or scan of a valid ID.';
      else if (!ID_TYPES.includes(validId.type)) e.validId = 'Upload a JPG, PNG or PDF file.';
      else if (validId.size > MAX_ID_BYTES) e.validId = 'Upload a file that is 5 MB or smaller.';
    }
    return e;
  };

  const next = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length === 0 && step < 3) setStep((step + 1) as Step);
  };

  const back = () => {
    setErrors({});
    if (step === 0) setActiveTab('documents');
    else setStep((step - 1) as Step);
  };

  const submit = () => {
    // Re-check every step in case something changed.
    for (const s of [0, 1, 2] as Step[]) {
      const e = validateStep(s);
      if (Object.keys(e).length > 0) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    if (!consent) {
      setErrors({ consent: 'Tick the box to agree before you send.' });
      return;
    }
    const req = createDocumentRequest({
      documentType: service.id as DocumentType,
      documentTitle: service.title,
      residentName: name.trim(),
      purok,
      contactNumber: mobile.replace(/[\s-]/g, ''),
      purpose: finalPurpose,
      fee,
      isFreeDueToExemption: fee === 0,
      exemptionReason: canWaive && wantsWaiver ? waiverReason : undefined,
      processingMethod: 'pickup',
      appointmentDate: claimDate,
      requirementsSubmitted: service.requirements.map(r => {
        const isId = /\bid\b/i.test(r);
        return { name: r, submitted: isId, verified: false };
      }),
    });
    setSubmitted(req);
  };

  /* ---------- Confirmation ---------- */
  if (submitted) {
    return (
      <Page>
        <Section>
          <div ref={formRef} tabIndex={-1} className="outline-none flex items-center gap-3" role="status">
            <IconCircle tone="green" size="lg">
              <CheckCircle2 />
            </IconCircle>
            <div className="min-w-0">
              <h1 className="font-display text-[1.625rem] font-bold text-ink leading-tight">Sent!</h1>
              <p className="text-muted">We'll text you when it's ready.</p>
            </div>
          </div>
          <dl className="mt-3">
            <Row label="Tracking number">{submitted.referenceNumber}</Row>
            <Row label="Pick up on">{formatPickUpDate(claimDate)}, 1:00 PM to 4:00 PM</Row>
            <Row label="Bring">{fee > 0 ? `Your ID and ${formatPeso(fee)}` : 'Your ID'}</Row>
          </dl>
          <FormActions>
            <Button variant="secondary" onClick={() => setActiveTab('home')}>
              Done
            </Button>
            <Button variant="brand" onClick={() => setActiveTab('tracking')}>See my requests</Button>
          </FormActions>
        </Section>
      </Page>
    );
  }

  const hasErrors = Object.keys(errors).some(k => k !== 'consent');
  const first = '[&>label]:mt-0';

  return (
    <Page>
      <PageTitle title={title} sub={`${service.fee === 0 ? 'Free' : formatPeso(service.fee)} · ${readyIn(service.processingTime)}`} />

      <Section title={STEPS[step]}>
        <div ref={formRef} tabIndex={-1} className="outline-none">
          <form
            noValidate
            aria-label={STEPS[step]}
            onSubmit={e => {
              e.preventDefault();
              if (step === 3) submit();
              else next();
            }}
          >
            {hasErrors && (
              <p role="alert" className="mb-3 rounded-control bg-danger-bg text-danger-fg font-semibold px-4 py-3">
                Please fix the fields marked below.
              </p>
            )}

            {step === 0 && (
              <>
                <Field label="Full name" error={errors.name} className={first}>
                  {p => <Input {...p} value={name} onChange={e => setName(e.target.value)} autoComplete="name" />}
                </Field>
                <Field label="Mobile number" error={errors.mobile} help="We text you when it's ready.">
                  {p => (
                    <Input
                      {...p}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="09XX XXX XXXX"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                    />
                  )}
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
              </>
            )}

            {step === 1 && (
              <>
                <Field label="What is it for?" className={first}>
                  {p => (
                    <Select {...p} value={purpose} onChange={e => setPurpose(e.target.value)}>
                      {PURPOSES.map(x => (
                        <option key={x}>{x}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                {purpose === 'Other' && (
                  <Field label="Tell us what it is for" error={errors.otherPurpose}>
                    {p => <Input {...p} value={otherPurpose} onChange={e => setOtherPurpose(e.target.value)} />}
                  </Field>
                )}
                <Field label="Pick-up day" error={errors.claimDate} help="Weekdays, 1:00 PM to 4:00 PM.">
                  {p => <Input {...p} type="date" min={todayISO()} value={claimDate} onChange={e => setClaimDate(e.target.value)} />}
                </Field>

                {canWaive && (
                  <div className="mt-3">
                    <Switch
                      label="I may get it free"
                      description={`${freeNote(service.eligibleCriteria)}. Staff check at the hall.`}
                      checked={wantsWaiver}
                      onChange={setWantsWaiver}
                    />
                    {wantsWaiver && (
                      <Field label="Which one are you?" className="[&>label]:mt-1">
                        {p => (
                          <Select {...p} value={waiverReason} onChange={e => setWaiverReason(e.target.value)}>
                            {WAIVERS.map(w => (
                              <option key={w.value} value={w.value}>
                                {w.label}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    )}
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <Field label="Photo of a valid ID" error={errors.validId} help="JPG, PNG or PDF, up to 5 MB. Bring the same ID." className={first}>
                {p => (
                  <FileUpload
                    {...p}
                    accept=".jpg,.jpeg,.png,.pdf"
                    hint="Take a photo or choose a file"
                    files={validId ? [validId] : []}
                    onChange={fs => setValidId(fs[0] ?? null)}
                  />
                )}
              </Field>
            )}

            {step === 3 && (
              <>
                <dl>
                  <Row label="Document">{title}</Row>
                  <Row label="Name">{name}</Row>
                  <Row label="Mobile">{mobile}</Row>
                  <Row label="Purok">{purok}</Row>
                  <Row label="For">{finalPurpose}</Row>
                  <Row label="Pick up on">{formatPickUpDate(claimDate)}</Row>
                  <Row label="ID">{validId?.name ?? ''}</Row>
                  <Row label="Cost">{feeText}</Row>
                </dl>

                <details className="group mt-1">
                  <summary className="inline-flex items-center gap-1.5 min-h-11 font-semibold text-meta text-navy-ink cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:underline underline-offset-4">
                    What to bring
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" strokeWidth={2} aria-hidden="true" />
                  </summary>
                  <ul className="mb-1 text-meta text-ink list-disc pl-5 space-y-1">
                    {service.requirements.map(r => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </details>

                <Checkbox
                  className="mt-2"
                  label="I agree to share these details with the hall"
                  description="Only hall staff can see them."
                  checked={consent}
                  onChange={e => {
                    setConsent(e.target.checked);
                    if (e.target.checked) setErrors({});
                  }}
                  error={errors.consent}
                />
              </>
            )}

            <FormActions>
              <Button variant="secondary" onClick={back}>
                Back
              </Button>
              <Button variant="brand" type="submit">{step === 3 ? 'Send request' : 'Continue'}</Button>
            </FormActions>
          </form>
        </div>
      </Section>
    </Page>
  );
};
