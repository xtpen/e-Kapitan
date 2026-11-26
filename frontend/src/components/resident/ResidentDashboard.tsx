import React from 'react';
import { CalendarDays, CircleDot, ClipboardList, Clock, FileText, Megaphone, MessageCircle, PackageCheck, PenLine, Printer, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { StatusPill } from '../ui';
import { useResidentActivity } from './useResidentActivity';
import { CLAIM_HOURS, KindIcon, requestProgress } from './requestProgress';
import { EmptyState, IconCircle, List, ListRow, Page, PageTitle, Section, SectionLink, type IconTone } from './kit';

/*
 * Home: what needs you, what you can do, how your requests are going.
 *   1. Greeting
 *   2. Needs your attention (only when something is ready or needs a fix)
 *   3. What do you need? (six services)
 *   4. Your requests (latest three)
 *   5. Announcements (headlines) and pick-up hours, beside the rest on desktop
 */

const QUICK: { id: string; label: string; icon: React.ReactNode; tone: IconTone }[] = [
  { id: 'documents', label: 'Documents', icon: <FileText />, tone: 'navy' },
  { id: 'complaints', label: 'Report a problem', icon: <TriangleAlert />, tone: 'red' },
  { id: 'printing', label: 'Printing', icon: <Printer />, tone: 'green' },
  { id: 'court', label: 'Book the court', icon: <CircleDot />, tone: 'amber' },
  { id: 'appointments', label: 'Visit the hall', icon: <CalendarDays />, tone: 'blue' },
  { id: 'ai_assistant', label: 'Ask Kap', icon: <MessageCircle />, tone: 'navy' },
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const shortDate = (value: string) => {
  const t = Date.parse(value);
  return Number.isNaN(t) ? value : new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const ResidentDashboard: React.FC = () => {
  const { currentUser, setActiveTab, announcements, documentRequests, incidents, printRequests, courtReservations, appointments } = useBarangay();
  const { rows } = useResidentActivity();
  const sources = { documentRequests, incidents, printRequests, courtReservations, appointments };
  const firstName = currentUser.name.split(' ')[0];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const ready = rows.filter(r => r.isReadyToClaim);
  const needsFix = rows.filter(r => r.kind === 'document' && documentRequests.find(d => d.id === r.id)?.status === 'returned');
  const latest = rows.filter(r => r.isActive && !r.isReadyToClaim).slice(0, 3);
  const news = [...announcements].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 3);

  return (
    <Page wide>
      <PageTitle title={`${greeting()}, ${firstName}`} sub={today} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* ---------- Main column ---------- */}
        <div className="grid grid-cols-1 gap-4 min-w-0">
          {(ready.length > 0 || needsFix.length > 0) && (
            <Section flush title="Needs your attention" id="home-attention">
              <List>
                {ready.map(r => (
                  <ListRow
                    key={r.id}
                    icon={
                      <IconCircle tone="green">
                        <PackageCheck />
                      </IconCircle>
                    }
                    title={r.service}
                    sub={`Ready to pick up · ${CLAIM_HOURS}`}
                    onClick={() => setActiveTab('tracking')}
                  />
                ))}
                {needsFix.map(r => (
                  <ListRow
                    key={r.id}
                    icon={
                      <IconCircle tone="amber">
                        <PenLine />
                      </IconCircle>
                    }
                    title={r.service}
                    sub="Needs a fix from you"
                    onClick={() => setActiveTab('tracking')}
                  />
                ))}
              </List>
            </Section>
          )}

          <Section title="What do you need?" id="home-services" action={<SectionLink onClick={() => setActiveTab('services')}>All services</SectionLink>}>
            <ul className="grid grid-cols-3 gap-2 mt-1">
              {QUICK.map(q => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(q.id)}
                    className="w-full h-full min-h-[104px] flex flex-col items-center justify-start gap-2 px-1.5 py-3 rounded-tile text-center cursor-pointer
                      hover:bg-surface-muted active:bg-surface-muted transition-colors duration-150"
                  >
                    <IconCircle tone={q.tone} size="lg">
                      {q.icon}
                    </IconCircle>
                    <span className="text-meta font-semibold text-ink leading-tight">{q.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Section>

          <Section flush title="In progress" id="home-requests" action={<SectionLink onClick={() => setActiveTab('tracking')}>See all</SectionLink>}>
            {latest.length === 0 ? (
              <EmptyState
                icon={<ClipboardList />}
                title="Nothing in progress"
                sub="Requests you send show up here."
                action={
                  <button type="button" onClick={() => setActiveTab('documents')} className="min-h-11 px-5 rounded-control bg-navy text-white font-semibold cursor-pointer">
                    Get a document
                  </button>
                }
              />
            ) : (
              <List>
                {latest.map(r => (
                  <ListRow
                    key={r.id}
                    icon={<KindIcon kind={r.kind} />}
                    title={r.service}
                    sub={requestProgress(r, sources)?.next}
                    trailing={<span className="hidden sm:inline-flex"><StatusPill tone={r.status.tone}>{r.status.label}</StatusPill></span>}
                    chevron={false}
                    onClick={() => setActiveTab('tracking')}
                  />
                ))}
              </List>
            )}
          </Section>
        </div>

        {/* ---------- Side column (below on phones) ---------- */}
        <div className="grid grid-cols-1 gap-4 min-w-0">
          <Section flush title="Announcements" id="home-news" action={<SectionLink onClick={() => setActiveTab('announcements')}>See all</SectionLink>}>
            {news.length === 0 ? (
              <EmptyState icon={<Megaphone />} title="No announcements" />
            ) : (
              <List>
                {news.map(a => (
                  <ListRow
                    key={a.id}
                    icon={
                      <IconCircle tone={a.isUrgent ? 'red' : 'amber'}>
                        <Megaphone />
                      </IconCircle>
                    }
                    title={<span className="line-clamp-2">{a.title}</span>}
                    sub={`${shortDate(a.date)} · ${a.category}`}
                    onClick={() => setActiveTab('announcements')}
                  />
                ))}
              </List>
            )}
          </Section>

          <Section>
            <div className="flex items-center gap-3">
              <IconCircle tone="blue">
                <Clock />
              </IconCircle>
              <div className="min-w-0">
                <p className="font-semibold text-ink leading-snug">Pick-up hours</p>
                <p className="text-meta text-muted">{CLAIM_HOURS} at the barangay hall</p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </Page>
  );
};
