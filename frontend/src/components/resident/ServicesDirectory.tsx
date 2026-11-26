import React, { useMemo, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { ServiceItem } from '../../types';
import { Button, Input } from '../ui';
import { EmptyState, IconCircle, List, ListRow, Page, PageTitle, Section } from './kit';

interface ServicesDirectoryProps {
  onSelectService?: (service: ServiceItem) => void;
}

/* Plain-language helpers (the service data is written for staff). */
const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;
const plainTitle = (t: string) => t.replace(/\s*\(RA\s*\d+\)/i, '');
const readyIn = (t: string) => {
  const s = t
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+upon validation/i, '')
    .split(/\s+or\s+/i)[0]
    .trim();
  return /^same day$/i.test(s) ? 'Ready same day' : `Ready in ${s}`;
};

/**
 * Resident · Documents (tab id `documents`). A search box and one row per document.
 * Tapping a row opens the request flow.
 */
export const ServicesDirectory: React.FC<ServicesDirectoryProps> = ({ onSelectService }) => {
  const { services, setActiveTab } = useBarangay();
  const [query, setQuery] = useState('');

  const available = useMemo(() => services.filter(s => s.availableOnline), [services]);

  const q = query.trim().toLowerCase();
  const shown = available.filter(s => !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));

  const start = (service: ServiceItem) => {
    onSelectService?.(service);
    setActiveTab('request_wizard');
  };

  return (
    <Page>
      <PageTitle title="Documents" sub="Request online. Pick up at the hall." />

      <div className="relative">
        <label htmlFor="doc-search" className="sr-only">
          Search documents
        </label>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" strokeWidth={1.8} aria-hidden="true" />
        <Input
          id="doc-search"
          type="search"
          placeholder="Search documents"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-11!"
        />
      </div>

      <Section flush>
        <p className="sr-only" aria-live="polite">
          {shown.length === 1 ? '1 document' : `${shown.length} documents`}
        </p>
        {shown.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="No documents found"
            sub="Try another word."
            action={
              <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <List>
            {shown.map(service => (
              <ListRow
                key={service.id}
                icon={
                  <IconCircle>
                    <FileText />
                  </IconCircle>
                }
                title={plainTitle(service.title)}
                sub={`${service.fee === 0 ? 'Free' : peso(service.fee)} · ${readyIn(service.processingTime)}`}
                onClick={() => start(service)}
              />
            ))}
          </List>
        )}
      </Section>
    </Page>
  );
};
