import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bell, LogOut, Menu, Moon, PanelLeftClose, Settings, Type, X } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { usePreferences } from '../../context/PreferencesContext';
import { Button, LogoMark, initialsOf } from '../ui';

/*
 * Shared app shell for the redesign (DESIGN.md section 4).
 * Desktop: top bar + sidebar that collapses to a 76px icon rail (remembered in Settings
 * preferences). Icons never move while it resizes: only the width animates and the labels fade.
 * The active item's highlight slides between items. Tablet/phone: a drawer that slides in from
 * the right, plus a bottom nav on phones. Roles only differ in the nav config they pass in.
 */

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Other tab ids that should also highlight this item (e.g. a wizard inside Documents). */
  alsoActiveFor?: string[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface AppShellProps {
  groups: NavGroup[];
  /** Up to 4 mobile bottom-nav tabs. */
  bottomNav?: NavItem[];
  /** Tab opened by the notification bell. */
  notificationsTab?: string;
  unreadCount?: number;
  /** Phone header text, e.g. { title: 'eKapitan Admin', subtitle: 'Administrator portal' }. */
  mobileBrand?: { title: string; subtitle: string };
  children: React.ReactNode;
}

/** Bottom-nav item id that opens the full menu drawer instead of a page. */
export const OPEN_MENU = '__menu';

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1];

const isActive = (item: NavItem, activeTab: string) =>
  item.id === activeTab || (item.alsoActiveFor?.includes(activeTab) ?? false);

/** The eKapitan mark (ui/Logo). Inverse = white tile for the navy phone header. */
const LogoDisc: React.FC<{ size?: 'lg' | 'sm'; inverse?: boolean }> = ({ size = 'lg', inverse }) => (
  <LogoMark size={size === 'lg' ? 40 : 40} tone={inverse ? 'white' : 'navy'} />
);

/** Text beside an icon in the sidebar: fades out as the rail collapses (the rail clips it). */
const RailLabel: React.FC<{ collapsed: boolean; children: React.ReactNode; className?: string }> = ({ collapsed, children, className = '' }) => (
  <span
    className={`whitespace-nowrap transition-[opacity,translate] duration-200 ease-out-strong
      ${collapsed ? 'opacity-0 -translate-x-1' : 'opacity-100 translate-x-0 delay-75'} ${className}`}
  >
    {children}
  </span>
);

