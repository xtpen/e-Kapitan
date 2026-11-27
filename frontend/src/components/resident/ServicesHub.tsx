import React, { useMemo, useState } from 'react';
import { CalendarDays, CircleDot, FileCheck2, FileText, Landmark, LockKeyhole, Megaphone, MessageCircle, Printer, Search, TriangleAlert, X } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { EmptyState, IconCircle, List, ListRow, Page, PageTitle, Section, type IconTone } from './kit';
import { useT } from '../../i18n';
import { fuzzyFilter } from '../../lib/fuzzy';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { LOCKED_FOR_GUESTS, useGuest } from '../guest/access';

/*
 * Services: the four most used as big tiles, everything else in one list with small category
 * labels, and a closing "Ask Kap" card. The search box understands everyday words in English or Filipino ("clearance", "basura", "print") and
 * forgives typos ("clerance"). The search runs once typing pauses (debounced) and lists the best
 * matches first.
 */

type Service = { id: string; label: string; hint: string; icon: React.ReactNode; tone: IconTone; keywords: string };

const GROUPS: { title: string; items: Service[] }[] = [
  {
    title: 'Request',
    items: [
      { id: 'documents', label: 'Documents', hint: 'Clearance, residency, indigency and more', icon: <FileText />, tone: 'navy', keywords: 'certificate clearance residency indigency business job permit id sertipiko katibayan cedula sedula papeles' },
      { id: 'printing', label: 'Printing', hint: 'Print your files for free', icon: <Printer />, tone: 'green', keywords: 'print pdf word copy school form imprenta kopya xerox' },
    ],
  },
  {
    title: 'Book',
    items: [
      { id: 'court', label: 'Book the court', hint: 'Basketball, events, meetings', icon: <CircleDot />, tone: 'amber', keywords: 'court basketball volleyball event reserve korte basketbol liga paupahan' },
      { id: 'appointments', label: 'Visit the hall', hint: 'Pick a time and skip the line', icon: <CalendarDays />, tone: 'blue', keywords: 'appointment schedule visit office time iskedyul pila opisina' },
    ],
  },
  {
    title: 'Get help',
    items: [
      { id: 'complaints', label: 'Report a problem', hint: 'Noise, garbage, flooding, streetlights', icon: <TriangleAlert />, tone: 'red', keywords: 'complaint report noise garbage flood streetlight dispute neighbor reklamo ingay basura baha ilaw kapitbahay away' },
      { id: 'ai_assistant', label: 'Ask Kap', hint: 'Questions about papers, fees and hours', icon: <MessageCircle />, tone: 'navy', keywords: 'help question chat ask fee requirements hours tanong bayad kailangan oras tulong' },
      { id: 'qr_verify', label: 'Check a document', hint: 'See if a barangay paper is real', icon: <FileCheck2 />, tone: 'gray', keywords: 'verify fake real check code qr peke totoo suriin' },
    ],
  },
  {
    title: 'Barangay info',
    items: [
      { id: 'announcements', label: 'Announcements', hint: 'News, events and schedules', icon: <Megaphone />, tone: 'amber', keywords: 'news advisory event health schedule balita anunsyo abiso' },
      { id: 'officials_directory', label: 'Officials', hint: 'Who leads the barangay', icon: <Landmark />, tone: 'blue', keywords: 'captain kagawad council contact kapitan konsehal opisyal' },
    ],
  },
];

/** Shown first as big tiles, in this order. */
const POPULAR = ['documents', 'complaints', 'court', 'printing'];
/** Shown as the closing "Can't find it?" card instead of a row. */
const HELPER = 'ai_assistant';

