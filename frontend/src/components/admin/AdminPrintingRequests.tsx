import React, { useRef, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { PrintRequest, PrintStatus } from '../../types';
import {
  Button,
  Card,
  DataTable,
  Field,
  FilterChips,
  Input,
  PageHeader,
  StatusPill,
  Textarea,
  dateTimeValue,
  formatShortDateTime,
  printStatus,
} from '../ui';

type Filter = 'active' | 'all' | PrintStatus;

const COLOR_LABEL = { black_and_white: 'Black and white', color: 'Color' } as const;
const SIDES_LABEL = { one_sided: 'One side', two_sided: 'Both sides' } as const;
const PRINT_ORDER: PrintStatus[] = ['pending', 'processing', 'ready_for_pickup', 'completed', 'rejected'];
const isActive = (s: PrintStatus) => s === 'pending' || s === 'processing' || s === 'ready_for_pickup';
const sheets = (p: PrintRequest) => p.pages * p.copies;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Smooth scroll, unless the person asked for less motion. */
const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

const pill = (p: PrintRequest) => <StatusPill tone={printStatus[p.status].tone}>{printStatus[p.status].label}</StatusPill>;

/** Admin · Printing Requests. No dedicated mockup; follows the Admin list + detail pattern. Printing is free. */
export const AdminPrintingRequests: React.FC = () => {
  const { printRequests, updatePrintRequestStatus } = useBarangay();

  const [filter, setFilter] = useState<Filter>('active');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();
  const detailRef = useRef<HTMLDivElement>(null);

  const count = (f: Filter) =>
    printRequests.filter(p => (f === 'all' ? true : f === 'active' ? isActive(p.status) : p.status === f)).length;

  const q = query.trim().toLowerCase();
  const shown = printRequests
    .filter(
      p =>
        (filter === 'all' || (filter === 'active' ? isActive(p.status) : p.status === filter)) &&
        (!q || p.referenceNumber.toLowerCase().includes(q) || p.residentName.toLowerCase().includes(q) || p.fileName.toLowerCase().includes(q)),
    )
    // Oldest waiting job first: that's the order to print in.
    .sort((a, b) => dateTimeValue(a.submittedAt) - dateTimeValue(b.submittedAt));
  const selected = shown.find(p => p.id === selectedId) ?? shown[0];

  const toPrint = printRequests.filter(p => p.status === 'pending' || p.status === 'processing');
  const toPrintSheets = toPrint.reduce((n, p) => n + sheets(p), 0);

  const select = (p: PrintRequest) => {
    setSelectedId(p.id);
    setRejecting(false);
    setReason('');
    setReasonError(undefined);
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }));
    }
  };

  const reject = (p: PrintRequest) => {
    if (reason.trim().length < 5) {
      setReasonError('Tell the resident why it was rejected.');
      return;
    }
    updatePrintRequestStatus(p.id, 'rejected', reason.trim());
    setRejecting(false);
    setReason('');
  };

  const renderDetail = (p: PrintRequest) => (
    <Card aria-live="polite">
      {/* Who first, then the status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-h3 font-semibold text-navy-ink">{p.residentName}</h2>
          <p className="text-meta text-muted">
            {p.referenceNumber} · sent {formatShortDateTime(p.submittedAt)}
          </p>
        </div>
        {pill(p)}
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-control border border-line px-3 py-2.5">
        <span aria-hidden="true" className="w-10 h-10 rounded-lg grid place-items-center bg-info-bg text-info-fg shrink-0">
          <FileText className="w-5 h-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold truncate" title={p.fileName}>
            {p.fileName}
          </span>
          <span className="block text-caption text-muted">Opening the file here is coming soon.</span>
        </span>
      </div>

      {/* The print settings, big and clear, so staff can set up the printer at a glance */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          [String(p.pages), p.pages === 1 ? 'page' : 'pages'],
          [String(p.copies), p.copies === 1 ? 'copy' : 'copies'],
          [String(sheets(p)), sheets(p) === 1 ? 'sheet in all' : 'sheets in all'],
        ].map(([n, l]) => (
          <div key={l} className="rounded-control bg-surface-muted py-2.5">
            <div className="font-display text-h2 font-bold text-navy-ink leading-none">{n}</div>
            <div className="text-caption text-muted mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Printer settings as a compact 2 x 2 grid instead of a long list */}
      <dl className="mt-2 grid grid-cols-2 gap-2">
        {[
          ['Paper', p.paperSize],
          ['Color', COLOR_LABEL[p.color]],
          ['Print on', SIDES_LABEL[p.sides]],
          ['Cost', 'Free'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-control border border-line-soft px-3 py-2">
            <dt className="text-caption text-muted">{k}</dt>
            <dd className="text-meta font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      {p.status === 'rejected' && p.rejectionReason && (
        <p className="mt-3 text-meta rounded-control bg-danger-bg text-danger-fg px-3 py-2">
          <b className="font-semibold">Reason: </b>
          {p.rejectionReason}
        </p>
      )}

      {rejecting ? (
        <div className="mt-4">
          <Field label="Why can't it be printed?" error={reasonError} help='For example: "The file would not open. Please send it again as a PDF."'>
            {f => <Textarea {...f} autoFocus value={reason} onChange={e => setReason(e.target.value)} />}
          </Field>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <Button variant="secondary" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => reject(p)}>
              Reject
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-2.5">
          {p.status === 'pending' && (
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2.5">
              <Button onClick={() => updatePrintRequestStatus(p.id, 'processing')}>Start printing</Button>
              <Button variant="danger" onClick={() => setRejecting(true)}>
                Reject
              </Button>
            </div>
          )}
          {p.status === 'processing' && (
            <Button fullWidth onClick={() => updatePrintRequestStatus(p.id, 'ready_for_pickup')}>
              Mark ready for pickup
            </Button>
          )}
          {p.status === 'ready_for_pickup' && (
            <Button fullWidth onClick={() => updatePrintRequestStatus(p.id, 'completed')}>
              Mark as picked up
            </Button>
          )}
          {p.status === 'completed' && <p className="text-meta text-muted">Already picked up. Nothing left to do.</p>}
        </div>
      )}
    </Card>
  );

  return (
    <div className="max-w-[1280px]">
      <PageHeader
        title="Printing"
        description={
          toPrint.length > 0
            ? `${plural(toPrint.length, 'file', 'files')} to print, ${plural(toPrintSheets, 'sheet', 'sheets')} in all. Printing is free for residents.`
            : 'Nothing to print right now. Printing is free for residents.'
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-4 items-start">
        {/* List card: search and status chips on top, then the table. */}
        <Card>
          <div className="[&_label]:mt-0">
            <Field label="Search">
              {f => (
                <div className="relative">
                  <Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <Input
                    {...f}
                    type="search"
                    className="pl-11"
                    placeholder="Name, file name or reference"
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value);
                      setSelectedId(null);
                    }}
                  />
                </div>
              )}
            </Field>
          </div>
          <FilterChips<Filter>
            className="mt-3"
            label="Status"
            value={filter}
            onChange={f => {
              setFilter(f);
              setSelectedId(null);
            }}
            chips={[
              { id: 'active', label: 'To do', count: count('active') },
              { id: 'pending', label: 'Pending', count: count('pending') },
              { id: 'processing', label: 'Processing', count: count('processing') },
              { id: 'ready_for_pickup', label: 'Ready for pickup', count: count('ready_for_pickup') },
              { id: 'completed', label: 'Picked up', count: count('completed') },
              { id: 'rejected', label: 'Rejected', count: count('rejected') },
              { id: 'all', label: 'All', count: count('all') },
            ]}
          />

          <div className="mt-4">
            <DataTable<PrintRequest>
              rows={shown}
              rowKey={p => p.id}
              onRowClick={select}
              isSelected={p => p.id === selected?.id}
              rowLabel={p => `Open ${p.referenceNumber}, ${p.residentName}`}
              columns={[
                {
                  header: 'Resident',
                  sortValue: p => p.residentName,
                  cell: p => (
                    <>
                      <span className="block font-semibold text-ink">{p.residentName}</span>
                      <span className="block text-caption text-muted truncate max-w-[240px]" title={p.fileName}>
                        {p.fileName}
                      </span>
                    </>
                  ),
                },
                {
                  header: 'To print',
                  sortValue: p => sheets(p),
                  sortLabels: ['fewest first', 'most first'],
                  cell: p => `${plural(sheets(p), 'sheet', 'sheets')}, ${p.paperSize}${p.color === 'color' ? ', color' : ''}`,
                  className: 'whitespace-nowrap',
                },
                {
                  header: 'Sent',
                  cell: p => formatShortDateTime(p.submittedAt),
                  className: 'whitespace-nowrap text-muted',
                  sortValue: p => dateTimeValue(p.submittedAt),
                  sortLabels: ['oldest first', 'newest first'],
                },
                { header: 'Status', cell: pill, sortValue: p => PRINT_ORDER.indexOf(p.status), sortLabels: ['by step', 'by step, reversed'] },
              ]}
              mobile={{
                title: p => p.residentName,
                status: pill,
                meta: p => `${plural(sheets(p), 'sheet', 'sheets')}, ${p.paperSize} · ${p.referenceNumber}`,
              }}
              empty={
                <div className="py-6 text-center">
                  <p className="font-semibold">Nothing here.</p>
                  <p className="text-meta text-muted mt-1">Try another status or clear the search.</p>
                </div>
              }
            />
          </div>
        </Card>

        {/* Detail panel: sticks beside the list on desktop, scrolls on its own if it is taller than the screen. */}
        <div ref={detailRef} className="scroll-mt-24 lg:sticky lg:top-[96px] lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto lg:rounded-card">
          {selected ? (
            renderDetail(selected)
          ) : (
            <Card>
              <h2 className="text-h3 font-semibold text-navy-ink">Print details</h2>
              <p className="text-meta text-muted mt-1">Choose a request from the list to see what to print.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
