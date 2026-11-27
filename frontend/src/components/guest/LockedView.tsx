import React from 'react';
import { Bell, CalendarDays, CircleDot, FileCheck2, FileText, LockKeyhole, MessageCircle, Printer, ScanSearch, TriangleAlert, UserRound } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { useT } from '../../i18n';
import { Button } from '../ui';
import { IconCircle, List, ListRow, Page, Section, type IconTone } from '../resident/kit';
import { useGuest } from './access';

/** What each locked page is, in a guest's words. */
const FEATURE: Record<string, { title: string; text: string; icon: React.ReactNode; tone: IconTone }> = {
  documents: { title: 'Sign up to request documents', text: 'Request a clearance, residency or indigency online, then pick it up at the hall.', icon: <FileText />, tone: 'navy' },
  request_wizard: { title: 'Sign up to request documents', text: 'Request a clearance, residency or indigency online, then pick it up at the hall.', icon: <FileText />, tone: 'navy' },
  printing: { title: 'Sign up to print your files', text: 'Send a file from your phone and pick up the printout at the hall, for free.', icon: <Printer />, tone: 'green' },
  court: { title: 'Sign up to book the court', text: 'See free times and book the court for games, events or meetings.', icon: <CircleDot />, tone: 'amber' },
  appointments: { title: 'Sign up to visit the hall', text: 'Pick a time for your visit and skip the line.', icon: <CalendarDays />, tone: 'blue' },
  notifications: { title: 'Sign up for updates', text: 'Get told when a request moves along or is ready to pick up.', icon: <Bell />, tone: 'red' },
  profile: { title: 'Sign up for your own profile', text: 'Keep your details in one place so forms fill themselves.', icon: <UserRound />, tone: 'navy' },
  account_security: { title: 'Sign up for your own account', text: 'Your requests stay private behind your own password.', icon: <LockKeyhole />, tone: 'green' },
  notify_settings: { title: 'Sign up for updates', text: 'Choose to get updates by text message or email.', icon: <Bell />, tone: 'red' },
};

/** A page a guest can't use yet: what it does, why an account, sign up / sign in, and what works now. */
export const LockedView: React.FC<{ tab: string }> = ({ tab }) => {
  const { setActiveTab } = useBarangay();
  const { signUp, signIn } = useGuest();
  const t = useT();
  const f = FEATURE[tab] ?? FEATURE.documents;

  return (
    <Page>
      <Section className="text-center">
        <div className="grid justify-items-center gap-1 py-4">
          <span className="relative">
            <IconCircle tone={f.tone} size="lg" className="!w-16 !h-16 [&_svg]:!w-8 [&_svg]:!h-8">
              {f.icon}
            </IconCircle>
            <span aria-hidden="true" className="absolute -right-1 -bottom-1 w-7 h-7 rounded-full bg-surface border border-line grid place-items-center text-muted">
              <LockKeyhole className="w-3.5 h-3.5" strokeWidth={2.2} />
            </span>
          </span>
          <h1 className="mt-4 font-display text-[1.375rem] sm:text-[1.5rem] font-bold text-ink leading-tight">{t(f.title)}</h1>
          <p className="text-muted max-w-[34ch]">{t(f.text)}</p>
          <p className="mt-1 text-meta text-muted max-w-[38ch]">{t('An account lets the barangay know the request is really from you. It is free.')}</p>
          <div className="mt-5 w-full max-w-[320px] grid gap-2.5">
            <Button variant="brand" fullWidth onClick={signUp}>
              {t('Sign up')}
            </Button>
            <Button variant="secondary" fullWidth onClick={signIn}>
              {t('I have an account')}
            </Button>
          </div>
        </div>
      </Section>

      <Section flush title={t('You can do these now')} id="locked-now">
        <List>
          <ListRow icon={<IconCircle tone="red"><TriangleAlert /></IconCircle>} title={t('Report a problem')} sub={t('No account needed')} onClick={() => setActiveTab('complaints')} />
          <ListRow icon={<IconCircle tone="blue"><ScanSearch /></IconCircle>} title={t('Track a request')} sub={t('With its tracking number')} onClick={() => setActiveTab('tracking')} />
          <ListRow icon={<IconCircle tone="gray"><FileCheck2 /></IconCircle>} title={t('Check a document')} sub={t('See if a barangay paper is real')} onClick={() => setActiveTab('qr_verify')} />
          <ListRow icon={<IconCircle tone="navy"><MessageCircle /></IconCircle>} title={t('Ask Kap')} sub={t('Questions about papers, fees and hours')} onClick={() => setActiveTab('ai_assistant')} />
        </List>
      </Section>
    </Page>
  );
};
