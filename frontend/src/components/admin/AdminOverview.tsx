import React, { useMemo } from 'react';
import { CircleDot, Clock, Download, FileBarChart, FileText, Hourglass, MapPin, MoveRight, Printer, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import {
  BarChart,
  Button,
  LineChart,
  Card,
  CardHeader,
  DataTable,
  PageHeader,
  StatusPill,
  TextLink,
  dateTimeValue,
  formatShortDateTime,
  type Tone,
} from '../ui';
import { BARANGAY } from '../../config/barangay';
import { buildOverview } from './overviewInsights';


interface AttentionItem {
  id: string;
  reference: string;
  what: string;
  status: { label: string; tone: Tone };
  tab: string;
  sortKey: number;
}

const toTime = dateTimeValue;

/**
 * Admin · Overview: the numbers, what stands out (worked out from the records), the weekly trend,
 * where requests come from, what's waiting, and recent activity. Phones put what's waiting first.
 */
export const AdminOverview: React.FC = () => {
  const { documentRequests, incidents, printRequests, courtReservations, auditLogs, setActiveTab } = useBarangay();

  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayLabel = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const openReports = incidents.filter(i => i.status !== 'resolved' && i.status !== 'dismissed');

  /* Things waiting on staff, oldest first. */
  const attention = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [
      ...documentRequests
        .filter(d => d.status === 'submitted')
        .map(d => ({
          id: d.id,
          reference: d.referenceNumber,
          what: d.documentTitle,
          status: { label: 'New', tone: 'warning' as Tone },
          tab: 'admin_documents',
          sortKey: toTime(d.submittedAt),
        })),
      ...incidents
        .filter(i => i.status === 'received' && !i.assignedTo)
        .map(i => ({
          id: i.id,
          reference: i.referenceNumber,
          what: 'Problem report',
          status: { label: 'No one assigned', tone: 'info' as Tone },
          tab: 'admin_complaints',
          sortKey: toTime(i.submittedAt),
        })),
      ...printRequests
        .filter(p => p.status === 'pending')
        .map(p => ({
          id: p.id,
          reference: p.referenceNumber,
          what: 'Print job',
          status: { label: 'To print', tone: 'warning' as Tone },
          tab: 'admin_printing',
          sortKey: toTime(p.submittedAt),
        })),
      ...courtReservations
        .filter(c => c.status === 'pending')
        .map(c => ({
          id: c.id,
          reference: c.referenceNumber,
          what: 'Court booking',
          status: { label: 'To approve', tone: 'warning' as Tone },
          tab: 'admin_court',
          sortKey: toTime(c.submittedAt),
        })),
    ];
    return items.sort((a, b) => a.sortKey - b.sortKey);
  }, [documentRequests, incidents, printRequests, courtReservations]);

  const chartData = [
    { label: 'Documents', value: documentRequests.length, onSelect: () => setActiveTab('admin_documents') },
    { label: 'Printing', value: printRequests.length, onSelect: () => setActiveTab('admin_printing') },
    { label: 'Court', value: courtReservations.length, onSelect: () => setActiveTab('admin_court') },
    { label: 'Reports', value: incidents.length, onSelect: () => setActiveTab('admin_complaints') },
  ];

  const recent = auditLogs.slice(0, 5);

  const exportReport = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [
      [`eKapitan overview, Barangay ${BARANGAY}`, dayLabel],
      [],
      ['Service', 'Total'],
      ...chartData.map(d => [d.label, d.value]),
      ['Open reports', openReports.length],
      [],
      ['Needs attention', 'Type', 'Status'],
      ...attention.map(a => [a.reference, a.what, a.status.label]),
    ];
    const csv = lines.map(row => row.map(esc).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ekapitan-overview-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const attentionPill = (a: AttentionItem) => <StatusPill tone={a.status.tone}>{a.status.label}</StatusPill>;

  const data = useMemo(
    () => buildOverview(documentRequests, incidents, printRequests, courtReservations),
    [documentRequests, incidents, printRequests, courtReservations],
  );

  const stats = [
    { label: 'Document requests', value: documentRequests.length, waiting: documentRequests.filter(d => d.status === 'submitted').length, icon: <FileText />, tone: 'bg-navy-tint text-navy-ink', tab: 'admin_documents' },
    { label: 'Problem reports', value: incidents.length, waiting: incidents.filter(i => i.status === 'received').length, icon: <TriangleAlert />, tone: 'bg-warning-bg text-warning-fg', tab: 'admin_complaints' },
    { label: 'Print jobs', value: printRequests.length, waiting: printRequests.filter(p => p.status === 'pending').length, icon: <Printer />, tone: 'bg-info-bg text-info-fg', tab: 'admin_printing' },
    { label: 'Court bookings', value: courtReservations.length, waiting: courtReservations.filter(c => c.status === 'pending').length, icon: <CircleDot />, tone: 'bg-success-bg text-success-fg', tab: 'admin_court' },
  ];

  const statTiles = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {stats.map(s => (
        <button
          key={s.label}
          type="button"
          onClick={() => setActiveTab(s.tab)}
          className="flex items-center gap-3 rounded-card border border-line bg-surface p-3.5 sm:p-4 text-left cursor-pointer
            transition-[border-color,box-shadow] duration-150 hover:border-navy-ink/25 hover:shadow-float"
        >
          <span aria-hidden="true" className={`w-11 h-11 shrink-0 rounded-tile grid place-items-center [&_svg]:w-5 [&_svg]:h-5 [&_svg]:stroke-[1.8] ${s.tone}`}>
            {s.icon}
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[1.625rem] leading-none font-bold text-navy-ink tabular-nums">{s.value}</span>
            <span className="block text-meta text-ink mt-1 truncate">{s.label}</span>
            <span className="block text-caption text-muted">{s.waiting ? `${s.waiting} waiting` : 'Nothing waiting'}</span>
          </span>
        </button>
      ))}
    </div>
  );

  const INSIGHT_ICON = {
    trend: (tone?: string) => (tone === 'down' ? <TrendingDown /> : tone === 'flat' ? <MoveRight /> : <TrendingUp />),
    place: () => <MapPin />,
    document: () => <FileText />,
    speed: () => <Clock />,
    waiting: () => <Hourglass />,
  } as const;

  const insightsCard = data.insights.length > 0 && (
    <Card>
      <CardHeader title="What stands out" action={<span className="text-caption text-muted">From your records</span>} />
      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {data.insights.map(ins => (
          <li key={ins.kind} className="flex gap-3">
            <span aria-hidden="true" className="w-8 h-8 shrink-0 rounded-full bg-navy-tint text-navy-ink grid place-items-center [&_svg]:w-4 [&_svg]:h-4">
              {INSIGHT_ICON[ins.kind](ins.tone)}
            </span>
            <p className="text-meta text-ink leading-snug pt-1">{ins.text}</p>
          </li>
        ))}
      </ul>
    </Card>
  );

  const trendCard = (
    <Card className="min-w-0">
      <CardHeader title="New requests per week" action={<span className="text-caption text-muted">All services, last 8 weeks</span>} />
      <LineChart
        data={data.weeks}
        unit="requests"
        pointLabel={p => `Week of ${p.label}`}
        summary={`New requests per week: ${data.weeks.map(w => `week of ${w.label} ${w.value}`).join(', ')}.`}
      />
    </Card>
  );

  const barCard = (title: string, rows: { label: string; value: number }[], unit: string, empty: string) => (
    <Card className="min-w-0">
      <CardHeader title={title} />
      {rows.length === 0 ? (
        <p className="text-meta text-muted py-2">{empty}</p>
      ) : (
        <BarChart orientation="horizontal" data={rows.slice(0, 6)} unit={unit} summary={`${title}: ${rows.map(r => `${r.label} ${r.value}`).join(', ')}.`} />
      )}
    </Card>
  );

  const attentionCard = (limit: number) => (
    <Card data-tour="admin-attention" className="min-w-0">
      <CardHeader
        title="Needs attention"
        action={attention.length > 0 && <StatusPill tone="warning">{attention.length} waiting</StatusPill>}
      />
      <DataTable<AttentionItem>
        rows={attention.slice(0, limit)}
        rowKey={a => a.id}
        onRowClick={a => setActiveTab(a.tab)}
        rowLabel={a => `Open ${a.reference}, ${a.what}`}
        columns={[
          {
            header: 'What',
            cell: a => (
              <>
                <span className="font-semibold">{a.what}</span>
                <span className="block text-muted whitespace-nowrap">{a.reference}</span>
              </>
            ),
          },
          { header: 'Status', cell: attentionPill },
        ]}
        mobile={{ title: a => a.what, status: attentionPill, meta: a => a.reference }}
        empty={<p className="text-meta text-muted py-2">Nothing is waiting. Everything has been picked up.</p>}
      />
      {attention.length > limit && (
        <p className="mt-2 text-caption text-muted">
          Showing the {limit} oldest of {attention.length}.
        </p>
      )}
    </Card>
  );

  const recentCard = (
    <Card className="min-w-0">
      <CardHeader title="Recent activity" action={<TextLink onClick={() => setActiveTab('admin_audit')}>See all</TextLink>} />
      <DataTable
        rows={recent}
        rowKey={l => l.id}
        columns={[
          { header: 'When', cell: l => formatShortDateTime(l.timestamp), className: 'whitespace-nowrap text-muted' },
          { header: 'Who', cell: l => l.userName, className: 'whitespace-nowrap' },
          { header: 'What happened', cell: l => l.details },
        ]}
        mobile={{ title: l => l.action, meta: l => `${l.userName} · ${formatShortDateTime(l.timestamp)}` }}
        empty={<p className="text-meta text-muted py-2">No activity recorded yet.</p>}
      />
    </Card>
  );

  return (
    <div className="max-w-[1280px]">
      <PageHeader
        title={<><span className="md:hidden">Today at the barangay</span><span className="hidden md:inline">Overview</span></>}
        description={<><span className="md:hidden">{dayLabel}</span><span className="hidden md:inline">How the barangay is doing, {monthLabel}.</span></>}
        action={
          <div className="hidden md:flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportReport} icon={<Download className="w-4 h-4" aria-hidden="true" />}>
              Export summary
            </Button>
            <Button size="sm" onClick={() => setActiveTab('admin_reports')} icon={<FileBarChart className="w-4 h-4" aria-hidden="true" />}>
              Make a report
            </Button>
          </div>
        }
      />

      <div className="grid gap-4">
        {statTiles}

        {/* One copy of every card. On phones, what's waiting moves up right after the numbers. */}
        <div className="grid gap-4 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 grid gap-4 min-w-0">
            {insightsCard}
            {trendCard}
            <div className="grid sm:grid-cols-2 gap-4">
              {barCard('Requests by purok', data.byPurok, 'requests', 'No purok data yet.')}
              {barCard('Most requested documents', data.topDocuments, 'requests', 'No document requests yet.')}
            </div>
          </div>
          <div className="order-first lg:order-none grid gap-4 min-w-0">
            {attentionCard(7)}
            {barCard('Where document requests stand', data.stages, 'requests', 'No document requests yet.')}
          </div>
          <div className="lg:col-span-3 min-w-0">{recentCard}</div>
        </div>
      </div>
    </div>
  );
};
