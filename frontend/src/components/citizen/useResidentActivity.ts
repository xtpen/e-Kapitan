import { useMemo } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { appointmentStatus, courtStatus, documentStatus, incidentStatus, printStatus, type StatusInfo } from '../ui';

/** One row in "My recent requests", whatever the service. */
export type ActivityKind = 'document' | 'report' | 'printing' | 'court' | 'appointment';

export interface ActivityRow {
  id: string;
  kind: ActivityKind;
  /** Raw date string of the last update, for display. */
  when: string;
  reference: string;
  service: string;
  status: StatusInfo;
  /** Tab to open for details. */
  tab: string;
  sortKey: number;
  isActive: boolean;
  isReadyToClaim: boolean;
}

export type NotificationCategory = 'documents' | 'reports' | 'printing' | 'court';

export interface ResidentNotification {
  /** Includes the status, so a new status shows up as a new (unread) notification. */
  id: string;
  title: string;
  detail: string;
  category: NotificationCategory;
  /** Tab that shows the related item. */
  tab: string;
  /** Raw date string of the event, for display. */
  when: string;
  sortKey: number;
  unread: boolean;
}

const toTime = (value: string) => {
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Pulls the current resident's documents, reports and reservations into one list,
 * plus simple notifications derived from their status. Mock data only for now.
 */
export const useResidentActivity = () => {
  const {
    currentUser,
    documentRequests,
    incidents,
    appointments,
    printRequests,
    courtReservations,
    courtSlots,
    readNotificationIds,
  } = useBarangay();

  return useMemo(() => {
    const isMine = (residentId?: string, name?: string) =>
      (!!currentUser.residentId && residentId === currentUser.residentId) || name === currentUser.name;

    const docs = documentRequests.filter(r => isMine(r.residentId, r.residentName));
    const reports = incidents.filter(i => !i.isAnonymous && isMine(undefined, i.reporterName));
    const bookings = appointments.filter(a => isMine(a.residentId, a.residentName));
    const prints = printRequests.filter(p => isMine(p.residentId, p.residentName));
    const courts = courtReservations.filter(c => isMine(c.residentId, c.residentName));
    const slotStart = (id: string) => (courtSlots.find(s => s.id === id)?.short ?? id);
    const courtDate = (iso: string) =>
      new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const rows: ActivityRow[] = [
      ...docs.map(d => ({
        id: d.id,
        kind: 'document' as const,
        when: d.updatedAt || d.submittedAt,
        reference: d.referenceNumber,
        service: d.documentTitle,
        status: documentStatus[d.status],
        tab: 'tracking',
        sortKey: toTime(d.updatedAt || d.submittedAt),
        isActive: d.status !== 'completed' && d.status !== 'rejected',
        isReadyToClaim: d.status === 'ready_for_release',
      })),
      ...reports.map(i => ({
        id: i.id,
        kind: 'report' as const,
        when: i.statusHistory[i.statusHistory.length - 1]?.updatedAt ?? i.submittedAt,
        reference: i.referenceNumber,
        service: i.title,
        status: incidentStatus[i.status],
        tab: 'complaints',
        sortKey: toTime(i.statusHistory[i.statusHistory.length - 1]?.updatedAt ?? i.submittedAt),
        isActive: i.status !== 'resolved' && i.status !== 'dismissed',
        isReadyToClaim: false,
      })),
      ...prints.map(p => ({
        id: p.id,
        kind: 'printing' as const,
        when: p.submittedAt,
        reference: p.referenceNumber,
        service: `Printing, ${p.pages * p.copies} ${p.pages * p.copies === 1 ? 'page' : 'pages'}`,
        status: printStatus[p.status],
        tab: 'printing',
        sortKey: toTime(p.submittedAt),
        isActive: p.status === 'pending' || p.status === 'processing' || p.status === 'ready_for_pickup',
        isReadyToClaim: p.status === 'ready_for_pickup',
      })),
      ...courts.map(c => ({
        id: c.id,
        kind: 'court' as const,
        when: c.submittedAt,
        reference: c.referenceNumber,
        service: `Court, ${courtDate(c.date)}, ${slotStart(c.slotId)}`,
        status: courtStatus[c.status],
        tab: 'court',
        sortKey: toTime(c.submittedAt),
        isActive: c.status === 'pending' || c.status === 'approved',
        isReadyToClaim: false,
      })),
      ...bookings.map(a => ({
        id: a.id,
        kind: 'appointment' as const,
        when: a.date,
        reference: a.referenceNumber,
        service: `${a.serviceTitle}, ${a.date}`,
        status: appointmentStatus[a.status],
        tab: 'appointments',
        sortKey: toTime(`${a.date}`),
        isActive: a.status === 'confirmed' || a.status === 'rescheduled',
        isReadyToClaim: false,
      })),
    ].sort((a, b) => b.sortKey - a.sortKey);

    const notifications: ResidentNotification[] = [];
    const add = (
      itemId: string,
      status: string,
      category: NotificationCategory,
      tab: string,
      when: string,
      title: string,
      detail: string,
    ) => {
      const id = `n-${itemId}-${status}`;
      notifications.push({ id, title, detail, category, tab, when, sortKey: toTime(when), unread: !readNotificationIds.includes(id) });
    };

    docs.forEach(d => {
      const when = d.updatedAt || d.submittedAt;
      if (d.status === 'ready_for_release') add(d.id, d.status, 'documents', 'tracking', when, `${d.documentTitle} is ready.`, 'Claim it with a valid ID.');
      else if (d.status === 'approved') add(d.id, d.status, 'documents', 'tracking', when, `${d.documentTitle} approved.`, 'We will tell you when it is ready to claim.');
      else if (d.status === 'under_review') add(d.id, d.status, 'documents', 'tracking', when, `${d.documentTitle} is being reviewed.`, 'Barangay staff are checking your request.');
      else if (d.status === 'rejected') add(d.id, d.status, 'documents', 'tracking', when, `${d.documentTitle} was not approved.`, d.rejectionReason ?? 'Open the request to see why.');
      else if (d.status === 'submitted') add(d.id, d.status, 'documents', 'tracking', when, `${d.documentTitle} request received.`, 'Awaiting review.');
    });
    prints.forEach(p => {
      if (p.status === 'ready_for_pickup') add(p.id, p.status, 'printing', 'printing', p.submittedAt, 'Your printing is ready.', `${p.referenceNumber}. Pick it up at the barangay hall.`);
      else if (p.status === 'processing') add(p.id, p.status, 'printing', 'printing', p.submittedAt, 'Your file is being printed.', p.referenceNumber);
      else if (p.status === 'rejected') add(p.id, p.status, 'printing', 'printing', p.submittedAt, 'Print request not accepted.', p.rejectionReason ?? p.referenceNumber);
    });
    courts.forEach(c => {
      if (c.status === 'pending') add(c.id, c.status, 'court', 'court', c.submittedAt, 'Court request received.', 'Awaiting approval.');
      else if (c.status === 'approved') add(c.id, c.status, 'court', 'court', c.submittedAt, 'Court reservation approved.', `${courtDate(c.date)}, ${slotStart(c.slotId)}.`);
      else if (c.status === 'declined') add(c.id, c.status, 'court', 'court', c.submittedAt, 'Court request declined.', c.notes ?? c.referenceNumber);
    });
    reports.forEach(i => {
      const when = i.statusHistory[i.statusHistory.length - 1]?.updatedAt ?? i.submittedAt;
      if (i.status === 'received') add(i.id, i.status, 'reports', 'complaints', when, 'Report received.', `${i.referenceNumber}. Staff will review it soon.`);
      else if (i.status === 'assigned') add(i.id, i.status, 'reports', 'complaints', when, 'Report assigned.', 'A staff member is reviewing it.');
      else if (i.status === 'in_progress' || i.status === 'hearing_scheduled') add(i.id, i.status, 'reports', 'complaints', when, 'Action taken on your report.', i.referenceNumber);
      else if (i.status === 'resolved') add(i.id, i.status, 'reports', 'complaints', when, 'Report resolved.', i.title);
    });
    notifications.sort((a, b) => b.sortKey - a.sortKey);

    return {
      rows,
      activeCount: rows.filter(r => r.isActive).length,
      readyCount: rows.filter(r => r.isReadyToClaim).length,
      notifications,
      unreadCount: notifications.filter(n => n.unread).length,
    };
  }, [currentUser, documentRequests, incidents, appointments, printRequests, courtReservations, courtSlots, readNotificationIds]);
};
