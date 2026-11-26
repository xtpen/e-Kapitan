import React, { useMemo, useState } from 'react';
import { CalendarDays, CircleDot, FileCheck2, FileText, Landmark, Megaphone, MessageCircle, Printer, Search, TriangleAlert, X } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { EmptyState, IconCircle, List, ListRow, Page, PageTitle, Section, type IconTone } from './kit';

/*
 * Services: everything a resident can do, in four plain groups of list rows, with a search box
 * that understands everyday words ("clearance", "basketball", "print").
 */

type Service = { id: string; label: string; hint: string; icon: React.ReactNode; tone: IconTone; keywords: string };

const GROUPS: { title: string; items: Service[] }[] = [
  {
    title: 'Request',
    items: [
      { id: 'documents', label: 'Documents', hint: 'Clearance, residency, indigency and more', icon: <FileText />, tone: 'navy', keywords: 'certificate clearance residency indigency business job permit id' },
      { id: 'printing', label: 'Printing', hint: 'Print your files for free', icon: <Printer />, tone: 'green', keywords: 'print pdf word copy school form' },
    ],
  },
  {
    title: 'Book',
    items: [
      { id: 'court', label: 'Book the court', hint: 'Basketball, events, meetings', icon: <CircleDot />, tone: 'amber', keywords: 'court basketball volleyball event reserve' },
      { id: 'appointments', label: 'Visit the hall', hint: 'Pick a time and skip the line', icon: <CalendarDays />, tone: 'blue', keywords: 'appointment schedule visit office time' },
    ],
  },
  {
    title: 'Get help',
    items: [
      { id: 'complaints', label: 'Report a problem', hint: 'Noise, garbage, flooding, streetlights', icon: <TriangleAlert />, tone: 'red', keywords: 'complaint report noise garbage flood streetlight dispute neighbor' },
      { id: 'ai_assistant', label: 'Ask Kap', hint: 'Questions about papers, fees and hours', icon: <MessageCircle />, tone: 'navy', keywords: 'help question chat ask fee requirements hours' },
      { id: 'qr_verify', label: 'Check a document', hint: 'See if a barangay paper is real', icon: <FileCheck2 />, tone: 'gray', keywords: 'verify fake real check code' },
    ],
  },
  {
    title: 'Barangay info',
    items: [
      { id: 'announcements', label: 'Announcements', hint: 'News, events and schedules', icon: <Megaphone />, tone: 'amber', keywords: 'news advisory event health schedule' },
      { id: 'officials_directory', label: 'Officials', hint: 'Who leads the barangay', icon: <Landmark />, tone: 'blue', keywords: 'captain kagawad council contact' },
    ],
  },
];

export const ServicesHub: React.FC = () => {
  const { setActiveTab } = useBarangay();
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return GROUPS;
    return GROUPS.map(g => ({ ...g, items: g.items.filter(s => `${s.label} ${s.hint} ${s.keywords}`.toLowerCase().includes(term)) })).filter(
      g => g.items.length > 0,
    );
  }, [q]);

  return (
    <Page>
      <PageTitle title="Services" sub="What would you like to do?" />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search, e.g. clearance or court"
          aria-label="Search services"
          className="w-full min-h-12 pl-12 pr-12 rounded-control bg-surface border-[1.5px] border-line text-ink placeholder:text-muted/80
            focus:outline-none focus:border-navy-ink focus:ring-[3px] focus:ring-navy-ink/20 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-control text-muted hover:text-ink cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <Section>
          <EmptyState
            icon={<Search />}
            title={`Nothing found for “${q}”`}
            sub="Try another word, or ask Kap."
            action={
              <button type="button" onClick={() => setActiveTab('ai_assistant')} className="min-h-11 px-5 rounded-control bg-navy text-white font-semibold cursor-pointer">
                Ask Kap
              </button>
            }
          />
        </Section>
      ) : (
        groups.map(g => (
          <Section key={g.title} flush title={g.title} id={`svc-${g.title}`}>
            <List>
              {g.items.map(s => (
                <ListRow
                  key={s.id}
                  icon={<IconCircle tone={s.tone}>{s.icon}</IconCircle>}
                  title={s.label}
                  sub={s.hint}
                  onClick={() => setActiveTab(s.id)}
                />
              ))}
            </List>
          </Section>
        ))
      )}
    </Page>
  );
};
