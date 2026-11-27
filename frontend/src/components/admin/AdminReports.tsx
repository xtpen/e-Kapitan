import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { BarChart, Button, Card, CardHeader, Field, Input, PageHeader, Select, Switch } from '../ui';
import { Choice } from '../resident/kit';
import { BARANGAY } from '../../config/barangay';
import {
  PERIODS,
  REPORT_KINDS,
  buildReport,
  downloadText,
  reportToCsv,
  reportToPrintHtml,
  type PeriodKind,
  type ReportKind,
  type ReportTable,
} from './reportBuilder';

/*
 * Admin · Reports.
 *   Make a report: pick what, the period, and whether to list every record; the preview updates
 *   as you choose; download it as a spreadsheet or print it (or save it as PDF). Each export is
 *   written to the audit log. The residents report is counts only (Data Privacy Act).
 *   Quick summaries: the same numbers as small charts, for a glance.
 */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const TableBlock: React.FC<{ t: ReportTable; limit?: number }> = ({ t, limit }) => {
  const rows = limit ? t.rows.slice(0, limit) : t.rows;
  return (
    <div className="min-w-0">
      <h3 className="text-meta font-semibold text-ink mb-1.5">{t.title}</h3>
      {t.rows.length === 0 ? (
        <p className="text-meta text-muted">Nothing in this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-meta">
            <thead>
              <tr className="border-b border-line">
                {t.columns.map((c, i) => (
                  <th key={i} className={`py-1.5 pr-3 font-semibold text-muted text-caption ${i > 0 && typeof t.rows[0]?.[i] === 'number' ? 'text-right' : 'text-left'}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-line-soft last:border-0">
                  {r.map((c, ci) => (
                    <td key={ci} className={`py-1.5 pr-3 ${typeof c === 'number' ? 'text-right tabular-nums font-semibold' : 'text-ink'} ${ci === 0 ? 'whitespace-nowrap' : ''}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {limit && t.rows.length > limit && <p className="mt-1.5 text-caption text-muted">And {t.rows.length - limit} more in the download.</p>}
        </div>
      )}
    </div>
  );
};

export const AdminReports: React.FC = () => {
  const { residents, documentRequests, incidents, printRequests, courtReservations, courtSlots, logAudit, addToast, currentUser } = useBarangay();
  const [kind, setKind] = useState<ReportKind>('summary');
  const [period, setPeriod] = useState<PeriodKind>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [includeRecords, setIncludeRecords] = useState(false);

  const canList = kind !== 'summary' && kind !== 'residents';
  const report = useMemo(
    () =>
      buildReport(kind, period, { documentRequests, incidents, printRequests, courtReservations, courtSlots, residents }, { from, to, includeRecords: canList && includeRecords }),
    [kind, period, from, to, includeRecords, canList, documentRequests, incidents, printRequests, courtReservations, courtSlots, residents],
  );

  const fileBase = `${slug(report.title)}-${slug(report.periodLabel)}-${new Date().toISOString().slice(0, 10)}`;
  const logExport = (how: string) =>
    logAudit('Exported a report', 'Records', `${report.title} (${report.periodLabel}) as ${how}${report.records ? ', with every record' : ''}. By ${currentUser.name}`);

  const downloadCsv = () => {
    downloadText(`${fileBase}.csv`, reportToCsv(report, BARANGAY));
    logExport('a spreadsheet');
    addToast('Report downloaded', 'Open it in Excel, Google Sheets or any spreadsheet app.', 'success');
  };
  const print = () => {
    const w = window.open('', '_blank');
    if (!w) {
      addToast('Allow pop-ups to print', 'Your browser blocked the print window.', 'warning');
      return;
    }
    w.document.write(reportToPrintHtml(report, BARANGAY));
    w.document.close();
    logExport('a printout or PDF');
  };

  /* Quick summaries (all time). */
  const quick = useMemo(() => {
    const summary = buildReport('summary', 'all', { documentRequests, incidents, printRequests, courtReservations, courtSlots, residents }, { includeRecords: false });
    const docs = buildReport('documents', 'all', { documentRequests, incidents, printRequests, courtReservations, courtSlots, residents }, { includeRecords: false });
    const reps = buildReport('reports', 'all', { documentRequests, incidents, printRequests, courtReservations, courtSlots, residents }, { includeRecords: false });
    const people = buildReport('residents', 'all', { documentRequests, incidents, printRequests, courtReservations, courtSlots, residents }, { includeRecords: false });
    const toBars = (t: ReportTable) => t.rows.map(r => ({ label: String(r[0]), value: Number(r[1]) }));
    return [
      { title: 'Most requested documents', unit: 'requests', rows: toBars(docs.breakdowns[0]).slice(0, 6) },
      { title: 'Problems reported', unit: 'reports', rows: toBars(reps.breakdowns[0]).slice(0, 6) },
      { title: 'Requests by purok', unit: 'requests', rows: toBars(summary.breakdowns[2]) },
      { title: 'Residents by age group', unit: 'residents', rows: toBars(people.breakdowns[1]) },
    ];
  }, [documentRequests, incidents, printRequests, courtReservations, courtSlots, residents]);

  return (
    <div className="max-w-[1280px]">
      <PageHeader title="Reports" description="Make a report for any period, then download it or print it." />

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-4 items-start">
        {/* Settings */}
        <Card className="lg:sticky lg:top-[88px]">
          <CardHeader title="Make a report" />
          <p id="rep-kind" className="text-meta font-semibold text-muted mb-2">
            What
          </p>
          <div role="radiogroup" aria-labelledby="rep-kind" className="grid gap-1.5">
            {REPORT_KINDS.map(k => (
              <Choice key={k.id} selected={kind === k.id} onSelect={() => setKind(k.id)} group="rep-kind" label={k.label} sub={k.hint} />
            ))}
          </div>

          {kind !== 'residents' && (
            <>
              <Field label="Period" className="[&>label]:mt-4">
                {p => (
                  <Select {...p} value={period} onChange={e => setPeriod(e.target.value as PeriodKind)}>
                    {PERIODS.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {period === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="From">{p => <Input {...p} type="date" value={from} onChange={e => setFrom(e.target.value)} />}</Field>
                  <Field label="To">{p => <Input {...p} type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} />}</Field>
                </div>
              )}
            </>
          )}

          <div className="mt-3 -mb-2">
            <Switch
              label="List every record"
              description={canList ? 'Adds a row for each request, with tracking numbers.' : 'Not available for this report.'}
              checked={canList && includeRecords}
              disabled={!canList}
              onChange={setIncludeRecords}
            />
          </div>
        </Card>

        {/* Preview */}
        <Card className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-line">
            <div className="min-w-0">
              <p className="text-caption font-semibold uppercase tracking-[0.06em] text-muted">Preview</p>
              <h2 className="text-[1.25rem] font-bold text-navy-ink leading-tight mt-0.5">{report.title}</h2>
              <p className="text-meta text-muted mt-0.5">
                {report.periodLabel} · Made {report.generatedAt}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={print} icon={<Printer className="w-4 h-4" aria-hidden="true" />}>
                Print or save as PDF
              </Button>
              <Button size="sm" onClick={downloadCsv} icon={<FileSpreadsheet className="w-4 h-4" aria-hidden="true" />}>
                Download spreadsheet
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            {report.totals.map(([k, v]) => (
              <div key={k} className="rounded-control bg-surface-muted px-3 py-2.5">
                <div className="font-display text-[1.375rem] leading-none font-bold text-navy-ink tabular-nums">{v}</div>
                <div className="text-caption text-muted mt-1 leading-tight">{k}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-x-6 gap-y-5 mt-5">
            {report.breakdowns.map(t => (
              <TableBlock key={t.title} t={t} limit={8} />
            ))}
          </div>

          {report.records && (
            <div className="mt-5 pt-4 border-t border-line">
              <TableBlock t={report.records} limit={10} />
            </div>
          )}
          {kind === 'residents' && (
            <p className="mt-4 text-caption text-muted">Counts only. Names and addresses are never included, as the Data Privacy Act requires.</p>
          )}
        </Card>
      </div>

      {/* Quick summaries */}
      <h2 className="mt-6 mb-3 text-[1.0625rem] font-semibold text-navy-ink">Quick summaries</h2>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {quick.map(s => (
          <Card key={s.title} className="min-w-0">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-meta font-semibold text-ink">{s.title}</h3>
              <button
                type="button"
                onClick={() => {
                  downloadText(`${slug(s.title)}-${new Date().toISOString().slice(0, 10)}.csv`, [`"${s.title}"`, '"Item","Count"', ...s.rows.map(r => `"${r.label}",${r.value}`)].join('\r\n'));
                  logAudit('Exported a report', 'Records', `${s.title} as a spreadsheet. By ${currentUser.name}`);
                }}
                aria-label={`Download ${s.title} as a spreadsheet`}
                className="shrink-0 -mr-1 -mt-1 w-8 h-8 grid place-items-center rounded-control text-muted hover:text-navy-ink hover:bg-surface-muted cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
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
    </div>
  );
};
