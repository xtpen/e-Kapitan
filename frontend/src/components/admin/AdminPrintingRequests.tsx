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
const SIDES_LABEL = { one_sided: 'One-sided', two_sided: 'Two-sided' } as const;
const PRINT_ORDER: PrintStatus[] = ['pending', 'processing', 'ready_for_pickup', 'completed', 'rejected'];
const isActive = (s: PrintStatus) => s === 'pending' || s === 'processing' || s === 'ready_for_pickup';
const sheets = (p: PrintRequest) => p.pages * p.copies;

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

  const queue = printRequests.filter(p => p.status === 'pending' || p.status === 'processing');
  const queueSheets = queue.reduce((n, p) => n + sheets(p), 0);

  const select = (p: PrintRequest) => {
    setSelectedId(p.id);
    setRejecting(false);
    setReason('');
    setReasonError(undefined);
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const reject = (p: PrintRequest) => {
    if (reason.trim().length < 5) {
      setReasonError('Tell the resident why it was not accepted.');
      return;
    }
    updatePrintRequestStatus(p.id, 'rejected', reason.trim());
    setRejecting(false);
    setReason('');
  };

  const renderDetail = (p: PrintRequest) => (
    <Card aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-h3 font-semibold text-navy">{p.referenceNumber}</h2>
        {pill(p)}
      </div>
      <p className="text-meta text-muted">{p.residentName}</p>

      <div className="mt-4 flex items-center gap-3 rounded-control border border-line px-3 py-2.5">
        <span aria-hidden="true" className="w-10 h-10 rounded-lg grid place-items-center bg-info-bg text-info-fg shrink-0">
          <FileText className="w-5 h-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold truncate">{p.fileName}</span>
          <span className="block text-caption text-muted">The file can be opened here once uploads are saved to the database.</span>
        </span>
      </div>

      {/* The print settings, big and clear, so staff can set up the printer at a glance */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          [String(p.pages), p.pages === 1 ? 'page' : 'pages'],
          [String(p.copies), p.copies === 1 ? 'copy' : 'copies'],
          [String(sheets(p)), 'to print'],
        ].map(([n, l]) => (
          <div key={l} className="rounded-control bg-surface-muted py-2.5">
            <div className="font-display text-h2 font-bold text-navy leading-none">{n}</div>
            <div className="text-caption text-muted mt-1">{l}</div>
          </div>
        ))}
      </div>

      <dl className="mt-3">
        {[
          ['Paper', p.paperSize],
          ['Color', COLOR_LABEL[p.color]],
          ['Sides', SIDES_LABEL[p.sides]],
          ['Cost', 'Free'],
          ['Submitted', formatShortDateTime(p.submittedAt)],
        ].map(([k, v]) => (
          <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2 border-b border-line-soft last:border-b-0">
            <dt className="text-meta text-muted">{k}</dt>
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
          <Field label="Why can't it be printed?" error={reasonError} help='For example: "The file would not open. Please upload it again as PDF."'>
            {f => <Textarea {...f} autoFocus value={reason} onChange={e => setReason(e.target.value)} />}
          </Field>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <Button variant="secondary" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => reject(p)}>
              Don't accept
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-2.5">
          {p.status === 'pending' && (
            <>
              <Button fullWidth onClick={() => updatePrintRequestStatus(p.id, 'processing')}>
                Start printing
              </Button>
              <Button variant="danger" fullWidth onClick={() => setRejecting(true)}>
                Don't accept
              </Button>
            </>
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
        </div>
      )}
    </Card>
  );

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Printing Requests"
        description={
          queue.length > 0
            ? `${queue.length} ${queue.length === 1 ? 'job' : 'jobs'} in the queue, ${queueSheets} ${queueSheets === 1 ? 'sheet' : 'sheets'} to print. Printing is free for residents.`
            : 'The print queue is empty. Printing is free for residents.'
        }
      />

      <Card className="mb-5">
        <div className="-mt-4">
          <Field label="Search">
            {f => (
              <div className="relative">
                <Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <Input
                  {...f}
                  type="search"
                  className="pl-11"
                  placeholder="Reference, resident or file name"
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
            { id: 'active', label: 'In progress', count: count('active') },
            { id: 'pending', label: 'Pending', count: count('pending') },
            { id: 'processing', label: 'Processing', count: count('processing') },
            { id: 'ready_for_pickup', label: 'Ready for pickup', count: count('ready_for_pickup') },
            { id: 'completed', label: 'Picked up', count: count('completed') },
            { id: 'rejected', label: 'Not accepted', count: count('rejected') },
            { id: 'all', label: 'All', count: count('all') },
          ]}
        />
      </Card>

      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-5 items-start">
        <Card>
          <DataTable<PrintRequest>
            rows={shown}
            rowKey={p => p.id}
            onRowClick={select}
            isSelected={p => p.id === selected?.id}
            rowLabel={p => `Open ${p.referenceNumber}, ${p.residentName}`}
            columns={[
              { header: 'Reference', cell: p => p.referenceNumber, className: 'whitespace-nowrap', sortValue: p => p.referenceNumber },
              {
                header: 'Resident',
                sortValue: p => p.residentName,
                cell: p => (
                  <>
                    {p.residentName}
                    <span className="block text-muted truncate max-w-[220px]">{p.fileName}</span>
                  </>
                ),
              },
              {
                header: 'Job',
                sortValue: p => sheets(p),
                sortLabels: ['smallest first', 'largest first'],
                cell: p => `${sheets(p)} sheets, ${p.paperSize}${p.color === 'color' ? ', color' : ''}`,
                className: 'whitespace-nowrap',
              },
              {
                header: 'Submitted',
                cell: p => formatShortDateTime(p.submittedAt),
                className: 'whitespace-nowrap text-muted',
                sortValue: p => dateTimeValue(p.submittedAt),
                sortLabels: ['oldest first', 'newest first'],
              },
              { header: 'Status', cell: pill, sortValue: p => PRINT_ORDER.indexOf(p.status), sortLabels: ['by stage', 'by stage, reversed'] },
            ]}
            mobile={{
              title: p => p.residentName,
              status: pill,
              meta: p => `${sheets(p)} sheets, ${p.paperSize} · ${p.referenceNumber}`,
            }}
            empty={
              <div className="py-6 text-center">
                <p className="font-semibold">No print requests here.</p>
                <p className="text-meta text-muted mt-1">Try another filter or clear the search.</p>
              </div>
            }
          />
        </Card>
        <div ref={detailRef} className="scroll-mt-24">
          {selected ? (
            renderDetail(selected)
          ) : (
            <Card>
              <h2 className="text-h3 font-semibold text-navy">Job details</h2>
              <p className="text-meta text-muted mt-1">Choose a print request to see its settings.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
