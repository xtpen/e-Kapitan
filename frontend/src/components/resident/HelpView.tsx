import React, { useId, useMemo, useState } from 'react';
import { Building2, ChevronDown, MessageCircle, QrCode, Search, SearchX } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { useT } from '../../i18n';
import { Expand, Input } from '../ui';
import { EmptyState, IconCircle, List, ListRow, Page, PageTitle, Section } from './kit';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I get a clearance?',
    a: 'Go to Services, choose Documents, then pick Barangay Clearance. Fill in the short form and send it. We tell you when it is ready.',
  },
  {
    q: 'How much are fees?',
    a: 'It depends on the document. Some are free. You see the fee before you send your request, and you pay when you pick up.',
  },
  {
    q: 'When can I pick up?',
    a: 'When your request says "Ready". Pick up on weekdays, 1:00 PM to 4:00 PM, at the barangay hall.',
  },
  {
    q: 'What do I bring?',
    a: 'A valid ID and your tracking number. Each document lists anything else under "What to bring".',
  },
  {
    q: 'Can someone else pick up for me?',
    a: 'Yes. Give them a signed note saying they can pick up for you, a copy of your ID, and their own ID.',
  },
  {
    q: 'How do I report a problem?',
    a: 'Go to Services and choose Report a problem. Say what happened and where. You can add a photo.',
  },
  {
    q: 'How do I book the court?',
    a: 'Go to Services and choose Book the court. Pick a day and a free time, then send your booking.',
  },
  {
    q: 'I forgot my password.',
    a: 'On the sign-in page, tap "Forgot your password?". We send a 6-digit code to your mobile number so you can set a new one.',
  },
];

/** One question that opens its answer in place. Looks exactly like a ListRow. */
const FaqRow: React.FC<{ q: string; a: string; open: boolean; onToggle: () => void }> = ({ q, a, open, onToggle }) => {
  const id = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="w-full min-h-16 flex items-center gap-3 px-4 sm:px-5 py-3 text-left cursor-pointer hover:bg-surface-muted transition-colors duration-150 active:bg-surface-muted"
      >
        <span className="min-w-0 flex-1 font-semibold text-ink leading-snug">{q}</span>
        <ChevronDown
          aria-hidden="true"
          className={`w-5 h-5 shrink-0 text-muted transition-transform duration-200 ease-out-strong ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <Expand show={open}>
        <p id={id} className="px-4 sm:px-5 pb-4 text-ink">
          {a}
        </p>
      </Expand>
    </div>
  );
};

/** Resident · Help. */
export const HelpView: React.FC = () => {
  const { setActiveTab } = useBarangay();
  const t = useT();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  // `key` stays the English question so an open answer survives a language switch.
  const faqs = useMemo(() => FAQS.map(f => ({ key: f.q, q: t(f.q), a: t(f.a) })), [t]);

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return faqs;
    return faqs.filter(f => {
      const text = `${f.q} ${f.a}`.toLowerCase();
      return words.every(w => text.includes(w));
    });
  }, [query, faqs]);

  return (
    <Page>
      <PageTitle title={t('Help')} />

      <div className="relative">
        <label htmlFor="help-search" className="sr-only">
          {t('Search questions')}
        </label>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <Input
          id="help-search"
          type="search"
          placeholder={t('Search questions')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-11"
        />
      </div>

      <Section flush title={t('Common questions')} id="help-faq">
        {shown.length ? (
          <List>
            {shown.map(f => (
              <FaqRow key={f.key} q={f.q} a={f.a} open={open === f.key} onToggle={() => setOpen(o => (o === f.key ? null : f.key))} />
            ))}
          </List>
        ) : (
          <EmptyState icon={<SearchX />} title={t('No questions match')} sub={t('Try another word, or ask Kap below.')} />
        )}
      </Section>

      <Section flush title={t('Get help')} id="help-get">
        <List>
          <ListRow
            icon={
              <IconCircle>
                <MessageCircle />
              </IconCircle>
            }
            title={t('Ask Kap')}
            sub={t('Get an answer right away')}
            onClick={() => setActiveTab('ai_assistant')}
          />
          <ListRow
            icon={
              <IconCircle>
                <Building2 />
              </IconCircle>
            }
            title={t('Visit the hall')}
            sub={t('Weekdays, 8:00 AM to 5:00 PM')}
            onClick={() => setActiveTab('appointments')}
          />
          <ListRow
            icon={
              <IconCircle>
                <QrCode />
              </IconCircle>
            }
            title={t('Check a document')}
            sub={t('See if a paper from us is real')}
            onClick={() => setActiveTab('qr_verify')}
          />
        </List>
      </Section>
    </Page>
  );
};
