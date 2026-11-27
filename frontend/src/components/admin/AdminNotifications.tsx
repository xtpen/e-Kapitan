import React, { useMemo, useState } from 'react';
import { BellOff, CheckCheck, ChevronRight, CircleDot, FileText, Printer, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, Card, CardHeader, FilterChips, PageHeader, formatShortDateTime } from '../ui';
import { useAdminNotifications, type AdminNotice, type AdminNoticeKind } from './adminNotices';

const KIND: Record<AdminNoticeKind, { icon: React.ReactNode; tone: string; plural: string; tab: string }> = {
  document: { icon: <FileText />, tone: 'bg-navy-tint text-navy-ink', plural: 'Document requests', tab: 'admin_documents' },
  report: { icon: <TriangleAlert />, tone: 'bg-warning-bg text-warning-fg', plural: 'Complaints and reports', tab: 'admin_complaints' },
  printing: { icon: <Printer />, tone: 'bg-info-bg text-info-fg', plural: 'Print jobs', tab: 'admin_printing' },
  court: { icon: <CircleDot />, tone: 'bg-success-bg text-success-fg', plural: 'Court bookings', tab: 'admin_court' },
};
const KINDS = Object.keys(KIND) as AdminNoticeKind[];

type Filter = 'all' | 'unread' | AdminNoticeKind;

/** The day is in the group heading, so rows show just the time. */
const timeOf = (n: AdminNotice) =>
  n.sortKey ? new Date(n.sortKey).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : formatShortDateTime(n.when);

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** "Today", "Yesterday", or "Wednesday, September 9". */
const dayLabel = (d: Date) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(d) === dayKey(now)) return 'Today';
  if (dayKey(d) === dayKey(yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) });
};

/** Admin · Notifications: new work waiting for the barangay. Opening one marks it read. */
export const AdminNotifications: React.FC = () => {
  const { setActiveTab, markNotificationsRead } = useBarangay();
  const { notices, unreadCount } = useAdminNotifications();
  const [filter, setFilter] = useState<Filter>('all');

  const shown = notices.filter(n => (filter === 'all' ? true : filter === 'unread' ? n.unread : n.kind === filter));

  // Newest first, grouped by day. Notices are already sorted newest first.
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: AdminNotice[] }[] = [];
    shown.forEach(n => {
      const d = new Date(n.sortKey);
      const key = n.sortKey ? dayKey(d) : 'unknown';
      const last = out[out.length - 1];
      if (last?.key === key) last.items.push(n);
      else out.push({ key, label: key === 'unknown' ? 'Earlier' : dayLabel(d), items: [n] });
    });
    return out;
  }, [shown]);

  const waiting = (k: AdminNoticeKind) => notices.filter(n => n.kind === k).length;

  const open = (n: AdminNotice) => {
    markNotificationsRead([n.id]);
    setActiveTab(n.tab);
  };

  return (
    <div className="max-w-[1280px]">
      <PageHeader
        title="Notifications"
        description={unreadCount ? `New work waiting for the barangay. ${unreadCount} new since you last looked.` : 'New work waiting for the barangay. You are all caught up.'}
        action={
          unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={() => markNotificationsRead(notices.map(n => n.id))} icon={<CheckCheck className="w-5 h-5" aria-hidden="true" />}>
              Mark all read
            </Button>
          )
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] gap-4 items-start">
        <div className="min-w-0">
          <FilterChips<Filter>
            label="Show"
            value={filter}
            onChange={setFilter}
            chips={[
              { id: 'all', label: 'All', count: notices.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              ...KINDS.map(k => ({ id: k as Filter, label: KIND[k].plural, count: waiting(k) })),
            ]}
          />

          <Card className="mt-4 !p-0 overflow-hidden">
            {shown.length === 0 ? (
              <div className="px-5 py-10 text-center grid justify-items-center gap-2">
                <span className="w-12 h-12 rounded-full bg-surface-muted text-muted grid place-items-center">
                  <BellOff className="w-6 h-6" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <p className="font-semibold text-ink">Nothing here</p>
                <p className="text-meta text-muted">
                  {filter === 'all' ? 'New requests, reports and bookings show up here.' : 'Nothing in this group right now. Pick All to see everything.'}
                </p>
              </div>
            ) : (
              groups.map(g => (
                <section key={g.key} aria-label={g.label}>
                  <h2 className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2 bg-surface-muted border-b border-line-soft text-label uppercase tracking-[0.06em] font-semibold text-muted">
                    {g.label}
                    <span className="normal-case tracking-normal font-normal">{g.items.length === 1 ? '1 item' : `${g.items.length} items`}</span>
                  </h2>
                  <ul className="divide-y divide-line-soft border-b border-line-soft">
                    {g.items.map(n => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => open(n)}
                          className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left cursor-pointer transition-colors hover:bg-surface-muted ${n.unread ? 'bg-navy-tint/40' : ''}`}
                        >
                          <span aria-hidden="true" className={`w-10 h-10 shrink-0 rounded-full grid place-items-center [&_svg]:w-5 [&_svg]:h-5 ${KIND[n.kind].tone}`}>
                            {KIND[n.kind].icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block leading-snug ${n.unread ? 'font-semibold text-ink' : 'text-ink'}`}>
                              {n.unread && <span className="sr-only">Unread: </span>}
                              {n.title}
                            </span>
                            <span className="block text-meta text-muted leading-snug mt-0.5 truncate">{n.detail}</span>
                          </span>
                          <span className="shrink-0 text-caption text-muted whitespace-nowrap hidden sm:block">{timeOf(n)}</span>
                          <span aria-hidden="true" className={`w-2.5 h-2.5 shrink-0 rounded-full ${n.unread ? 'bg-primary' : ''}`} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </Card>
        </div>

        {/* Waiting, by kind: a quick count and a way straight to the page that handles it. */}
        <Card className="lg:sticky lg:top-[96px]">
          <CardHeader title="Waiting for you" />
          <ul className="grid gap-1 -mx-2">
            {KINDS.map(k => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => setActiveTab(KIND[k].tab)}
                  aria-label={`Open ${KIND[k].plural.toLowerCase()}, ${waiting(k)} waiting`}
                  className="w-full min-h-12 flex items-center gap-3 px-2 py-1.5 rounded-control text-left cursor-pointer transition-colors hover:bg-surface-muted"
                >
                  <span aria-hidden="true" className={`w-9 h-9 shrink-0 rounded-full grid place-items-center [&_svg]:w-[1.125rem] [&_svg]:h-[1.125rem] ${KIND[k].tone}`}>
                    {KIND[k].icon}
                  </span>
                  <span className="flex-1 min-w-0 text-meta font-semibold text-ink">{KIND[k].plural}</span>
                  <span className="font-display font-bold text-navy-ink tabular-nums">{waiting(k)}</span>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-meta text-muted mt-3 pt-3 border-t border-line-soft">Items leave this list once someone starts on them.</p>
        </Card>
      </div>
    </div>
  );
};
