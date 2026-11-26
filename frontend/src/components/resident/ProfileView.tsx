import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, Field, Input, PasswordInput, StatusPill, initialsOf } from '../ui';
import { FormActions, IconCircle, Page, PageTitle, Section, SectionLink } from './kit';

const isMobile = (v: string) => /^09\d{9}$/.test(v.replace(/[\s-]/g, ''));
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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

  /* Contact */
  const [editingContact, setEditingContact] = useState(false);
  const [mobile, setMobile] = useState(resident?.contactNumber ?? '');
  const [email, setEmail] = useState(resident?.email ?? currentUser.email ?? '');
  const [contactErrors, setContactErrors] = useState<{ mobile?: string; email?: string }>({});
  const [contactSaved, setContactSaved] = useState(false);

  /* Password */
  const [editingPw, setEditingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwErrors, setPwErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [pwSaved, setPwSaved] = useState(false);

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
    if (!isMobile(mobile)) errs.mobile = 'Enter 11 digits starting with 09.';
    if (email.trim() && !isEmail(email)) errs.email = 'Check your email, or leave it blank.';
    setContactErrors(errs);
    if (Object.keys(errs).length || !resident) return;
    updateResidentContact(resident.id, { contactNumber: mobile.trim(), email: email.trim() || undefined });
    setEditingContact(false);
    setContactSaved(true);
  };

  const closePw = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setPwErrors({});
    setEditingPw(false);
  };

  const changePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof pwErrors = {};
    if (!currentPw) errs.current = 'Enter your current password.';
    if (newPw.length < 8) errs.next = 'Use at least 8 characters.';
    else if (newPw === currentPw) errs.next = 'Use a different password from your current one.';
    if (confirmPw !== newPw) errs.confirm = 'The passwords do not match.';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    closePw();
    setPwSaved(true);
  };

  const personal: [string, React.ReactNode][] = resident
    ? [
        ['Birthday', longDate(resident.birthDate)],
        ['Sex', resident.gender],
        ['Civil status', resident.civilStatus],
        ['Address', resident.address],
        ['Purok', resident.purok],
        ['Registered voter', resident.isVoter ? 'Yes' : 'No'],
        ...(resident.isSenior ? ([['Senior citizen', 'Yes']] as [string, React.ReactNode][]) : []),
        ...(resident.isPWD ? ([['Person with disability', 'Yes']] as [string, React.ReactNode][]) : []),
      ]
    : [['Name', currentUser.name]];

  return (
    <Page>
      <PageTitle title="Your profile" />

      <Section>
        <div className="flex items-center gap-4">
          <IconCircle tone="navy" size="lg" className="sm:w-14 sm:h-14 font-display font-semibold text-[1.125rem]">
            {initialsOf(fullName)}
          </IconCircle>
          <div className="min-w-0">
            <p className="text-[1.0625rem] font-semibold text-ink leading-tight break-words">{fullName}</p>
            <div className="mt-1.5">
              {verified ? <StatusPill tone="success">Verified</StatusPill> : <StatusPill tone="warning">Not verified yet</StatusPill>}
            </div>
          </div>
        </div>
      </Section>

      <Section flush title="Personal details" id="pf-personal">
        <InfoRows rows={personal} />
        <p className="px-4 sm:px-5 pb-4 pt-1 text-meta text-muted">Something wrong? Ask at the barangay hall.</p>
      </Section>

      <Section
        flush
        title="Contact"
        id="pf-contact"
        action={!editingContact && resident ? <SectionLink onClick={startContactEdit}>Edit</SectionLink> : undefined}
      >
        {contactSaved && !editingContact && <Saved>Saved.</Saved>}
        {!editingContact ? (
          <InfoRows
            rows={[
              ['Mobile number', resident?.contactNumber || 'Not set'],
              ['Email', resident?.email || currentUser.email || 'Not set'],
            ]}
          />
        ) : (
          <form noValidate onSubmit={saveContact} className="px-4 sm:px-5 pb-4 sm:pb-5">
            <Field label="Mobile number" error={contactErrors.mobile}>
              {p => (
                <Input
                  {...p}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="e.g. 0917 123 4567"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                />
              )}
            </Field>
            <Field label="Email" optional error={contactErrors.email}>
              {p => <Input {...p} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />}
            </Field>
            <FormActions>
              <Button variant="secondary" onClick={() => setEditingContact(false)}>
                Cancel
              </Button>
              <Button variant="brand" type="submit">Save</Button>
            </FormActions>
          </form>
        )}
      </Section>

      <Section
        flush
        title="Password"
        id="pf-password"
        action={
          !editingPw ? (
            <SectionLink
              onClick={() => {
                setPwSaved(false);
                setEditingPw(true);
              }}
            >
              Change
            </SectionLink>
          ) : undefined
        }
      >
        {pwSaved && !editingPw && <Saved>Password changed.</Saved>}
        {!editingPw ? (
          <p className="min-h-12 px-4 sm:px-5 pb-4 flex items-center text-muted" aria-label="Password hidden">
            ••••••••
          </p>
        ) : (
          <form noValidate onSubmit={changePassword} className="px-4 sm:px-5 pb-4 sm:pb-5">
            <Field label="Current password" error={pwErrors.current}>
              {p => <PasswordInput {...p} autoComplete="current-password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />}
            </Field>
            <Field label="New password" error={pwErrors.next} help="At least 8 characters.">
              {p => <PasswordInput {...p} autoComplete="new-password" value={newPw} onChange={e => setNewPw(e.target.value)} />}
            </Field>
            <Field label="New password again" error={pwErrors.confirm}>
              {p => <PasswordInput {...p} autoComplete="new-password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />}
            </Field>
            <FormActions>
              <Button variant="secondary" onClick={closePw}>
                Cancel
              </Button>
              <Button variant="brand" type="submit">Save</Button>
            </FormActions>
          </form>
        )}
      </Section>
    </Page>
  );
};
