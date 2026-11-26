import React, { useRef } from 'react';
import { FlaskConical, Languages, Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { StatusPill, Switch } from '../ui';
import { usePreferences, type Language, type TextSize, type ThemePref } from '../../context/PreferencesContext';
import { useBarangay } from '../../context/BarangayContext';
import { useT } from '../../i18n';
import { Choice, Page, PageTitle, Section } from './kit';

/*
 * Display & language (resident portal): how the app looks and reads. Everything applies right
 * away and is saved on this device. What the app sends you is on its own page
 * (NotificationSettingsView); account details are on the Account page.
 *
 *   Language · Display (appearance, text size, bold text) · Accessibility · Developer (dev only)
 */

const LANGUAGES: { id: Language; label: string; sub: string }[] = [
  { id: 'en', label: 'English', sub: 'English' },
  { id: 'fil', label: 'Filipino', sub: 'Tagalog' },
];

const THEMES: { id: ThemePref; label: string; icon: React.ReactNode }[] = [
  { id: 'light', label: 'Light', icon: <Sun /> },
  { id: 'dark', label: 'Dark', icon: <Moon /> },
  { id: 'system', label: 'Same as my device', icon: <Monitor /> },
];

const SIZES: { id: TextSize; label: string; px: number }[] = [
  { id: 'small', label: 'Small', px: 13 },
  { id: 'normal', label: 'Normal', px: 16 },
  { id: 'large', label: 'Large', px: 19 },
];

/** Small label above a group of options inside a section. */
const GroupLabel: React.FC<{ id?: string; children: React.ReactNode; first?: boolean }> = ({ id, children, first }) => (
  <p id={id} className={`text-meta font-semibold text-muted ${first ? 'mb-2' : 'mt-5 mb-2'}`}>
    {children}
  </p>
);

export const SettingsView: React.FC = () => {
  const { prefs, setPref, resetPrefs } = usePreferences();
  const { sampleData, setSampleData } = useBarangay();
  const t = useT();

  // The group that was tapped stays put on screen while the text grows or shrinks.
  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const focused = () => document.activeElement;

  return (
    <Page>
      <PageTitle title={t('Display & language')} sub={t('Saved on this phone or computer.')} />

      <Section title={t('Language')} id="set-lang">
        <div ref={langRef} role="radiogroup" aria-labelledby="set-lang" className="grid grid-cols-2 gap-2">
          {LANGUAGES.map(l => (
            <Choice
              key={l.id}
              selected={prefs.language === l.id}
              onSelect={() => setPref('language', l.id, langRef.current)}
              group="set-lang"
              label={l.label}
              sub={l.sub}
              icon={<Languages />}
            />
          ))}
        </div>
      </Section>

      <Section title={t('Display')} id="set-display">
        <GroupLabel id="set-theme" first>
          {t('Appearance')}
        </GroupLabel>
        <div ref={themeRef} role="radiogroup" aria-labelledby="set-theme" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {THEMES.map(th => (
            <Choice
              key={th.id}
              selected={prefs.theme === th.id}
              onSelect={() => setPref('theme', th.id, themeRef.current)}
              group="set-theme"
              tile
              label={t(th.label)}
              icon={th.icon}
            />
          ))}
        </div>

        <GroupLabel id="set-text">{t('Text size')}</GroupLabel>
        <div ref={sizeRef} role="radiogroup" aria-labelledby="set-text" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SIZES.map(s => (
            <Choice
              key={s.id}
              selected={prefs.textSize === s.id}
              onSelect={() => setPref('textSize', s.id, sizeRef.current)}
              group="set-text"
              tile
              label={t(s.label)}
              icon={
                <span className="block w-6 text-center font-display font-bold leading-none" style={{ fontSize: s.px }}>
                  Aa
                </span>
              }
            />
          ))}
        </div>
        <p className="mt-3 rounded-control bg-surface-muted px-3.5 py-3 text-ink" aria-label={t('Preview')}>
          {t('Your document is ready to pick up.')}
        </p>

        <div className="mt-2 -mb-2">
          <Switch
            label={t('Bold text')}
            description={t('Makes words thicker and easier to read.')}
            checked={prefs.boldText}
            onChange={v => setPref('boldText', v, focused())}
          />
        </div>
      </Section>

      <Section title={t('Accessibility')} id="set-access">
        <div className="divide-y divide-line-soft -mb-2">
          <Switch
            label={t('Less movement')}
            description={t('Turns off sliding and fading.')}
            checked={prefs.reduceMotion}
            onChange={v => setPref('reduceMotion', v)}
          />
          <Switch
            label={t('Stronger colors')}
            description={t('Darker text and borders.')}
            checked={prefs.highContrast}
            onChange={v => setPref('highContrast', v, focused())}
          />
        </div>
      </Section>

      {/* Only while building the app (npm run dev). Never shows in the real app (npm run build). */}
      {import.meta.env.DEV && (
        <Section title="Developer" id="set-dev" tone="warning" action={<StatusPill tone="warning">Dev only</StatusPill>}>
          <div className="-mb-2">
            <Switch
              icon={<FlaskConical />}
              label="Sample data"
              description="Fills the app with made-up requests, reports, bookings and announcements. Turn off to see what a new resident sees."
              checked={sampleData}
              onChange={setSampleData}
            />
          </div>
        </Section>
      )}

      <div>
        <button
          type="button"
          onClick={resetPrefs}
          className="min-h-11 inline-flex items-center gap-2 px-1 -ml-1 font-semibold text-meta text-navy-ink hover:underline underline-offset-4 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          {t('Reset settings')}
        </button>
      </div>
    </Page>
  );
};
