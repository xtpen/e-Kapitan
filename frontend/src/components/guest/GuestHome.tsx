import React from 'react';
import { ArrowRight, Clock, FileCheck2, LayoutGrid, Megaphone, MessageCircle, ScanSearch, Sparkles, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { useLanguage, useT } from '../../i18n';
import { IconCircle, List, ListRow, Page, Section, SectionLink, type IconTone } from '../resident/kit';
import { useGuest } from './access';

/*
 * Guest Home: the resident Home, for someone without an account.
 *   1. Greeting
 *   2. One highlight: what a free account adds (sign up)
 *   3. Four things a guest can do now
 *   4. Barangay hall hours
 *   5. Latest announcements (beside the rest on desktop)
 *   6. Ask Kap, quietly at the end
 */

const ACTIONS: { id: string; label: string; icon: React.ReactNode; tone: IconTone }[] = [
  { id: 'complaints', label: 'Report', icon: <TriangleAlert />, tone: 'red' },
  { id: 'tracking', label: 'Track', icon: <ScanSearch />, tone: 'blue' },
  { id: 'qr_verify', label: 'Verify', icon: <FileCheck2 />, tone: 'gray' },
  { id: 'services', label: 'More', icon: <LayoutGrid />, tone: 'navy' },
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const shortDate = (value: string, lang: 'en' | 'fil' = 'en') => {
  const d = Date.parse(value);
  return Number.isNaN(d) ? value : new Date(d).toLocaleDateString(lang === 'fil' ? 'fil-PH' : 'en-US', { month: 'short', day: 'numeric' });
};

export const GuestHome: React.FC = () => {
  const { setActiveTab, announcements } = useBarangay();
  const { signUp } = useGuest();
  const t = useT();
  const lang = useLanguage();
  const news = [...announcements].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 3);

  return (
    <Page wide>
      <header className="pt-1">
        <p className="text-muted">{t(greeting())},</p>
        <h1 className="font-display text-[1.75rem] sm:text-[2rem] font-bold text-ink leading-tight tracking-[-0.01em]">{t('Welcome')}</h1>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="grid grid-cols-1 gap-5 min-w-0">
          {/* Highlight: what an account adds */}
          <button
            type="button"
            onClick={signUp}
            className="group w-full rounded-card p-4 sm:p-5 flex items-center gap-4 text-left cursor-pointer bg-navy text-white
              transition-[scale,box-shadow] duration-150 ease-out-strong active:scale-[0.99] hover:shadow-float"
          >
            <span aria-hidden="true" className="w-12 h-12 shrink-0 rounded-full grid place-items-center bg-white/15 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:stroke-[1.9]">
              <Sparkles />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[1.0625rem] font-semibold leading-snug">{t('Do more with a free account')}</b>
              <span className="block text-meta opacity-90 mt-0.5">{t('Request documents, book the court and follow everything you ask for.')}</span>
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 font-semibold text-meta">
              <span className="hidden sm:inline">{t('Sign up')}</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </button>

          {/* What a guest can do now */}
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

          {/* Hall hours */}
          <Section flush title={t('Barangay hall')} id="guest-hall">
            <List>
              <ListRow
                icon={<IconCircle tone="green"><Clock /></IconCircle>}
                title={t('Monday to Friday, 8:00 AM to 5:00 PM')}
                sub={t('Pick up documents 1:00 PM to 4:00 PM. Bring a valid ID.')}
              />
            </List>
          </Section>
        </div>

        {/* Announcements */}
        <Section flush title={t('From the barangay')} id="guest-news" action={<SectionLink onClick={() => setActiveTab('announcements')}>{t('See all')}</SectionLink>}>
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
