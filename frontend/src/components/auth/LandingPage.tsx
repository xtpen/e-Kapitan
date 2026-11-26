import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ListOrdered,
  Sparkles,
  Users,
  FileCheck2,
  Landmark,
  Languages,
  Megaphone,
  MessageSquareText,
  ScanSearch,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  Type,
  UserCheck,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, LogoMark, Reveal } from '../ui';
import { takePendingAuthScreen, type AuthScreen } from '../public/publicNav';
import { AuthDialog, type Role } from './AuthDialog';
import { TAGLINE } from '../../config/brand';
import { HeroCollage } from './landing/HeroCollage';
import { FeatureTour } from './landing/FeatureTour';
import { LegalSheet } from '../legal/LegalSheet';
import { LEGAL_DOCS, type LegalDocId } from '../legal/legalDocs';

/*
 * Landing page. Palette: white + navy only, with mist (#F5F7FA) for alternating sections and
 * hairline borders. Green appears only where something is "ready". No barangay is named here.
 *
 * Story, top to bottom: tagline + a rotating glimpse of every feature → a scroll-driven tour that
 * explains each one → what guests can do without an account → who it's built for → how it works →
 * questions → sign up. Every block uses the two-way <Reveal> (docs/DESIGN.md section 8).
 *
 * Wording (docs/DESIGN.md section 7): "Sign up", "Sign in", "Continue as guest". No other phrasings.
 */

type IconC = React.ComponentType<{ className?: string; strokeWidth?: number }>;

const GUEST_ACTIONS: { title: string; text: string; icon: IconC; tab: string }[] = [
  { title: 'Report a concern', text: 'File a report about your street or neighborhood and get a tracking number.', icon: TriangleAlert, tab: 'file_report' },
  { title: 'Track a request', text: 'Enter any reference number to see where a document, report or booking stands.', icon: ScanSearch, tab: 'report_status' },
  { title: 'Verify a document', text: 'Check that a printed clearance or certificate is real, using the code at its bottom.', icon: FileCheck2, tab: 'qr_verify' },
  { title: 'Read announcements', text: 'Advisories, health drives, events and schedule changes from the barangay hall.', icon: Megaphone, tab: 'guest_announcements' },
  { title: 'Meet your officials', text: 'Who leads the barangay, their committees and how to reach them.', icon: Landmark, tab: 'officials_directory' },
  { title: 'Ask Kap', text: 'Ka-Barangay AI answers questions about requirements, fees and office hours.', icon: MessageSquareText, tab: 'ai_assistant' },
];

const BUILT_FOR: { title: string; text: string; icon: IconC }[] = [
  { title: 'Large, clear text', text: 'Readable at a glance, with a Large text switch that enlarges everything for senior citizens.', icon: Type },
  { title: 'Any phone, no app', text: 'Works in the browser of budget Android phones and computers. Nothing to download or update.', icon: Smartphone },
  { title: 'English and Filipino', text: 'Plain wording throughout, and Ask Kap understands English, Tagalog and Taglish.', icon: Languages },
  { title: 'Your data stays yours', text: 'Used only for your request, as the Data Privacy Act requires. You only ever see your own requests.', icon: ShieldCheck },
  { title: 'Verified residents', text: 'Barangay staff check every new account against a valid ID before it opens.', icon: UserCheck },
  { title: 'Genuine documents', text: 'Every issued document carries a verification code anyone can check online.', icon: FileCheck2 },
];

const STEPS = [
  { title: 'Sign up', text: 'Give your name, mobile number, address and a photo of a valid ID. Staff verify your account.' },
  { title: 'Send your request', text: 'Pick a service and fill in a short form. You get a reference number right away.' },
  { title: 'Claim it at the hall', text: 'We text you when it is ready. Bring your reference number and a valid ID.' },
];

