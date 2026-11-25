import React, { useRef, useState } from 'react';
import { Download, Lock, Search } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { AuditLog } from '../../types';
import { Button, Card, DataTable, Field, FilterChips, Input, PageHeader, StatusPill, dateTimeValue, formatShortDateTime, type Tone } from '../ui';

type Cat = 'all' | AuditLog['category'];
const CATS: AuditLog['category'][] = ['Records', 'Documents', 'Queue', 'Security', 'Configuration'];
const TONE: Record<AuditLog['category'], Tone> = { Records: 'info', Documents: 'success', Queue: 'neutral', Security: 'danger', Configuration: 'warning' };
const pill = (l: AuditLog) => <StatusPill tone={TONE[l.category]}>{l.category}</StatusPill>;

/** Admin · Audit Logs. Read-only: entries can't be edited or removed (RA 10173). No mockup. */
export const AdminAuditLogs: React.FC = () => {
  const { auditLogs } = useBarangay();
  const [cat, setCat] = useState<Cat>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = auditLogs.filter(
    l => (cat === 'all' || l.category === cat) && words.every(w => `${l.userName} ${l.userRole} ${l.action} ${l.details}`.toLowerCase().includes(w)),
  );
  const selected = shown.find(l => l.id === selectedId) ?? shown[0];

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [['Time', 'By', 'Role', 'Category', 'Action', 'Details'], ...shown.map(l => [formatShortDateTime(l.timestamp), l.userName, l.userRole, l.category, l.action, l.details])];
    const url = URL.createObjectURL(new Blob([rows.map(r => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Audit Logs"
        description={`${auditLogs.length.toLocaleString()} entries. Every change and every opened resident record is recorded here.`}
        action={
          <Button variant="secondary" size="sm" icon={<Download className="w-5 h-5" aria-hidden="true" />} onClick={exportCsv}>
            Export shown
          </Button>
        }
      />
      <p className="mb-4 flex items-center gap-2 text-meta text-muted">
        <Lock className="w-4 h-4 shrink-0" aria-hidden="true" /> Read-only. Entries can't be edited or deleted, as required by the Data Privacy Act.
      </p>
      <Card className="mb-5">
        <div className="-mt-4">
          <Field label="Search">
            {p => (
              <div className="relative">
                <Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <Input {...p} type="search" className="pl-11" placeholder="Name, action, reference or resident number" value={query} onChange={e => { setQuery(e.target.value); setSelectedId(null); }} />
              </div>
            )}
          </Field>
        </div>
        <FilterChips<Cat>
          className="mt-3"
          label="Category"
          value={cat}
          onChange={c => { setCat(c); setSelectedId(null); }}
          chips={[
            { id: 'all', label: 'All', count: auditLogs.length },
            ...CATS.map(c => ({ id: c as Cat, label: c, count: auditLogs.filter(l => l.category === c).length })),
          ]}
        />
      </Card>
      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-5 items-start">
        <Card>
          <DataTable<AuditLog>
            rows={shown}
            rowKey={l => l.id}
            onRowClick={l => {
              setSelectedId(l.id);
              if (window.matchMedia('(max-width: 1023px)').matches) requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            }}
            isSelected={l => l.id === selected?.id}
            rowLabel={l => `Open entry: ${l.action} by ${l.userName}`}
            pageSize={25}
            dense
            itemLabel="entries"
            defaultSort={{ header: 'Time', direction: 'desc' }}
            columns={[
              { header: 'Time', cell: l => formatShortDateTime(l.timestamp), className: 'whitespace-nowrap text-muted', sortValue: l => dateTimeValue(l.timestamp), sortLabels: ['oldest first', 'newest first'] },
              { header: 'By', cell: l => l.userName, sortValue: l => l.userName },
              { header: 'Action', cell: l => <span className="font-semibold">{l.action}</span>, sortValue: l => l.action },
              { header: 'Category', cell: pill, sortValue: l => l.category },
            ]}
            mobile={{ title: l => l.action, status: pill, meta: l => `${l.userName} · ${formatShortDateTime(l.timestamp)}` }}
            empty={<p className="text-meta text-muted py-4">No entries match.</p>}
          />
        </Card>
        <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-[96px]">
          {selected && (
            <Card aria-live="polite">
              {pill(selected)}
              <h2 className="text-h3 font-semibold text-navy mt-2">{selected.action}</h2>
              <dl className="mt-3 @container">
                {[
                  ['Time', formatShortDateTime(selected.timestamp)],
                  ['By', selected.userName],
                  ['Role', selected.userRole],
                  ['Details', selected.details],
                  ...(selected.ipAddress ? [['Device address', selected.ipAddress]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="grid @[18rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 py-2 border-b border-line-soft last:border-b-0">
                    <dt className="text-meta text-muted">{k}</dt>
                    <dd className="text-meta font-semibold [overflow-wrap:anywhere]">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
