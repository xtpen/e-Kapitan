import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { usePreferences } from '../../context/PreferencesContext';
import { useT } from '../../i18n';

/*
 * Guided tour (on by default; Account → Help → Show the tour again).
 * One walk through the app, in order: Home → Services → Ask Kap → Requests → Account. The tour
 * opens each page itself and points at only what matters there, one short sentence each.
 *
 * Everything but the explanation card and the item being explained is dimmed: a full-screen dark
 * layer with a cut-out shaped exactly like the item (same size, same corner rounding).
 * Targets are elements with data-tour="…". A step whose item isn't there is skipped.
 *
 * Guests get their own shorter tour (GUEST_STEPS, seen once as 'guest'): what works without an
 * account, what the locks mean, Track, and where to sign up.
 */

interface Step {
  page: string;
  /** data-tour value to spotlight; none = a card in the middle */
  target?: string;
  title: string;
  text: string;
  only?: 'phone' | 'wide';
}

const TOUR_ID = 'app';

const STEPS: Step[] = [
  { page: 'home', title: 'Welcome to eKapitan', text: 'A quick look around. It takes less than a minute.' },
  { page: 'home', target: 'home-actions', title: 'Quick actions', text: 'Start the most common tasks here.' },
  { page: 'home', target: 'bell', title: 'Notifications', text: 'Updates on your requests show up here.' },
  { page: 'services', target: 'svc-search', title: 'Services', text: 'Find any service. Type what you need, like “clearance”.' },
  { page: 'ai_assistant', target: 'kap-input', title: 'Ask Kap', text: 'Ask about papers, fees and office hours, any time.' },
  { page: 'tracking', target: 'req-tabs', title: 'Requests', text: 'Follow everything you asked for: ongoing, ready to pick up, or done.' },
  { page: 'tracking', target: 'req-new', title: 'New request', text: 'Start a new request with this button.' },
  { page: 'account', target: 'acc-prefs', title: 'Account', text: 'Your profile and password are here, plus settings for dark mode, text size and language.' },
  {
    page: 'account',
    title: 'You’re all set',
    text: 'Swipe left or right to change pages, pull down to refresh, and swipe from the left edge to go back.',
    only: 'phone',
  },
  { page: 'account', title: 'You’re all set', text: 'You can see this tour again from Help on the Account page.', only: 'wide' },
];

const GUEST_TOUR_ID = 'guest';

const GUEST_STEPS: Step[] = [
  { page: 'home', title: 'Welcome to eKapitan', text: 'You are looking around as a guest. Here is what you can do.' },
  { page: 'home', target: 'home-actions', title: 'No account needed', text: 'Report a problem, track a request or check a document right away.' },
  { page: 'services', target: 'svc-search', title: 'Services', text: 'Find any service. The ones with a lock need a free account.' },
  { page: 'ai_assistant', target: 'kap-input', title: 'Ask Kap', text: 'Ask about papers, fees and office hours, any time.' },
  { page: 'tracking', target: 'track-form', title: 'Track', text: 'Got a tracking number? Type it here to see where your request is.' },
  { page: 'account', target: 'guest-you', title: 'Account', text: 'Sign up here to use every service. Display and language settings are here too.' },
  {
    page: 'account',
    title: 'You’re all set',
    text: 'Swipe left or right to change pages, pull down to refresh, and swipe from the left edge to go back.',
    only: 'phone',
  },
  { page: 'account', title: 'You’re all set', text: 'You can see this tour again from Help on the Account page.', only: 'wide' },
];

const ADMIN_TOUR_ID = 'admin';

