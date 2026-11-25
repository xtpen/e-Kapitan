import React, { useState } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { Card, Field, Input, PageHeader, StatusPill, initialsOf } from '../ui';

/**
 * Barangay Officials directory (public site and the resident "More" group).
 * Card style follows the officials row on the public homepage mockup.
 */
export const OfficialsDirectory: React.FC = () => {
  const { officials } = useBarangay();
  const [searchQuery, setSearchQuery] = useState('');

  const q =searchQuery.trim().toLowerCase();
  const shown = officials
    .filter(o => o.status === 'Active (Incumbent)' || o.status === 'On Leave (Absent)')
    .filter(o => !q || [o.name, o.position, o.committee].some(v => v.toLowerCase().includes(q)));

  return (
    <div className="max-w-[1200px]">
      <PageHeader title="Barangay Officials" description="Meet your officials and the committees they lead." />

      <Card className="mb-5">
        <Field label="Search officials" className="[&>label]:mt-0">
          {p => (
            <Input
              {...p}
              type="search"
              placeholder="Name, position or committee"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          )}
        </Field>
      </Card>

      {shown.length === 0 ? (
        <Card>
          <p className="text-meta text-muted">No officials match “{searchQuery}”. Try another name or committee.</p>
        </Card>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {shown.map(o => (
            <li key={o.id}>
              <Card className="h-full flex flex-col">
                <div className="flex items-start gap-4">
                  {o.avatarUrl ? (
                    <img src={o.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-16 h-16 rounded-full shrink-0 grid place-items-center bg-primary-tint text-primary-strong font-display font-semibold text-xl"
                    >
                      {initialsOf(o.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-h3 font-semibold text-navy leading-snug">{o.name}</h2>
                    <p className="text-meta text-muted">{o.position}</p>
                    {o.status === 'On Leave (Absent)' && (
                      <StatusPill tone="warning" className="mt-1.5">
                        On leave
                      </StatusPill>
                    )}
                  </div>
                </div>
                <dl className="mt-4 pt-4 border-t border-line-soft grid gap-2.5 text-meta">
                  <div>
                    <dt className="text-muted">Committee</dt>
                    <dd className="font-semibold">{o.committee}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Contact</dt>
                    <dd>
                      <a
                        href={`mailto:${o.contactDetails}`}
                        className="font-semibold text-primary-strong hover:underline underline-offset-4 break-all"
                      >
                        {o.contactDetails}
                      </a>
                    </dd>
                  </div>
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
