import React, { useState } from 'react';
import { CircleAlert, CircleCheck, CircleX } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { DocumentRequest } from '../../types';
import { useT } from '../../i18n';
import { Button, Field, Input, formatShortDateTime } from '../ui';
import { FormActions, IconCircle, Page, PageTitle, Section } from '../resident/kit';
import type { IconTone } from '../resident/kit';

const ISSUED: DocumentRequest['status'][] = ['approved', 'ready_for_release', 'completed'];

/** Prototype only: a seeded, issued document so the demo has something to check. */
const SAMPLE_CODE = 'VER-B4A-78921-99';

type Outcome =
  | { kind: 'valid'; doc: DocumentRequest }
  | { kind: 'not_issued'; doc: DocumentRequest }
  | { kind: 'not_found'; looksLikeReference: boolean };

/** Label / value row in the result. */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-3 border-b border-line-soft last:border-b-0">
    <dt className="text-meta text-muted shrink-0">{label}</dt>
    <dd className="text-meta font-semibold text-ink text-right break-words min-w-0">{children}</dd>
  </div>
);

/**
 * Check a document (public site + resident tab `qr_verify`).
 * Checks the code printed on a document from the hall. Tracking numbers (REQ-…) are not accepted
 * here, so nobody can look up a resident's name by guessing them.
 */
export const DocumentVerification: React.FC = () => {
  const { documentRequests, officials } = useBarangay();
  const t = useT();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [checked, setChecked] = useState('');

  const captain = officials.find(o => o.position === 'Barangay Captain' && o.status === 'Active (Incumbent)');

  const verify = (raw: string) => {
    const clean = raw.trim().toUpperCase();
    if (!clean) {
      setError(t('Type the code from the document.'));
      setOutcome(null);
      return;
    }
    setError(undefined);
    setChecked(clean);
    const doc = documentRequests.find(d => d.verificationCode.toUpperCase() === clean);
    if (!doc) setOutcome({ kind: 'not_found', looksLikeReference: /^REQ-/.test(clean) });
    else setOutcome({ kind: ISSUED.includes(doc.status) ? 'valid' : 'not_issued', doc });
  };

  const head = (tone: IconTone, icon: React.ReactNode, title: string, text: string) => (
    <div className="flex items-center gap-3">
      <IconCircle tone={tone} size="lg">
        {icon}
      </IconCircle>
      <div className="min-w-0">
        <h2 className="text-[1.0625rem] font-semibold text-ink leading-tight">{title}</h2>
        <p className="text-meta text-muted mt-0.5">{text}</p>
      </div>
    </div>
  );

  return (
    <Page>
      <PageTitle title={t('Check a document')} sub={t('See if a paper from the hall is real.')} />

      <Section>
        <form
          noValidate
          aria-label={t('Check a document')}
          onSubmit={e => {
            e.preventDefault();
            verify(code);
          }}
        >
          <Field label={t('Code on the document')} error={error} help={t('It starts with VER, below the QR code.')} className="[&>label]:mt-0">
            {p => (
              <Input
                {...p}
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="VER-XXX-00000-00"
                value={code}
                onChange={e => {
                  setCode(e.target.value);
                  setError(undefined);
                }}
              />
            )}
          </Field>
          <FormActions>
            <Button
              variant="secondary"
              onClick={() => {
                setCode(SAMPLE_CODE);
                verify(SAMPLE_CODE);
              }}
            >
              {t('Try a sample')}
            </Button>
            <Button variant="brand" type="submit">{t('Check')}</Button>
          </FormActions>
        </form>
      </Section>

      <div aria-live="polite" className="empty:hidden">
        {outcome && (
          <Section>
            {outcome.kind === 'valid' && (
              <>
                {head('green', <CircleCheck />, t('Real document'), t('Make sure these details match the paper.'))}
                <dl className="mt-3">
                  <Row label={t('Document')}>{outcome.doc.documentTitle}</Row>
                  <Row label={t('Name')}>{outcome.doc.residentName}</Row>
                  <Row label={t('Purok')}>{outcome.doc.purok}</Row>
                  <Row label={t('For')}>{outcome.doc.purpose || t('Not stated')}</Row>
                  <Row label={t('Date')}>{formatShortDateTime(outcome.doc.updatedAt)}</Row>
                  {captain && <Row label={t('Signed by')}>{captain.name}</Row>}
                  <Row label={t('Code')}>{outcome.doc.verificationCode}</Row>
                </dl>
              </>
            )}
            {outcome.kind === 'not_issued' &&
              head('amber', <CircleAlert />, t('Not ready yet'), t('This request is still being worked on. The paper is not valid yet.'))}
            {outcome.kind === 'not_found' &&
              head(
                'red',
                <CircleX />,
                t('Not found'),
                outcome.looksLikeReference
                  ? t('That is a tracking number. Use the code that starts with VER.')
                  : t("We couldn't find {code}. Check the code and try again, or ask at the hall.", { code: checked }),
              )}
          </Section>
        )}
      </div>
    </Page>
  );
};
