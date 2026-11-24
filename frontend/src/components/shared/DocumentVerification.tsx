import React, { useState } from 'react';
import { CircleAlert, CircleCheck, CircleX } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { DocumentRequest } from '../../types';
import { Button, Card, Field, Input, PageHeader, formatShortDateTime } from '../ui';
import { BARANGAY } from '../../config/barangay';

const ISSUED: DocumentRequest['status'][] = ['approved', 'ready_for_release', 'completed'];

const BANNER_TONES = {
  success: 'bg-success-bg text-success-fg',
  warning: 'bg-warning-bg text-warning-fg',
  danger: 'bg-danger-bg text-danger-fg',
} as const;

/** Prototype only: a seeded, issued document so the demo has something to verify. */
const SAMPLE_CODE = 'VER-B4A-78921-99';

type Outcome =
  | { kind: 'valid'; doc: DocumentRequest }
  | { kind: 'not_issued'; doc: DocumentRequest }
  | { kind: 'not_found'; looksLikeReference: boolean };

/**
 * Verify a Document (public site footer + resident "More" group). No mockup; built from DESIGN.md patterns.
 * Checks the verification code printed on a barangay document. Request reference numbers
 * (REQ-…) are not accepted here, so nobody can look up a resident's name by guessing them.
 */
export const DocumentVerification: React.FC = () => {
  const { documentRequests, officials } = useBarangay();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [checked, setChecked] = useState('');

  const captain = officials.find(o => o.position === 'Barangay Captain' && o.status === 'Active (Incumbent)');

  const verify = (raw: string) => {
    const clean = raw.trim().toUpperCase();
    if (!clean) {
      setError('Enter the verification code printed on the document.');
      setOutcome(null);
      return;
    }
    setError(undefined);
    setChecked(clean);
    const doc = documentRequests.find(d => d.verificationCode.toUpperCase() === clean);
    if (!doc) setOutcome({ kind: 'not_found', looksLikeReference: /^REQ-/.test(clean) });
    else setOutcome({ kind: ISSUED.includes(doc.status) ? 'valid' : 'not_issued', doc });
  };

  const row = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-3 border-b border-line-soft last:border-b-0">
      <dt className="text-meta text-muted">{label}</dt>
      <dd className="font-semibold break-words">{value}</dd>
    </div>
  );

  const banner = (tone: 'success' | 'warning' | 'danger', icon: React.ReactNode, title: string, text: string) => (
    <div className={`flex gap-3 rounded-control px-4 py-3 ${BANNER_TONES[tone]}`}>
      <span className="shrink-0 [&_svg]:w-7 [&_svg]:h-7">{icon}</span>
      <p>
        <b className="block font-semibold text-base">{title}</b>
        {text}
      </p>
    </div>
  );

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Verify a Document"
        description={`Check that a certificate or clearance was really issued by Barangay ${BARANGAY}.`}
      />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <div className="grid gap-3 sm:gap-5">
          <Card padded="lg">
            <form
              noValidate
              onSubmit={e => {
                e.preventDefault();
                verify(code);
              }}
            >
              <Field
                label="Verification code"
                error={error}
                help="It is printed under the QR code at the bottom of the document and starts with VER."
                className="[&>label]:mt-0"
              >
                {p => (
                  <Input
                    {...p}
                    autoComplete="off"
                    placeholder="VER-XXX-00000-00"
                    value={code}
                    onChange={e => {
                      setCode(e.target.value);
                      setError(undefined);
                    }}
                  />
                )}
              </Field>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5">
                <Button type="submit" className="w-full sm:w-auto">
                  Verify document
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setCode(SAMPLE_CODE);
                    verify(SAMPLE_CODE);
                  }}
                  className="text-meta font-semibold text-primary-strong hover:underline underline-offset-4 min-h-11 cursor-pointer"
                >
                  Try a sample code
                </button>
              </div>
            </form>
          </Card>

          <div aria-live="polite">
            {outcome?.kind === 'valid' && (
              <Card>
                {banner(
                  'success',
                  <CircleCheck strokeWidth={1.8} aria-hidden="true" />,
                  'This document is valid',
                  `It was issued by Barangay ${BARANGAY}. Check that the details below match the paper.`,
                )}
                <dl className="mt-4">
                  {row('Document', outcome.doc.documentTitle)}
                  {row('Issued to', outcome.doc.residentName)}
                  {row('Address', `${outcome.doc.purok}, Barangay ${BARANGAY}, San Pablo City`)}
                  {row('Purpose', outcome.doc.purpose || 'Not stated')}
                  {row('Date', formatShortDateTime(outcome.doc.updatedAt))}
                  {captain && row('Signed by', `${captain.name}, Punong Barangay`)}
                  {row('Verification code', outcome.doc.verificationCode)}
                </dl>
              </Card>
            )}
            {outcome?.kind === 'not_issued' &&
              banner(
                'warning',
                <CircleAlert strokeWidth={1.8} aria-hidden="true" />,
                'This document has not been issued yet',
                'The code belongs to a request the barangay is still processing. A paper with this code is not valid yet.',
              )}
            {outcome?.kind === 'not_found' &&
              banner(
                'danger',
                <CircleX strokeWidth={1.8} aria-hidden="true" />,
                `We could not find ${checked}`,
                outcome.looksLikeReference
                  ? 'That looks like a request reference number. Enter the verification code printed on the document instead. It starts with VER.'
                  : 'Check that you typed it exactly as printed. If it still does not match, the document may not be genuine. Contact the barangay hall.',
              )}
          </div>
        </div>

        <div className="grid gap-3 sm:gap-5">
          <Card tone="callout">
            <h2 className="text-h3 font-semibold text-navy">Who uses this</h2>
            <p className="text-meta text-ink mt-1">
              Employers, banks, schools and offices that receive a barangay document and want to confirm it is genuine.
            </p>
          </Card>
          <Card>
            <h2 className="text-h3 font-semibold text-navy">Still unsure?</h2>
            <p className="text-meta text-muted mt-1">
              Call or visit the barangay hall, Monday to Friday, 8:00 AM to 5:00 PM. Bring the document or a clear photo of it.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