const FAQS = [
  {
    q: 'Do I pay online?',
    a: 'No. Fees are shown when you make a request and paid at the barangay hall when you claim it. Printing is free for residents, and some certificates are free or can be waived.',
  },
  { q: 'Who can sign up?', a: 'Residents of the barangay. Staff check your details and ID before your account opens, and you get a text when it is ready.' },
  {
    q: 'Can I use eKapitan without an account?',
    a: 'Yes. Anyone can report a concern, track a request by its reference number, verify a document, read announcements, see the officials and ask Kap.',
  },
  { q: 'How will I know when my request is ready?', a: 'Its status updates in My Requests, and we send a text message to your mobile number.' },
  {
    q: 'Is my information safe?',
    a: 'Your details are used only to act on your request, as required by the Data Privacy Act of 2012. Residents only see their own requests, and you can hide your name from a person you report.',
  },
  { q: 'What if I need help using it?', a: 'Turn on Large text from the menu, or visit the barangay hall on weekdays, 8:00 AM to 5:00 PM. Staff can help you.' },
];

const PROMISES = ['No app to install', 'Works on any phone', 'Staff-verified accounts'];

const NAV: [string, string][] = [
  ['Features', 'features'],
  ['For guests', 'guests'],
  ['How it works', 'how-it-works'],
  ['FAQ', 'faq'],
];

/** Icons for the page links in the phone menu. */
const NAV_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>> = {
  features: Sparkles,
  guests: Users,
  'how-it-works': ListOrdered,
  faq: CircleHelp,
};

/** One item in the phone menu: rises a little as it fades in. */
const menuItemMotion = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] } },
};

/** Remembers where you were on the landing page, so a refresh doesn't jump to the top. */
const SCROLL_KEY = 'ekapitan:landing-scroll';
const readScroll = () => {
  try {
    return Number(sessionStorage.getItem(SCROLL_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeScroll = (y: number | null) => {
  try {
    if (y === null) sessionStorage.removeItem(SCROLL_KEY);
    else sessionStorage.setItem(SCROLL_KEY, String(Math.round(y)));
  } catch {
    /* private mode: nothing to remember */
  }
};

const useScrollMemory = () => {
  // Restore before the first paint, so there is no visible jump.
  useLayoutEffect(() => {
    const prev = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const y = readScroll();
    if (y) window.scrollTo(0, y);
    let t = 0;
    const save = () => writeScroll(window.scrollY);
    const onScroll = () => {
      window.clearTimeout(t);
      t = window.setTimeout(save, 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', save);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', save);
      history.scrollRestoration = prev;
    };
  }, []);
};

/** Header state: scrolled past the top, and how far down the page you are (0–1). */
const useScrollProgress = () => {
  const bar = useRef<HTMLSpanElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      // Write the transform directly: no React render per scroll frame.
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      setScrolled(window.scrollY > 8);
    };
    const on = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return { bar, scrolled };
};

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Section opener: small label, title, optional supporting line. */
const SectionHeading: React.FC<{ label: string; title: string; text?: string; id: string; center?: boolean }> = ({
  label,
  title,
  text,
  id,
  center,
}) => (
  <div className={`max-w-[42rem] ${center ? 'mx-auto text-center' : ''}`}>
    <Reveal as="p" y={10} className="text-caption font-semibold uppercase tracking-[0.1em] text-muted">
      {label}
    </Reveal>
    <Reveal delay={60} y={16}>
      <h2 id={id} className="mt-3 text-[1.75rem] sm:text-[2.25rem] leading-[1.12] font-semibold text-navy-ink tracking-[-0.015em] text-balance">
        {title}
      </h2>
    </Reveal>
    {text && (
      <Reveal as="p" delay={120} y={10} className="mt-4 text-muted text-[1.0625rem] leading-relaxed">
        {text}
      </Reveal>
    )}
  </div>
);

/**
 * One question. The answer's row grows from 0fr to 1fr (a height animation that works in every
 * browser) while the text fades in; closing plays the same in reverse. Closed answers are inert.
 */
const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="border-b border-hairline">
      <h3>
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          onClick={() => setOpen(o => !o)}
          className="group w-full flex items-center justify-between gap-4 min-h-14 py-4 text-left cursor-pointer text-[1.0625rem] font-semibold text-navy-ink"
        >
          {q}
          <span
            aria-hidden="true"
            className={`w-8 h-8 shrink-0 rounded-full grid place-items-center transition-[rotate,background-color,color] duration-300 ease-out-strong
              ${open ? 'rotate-180 bg-navy text-white' : 'bg-mist text-navy-ink group-hover:bg-navy-tint'}`}
          >
            <ChevronDown className="w-4 h-4" />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-a`}
        role="region"
        aria-labelledby={`${id}-q`}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out-strong motion-reduce:transition-none
          ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p
            className={`text-meta text-muted pb-5 pr-12 leading-relaxed transition-[opacity,translate] duration-300 ease-out-strong motion-reduce:transition-none
              ${open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}
          >
            {a}
          </p>
        </div>
      </div>
    </div>
  );
};

const Container: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>
);