const SidebarNav: React.FC<{
  groups: NavGroup[];
  activeTab: string;
  onSelect: (id: string) => void;
  collapsed?: boolean;
  /** Separate highlight per instance (sidebar vs drawer), so they never animate into each other. */
  highlightId: string;
}> = ({ groups, activeTab, onSelect, collapsed = false, highlightId }) => {
  const reduceMotion = useReducedMotion();
  return (
    <nav aria-label="Main">
      {groups.map((group, gi) => (
        <div key={group.title} className={gi > 0 ? 'mt-3' : ''}>
          {/* Group title; on the collapsed rail it becomes a short divider */}
          <div className="relative h-7 flex items-center mx-4" aria-hidden={collapsed}>
            <p
              className={`text-label font-semibold uppercase tracking-[0.08em] text-muted whitespace-nowrap transition-opacity duration-200
                ${collapsed ? 'opacity-0' : 'opacity-100 delay-75'}`}
            >
              {group.title}
            </p>
            <span
              className={`absolute left-1/2 -translate-x-1/2 w-6 h-px bg-line transition-opacity duration-200 ${collapsed ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
          <ul className="grid gap-1">
            {group.items.map(item => {
              const active = isActive(item, activeTab);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={active ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`group relative w-full flex items-center gap-3 px-4 min-h-11 py-2.5 rounded-control text-left font-semibold cursor-pointer
                      transition-colors duration-200 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:shrink-0
                      ${active ? 'text-white' : 'text-ink hover:bg-surface-muted'}`}
                  >
                    {active && (
                      <motion.span
                        layoutId={highlightId}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-control bg-navy"
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: EASE_OUT }}
                      />
                    )}
                    <span className="relative flex">{item.icon}</span>
                    <RailLabel collapsed={collapsed} className="relative">
                      {item.label}
                    </RailLabel>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export const AppShell: React.FC<AppShellProps> = ({ groups, bottomNav, notificationsTab, unreadCount = 0, mobileBrand, children }) => {
  const { currentUser, activeTab, setActiveTab, largeTextMode, setLargeTextMode, setIsAuthenticated } = useBarangay();
  const { prefs, setPref, resolvedTheme } = usePreferences();
  const reduceMotion = useReducedMotion();
  const collapsed = prefs.sidebarCollapsed;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const hasSettings = groups.some(g => g.items.some(i => i.id === 'settings'));

  const go = (id: string) => {
    setActiveTab(id);
    setDrawerOpen(false);
    setAccountOpen(false);
  };

  // Close the account menu on outside click / Escape; close drawer on Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAccountOpen(false);
        setDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const bell = notificationsTab && (
    <button
      type="button"
      onClick={() => go(notificationsTab)}
      aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      className="relative w-11 h-11 rounded-control border-[1.5px] border-line bg-surface grid place-items-center text-navy-ink hover:bg-surface-muted cursor-pointer
        transition-[background-color,scale] duration-150 ease-out-strong active:scale-[0.95]"
    >
      <Bell className="w-6 h-6" strokeWidth={1.8} aria-hidden="true" />
      {unreadCount > 0 && (
        <span aria-hidden="true" className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface" />
      )}
    </button>
  );

  const menuItem = 'w-full flex items-center gap-3 px-3 min-h-11 rounded-control font-semibold cursor-pointer transition-colors';

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Desktop / tablet top bar */}
      <header className="hidden md:flex sticky top-0 z-40 h-[72px] items-center gap-3.5 bg-surface border-b border-line px-6 lg:px-8">
        <button
          type="button"
          onClick={() => go(groups[0]?.items[0]?.id ?? activeTab)}
          className="flex items-center gap-3 text-left cursor-pointer"
        >
          <LogoDisc />
          <span>
            <b className="block font-display text-xl leading-tight font-bold text-navy-ink">eKapitan</b>
          </span>
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden inline-flex items-center gap-2 min-h-11 px-4 rounded-control border-[1.5px] border-line font-semibold text-navy-ink cursor-pointer"
        >
          <Menu className="w-5 h-5" aria-hidden="true" /> Menu
        </button>
        <span className="text-meta text-muted hidden lg:inline">{currentUser.name}</span>
        {bell}
        <div className="relative" ref={accountRef}>
          <button
            type="button"
            onClick={() => setAccountOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={accountOpen}
            aria-label="Account menu"
            className="w-11 h-11 rounded-full bg-navy text-gold grid place-items-center font-display font-bold text-sm cursor-pointer
              transition-[scale,box-shadow] duration-150 ease-out-strong active:scale-[0.95] hover:ring-4 hover:ring-navy-ink/15"
          >
            {initialsOf(currentUser.name)}
          </button>
          <AnimatePresence>
            {accountOpen && (
              <motion.div
                role="menu"
                className="absolute right-0 mt-2 w-72 bg-surface border border-line rounded-card shadow-float p-2 z-50 origin-top-right"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96) translateY(-4px)' }}
                animate={{ opacity: 1, transform: 'scale(1) translateY(0px)', transition: { duration: 0.18, ease: EASE_OUT } }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
              >
                <div className="px-3 py-2.5 border-b border-line-soft mb-1">
                  <p className="font-semibold text-ink">{currentUser.name}</p>
                  <p className="text-caption text-muted truncate">{currentUser.email}</p>
                </div>
                <button
                  role="menuitemcheckbox"
                  aria-checked={resolvedTheme === 'dark'}
                  type="button"
                  onClick={() => setPref('theme', resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className={`${menuItem} justify-between text-ink hover:bg-surface-muted`}
                >
                  <span className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-muted" aria-hidden="true" /> Dark mode
                  </span>
                  <span className="text-caption text-muted">{resolvedTheme === 'dark' ? 'On' : 'Off'}</span>
                </button>
                <button
                  role="menuitemcheckbox"
                  aria-checked={largeTextMode}
                  type="button"
                  onClick={() => setLargeTextMode(v => !v)}
                  className={`${menuItem} justify-between text-ink hover:bg-surface-muted`}
                >
                  <span className="flex items-center gap-3">
                    <Type className="w-5 h-5 text-muted" aria-hidden="true" /> Large text
                  </span>
                  <span className="text-caption text-muted">{largeTextMode ? 'On' : 'Off'}</span>
                </button>
                {hasSettings && (
                  <button role="menuitem" type="button" onClick={() => go('settings')} className={`${menuItem} text-ink hover:bg-surface-muted`}>
                    <Settings className="w-5 h-5 text-muted" aria-hidden="true" /> All settings
                  </button>
                )}
                <div className="border-t border-line-soft mt-1 pt-1">
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      setConfirmSignOut(true);
                    }}
                    className={`${menuItem} text-danger-fg hover:bg-danger-bg`}
                  >
                    <LogOut className="w-5 h-5" aria-hidden="true" /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 h-[68px] bg-navy text-white flex items-center gap-2.5 px-4">
        <LogoDisc size="sm" inverse />
        <div className="flex-1 min-w-0">
          <b className="block leading-tight">{mobileBrand?.title ?? 'eKapitan'}</b>
          {mobileBrand?.subtitle && <div className="text-label truncate">{mobileBrand.subtitle}</div>}
        </div>
        {notificationsTab && (
          <button
            type="button"
            onClick={() => go(notificationsTab)}
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            className="relative w-11 h-11 grid place-items-center rounded-lg cursor-pointer"
          >
            <Bell className="w-6 h-6" strokeWidth={1.8} aria-hidden="true" />
            {unreadCount > 0 && (
              <span aria-hidden="true" className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-gold ring-2 ring-navy-ink" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="h-11 px-3 rounded-lg border-2 border-white text-caption font-semibold cursor-pointer"
        >
          Menu
        </button>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar: collapses to an icon rail */}
        <aside
          aria-label="Sidebar"
          className={`hidden lg:flex flex-col sticky top-[72px] h-[calc(100dvh-72px)] shrink-0 bg-surface border-r border-line overflow-hidden
            transition-[width] duration-300 ease-drawer motion-reduce:transition-none ${collapsed ? 'w-[76px]' : 'w-[264px]'}`}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:thin]">
            <SidebarNav groups={groups} activeTab={activeTab} onSelect={go} collapsed={collapsed} highlightId="sidebar-active" />
          </div>
          <div className="border-t border-line px-3 py-3">
            <button
              type="button"
              onClick={() => setPref('sidebarCollapsed', !collapsed)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : undefined}
              className="w-full flex items-center gap-3 px-4 min-h-11 rounded-control font-semibold text-muted hover:text-navy-ink hover:bg-surface-muted cursor-pointer
                transition-[color,background-color,scale] duration-150 ease-out-strong active:scale-[0.97]"
            >
              <PanelLeftClose
                className={`w-5 h-5 shrink-0 transition-transform duration-300 ease-drawer ${collapsed ? 'rotate-180' : ''}`}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <RailLabel collapsed={collapsed}>Collapse sidebar</RailLabel>
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 lg:px-8 xl:px-10 lg:py-8 pb-[92px] md:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      {bottomNav && bottomNav.length > 0 && (
        <nav
          aria-label="Quick"
          className="md:hidden fixed inset-x-0 bottom-0 z-40 h-[68px] bg-surface border-t border-line grid"
          style={{ gridTemplateColumns: `repeat(${bottomNav.length}, 1fr)` }}
        >
          {bottomNav.map(item => {
            const active = isActive(item, activeTab);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => (item.id === OPEN_MENU ? setDrawerOpen(true) : go(item.id))}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-caption font-semibold cursor-pointer [&_svg]:w-5 [&_svg]:h-5
                  transition-colors duration-200 ${active ? 'text-navy-ink' : 'text-muted'}`}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-active"
                    aria-hidden="true"
                    className="absolute top-0 inset-x-4 h-[3px] rounded-b-full bg-primary"
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: EASE_OUT }}
                  />
                )}
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>
      )}

      {/* Drawer (mobile + tablet): slides in from the right */}
      {createPortal(
        <AnimatePresence>
          {drawerOpen && (
            <div key="drawer" className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
              <motion.div
                className="absolute inset-0 bg-scrim/50"
                onClick={() => setDrawerOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.24 } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              />
              <motion.div
                className="absolute inset-y-0 right-0 w-[86%] max-w-[320px] bg-surface border-l border-line overflow-y-auto px-3 py-4"
                initial={reduceMotion ? { opacity: 0 } : { transform: 'translateX(100%)' }}
                animate={reduceMotion ? { opacity: 1 } : { transform: 'translateX(0%)', transition: { duration: 0.36, ease: EASE_DRAWER } }}
                exit={reduceMotion ? { opacity: 0 } : { transform: 'translateX(100%)', transition: { duration: 0.24, ease: EASE_DRAWER } }}
              >
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="font-semibold text-ink truncate">{currentUser.name}</span>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close menu"
                    className="w-11 h-11 grid place-items-center rounded-control border-[1.5px] border-line text-navy-ink cursor-pointer"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
                <SidebarNav groups={groups} activeTab={activeTab} onSelect={go} highlightId="drawer-active" />
                <div className="border-t border-line-soft mt-4 pt-3">
                  <button
                    type="button"
                    onClick={() => setPref('theme', resolvedTheme === 'dark' ? 'light' : 'dark')}
                    aria-pressed={resolvedTheme === 'dark'}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-control font-semibold text-ink hover:bg-surface-muted cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-muted" aria-hidden="true" /> Dark mode
                    </span>
                    <span className="text-caption text-muted">{resolvedTheme === 'dark' ? 'On' : 'Off'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLargeTextMode(v => !v)}
                    aria-pressed={largeTextMode}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-control font-semibold text-ink hover:bg-surface-muted cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <Type className="w-5 h-5 text-muted" aria-hidden="true" /> Large text
                    </span>
                    <span className="text-caption text-muted">{largeTextMode ? 'On' : 'Off'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      setConfirmSignOut(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-control font-semibold text-danger-fg hover:bg-danger-bg cursor-pointer"
                  >
                    <LogOut className="w-5 h-5" aria-hidden="true" /> Sign out
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* Sign-out confirmation */}
      {createPortal(
        <AnimatePresence>
          {confirmSignOut && (
            <div key="signout" className="fixed inset-0 z-[60] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="signout-title">
              <motion.div
                className="absolute inset-0 bg-scrim/50"
                onClick={() => setConfirmSignOut(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              />
              <motion.div
                className="relative w-full max-w-sm bg-surface border border-line rounded-card shadow-float p-6 sm:p-8"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
                animate={{ opacity: 1, transform: 'scale(1)', transition: { duration: 0.22, ease: EASE_OUT } }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
              >
                <h2 id="signout-title" className="text-h3-lg font-semibold text-navy-ink">
                  Sign out?
                </h2>
                <p className="text-meta text-muted mt-2">You will need to sign in again to use barangay services.</p>
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
