import React from 'react';
import { ArrowRight, CircleDot, FileText, LayoutGrid, Megaphone, MessageCircle, PackageCheck, PenLine, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { useResidentActivity } from './useResidentActivity';
import { CLAIM_HOURS, KindIcon, requestProgress } from './requestProgress';
import { IconCircle, List, ListRow, Page, Section, SectionLink, type IconTone } from './kit';
import { useLanguage, useT } from '../../i18n';

/*
 * Home, calm and in order of importance:
 *   1. Greeting
 *   2. One highlight: something ready to pick up, something to fix, or a friendly start
 *   3. Four main actions (everything else is one tap away in Services)
 *   4. In progress (two at most)
 *   5. Latest announcements (beside the rest on desktop)
 */

const ACTIONS: { id: string; label: string; icon: React.ReactNode; tone: IconTone }[] = [
  { id: 'documents', label: 'Documents', icon: <FileText />, tone: 'navy' },
  { id: 'complaints', label: 'Report', icon: <TriangleAlert />, tone: 'red' },
  { id: 'court', label: 'Book court', icon: <CircleDot />, tone: 'amber' },
  { id: 'services', label: 'More', icon: <LayoutGrid />, tone: 'gray' },
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const shortDate = (value: string, lang: 'en' | 'fil' = 'en') => {
  const t = Date.parse(value);
  return Number.isNaN(t) ? value : new Date(t).toLocaleDateString(lang === 'fil' ? 'fil-PH' : 'en-US', { month: 'short', day: 'numeric' });
};

export const ResidentDashboard: React.FC = () => {
  const { currentUser, setActiveTab, announcements, documentRequests, incidents, printRequests, courtReservations, appointments } = useBarangay();
  const { rows } = useResidentActivity();
  const t = useT();
  const lang = useLanguage();
  const sources = { documentRequests, incidents, printRequests, courtReservations, appointments };
  const firstName = currentUser.name.split(' ')[0];

  const ready = rows.filter(r => r.isReadyToClaim);
  const needsFix = rows.filter(r => r.kind === 'document' && documentRequests.find(d => d.id === r.id)?.status === 'returned');
  const ongoing = rows.filter(r => r.isActive && !r.isReadyToClaim);
  const news = [...announcements].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 3);

  /* The one thing that matters most right now. */
  const highlight = ready.length
    ? {
        tone: 'bg-success-bg text-success-fg',
        icon: <PackageCheck />,
        iconTone: 'green' as IconTone,
        title: ready.length === 1 ? t('{name} is ready', { name: ready[0].service }) : t('{count} things are ready', { count: ready.length }),
        sub: t('Pick up {hours} at the barangay hall.', { hours: lang === 'fil' ? t(CLAIM_HOURS) : CLAIM_HOURS.toLowerCase() }),
        cta: t('View'),
        tab: 'tracking',
      }
    : needsFix.length
      ? {
          tone: 'bg-warning-bg text-warning-fg',
          icon: <PenLine />,
          iconTone: 'amber' as IconTone,
          title: t('{name} needs a fix', { name: needsFix[0].service }),
          sub: t('Open it to see what to change.'),
          cta: t('Fix it'),
          tab: 'tracking',
        }
      : {
          tone: 'bg-navy text-white',
          icon: <FileText />,
          iconTone: 'navy' as IconTone,
          title: t('Need a barangay paper?'),
          sub: t('Request it here, then pick it up at the hall.'),
          cta: t('Get one'),
          tab: 'documents',
        };

  return (
    <Page wide>
      <header className="pt-1">
        <p className="text-muted">{t(greeting())},</p>
        <h1 className="font-display text-[1.75rem] sm:text-[2rem] font-bold text-ink leading-tight tracking-[-0.01em]">{firstName}</h1>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="grid grid-cols-1 gap-5 min-w-0">
          {/* Highlight */}
          <button
            type="button"
            onClick={() => setActiveTab(highlight.tab)}
            className={`group w-full rounded-card p-4 sm:p-5 flex items-center gap-4 text-left cursor-pointer
              transition-[scale,box-shadow] duration-150 ease-out-strong active:scale-[0.99] hover:shadow-float ${highlight.tone}`}
          >
            <span
              aria-hidden="true"
              className={`w-12 h-12 shrink-0 rounded-full grid place-items-center [&_svg]:w-6 [&_svg]:h-6 [&_svg]:stroke-[1.9]
                ${highlight.iconTone === 'navy' ? 'bg-white/15 text-white' : 'bg-surface/70'}`}
            >
              {highlight.icon}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[1.0625rem] font-semibold leading-snug">{highlight.title}</b>
              <span className="block text-meta opacity-90 mt-0.5">{highlight.sub}</span>
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 font-semibold text-meta">
              <span className="hidden sm:inline">{highlight.cta}</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </button>

          {/* Main actions */}
          <nav aria-label={t('Quick actions')} data-tour="home-actions" className="grid grid-cols-4 gap-2">
            {ACTIONS.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setActiveTab(a.id)}
                className="flex flex-col items-center gap-2 py-2 rounded-tile cursor-pointer transition-[scale,background-color] duration-150 ease-out-strong
                  hover:bg-surface active:scale-[0.95]"
              >
                <IconCircle tone={a.tone} size="lg">
                  {a.icon}
                </IconCircle>
                <span className="text-meta font-semibold text-ink leading-tight text-center">{t(a.label)}</span>
              </button>
            ))}
          </nav>

          {/* In progress */}
          {ongoing.length > 0 && (
            <Section flush title={t('In progress')} id="home-progress" action={<SectionLink onClick={() => setActiveTab('tracking')}>{t('See all')}</SectionLink>}>
              <List>
                {ongoing.slice(0, 2).map(r => (
                  <ListRow
                    key={r.id}
                    icon={<KindIcon kind={r.kind} />}
                    title={r.service}
                    sub={requestProgress(r, sources, lang)?.next}
                    onClick={() => setActiveTab('tracking')}
                  />
                ))}
              </List>
            </Section>
          )}
        </div>

        {/* Announcements */}
        <Section flush title={t('From the barangay')} id="home-news" action={<SectionLink onClick={() => setActiveTab('announcements')}>{t('See all')}</SectionLink>}>
          {news.length === 0 ? (
            <p className="px-5 pb-5 text-muted">{t('No announcements yet.')}</p>
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
                  sub={`${shortDate(a.date, lang)} · ${a.category}`}
                  onClick={() => setActiveTab('announcements')}
                />
              ))}
            </List>
          )}
        </Section>
      </div>

      {/* Ask Kap, quietly at the end */}
      <button
        type="button"
        onClick={() => setActiveTab('ai_assistant')}
        className="w-full flex items-center gap-3 rounded-card border border-dashed border-line px-4 py-3 text-left cursor-pointer hover:bg-surface transition-colors lg:max-w-[calc(100%-364px)]"
      >
        <IconCircle tone="blue">
          <MessageCircle />
        </IconCircle>
        <span className="min-w-0 flex-1">
          <b className="block font-semibold text-ink">{t('Have a question?')}</b>
          <span className="block text-meta text-muted">{t('Ask Kap about papers, fees and hours.')}</span>
        </span>
        <ArrowRight className="w-5 h-5 text-muted shrink-0" aria-hidden="true" />
      </button>
    </Page>
  );
};
