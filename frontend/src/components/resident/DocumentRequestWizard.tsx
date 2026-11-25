import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { DocumentRequest, DocumentType } from '../../types';
import {
  Button,
  Card,
  Checkbox,
  Field,
  FileUpload,
  IconTile,
  Input,
  PageHeader,
  Select,
  Stepper,
  formatPeso,
  todayISO,
} from '../ui';
import { PUROKS } from '../../data/reference';

interface DocumentRequestWizardProps {
  initialServiceId?: string;
}

const STEPS = ['Choose', 'Your details', 'Review'];

const PURPOSES = [
  'Employment',
  'Scholarship or school requirement',
  'Bank or loan requirement',
  'Government ID application',
  'Medical or financial assistance',
  'Other',
];

const WAIVERS = [
  'First-Time Jobseeker (RA 11261)',
  'Senior Citizen (RA 9994)',
  'Registered Indigent Household',
  'Person with Disability (RA 7277)',
];

const MAX_ID_BYTES = 5 * 1024 * 1024;
const ID_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const formatClaimDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

type Errors = Partial<Record<'name' | 'purpose' | 'otherPurpose' | 'claimDate' | 'mobile' | 'validId' | 'consent', string>>;

/**
 * Resident · Document request, steps 2 (Your details) and 3 (Review), then a confirmation.
 * Step 1 (Choose) is the Documents list. Mockup: "Resident · Document request". See DESIGN.md.
 */
