import React from 'react';
import { CalendarDays, CircleDot, Compass, FileLock2, FileText, FlaskConical, LifeBuoy, ListTodo, LogOut, Palette, Printer, ScrollText, ShieldCheck, UserRound } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { usePreferences } from '../../context/PreferencesContext';
import { useT } from '../../i18n';
import { Button, StatusPill, Switch } from '../ui';
import { IconCircle, List, ListRow, Page, PageTitle, Section } from '../resident/kit';
import { useGuest } from './access';

/*
 * Account (guests): the resident Account page without an account behind it.
 *   You (browsing as a guest, sign up / sign in) · What an account adds · Settings (Display &
 *   language) · Help (questions, the tour again) · Legal · Developer (npm run dev only) ·
 *   Leave guest mode.
 */

const PERKS: { icon: React.ReactNode; title: string }[] = [
  { icon: <FileText />, title: 'Request documents online' },
  { icon: <Printer />, title: 'Print your files for free' },
  { icon: <CircleDot />, title: 'Book the court' },
  { icon: <CalendarDays />, title: 'Book a visit to the hall' },
  { icon: <ListTodo />, title: 'Follow all your requests in one place' },
];

export const GuestAccount: React.FC = () => {
  const { setActiveTab, sampleData, setSampleData } = useBarangay();
  const { prefs, setPref, resolvedTheme } = usePreferences();
  const { signUp, signIn, leave } = useGuest();
  const t = useT();

  const sizeName = { small: t('Small text'), normal: t('Normal text'), large: t('Large text') }[prefs.textSize];
  const displaySummary = [prefs.language === 'fil' ? 'Filipino' : 'English', resolvedTheme === 'dark' ? t('Dark') : t('Light'), sizeName].join(' · ');

  return (
    <Page>
      <PageTitle title={t('Account')} />

      {/* You: a guest */}
      <Section tour="guest-you">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="w-16 h-16 shrink-0 rounded-full bg-surface-muted text-muted grid place-items-center">
            <UserRound className="w-8 h-8" strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <p className="text-[1.1875rem] font-semibold text-ink leading-tight">{t('Browsing as a guest')}</p>
            <p className="text-meta text-muted mt-0.5">{t('Sign up free to use every service.')}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Button variant="brand" onClick={signUp}>
            {t('Sign up')}
          </Button>
          <Button variant="secondary" onClick={signIn}>
            {t('Sign in')}
          </Button>
        </div>
      </Section>

      <Section flush title={t('With an account you can')} id="ga-perks">
        <List>
          {PERKS.map(p => (
            <ListRow key={p.title} icon={<IconCircle tone="navy">{p.icon}</IconCircle>} title={t(p.title)} />
          ))}
        </List>
      </Section>

      <Section flush title={t('Settings')} id="ga-settings">
        <List>
          <ListRow
            icon={<IconCircle tone="blue"><Palette /></IconCircle>}
            title={t('Display & language')}
            sub={displaySummary}
            onClick={() => setActiveTab('settings')}
          />
        </List>
      </Section>

      <Section flush title={t('Help')} id="ga-help">
        <List>
          <ListRow
            icon={<IconCircle tone="amber"><LifeBuoy /></IconCircle>}
            title={t('Help & questions')}
            sub={t('Common questions and how to reach the barangay')}
            onClick={() => setActiveTab('help')}
          />
          <ListRow
            icon={<IconCircle tone="gray"><Compass /></IconCircle>}
            title={t('Show the tour again')}
            sub={t('A one-minute walk through the app')}
            onClick={() => {
              setPref('tour', true);
              setPref('toursSeen', prefs.toursSeen.filter(id => id !== 'guest'));
              setActiveTab('home'); // the tour starts on Home
            }}
          />
        </List>
      </Section>

      <Section flush title={t('Legal')} id="ga-legal">
        <List>
          <ListRow icon={<IconCircle tone="gray"><ShieldCheck /></IconCircle>} title={t('Privacy Policy')} sub={t('How we collect, use and protect your information')} onClick={() => setActiveTab('privacy_policy')} />
          <ListRow icon={<IconCircle tone="gray"><ScrollText /></IconCircle>} title={t('Terms and Conditions')} sub={t('The rules for using eKapitan')} onClick={() => setActiveTab('terms')} />
          <ListRow icon={<IconCircle tone="gray"><FileLock2 /></IconCircle>} title={t('Data Privacy Notice')} sub={t('A short notice on what we collect and why')} onClick={() => setActiveTab('privacy_notice')} />
        </List>
      </Section>

      {/* Only while building the app (npm run dev). Never shows in the real app (npm run build). */}
      {import.meta.env.DEV && (
        <Section title="Developer" id="ga-dev" tone="warning" action={<StatusPill tone="warning">Dev only</StatusPill>}>
          <div className="-mb-2">
            <Switch
              icon={<FlaskConical />}
              label="Sample data"
              description="Fills the app with made-up requests, reports, bookings and announcements. Turn off to see an empty barangay."
              checked={sampleData}
              onChange={setSampleData}
            />
          </div>
        </Section>
      )}

      <Button variant="secondary" fullWidth onClick={leave}>
        <LogOut className="w-5 h-5" aria-hidden="true" /> {t('Leave guest mode')}
      </Button>
      <p className="text-center text-caption text-muted">eKapitan · {t('version')} 1.0</p>
    </Page>
  );
};
