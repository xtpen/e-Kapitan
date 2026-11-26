import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bell, ClipboardList, FileCheck2, Landmark, LogOut, Megaphone, MessageCircle, Moon, Settings, Type } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { usePreferences } from '../../context/PreferencesContext';
import { Button, StatusPill, Switch, initialsOf } from '../ui';
import { IconCircle, List, ListRow, Page, PageTitle, Section } from './kit';

/*
 * Account: you at the top (opens your profile), then plain lists: your things, quick display
 * switches, help and info, and Sign out at the end.
 */

export const AccountView: React.FC = () => {
  const { currentUser, setActiveTab, largeTextMode, setLargeTextMode, setIsAuthenticated } = useBarangay();
  const { setPref, resolvedTheme } = usePreferences();
  const reduceMotion = useReducedMotion();
  const [confirm, setConfirm] = useState(false);

  return (
    <Page>
      <PageTitle title="Account" />

      <Section flush>
        <ListRow
          icon={
            <span aria-hidden="true" className="w-14 h-14 shrink-0 rounded-full bg-navy text-white grid place-items-center font-display font-bold text-lg">
              {initialsOf(currentUser.name)}
            </span>
          }
          title={<span className="text-[1.0625rem]">{currentUser.name}</span>}
          sub="See your profile"
          trailing={<StatusPill tone="success">Verified</StatusPill>}
          onClick={() => setActiveTab('profile')}
          className="min-h-20"
        />
      </Section>

      <Section flush title="Yours" id="acc-yours">
        <List>
          <ListRow icon={<IconCircle tone="navy"><ClipboardList /></IconCircle>} title="My requests" onClick={() => setActiveTab('tracking')} />
          <ListRow icon={<IconCircle tone="red"><Bell /></IconCircle>} title="Notifications" onClick={() => setActiveTab('notifications')} />
        </List>
      </Section>

      <Section flush title="Display" id="acc-display">
        <div className="px-4 sm:px-5 divide-y divide-line-soft">
          <Switch icon={<Moon />} label="Dark mode" checked={resolvedTheme === 'dark'} onChange={v => setPref('theme', v ? 'dark' : 'light')} />
          <Switch icon={<Type />} label="Large text" checked={largeTextMode} onChange={v => setLargeTextMode(v)} />
        </div>
        <List className="border-t border-line-soft">
          <ListRow icon={<IconCircle tone="gray"><Settings /></IconCircle>} title="All settings" onClick={() => setActiveTab('settings')} />
        </List>
      </Section>

      <Section flush title="Help and info" id="acc-help">
        <List>
          <ListRow icon={<IconCircle tone="navy"><MessageCircle /></IconCircle>} title="Ask Kap" sub="Questions about papers, fees and hours" onClick={() => setActiveTab('ai_assistant')} />
          <ListRow icon={<IconCircle tone="amber"><Megaphone /></IconCircle>} title="Announcements" onClick={() => setActiveTab('announcements')} />
          <ListRow icon={<IconCircle tone="blue"><Landmark /></IconCircle>} title="Officials" onClick={() => setActiveTab('officials_directory')} />
          <ListRow icon={<IconCircle tone="gray"><FileCheck2 /></IconCircle>} title="Check a document" onClick={() => setActiveTab('qr_verify')} />
        </List>
      </Section>

      <Button variant="secondary" fullWidth onClick={() => setConfirm(true)}>
        <LogOut className="w-5 h-5" aria-hidden="true" /> Sign out
      </Button>

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
                initial={reduceMotion ? { opacity: 0 } : { transform: 'translateY(32px)', opacity: 0 }}
                animate={{ transform: 'translateY(0px)', opacity: 1, transition: { duration: 0.26, ease: [0.23, 1, 0.32, 1] } }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
              >
                <h2 id="acc-signout" className="text-h3-lg font-semibold text-ink">
                  Sign out?
                </h2>
                <p className="text-muted mt-1.5">You can sign in again any time.</p>
                <div className="grid grid-cols-2 gap-2.5 mt-6">
                  <Button variant="secondary" onClick={() => setConfirm(false)} autoFocus>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setConfirm(false);
                      setIsAuthenticated(false);
                    }}
                  >
                    Sign out
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
