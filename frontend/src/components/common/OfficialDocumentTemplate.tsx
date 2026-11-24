import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { DocumentRequest } from '../../types';
import { Button, StatusPill, documentStatus, formatPeso } from '../ui';

/*
 * Certificate viewer + printable certificate. See DESIGN.md section 5.18.
 * Screen: a modal with a toolbar and an A4 "sheet". Print: only the sheet prints (A4).
 * Officials come from the Officials data, so the list stays current.
 * No seal, signature or QR is drawn: the barangay applies the real seal and signature.
 */

const BARANGAY = 'Sto. Angel';
const CITY = 'San Pablo City';
const PROVINCE = 'Laguna';

interface Props {
  document: DocumentRequest;
  onClose: () => void;
}

const TITLES: Record<string, string> = {
  barangay_clearance: 'Barangay Clearance',
  certificate_of_residency: 'Certificate of Residency',
  certificate_of_indigency: 'Certificate of Indigency',
  business_clearance: 'Barangay Business Clearance',
  first_time_jobseeker: 'First-Time Jobseeker Certification',
  good_moral: 'Certificate of Good Moral Character',
};

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/** "9th day of September 2026" from the mock data's date strings. */
const issuedPhrase = (value: string) => {
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  const d = m ? new Date(`${m[1]}T00:00:00`) : new Date(value);
  const date = Number.isNaN(d.getTime()) ? new Date() : d;
  return `${ordinal(date.getDate())} day of ${date.toLocaleDateString('en-US', { month: 'long' })} ${date.getFullYear()}`;
};

const Seal: React.FC<{ label: string }> = ({ label }) => (
  <div
    aria-hidden="true"
    className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-field-line hidden sm:grid print:grid place-items-center text-center text-[0.625rem] leading-tight font-semibold uppercase tracking-wide text-muted shrink-0 print:text-[7pt]"
  >
    {label}
    <br />
    seal
  </div>
);

