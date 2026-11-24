import React, { useMemo } from 'react';
import { CircleDot, Download, FileText, Printer, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import {
  BarChart,
  Button,
  Card,
  CardHeader,
  DataTable,
  PageHeader,
  StatCard,
  StatusPill,
  TextLink,
  dateTimeValue,
  formatShortDateTime,
  type Tone,
} from '../ui';

const BARANGAY = 'Sto. Angel';

interface AttentionItem {
  id: string;
  reference: string;
  what: string;
  status: { label: string; tone: Tone };
  tab: string;
  sortKey: number;
}

const toTime = dateTimeValue;

/** Admin · Overview. Mockups: "Admin · Overview" (desktop) and "Mobile Admin Overview". See DESIGN.md. */
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
          status: { label: 'Pending', tone: 'warning' as Tone },
          tab: 'admin_documents',
          sortKey: toTime(d.submittedAt),
        })),
      ...incidents
        .filter(i => i.status === 'received' && !i.assignedTo)
        .map(i => ({
          id: i.id,
          reference: i.referenceNumber,
          what: 'Complaint',
          status: { label: 'Unassigned', tone: 'info' as Tone },
          tab: 'admin_complaints',
          sortKey: toTime(i.submittedAt),
        })),
      ...printRequests
        .filter(p => p.status === 'pending')
        .map(p => ({
          id: p.id,
          reference: p.referenceNumber,
          what: 'Printing',
          status: { label: 'Pending', tone: 'warning' as Tone },
          tab: 'admin_printing',
          sortKey: toTime(p.submittedAt),
        })),
      ...courtReservations
        .filter(c => c.status === 'pending')
        .map(c => ({
          id: c.id,
          reference: c.referenceNumber,
          what: 'Court booking',
          status: { label: 'Pending', tone: 'warning' as Tone },
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
      [`e-Kapitan overview, Barangay ${BARANGAY}`, dayLabel],
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
    a.download = `e-kapitan-overview-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const attentionPill = (a: AttentionItem) => <StatusPill tone={a.status.tone}>{a.status.label}</StatusPill>;

  const attentionCard = (limit: number) => (
    <Card>
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
            header: 'Reference',
            cell: a => (
              <>
                <span className="font-semibold whitespace-nowrap">{a.reference}</span>
                <span className="block text-muted">{a.what}</span>
              </>
            ),
          },
          { header: 'Status', cell: attentionPill },
        ]}
        mobile={{ title: a => a.reference, status: attentionPill, meta: a => a.what }}
        empty={<p className="text-meta text-muted py-2">Nothing is waiting. Everything has been picked up.</p>}
      />
    </Card>
  );

  return (
    <div className="max-w-[1200px]">
      {/* ---------- Mobile ---------- */}
      <div className="md:hidden">
        <h1 className="text-2xl font-bold text-navy">Today at the barangay</h1>
        <p className="text-meta text-muted mt-1 mb-3.5">{dayLabel}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            ['New requests', documentRequests.filter(d => d.status === 'submitted').length],
            ['Open reports', openReports.length],
            ['Print jobs', printRequests.filter(p => p.status === 'pending' || p.status === 'processing').length],
            ['Court requests', courtReservations.filter(c => c.status === 'pending').length],
          ].map(([label, value]) => (
            <Card key={label as string}>
              <span className="text-meta text-muted">{label}</span>
              <div className="font-display text-[1.875rem] leading-none font-bold text-navy mt-1.5">{value}</div>
            </Card>
          ))}
        </div>
        <div className="mt-5">{attentionCard(5)}</div>
      </div>

      {/* ---------- Tablet / desktop ---------- */}
      <div className="hidden md:block">
        <PageHeader
          title="Overview"
          description={`Barangay ${BARANGAY}, ${monthLabel}`}
          action={
            <Button variant="secondary" size="sm" onClick={exportReport} icon={<Download className="w-5 h-5" aria-hidden="true" />}>
              Export report
            </Button>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Document requests" value={documentRequests.length} icon={<FileText strokeWidth={1.8} />} />
          <StatCard label="Open reports" value={openReports.length} icon={<TriangleAlert strokeWidth={1.8} />} iconTone="warning" />
          <StatCard label="Printing jobs" value={printRequests.length} icon={<Printer strokeWidth={1.8} />} iconTone="info" />
          <StatCard label="Court bookings" value={courtReservations.length} icon={<CircleDot strokeWidth={1.8} />} />
        </div>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5 mt-5 items-start">
          <Card>
            <h2 className="text-h3 font-semibold text-navy mb-4">Transactions by service</h2>
            <BarChart
              data={chartData}
              unit="transactions"
              summary={`Transactions by service: ${chartData.map(d => `${d.label} ${d.value}`).join(', ')}.`}
            />
          </Card>
          {attentionCard(6)}
        </div>

        <Card className="mt-5">
          <CardHeader title="Recent activity" action={<TextLink onClick={() => setActiveTab('admin_audit')}>Audit logs</TextLink>} />
          <DataTable
            rows={recent}
            rowKey={l => l.id}
            columns={[
              { header: 'Time', cell: l => formatShortDateTime(l.timestamp), className: 'whitespace-nowrap text-muted' },
              { header: 'By', cell: l => l.userName, className: 'whitespace-nowrap' },
              { header: 'Activity', cell: l => l.details },
            ]}
            mobile={{ title: l => l.action, meta: l => `${l.userName} · ${formatShortDateTime(l.timestamp)}` }}
            empty={<p className="text-meta text-muted py-2">No activity recorded yet.</p>}
          />
        </Card>
      </div>
    </div>
  );
};
