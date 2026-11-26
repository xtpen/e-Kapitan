import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { useLanguage, useT } from '../../i18n';
import { Button, Field, Input, StatusPill, initialsOf } from '../ui';
import { FormActions, IconCircle, Page, PageTitle, Section, SectionLink } from './kit';

const isMobile = (v: string) => /^09\d{9}$/.test(v.replace(/[\s-]/g, ''));
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const longDate = (iso: string, locale = 'en-US') =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });

/** Label above value, same height and side padding as a ListRow. Not clickable. */
const InfoRows: React.FC<{ rows: [string, React.ReactNode][] }> = ({ rows }) => (
  <dl className="divide-y divide-line-soft">
    {rows.map(([label, value]) => (
      <div key={label} className="min-h-16 px-4 sm:px-5 py-3 flex flex-col justify-center">
        <dt className="text-meta text-muted leading-snug">{label}</dt>
        <dd className="font-semibold text-ink leading-snug mt-0.5 break-words">{value}</dd>
      </div>
    ))}
  </dl>
);

const Saved: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p role="status" className="px-4 sm:px-5 pb-1 flex items-center gap-2 text-meta font-semibold text-success-fg">
    <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
    {children}
  </p>
);

/** Resident · Your profile. */
export const ProfileView: React.FC = () => {
  const { currentUser, residents, updateResidentContact } = useBarangay();
  const resident = residents.find(r => r.id === currentUser.residentId);
  const t = useT();
  const locale = useLanguage() === 'fil' ? 'fil-PH' : 'en-US';

  /* Contact */
  const [editingContact, setEditingContact] = useState(false);
  const [mobile, setMobile] = useState(resident?.contactNumber ?? '');
  const [email, setEmail] = useState(resident?.email ?? currentUser.email ?? '');
  const [contactErrors, setContactErrors] = useState<{ mobile?: string; email?: string }>({});
  const [contactSaved, setContactSaved] = useState(false);

  const fullName = resident
    ? [resident.firstName, resident.middleName, resident.lastName, resident.suffix].filter(Boolean).join(' ')
    : currentUser.name;
  const verified = resident?.status === 'active';

  const startContactEdit = () => {
    setMobile(resident?.contactNumber ?? '');
    setEmail(resident?.email ?? currentUser.email ?? '');
    setContactErrors({});
    setContactSaved(false);
    setEditingContact(true);
  };

  const saveContact = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof contactErrors = {};
    if (!isMobile(mobile)) errs.mobile = t('Enter 11 digits starting with 09.');
    if (email.trim() && !isEmail(email)) errs.email = t('Check your email, or leave it blank.');
    setContactErrors(errs);
    if (Object.keys(errs).length || !resident) return;
    updateResidentContact(resident.id, { contactNumber: mobile.trim(), email: email.trim() || undefined });
    setEditingContact(false);
    setContactSaved(true);
  };

  const personal: [string, React.ReactNode][] = resident
    ? [
        [t('Birthday'), longDate(resident.birthDate, locale)],
        [t('Sex'), resident.gender],
        [t('Civil status'), resident.civilStatus],
        [t('Address'), resident.address],
        [t('Purok'), resident.purok],
        [t('Registered voter'), resident.isVoter ? t('Yes') : t('No')],
        ...(resident.isSenior ? ([[t('Senior citizen'), t('Yes')]] as [string, React.ReactNode][]) : []),
        ...(resident.isPWD ? ([[t('Person with disability'), t('Yes')]] as [string, React.ReactNode][]) : []),
      ]
    : [[t('Name'), currentUser.name]];

  return (
    <Page>
      <PageTitle title={t('Your profile')} />

      <Section>
        <div className="flex items-center gap-4">
          <IconCircle tone="navy" size="lg" className="sm:w-14 sm:h-14 font-display font-semibold text-[1.125rem]">
            {initialsOf(fullName)}
          </IconCircle>
          <div className="min-w-0">
            <p className="text-[1.0625rem] font-semibold text-ink leading-tight break-words">{fullName}</p>
            <div className="mt-1.5">
              {verified ? <StatusPill tone="success">{t('Verified')}</StatusPill> : <StatusPill tone="warning">{t('Not verified yet')}</StatusPill>}
            </div>
          </div>
        </div>
      </Section>

      <Section flush title={t('Personal details')} id="pf-personal">
        <InfoRows rows={personal} />
        <p className="px-4 sm:px-5 pb-4 pt-1 text-meta text-muted">{t('Something wrong? Ask at the barangay hall.')}</p>
      </Section>

      <Section
        flush
        title={t('Contact')}
        id="pf-contact"
        action={!editingContact && resident ? <SectionLink onClick={startContactEdit}>{t('Edit')}</SectionLink> : undefined}
      >
        {contactSaved && !editingContact && <Saved>{t('Saved.')}</Saved>}
        {!editingContact ? (
          <InfoRows
            rows={[
              [t('Mobile number'), resident?.contactNumber || t('Not set')],
              [t('Email'), resident?.email || currentUser.email || t('Not set')],
            ]}
          />
        ) : (
          <form noValidate onSubmit={saveContact} className="px-4 sm:px-5 pb-4 sm:pb-5">
            <Field label={t('Mobile number')} error={contactErrors.mobile}>
              {p => (
                <Input
                  {...p}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder={t('e.g. 0917 123 4567')}
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                />
              )}
            </Field>
            <Field label={t('Email')} optional error={contactErrors.email}>
              {p => <Input {...p} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />}
            </Field>
            <FormActions>
              <Button variant="secondary" onClick={() => setEditingContact(false)}>
                {t('Cancel')}
              </Button>
              <Button variant="brand" type="submit">{t('Save')}</Button>
            </FormActions>
          </form>
        )}
      </Section>

    </Page>
  );
};
