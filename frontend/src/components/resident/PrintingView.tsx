import React, { useId, useState } from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { PaperSize, PrintColor, PrintRequest, PrintSides } from '../../types';
import { Button, Field, FileUpload, Input, StatusPill, dateTimeValue, formatShortDateTime, printStatus } from '../ui';
import { Choice, FormActions, IconCircle, List, ListRow, Page, PageTitle, Section } from './kit';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const FILE_EXT = /\.(pdf|doc|docx)$/i;

const COLOR_LABEL: Record<PrintColor, string> = { black_and_white: 'Black and white', color: 'Color' };
const SIDES_LABEL: Record<PrintSides, string> = { one_sided: 'One side', two_sided: 'Both sides' };
const PAPER_SIZES: PaperSize[] = ['A4', 'Letter', 'Legal'];
/** Everyday names residents use at the store. */
const PAPER_HINT: Record<PaperSize, string> = { A4: 'Most common', Letter: 'Short bond', Legal: 'Long bond' };

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

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const describe = (p: Pick<PrintRequest, 'pages' | 'paperSize' | 'color' | 'copies' | 'sides'>) =>
  `${plural(p.pages, 'page', 'pages')} · ${p.paperSize} · ${COLOR_LABEL[p.color].toLowerCase()}` +
  (p.copies > 1 ? ` · ${p.copies} copies` : '');

type Errors = Partial<Record<'file' | 'pages' | 'copies', string>>;

/** A labelled group of <Choice> options. The label matches the Field label style. */
function Options<T extends string>({
  label,
  value,
  options,
  onChange,
  cols,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; sub?: string }[];
  onChange: (v: T) => void;
  cols: string;
}) {
  const id = useId();
  return (
    <div>
      <p id={id} className="block font-semibold text-meta text-ink mt-4 mb-1.5">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className={`grid gap-2 ${cols}`}>
        {options.map(o => (
          <Choice key={o.value} selected={o.value === value} onSelect={() => onChange(o.value)} label={o.label} sub={o.sub} />
        ))}
      </div>
    </div>
  );
}

/**
 * Resident · Printing (tab id `printing`). Your file, print options, send. Then the resident's prints.
 */
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

  const mine = printRequests
    .filter(p => (!!currentUser.residentId && p.residentId === currentUser.residentId) || p.residentName === currentUser.name)
    .sort((a, b) => dateTimeValue(b.submittedAt) - dateTimeValue(a.submittedAt));

  const pageCount = Math.max(0, Math.floor(Number(pages)) || 0);
  const copyCount = Math.max(0, Math.floor(Number(copies)) || 0);
  const ready = pageCount > 0 && copyCount > 0;
  const totalPages = pageCount * copyCount;
  const hasErrors = Object.keys(errors).length > 0;

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

  const submit = () => {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Page>
      <PageTitle title="Printing" sub="Free. Pick up at the hall." />

      {justSent && (
        <Section tone="success">
          <div role="status" className="flex items-center gap-3">
            <IconCircle tone="green">
              <CheckCircle2 />
            </IconCircle>
            <p className="min-w-0">
              <b className="block font-semibold text-ink">Sent! We'll let you know when it's ready.</b>
              <span className="block text-meta text-muted">Tracking number {justSent.referenceNumber}</span>
            </p>
          </div>
        </Section>
      )}

      <Section title="Your file">
        <Field label="File" error={errors.file} help="PDF or Word, up to 10 MB." className="[&>label]:sr-only">
          {p => <FileUpload {...p} accept=".pdf,.doc,.docx" files={file ? [file] : []} onChange={fs => onFile(fs[0] ?? null)} />}
        </Field>
        <div className="grid grid-cols-2 gap-x-3 sm:gap-x-5">
          <Field label="Pages" error={errors.pages} help={autoCounted ? `We counted ${autoCounted}.` : undefined}>
            {p => <Input {...p} type="number" inputMode="numeric" min={1} max={500} value={pages} onChange={e => setPages(e.target.value)} />}
          </Field>
          <Field label="Copies" error={errors.copies}>
            {p => <Input {...p} type="number" inputMode="numeric" min={1} max={50} value={copies} onChange={e => setCopies(e.target.value)} />}
          </Field>
        </div>
      </Section>

      <Section title="Print options">
        <Options<PaperSize>
          label="Paper size"
          value={paperSize}
          onChange={setPaperSize}
          cols="grid-cols-1 sm:grid-cols-3"
          options={PAPER_SIZES.map(s => ({ value: s, label: s, sub: PAPER_HINT[s] }))}
        />
        <Options<PrintColor>
          label="Color"
          value={color}
          onChange={setColor}
          cols="grid-cols-2"
          options={(Object.keys(COLOR_LABEL) as PrintColor[]).map(c => ({ value: c, label: COLOR_LABEL[c] }))}
        />
        <Options<PrintSides>
          label="Print on"
          value={sides}
          onChange={setSides}
          cols="grid-cols-2"
          options={(Object.keys(SIDES_LABEL) as PrintSides[]).map(s => ({ value: s, label: SIDES_LABEL[s] }))}
        />

        <div className="mt-5 pt-4 border-t border-line-soft">
          {hasErrors ? (
            <p role="alert" className="font-semibold text-danger-fg">
              Please fix the fields marked above.
            </p>
          ) : (
            <p aria-live="polite" className="text-muted">
              {ready ? (
                <>
                  <b className="font-semibold text-ink">{plural(totalPages, 'page', 'pages')}, free.</b> Pick up weekdays, 1:00 PM to 4:00 PM.
                </>
              ) : (
                'Add your file and the number of pages.'
              )}
            </p>
          )}
          <FormActions>
            <Button variant="brand" onClick={submit} icon={<Printer className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />}>
              Send to print
            </Button>
          </FormActions>
        </div>
      </Section>

      {mine.length > 0 && (
        <Section title="My prints" flush>
          <List>
            {mine.map(p => (
              <ListRow
                key={p.id}
                icon={
                  <IconCircle>
                    <Printer />
                  </IconCircle>
                }
                title={<span className="block truncate">{p.fileName}</span>}
                sub={
                  <>
                    {describe(p)} · {formatShortDateTime(p.submittedAt)}
                    {p.status === 'rejected' && p.rejectionReason && <span className="block text-danger-fg">{p.rejectionReason}</span>}
                  </>
                }
                trailing={<StatusPill tone={printStatus[p.status].tone}>{printStatus[p.status].label}</StatusPill>}
              />
            ))}
          </List>
        </Section>
      )}
    </Page>
  );
};
