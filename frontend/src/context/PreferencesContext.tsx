import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { useBarangay } from './BarangayContext';
import { PREFERENCES_KEY } from './preferencesStorage';

/*
 * Display, accessibility and notification preferences (Settings page, docs/DESIGN.md).
 * Saved on this device (localStorage) and applied as classes on <html>:
 *   dark            theme tokens switch to the dark set (index.css)
 *   large-text      root font 112.5% (existing Large text mode, shared with BarangayContext)
 *   xlarge-text     root font 125%
 *   reduce-motion   animations and transitions collapse to instant; Motion uses reducedMotion="always"
 *   high-contrast   stronger muted text and borders
 */

export type ThemePref = 'light' | 'dark' | 'system';
export type TextSize = 'normal' | 'large' | 'xlarge';

export interface Preferences {
  theme: ThemePref;
  textSize: TextSize;
  reduceMotion: boolean;
  highContrast: boolean;
  notifySms: boolean;
  notifyEmail: boolean;
  notifyAnnouncements: boolean;
  sidebarCollapsed: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'light',
  textSize: 'normal',
  reduceMotion: false,
  highContrast: false,
  notifySms: true,
  notifyEmail: false,
  notifyAnnouncements: true,
  sidebarCollapsed: false,
};

const KEY = PREFERENCES_KEY;

const load = (): Preferences => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

interface PreferencesValue {
  prefs: Preferences;
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
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

  const setPref = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs(p => ({ ...p, [key]: value }));
  }, []);
  const resetPrefs = useCallback(() => setPrefs(DEFAULT_PREFERENCES), []);

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
    if (!largeTextMode && prefs.textSize !== 'normal') setPrefs(p => ({ ...p, textSize: 'normal' }));
    if (largeTextMode && prefs.textSize === 'normal') setPrefs(p => ({ ...p, textSize: 'large' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [largeTextMode]);
  useEffect(() => {
    const wantLarge = prefs.textSize !== 'normal';
    if (wantLarge !== largeTextMode) setLargeTextMode(wantLarge);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.textSize]);

  // Apply to <html>.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', resolvedTheme === 'dark');
    html.style.colorScheme = resolvedTheme;
    html.classList.toggle('xlarge-text', prefs.textSize === 'xlarge');
    html.classList.toggle('reduce-motion', prefs.reduceMotion);
    html.classList.toggle('high-contrast', prefs.highContrast);
  }, [resolvedTheme, prefs.textSize, prefs.reduceMotion, prefs.highContrast]);

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
