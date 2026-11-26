import { useMemo } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { usePreferences } from '../../context/PreferencesContext';
import { translate } from '../../i18n';
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
  const lang = usePreferences().prefs.language;

  return useMemo(() => {
    const t = (text: string, vars?: Record<string, string | number>) => translate(lang, text, vars);
    const isMine = (residentId?: string, name?: string) =>
      (!!currentUser.residentId && residentId === currentUser.residentId) || name === currentUser.name;

    const docs = documentRequests.filter(r => isMine(r.residentId, r.residentName));
    const reports = incidents.filter(i => !i.isAnonymous && isMine(undefined, i.reporterName));
    const bookings = appointments.filter(a => isMine(a.residentId, a.residentName));
    const prints = printRequests.filter(p => isMine(p.residentId, p.residentName));
    const courts = courtReservations.filter(c => isMine(c.residentId, c.residentName));
    const slotStart = (id: string) => (courtSlots.find(s => s.id === id)?.short ?? id);
    const courtDate = (iso: string) =>
      new Date(`${iso}T00:00:00`).toLocaleDateString(lang === 'fil' ? 'fil-PH' : 'en-US', { month: 'short', day: 'numeric' });

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
        service: t(p.pages * p.copies === 1 ? 'Printing, {n} page' : 'Printing, {n} pages', { n: p.pages * p.copies }),
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
        service: t('Court, {date}, {time}', { date: courtDate(c.date), time: slotStart(c.slotId) }),
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
      if (d.status === 'ready_for_release') add(d.id, d.status, 'documents', 'tracking', when, t('{doc} is ready.', { doc: d.documentTitle }), t('Pick it up at the barangay hall. Bring a valid ID.'));
      else if (d.status === 'approved') add(d.id, d.status, 'documents', 'tracking', when, t('{doc} approved.', { doc: d.documentTitle }), t('We will tell you when it is ready to pick up.'));
      else if (d.status === 'under_review') add(d.id, d.status, 'documents', 'tracking', when, t('{doc} is being checked.', { doc: d.documentTitle }), t('The barangay is checking your details.'));
      else if (d.status === 'returned') add(d.id, d.status, 'documents', 'tracking', when, t('{doc} needs a fix from you.', { doc: d.documentTitle }), d.staffNotes ?? t('Open the request to see what to fix.'));
      else if (d.status === 'rejected') add(d.id, d.status, 'documents', 'tracking', when, t('{doc} was not approved.', { doc: d.documentTitle }), d.rejectionReason ?? t('Open the request to see why.'));
      else if (d.status === 'submitted') add(d.id, d.status, 'documents', 'tracking', when, t('{doc} request received.', { doc: d.documentTitle }), t('Waiting for the barangay to check it.'));
    });
    prints.forEach(p => {
      if (p.status === 'ready_for_pickup') add(p.id, p.status, 'printing', 'printing', p.submittedAt, t('Your printing is ready.'), t('{ref}. Pick it up at the barangay hall.', { ref: p.referenceNumber }));
      else if (p.status === 'processing') add(p.id, p.status, 'printing', 'printing', p.submittedAt, t('Your file is being printed.'), p.referenceNumber);
      else if (p.status === 'rejected') add(p.id, p.status, 'printing', 'printing', p.submittedAt, t('Print request not accepted.'), p.rejectionReason ?? p.referenceNumber);
    });
    courts.forEach(c => {
      if (c.status === 'pending') add(c.id, c.status, 'court', 'court', c.submittedAt, t('Court request received.'), t('Waiting for the barangay to say yes.'));
      else if (c.status === 'approved') add(c.id, c.status, 'court', 'court', c.submittedAt, t('Court reservation approved.'), `${courtDate(c.date)}, ${slotStart(c.slotId)}.`);
      else if (c.status === 'declined') add(c.id, c.status, 'court', 'court', c.submittedAt, t('Court request declined.'), c.notes ?? c.referenceNumber);
      else if (c.status === 'cancelled') add(c.id, c.status, 'court', 'court', c.submittedAt, t('Court booking cancelled.'), c.notes ?? c.referenceNumber);
    });
    reports.forEach(i => {
      const when = i.statusHistory[i.statusHistory.length - 1]?.updatedAt ?? i.submittedAt;
      if (i.status === 'received') add(i.id, i.status, 'reports', 'complaints', when, t('Report received.'), t('{ref}. The barangay will look at it soon.', { ref: i.referenceNumber }));
      else if (i.status === 'assigned') add(i.id, i.status, 'reports', 'complaints', when, t('Someone is on your report.'), t('The barangay is looking into it.'));
      else if (i.status === 'in_progress' || i.status === 'hearing_scheduled') add(i.id, i.status, 'reports', 'complaints', when, t('Action taken on your report.'), i.referenceNumber);
      else if (i.status === 'resolved') add(i.id, i.status, 'reports', 'complaints', when, t('Your report is fixed.'), i.title);
    });
    notifications.sort((a, b) => b.sortKey - a.sortKey);

    return {
      rows,
      activeCount: rows.filter(r => r.isActive).length,
      readyCount: rows.filter(r => r.isReadyToClaim).length,
      notifications,
      unreadCount: notifications.filter(n => n.unread).length,
    };
  }, [currentUser, documentRequests, incidents, appointments, printRequests, courtReservations, courtSlots, readNotificationIds, lang]);
};
