import React, { useRef, useState } from 'react';
import { Download, Lock, Search } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { AuditLog } from '../../types';
import { Button, Card, DataTable, FilterChips, Input, PageHeader, StatusPill, dateTimeValue, formatShortDateTime, type Tone } from '../ui';

type Kind = AuditLog['category'];
type Cat = 'all' | Kind;

/* The stored categories are technical; staff see these plain words instead. */
const KINDS: Kind[] = ['Documents', 'Records', 'Queue', 'Configuration', 'Security'];
const KIND_LABEL: Record<Kind, string> = {
  Documents: 'Documents',
  Records: 'Records and cases',
  Queue: 'Walk-in line',
  Configuration: 'Settings',
  Security: 'Sign-in and access',
};
const TONE: Record<Kind, Tone> = { Documents: 'success', Records: 'info', Queue: 'neutral', Configuration: 'warning', Security: 'danger' };
const pill = (l: AuditLog) => <StatusPill tone={TONE[l.category]}>{KIND_LABEL[l.category]}</StatusPill>;

/** "Approved Document Request" → "Approved document request". Leaves short all-caps words (AI, ID) alone. */
const sentence = (s: string) => s.replace(/(?!^)\b([A-Z])([a-z]+)\b/g, (_, a: string, b: string) => a.toLowerCase() + b);

const smooth = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion') ? 'auto' : 'smooth';

/** Admin · Audit logs: who did what, and when. Entries can't be edited or removed (Data Privacy Act). No mockup. */
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
    const rows = [
      ['When', 'Who', 'Role', 'Type', 'What happened', 'Details'],
      ...shown.map(l => [formatShortDateTime(l.timestamp), l.userName, l.userRole, KIND_LABEL[l.category], sentence(l.action), l.details]),
    ];
    const url = URL.createObjectURL(new Blob([rows.map(r => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1280px]">
      <PageHeader
        title="Audit logs"
        description="Who did what, and when. Every change and every opened resident record is listed here."
        action={
          <Button variant="secondary" size="sm" icon={<Download className="w-5 h-5" aria-hidden="true" />} onClick={exportCsv} disabled={shown.length === 0}>
            Download list
          </Button>
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-4 items-start">
        <Card className="min-w-0">
          {/* Filters sit on top of the list they filter: search, then type. */}
          <div className="relative">
            <Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search the log"
              className="pl-11"
              placeholder="Search by name, action or reference"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSelectedId(null);
              }}
            />
          </div>
          <FilterChips<Cat>
            className="mt-3 mb-4"
            label="Type"
            value={cat}
            onChange={c => {
              setCat(c);
              setSelectedId(null);
            }}
            chips={[
              { id: 'all', label: 'All', count: auditLogs.length },
              ...KINDS.map(c => ({ id: c as Cat, label: KIND_LABEL[c], count: auditLogs.filter(l => l.category === c).length })),
            ]}
          />
          <DataTable<AuditLog>
            rows={shown}
            rowKey={l => l.id}
            onRowClick={l => {
              setSelectedId(l.id);
              if (window.matchMedia('(max-width: 1023px)').matches)
                requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: smooth(), block: 'start' }));
            }}
            isSelected={l => l.id === selected?.id}
            rowLabel={l => `Open entry: ${sentence(l.action)} by ${l.userName}`}
            pageSize={25}
            dense
            itemLabel="entries"
            defaultSort={{ header: 'When', direction: 'desc' }}
            columns={[
              { header: 'When', cell: l => formatShortDateTime(l.timestamp), className: 'whitespace-nowrap text-muted', sortValue: l => dateTimeValue(l.timestamp), sortLabels: ['oldest first', 'newest first'] },
              {
                header: 'Who',
                sortValue: l => l.userName,
                cell: l => (
                  <>
                    <span className="block">{l.userName}</span>
                    <span className="block text-caption text-muted">{l.userRole}</span>
                  </>
                ),
              },
              { header: 'What happened', cell: l => <span className="font-semibold">{sentence(l.action)}</span>, sortValue: l => l.action },
              { header: 'Type', cell: pill, sortValue: l => KIND_LABEL[l.category] },
            ]}
            mobile={{ title: l => sentence(l.action), status: pill, meta: l => `${l.userName} · ${formatShortDateTime(l.timestamp)}` }}
            empty={
              <div className="py-6 text-center">
                <p className="font-semibold">No entries match.</p>
                <p className="text-meta text-muted mt-1">Try another type or clear the search.</p>
              </div>
            }
          />
        </Card>

        <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-[96px] grid gap-4">
          {selected && (
            <Card aria-live="polite">
              {pill(selected)}
              <h2 className="text-h3 font-semibold text-navy-ink mt-2">{sentence(selected.action)}</h2>
              <p className="text-meta text-muted mt-0.5">
                {selected.userName} · {formatShortDateTime(selected.timestamp)}
              </p>
              <p className="text-ink mt-3 [overflow-wrap:anywhere]">{selected.details}</p>
              <dl className="mt-3 @container border-t border-line-soft">
                {[
                  ['Done by', selected.userName],
                  ['Their role', selected.userRole],
                  ['When', formatShortDateTime(selected.timestamp)],
                ].map(([k, v]) => (
                  <div key={k} className="grid @[18rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 py-2 border-b border-line-soft last:border-b-0">
                    <dt className="text-meta text-muted">{k}</dt>
                    <dd className="text-meta font-semibold [overflow-wrap:anywhere]">{v}</dd>
                  </div>
                ))}
              </dl>
              {selected.ipAddress && (
                <details className="mt-3 text-meta">
                  <summary className="min-h-11 flex items-center cursor-pointer font-semibold text-navy-ink">Technical details</summary>
                  <p className="text-muted [overflow-wrap:anywhere]">Computer used: {selected.ipAddress}</p>
                </details>
              )}
            </Card>
          )}
          <p className="flex items-start gap-2 text-meta text-muted">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            Can't be edited or deleted, as the Data Privacy Act requires.
          </p>
        </div>
      </div>
    </div>
  );
};
