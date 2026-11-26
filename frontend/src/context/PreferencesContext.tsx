import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { MotionConfig } from 'motion/react';
import { useBarangay } from './BarangayContext';
import { PREFERENCES_KEY } from './preferencesStorage';

/*
 * Display, accessibility and notification preferences (Settings page, docs/DESIGN.md).
 * Saved on this device (localStorage) and applied as classes on <html>:
 *   dark            theme tokens switch to the dark set (index.css)
 *   small-text      root font 87.5%
 *   large-text      root font 112.5% (existing Large text mode, shared with BarangayContext)
 *   reduce-motion   animations and transitions collapse to instant; Motion uses reducedMotion="always"
 *   high-contrast   stronger muted text and borders
 *   bold-text       heavier body and label text
 *
 * Changes that repaint the whole page (theme, text size, stronger colors, bold text, language)
 * cross-fade with the View Transitions API where the browser has it, and the control the person
 * tapped stays under their finger while the text reflows. Elsewhere colors fade (.theme-anim).
 */

export type ThemePref = 'light' | 'dark' | 'system';
export type TextSize = 'small' | 'normal' | 'large';
export type Language = 'en' | 'fil';

export interface Preferences {
  theme: ThemePref;
  textSize: TextSize;
  reduceMotion: boolean;
  highContrast: boolean;
  boldText: boolean;
  notifySms: boolean;
  notifyEmail: boolean;
  /** What to send by text or email (the app itself always shows updates). */
  notifyRequests: boolean;
  notifyReminders: boolean;
  notifyAnnouncements: boolean;
  sidebarCollapsed: boolean;
  /** Guided tour: show a short walkthrough the first time each main page opens. */
  tour: boolean;
  /** Tours already finished or skipped (page ids). */
  toursSeen: string[];
  /** Language of the resident portal. */
  language: Language;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'light',
  textSize: 'normal',
  reduceMotion: false,
  highContrast: false,
  boldText: false,
  notifySms: true,
  notifyEmail: false,
  notifyRequests: true,
  notifyReminders: true,
  notifyAnnouncements: true,
  sidebarCollapsed: false,
  tour: true,
  toursSeen: [],
  language: 'en',
};

const KEY = PREFERENCES_KEY;

/** How long a look change takes to settle (matches .theme-anim in index.css). */
const MORPH_MS = 520;

