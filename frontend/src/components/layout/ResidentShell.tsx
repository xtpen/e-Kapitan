import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Bell, ClipboardList, Home, LayoutGrid, LogOut, Moon, Settings, User } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { usePreferences } from '../../context/PreferencesContext';
import { Button, LogoMark, initialsOf } from '../ui';

/*
 * Resident app frame (docs/RESIDENT_UX_BRIEF.md). Four places, the same on every screen size:
 * Home · Services · Requests · Account. The bell (top right) opens Notifications.
 *
 * Phone   top bar   [logo eKapitan            bell]   or on inner pages  [← Services       bell]
 *         bottom bar  Home  Services  Requests  Account   (active: navy icon + label, short bar on top)
 * Desktop top bar   [logo eKapitan   Home  Services  Requests            bell  (avatar ▾)]
 *
 * Badges sit on a fixed 24px icon box, so they always land on the icon's top-right corner.
 */

interface Place {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const PLACES: Place[] = [
  { id: 'home', label: 'Home', icon: <Home /> },
  { id: 'services', label: 'Services', icon: <LayoutGrid /> },
  { id: 'tracking', label: 'Requests', icon: <ClipboardList /> },
  { id: 'account', label: 'Account', icon: <User /> },
];

/** Which main place an inner page belongs to (highlight + back arrow). */
const PARENT: Record<string, string> = {
  documents: 'services',
  request_wizard: 'services',
  complaints: 'services',
  printing: 'services',
  court: 'services',
  appointments: 'services',
  ai_assistant: 'services',
  qr_verify: 'services',
  announcements: 'home',
  notifications: 'home',
  officials_directory: 'account',
  profile: 'account',
  settings: 'account',
};
/** Where the back arrow goes when it isn't the parent itself. */
const BACK_TO: Record<string, string> = { request_wizard: 'documents' };
const LABEL: Record<string, string> = { documents: 'Documents' };

const placeOf = (tab: string) => (PLACES.some(p => p.id === tab) ? tab : PARENT[tab] ?? 'home');
const labelOf = (tab: string) => LABEL[tab] ?? PLACES.find(p => p.id === tab)?.label ?? 'Back';

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

/** Count bubble pinned to the top-right corner of a 24px icon box. */
const Badge: React.FC<{ count: number; tone: 'red' | 'green' }> = ({ count, tone }) =>
  count > 0 ? (
    <span
      aria-hidden="true"
      className={`absolute -top-1.5 left-[15px] min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center
        text-[0.6875rem] leading-none font-bold tabular-nums ring-2 ring-surface
        ${tone === 'red' ? 'bg-danger-fg text-surface' : 'bg-primary text-white'}`}
    >
      {count > 9 ? '9+' : count}
    </span>
  ) : null;

/** A 24px icon box that can carry a badge. */
const IconBox: React.FC<{ icon: React.ReactNode; badge?: React.ReactNode; strong?: boolean }> = ({ icon, badge, strong }) => (
  <span className={`relative w-6 h-6 grid place-items-center [&_svg]:w-6 [&_svg]:h-6 ${strong ? '[&_svg]:stroke-[2.25]' : '[&_svg]:stroke-[1.8]'}`}>
    {icon}
    {badge}
  </span>
);

export interface ResidentShellProps {
  unreadCount?: number;
  readyCount?: number;
  children: React.ReactNode;
}

export const ResidentShell: React.FC<ResidentShellProps> = ({ unreadCount = 0, readyCount = 0, children }) => {
  const { currentUser, activeTab, setActiveTab, setIsAuthenticated } = useBarangay();
  const { setPref, resolvedTheme } = usePreferences();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = placeOf(activeTab);
  const isInner = !PLACES.some(p => p.id === activeTab);
  const backTo = BACK_TO[activeTab] ?? PARENT[activeTab] ?? 'home';

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    setActiveTab(id);
  };

  const badgeFor = (id: string) => (id === 'tracking' ? <Badge count={readyCount} tone="green" /> : null);
  const ariaFor = (p: Place) => (p.id === 'tracking' && readyCount ? `Requests, ${readyCount} ready to pick up` : undefined);

  const bell = (
    <button
      type="button"
      onClick={() => go('notifications')}
      aria-label={unreadCount ? `Notifications, ${unreadCount} new` : 'Notifications'}
      aria-current={activeTab === 'notifications' ? 'page' : undefined}
      className={`w-11 h-11 grid place-items-center rounded-full cursor-pointer transition-colors duration-150
        ${activeTab === 'notifications' ? 'bg-navy-tint text-navy-ink' : 'text-ink hover:bg-surface-muted'}`}
    >
      <IconBox icon={<Bell />} badge={<Badge count={unreadCount} tone="red" />} />
    </button>
  );

  const menuItem = 'w-full flex items-center gap-3 px-3 min-h-11 rounded-control font-semibold text-ink hover:bg-surface-muted cursor-pointer transition-colors';

