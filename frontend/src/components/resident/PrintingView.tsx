import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { PaperSize, PrintColor, PrintRequest, PrintSides } from '../../types';
import {
  Button,
  Card,
  CardHeader,
  DataTable,
  Field,
  FileUpload,
  Input,
  PageHeader,
  Select,
  StatusPill,
  formatShortDateTime,
  printStatus,
} from '../ui';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const FILE_EXT = /\.(pdf|doc|docx)$/i;

const COLOR_LABEL: Record<PrintColor, string> = { black_and_white: 'Black and white', color: 'Color' };
const SIDES_LABEL: Record<PrintSides, string> = { one_sided: 'One-sided', two_sided: 'Two-sided' };
const PAPER_SIZES: PaperSize[] = ['A4', 'Letter', 'Legal'];

/** Best-effort page count for PDFs (counts page objects). Returns null if it can't tell. */
const countPdfPages = async (file: File): Promise<number | null> => {
  if (!/\.pdf$/i.test(file.name)) return null;
  try {
    const text = await file.text();
    const n = (text.match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
    return n > 0 ? n : null;
  } catch {
    return null;
  }
};

const describe = (p: Pick<PrintRequest, 'pages' | 'paperSize' | 'color' | 'copies'>) =>
  `${p.pages} ${p.pages === 1 ? 'page' : 'pages'}, ${p.paperSize}, ${COLOR_LABEL[p.color].toLowerCase()}` +
  (p.copies > 1 ? `, ${p.copies} copies` : '');

type Errors = Partial<Record<'file' | 'pages' | 'copies', string>>;

/** Resident · Printing. Mockup: "Resident · Printing". See DESIGN.md. */
export const PrintingView: React.FC = () => {
  const { printRequests, createPrintRequest, currentUser } = useBarangay();

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState('');
  const [autoCounted, setAutoCounted] = useState<number | null>(null);
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [color, setColor] = useState<PrintColor>('black_and_white');
  const [sides, setSides] = useState<PrintSides>('one_sided');
  const [copies, setCopies] = useState('1');
  const [errors, setErrors] = useState<Errors>({});
  const [justSent, setJustSent] = useState<PrintRequest | null>(null);

  const mine = printRequests.filter(
    p => (!!currentUser.residentId && p.residentId === currentUser.residentId) || p.residentName === currentUser.name,
  );

  const pageCount = Math.max(0, Math.floor(Number(pages)) || 0);
  const copyCount = Math.max(0, Math.floor(Number(copies)) || 0);

  const onFile = async (f: File | null) => {
    setFile(f);
    setAutoCounted(null);
    if (!f) return;
    const n = await countPdfPages(f);
    if (n) {
      setPages(String(n));
      setAutoCounted(n);
    }
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!file) e.file = 'Choose the file you want printed.';
    else if (!FILE_EXT.test(file.name)) e.file = 'Upload a PDF or Word file.';
    else if (file.size > MAX_FILE_BYTES) e.file = 'Upload a file that is 10 MB or smaller.';
    if (!pageCount || pageCount > 500) e.pages = 'Enter the number of pages, from 1 to 500.';
    if (!copyCount || copyCount > 50) e.copies = 'Enter how many copies, from 1 to 50.';
    return e;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0 || !file) return;
    const created = createPrintRequest({
      residentId: currentUser.residentId ?? '',
      residentName: currentUser.name,
      fileName: file.name,
      pages: pageCount,
      copies: copyCount,
      paperSize,
      color,
      sides,
    });
    setJustSent(created);
    setFile(null);
    setPages('');
    setAutoCounted(null);
    setCopies('1');
  };

  const pill = (p: PrintRequest) => <StatusPill tone={printStatus[p.status].tone}>{printStatus[p.status].label}</StatusPill>;

  return (
    <div className="max-w-[1200px]">
      <PageHeader title="Printing Services" description="Upload your file and choose your options. Printing is free for residents." />

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
        <Card padded="lg">
          <h2 className="text-h3-lg font-semibold text-navy">New print request</h2>

          {justSent && (
            <div role="status" className="mt-4 flex gap-3 rounded-control bg-success-bg text-success-fg px-4 py-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" strokeWidth={1.8} aria-hidden="true" />
              <p>
                <b className="font-semibold">Print request submitted.</b> Your reference number is{' '}
                <b className="font-semibold whitespace-nowrap">{justSent.referenceNumber}</b>. We will notify you when it is
                ready to pick up.
              </p>
            </div>
          )}

          <form id="print-form" noValidate onSubmit={submit}>
            {Object.keys(errors).length > 0 && (
              <p role="alert" className="mt-4 rounded-control bg-danger-bg text-danger-fg font-semibold px-4 py-3">
                Please fix the fields marked below.
              </p>
            )}
            <Field label="Upload document" error={errors.file} help="PDF or Word, up to 10 MB.">
              {p => (
                <FileUpload
                  {...p}
                  accept=".pdf,.doc,.docx"
                  files={file ? [file] : []}
                  onChange={fs => onFile(fs[0] ?? null)}
                />
              )}
            </Field>
            <div className="grid grid-cols-2 gap-x-3 sm:gap-x-5">
              <Field
                label="Pages in the file"
                error={errors.pages}
                help={autoCounted ? `We counted ${autoCounted}. Change it if that's wrong.` : undefined}
              >
                {p => (
                  <Input {...p} type="number" inputMode="numeric" min={1} max={500} value={pages} onChange={e => setPages(e.target.value)} />
                )}
              </Field>
              <Field label="Copies" error={errors.copies}>
                {p => (
                  <Input {...p} type="number" inputMode="numeric" min={1} max={50} value={copies} onChange={e => setCopies(e.target.value)} />
                )}
              </Field>
              <Field label="Paper size">
                {p => (
                  <Select {...p} value={paperSize} onChange={e => setPaperSize(e.target.value as PaperSize)}>
                    {PAPER_SIZES.map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Color">
                {p => (
                  <Select {...p} value={color} onChange={e => setColor(e.target.value as PrintColor)}>
                    {(Object.keys(COLOR_LABEL) as PrintColor[]).map(c => (
                      <option key={c} value={c}>
                        {COLOR_LABEL[c]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Sides" className="col-span-2 sm:col-span-1">
                {p => (
                  <Select {...p} value={sides} onChange={e => setSides(e.target.value as PrintSides)}>
                    {(Object.keys(SIDES_LABEL) as PrintSides[]).map(s => (
                      <option key={s} value={s}>
                        {SIDES_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </form>
        </Card>

        <Card tone="navy" aria-live="polite">
          <span className="text-on-navy">Your request</span>
          <div className="font-display text-h2 leading-tight font-bold text-white mt-2">
            {pageCount > 0 && copyCount > 0
              ? `${pageCount * copyCount} ${pageCount * copyCount === 1 ? 'page' : 'pages'} to print`
              : 'Add your file'}
          </div>
          <p className="text-meta text-on-navy mt-2 mb-4">
            {pageCount > 0 && copyCount > 0
              ? `${pageCount} ${pageCount === 1 ? 'page' : 'pages'} × ${copyCount} ${copyCount === 1 ? 'copy' : 'copies'}, ${paperSize}, ${COLOR_LABEL[color].toLowerCase()}, ${SIDES_LABEL[sides].toLowerCase()}. `
              : 'Upload your document and enter the number of pages. '}
            Printing is free. Pick it up at the barangay hall when we tell you it's ready.
          </p>
          <Button variant="accent" fullWidth type="submit" form="print-form">
            Submit print request
          </Button>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="My print requests" />
        <DataTable<PrintRequest>
          rows={mine}
          rowKey={p => p.id}
          columns={[
            { header: 'Reference', cell: p => p.referenceNumber, className: 'whitespace-nowrap' },
            { header: 'Details', cell: p => describe(p) },
            { header: 'Submitted', cell: p => formatShortDateTime(p.submittedAt), className: 'whitespace-nowrap text-muted' },
            { header: 'Status', cell: pill },
          ]}
          mobile={{ title: p => describe(p), status: pill, meta: p => p.referenceNumber }}
          empty={<p className="text-meta text-muted py-2">You have no print requests yet.</p>}
        />
      </Card>
    </div>
  );
};