export const OfficialDocumentTemplate: React.FC<Props> = ({ document: doc, onClose }) => {
  const { officials, services } = useBarangay();
  const closeRef = useRef<HTMLButtonElement>(null);

  const service = services.find(s => s.id === doc.documentType);
  const title = TITLES[doc.documentType] ?? 'Barangay Certification';
  const place = `${doc.purok}, Barangay ${BARANGAY}, ${CITY}, ${PROVINCE}`;
  const purpose = doc.purpose || 'general purposes';
  const free = doc.isFreeDueToExemption || doc.fee === 0;

  const current = officials.filter(o => o.status !== 'Inactive (Former)' && o.status !== 'Suspended');
  const captain = current.find(o => /captain|punong/i.test(o.position));
  const council = current.filter(o => /kagawad|sk chair/i.test(o.position));
  const staff = current.filter(o => /secretary|treasurer/i.test(o.position));

  // Escape closes; focus the close button; mark <body> so print CSS shows only the sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    window.document.body.classList.add('printing-certificate');
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      window.document.body.classList.remove('printing-certificate');
    };
  }, [onClose]);

  const Name: React.FC<{ children: React.ReactNode }> = ({ children }) => <b className="font-semibold">{children}</b>;

  const body = (() => {
    switch (doc.documentType) {
      case 'barangay_clearance':
        return (
          <>
            <p>
              This is to certify that <Name>{doc.residentName}</Name>, of legal age, Filipino, and a resident of {place}, is
              known to this office as a person of good moral character and reputation in the community.
            </p>
            <p>
              Based on the records of this office, the above-named person has <Name>no derogatory record</Name> and no pending
              case or complaint filed before the Lupon Tagapamayapa of this barangay as of this date.
            </p>
            <p>
              This clearance is issued upon the request of the above-named person for: <Name>{purpose}</Name>.
            </p>
          </>
        );
      case 'certificate_of_residency':
        return (
          <>
            <p>
              This is to certify that <Name>{doc.residentName}</Name>, of legal age, is a bona fide resident of {place}, and has
              resided in this barangay for at least six (6) months.
            </p>
            <p>
              This certification is issued upon the request of the above-named person for: <Name>{purpose}</Name>.
            </p>
          </>
        );
      case 'certificate_of_indigency':
        return (
          <>
            <p>
              This is to certify that <Name>{doc.residentName}</Name>, a resident of {place}, belongs to an indigent family in
              this barangay based on the records of this office.
            </p>
            <p>
              This certification is issued free of charge upon the request of the above-named person for:{' '}
              <Name>{purpose}</Name>.
            </p>
          </>
        );
      case 'business_clearance':
        return (
          <>
            <p>
              This is to certify that the business owned by <Name>{doc.residentName}</Name>, located at {place}, is permitted
              to operate within the jurisdiction of this barangay, subject to compliance with barangay ordinances and
              regulations.
            </p>
            <p>
              This clearance is issued for: <Name>{purpose}</Name>.
            </p>
          </>
        );
      case 'first_time_jobseeker':
        return (
          <>
            <p>
              This is to certify that <Name>{doc.residentName}</Name>, a resident of {place}, is a qualified first-time
              jobseeker under <Name>Republic Act No. 11261</Name>, the First Time Jobseekers Assistance Act.
            </p>
            <p>
              Pursuant to RA 11261, this certification is issued free of charge and may be used only once, within one (1)
              year from the date of issue.
            </p>
          </>
        );
      case 'good_moral':
        return (
          <>
            <p>
              This is to certify that <Name>{doc.residentName}</Name>, a resident of {place}, is known to this office as a
              person of good moral character and has no derogatory record in this barangay.
            </p>
            <p>
              This certification is issued upon the request of the above-named person for: <Name>{purpose}</Name>.
            </p>
          </>
        );
      default:
        return (
          <p>
            This is to certify that <Name>{doc.residentName}</Name> is a resident of {place}. This certification is issued for:{' '}
            <Name>{purpose}</Name>.
          </p>
        );
    }
  })();

  return createPortal(
    <div
      className="certificate-viewer fixed inset-0 z-[90] flex flex-col bg-navy/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-title"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Toolbar (screen only) */}
      <div className="print:hidden bg-surface border-b border-line px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-3 gap-y-2.5 shrink-0">
        <div className="flex-1 min-w-0 order-1">
          <p id="certificate-title" className="font-display font-semibold text-navy text-h3 leading-tight truncate">
            {title}
          </p>
          <p className="text-meta text-muted truncate">
            {doc.referenceNumber} · {doc.residentName}
          </p>
        </div>
        <div className="order-3 sm:order-2 w-full sm:w-auto flex items-center justify-between gap-3">
          <StatusPill tone={documentStatus[doc.status].tone}>{documentStatus[doc.status].label}</StatusPill>
          <Button size="sm" onClick={() => window.print()} icon={<Printer className="w-5 h-5" aria-hidden="true" />}>
            Print or save as PDF
          </Button>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close certificate"
          className="order-2 sm:order-3 w-11 h-11 grid place-items-center rounded-control border-[1.5px] border-line text-navy hover:bg-surface-muted cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Sheet area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 print:p-0 print:overflow-visible" onClick={e => e.target === e.currentTarget && onClose()}>
        <article className="certificate-sheet mx-auto w-full max-w-[820px] bg-surface text-ink shadow-float rounded-[4px] px-6 py-8 sm:px-12 sm:py-12 print:shadow-none print:rounded-none print:max-w-none print:p-0">
          {/* Letterhead */}
          <header className="flex items-center gap-4 pb-4 border-b-[3px] border-double border-navy">
            <Seal label="City" />
            <div className="flex-1 text-center">
              <p className="text-caption uppercase tracking-[0.12em] text-muted">Republic of the Philippines</p>
              <p className="text-caption text-muted">
                Province of {PROVINCE} · {CITY}
              </p>
              <p className="font-display font-bold text-navy text-[1.5rem] sm:text-[1.75rem] leading-tight mt-1 uppercase">
                Barangay {BARANGAY}
              </p>
              <p className="text-caption font-semibold uppercase tracking-[0.14em] text-ink mt-0.5">Office of the Punong Barangay</p>
            </div>
            <Seal label="Barangay" />
          </header>

          <div className="grid sm:grid-cols-[200px_1fr] print:grid-cols-[170px_1fr] gap-6 sm:gap-8 mt-6">
            {/* Council column */}
            <aside className="order-2 sm:order-1 print:order-1 sm:border-r print:border-r border-line sm:pr-6 print:pr-5 text-caption">
              {captain && (
                <div className="mb-4">
                  <p className="font-semibold uppercase text-ink">{captain.name}</p>
                  <p className="text-muted">Punong Barangay</p>
                </div>
              )}
              {council.length > 0 && (
                <>
                  <p className="font-semibold uppercase tracking-[0.06em] text-ink mb-2">Sangguniang Barangay</p>
                  <ul className="space-y-2">
                    {council.map(o => (
                      <li key={o.id}>
                        <span className="block text-ink">{o.name}</span>
                        <span className="block text-muted">{o.position.replace('Barangay ', '')}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {staff.length > 0 && (
                <ul className="mt-4 pt-3 border-t border-line space-y-2">
                  {staff.map(o => (
                    <li key={o.id}>
                      <span className="block text-ink">{o.name}</span>
                      <span className="block text-muted">{o.position}</span>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            {/* Certificate body */}
            <div className="order-1 sm:order-2 print:order-2 flex flex-col">
              <h2 className="font-display font-bold text-navy text-center uppercase tracking-[0.06em] text-[1.25rem] sm:text-[1.5rem] leading-tight">
                {title}
              </h2>
              <p className="text-center text-caption text-muted mt-1">Reference no. {doc.referenceNumber}</p>

              <p className="font-semibold uppercase tracking-[0.08em] text-meta mt-6 mb-3">To whom it may concern:</p>
              <div className="space-y-3.5 text-[0.9375rem] leading-[1.75] text-justify [&_p]:indent-8">{body}</div>

              <p className="text-[0.9375rem] leading-[1.75] indent-8 mt-3.5 text-justify">
                Issued this {issuedPhrase(doc.updatedAt || doc.submittedAt)} at Barangay {BARANGAY}, {CITY}, {PROVINCE}.
              </p>

              {/* Signature (signed by hand at the hall) */}
              <div className="mt-12 self-end text-center min-w-[240px]">
                <div className="border-t border-ink pt-1.5">
                  <p className="font-semibold uppercase">{captain?.name ?? 'Punong Barangay'}</p>
                  <p className="text-caption text-muted">Punong Barangay</p>
                </div>
              </div>

              {/* Record details */}
              <dl className="mt-10 pt-4 border-t border-line grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-x-4 gap-y-3 text-caption">
                <div>
                  <dt className="text-muted">Fee</dt>
                  <dd className="font-semibold">{free ? 'Free' : formatPeso(doc.fee)}</dd>
                </div>
                <div>
                  <dt className="text-muted">O.R. no.</dt>
                  <dd className="font-semibold">{free ? 'Not applicable' : '________________'}</dd>
                </div>
                <div>
                  <dt className="text-muted">Valid for</dt>
                  <dd className="font-semibold">
                    {doc.documentType === 'first_time_jobseeker' ? '1 year' : service ? `${service.validityMonths} months` : '6 months'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Verification code</dt>
                  <dd className="font-semibold font-mono break-all">{doc.verificationCode}</dd>
                </div>
              </dl>
              <p className="text-caption text-muted mt-3">
                Not valid without the official barangay seal. To check that this document is genuine, enter the verification
                code in e-Kapitan under Verify a Document.
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>,
    window.document.body,
  );
};
