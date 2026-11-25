import type { IncidentReport, IncidentStatus } from '../../types';
import { formatShortDateTime, incidentStatus, type TimelineStage } from '../ui';

/**
 * Report progress for a ProgressTimeline: Received → Under review → Action taken → Resolved
 * (docs/DESIGN.md section 5.12). Used by the resident Complaints screen and public Track your request.
 */
export const buildReportStages = (r: IncidentReport): TimelineStage[] => {
  const order: IncidentStatus[] = ['received', 'assigned', 'in_progress', 'resolved'];
  const rank: Record<IncidentStatus, number> = {
    received: 0,
    assigned: 1,
    in_progress: 2,
    hearing_scheduled: 2,
    resolved: 3,
    dismissed: 3,
  };
  const current = rank[r.status];
  const entryFor = (s: IncidentStatus) =>
    [...r.statusHistory].reverse().find(h => h.status === s || (s === 'in_progress' && h.status === 'hearing_scheduled'));

  const stages: TimelineStage[] = order.map((s, i) => {
    const entry = entryFor(s);
    const isHearing = s === 'in_progress' && r.status === 'hearing_scheduled';
    const info = isHearing ? incidentStatus.hearing_scheduled : incidentStatus[s];
    return {
      label: info.label,
      tone: s === 'received' ? 'success' : info.tone,
      reached: i <= current && !(r.status === 'dismissed' && i === 3),
      detail: entry ? formatShortDateTime(entry.updatedAt) : undefined,
      note: entry && i === Math.min(current, 2) && r.status !== 'resolved' ? entry.note : undefined,
    };
  });

  if (r.status === 'dismissed') {
    const entry = entryFor('dismissed');
    stages[3] = {
      label: incidentStatus.dismissed.label,
      tone: 'danger',
      reached: true,
      detail: entry ? formatShortDateTime(entry.updatedAt) : undefined,
      note: entry?.note,
    };
  }
  if (r.status === 'resolved' && r.resolutionSummary) stages[3].note = r.resolutionSummary;
  if (r.assignedTo && current >= 1 && !stages[1].detail) stages[1].detail = 'Assigned to barangay staff';
  return stages;
};
