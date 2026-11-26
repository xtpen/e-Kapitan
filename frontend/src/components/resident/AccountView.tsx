import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bell, ChevronRight, Compass, FileLock2, LifeBuoy, LockKeyhole, LogOut, Palette, ScrollText, ShieldCheck, UserRound } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { usePreferences } from '../../context/PreferencesContext';
import { Button, StatusPill, initialsOf } from '../ui';
import { IconCircle, List, ListRow, Page, PageTitle, Section } from './kit';
import { useResidentActivity } from './useResidentActivity';
import { useT } from '../../i18n';

/*
 * Account: about you, not a wall of switches.
 *   You (who you are, verified or not) · Your requests at a glance · Your account (profile,
 *   password & security) · Settings (two links into the Settings page, each showing what is
 *   set now) · Help · Legal (privacy policy, terms, data privacy notice) · Sign out.
 * Barangay pages (announcements, officials, check a document) and Ask Kap live on Services.
 */

export const AccountView: React.FC = () => {
  const { currentUser, residents, setActiveTab, setIsAuthenticated } = useBarangay();
  const { prefs, setPref, resolvedTheme } = usePreferences();
  const { rows, activeCount, readyCount } = useResidentActivity();
  const reduceMotion = useReducedMotion();
  const [confirm, setConfirm] = useState(false);
  const t = useT();

  const resident = residents.find(r => r.id === currentUser.residentId);
  const verified = !resident || resident.status === 'active';
  const where = resident?.address ?? '';

  const sizeName = { small: t('Small text'), normal: t('Normal text'), large: t('Large text') }[prefs.textSize];
  const displaySummary = [prefs.language === 'fil' ? 'Filipino' : 'English', resolvedTheme === 'dark' ? t('Dark') : t('Light'), sizeName].join(' · ');
  const channels = [prefs.notifySms && t('text message'), prefs.notifyEmail && t('email')].filter(Boolean) as string[];
  const notifySummary = channels.length ? t('In the app and by {ways}', { ways: channels.join(t(' and ')) }) : t('In the app only');

  const counts = [
    { label: t('Ongoing'), n: Math.max(0, activeCount - readyCount) },
    { label: t('Ready to pick up'), n: readyCount, strong: readyCount > 0 },
    { label: t('Done'), n: rows.length - activeCount },
  ];

  return (
    <Page>
      <PageTitle title={t('Account')} />

      {/* You */}
      <Section flush>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="w-full flex items-center gap-4 p-4 sm:p-5 text-left cursor-pointer hover:bg-surface-muted active:bg-surface-muted transition-colors duration-150"
        >
          <span aria-hidden="true" className="w-16 h-16 shrink-0 rounded-full bg-navy text-white grid place-items-center font-display font-bold text-xl">
            {initialsOf(currentUser.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[1.1875rem] font-semibold text-ink leading-tight break-words">{currentUser.name}</span>
            {where && <span className="block text-meta text-muted leading-snug mt-0.5 truncate">{where}</span>}
            <span className="block mt-1.5">
              {verified ? <StatusPill tone="success">{t('Verified resident')}</StatusPill> : <StatusPill tone="warning">{t('Not verified yet')}</StatusPill>}
            </span>
          </span>
          <ChevronRight className="w-5 h-5 shrink-0 text-muted" aria-hidden="true" />
          <span className="sr-only">{t('Open your profile')}</span>
        </button>

        {/* Your requests at a glance */}
        <div className="grid grid-cols-3 border-t border-line-soft divide-x divide-line-soft">
          {counts.map(c => (
            <button
              key={c.label}
              type="button"
              onClick={() => setActiveTab('tracking')}
              className="min-h-16 px-2 py-3 grid content-center justify-items-center gap-0.5 cursor-pointer hover:bg-surface-muted active:bg-surface-muted transition-colors duration-150"
            >
              <span className={`font-display text-[1.375rem] font-bold leading-none tabular-nums ${c.strong ? 'text-success-fg' : 'text-ink'}`}>{c.n}</span>
              <span className="text-caption text-muted text-center leading-tight">{c.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section flush title={t('Your account')} id="acc-account" tour="acc-account">
        <List>
          <ListRow
            icon={<IconCircle tone="navy"><UserRound /></IconCircle>}
            title={t('Your profile')}
            sub={t('Personal details, mobile number and email')}
            onClick={() => setActiveTab('profile')}
          />
          <ListRow
            icon={<IconCircle tone="green"><LockKeyhole /></IconCircle>}
            title={t('Password & security')}
            sub={t('Password, signed-in devices and privacy')}
            onClick={() => setActiveTab('account_security')}
          />
        </List>
      </Section>

      <Section flush title={t('Settings')} id="acc-prefs" tour="acc-prefs">
        <List>
          <ListRow
            icon={<IconCircle tone="blue"><Palette /></IconCircle>}
            title={t('Display & language')}
            sub={displaySummary}
            onClick={() => setActiveTab('settings')}
          />
          <ListRow
            icon={<IconCircle tone="amber"><Bell /></IconCircle>}
            title={t('Notifications')}
            sub={notifySummary}
            onClick={() => setActiveTab('notify_settings')}
          />
        </List>
      </Section>

      <Section flush title={t('Help')} id="acc-help">
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
              setPref('toursSeen', []);
              setActiveTab('home'); // the tour starts on Home
            }}
          />
        </List>
      </Section>

      <Section flush title={t('Legal')} id="acc-legal">
        <List>
          <ListRow
            icon={<IconCircle tone="gray"><ShieldCheck /></IconCircle>}
            title={t('Privacy Policy')}
            sub={t('How we collect, use and protect your information')}
            onClick={() => setActiveTab('privacy_policy')}
          />
          <ListRow
            icon={<IconCircle tone="gray"><ScrollText /></IconCircle>}
            title={t('Terms and Conditions')}
            sub={t('The rules for using eKapitan')}
            onClick={() => setActiveTab('terms')}
          />
          <ListRow
            icon={<IconCircle tone="gray"><FileLock2 /></IconCircle>}
            title={t('Data Privacy Notice')}
            sub={t('A short notice on what we collect and why')}
            onClick={() => setActiveTab('privacy_notice')}
          />
        </List>
      </Section>

      <Button variant="secondary" fullWidth onClick={() => setConfirm(true)}>
        <LogOut className="w-5 h-5" aria-hidden="true" /> {t('Sign out')}
      </Button>
      <p className="text-center text-caption text-muted">eKapitan · {t('version')} 1.0</p>

      {createPortal(
        <AnimatePresence>
          {confirm && (
            <div key="signout" className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4" role="alertdialog" aria-modal="true" aria-labelledby="acc-signout">
              <motion.div
                className="absolute inset-0 bg-scrim/50"
                onClick={() => setConfirm(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              />
              <motion.div
                className="relative w-full sm:max-w-sm bg-surface rounded-t-banner sm:rounded-card shadow-float p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
                initial={reduceMotion ? { opacity: 0 } : { y: '100%' }}
                animate={reduceMotion ? { opacity: 1 } : { y: 0, transition: { type: 'spring', stiffness: 420, damping: 40 } }}
                exit={reduceMotion ? { opacity: 0 } : { y: '100%', transition: { duration: 0.2 } }}
              >
                <h2 id="acc-signout" className="text-h3-lg font-semibold text-ink">
                  {t('Sign out?')}
                </h2>
                <p className="text-muted mt-1.5">{t('You can sign in again any time.')}</p>
                <div className="grid grid-cols-2 gap-2.5 mt-6">
                  <Button variant="secondary" onClick={() => setConfirm(false)} autoFocus>
                    {t('Cancel')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setConfirm(false);
                      setIsAuthenticated(false);
                    }}
                  >
                    {t('Sign out')}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </Page>
  );
};
