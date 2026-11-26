import React from 'react';
import { Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { Switch } from '../ui';
import { usePreferences, type TextSize, type ThemePref } from '../../context/PreferencesContext';
import { Choice, Page, PageTitle, Section } from './kit';

/*
 * Settings (resident portal). Everything applies right away and is saved on this device.
 */

const THEMES: { id: ThemePref; label: string; icon: React.ReactNode }[] = [
  { id: 'light', label: 'Light', icon: <Sun /> },
  { id: 'dark', label: 'Dark', icon: <Moon /> },
  { id: 'system', label: 'Same as my phone', icon: <Monitor /> },
];

const SIZES: { id: TextSize; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'large', label: 'Large' },
  { id: 'xlarge', label: 'Largest' },
];

export const SettingsView: React.FC = () => {
  const { prefs, setPref, resetPrefs } = usePreferences();

  return (
    <Page>
      <PageTitle title="Settings" sub="Saved on this phone or computer." />

      <Section title="Appearance" id="set-theme">
        <div role="radiogroup" aria-labelledby="set-theme" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {THEMES.map(t => (
            <Choice key={t.id} selected={prefs.theme === t.id} onSelect={() => setPref('theme', t.id)} label={t.label} icon={t.icon} />
          ))}
        </div>
      </Section>

      <Section title="Text size" id="set-text">
        <div role="radiogroup" aria-labelledby="set-text" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SIZES.map(s => (
            <Choice key={s.id} selected={prefs.textSize === s.id} onSelect={() => setPref('textSize', s.id)} label={s.label} />
          ))}
        </div>
        <p className="mt-3 text-ink">Your document is ready to pick up.</p>
      </Section>

      <Section title="Accessibility" id="set-access">
        <div className="divide-y divide-line-soft -mb-2">
          <Switch
            label="Less movement"
            description="Stops sliding and fading."
            checked={prefs.reduceMotion}
            onChange={v => setPref('reduceMotion', v)}
          />
          <Switch
            label="Stronger colors"
            description="Darker text and lines."
            checked={prefs.highContrast}
            onChange={v => setPref('highContrast', v)}
          />
        </div>
      </Section>

      <Section title="Updates" id="set-updates">
        <div className="divide-y divide-line-soft -mb-2">
          <Switch
            label="Text message"
            description="Sent to your mobile number."
            checked={prefs.notifySms}
            onChange={v => setPref('notifySms', v)}
          />
          <Switch label="Email" description="Sent to your email." checked={prefs.notifyEmail} onChange={v => setPref('notifyEmail', v)} />
          <Switch
            label="Announcements"
            description="News and events from the barangay."
            checked={prefs.notifyAnnouncements}
            onChange={v => setPref('notifyAnnouncements', v)}
          />
        </div>
      </Section>

      <div>
        <button
          type="button"
          onClick={resetPrefs}
          className="min-h-11 inline-flex items-center gap-2 px-1 -ml-1 font-semibold text-meta text-navy-ink hover:underline underline-offset-4 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Reset settings
        </button>
      </div>
    </Page>
  );
};
