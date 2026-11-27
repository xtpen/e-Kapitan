import type { CourtReservation, DocumentRequest, IncidentReport, PrintRequest } from '../../types';
import { dateTimeValue } from '../ui/format';

/*
 * Numbers behind the Overview charts and the "What stands out" sentences, all worked out from the
 * records themselves (nothing typed by hand). Weeks are counted back from the newest record, so
 * sample data from another month still shows a meaningful trend.
 */

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

export interface WeekPoint {
  /** Monday of the week. */
  start: number;
  label: string;
  value: number;
}

export interface CountRow {
  label: string;
  value: number;
}

export interface Insight {
  kind: 'trend' | 'place' | 'document' | 'speed' | 'waiting';
  text: string;
  /** Up is good/bad/neutral for the little arrow. */
  tone?: 'up' | 'down' | 'flat';
}

const mondayOf = (t: number) => {
  const d = new Date(t);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  return d.getTime() - day * DAY;
};

const shortDay = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** "Purok 2 - Riverside" → "Purok 2". */
const purokName = (p: string) => p.split(' - ')[0].trim() || p;

export interface OverviewData {
  weeks: WeekPoint[];
  byPurok: CountRow[];
  topDocuments: CountRow[];
  stages: CountRow[];
  insights: Insight[];
}

export const buildOverview = (
  docs: DocumentRequest[],
  reports: IncidentReport[],
  prints: PrintRequest[],
  courts: CourtReservation[],
  weeksBack = 8,
): OverviewData => {
  const all = [
    ...docs.map(d => ({ t: dateTimeValue(d.submittedAt), purok: d.purok })),
    ...reports.map(r => ({ t: dateTimeValue(r.submittedAt), purok: r.purok })),
    ...prints.map(p => ({ t: dateTimeValue(p.submittedAt), purok: '' })),
    ...courts.map(c => ({ t: dateTimeValue(c.submittedAt), purok: '' })),
  ].filter(x => x.t > 0);

  // Weekly trend, ending at the newest record's week.
  const newest = all.length ? Math.max(...all.map(x => x.t)) : Date.now();
  const lastMonday = mondayOf(newest);
  const weeks: WeekPoint[] = Array.from({ length: weeksBack }, (_, i) => {
    const start = lastMonday - (weeksBack - 1 - i) * WEEK;
    return { start, label: shortDay(start), value: all.filter(x => x.t >= start && x.t < start + WEEK).length };
  });

  // Where requests come from (documents and reports carry a purok).
  const purokCount = new Map<string, number>();
  [...docs.map(d => d.purok), ...reports.map(r => r.purok)].filter(Boolean).forEach(p => {
    const k = purokName(p);
    purokCount.set(k, (purokCount.get(k) ?? 0) + 1);
  });
  const byPurok = [...purokCount.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, undefined, { numeric: true }));

  // Most requested documents.
  const docCount = new Map<string, number>();
  docs.forEach(d => docCount.set(d.documentTitle, (docCount.get(d.documentTitle) ?? 0) + 1));
  const topDocuments = [...docCount.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  // Where document requests stand, in plain words.
  const stageOf: Record<string, string> = {
    submitted: 'New',
    under_review: 'Being checked',
    returned: 'Sent back to fix',
    approved: 'Approved',
    ready_for_release: 'Ready to pick up',
    completed: 'Picked up',
    rejected: 'Not approved',
  };
  const order = ['New', 'Being checked', 'Sent back to fix', 'Approved', 'Ready to pick up', 'Picked up', 'Not approved'];
  const stageCount = new Map<string, number>();
  docs.forEach(d => {
    const k = stageOf[d.status] ?? d.status;
    stageCount.set(k, (stageCount.get(k) ?? 0) + 1);
  });
  const stages = order.filter(k => stageCount.has(k)).map(label => ({ label, value: stageCount.get(label)! }));

  // Plain-language highlights.
  const insights: Insight[] = [];
  const thisWeek = weeks[weeks.length - 1]?.value ?? 0;
  const lastWeek = weeks[weeks.length - 2]?.value ?? 0;
  if (thisWeek || lastWeek) {
    if (lastWeek === 0) insights.push({ kind: 'trend', tone: 'up', text: `${thisWeek} new ${thisWeek === 1 ? 'request' : 'requests'} in the latest week, up from none the week before.` });
    else {
      const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
      insights.push(
        change === 0
          ? { kind: 'trend', tone: 'flat', text: `Requests held steady: ${thisWeek} in the latest week, same as the week before.` }
          : { kind: 'trend', tone: change > 0 ? 'up' : 'down', text: `Requests ${change > 0 ? 'rose' : 'fell'} ${Math.abs(change)}% in the latest week (${thisWeek} vs ${lastWeek}).` },
      );
    }
  }
  const totalPurok = byPurok.reduce((n, r) => n + r.value, 0);
  if (byPurok[0] && totalPurok) {
    insights.push({ kind: 'place', text: `${byPurok[0].label} sends the most: ${Math.round((byPurok[0].value / totalPurok) * 100)}% of documents and reports.` });
  }
  if (topDocuments[0]) {
    insights.push({ kind: 'document', text: `${topDocuments[0].label} is the most requested document (${topDocuments[0].value} of ${docs.length}).` });
  }
  const done = docs.filter(d => ['ready_for_release', 'completed'].includes(d.status));
  const days = done.map(d => (dateTimeValue(d.updatedAt) - dateTimeValue(d.submittedAt)) / DAY).filter(n => n >= 0 && n < 60);
  if (days.length) {
    const avg = days.reduce((a, b) => a + b, 0) / days.length;
    insights.push({ kind: 'speed', text: `Documents take about ${avg < 1 ? 'less than a day' : `${avg.toFixed(1)} days`} from request to ready.` });
  }
  const waiting = docs.filter(d => d.status === 'submitted').length + reports.filter(r => r.status === 'received').length;
  if (waiting) insights.push({ kind: 'waiting', text: `${waiting} ${waiting === 1 ? 'item is' : 'items are'} still waiting for someone to pick ${waiting === 1 ? 'it' : 'them'} up.` });

  return { weeks, byPurok, topDocuments, stages, insights: insights.slice(0, 4) };
};
