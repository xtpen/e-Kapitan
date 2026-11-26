import React from 'react';
import { Mail, MessageSquareText } from 'lucide-react';
import { Switch } from '../ui';
import { usePreferences } from '../../context/PreferencesContext';
import { useBarangay } from '../../context/BarangayContext';
import { useT } from '../../i18n';
import { Page, PageTitle, Section } from './kit';

/*
 * Notification settings (resident portal): what the app sends you outside the app, and where.
 * The app itself always shows updates (the bell on Home). Saved on this device.
 *
 *   Send to (text message, email) · Send me (request updates, reminders, announcements)
 */

/** "09171234567" → "0917 ••• 4567". */
const maskMobile = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d.length >= 8 ? `${d.slice(0, 4)} ••• ${d.slice(-4)}` : '';
};

export const NotificationSettingsView: React.FC = () => {
  const { prefs, setPref } = usePreferences();
  const { currentUser, residents } = useBarangay();
  const resident = residents.find(r => r.id === currentUser.residentId);
  const t = useT();

  const mobile = maskMobile(resident?.contactNumber ?? '');
  const email = resident?.email || currentUser.email || '';
  const nowhere = !(prefs.notifySms && mobile) && !(prefs.notifyEmail && email);

  return (
    <Page>
      <PageTitle title={t('Notifications')} sub={t('You always see updates in the app. Choose what we also send you.')} />

      <Section title={t('Send to')} id="ns-to">
        <div className="divide-y divide-line-soft -mb-2">
          <Switch
            icon={<MessageSquareText />}
            label={t('Text message')}
            description={mobile ? t('To {mobile}', { mobile }) : t('Add a mobile number in Your profile first.')}
            checked={prefs.notifySms && !!mobile}
            disabled={!mobile}
            onChange={v => setPref('notifySms', v)}
          />
          <Switch
            icon={<Mail />}
            label={t('Email')}
            description={email ? t('To {email}', { email }) : t('Add an email in Your profile first.')}
            checked={prefs.notifyEmail && !!email}
            disabled={!email}
            onChange={v => setPref('notifyEmail', v)}
          />
        </div>
      </Section>

      <Section title={t('Send me')} id="ns-what">
        {nowhere && <p className="mb-1 text-meta text-muted">{t('Turn on text message or email above to get these outside the app.')}</p>}
        <div className="divide-y divide-line-soft -mb-2">
          <Switch
            label={t('Request updates')}
            description={t('When a request moves along, is ready, or needs a fix.')}
            checked={prefs.notifyRequests}
            disabled={nowhere}
            onChange={v => setPref('notifyRequests', v)}
          />
          <Switch
            label={t('Reminders')}
            description={t('The day before a court booking or hall visit.')}
            checked={prefs.notifyReminders}
            disabled={nowhere}
            onChange={v => setPref('notifyReminders', v)}
          />
          <Switch
            label={t('Announcements')}
            description={t('News and events from the barangay.')}
            checked={prefs.notifyAnnouncements}
            disabled={nowhere}
            onChange={v => setPref('notifyAnnouncements', v)}
          />
        </div>
      </Section>
    </Page>
  );
};
