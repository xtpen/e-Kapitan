import type { CourtReservation, CourtSlot, DocumentRequest, IncidentReport, PrintRequest, Resident } from '../../types';
import { dateTimeValue, formatPeso, formatShortDateTime } from '../ui/format';

/*
 * Builds a report from the records: a title, the period, totals, breakdowns, and (optionally) the
 * list of records. The same report is shown as a preview, downloaded as a spreadsheet (CSV), or
 * opened as a printable page (print, or save as PDF).
 *
 * Privacy (Data Privacy Act): the residents report is counts only, never names or addresses.
 */

export type ReportKind = 'summary' | 'documents' | 'reports' | 'printing' | 'court' | 'residents';
export type PeriodKind = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'custom';

export const REPORT_KINDS: { id: ReportKind; label: string; hint: string }[] = [
  { id: 'summary', label: 'Summary of everything', hint: 'Totals for every service' },
  { id: 'documents', label: 'Document requests', hint: 'By document, stage and purok' },
  { id: 'reports', label: 'Problem reports', hint: 'By concern, stage and purok' },
  { id: 'printing', label: 'Print jobs', hint: 'Jobs and pages printed' },
  { id: 'court', label: 'Court bookings', hint: 'Bookings by activity and stage' },
  { id: 'residents', label: 'Residents', hint: 'Counts only, no names' },
];

export const PERIODS: { id: PeriodKind; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'last_3_months', label: 'Last 3 months' },
  { id: 'this_year', label: 'This year' },
  { id: 'custom', label: 'Pick dates' },
];