/** Give the cards, title and bars on screen a temporary view-transition name. */
const nameMorphTargets = (): HTMLElement[] => {
  const els = [...document.querySelectorAll<HTMLElement>('main section, main h1, header, nav[aria-label="Main"]')].filter(el => {
    if (el.closest('[aria-hidden="true"],[inert]')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });
  els.forEach((el, i) => (el.style.viewTransitionName = `morph-${i}`));
  return els;
};

/** Preferences that change how the whole page looks. */
const REPAINTS: (keyof Preferences)[] = ['theme', 'textSize', 'highContrast', 'boldText', 'language'];

const load = (): Preferences => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const saved = { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    if ((saved.textSize as string) === 'xlarge') saved.textSize = 'large'; // old "Largest"
    return saved;
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

interface PreferencesValue {
  prefs: Preferences;
  /** `anchor`: the control that was tapped; it stays in place on screen while the page reflows. */
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K], anchor?: Element | null) => void;
  resetPrefs: () => void;
  /** The theme actually showing (system resolved). */
  resolvedTheme: 'light' | 'dark';
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

const useSystemDark = () => {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return dark;
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<Preferences>(load);
  const { largeTextMode, setLargeTextMode } = useBarangay();
  const systemDark = useSystemDark();
  const resolvedTheme = prefs.theme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.theme;

  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  /** True while a view transition is doing the animating, so the color fade stays off. */
  const viaTransition = useRef(false);

  /*
   * Morph to the new look instead of cross-fading:
   *   text size, bold text, colors  CSS transitions on <html> (.theme-anim): the root font size,
   *                                 weights and colors glide, and every rem-sized box follows.
   *   language                      a view transition with the visible cards named, so each card
   *                                 stretches to its new size while its words swap.
   * The tapped control is kept under the finger on every frame until the motion settles.
   */
  const repaint = useCallback((key: keyof Preferences | null, update: () => void, anchor?: Element | null) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
    const calm = prefsRef.current.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const before = anchor?.getBoundingClientRect().top;
    const follow = () => {
      if (!anchor || before === undefined || !anchor.isConnected) return;
      const shift = anchor.getBoundingClientRect().top - before;
      if (Math.abs(shift) > 0.5) window.scrollBy(0, shift);
    };

    if (key === 'language' && !calm && doc.startViewTransition && document.visibilityState === 'visible') {
      const named = nameMorphTargets();
      viaTransition.current = true;
      doc
        .startViewTransition(() => {
          flushSync(update);
          follow();
        })
        .finished.finally(() => {
          named.forEach(el => (el.style.viewTransitionName = ''));
          viaTransition.current = false;
        });
      return;
    }

    flushSync(update);
    follow();
    if (calm) return;
    const until = performance.now() + MORPH_MS;
    const tick = () => {
      follow();
      if (performance.now() < until) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const setPref = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K], anchor?: Element | null) => {
      const update = () => setPrefs(p => ({ ...p, [key]: value }));
      if (REPAINTS.includes(key) && prefsRef.current[key] !== value) repaint(key, update, anchor);
      else update();
    },
    [repaint],
  );
  const resetPrefs = useCallback(() => repaint(null, () => setPrefs(p => ({ ...DEFAULT_PREFERENCES, language: p.language, toursSeen: p.toursSeen, tour: p.tour, sidebarCollapsed: p.sidebarCollapsed }))), [repaint]);

  // Save on this device.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* private mode: preferences last for this visit only */
    }
  }, [prefs]);

  // Text size and the older Large text switch (header menus, public site) stay in step both ways.
  // BarangayContext starts Large text from the saved size (savedTextSizeIsLarge), so on load both agree;
  // after that, the Large text switch elsewhere updates the size here and the reverse.
  useEffect(() => {
    if (!largeTextMode && prefs.textSize === 'large') setPrefs(p => ({ ...p, textSize: 'normal' }));
    if (largeTextMode && prefs.textSize !== 'large') setPrefs(p => ({ ...p, textSize: 'large' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [largeTextMode]);
  useEffect(() => {
    const wantLarge = prefs.textSize === 'large';
    if (wantLarge !== largeTextMode) setLargeTextMode(wantLarge);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.textSize]);

  // Apply to <html>. After the first paint, a change cross-fades its colors (.theme-anim, index.css).
  // Layout effect, so a view transition's "after" picture already has the new classes.
  const applied = useRef(false);
  useLayoutEffect(() => {
    const html = document.documentElement;
    const animate =
      applied.current && !viaTransition.current && !prefs.reduceMotion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    applied.current = true;
    let t = 0;
    if (animate) {
      html.classList.add('theme-anim');
      t = window.setTimeout(() => html.classList.remove('theme-anim'), MORPH_MS);
    }
    html.classList.toggle('dark', resolvedTheme === 'dark');
    html.style.colorScheme = resolvedTheme;
    html.classList.toggle('large-text', prefs.textSize === 'large'); // App.tsx agrees a moment later
    html.classList.toggle('small-text', prefs.textSize === 'small');
    html.classList.remove('xlarge-text');
    html.classList.toggle('reduce-motion', prefs.reduceMotion);
    html.classList.toggle('high-contrast', prefs.highContrast);
    html.classList.toggle('bold-text', prefs.boldText);
    html.lang = prefs.language === 'fil' ? 'fil' : 'en';
    return () => window.clearTimeout(t);
  }, [resolvedTheme, prefs.textSize, prefs.reduceMotion, prefs.highContrast, prefs.boldText, prefs.language]);

  const value = useMemo(() => ({ prefs, setPref, resetPrefs, resolvedTheme }), [prefs, setPref, resetPrefs, resolvedTheme]);

  return (
    <PreferencesContext.Provider value={value}>
      <MotionConfig reducedMotion={prefs.reduceMotion ? 'always' : 'user'}>{children}</MotionConfig>
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
};