  return (
    <div className="min-h-svh bg-canvas text-ink">
      {/* ---------- Top bar ---------- */}
      <header className="fixed top-0 inset-x-0 z-40 bg-surface border-b border-line">
        <div className="mx-auto max-w-[1200px] h-14 lg:h-16 px-2 sm:px-4 flex items-center gap-2">
          {/* Left: back on inner pages (phones), brand otherwise */}
          <div className="flex-1 lg:flex-none min-w-0 flex items-center">
            {isInner && (
              <button
                type="button"
                onClick={() => go(backTo)}
                className="lg:hidden inline-flex items-center gap-1 min-h-11 pl-1.5 pr-3 rounded-full font-semibold text-ink cursor-pointer hover:bg-surface-muted"
              >
                <ArrowLeft className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
                <span className="truncate">{labelOf(backTo)}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => go('home')}
              aria-label="eKapitan home"
              className={`${isInner ? 'hidden lg:inline-flex' : 'inline-flex'} items-center gap-2.5 min-h-11 px-2 rounded-control cursor-pointer`}
            >
              <LogoMark size={32} />
              <span className="font-display text-[1.25rem] font-bold text-navy-ink tracking-[-0.01em]">eKapitan</span>
            </button>
          </div>

          {/* Desktop: the places as a text menu */}
          <nav aria-label="Main" className="hidden lg:flex h-full ml-6 gap-1">
            {PLACES.slice(0, 3).map(p => {
              const active = current === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => go(p.id)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={ariaFor(p)}
                  className={`relative h-full px-4 flex items-center gap-2.5 font-semibold cursor-pointer transition-colors duration-150
                    ${active ? 'text-navy-ink' : 'text-muted hover:text-ink'}`}
                >
                  <IconBox icon={p.icon} badge={badgeFor(p.id)} strong={active} />
                  {p.label}
                  {active && (
                    <motion.span
                      layoutId="desk-place"
                      aria-hidden="true"
                      className="absolute left-3 right-3 bottom-0 h-[3px] rounded-t-full bg-navy-ink"
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 lg:ml-auto">
            {bell}
            {/* Desktop: account menu */}
            <div className="relative hidden lg:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className={`ml-1 w-10 h-10 rounded-full bg-navy text-white grid place-items-center font-display font-bold text-sm cursor-pointer
                  transition-[box-shadow] duration-150 hover:ring-4 hover:ring-navy-ink/15 ${current === 'account' ? 'ring-2 ring-navy-ink ring-offset-2 ring-offset-surface' : ''}`}
              >
                {initialsOf(currentUser.name)}
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    role="menu"
                    className="absolute right-0 mt-2 w-72 bg-surface border border-line rounded-card shadow-float p-2 origin-top-right"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.97) translateY(-4px)' }}
                    animate={{ opacity: 1, transform: 'scale(1) translateY(0px)', transition: { duration: 0.16, ease: EASE_OUT } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    <div className="px-3 py-2">
                      <b className="block font-semibold text-ink truncate">{currentUser.name}</b>
                      <span className="text-meta text-muted truncate block">{currentUser.email}</span>
                    </div>
                    <div className="border-t border-line-soft my-1" />
                    <button role="menuitem" type="button" onClick={() => go('account')} className={menuItem}>
                      <User className="w-5 h-5 text-muted" aria-hidden="true" /> Account
                    </button>
                    <button role="menuitem" type="button" onClick={() => go('settings')} className={menuItem}>
                      <Settings className="w-5 h-5 text-muted" aria-hidden="true" /> Settings
                    </button>
                    <button
                      role="menuitemcheckbox"
                      aria-checked={resolvedTheme === 'dark'}
                      type="button"
                      onClick={() => setPref('theme', resolvedTheme === 'dark' ? 'light' : 'dark')}
                      className={`${menuItem} justify-between`}
                    >
                      <span className="flex items-center gap-3">
                        <Moon className="w-5 h-5 text-muted" aria-hidden="true" /> Dark mode
                      </span>
                      <span className="text-caption text-muted">{resolvedTheme === 'dark' ? 'On' : 'Off'}</span>
                    </button>
                    <div className="border-t border-line-soft my-1" />
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmSignOut(true);
                      }}
                      className={`${menuItem} text-danger-fg hover:bg-danger-bg`}
                    >
                      <LogOut className="w-5 h-5" aria-hidden="true" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Page ---------- */}
      <main className="pt-[72px] lg:pt-[88px] pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-12 px-4 sm:px-6">{children}</main>

      {/* ---------- Bottom bar (phones and tablets) ---------- */}
      <nav
        aria-label="Main"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-surface border-t border-line pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto max-w-[560px] grid grid-cols-4">
          {PLACES.map(p => {
            const active = current === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => go(p.id)}
                aria-current={active ? 'page' : undefined}
                aria-label={ariaFor(p)}
                className={`relative h-16 flex flex-col items-center justify-center gap-1 cursor-pointer
                  text-[0.75rem] leading-none transition-colors duration-150 active:bg-surface-muted
                  ${active ? 'text-navy-ink font-semibold' : 'text-muted font-medium'}`}
              >
                {active && (
                  <motion.span
                    layoutId="phone-place"
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -ml-5 w-10 h-[3px] rounded-b-full bg-navy-ink"
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                  />
                )}
                <IconBox icon={p.icon} badge={badgeFor(p.id)} strong={active} />
                {p.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ---------- Sign-out confirmation (desktop menu) ---------- */}
      {createPortal(
        <AnimatePresence>
          {confirmSignOut && (
            <div key="signout" className="fixed inset-0 z-[60] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="rs-signout">
              <motion.div
                className="absolute inset-0 bg-scrim/50"
                onClick={() => setConfirmSignOut(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              />
              <motion.div
                className="relative w-full max-w-sm bg-surface border border-line rounded-card shadow-float p-6"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.97)' }}
                animate={{ opacity: 1, transform: 'scale(1)', transition: { duration: 0.2, ease: EASE_OUT } }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
              >
                <h2 id="rs-signout" className="text-h3-lg font-semibold text-ink">
                  Sign out?
                </h2>
                <p className="text-muted mt-1.5">You can sign in again any time.</p>
                <div className="grid grid-cols-2 gap-2.5 mt-6">
                  <Button variant="secondary" onClick={() => setConfirmSignOut(false)} autoFocus>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setConfirmSignOut(false);
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
    </div>
  );
};
