import React from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { Card, PageHeader, StatusPill } from '../ui';
import { announcementTone, longAnnouncementDate, sortAnnouncements } from './announcements';

/** Public · Announcements. No mockup; built from the homepage's announcement cards (DESIGN.md). */
export const PublicAnnouncements: React.FC = () => {
  const { announcements } = useBarangay();
  const list = sortAnnouncements(announcements);

  return (
    <div className="max-w-[860px]">
      <PageHeader title="Announcements" description="News and advisories from the barangay hall." />
      {list.length === 0 ? (
        <Card>
          <p className="text-meta text-muted">There are no announcements right now.</p>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:gap-5">
          {list.map(a => (
            <li key={a.id}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusPill tone={announcementTone(a)}>{a.category}</StatusPill>
                  <span className="text-meta text-muted">{longAnnouncementDate(a.date)}</span>
                </div>
                <h2 className="text-h3 font-semibold text-navy mt-3">{a.title}</h2>
                <p className="mt-1.5 whitespace-pre-line">{a.content}</p>
                {a.targetPurok && <p className="text-meta text-muted mt-3">For: {a.targetPurok}</p>}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
