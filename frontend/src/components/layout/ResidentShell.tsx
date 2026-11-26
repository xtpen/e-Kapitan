import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Bell, BotMessageSquare, CircleUserRound, House, LayoutGrid, ListTodo, LogOut, Moon, RotateCw, Settings } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { usePreferences } from '../../context/PreferencesContext';
import { Button, LogoMark, initialsOf } from '../ui';
import { useT } from '../../i18n';
import { canHistoryBack, historyMoved, historyPush, historyStart, isPlace, markBack, neighbourPlace, peekBack, placeOf } from './residentNav';

/*
 * Resident app frame (docs/RESIDENT_UX_BRIEF.md). Five places, icons only, each with an
 * accessible name: Home · Services · Ask Kap · Requests · Account. The bell opens Notifications.
 *
 * Phone   top bar [logo eKapitan        bell]   inner pages [← Requests        bell]
 *         a bar fixed along the bottom edge; the active place's icon fills in navy with a
 *         small dot under it that slides between tabs
 *         Gestures: swipe left/right between places · pull down at the top to refresh ·
 *         drag from the left edge to pull the page away and go back (the page follows the finger)
 * Desktop top bar [logo eKapitan  (icons)                     bell  avatar▾]
 *
 * Back always returns to the page you came from (browser history), so the phone's own back
 * button and back gesture work the same way.
 */

interface Place {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const PLACES: Place[] = [
  { id: 'home', label: 'Home', icon: <House /> },
  { id: 'services', label: 'Services', icon: <LayoutGrid /> },
  { id: 'ai_assistant', label: 'Ask Kap', icon: <BotMessageSquare /> },
  { id: 'tracking', label: 'Requests', icon: <ListTodo /> },
  { id: 'account', label: 'Account', icon: <CircleUserRound /> },
];

/** Short page names for the Back button. */
const TITLE: Record<string, string> = {
  home: 'Home',
  services: 'Services',
  ai_assistant: 'Ask Kap',
  tracking: 'Requests',
  account: 'Account',
  documents: 'Documents',
  request_wizard: 'Request form',
  notifications: 'Notifications',
  complaints: 'Report a problem',
  printing: 'Printing',
  court: 'Book the court',
  appointments: 'Visit the hall',
  qr_verify: 'Check a document',
  announcements: 'Announcements',
  officials_directory: 'Officials',
  profile: 'Profile',
  settings: 'Display & language',
  notify_settings: 'Notifications',
  privacy_policy: 'Privacy Policy',
  terms: 'Terms and Conditions',
  privacy_notice: 'Data Privacy Notice',
  account_security: 'Password & security',
  help: 'Help',
};

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SLIDE = { type: 'spring' as const, stiffness: 500, damping: 40 };

/** A short buzz on supporting phones (Android). Silently skipped elsewhere. */
export const haptic = (ms = 8) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* not supported */
  }
};

/** Ask the current page to reload its data (App shows the page's skeleton briefly). */
export const requestRefresh = () => window.dispatchEvent(new CustomEvent('ekapitan:refresh'));

/** Tell the page that it is being dragged away from the left edge (App moves it). */
const edgeEvent = (phase: 'move' | 'commit' | 'cancel', x = 0) =>
  window.dispatchEvent(new CustomEvent('ekapitan:edge', { detail: { phase, x } }));

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

/** 24px icon box; an active icon is drawn heavier and filled with a light tint of its colour. */
const IconBox: React.FC<{ icon: React.ReactNode; badge?: React.ReactNode; active?: boolean }> = ({ icon, badge, active }) => (
  <span
    className={`relative w-6 h-6 grid place-items-center [&_svg]:w-6 [&_svg]:h-6 [&_svg]:transition-[stroke-width,fill] [&_svg]:duration-200
      ${active ? '[&_svg]:stroke-[2.25] [&_svg]:fill-navy-ink/15' : '[&_svg]:stroke-[1.8] [&_svg]:fill-transparent'}`}
  >
    {icon}
    {badge}
  </span>
);

/* ---------- touch gestures ---------- */

const PULL_TRIGGER = 72;
const EDGE = 28;
const SWIPE_TRIGGER = 72;

/** True when the touch started inside something that scrolls sideways (a carousel, chips). */
const inSideScroller = (el: HTMLElement | null) => {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const s = getComputedStyle(n);
    if ((s.overflowX === 'auto' || s.overflowX === 'scroll') && n.scrollWidth > n.clientWidth + 2) return true;
  }
  return false;
};

