import React from 'react';
import { Download } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { BarChart, Button, Card, PageHeader, StatCard, documentStatus, incidentStatus } from '../ui';

interface Series {
  title: string;
  unit: string;
  rows: { label: string; value: number }[];
}

const countBy = <T,>(items: T[], key: (t: T) => string, order?: string[]) => {
  const m = new Map<string, number>();
  order?.forEach(o => m.set(o, 0));
  items.forEach(i => m.set(key(i), (m.get(key(i)) ?? 0) + 1));
  return Array.from(m, ([label, value]) => ({ label, value }));
};

const shortDoc = (t: string) => t.replace(/\s*\(RA 11261\)/, '');

const downloadCsv = (name: string, series: Series[]) => {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines: string[] = [];
  series.forEach(s => {
    lines.push(esc(s.title), [esc('Item'), esc(s.unit)].join(','));
    s.rows.forEach(r => lines.push([esc(r.label), esc(r.value)].join(',')));
    lines.push('');
  });
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/** Admin · Reports. Plain summaries for planning, each downloadable as CSV. Counts only; no predictions. */
export const AdminReports: React.FC = () => {
  const { residents, documentRequests, incidents, printRequests, courtReservations } = useBarangay();
  const active = residents.filter(r => r.status === 'active');
  const age = (b: string) => new Date().getFullYear() - Number(b.slice(0, 4));

  const series: Series[] = [
    { title: 'Document requests by type', unit: 'requests', rows: countBy(documentRequests, d => shortDoc(d.documentTitle)) },
    {
      title: 'Document requests by stage',
      unit: 'requests',
      rows: countBy(documentRequests, d => documentStatus[d.status].label, ['Pending', 'Under review', 'Approved', 'Ready for pickup', 'Completed']),
    },
    { title: 'Complaints by concern', unit: 'reports', rows: countBy(incidents, i => i.category.split(' /')[0].replace(' & Garbage', '')) },
    { title: 'Complaints by stage', unit: 'reports', rows: countBy(incidents, i => incidentStatus[i.status].label) },
    { title: 'Active residents by purok', unit: 'residents', rows: countBy(active, r => r.purok.split(' - ')[0]).sort((a, b) => a.label.localeCompare(b.label)) },
    {
      title: 'Active residents by age group',
      unit: 'residents',
      rows: countBy(
        active,
        r => {
          const a = age(r.birthDate);
          return a < 18 ? 'Under 18' : a < 30 ? '18 to 29' : a < 45 ? '30 to 44' : a < 60 ? '45 to 59' : '60 and up';
        },
        ['Under 18', '18 to 29', '30 to 44', '45 to 59', '60 and up'],
      ),
    },
  ];

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Reports"
        description="Counts from current records, for planning. Download any report as a spreadsheet (CSV)."
        action={
          <Button variant="secondary" size="sm" icon={<Download className="w-5 h-5" aria-hidden="true" />} onClick={() => downloadCsv('e-kapitan-reports', series)}>
            Download all
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard label="Active residents" value={active.length.toLocaleString()} />
        <StatCard label="Senior citizens" value={active.filter(r => r.isSenior || age(r.birthDate) >= 60).length.toLocaleString()} />
        <StatCard label="Document requests" value={documentRequests.length} />
        <StatCard label="Print jobs and court bookings" value={printRequests.length + courtReservations.length} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-5 [&>*]:min-w-0">
        {series.map(s => (
          <Card key={s.title} className="min-w-0">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-h3 font-semibold text-navy-ink">{s.title}</h2>
              <button
                type="button"
                onClick={() => downloadCsv(s.title.toLowerCase().replace(/\s+/g, '-'), [s])}
                className="shrink-0 inline-flex items-center gap-1.5 min-h-11 px-2 text-meta font-semibold text-primary-strong hover:underline underline-offset-4 cursor-pointer"
                aria-label={`Download ${s.title} as CSV`}
              >
                <Download className="w-4 h-4" aria-hidden="true" /> CSV
              </button>
            </div>
            {s.rows.length === 0 ? (
              <p className="text-meta text-muted">No records yet.</p>
            ) : (
              <BarChart orientation="horizontal" data={s.rows} unit={s.unit} summary={`${s.title}: ${s.rows.map(r => `${r.label} ${r.value}`).join(', ')}.`} />
            )}
          </Card>
        ))}
      </div>

      <p className="text-meta text-muted mt-5">
        These are counts, not predictions. Forecasts (PRODUCT.md) are planning aids and will be added once there is enough real history in the database.
      </p>
    </div>
  );
};
