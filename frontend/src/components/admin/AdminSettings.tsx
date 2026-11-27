import React, { useRef } from 'react';
import { Compass, FlaskConical, Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { usePreferences, type TextSize, type ThemePref } from '../../context/PreferencesContext';
import { Button, Card, CardHeader, PageHeader, StatusPill, Switch } from '../ui';
import { Choice } from '../resident/kit';

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

/**
 * Admin · Settings: how the portal looks on this computer, the guided tour, and (while building
 * the app only) sample data. Saved on this device, shared with the resident settings.
 * Desktop: Display on the left; Accessibility and Guided tour stacked on the right, ending level
 * with it. Developer (dev only) spans the full width below. Phones: one column in that order.
 */
export const AdminSettings: React.FC = () => {
  const { prefs, setPref, resetPrefs } = usePreferences();
  const { sampleData, setSampleData, setActiveTab } = useBarangay();
  const themeRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        title="Settings"
        description="How the portal looks and works on this computer. Changes save right away."
        action={
          <Button variant="secondary" size="sm" onClick={resetPrefs} icon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}>
            Reset settings
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="min-w-0">
          <CardHeader title="Display" />
          <p id="as-theme" className="text-meta font-semibold text-ink mb-2">
            Appearance
          </p>
          <div ref={themeRef} role="radiogroup" aria-labelledby="as-theme" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {THEMES.map(th => (
              <Choice
                key={th.id}
                tile
                selected={prefs.theme === th.id}
                onSelect={() => setPref('theme', th.id, themeRef.current)}
                group="admin-theme"
                label={th.label}
                icon={th.icon}
              />
            ))}
          </div>
          <p id="as-text" className="text-meta font-semibold text-ink mt-4 mb-2">
            Text size
          </p>
          <div ref={sizeRef} role="radiogroup" aria-labelledby="as-text" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SIZES.map(s => (
              <Choice
                key={s.id}
                tile
                selected={prefs.textSize === s.id}
                onSelect={() => setPref('textSize', s.id, sizeRef.current)}
                group="admin-text"
                label={s.label}
                icon={
                  <span className="block w-6 text-center font-display font-bold leading-none" style={{ fontSize: s.px }}>
                    Aa
                  </span>
                }
              />
            ))}
          </div>
          <div className="mt-2 -mb-2 border-t border-line-soft">
            <Switch
              label="Bold text"
              description="Makes words thicker and easier to read."
              checked={prefs.boldText}
              onChange={v => setPref('boldText', v, document.activeElement)}
            />
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-rows-[auto_1fr] min-w-0">
          <Card>
            <CardHeader title="Accessibility" />
            <div className="divide-y divide-line-soft -my-2">
              <Switch label="Less movement" description="Turns off sliding and fading." checked={prefs.reduceMotion} onChange={v => setPref('reduceMotion', v)} />
              <Switch
                label="Stronger colors"
                description="Darker text and borders."
                checked={prefs.highContrast}
                onChange={v => setPref('highContrast', v, document.activeElement)}
              />
            </div>
          </Card>

          <Card className="flex flex-col">
            <CardHeader title="Guided tour" />
            <p className="text-meta text-muted">A one-minute walk through the admin portal: where things are and how to sign out.</p>
            <div className="mt-auto pt-4">
              <Button
                variant="secondary"
                size="sm"
                icon={<Compass className="w-4 h-4" aria-hidden="true" />}
                onClick={() => {
                  setPref('tour', true);
                  setPref('toursSeen', prefs.toursSeen.filter(id => id !== 'admin'));
                  setActiveTab('admin_overview'); // the tour starts on Overview
                }}
              >
                Show the tour again
              </Button>
            </div>
          </Card>
        </div>

        {/* Only while building the app (npm run dev). Never shows in the real app (npm run build). */}
        {import.meta.env.DEV && (
          <Card tone="callout" data-tour="admin-dev" className="lg:col-span-2">
            <CardHeader title="Developer" action={<StatusPill tone="warning">Dev only</StatusPill>} />
            <div className="-my-2">
              <Switch
                icon={<FlaskConical />}
                label="Sample data"
                description="Fills the portal with made-up requests, reports, bookings and announcements. Turn off to see an empty barangay."
                checked={sampleData}
                onChange={setSampleData}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