/** Admin and super admin: the portal in one pass, starting and ending on Overview. */
const ADMIN_STEPS: Step[] = [
  { page: 'admin_overview', title: 'Welcome to the admin portal', text: 'A quick look around. It takes less than a minute.' },
  { page: 'admin_overview', target: 'admin-nav', title: 'Everything in groups', text: 'Pages are grouped by the kind of work: requests, records, content and insights.' },
  { page: 'admin_overview', target: 'admin-attention', title: 'Needs attention', text: 'New requests and reports waiting for someone. Click one to open it.' },
  { page: 'admin_overview', target: 'admin-bell', title: 'Notifications', text: 'New requests, reports and bookings also show up here.' },
  { page: 'admin_overview', target: 'admin-signout', title: 'Sign out', text: 'Sign out here when you are done, especially on a shared computer.' },
  { page: 'admin_account', target: 'admin-me', title: 'My account', text: 'Your details, what you can use, and your password.' },
  { page: 'admin_account', title: 'You’re all set', text: 'You can see this tour again in Settings.' },
];

const isPhone = () => window.matchMedia('(max-width: 1023px)').matches;

/** The visible element for a data-tour value. */
const findTarget = (name: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)).find(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;

type Hole = { x: number; y: number; w: number; h: number; r: number };
const PAD = 4;

export const GuidedTour: React.FC<{ page: string; ready: boolean; guest?: boolean; admin?: boolean }> = ({ page, ready, guest = false, admin = false }) => {
  const TOUR_ID = admin ? ADMIN_TOUR_ID : guest ? GUEST_TOUR_ID : 'app';
  const ALL_STEPS = admin ? ADMIN_STEPS : guest ? GUEST_STEPS : STEPS;
  /** Where the tour starts and where it leaves you. */
  const START = admin ? 'admin_overview' : 'home';
  const { setActiveTab } = useBarangay();
  const { prefs, setPref } = usePreferences();
  const reduce = useReducedMotion();
  const t = useT();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [i, setI] = useState(0);
  const [hole, setHole] = useState<Hole | null>(null);
  const [found, setFound] = useState(false);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const readyRef = useRef(ready);
  readyRef.current = ready;

  // Start once, on Home, after the page has settled.
  useEffect(() => {
    if (steps || !prefs.tour || prefs.toursSeen.includes(TOUR_ID) || page !== START || !ready) return;
    const t = window.setTimeout(() => {
      const phone = isPhone();
      setSteps(ALL_STEPS.filter(s => !s.only || (s.only === 'phone') === phone));
      setI(0);
    }, 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ready, prefs.tour, prefs.toursSeen, steps, guest, admin]);

  const step = steps?.[i];

  // Open the step's page if we're elsewhere.
  useEffect(() => {
    if (step && step.page !== page) {
      setFound(false);
      setActiveTab(step.page);
    }
  }, [step, page, setActiveTab]);

  // Find the step's item once its page is showing; skip the step if it never appears.
  const measure = useCallback(() => {
    if (!step?.target) return setHole(null);
    const el = findTarget(step.target);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12;
    setHole({ x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2, r: Math.min(radius + PAD, (r.height + PAD * 2) / 2) });
  }, [step]);

  useEffect(() => {
    if (!step || step.page !== page) return;
    setFound(false);
    if (!step.target) {
      setHole(null);
      setFound(true);
      return;
    }
    let tries = 0;
    let scrolled = false;
    const id = window.setInterval(() => {
      tries++;
      const el = readyRef.current ? findTarget(step.target!) : null;
      if (el) {
        const r = el.getBoundingClientRect();
        if (!scrolled && (r.top < 70 || r.bottom > window.innerHeight - 90)) {
          scrolled = true;
          el.scrollIntoView({ block: 'center', behavior: 'auto' });
          return; // measure on the next tick, after the scroll
        }
        window.clearInterval(id);
        measure();
        setFound(true);
        // The page's sections rise into place as it opens: measure again once they've settled.
        window.setTimeout(measure, 300);
        window.setTimeout(measure, 700);
      } else if (tries > 40) {
        window.clearInterval(id);
        setI(n => n + 1); // not on this screen: move on
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [step, page, measure]);

  useEffect(() => {
    if (!step) return;
    const on = () => {
      setSize({ w: window.innerWidth, h: window.innerHeight });
      measure();
    };
    window.addEventListener('resize', on);
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('scroll', on);
    };
  }, [step, measure]);

  const finish = useCallback(() => {
    setSteps(null);
    setHole(null);
    if (!prefs.toursSeen.includes(TOUR_ID)) setPref('toursSeen', [...prefs.toursSeen, TOUR_ID]);
    setActiveTab(START);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.toursSeen, setPref, setActiveTab, guest, admin]);

  // Past the last step (e.g. the last items were skipped): end.
  useEffect(() => {
    if (steps && i >= steps.length) finish();
  }, [steps, i, finish]);

  useEffect(() => {
    if (!steps) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') setI(n => n + 1);
      if (e.key === 'ArrowLeft') setI(n => Math.max(n - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steps, finish]);

  // The explanation card: below the item if there is room, else above; beside a tall item (like a
  // sidebar) when neither fits but the side does; in the middle without an item.
  const card = useMemo(() => {
    const w = Math.min(340, size.w - 24);
    if (!hole) return { left: (size.w - w) / 2, top: size.h / 2 - 90, width: w, above: false };
    const below = hole.y + hole.h + 14 + 170 < size.h;
    const aboveFits = hole.y - 14 - 160 >= 12;
    if (!below && !aboveFits && hole.x + hole.w + 16 + w <= size.w - 12) {
      return { left: hole.x + hole.w + 16, top: Math.max(12, Math.min(hole.y + 24, size.h - 200)), width: w, above: false };
    }
    const left = Math.max(12, Math.min(hole.x + hole.w / 2 - w / 2, size.w - w - 12));
    return below ? { left, top: hole.y + hole.h + 14, width: w, above: false } : { left, top: Math.max(12, hole.y - 14 - 160), width: w, above: true };
  }, [hole, size]);

  if (!steps || !step) return null;
  const last = i === steps.length - 1;
  const show = found && step.page === page;
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 380, damping: 36 };
  const h = hole ?? { x: size.w / 2, y: size.h / 2, w: 0, h: 0, r: 0 };

  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-labelledby="tour-title" data-no-gesture>
      {/* Dark layer over everything, with a cut-out for the item being explained */}
      <svg className="fixed inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <mask id="tour-cutout">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect initial={false} animate={{ x: h.x, y: h.y, width: h.w, height: h.h, rx: h.r }} transition={spring} fill="black" />
          </mask>
        </defs>
        <motion.rect
          width="100%"
          height="100%"
          fill="rgb(8 14 22)"
          mask="url(#tour-cutout)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.66 }}
          transition={{ duration: 0.3 }}
        />
      </svg>
      {/* A thin outline around the cut-out */}
      {hole && show && (
        <motion.div
          aria-hidden="true"
          className="fixed pointer-events-none border-2 border-white/80"
          initial={false}
          animate={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h, borderRadius: hole.r }}
          transition={spring}
        />
      )}

      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            key={i}
            className="fixed bg-surface rounded-card shadow-float p-4"
            style={{ left: card.left, top: card.top, width: card.width }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: card.above ? -8 : 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h2 id="tour-title" className="font-semibold text-ink leading-snug">
                  {t(step.title)}
                </h2>
                <p className="text-meta text-muted mt-1 leading-snug">{t(step.text)}</p>
              </div>
              <button
                type="button"
                onClick={finish}
                aria-label={t('Close the tour')}
                className="-mr-2 -mt-2 w-10 h-10 grid place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-caption text-muted tabular-nums">
                {t('{n} of {total}', { n: i + 1, total: steps.length })}
              </span>
              <span className="flex-1" />
              {i > 0 && (
                <button type="button" onClick={() => setI(n => n - 1)} className="min-h-10 px-3 rounded-control text-meta font-semibold text-muted hover:text-ink cursor-pointer">
                  {t('Back')}
                </button>
              )}
              {i === 0 && (
                <button type="button" onClick={finish} className="min-h-10 px-3 rounded-control text-meta font-semibold text-muted hover:text-ink cursor-pointer">
                  {t('Skip')}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => (last ? finish() : setI(n => n + 1))}
                className="min-h-10 px-4 rounded-control bg-navy text-white text-meta font-semibold cursor-pointer active:scale-[0.97] transition-[scale]"
              >
                {last ? t('Done') : t('Next')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
};
