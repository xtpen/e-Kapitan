import { useMemo } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { dateTimeValue } from '../ui/format';

/*
 * Admin notifications: new work that is waiting for the barangay, newest first.
 *   new document requests · new problem reports · print jobs to start · court bookings to approve
 * An item's id includes its status, so when it moves on it drops off the list. Read state is
 * shared with the app (BarangayContext.readNotificationIds). Loaded at startup for the bell.
 */

export type AdminNoticeKind = 'document' | 'report' | 'printing' | 'court';

export interface AdminNotice {
  id: string;
  kind: AdminNoticeKind;
  title: string;
  detail: string;
  /** Tab that handles it. */
  tab: string;
  when: string;
  sortKey: number;
  unread: boolean;
}

export const useAdminNotifications = () => {
  const { documentRequests, incidents, printRequests, courtReservations, readNotificationIds } = useBarangay();

  return useMemo(() => {
    const list: AdminNotice[] = [];
    const add = (n: Omit<AdminNotice, 'sortKey' | 'unread'>) =>
      list.push({ ...n, sortKey: dateTimeValue(n.when), unread: !readNotificationIds.includes(n.id) });

    documentRequests
      .filter(d => d.status === 'submitted')
      .forEach(d =>
        add({ id: `adm-doc-${d.id}-${d.status}`, kind: 'document', title: `New request: ${d.documentTitle}`, detail: `${d.residentName} · ${d.referenceNumber}`, tab: 'admin_documents', when: d.submittedAt }),
      );
    incidents
      .filter(i => i.status === 'received')
      .forEach(i =>
        add({ id: `adm-inc-${i.id}-${i.status}`, kind: 'report', title: `New report: ${i.category}`, detail: `${i.reporterName} · ${i.referenceNumber}`, tab: 'admin_complaints', when: i.submittedAt }),
      );
    printRequests
      .filter(p => p.status === 'pending')
      .forEach(p =>
        add({ id: `adm-prt-${p.id}-${p.status}`, kind: 'printing', title: `Print job to start: ${p.fileName}`, detail: `${p.residentName} · ${p.referenceNumber}`, tab: 'admin_printing', when: p.submittedAt }),
      );
    courtReservations
      .filter(c => c.status === 'pending')
      .forEach(c =>
        add({ id: `adm-crt-${c.id}-${c.status}`, kind: 'court', title: `Court booking to approve: ${c.activity}`, detail: `${c.residentName} · ${c.referenceNumber}`, tab: 'admin_court', when: c.submittedAt }),
      );

    list.sort((a, b) => b.sortKey - a.sortKey);
    return { notices: list, unreadCount: list.filter(n => n.unread).length };
  }, [documentRequests, incidents, printRequests, courtReservations, readNotificationIds]);
};