export const ServicesHub: React.FC = () => {
  const { setActiveTab } = useBarangay();
  const { isGuest } = useGuest();
  /** Guests: this one needs an account (it opens a sign-up page). */
  const locked = (id: string) => isGuest && LOCKED_FOR_GUESTS.has(id);
  const [q, setQ] = useState('');
  const term = useDebouncedValue(q.trim(), 180);
  const t = useT();

  const searching = term.length > 0;
  const all = GROUPS.flatMap(g => g.items);
  const popular = POPULAR.map(id => all.find(s => s.id === id)!);

  // Browsing: everything that isn't a tile, in one card with small category labels.
  const more = GROUPS.map(g => ({ ...g, items: g.items.filter(s => !POPULAR.includes(s.id) && s.id !== HELPER) })).filter(g => g.items.length > 0);

  // Searching: one list, best match first.
  const results = useMemo(
    () => (term ? fuzzyFilter(all, term, s => ({ primary: `${s.label} ${t(s.label)}`, secondary: `${s.hint} ${t(s.hint)} ${s.keywords}` })) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [term, t],
  );

  const row = (s: Service) => (
    <ListRow
      key={s.id}
      icon={<IconCircle tone={s.tone}>{s.icon}</IconCircle>}
      title={t(s.label)}
      sub={locked(s.id) ? t('Needs a free account') : t(s.hint)}
      trailing={locked(s.id) ? <LockKeyhole className="w-4 h-4 text-muted" aria-label={t('Needs an account')} /> : undefined}
      onClick={() => setActiveTab(s.id)}
    />
  );

  return (
    <Page>
      <PageTitle title={t('Services')} sub={t('What do you need from the barangay?')} />

      <div className="relative" data-tour="svc-search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={t('Search, e.g. clearance or court')}
          aria-label={t('Search services')}
          className="w-full min-h-12 pl-12 pr-12 rounded-control bg-surface border-[1.5px] border-line text-ink placeholder:text-muted/80
            shadow-[0_1px_2px_rgb(16_24_40/0.05)] focus:outline-none focus:border-navy-ink focus:ring-[3px] focus:ring-navy-ink/20 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label={t('Clear search')}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-control text-muted hover:text-ink cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {searching ? (
        results.length === 0 ? (
          <Section>
            <EmptyState
              icon={<Search />}
              title={t('Nothing found for “{q}”', { q: term })}
              sub={t('Try another word, or ask Kap.')}
              action={
                <button type="button" onClick={() => setActiveTab('ai_assistant')} className="min-h-11 px-5 rounded-control bg-navy text-white font-semibold cursor-pointer">
                  {t('Ask Kap')}
                </button>
              }
            />
          </Section>
        ) : (
          <>
            <p role="status" className="sr-only">
              {results.length === 1 ? t('1 result') : t('{n} results', { n: results.length })}
            </p>
            <Section flush title={t('Results')} id="svc-results">
              <List>{results.map(row)}</List>
            </Section>
          </>
        )
      ) : (
        <>
          <section aria-labelledby="svc-popular" data-tour="svc-popular">
            <h2 id="svc-popular" className="px-1 mb-2 text-meta font-semibold text-muted">
              {t('Most used')}
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {popular.map(s => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(s.id)}
                    className="w-full h-full min-h-[136px] flex flex-col items-start gap-3 p-4 rounded-card bg-surface border border-line text-left cursor-pointer
                      shadow-[0_1px_2px_rgb(16_24_40/0.05)] transition-[scale,box-shadow,border-color] duration-150 ease-out-strong
                      active:scale-[0.97] hover:shadow-float hover:border-navy-ink/25"
                  >
                    <span className="relative">
                      <IconCircle tone={s.tone} size="lg">
                        {s.icon}
                      </IconCircle>
                      {locked(s.id) && (
                        <span aria-hidden="true" className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-surface border border-line grid place-items-center text-muted">
                          <LockKeyhole className="w-3 h-3" strokeWidth={2.4} />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink leading-tight">{t(s.label)}</span>
                      <span className="mt-1 text-caption text-muted leading-snug line-clamp-2">{t(s.hint)}</span>
                      {locked(s.id) && <span className="sr-only">, {t('Needs an account')}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <Section flush title={t('More services')} id="svc-more">
            {more.map((g, i) => (
              <div key={g.title} role="group" aria-labelledby={`svc-g-${i}`} className={i > 0 ? 'border-t border-line-soft' : ''}>
                <p id={`svc-g-${i}`} className="px-4 sm:px-5 pt-3 -mb-1 text-caption font-semibold uppercase tracking-[0.06em] text-muted">
                  {t(g.title)}
                </p>
                <List>{g.items.map(row)}</List>
              </div>
            ))}
          </Section>

          {/* Closing helper: when the list doesn't have it, Ask Kap probably knows. */}
          <section className="rounded-[18px] bg-navy-tint p-4 sm:p-5 grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3">
            <IconCircle tone="navy" size="lg" className="!bg-surface">
              <MessageCircle />
            </IconCircle>
            <div className="min-w-0">
              <h2 className="font-semibold text-navy-ink leading-tight">{t('Can’t find what you need?')}</h2>
              <p className="text-meta text-ink/80 mt-0.5">{t('Ask Kap about papers, fees and office hours.')}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab(HELPER)}
              className="col-span-2 sm:col-span-1 min-h-11 px-5 rounded-control bg-navy text-white font-semibold cursor-pointer inline-flex items-center justify-center gap-2
                transition-[scale,background-color] duration-150 ease-out-strong hover:bg-navy-deep active:scale-[0.97]"
            >
              {t('Ask Kap')}
            </button>
          </section>
        </>
      )}
    </Page>
  );
};