const FooterLink: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean }> = ({ onClick, children, disabled }) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-10 text-meta text-muted hover:text-navy-ink cursor-pointer transition-colors text-left"
    >
      {children}
    </button>
  </li>
);

export const LandingPage: React.FC = () => {
  const { setIsAuthenticated, switchUserRole, setActiveTab } = useBarangay();
  const [busy, setBusy] = useState<Role | null>(null);
  // Arriving from the public site's Sign in / Sign up opens the dialog on that tab.
  const [auth, setAuth] = useState<AuthScreen | null>(takePendingAuthScreen);
  const [legal, setLegal] = useState<LegalDocId | null>(null);
  const closeAuth = useCallback(() => setAuth(null), []);
  const { bar, scrolled } = useScrollProgress();
  useScrollMemory();
  const reduceMotion = useReducedMotion();

  // Is the hero's Sign up on screen? While it is, the header doesn't repeat it.
  const heroCta = useRef<HTMLDivElement>(null);
  const [heroCtaInView, setHeroCtaInView] = useState(true);
  useEffect(() => {
    const el = heroCta.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setHeroCtaInView(e.isIntersecting), { rootMargin: '-72px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Phone menu: focus its first link on open; Escape or a wider screen closes it.
  const [menuOpen, setMenuOpen] = useState(false);
  const firstMenuItem = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    firstMenuItem.current?.focus({ preventScroll: true });
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    const wide = window.matchMedia('(min-width: 1024px)');
    const onWide = () => wide.matches && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      html.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, [menuOpen]);

  /** Enter the app as a role; guests can land on a specific public page. Next visit starts at the top. */
  const go = (role: Role, tab?: string) => {
    setBusy(role);
    setTimeout(() => {
      writeScroll(null);
      switchUserRole(role);
      if (tab) setActiveTab(tab);
      setIsAuthenticated(true);
      setBusy(null);
    }, 500);
  };

  const guestLabel = busy === 'guest' ? 'Opening…' : 'Continue as guest';

  return (
    <>
      <div className="min-h-svh flex flex-col bg-surface text-ink" inert={auth !== null}>
        {/* ---------- Header ---------- */}
        <header
          className={`sticky top-0 z-40 bg-surface border-b transition-[border-color,box-shadow] duration-200
            ${scrolled || menuOpen ? 'border-hairline shadow-[0_1px_12px_rgb(18_48_79/0.06)]' : 'border-transparent'}`}
        >
          <Container className="h-16 sm:h-[72px] flex items-center gap-2 sm:gap-3">
            <a
              href="#top"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 min-h-11 rounded-control mr-auto lg:mr-0"
              aria-label="eKapitan, back to top"
            >
              <LogoMark size={36} animate />
              <span className="font-display text-xl font-bold text-navy-ink">eKapitan</span>
            </a>
            <nav aria-label="Page" className="hidden lg:flex items-center gap-1 mx-auto">
              {NAV.map(([label, id]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToId(id)}
                  className="min-h-11 px-3 rounded-control text-meta font-semibold text-muted hover:text-navy-ink hover:bg-mist cursor-pointer transition-colors"
                >
                  {label}
                </button>
              ))}
            </nav>
            <span className="hidden sm:contents">
              <Button variant="outline" size="sm" onClick={() => setAuth('login')}>
                Sign in
              </Button>
            </span>
            {/* Tablets and up: Sign up fades in once the hero's own Sign up has scrolled away.
                Its space is always kept, so nothing beside it moves. Phones get the bottom bar instead. */}
            <span
              inert={heroCtaInView}
              className={`hidden sm:block transition-[opacity,scale,translate] duration-300 ease-out-strong
                ${heroCtaInView ? 'opacity-0 scale-90 translate-y-1 pointer-events-none' : 'opacity-100 scale-100 translate-y-0'}`}
            >
              <Button variant="brand" size="sm" className="whitespace-nowrap" onClick={() => setAuth('register')}>
                Sign up
              </Button>
            </span>
            {/* Menu button: three lines that fold into an X */}
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-expanded={menuOpen}
              aria-controls="landing-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden -mr-2 w-11 h-11 grid place-items-center rounded-full text-navy-ink hover:bg-mist cursor-pointer
                transition-[background-color,scale] duration-150 ease-out-strong active:scale-[0.92]"
            >
              <span aria-hidden="true" className="relative block w-[22px] h-4">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="absolute left-0 right-0 h-[2.5px] rounded-full bg-current transition-[transform,opacity] duration-300 ease-out-strong motion-reduce:transition-none"
                    style={{
                      top: i * 6.75,
                      transform: menuOpen
                        ? i === 0
                          ? 'translateY(6.75px) rotate(45deg)'
                          : i === 2
                            ? 'translateY(-6.75px) rotate(-45deg)'
                            : 'scaleX(0)'
                        : 'none',
                      opacity: menuOpen && i === 1 ? 0 : 1,
                    }}
                  />
                ))}
              </span>
            </button>
          </Container>

          {/* Reading progress */}
          <span aria-hidden="true" className={`absolute left-0 right-0 -bottom-px h-0.5 overflow-hidden transition-opacity ${menuOpen ? 'opacity-0' : ''}`}>
            <span ref={bar} className="block h-full bg-navy origin-left" style={{ transform: 'scaleX(0)' }} />
          </span>
        </header>

        {/* Phones and tablets: full-screen menu under the header. Links rise in one after another;
            the account actions sit at the bottom, where a thumb reaches. */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="menu"
              id="landing-menu"
              className="lg:hidden fixed inset-x-0 top-16 sm:top-[72px] bottom-0 z-30 bg-surface flex flex-col"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
              animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.34, ease: [0.32, 0.72, 0, 1] } }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } }}
            >
              <motion.nav
                aria-label="Menu"
                className="flex-1 overflow-y-auto px-4 sm:px-6 pt-5"
                initial="hidden"
                animate="shown"
                variants={{ shown: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } } }}
              >
                <motion.p variants={menuItemMotion} className="text-label font-semibold uppercase tracking-[0.1em] text-muted mb-2">
                  On this page
                </motion.p>
                <ul className="grid gap-1">
                  {NAV.map(([label, id], i) => {
                    const Icon = NAV_ICONS[id];
                    return (
                      <motion.li key={id} variants={menuItemMotion}>
                        <button
                          ref={i === 0 ? firstMenuItem : undefined}
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            window.setTimeout(() => scrollToId(id), 260);
                          }}
                          className="w-full min-h-14 px-2 -mx-2 flex items-center gap-4 rounded-tile text-left cursor-pointer
                            hover:bg-mist active:bg-mist active:scale-[0.99] transition-[background-color,scale] duration-150"
                        >
                          <span className="w-11 h-11 shrink-0 rounded-full grid place-items-center bg-navy-tint text-navy-ink">
                            <Icon className="w-5 h-5" strokeWidth={1.9} aria-hidden="true" />
                          </span>
                          <span className="flex-1 text-[1.1875rem] font-semibold text-ink">{label}</span>
                          <ChevronRight className="w-5 h-5 text-muted" aria-hidden="true" />
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.nav>
              <motion.div
                className="px-4 sm:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-hairline grid gap-2.5"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.18, ease: [0.23, 1, 0.32, 1] } }}
              >
                <Button
                  variant="brand"
                  fullWidth
                  onClick={() => {
                    setMenuOpen(false);
                    setAuth('register');
                  }}
                >
                  Sign up
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setMenuOpen(false);
                    setAuth('login');
                  }}
                >
                  Sign in
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    go('guest');
                  }}
                  disabled={!!busy}
                  className="min-h-11 font-semibold text-navy-ink underline-offset-4 hover:underline cursor-pointer disabled:text-muted"
                >
                  {guestLabel}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phones: once the hero's buttons are gone, the two main actions wait at the bottom */}
        <AnimatePresence>
          {!heroCtaInView && !menuOpen && (
            <motion.div
              key="cta-bar"
              className="sm:hidden fixed inset-x-0 bottom-0 z-30 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]
                bg-surface border-t border-hairline shadow-[0_-6px_20px_rgb(18_48_79/0.08)]"
              initial={reduceMotion ? { opacity: 0 } : { y: '110%' }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0, transition: { type: 'spring', stiffness: 420, damping: 38 } }}
              exit={reduceMotion ? { opacity: 0 } : { y: '110%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            >
              <div className="grid grid-cols-[1fr_auto] gap-2.5">
                <Button variant="brand" onClick={() => setAuth('register')}>
                  Sign up
                </Button>
                <Button variant="outline" onClick={() => setAuth('login')}>
                  Sign in
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main id="top" className="flex-1">
          {/* ---------- Hero: the promise + a glimpse of everything ---------- */}
          <section className="relative" aria-label="Introduction">
          <Container className="min-h-[calc(100svh-64px)] sm:min-h-[calc(100svh-72px)] py-10 sm:py-14 lg:pt-10 lg:pb-20 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] content-center gap-10 lg:gap-12 items-center">
            <div className="min-w-0">
              <Reveal y={0} rootMargin="0px">
                <h1 className="text-[2.625rem] sm:text-[3.5rem] lg:text-[3.625rem] xl:text-[4.125rem] leading-[1.04] lg:whitespace-nowrap font-bold text-navy-ink tracking-[-0.02em]">
                  <span className="block overflow-hidden pb-1">
                    <span className="reveal-line">Your barangay,</span>
                  </span>
                  <span className="block overflow-hidden pb-1">
                    <span className="reveal-line relative" style={{ '--line-delay': '110ms' } as React.CSSProperties}>
                      a tap away.
                      {/* A short underline draws under the promise once the line is in */}
                      <span aria-hidden="true" className="hero-underline absolute left-0 right-[0.4em] -bottom-0.5 h-[0.09em] rounded-full bg-navy/20" />
                    </span>
                  </span>
                </h1>
              </Reveal>
              <Reveal as="p" delay={180} y={12} rootMargin="0px" className="mt-6 text-[1.125rem] sm:text-[1.3125rem] leading-relaxed text-muted max-w-[34rem]">
                eKapitan brings the barangay hall to your phone. Request certificates, report concerns, book the court, send print jobs
                and ask questions, then follow every request until it is ready.
              </Reveal>

              <div ref={heroCta}>
                <Reveal delay={260} y={10} rootMargin="0px" className="mt-9 grid sm:flex gap-3">
                  <Button variant="brand" onClick={() => setAuth('register')}>
                    Sign up
                  </Button>
                  <Button variant="outline" onClick={() => go('guest')} disabled={!!busy}>
                    {guestLabel}
                  </Button>
                </Reveal>
              </div>
              <Reveal as="p" delay={320} y={8} rootMargin="0px" className="mt-3 text-meta text-muted">
                Guests can report, track, verify and read announcements without an account.
              </Reveal>

              {/* Phones: the header has no room for Sign in, so returning residents find it here */}
              <Reveal as="p" delay={340} y={8} rootMargin="0px" className="sm:hidden mt-2 text-meta">
                <span className="text-muted">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setAuth('login')}
                  className="inline-flex items-center min-h-11 font-semibold text-navy-ink underline-offset-4 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </Reveal>

              <ul className="mt-8 pt-6 border-t border-hairline flex flex-wrap gap-x-6 gap-y-2 text-meta text-muted">
                {PROMISES.map((p, i) => (
                  <Reveal as="li" key={p} delay={380 + i * 50} y={6} rootMargin="0px" className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4 text-navy-ink" strokeWidth={2.5} aria-hidden="true" />
                    {p}
                  </Reveal>
                ))}
              </ul>
            </div>

            <div className="min-w-0">
              <HeroCollage />
            </div>
          </Container>

          {/* Scroll cue: only where the hero fits one screen */}
          <button
            type="button"
            onClick={() => scrollToId('features')}
            className="group hidden lg:flex absolute bottom-5 left-1/2 -translate-x-1/2 flex-col items-center gap-2 px-3 py-1 text-meta font-semibold text-muted hover:text-navy-ink cursor-pointer transition-colors animate-fade [animation-delay:1200ms]"
          >
            Scroll to explore
            <span className="w-10 h-10 rounded-full grid place-items-center border border-hairline bg-surface transition-[border-color,background-color] duration-200 group-hover:border-navy-ink/40 group-hover:bg-navy-tint">
              <ChevronDown className="w-5 h-5 nudge" aria-hidden="true" />
            </span>
          </button>
          </section>

          {/* ---------- Feature tour ---------- */}
          <section id="features" className="scroll-mt-20 border-t border-hairline" aria-labelledby="features-title">
            <Container className="pt-16 lg:pt-24 pb-6 lg:pb-10">
              <SectionHeading
                label="Features"
                title="Everything the barangay hall does, now on your phone"
                text="Here is what you can do with an eKapitan account, and what barangay staff see on the other side."
                id="features-title"
              />
              <div className="mt-6 lg:mt-0">
                <FeatureTour />
              </div>
            </Container>
          </section>

          {/* ---------- For guests ---------- */}
          <section id="guests" className="bg-mist scroll-mt-20" aria-labelledby="guests-title">
            <Container className="py-16 lg:py-24">
              <SectionHeading
                label="No account needed"
                title="Not a resident? You can still get things done"
                text="Visitors, workers and anyone in the barangay can use these right away, without signing up."
                id="guests-title"
              />
              <ul className="mt-10 grid md:grid-cols-2 gap-3 lg:gap-4">
                {GUEST_ACTIONS.map((g, i) => {
                  const Icon = g.icon;
                  return (
                    <Reveal as="li" key={g.title} delay={[0, 60, 100, 140, 170, 190][i]} y={18}>
                      <button
                        type="button"
                        onClick={() => go('guest', g.tab)}
                        disabled={!!busy}
                        className="group w-full h-full text-left bg-surface border border-hairline rounded-card p-5 sm:p-6 flex items-center gap-4 sm:gap-5 cursor-pointer
                          transition-[translate,box-shadow,border-color,scale] duration-200 ease-out-strong
                          hover:-translate-y-0.5 hover:shadow-float hover:border-navy-ink/25 active:scale-[0.99]"
                      >
                        <span
                          aria-hidden="true"
                          className="w-12 h-12 shrink-0 rounded-tile grid place-items-center bg-navy-tint text-navy-ink transition-[background-color,color,rotate] duration-200 ease-out-strong
                            group-hover:bg-navy group-hover:text-white group-hover:-rotate-3"
                        >
                          <Icon className="w-5 h-5" strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block font-display text-h3 font-semibold text-navy-ink">{g.title}</b>
                          <span className="block text-meta text-muted mt-1 line-clamp-2 sm:line-clamp-none">{g.text}</span>
                        </span>
                        <span
                          aria-hidden="true"
                          className="w-10 h-10 shrink-0 rounded-full grid place-items-center border border-hairline text-navy-ink
                            transition-[background-color,color,border-color] duration-200 ease-out-strong group-hover:bg-navy group-hover:text-white group-hover:border-navy-ink"
                        >
                          <ArrowRight className="w-4 h-4 transition-transform duration-150 ease-out-strong group-hover:translate-x-0.5" />
                        </span>
                      </button>
                    </Reveal>
                  );
                })}
              </ul>
            </Container>
          </section>

          {/* ---------- Built for everyone ---------- */}
          <section aria-labelledby="built-title">
            <Container className="py-16 lg:py-24 grid lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-16 items-start">
              <div className="lg:sticky lg:top-28">
                <SectionHeading
                  label="Built for everyone"
                  title="Simple enough for every resident, careful with every record"
                  text="Made for residents of every age and every phone, and for the staff who look after their records."
                  id="built-title"
                />
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-10 border-t border-hairline">
                {BUILT_FOR.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <Reveal as="li" key={b.title} delay={(i % 2) * 70} y={12} className="flex gap-4 py-5 border-b border-hairline">
                      <span className="w-9 h-9 shrink-0 rounded-lg grid place-items-center bg-navy-tint text-navy-ink">
                        <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <span>
                        <b className="block text-[1.0625rem] font-semibold text-navy-ink">{b.title}</b>
                        <span className="block text-meta text-muted mt-1">{b.text}</span>
                      </span>
                    </Reveal>
                  );
                })}
              </ul>
            </Container>
          </section>

          {/* ---------- How it works ---------- */}
          <section id="how-it-works" className="bg-mist scroll-mt-20" aria-labelledby="steps-title">
            <Container className="py-16 lg:py-24">
              <SectionHeading label="How it works" title="Three steps, no long lines" id="steps-title" />
              <ol className="mt-10 grid md:grid-cols-3 gap-8">
                {STEPS.map((s, i) => (
                  <Reveal as="li" key={s.title} delay={i * 140} y={16} className="relative group/step">
                    <div className="flex items-center mb-5">
                      {/* The number fills navy as the step arrives */}
                      <span
                        aria-hidden="true"
                        className="w-11 h-11 shrink-0 rounded-full grid place-items-center border-2 border-navy-ink text-navy-ink bg-surface font-display font-semibold
                          transition-colors duration-500 ease-out-strong group-data-[shown=true]/step:bg-navy group-data-[shown=true]/step:text-white"
                        style={{ transitionDelay: `${i * 140 + 200}ms` }}
                      >
                        {i + 1}
                      </span>
                      {/* Connector draws toward the next step; it un-draws when you scroll back past it */}
                      {i < STEPS.length - 1 && <span aria-hidden="true" className="hidden md:block flex-1 h-px ml-4 bg-navy/25 reveal-draw" />}
                    </div>
                    <h3 className="text-h3 font-semibold text-navy-ink">{s.title}</h3>
                    <p className="text-meta text-muted mt-2 max-w-[20rem]">{s.text}</p>
                  </Reveal>
                ))}
              </ol>
            </Container>
          </section>

          {/* ---------- FAQ ---------- */}
          <section id="faq" className="scroll-mt-20" aria-labelledby="faq-title">
            <Container className="py-16 lg:py-24">
              <SectionHeading label="Questions" title="Good to know before you start" id="faq-title" center />
              <div className="mt-10 max-w-[48rem] mx-auto border-t border-hairline">
                {FAQS.map((f, i) => (
                  <Reveal key={f.q} delay={i * 50} y={10}>
                    <FaqItem q={f.q} a={f.a} />
                  </Reveal>
                ))}
              </div>
            </Container>
          </section>

          {/* ---------- Closing call to action ---------- */}
          <Container className="pb-16 lg:pb-24">
            <Reveal y={28} className="bg-navy text-white rounded-banner px-6 py-12 sm:px-12 sm:py-14 text-center">
              <h2 className="text-[1.625rem] sm:text-[2rem] leading-tight font-semibold text-white tracking-[-0.01em]">{TAGLINE}</h2>
              <p className="text-on-navy mt-3 max-w-[32rem] mx-auto">
                Signing up takes about five minutes. Once staff verify your account, you can send your first request.
              </p>
              <div className="mt-8 grid sm:flex justify-center gap-3 max-w-[22rem] sm:max-w-none mx-auto">
                <Button variant="inverse" onClick={() => setAuth('register')}>
                  Sign up
                </Button>
                <Button variant="inverse-outline" onClick={() => go('guest')} disabled={!!busy}>
                  {guestLabel}
                </Button>
              </div>
            </Reveal>
          </Container>
        </main>

        {/* ---------- Footer ---------- */}
        <footer className="border-t border-hairline">
          <Container className="py-12 grid gap-x-6 gap-y-10 grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
            <Reveal y={12} className="col-span-2 lg:col-span-1 max-w-[22rem]">
              <div className="flex items-center gap-2.5">
                <LogoMark size={32} />
                <span className="font-display text-lg font-bold text-navy-ink">eKapitan</span>
              </div>
              <p className="mt-4 font-semibold text-navy-ink">{TAGLINE}</p>
              <p className="mt-1 text-meta text-muted">
                Request documents, report concerns and book barangay facilities online, then pick everything up at the hall.
              </p>
            </Reveal>
            <Reveal delay={110} y={12}>
              <nav aria-labelledby="footer-guest">
                <h2 id="footer-guest" className="text-caption font-semibold uppercase tracking-[0.1em] text-navy-ink font-sans">
                  No account needed
                </h2>
                <ul className="mt-3 grid">
                  {GUEST_ACTIONS.slice(0, 4).map(g => (
                    <FooterLink key={g.tab} onClick={() => go('guest', g.tab)} disabled={!!busy}>
                      {g.title}
                    </FooterLink>
                  ))}
                </ul>
              </nav>
            </Reveal>
            <Reveal delay={150} y={12}>
              <nav aria-labelledby="footer-page">
                <h2 id="footer-page" className="text-caption font-semibold uppercase tracking-[0.1em] text-navy-ink font-sans">
                  On this page
                </h2>
                <ul className="mt-3 grid">
                  {NAV.map(([label, id]) => (
                    <FooterLink key={id} onClick={() => scrollToId(id)}>
                      {label}
                    </FooterLink>
                  ))}
                </ul>
              </nav>
            </Reveal>
          </Container>
          <div className="border-t border-hairline">
            <Container className="pt-5 pb-28 sm:pb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <p className="text-caption text-muted">© {new Date().getFullYear()} eKapitan. Barangay services for the community.</p>
                <nav aria-label="Legal" className="flex flex-wrap gap-x-4">
                  {(['privacy_policy', 'terms', 'privacy_notice'] as LegalDocId[]).map(id => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLegal(id)}
                      className="min-h-11 text-caption font-semibold text-muted hover:text-navy-ink underline-offset-4 hover:underline cursor-pointer transition-colors"
                    >
                      {LEGAL_DOCS[id].title}
                    </button>
                  ))}
                </nav>
              </div>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="group inline-flex items-center gap-1.5 min-h-11 text-caption font-semibold text-muted hover:text-navy-ink cursor-pointer transition-colors"
              >
                <ArrowUp className="w-4 h-4 transition-transform duration-150 ease-out-strong group-hover:-translate-y-0.5" aria-hidden="true" /> Back to top
              </button>
            </Container>
          </div>
        </footer>
      </div>

      <AuthDialog screen={auth} onScreenChange={setAuth} onClose={closeAuth} onEnter={go} busy={busy} />
      <LegalSheet id={legal} onClose={() => setLegal(null)} />
    </>
  );
};
