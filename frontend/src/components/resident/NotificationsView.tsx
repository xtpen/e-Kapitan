import React, { useState } from 'react';
import { BellOff, ChevronRight, CircleDot, FileText, Printer, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, FilterChips, IconTile, PageHeader, formatShortDateTime, type IconTileTone } from '../ui';
import { useResidentActivity, type NotificationCategory, type ResidentNotification } from './useResidentActivity';

type Filter = 'all' | 'unread' | NotificationCategory;

const CATEGORY: Record<NotificationCategory, { label: string; icon: React.ReactNode; tone: IconTileTone }> = {
  documents: { label: 'Documents', icon: <FileText strokeWidth={1.8} />, tone: 'green' },
  reports: { label: 'Reports', icon: <TriangleAlert strokeWidth={1.8} />, tone: 'warning' },
  printing: { label: 'Printing', icon: <Printer strokeWidth={1.8} />, tone: 'info' },
  court: { label: 'Court', icon: <CircleDot strokeWidth={1.8} />, tone: 'green' },
};

/** Resident · Notifications. No mockup; built from DESIGN.md patterns. */
export const NotificationsView: React.FC = () => {
  const { setActiveTab, markNotificationsRead } = useBarangay();
  const { notifications, unreadCount } = useResidentActivity();
  const [filter, setFilter] = useState<Filter>('all');

  const count = (f: Filter) =>
    f === 'all' ? notifications.length : f === 'unread' ? unreadCount : notifications.filter(n => n.category === f).length;

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    ...(Object.keys(CATEGORY) as NotificationCategory[])
      .filter(c => count(c) > 0)
      .map(c => ({ id: c as Filter, label: CATEGORY[c].label })),
  ];

  const shown = notifications.filter(n =>
    filter === 'all' ? true : filter === 'unread' ? n.unread : n.category === filter,
  );

  const open = (n: ResidentNotification) => {
    markNotificationsRead([n.id]);
    setActiveTab(n.tab);
  };

  return (
    <div className="max-w-[900px]">
      <PageHeader
        title="Notifications"
        description="Updates about your requests, reports, printing and court reservations."
        action={
          unreadCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => markNotificationsRead(notifications.map(n => n.id))}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <FilterChips<Filter>
        className="mb-4"
        value={filter}
        onChange={setFilter}
        chips={filters.map(f => ({ ...f, count: count(f.id) }))}
      />

      <div className="bg-surface border border-line rounded-card overflow-hidden">
        {shown.length === 0 ? (
          <div className="text-center px-6 py-12">
            <div aria-hidden="true" className="w-13 h-13 mx-auto mb-3 rounded-tile grid place-items-center bg-surface-muted text-muted">
              <BellOff className="w-6 h-6" strokeWidth={1.8} />
            </div>
            <h2 className="text-h3 font-semibold text-navy">
              {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
            </h2>
            <p className="text-meta text-muted mt-1">
              {filter === 'unread'
                ? 'You have read all your notifications.'
                : 'We will let you know here when one of your requests changes.'}
            </p>
          </div>
        ) : (
          <ul>
            {shown.map(n => {
              const cat = CATEGORY[n.category];
              return (
                <li key={n.id} className="border-b border-line-soft last:border-b-0">
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className={`w-full flex items-start gap-3.5 text-left px-4 sm:px-6 py-4 cursor-pointer transition-colors hover:bg-navy-tint
                      ${n.unread ? 'bg-primary-tint/40' : ''}`}
                  >
                    <IconTile tone={cat.tone} size="sm" className="[&_svg]:w-5 [&_svg]:h-5 mt-0.5">
                      {cat.icon}
                    </IconTile>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-start justify-between gap-3">
                        <span className={`${n.unread ? 'font-bold' : 'font-semibold'} text-ink`}>
                          {n.title}
                          {n.unread && <span className="sr-only"> (unread)</span>}
                        </span>
                        <span className="flex items-center gap-2 shrink-0 text-caption text-muted whitespace-nowrap pt-0.5">
                          {formatShortDateTime(n.when)}
                          {n.unread && <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </span>
                      </span>
                      <span className="block text-meta text-muted mt-0.5">{n.detail}</span>
                      <span className="inline-flex items-center gap-1 mt-1.5 text-meta font-semibold text-primary-strong">
                        View {cat.label.toLowerCase()}
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
