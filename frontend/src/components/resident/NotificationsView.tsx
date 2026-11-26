import React from 'react';
import { Bell, CircleDot, FileText, Printer, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button } from '../ui';
import { useResidentActivity, type NotificationCategory, type ResidentNotification } from './useResidentActivity';
import { timeAgo } from './requestProgress';
import { EmptyState, IconCircle, List, ListRow, Page, PageTitle, Section, type IconTone } from './kit';

/*
 * Notifications: "New" and "Earlier". Each row is one update about your request; tapping it
 * marks it read and opens the related page.
 */

const KIND: Record<NotificationCategory, { icon: React.ReactNode; tone: IconTone }> = {
  documents: { icon: <FileText />, tone: 'navy' },
  reports: { icon: <TriangleAlert />, tone: 'red' },
  printing: { icon: <Printer />, tone: 'green' },
  court: { icon: <CircleDot />, tone: 'amber' },
};

export const NotificationsView: React.FC = () => {
  const { setActiveTab, markNotificationsRead } = useBarangay();
  const { notifications, unreadCount } = useResidentActivity();
  const fresh = notifications.filter(n => n.unread);
  const earlier = notifications.filter(n => !n.unread);

  const open = (n: ResidentNotification) => {
    if (n.unread) markNotificationsRead([n.id]);
    setActiveTab(n.tab);
  };

  const row = (n: ResidentNotification) => (
    <ListRow
      key={n.id}
      icon={<IconCircle tone={KIND[n.category].tone}>{KIND[n.category].icon}</IconCircle>}
      title={n.title}
      sub={`${n.detail} · ${timeAgo(n.when)}`}
      highlight={n.unread}
      chevron={false}
      trailing={n.unread ? <span aria-label="New" className="w-2.5 h-2.5 rounded-full bg-navy-ink" /> : undefined}
      onClick={() => open(n)}
    />
  );

  return (
    <Page>
      <PageTitle
        title="Notifications"
        sub={unreadCount ? `${unreadCount} new` : 'You are all caught up.'}
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markNotificationsRead(fresh.map(n => n.id))}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <Section>
          <EmptyState icon={<Bell />} title="No notifications yet" sub="Updates about your requests show up here." />
        </Section>
      ) : (
        <>
          {fresh.length > 0 && (
            <Section flush title="New" id="notif-new">
              <List>{fresh.map(row)}</List>
            </Section>
          )}
          {earlier.length > 0 && (
            <Section flush title="Earlier" id="notif-earlier">
              <List>{earlier.map(row)}</List>
            </Section>
          )}
        </>
      )}
    </Page>
  );
};
