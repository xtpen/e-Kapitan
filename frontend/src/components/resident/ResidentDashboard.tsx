import React from 'react';
import { CircleDot, FileText, Printer, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, Card, CardHeader, IconTile, StatCard, StatusPill, TextLink, type IconTileTone } from '../ui';
import { useResidentActivity } from './useResidentActivity';

/** Resident Dashboard. Mockup: "Resident · Dashboard" (desktop + mobile). See DESIGN.md. */
export const ResidentDashboard: React.FC = () => {
  const { currentUser, setActiveTab } = useBarangay();
  const { rows, activeCount, readyCount, notifications, unreadCount } = useResidentActivity();

  const firstName = currentUser.name.split(' ')[0];
  const recent = rows.slice(0, 4);
  const activeRows = rows.filter(r => r.isActive).slice(0, 3);

  const quickActions: { label: string; tab: string; icon: React.ReactNode; tone: IconTileTone }[] = [
    { label: 'Request a Document', tab: 'services', icon: <FileText strokeWidth={1.8} />, tone: 'green' },
    { label: 'File a Report', tab: 'complaints', icon: <TriangleAlert strokeWidth={1.8} />, tone: 'warning' },
    { label: 'Print Request', tab: 'printing', icon: <Printer strokeWidth={1.8} />, tone: 'info' },
    { label: 'Reserve Court', tab: 'court', icon: <CircleDot strokeWidth={1.8} />, tone: 'green' },
  ];

  const notificationsCard = (
    <Card>
      <CardHeader
        title="Notifications"
        action={notifications.length > 0 && <TextLink onClick={() => setActiveTab('notifications')}>View all</TextLink>}
      />
      {notifications.length === 0 ? (
        <p className="text-meta text-muted">You're all caught up.</p>
      ) : (
        <ul className="space-y-2.5">
          {notifications.slice(0, 3).map(n => (
            <li key={n.id} className="relative pl-4">
              {n.unread && (
                <span aria-hidden="true" className="absolute left-0 top-[0.6em] w-[7px] h-[7px] rounded-full bg-primary" />
              )}
              <b className="font-semibold">
                {n.title}
                {n.unread && <span className="sr-only"> (unread)</span>}
              </b>
              <br />
              <span className="text-meta text-muted">{n.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  const claimingHours = (
    <Card tone="callout">
      <h3 className="text-h3 font-semibold text-navy">Claiming hours</h3>
      <p className="text-meta text-muted mt-1">Weekdays, 1:00 PM to 4:00 PM at the Barangay Hall.</p>
    </Card>
  );

  return (
    <div className="max-w-[1200px]">
      {/* ---------- Mobile ---------- */}
      <div className="md:hidden">
        <h1 className="text-2xl font-bold text-navy">Good day, {firstName}</h1>
        <p className="text-meta text-muted mt-1 mb-3.5">What would you like to do?</p>

        <div className="grid grid-cols-2 gap-2.5">
          {quickActions.map(a => (
            <button
              key={a.tab}
              type="button"
              onClick={() => setActiveTab(a.tab)}
              className="text-left bg-surface border border-line rounded-tile p-3.5 font-semibold cursor-pointer hover:border-navy transition-colors"
            >
              <IconTile tone={a.tone} size="sm" className="mb-2 [&_svg]:w-[22px] [&_svg]:h-[22px]">
                {a.icon}
              </IconTile>
              {a.label}
            </button>
          ))}
        </div>

        <h2 className="text-h3 font-semibold text-navy mt-5 mb-2.5">My active requests</h2>
        {activeRows.length === 0 ? (
          <Card>
            <p className="text-meta text-muted">You have no active requests.</p>
          </Card>
        ) : (
          <ul className="grid gap-2.5">
            {activeRows.map(r => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(r.tab)}
                  className="w-full text-left bg-surface border border-line rounded-tile p-3.5 cursor-pointer hover:border-navy transition-colors"
                >
                  <span className="flex justify-between items-start gap-2">
                    <b className="font-semibold">{r.service}</b>
                    <StatusPill tone={r.status.tone}>{r.status.label}</StatusPill>
                  </span>
                  <span className="block text-meta text-muted mt-0.5">{r.reference}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-2.5 mt-5">
          {notificationsCard}
          {claimingHours}
        </div>
      </div>

      {/* ---------- Tablet / desktop ---------- */}
      <div className="hidden md:block">
        <section className="bg-navy text-white rounded-banner px-8 py-7 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-h2 leading-tight font-semibold text-white">Good day, {firstName}</h1>
            <p className="text-on-navy mt-1">Need something from the barangay today?</p>
          </div>
          <Button variant="accent" onClick={() => setActiveTab('services')}>
            Request a document
          </Button>
        </section>

        <div className="grid grid-cols-3 gap-5 my-5">
          <StatCard label="Active requests" value={activeCount} />
          <StatCard label="Ready to claim" value={readyCount} />
          <StatCard label="Unread notifications" value={unreadCount} />
        </div>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-5 items-start">
          <Card>
            <CardHeader title="My recent requests" action={<TextLink onClick={() => setActiveTab('tracking')}>View all</TextLink>} />
            {recent.length === 0 ? (
              <div className="py-6">
                <p className="text-meta text-muted mb-4">You have no requests yet.</p>
                <Button size="sm" onClick={() => setActiveTab('services')}>
                  Request a document
                </Button>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Reference', 'Service', 'Status'].map(h => (
                      <th
                        key={h}
                        scope="col"
                        className="text-left text-label uppercase tracking-[0.06em] font-semibold text-muted py-2.5 px-2 border-b-2 border-line"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map(r => (
                    <tr
                      key={r.id}
                      onClick={() => setActiveTab(r.tab)}
                      className="border-b border-line-soft last:border-b-0 cursor-pointer hover:bg-navy-tint"
                    >
                      <td className="py-3.5 px-2 text-meta whitespace-nowrap">{r.reference}</td>
                      <td className="py-3.5 px-2 text-meta">{r.service}</td>
                      <td className="py-3.5 px-2">
                        <StatusPill tone={r.status.tone}>{r.status.label}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <div className="grid gap-5">
            {notificationsCard}
            {claimingHours}
          </div>
        </div>
      </div>
    </div>
  );
};