type Mode = 'undecided' | 'pull' | 'edge' | 'swipe' | 'none';

const useGestures = (activeTab: string, onEdgeBack: () => void, onPlace: (id: string) => void) => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [swipe, setSwipe] = useState(0);
  const start = useRef<{ x: number; y: number; t: number; mode: Mode; atTop: boolean; edgeOk: boolean; swipeOk: boolean } | null>(null);
  const live = useRef({ activeTab, onEdgeBack, onPlace, refreshing: false, value: 0 });
  live.current.activeTab = activeTab;
  live.current.onEdgeBack = onEdgeBack;
  live.current.onPlace = onPlace;
  live.current.refreshing = refreshing;

  useEffect(() => {
    if (!('ontouchstart' in window)) return;
    const html = document.documentElement;
    const prev = html.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = 'contain'; // our pull-to-refresh replaces the browser's

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || live.current.refreshing) return;
      const t = e.touches[0];
      const target = e.target as HTMLElement;
      // Not on form fields, dialogs, toasts, the bars, or anything marked to keep its own gestures.
      if (target.closest('input, textarea, select, [role="dialog"], [data-no-gesture], header, nav[aria-label="Main"]')) {
        start.current = null;
        return;
      }
      const tab = live.current.activeTab;
      start.current = {
        x: t.clientX,
        y: t.clientY,
        t: performance.now(),
        mode: 'undecided',
        atTop: window.scrollY <= 0,
        edgeOk: !isPlace(tab) && t.clientX <= EDGE,
        swipeOk: isPlace(tab) && !inSideScroller(target),
      };
    };

    const onMove = (e: TouchEvent) => {
      const s = start.current;
      if (!s || s.mode === 'none') return;
      const t = e.touches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;

      if (s.mode === 'undecided') {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        const sideways = Math.abs(dx) > Math.abs(dy) * 1.2;
        if (s.edgeOk && sideways && dx > 0) s.mode = 'edge';
        else if (s.swipeOk && sideways) s.mode = 'swipe';
        else if (s.atTop && !sideways && dy > 0) s.mode = 'pull';
        else s.mode = 'none';
        if (s.mode === 'none') return;
      }

      if (s.mode === 'edge') {
        const v = Math.max(0, dx);
        live.current.value = v;
        edgeEvent('move', v);
      } else if (s.mode === 'swipe') {
        const next = neighbourPlace(live.current.activeTab, dx < 0 ? 1 : -1);
        const v = next ? dx : dx * 0.25; // no neighbour that way: resist
        live.current.value = v;
        setSwipe(v);
      } else if (s.mode === 'pull') {
        if (window.scrollY > 0) return;
        const v = Math.min(Math.max(dy, 0) * 0.5, 110);
        live.current.value = v;
        setPull(v);
      }
      if (e.cancelable) e.preventDefault();
    };

    const onEnd = () => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const v = live.current.value;
      live.current.value = 0;
      const fast = Math.abs(v) / Math.max(1, performance.now() - s.t) > 0.5; // px per ms
      if (s.mode === 'edge') {
        if (v > window.innerWidth * 0.33 || (fast && v > 40)) {
          haptic(10);
          edgeEvent('commit');
          window.setTimeout(() => live.current.onEdgeBack(), 200);
        } else edgeEvent('cancel');
      } else if (s.mode === 'swipe') {
        const next = neighbourPlace(live.current.activeTab, v < 0 ? 1 : -1);
        if (next && (Math.abs(v) >= SWIPE_TRIGGER || (fast && Math.abs(v) > 30))) {
          haptic(6);
          live.current.onPlace(next);
        }
        setSwipe(0);
      } else if (s.mode === 'pull') {
        if (v >= PULL_TRIGGER) {
          haptic(12);
          setRefreshing(true);
          setPull(PULL_TRIGGER);
          requestRefresh();
          window.setTimeout(() => {
            setRefreshing(false);
            setPull(0);
          }, 900);
        } else setPull(0);
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      html.style.overscrollBehaviorY = prev;
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  return { pull, refreshing, swipe };
};

export interface ResidentShellProps {
  unreadCount?: number;
  readyCount?: number;
  children: React.ReactNode;
}

