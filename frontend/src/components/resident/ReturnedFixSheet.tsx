import React, { useEffect, useState } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import type { DocumentRequest } from '../../types';
import { Button, Field, FileUpload, Input, Textarea, todayISO } from '../ui';
import { useT } from '../../i18n';
import { Sheet } from './kit';

/*
 * Fix and resend: a document request that staff returned for a correction is fixed right where
 * the resident reads the staff note. The form starts filled with what was sent; the resident
 * changes what the note asks for and sends it again (it goes back to "Sent").
 */

const isMobile = (v: string) => /^09\d{9}$/.test(v.replace(/[\s-]/g, ''));
const MAX_ID_BYTES = 5 * 1024 * 1024;
const ID_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export const ReturnedFixSheet: React.FC<{ request: DocumentRequest | null; onClose: () => void }> = ({ request, onClose }) => {
  const { resubmitDocumentRequest, addToast } = useBarangay();
  const t = useT();
  const [purpose, setPurpose] = useState('');
  const [mobile, setMobile] = useState('');
  const [date, setDate] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'purpose' | 'mobile' | 'date' | 'id', string>>>({});

  // Start from what was sent each time the sheet opens.
  useEffect(() => {
    if (!request) return;
    setPurpose(request.purpose);
    setMobile(request.contactNumber);
    setDate(request.appointmentDate ?? '');
    setIdFile(null);
    setNote('');
    setErrors({});
  }, [request]);

  const send = () => {
    if (!request) return;
    const e: typeof errors = {};
    if (purpose.trim().length < 3) e.purpose = t('Say what the document is for.');
    if (!isMobile(mobile)) e.mobile = t('Enter an 11-digit mobile number that starts with 09.');
    if (date && date < todayISO()) e.date = t('Pick today or a later day.');
    if (idFile && !ID_TYPES.includes(idFile.type)) e.id = t('Upload a JPG, PNG or PDF file.');
    else if (idFile && idFile.size > MAX_ID_BYTES) e.id = t('Upload a file that is 5 MB or smaller.');
    setErrors(e);
    if (Object.keys(e).length) return;
    resubmitDocumentRequest(request.id, {
      purpose: purpose.trim(),
      contactNumber: mobile.trim(),
      appointmentDate: date || undefined,
      newIdFileName: idFile?.name,
      note: note.trim() || undefined,
    });
    addToast(t('Sent again'), t('We will let you know after the barangay checks it.'), 'success');
    onClose();
  };

  return (
    <Sheet
      open={!!request}
      onClose={onClose}
      title={t('Fix and resend')}
      footer={
        <div className="grid grid-cols-[auto_1fr] gap-2.5">
          <Button variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button variant="brand" onClick={send}>
            {t('Send again')}
          </Button>
        </div>
      }
    >
      {request && (
        <>
          <p className="text-meta text-muted">{request.documentTitle} · {request.referenceNumber}</p>
          {request.staffNotes && (
            <div className="mt-3 rounded-control bg-warning-bg text-warning-fg px-3 py-2.5 text-meta">
              <b className="font-semibold">{t('What to fix:')}</b> {request.staffNotes}
            </div>
          )}
          <Field label={t('What is it for?')} required error={errors.purpose}>
            {p => <Input {...p} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder={t('e.g. School enrollment')} />}
          </Field>
          <Field label={t('Mobile number')} required error={errors.mobile}>
            {p => <Input {...p} type="tel" inputMode="numeric" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="0917 123 4567" />}
          </Field>
          <Field label={t('Pick-up day')} optional error={errors.date}>
            {p => <Input {...p} type="date" min={todayISO()} value={date} onChange={e => setDate(e.target.value)} />}
          </Field>
          <Field label={t('New photo of your ID')} optional error={errors.id} help={t('Only if the note asks for it. JPG, PNG or PDF, up to 5 MB.')}>
            {p => (
              <FileUpload {...p} tone="navy" accept=".jpg,.jpeg,.png,.pdf" files={idFile ? [idFile] : []} onChange={fs => setIdFile(fs[0] ?? null)} />
            )}
          </Field>
          <Field label={t('Note to the barangay')} optional>
            {p => <Textarea {...p} rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder={t('e.g. I uploaded a clearer photo.')} />}
          </Field>
        </>
      )}
    </Sheet>
  );
};
