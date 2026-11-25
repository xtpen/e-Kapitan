import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FileCheck2,
  Home,
  Landmark,
  LayoutGrid,
  ListChecks,
  Megaphone,
  Menu,
  MessageSquareText,
  Phone,
  Type,
  User,
  X,
} from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, LogoMark } from '../ui';
import { BARANGAY } from '../../config/barangay';
import { scrollToSection, setPendingAuthScreen, setPendingSection } from '../public/publicNav';

/*
 * Public website shell for guests. Mockups: "Public homepage" (1280) and "Public · Homepage (mobile)" (390).
 * Desktop (≥1280): navy-deep utility bar + white top bar with the full nav and Sign in / Sign up.
 * Tablet (768–1279): same top bar, nav moves into the Menu drawer.
 * Phone (<768): navy header with Menu, bottom nav Home · Services · My Requests · Account.
 * The contact footer (id="contact") sits under every public page.
 */

type NavAction = { kind: 'tab'; tab: string } | { kind: 'section'; id: string } | { kind: 'contact' } | { kind: 'auth' };

interface PublicNavItem {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>;
  action: NavAction;
  /** Tabs that light this item up. */
  activeFor?: string[];
}

const MAIN_NAV: PublicNavItem[] = [
  { label: 'Home', icon: Home, action: { kind: 'tab', tab: 'guest_home' }, activeFor: ['guest_home'] },
  { label: 'Services', icon: LayoutGrid, action: { kind: 'section', id: 'services' } },
  { label: 'Announcements', icon: Megaphone, action: { kind: 'tab', tab: 'guest_announcements' }, activeFor: ['guest_announcements'] },
  { label: 'Officials', icon: Landmark, action: { kind: 'tab', tab: 'officials_directory' }, activeFor: ['officials_directory'] },
  { label: 'Contact', icon: Phone, action: { kind: 'contact' } },
  { label: 'Ask Kap', icon: MessageSquareText, action: { kind: 'tab', tab: 'ai_assistant' }, activeFor: ['ai_assistant'] },
];

const BOTTOM_NAV: PublicNavItem[] = [
  { label: 'Home', icon: Home, action: { kind: 'tab', tab: 'guest_home' }, activeFor: ['guest_home'] },
  { label: 'Services', icon: LayoutGrid, action: { kind: 'section', id: 'services' } },
  { label: 'My Requests', icon: ListChecks, action: { kind: 'tab', tab: 'report_status' }, activeFor: ['report_status'] },
  { label: 'Sign in', icon: User, action: { kind: 'auth' } },
];

/** The eKapitan mark (ui/Logo). Inverse = white tile for the navy phone header. */
const LogoDisc: React.FC<{ inverse?: boolean }> = ({ inverse }) => (
  <LogoMark size={inverse ? 40 : 44} tone={inverse ? 'white' : 'navy'} />
);