export const ResidentShell: React.FC<ResidentShellProps> = ({ unreadCount = 0, readyCount = 0, children }) => {
  const { currentUser, activeTab, setActiveTab, setIsAuthenticated } = useBarangay();
  const { setPref, resolvedTheme } = usePreferences();
  const reduceMotion = useReducedMotion();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = placeOf(activeTab);
  const isInner = !isPlace(activeTab);
  const backTarget = peekBack(activeTab);

  /* ---------- history: Back returns to where you came from ---------- */
  const fromHistory = useRef<string | null>(null);
  useEffect(() => {
    historyStart(activeTab);
    const onPop = (e: PopStateEvent) => {
      const tab = historyMoved(e.state);
      if (!tab) return;
      fromHistory.current = tab;
      setActiveTab(tab);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (fromHistory.current === activeTab) {
      fromHistory.current = null;
      return;
    }
    historyPush(activeTab);
  }, [activeTab]);

  const goBack = (instant = false) => {
    const to = peekBack(activeTab);
    markBack(to, instant);
    if (canHistoryBack()) {
      history.back();
    } else {
      // Opened directly (no earlier page this session): go to the page's parent instead.
      historyStart(to);
      fromHistory.current = to;
      setActiveTab(to);
    }
  };

  const go = (id: string) => {
    setMenuOpen(false);
    setActiveTab(id);
  };
  const { pull, refreshing, swipe } = useGestures(activeTab, () => goBack(true), id => go(id));

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

  const badgeFor = (id: string) => (id === 'tracking' ? <Badge count={readyCount} tone="green" /> : null);
  const nameFor = (p: Place) => (p.id === 'tracking' && readyCount ? t('Requests, {n} ready to pick up', { n: readyCount }) : t(p.label));
  const menuItem = 'w-full flex items-center gap-3 px-3 min-h-11 rounded-control font-semibold text-ink hover:bg-surface-muted cursor-pointer transition-colors';

  // While a finger is on the page it follows a little (pull down, or sideways between places).
  const dragStyle: React.CSSProperties | undefined =
    swipe !== 0
      ? { transform: `translateX(${swipe * 0.35}px)`, opacity: 1 - Math.min(Math.abs(swipe) / 600, 0.25) }
      : pull > 0 && !refreshing
        ? { transform: `translateY(${pull * 0.4}px)` }
        : undefined;

  return (
    <div className="min-h-svh bg-canvas text-ink">
      {/* ---------- Top bar ---------- */}
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/95 border-b border-line">
        <div className="mx-auto max-w-[1200px] h-14 lg:h-16 px-2 sm:px-4 flex items-center gap-2">
          <div className="flex-1 lg:flex-none min-w-0 flex items-center">
            {isInner && (
              <button
                type="button"
                onClick={() => goBack()}
                aria-label={t('Back to {page}', { page: t(TITLE[backTarget] ?? 'previous page') })}
                className="lg:hidden inline-flex items-center gap-1 min-h-11 pl-1.5 pr-3 rounded-full font-semibold text-ink cursor-pointer
                  hover:bg-surface-muted active:scale-[0.97] transition-[background-color,scale] duration-150"
              >
                <ArrowLeft className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
                <span className="truncate">{t(TITLE[backTarget] ?? 'Back')}</span>
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

          {/* Desktop: the places as icons with tooltips (Account is the avatar on the right) */}
          <nav aria-label="Main" className="hidden lg:flex flex-1 justify-center gap-1">
            {PLACES.filter(p => p.id !== 'account').map(p => {
              const active = current === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  data-tour={`nav-${p.id}`}
                  onClick={() => go(p.id)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={nameFor(p)}
                  className={`group relative w-[84px] h-16 grid place-items-center cursor-pointer transition-colors duration-150
                    ${active ? 'text-navy-ink' : 'text-muted hover:text-ink'}`}
                >
                  <span className="relative grid place-items-center w-14 h-10 rounded-full transition-colors group-hover:bg-surface-muted">
                    <IconBox icon={p.icon} badge={badgeFor(p.id)} active={active} />
                  </span>
                  {active && (
                    <motion.span
                      layoutId="desk-place"
                      aria-hidden="true"
                      className="absolute bottom-1.5 left-1/2 -ml-[3px] w-1.5 h-1.5 rounded-full bg-navy-ink"
                      transition={reduceMotion ? { duration: 0 } : SLIDE}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-full -mt-1 px-2 py-1 rounded-md bg-ink text-surface text-caption font-semibold whitespace-nowrap
                      opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,translate] duration-150 delay-300"
                  >
                    {t(p.label)}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 lg:w-[220px] lg:justify-end">
            <button
              type="button"
              data-tour="bell"
              onClick={() => go('notifications')}
              aria-label={unreadCount ? t('Notifications, {n} new', { n: unreadCount }) : t('Notifications')}
              aria-current={activeTab === 'notifications' ? 'page' : undefined}
              title={t('Notifications')}
              className={`w-11 h-11 grid place-items-center rounded-full cursor-pointer transition-[background-color,scale] duration-150 active:scale-[0.92]
                ${activeTab === 'notifications' ? 'bg-navy-tint text-navy-ink' : 'text-ink hover:bg-surface-muted'}`}
            >
              <IconBox icon={<Bell />} badge={<Badge count={unreadCount} tone="red" />} active={activeTab === 'notifications'} />
            </button>
            <div className="relative hidden lg:block" ref={menuRef}>
              <button
                type="button"
                data-tour="nav-account"
                onClick={() => setMenuOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t('Account menu')}
                title={t('Account')}
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
                      <CircleUserRound className="w-5 h-5 text-muted" aria-hidden="true" /> {t('Account')}
                    </button>
                    <button role="menuitem" type="button" onClick={() => go('settings')} className={menuItem}>
                      <Settings className="w-5 h-5 text-muted" aria-hidden="true" /> {t('Display & language')}
                    </button>
                    <button
                      role="menuitemcheckbox"
                      aria-checked={resolvedTheme === 'dark'}
                      type="button"
                      onClick={() => setPref('theme', resolvedTheme === 'dark' ? 'light' : 'dark')}
                      className={`${menuItem} justify-between`}
                    >
                      <span className="flex items-center gap-3">
                        <Moon className="w-5 h-5 text-muted" aria-hidden="true" /> {t('Dark mode')}
                      </span>
                      <span className="text-caption text-muted">{resolvedTheme === 'dark' ? t('On') : t('Off')}</span>
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
                      <LogOut className="w-5 h-5" aria-hidden="true" /> {t('Sign out')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Pull to refresh indicator (phones) ---------- */}
      {(pull > 0 || refreshing) && (
        <div aria-hidden="true" className="lg:hidden fixed left-1/2 z-30 -translate-x-1/2 pointer-events-none" style={{ top: 56 + Math.max(0, pull - 36) }}>
          <span className="w-10 h-10 rounded-full bg-surface border border-line shadow-float grid place-items-center text-navy-ink">
            <RotateCw
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
              strokeWidth={2.2}
              style={refreshing ? undefined : { transform: `rotate(${(pull / PULL_TRIGGER) * 270}deg)` }}
            />
          </span>
        </div>
      )}
      {refreshing && (
        <span className="sr-only" role="status">
          {t('Refreshing')}
        </span>
      )}

      {/* ---------- Page ---------- */}
      <main className="overflow-x-clip pt-14 lg:pt-16 pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0">
        <div style={dragStyle} className={swipe === 0 && pull === 0 ? 'transition-[transform,opacity] duration-300 ease-out-strong' : undefined}>
          {children}
        </div>
      </main>

      {/* ---------- Bottom bar (phones and tablets): fixed along the bottom edge ---------- */}
      <nav aria-label="Main" className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-surface/95 border-t border-line pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-[560px] h-16 grid grid-cols-5">
          {PLACES.map(p => {
            const active = current === p.id;
            return (
              <button
                key={p.id}
                type="button"
                data-tour={`nav-${p.id}`}
                onClick={() => {
                  if (!active) haptic(6);
                  go(p.id);
                }}
                aria-current={active ? 'page' : undefined}
                aria-label={nameFor(p)}
                className={`group relative grid place-items-center cursor-pointer transition-colors duration-200
                  ${active ? 'text-navy-ink' : 'text-muted'}`}
              >
                <span className="relative grid place-items-center w-14 h-10 rounded-full transition-[background-color,scale] duration-150 group-active:scale-90 group-active:bg-surface-muted">
                  <IconBox icon={p.icon} badge={badgeFor(p.id)} active={active} />
                </span>
                {active && (
                  <motion.span
                    layoutId="phone-place"
                    aria-hidden="true"
                    className="absolute bottom-2 left-1/2 -ml-[3px] w-1.5 h-1.5 rounded-full bg-navy-ink"
                    transition={reduceMotion ? { duration: 0 } : SLIDE}
                  />
                )}
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
                  {t('Sign out?')}
                </h2>
                <p className="text-muted mt-1.5">{t('You can sign in again any time.')}</p>
                <div className="grid grid-cols-2 gap-2.5 mt-6">
                  <Button variant="secondary" onClick={() => setConfirmSignOut(false)} autoFocus>
                    {t('Cancel')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setConfirmSignOut(false);
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
    </div>
  );
};