export const DocumentRequestWizard: React.FC<DocumentRequestWizardProps> = ({ initialServiceId }) => {
  const { services, currentUser, createDocumentRequest, setActiveTab } = useBarangay();
  const service = services.find(s => s.id === initialServiceId);

  const [step, setStep] = useState<1 | 2>(1); // index into STEPS
  const [submitted, setSubmitted] = useState<DocumentRequest | null>(null);

  const [name, setName] = useState(currentUser.name);
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [otherPurpose, setOtherPurpose] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [mobile, setMobile] = useState('');
  const [purok, setPurok] = useState(PUROKS[1]);
  const [validId, setValidId] = useState<File | null>(null);
  const [wantsWaiver, setWantsWaiver] = useState(false);
  const [waiverReason, setWaiverReason] = useState(WAIVERS[0]);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLDivElement>(null);

  // Arrived here without choosing a document: go back to the list.
  useEffect(() => {
    if (!service) setActiveTab('services');
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

  const canWaive = !!service && service.fee > 0 && service.isFreeForEligible;
  const fee = !service || (canWaive && wantsWaiver) ? 0 : service.fee;
  const finalPurpose = purpose === 'Other' ? otherPurpose.trim() : purpose;

  const feeText = useMemo(() => {
    if (!service) return '';
    if (service.fee === 0) return 'Free';
    if (canWaive && wantsWaiver) return `Free if your ${waiverReason} waiver is confirmed at the hall`;
    return `${formatPeso(fee)}, paid at the hall`;
  }, [service, canWaive, wantsWaiver, waiverReason, fee]);

  if (!service) return null;

  const validateDetails = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Enter your full name.';
    if (purpose === 'Other' && !otherPurpose.trim()) e.otherPurpose = 'Tell us what the document is for.';
    if (!claimDate) e.claimDate = 'Choose the day you want to claim it.';
    else if (claimDate < todayISO()) e.claimDate = 'Choose today or a later date.';
    else {
      const day = new Date(`${claimDate}T00:00:00`).getDay();
      if (day === 0 || day === 6) e.claimDate = 'Choose a weekday. The hall releases documents Monday to Friday.';
    }
    const digits = mobile.replace(/[\s-]/g, '');
    if (!digits) e.mobile = 'Enter your mobile number.';
    else if (!/^09\d{9}$/.test(digits)) e.mobile = 'Enter an 11-digit number that starts with 09.';
    if (!validId) e.validId = 'Upload a photo or scan of a valid ID.';
    else if (!ID_TYPES.includes(validId.type)) e.validId = 'Upload a JPG, PNG or PDF file.';
    else if (validId.size > MAX_ID_BYTES) e.validId = 'Upload a file that is 5 MB or smaller.';
    return e;
  };

  const goToReview = () => {
    const e = validateDetails();
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(2);
  };

  const submit = () => {
    if (!consent) {
      setErrors({ consent: 'Check the box to agree before you submit.' });
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

  const aside = (
    <div className="grid gap-3 sm:gap-5">
      <Card>
        <IconTile className="mb-3.5 [&_svg]:w-6 [&_svg]:h-6">
          <ClipboardList strokeWidth={1.8} />
        </IconTile>
        <h3 className="text-h3 font-semibold text-navy">Requirements</h3>
        <ul className="text-meta text-muted mt-1.5 space-y-0.5">
          {service.requirements.map(r => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>
      <Card tone="callout">
        <h3 className="text-h3 font-semibold text-navy">How to claim</h3>
        <p className="text-meta text-muted mt-1.5">
          Bring your reference number and ID to the barangay hall, 1:00 PM to 4:00 PM. Any fee is paid at the hall.
        </p>
      </Card>
    </div>
  );

  const breadcrumb = (
    <>
      <button
        type="button"
        onClick={() => setActiveTab('services')}
        className="text-primary-strong font-semibold hover:underline underline-offset-4 cursor-pointer"
      >
        Documents
      </button>{' '}
      / {service.title}
    </>
  );

  /* ---------- Confirmation ---------- */
  if (submitted) {
    return (
      <div className="max-w-[1200px]">
        <PageHeader breadcrumb={breadcrumb} title="Request submitted" />
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
          <Card padded="lg">
            <div ref={formRef} tabIndex={-1} className="outline-none" role="status">
              <IconTile className="mb-4 [&_svg]:w-7 [&_svg]:h-7">
                <CheckCircle2 strokeWidth={1.8} />
              </IconTile>
              <h2 className="text-h3-lg font-semibold text-navy">We received your {service.title} request</h2>
              <p className="text-meta text-muted mt-1">Your reference number is</p>
              <p className="font-display text-h2 font-bold text-navy mt-1 tracking-wide">{submitted.referenceNumber}</p>
              <p className="mt-4">
                Staff will review it and notify you when it is ready. Bring this reference number and a valid ID when
                you claim it on {formatClaimDate(claimDate)}.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 mt-7">
                <Button onClick={() => setActiveTab('tracking')}>View my requests</Button>
                <Button variant="secondary" onClick={() => setActiveTab('services')}>
                  Back to documents
                </Button>
              </div>
            </div>
          </Card>
          {aside}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        breadcrumb={breadcrumb}
        title={`Request a ${service.title}`}
        description={step === 1 ? 'Fill in your details. It takes about 3 minutes.' : 'Check your details before you submit.'}
      />

      <Stepper steps={STEPS} current={step} className="mb-6" />

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
        <Card padded="lg">
          <div ref={formRef} tabIndex={-1} className="outline-none">
            {step === 1 ? (
              /* ---------- Step 2: Your details ---------- */
              <form
                noValidate
                onSubmit={e => {
                  e.preventDefault();
                  goToReview();
                }}
              >
                <h2 className="sr-only">Your details</h2>
                {Object.keys(errors).length > 0 && (
                  <p role="alert" className="mb-2 rounded-control bg-danger-bg text-danger-fg font-semibold px-4 py-3">
                    Please fix the fields marked below.
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-x-5">
                  <Field label="Full name" error={errors.name}>
                    {p => <Input {...p} value={name} onChange={e => setName(e.target.value)} autoComplete="name" />}
                  </Field>
                  <Field label="Purpose">
                    {p => (
                      <Select {...p} value={purpose} onChange={e => setPurpose(e.target.value)}>
                        {PURPOSES.map(x => (
                          <option key={x}>{x}</option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {purpose === 'Other' && (
                    <Field label="What is it for?" error={errors.otherPurpose} className="sm:col-span-2">
                      {p => <Input {...p} value={otherPurpose} onChange={e => setOtherPurpose(e.target.value)} />}
                    </Field>
                  )}
                  <Field label="Preferred claiming date" error={errors.claimDate} help="Weekdays only.">
                    {p => (
                      <Input {...p} type="date" min={todayISO()} value={claimDate} onChange={e => setClaimDate(e.target.value)} />
                    )}
                  </Field>
                  <Field label="Mobile number" error={errors.mobile} help="We send updates by SMS.">
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
                  <Field label="Purok" className="sm:col-span-2">
                    {p => (
                      <Select {...p} value={purok} onChange={e => setPurok(e.target.value)}>
                        {PUROKS.map(x => (
                          <option key={x}>{x}</option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </div>

                <Field label="Upload valid ID" error={errors.validId} help="JPG, PNG or PDF, up to 5 MB.">
                  {p => (
                    <FileUpload
                      {...p}
                      accept=".jpg,.jpeg,.png,.pdf"
                      hint="or choose a photo or scan of your ID"
                      files={validId ? [validId] : []}
                      onChange={fs => setValidId(fs[0] ?? null)}
                    />
                  )}
                </Field>

                {canWaive && (
                  <div className="mt-4">
                    <Checkbox
                      label="I qualify for a fee waiver"
                      description="For first-time jobseekers, senior citizens, PWDs and registered indigent households. Staff confirm it at the hall."
                      checked={wantsWaiver}
                      onChange={e => setWantsWaiver(e.target.checked)}
                    />
                    {wantsWaiver && (
                      <Field label="Waiver type">
                        {p => (
                          <Select {...p} value={waiverReason} onChange={e => setWaiverReason(e.target.value)}>
                            {WAIVERS.map(x => (
                              <option key={x}>{x}</option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:flex sm:justify-between gap-2.5 mt-7">
                  <Button variant="secondary" onClick={() => setActiveTab('services')}>
                    Back
                  </Button>
                  <Button type="submit">Continue</Button>
                </div>
              </form>
            ) : (
              /* ---------- Step 3: Review ---------- */
              <div>
                <h2 className="text-h3-lg font-semibold text-navy">Review your request</h2>
                <dl className="mt-3">
                  {[
                    ['Document', service.title],
                    ['Full name', name],
                    ['Purpose', finalPurpose],
                    ['Claiming date', formatClaimDate(claimDate)],
                    ['Mobile number', mobile],
                    ['Purok', purok],
                    ['Valid ID', validId?.name ?? ''],
                    ['Fee', feeText],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-3 border-b border-line-soft last:border-b-0">
                      <dt className="text-meta text-muted">{k}</dt>
                      <dd className="text-meta font-semibold break-words">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5">
                  <Checkbox
                    label="I agree to the processing of my personal data"
                    description="Only authorized barangay staff can see it, as required by the Data Privacy Act of 2012."
                    checked={consent}
                    onChange={e => {
                      setConsent(e.target.checked);
                      if (e.target.checked) setErrors({});
                    }}
                    error={errors.consent}
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex sm:justify-between gap-2.5 mt-7">
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={submit}>Submit request</Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {aside}
      </div>
    </div>
  );
};