export const PublicShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, setIsAuthenticated, largeTextMode, setLargeTextMode } = useBarangay();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const openAuth = (screen: 'login' | 'register') => {
    setDrawerOpen(false);
    setPendingAuthScreen(screen);
    setIsAuthenticated(false);
  };

  const run = (action: NavAction) => {
    setDrawerOpen(false);
    switch (action.kind) {
      case 'tab':
        setActiveTab(action.tab);
        break;
      case 'section':
        if (activeTab === 'guest_home' && scrollToSection(action.id)) break;
        setPendingSection(action.id);
        setActiveTab('guest_home');
        break;
      case 'contact':
        scrollToSection('contact');
        break;
      case 'auth':
        openAuth('login');
        break;
    }
  };

  const isActive = (item: PublicNavItem) => item.activeFor?.includes(activeTab) ?? false;
  const isHome = activeTab === 'guest_home';

  const largeTextButton = (className: string) => (
    <button
      type="button"
      onClick={() => setLargeTextMode(v => !v)}
      aria-pressed={largeTextMode}
      className={`inline-flex items-center gap-2 font-semibold cursor-pointer ${className}`}
    >
      <Type className="w-4 h-4" aria-hidden="true" /> Large text: {largeTextMode ? 'On' : 'Off'}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Utility bar (desktop / tablet) */}
      <div className="hidden md:flex items-center justify-between gap-4 bg-navy-deep text-on-navy text-caption px-6 lg:px-10">
        <span className="py-2">Official website of Barangay {BARANGAY}, San Pablo City, Laguna</span>
        <span className="flex items-center gap-5">
          <span className="hidden lg:inline">Open Monday to Friday, 8:00 AM to 5:00 PM</span>
          {largeTextButton('min-h-11 text-white hover:underline underline-offset-4')}
        </span>
      </div>

      {/* Top bar (desktop / tablet) */}
      <header className="hidden md:flex sticky top-0 z-40 items-center gap-3.5 bg-surface border-b border-line px-6 lg:px-10 py-3.5">
        <button type="button" onClick={() => run({ kind: 'tab', tab: 'guest_home' })} className="flex items-center gap-3.5 text-left cursor-pointer">
          <LogoDisc />
          <span>
            <b className="block font-display text-xl leading-tight font-bold text-navy">eKapitan</b>
            <span className="text-caption text-muted">Barangay {BARANGAY}, San Pablo City</span>
          </span>
        </button>

        <nav aria-label="Main" className="hidden xl:flex gap-1 ml-7 mr-auto">
          {MAIN_NAV.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => run(item.action)}
              aria-current={isActive(item) ? 'page' : undefined}
              className={`px-3.5 min-h-11 rounded-lg font-semibold text-meta cursor-pointer transition-colors
                ${isActive(item) ? 'bg-primary-tint text-primary-strong' : 'text-ink hover:bg-surface-muted'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <span className="flex-1 xl:hidden" />

        <Button variant="secondary" onClick={() => openAuth('login')}>
          Sign in
        </Button>
        <Button onClick={() => openAuth('register')}>Sign up</Button>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="xl:hidden inline-flex items-center gap-2 min-h-12 px-4 rounded-control border-[1.5px] border-line font-semibold text-navy cursor-pointer"
        >
          <Menu className="w-5 h-5" aria-hidden="true" /> Menu
        </button>
      </header>

      {/* Phone header */}
      <header className="md:hidden sticky top-0 z-40 h-[68px] bg-navy text-white flex items-center gap-2.5 px-4">
        <button type="button" onClick={() => run({ kind: 'tab', tab: 'guest_home' })} className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer">
          <LogoDisc inverse />
          <span className="min-w-0">
            <b className="block leading-tight">eKapitan</b>
            <span className="block text-label truncate">Brgy. {BARANGAY}, San Pablo City</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="h-11 px-3 rounded-lg border-2 border-white text-caption font-semibold cursor-pointer"
        >
          Menu
        </button>
      </header>

      <main className={`flex-1 ${isHome ? '' : 'w-full max-w-[1200px] mx-auto px-4 py-5 sm:px-6 lg:px-10 lg:py-10'}`}>{children}</main>

      {/* Contact footer */}
      <footer id="contact" className="no-print bg-navy text-on-navy mt-16 md:mt-20 scroll-mt-24 pb-[68px] md:pb-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-11 grid gap-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <h2 className="text-h3 font-semibold text-white">Visit or contact us</h2>
            <p className="mt-2">Barangay Hall, {BARANGAY}, San Pablo City, Laguna</p>
          </div>
          <div>
            <b className="font-semibold text-white">Phone and email</b>
            {/* Placeholders until the barangay confirms its official contact details (REDESIGN_NOTES.md). */}
            <p>
              [Official phone number]
              <br />
              [Official email]
            </p>
          </div>
          <div>
            <b className="font-semibold text-white">Office hours</b>
            <p>
              Monday to Friday
              <br />
              8:00 AM to 5:00 PM
            </p>
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-caption">
            <button
              type="button"
              onClick={() => run({ kind: 'tab', tab: 'qr_verify' })}
              className="inline-flex items-center gap-2 min-h-11 font-semibold text-white hover:underline underline-offset-4 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" aria-hidden="true" /> Verify a barangay document
            </button>
            <span>© 2026 eKapitan</span>
          </div>
        </div>
      </footer>

      {/* Phone bottom nav */}
      <nav aria-label="Quick" className="md:hidden fixed inset-x-0 bottom-0 z-40 h-[68px] bg-surface border-t border-line grid grid-cols-4">
        {BOTTOM_NAV.map(item => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => run(item.action)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 text-caption font-semibold cursor-pointer
                ${active ? 'text-navy shadow-[inset_0_3px_0_var(--color-primary)]' : 'text-muted'}`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.8} aria-hidden={true} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Menu drawer (phone + tablet) */}
      {drawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-navy/50" onClick={() => setDrawerOpen(false)} />
            <div className="absolute inset-y-0 right-0 w-[86%] max-w-[320px] bg-surface border-l border-line overflow-y-auto px-4 py-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-semibold text-ink">Menu</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  autoFocus
                  className="w-11 h-11 grid place-items-center rounded-control border-[1.5px] border-line text-navy cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="Main">
                <ul>
                  {MAIN_NAV.map(item => {
                    const active = isActive(item);
                    const Icon = item.icon;
                    return (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() => run(item.action)}
                          aria-current={active ? 'page' : undefined}
                          className={`w-full flex items-center gap-3 p-3 mb-1 rounded-control text-left font-semibold cursor-pointer
                            ${active ? 'bg-navy text-white' : 'text-ink hover:bg-surface-muted'}`}
                        >
                          <Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} aria-hidden={true} />
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div className="grid gap-2.5 border-t border-line-soft mt-3 pt-4">
                <Button fullWidth onClick={() => openAuth('register')}>
                  Sign up
                </Button>
                <Button variant="secondary" fullWidth onClick={() => openAuth('login')}>
                  Sign in
                </Button>
              </div>
              <div className="border-t border-line-soft mt-4 pt-2">
                {largeTextButton('w-full p-3 min-h-11 rounded-control text-ink hover:bg-surface-muted')}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
