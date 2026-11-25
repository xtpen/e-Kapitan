import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, LogOut, Menu, Type, X } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, LogoMark, initialsOf } from '../ui';
import { BARANGAY } from '../../config/barangay';

/*
 * Shared app shell for the redesign (DESIGN.md section 4).
 * Desktop: top bar + 264px sidebar. Mobile: navy header with Menu drawer + bottom nav.
 * Roles only differ in the nav config they pass in.
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

const isActive = (item: NavItem, activeTab: string) =>
  item.id === activeTab || (item.alsoActiveFor?.includes(activeTab) ?? false);

/** The eKapitan mark (ui/Logo). Inverse = white tile for the navy phone header. */
const LogoDisc: React.FC<{ size?: 'lg' | 'sm'; inverse?: boolean }> = ({ size = 'lg', inverse }) => (
  <LogoMark size={size === 'lg' ? 44 : 40} tone={inverse ? 'white' : 'navy'} />
);

const SidebarNav: React.FC<{ groups: NavGroup[]; activeTab: string; onSelect: (id: string) => void }> = ({
  groups,
  activeTab,
  onSelect,
}) => (
  <nav aria-label="Main">
    {groups.map(group => (
      <div key={group.title}>
        <p className="text-label font-semibold uppercase tracking-[0.08em] text-muted mt-4 mb-2 mx-3">{group.title}</p>
        <ul>
          {group.items.map(item => {
            const active = isActive(item, activeTab);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 p-3 mb-1 rounded-control text-left font-semibold transition-colors cursor-pointer
                    [&_svg]:w-5 [&_svg]:h-5 [&_svg]:shrink-0
                    ${active ? 'bg-navy text-white' : 'text-ink hover:bg-surface-muted'}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
);

export const AppShell: React.FC<AppShellProps> = ({ groups, bottomNav, notificationsTab, unreadCount = 0, mobileBrand, children }) => {
  const { currentUser, activeTab, setActiveTab, largeTextMode, setLargeTextMode, setIsAuthenticated } = useBarangay();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

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
      className="relative w-11 h-11 rounded-control border-[1.5px] border-line bg-surface grid place-items-center text-navy hover:bg-surface-muted cursor-pointer"
    >
      <Bell className="w-6 h-6" strokeWidth={1.8} aria-hidden="true" />
      {unreadCount > 0 && (
        <span aria-hidden="true" className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Desktop / tablet top bar */}
      <header className="hidden md:flex sticky top-0 z-40 items-center gap-3.5 bg-surface border-b border-line px-6 lg:px-10 py-3.5">
        <button
          type="button"
          onClick={() => go(groups[0]?.items[0]?.id ?? activeTab)}
          className="flex items-center gap-3.5 text-left cursor-pointer"
        >
          <LogoDisc />
          <span>
            <b className="block font-display text-xl leading-tight font-bold text-navy">eKapitan</b>
            <span className="text-caption text-muted">Barangay {BARANGAY}, San Pablo City</span>
          </span>
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden inline-flex items-center gap-2 min-h-11 px-4 rounded-control border-[1.5px] border-line font-semibold text-navy cursor-pointer"
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
            className="w-11 h-11 rounded-full bg-navy text-gold grid place-items-center font-display font-bold text-sm cursor-pointer"
          >
            {initialsOf(currentUser.name)}
          </button>
          {accountOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-72 bg-surface border border-line rounded-card shadow-float p-2 z-50"
            >
              <div className="px-3 py-2.5 border-b border-line-soft mb-1">
                <p className="font-semibold text-ink">{currentUser.name}</p>
                <p className="text-caption text-muted truncate">{currentUser.email}</p>
              </div>
              <button
                role="menuitemcheckbox"
                aria-checked={largeTextMode}
                type="button"
                onClick={() => setLargeTextMode(v => !v)}
                className="w-full flex items-center justify-between gap-3 px-3 min-h-11 rounded-control font-semibold text-ink hover:bg-surface-muted cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-muted" aria-hidden="true" /> Large text
                </span>
                <span className="text-caption text-muted">{largeTextMode ? 'On' : 'Off'}</span>
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setAccountOpen(false);
                  setConfirmSignOut(true);
                }}
                className="w-full flex items-center gap-3 px-3 min-h-11 rounded-control font-semibold text-danger-fg hover:bg-danger-bg cursor-pointer"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 h-[68px] bg-navy text-white flex items-center gap-2.5 px-4">
        <LogoDisc size="sm" inverse />
        <div className="flex-1 min-w-0">
          <b className="block leading-tight">{mobileBrand?.title ?? 'eKapitan'}</b>
          <div className="text-label truncate">{mobileBrand?.subtitle ?? `Brgy. ${BARANGAY}, San Pablo City`}</div>
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
              <span aria-hidden="true" className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-gold ring-2 ring-navy" />
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
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[264px] shrink-0 bg-surface border-r border-line px-4 py-6">
          <div className="sticky top-[100px]">
            <SidebarNav groups={groups} activeTab={activeTab} onSelect={go} />
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 lg:px-10 lg:py-8 pb-[92px] md:pb-10">{children}</main>
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
                className={`flex flex-col items-center justify-center gap-0.5 text-caption font-semibold cursor-pointer [&_svg]:w-5 [&_svg]:h-5
                  ${active ? 'text-navy shadow-[inset_0_3px_0_var(--color-primary)]' : 'text-muted'}`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>
      )}

      {/* Drawer (mobile + tablet) */}
      {drawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-navy/50" onClick={() => setDrawerOpen(false)} />
            <div className="absolute inset-y-0 right-0 w-[86%] max-w-[320px] bg-surface border-l border-line overflow-y-auto px-4 py-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-semibold text-ink truncate">{currentUser.name}</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="w-11 h-11 grid place-items-center rounded-control border-[1.5px] border-line text-navy cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <SidebarNav groups={groups} activeTab={activeTab} onSelect={go} />
              <div className="border-t border-line-soft mt-4 pt-3">
                <button
                  type="button"
                  onClick={() => setLargeTextMode(v => !v)}
                  aria-pressed={largeTextMode}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-control font-semibold text-ink hover:bg-surface-muted cursor-pointer"
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
                  className="w-full flex items-center gap-3 p-3 rounded-control font-semibold text-danger-fg hover:bg-danger-bg cursor-pointer"
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" /> Sign out
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Sign-out confirmation */}
      {confirmSignOut &&
        createPortal(
          <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="signout-title">
            <div className="absolute inset-0 bg-navy/50" onClick={() => setConfirmSignOut(false)} />
            <div className="relative w-full max-w-sm bg-surface border border-line rounded-card shadow-float p-6 sm:p-8">
              <h2 id="signout-title" className="text-h3-lg font-semibold text-navy">Sign out?</h2>
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
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