export interface ReportTable {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface Report {
  title: string;
  periodLabel: string;
  generatedAt: string;
  totals: [string, string | number][];
  breakdowns: ReportTable[];
  records?: ReportTable;
}

export interface ReportSources {
  documentRequests: DocumentRequest[];
  incidents: IncidentReport[];
  printRequests: PrintRequest[];
  courtReservations: CourtReservation[];
  courtSlots: CourtSlot[];
  residents: Resident[];
}

const fmtDate = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

/** [from, to) in ms for a period; null bounds mean open. */
export const periodRange = (period: PeriodKind, from?: string, to?: string, now = new Date()): { start: number | null; end: number | null; label: string } => {
  const y = now.getFullYear();
  const m = now.getMonth();
  const monthName = (yy: number, mm: number) => new Date(yy, mm, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  switch (period) {
    case 'this_month':
      return { start: new Date(y, m, 1).getTime(), end: new Date(y, m + 1, 1).getTime(), label: monthName(y, m) };
    case 'last_month':
      return { start: new Date(y, m - 1, 1).getTime(), end: new Date(y, m, 1).getTime(), label: monthName(y, m - 1) };
    case 'last_3_months':
      return { start: new Date(y, m - 2, 1).getTime(), end: new Date(y, m + 1, 1).getTime(), label: `${monthName(y, m - 2)} to ${monthName(y, m)}` };
    case 'this_year':
      return { start: new Date(y, 0, 1).getTime(), end: new Date(y + 1, 0, 1).getTime(), label: `${y}` };
    case 'custom': {
      const s = from ? new Date(`${from}T00:00:00`).getTime() : null;
      const e = to ? new Date(`${to}T00:00:00`).getTime() + 24 * 60 * 60 * 1000 : null;
      const label = s && e ? `${fmtDate(s)} to ${fmtDate(e - 1)}` : s ? `From ${fmtDate(s)}` : e ? `Until ${fmtDate(e - 1)}` : 'All time';
      return { start: s, end: e, label };
    }
    default:
      return { start: null, end: null, label: 'All time' };
  }
};

const countBy = <T,>(items: T[], key: (t: T) => string, order?: string[]) => {
  const m = new Map<string, number>();
  order?.forEach(o => m.set(o, 0));
  items.forEach(i => m.set(key(i), (m.get(key(i)) ?? 0) + 1));
  return [...m].filter(([, v]) => v > 0 || !order).sort((a, b) => (order ? 0 : b[1] - a[1]));
};
const purok = (p: string) => p.split(' - ')[0] || p;
const pct = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)}%` : '0%');
const table = (title: string, entries: [string, number][], unit: string): ReportTable => {
  const total = entries.reduce((n, [, v]) => n + v, 0);
  return { title, columns: ['', unit, 'Share'], rows: entries.map(([k, v]) => [k, v, pct(v, total)]) };
};

const DOC_STAGE: Record<string, string> = {
  submitted: 'New',
  under_review: 'Being checked',
  returned: 'Sent back to fix',
  approved: 'Approved',
  ready_for_release: 'Ready to pick up',
  completed: 'Picked up',
  rejected: 'Not approved',
};
const REPORT_STAGE: Record<string, string> = {
  received: 'New',
  assigned: 'Someone assigned',
  in_progress: 'Being handled',
  hearing_scheduled: 'Hearing set',
  resolved: 'Resolved',
  dismissed: 'Closed',
};
const SIMPLE_STAGE: Record<string, string> = {
  pending: 'Waiting',
  processing: 'Printing',
  ready_for_pickup: 'Ready to pick up',
  approved: 'Approved',
  completed: 'Done',
  rejected: 'Not approved',
  declined: 'Not approved',
  cancelled: 'Cancelled',
};

export const buildReport = (
  kind: ReportKind,
  period: PeriodKind,
  src: ReportSources,
  opts: { from?: string; to?: string; includeRecords: boolean },
): Report => {
  const { start, end, label } = periodRange(period, opts.from, opts.to);
  const inRange = (v: string) => {
    const t = dateTimeValue(v);
    return (start === null || t >= start) && (end === null || t < end);
  };
  const docs = src.documentRequests.filter(d => inRange(d.submittedAt));
  const reps = src.incidents.filter(i => inRange(i.submittedAt));
  const prints = src.printRequests.filter(p => inRange(p.submittedAt));
  const courts = src.courtReservations.filter(c => inRange(c.submittedAt));
  const base = { periodLabel: label, generatedAt: formatShortDateTime(new Date().toISOString()) };
  const sortNew = <T extends { submittedAt: string }>(a: T, b: T) => dateTimeValue(b.submittedAt) - dateTimeValue(a.submittedAt);

  switch (kind) {
    case 'documents': {
      const fees = docs.filter(d => !d.isFreeDueToExemption).reduce((n, d) => n + (d.fee || 0), 0);
      return {
        ...base,
        title: 'Document requests',
        totals: [
          ['Requests', docs.length],
          ['Ready or picked up', docs.filter(d => d.status === 'ready_for_release' || d.status === 'completed').length],
          ['Still being worked on', docs.filter(d => ['submitted', 'under_review', 'approved', 'returned'].includes(d.status)).length],
          ['Fees to collect', formatPeso(fees)],
        ],
        breakdowns: [
          table('By document', countBy(docs, d => d.documentTitle), 'Requests'),
          table('By stage', countBy(docs, d => DOC_STAGE[d.status] ?? d.status, Object.values(DOC_STAGE)), 'Requests'),
          table('By purok', countBy(docs, d => purok(d.purok)), 'Requests'),
        ],
        records: opts.includeRecords
          ? {
              title: 'All requests',
              columns: ['Tracking no.', 'Document', 'Resident', 'Purok', 'Stage', 'Sent', 'Fee'],
              rows: [...docs].sort(sortNew).map(d => [d.referenceNumber, d.documentTitle, d.residentName, purok(d.purok), DOC_STAGE[d.status] ?? d.status, formatShortDateTime(d.submittedAt), d.isFreeDueToExemption ? 'Free' : formatPeso(d.fee)]),
            }
          : undefined,
      };
    }
    case 'reports':
      return {
        ...base,
        title: 'Problem reports',
        totals: [
          ['Reports', reps.length],
          ['Resolved', reps.filter(r => r.status === 'resolved').length],
          ['Still open', reps.filter(r => r.status !== 'resolved' && r.status !== 'dismissed').length],
          ['Sent without a name', reps.filter(r => r.isAnonymous).length],
        ],
        breakdowns: [
          table('By concern', countBy(reps, r => r.category), 'Reports'),
          table('By stage', countBy(reps, r => REPORT_STAGE[r.status] ?? r.status, Object.values(REPORT_STAGE)), 'Reports'),
          table('By purok', countBy(reps, r => purok(r.purok)), 'Reports'),
        ],
        records: opts.includeRecords
          ? {
              title: 'All reports',
              columns: ['Tracking no.', 'Concern', 'Reported by', 'Purok', 'Stage', 'Sent'],
              rows: [...reps].sort(sortNew).map(r => [r.referenceNumber, r.category, r.isAnonymous ? 'Name hidden' : r.reporterName, purok(r.purok), REPORT_STAGE[r.status] ?? r.status, formatShortDateTime(r.submittedAt)]),
            }
          : undefined,
      };
    case 'printing':
      return {
        ...base,
        title: 'Print jobs',
        totals: [
          ['Print jobs', prints.length],
          ['Pages printed', prints.filter(p => p.status === 'completed' || p.status === 'ready_for_pickup').reduce((n, p) => n + p.pages * p.copies, 0)],
          ['Waiting', prints.filter(p => p.status === 'pending').length],
        ],
        breakdowns: [table('By stage', countBy(prints, p => SIMPLE_STAGE[p.status] ?? p.status), 'Jobs')],
        records: opts.includeRecords
          ? {
              title: 'All print jobs',
              columns: ['Tracking no.', 'File', 'Resident', 'Pages', 'Stage', 'Sent'],
              rows: [...prints].sort(sortNew).map(p => [p.referenceNumber, p.fileName, p.residentName, `${p.pages} × ${p.copies}`, SIMPLE_STAGE[p.status] ?? p.status, formatShortDateTime(p.submittedAt)]),
            }
          : undefined,
      };
    case 'court':
      return {
        ...base,
        title: 'Court bookings',
        totals: [
          ['Bookings', courts.length],
          ['Approved or done', courts.filter(c => c.status === 'approved' || c.status === 'completed').length],
          ['Waiting for approval', courts.filter(c => c.status === 'pending').length],
        ],
        breakdowns: [
          table('By activity', countBy(courts, c => c.activity), 'Bookings'),
          table('By stage', countBy(courts, c => SIMPLE_STAGE[c.status] ?? c.status), 'Bookings'),
        ],
        records: opts.includeRecords
          ? {
              title: 'All bookings',
              columns: ['Tracking no.', 'Activity', 'Booked by', 'Day', 'Time', 'Stage'],
              rows: [...courts].sort(sortNew).map(c => [c.referenceNumber, c.activity, c.residentName, c.date, src.courtSlots.find(s => s.id === c.slotId)?.label ?? '', SIMPLE_STAGE[c.status] ?? c.status]),
            }
          : undefined,
      };
    case 'residents': {
      const active = src.residents.filter(r => r.status === 'active');
      const age = (b: string) => new Date().getFullYear() - Number(b.slice(0, 4));
      const groups = ['Under 18', '18 to 29', '30 to 44', '45 to 59', '60 and up'];
      return {
        ...base,
        title: 'Residents',
        periodLabel: 'As of today',
        totals: [
          ['Registered residents', active.length],
          ['Senior citizens', active.filter(r => r.isSenior || age(r.birthDate) >= 60).length],
          ['Persons with disability', active.filter(r => r.isPWD).length],
          ['Registered voters', active.filter(r => r.isVoter).length],
        ],
        breakdowns: [
          table('By purok', countBy(active, r => purok(r.purok)).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })), 'Residents'),
          table('By age group', countBy(active, r => { const a = age(r.birthDate); return a < 18 ? groups[0] : a < 30 ? groups[1] : a < 45 ? groups[2] : a < 60 ? groups[3] : groups[4]; }, groups), 'Residents'),
          table('By sex', countBy(active, r => r.gender), 'Residents'),
        ],
      };
    }
    default:
      return {
        ...base,
        title: 'Summary of everything',
        totals: [
          ['Document requests', docs.length],
          ['Problem reports', reps.length],
          ['Print jobs', prints.length],
          ['Court bookings', courts.length],
        ],
        breakdowns: [
          table('Documents by stage', countBy(docs, d => DOC_STAGE[d.status] ?? d.status, Object.values(DOC_STAGE)), 'Requests'),
          table('Reports by stage', countBy(reps, r => REPORT_STAGE[r.status] ?? r.status, Object.values(REPORT_STAGE)), 'Reports'),
          table('Requests by purok', countBy([...docs.map(d => d.purok), ...reps.map(r => r.purok)], p => purok(p)), 'Requests'),
        ],
      };
  }
};

/* ---------- export ---------- */

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export const reportToCsv = (r: Report, place: string) => {
  const lines: string[] = [esc(`${r.title}, Barangay ${place}`), esc(`Period: ${r.periodLabel}`), esc(`Made: ${r.generatedAt}`), ''];
  lines.push(esc('Totals'));
  r.totals.forEach(([k, v]) => lines.push([esc(k), esc(v)].join(',')));
  [...r.breakdowns, ...(r.records ? [r.records] : [])].forEach(t => {
    lines.push('', esc(t.title), t.columns.map(c => esc(c || 'Item')).join(','));
    t.rows.forEach(row => lines.push(row.map(esc).join(',')));
  });
  return lines.join('\r\n');
};

export const downloadText = (name: string, text: string, type = 'text/csv;charset=utf-8') => {
  const url = URL.createObjectURL(new Blob(['﻿', text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

const html = (s: string | number) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** A clean printable page for the report (print it, or choose "Save as PDF"). */
export const reportToPrintHtml = (r: Report, place: string) => {
  const tableHtml = (t: ReportTable) =>
    `<h2>${html(t.title)}</h2><table><thead><tr>${t.columns.map(c => `<th>${html(c)}</th>`).join('')}</tr></thead><tbody>${t.rows
      .map(row => `<tr>${row.map((c, i) => `<td${i > 0 && typeof c === 'number' ? ' class="n"' : ''}>${html(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${html(r.title)} · Barangay ${html(place)}</title><style>
  body{font:14px/1.45 Inter,system-ui,sans-serif;color:#1b2430;margin:32px;max-width:900px}
  header{border-bottom:2px solid #12304f;padding-bottom:12px;margin-bottom:16px}
  h1{font-size:22px;margin:0;color:#12304f} .meta{color:#5b6673;font-size:13px;margin-top:4px}
  .totals{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}
  .t{border:1px solid #d9dee5;border-radius:8px;padding:10px} .t b{display:block;font-size:20px;color:#12304f}
  h2{font-size:15px;margin:20px 0 6px;color:#12304f} table{width:100%;border-collapse:collapse}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e5e9ee;font-size:13px} th{color:#5b6673;font-weight:600}
  td.n{text-align:right;font-variant-numeric:tabular-nums} footer{margin-top:24px;color:#5b6673;font-size:12px}
  @media print{body{margin:12mm}}
  </style></head><body><header><h1>${html(r.title)}</h1><div class="meta">Barangay ${html(place)} · ${html(r.periodLabel)} · Made ${html(r.generatedAt)}</div></header>
  <section class="totals">${r.totals.map(([k, v]) => `<div class="t"><b>${html(v)}</b>${html(k)}</div>`).join('')}</section>
  ${r.breakdowns.map(tableHtml).join('')}${r.records ? tableHtml(r.records) : ''}
  <footer>Made with eKapitan. Counts come from the barangay's records at the time the report was made.</footer>
  <script>window.addEventListener('load',()=>setTimeout(()=>window.print(),150))</script></body></html>`;
};
