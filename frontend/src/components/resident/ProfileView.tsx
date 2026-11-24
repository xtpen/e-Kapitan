import React, { useState } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, Card, Checkbox, Field, Input, PageHeader, PasswordInput, StatusPill, initialsOf } from '../ui';

const isMobile = (v: string) => /^09\d{9}$/.test(v.replace(/[\s-]/g, ''));
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const Saved: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div role="status" className="mt-4 flex gap-3 rounded-control bg-success-bg text-success-fg px-4 py-3">
    <CheckCircle2 className="w-6 h-6 shrink-0" strokeWidth={1.8} aria-hidden="true" />
    <p className="font-semibold">{children}</p>
  </div>
);

/** Resident · My Profile. No mockup; built from DESIGN.md patterns. */
export const ProfileView: React.FC = () => {
  const {
    currentUser,
    residents,
    updateResidentContact,
    largeTextMode,
    setLargeTextMode,
    smsUpdates,
    setSmsUpdates,
    setIsAuthenticated,
  } = useBarangay();
  const resident = residents.find(r => r.id === currentUser.residentId);

  /* Contact details */
  const [mobile, setMobile] = useState(resident?.contactNumber ?? '');
  const [email, setEmail] = useState(resident?.email ?? currentUser.email ?? '');
  const [contactErrors, setContactErrors] = useState<{ mobile?: string; email?: string }>({});
  const [contactSaved, setContactSaved] = useState(false);

  /* Password */
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwErrors, setPwErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [pwSaved, setPwSaved] = useState(false);

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const fullName = resident
    ? [resident.firstName, resident.middleName, resident.lastName, resident.suffix].filter(Boolean).join(' ')
    : currentUser.name;

  const saveContact = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof contactErrors = {};
    if (!isMobile(mobile)) errs.mobile = 'Enter an 11-digit mobile number that starts with 09.';
    if (email.trim() && !isEmail(email)) errs.email = 'Enter a valid email, or leave it blank.';
    setContactErrors(errs);
    setContactSaved(false);
    if (Object.keys(errs).length || !resident) return;
    updateResidentContact(resident.id, { contactNumber: mobile.trim(), email: email.trim() || undefined });
    setContactSaved(true);
  };

  const changePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof pwErrors = {};
    if (!currentPw) errs.current = 'Enter your current password.';
    if (newPw.length < 8) errs.next = 'Use at least 8 characters.';
    else if (newPw === currentPw) errs.next = 'Choose a password different from your current one.';
    if (confirmPw !== newPw) errs.confirm = 'The two new passwords do not match.';
    setPwErrors(errs);
    setPwSaved(false);
    if (Object.keys(errs).length) return;
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setPwSaved(true);
  };

  const details: [string, string][] = resident
    ? [
        ['Full name', fullName],
        ['Birthdate', longDate(resident.birthDate)],
        ['Sex', resident.gender],
        ['Civil status', resident.civilStatus],
        ['Home address', resident.address],
        ['Purok', resident.purok],
        ['Household', resident.isHouseholdHead ? 'Head of household' : 'Household member'],
      ]
    : [['Full name', currentUser.name]];

  return (
    <div className="max-w-[1200px]">
      <PageHeader title="My Profile" description="Your details as recorded by the barangay, and your account settings." />

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
        <div className="grid gap-3 sm:gap-5 order-2 lg:order-1">
          {/* Personal details (read-only) */}
          <Card padded="lg">
            <h2 className="text-h3-lg font-semibold text-navy">Personal details</h2>
            <dl className="mt-3">
              {details.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-3 border-b border-line-soft last:border-b-0">
                  <dt className="text-meta text-muted">{k}</dt>
                  <dd className="text-meta font-semibold break-words">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex gap-2.5 rounded-control bg-primary-tint border border-primary-tint-line px-4 py-3 text-meta">
              <Info className="w-5 h-5 shrink-0 text-primary-strong mt-0.5" strokeWidth={1.8} aria-hidden="true" />
              <span>
                To correct these details, visit the barangay hall with a valid ID. Staff update them in the resident
                records.
              </span>
            </p>
          </Card>

          {/* Contact details */}
          <Card padded="lg">
            <form noValidate onSubmit={saveContact}>
              <h2 className="text-h3-lg font-semibold text-navy">Contact details</h2>
              <p className="text-meta text-muted mt-1">We use these to send updates about your requests.</p>
              {contactSaved && <Saved>Contact details saved.</Saved>}
              <div className="grid sm:grid-cols-2 gap-x-5">
                <Field label="Mobile number" error={contactErrors.mobile}>
                  {p => (
                    <Input
                      {...p}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={mobile}
                      onChange={e => {
                        setMobile(e.target.value);
                        setContactSaved(false);
                      }}
                    />
                  )}
                </Field>
                <Field label="Email" optional error={contactErrors.email}>
                  {p => (
                    <Input
                      {...p}
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        setContactSaved(false);
                      }}
                    />
                  )}
                </Field>
              </div>
              <Button type="submit" size="sm" className="mt-5">
                Save contact details
              </Button>
            </form>
          </Card>

          {/* Change password */}
          <Card padded="lg">
            <form noValidate onSubmit={changePassword}>
              <h2 className="text-h3-lg font-semibold text-navy">Change password</h2>
              {pwSaved && <Saved>Password changed. Use the new one next time you log in.</Saved>}
              <Field label="Current password" error={pwErrors.current}>
                {p => (
                  <PasswordInput {...p} autoComplete="current-password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
                )}
              </Field>
              <div className="grid sm:grid-cols-2 gap-x-5">
                <Field label="New password" error={pwErrors.next} help="At least 8 characters.">
                  {p => <PasswordInput {...p} autoComplete="new-password" value={newPw} onChange={e => setNewPw(e.target.value)} />}
                </Field>
                <Field label="Type the new password again" error={pwErrors.confirm}>
                  {p => (
                    <PasswordInput {...p} autoComplete="new-password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                  )}
                </Field>
              </div>
              <Button type="submit" size="sm" className="mt-5">
                Change password
              </Button>
            </form>
          </Card>
        </div>

        <div className="grid gap-3 sm:gap-5 order-1 lg:order-2">
          {/* Summary */}
          <Card className="text-center">
            <div
              aria-hidden="true"
              className="w-[84px] h-[84px] rounded-full mx-auto mb-3.5 grid place-items-center bg-primary-tint text-primary-strong font-display font-semibold text-[1.625rem]"
            >
              {initialsOf(fullName)}
            </div>
            <h2 className="text-h3 font-semibold text-navy">{fullName}</h2>
            {resident && (
              <p className="text-meta text-muted mt-0.5">Resident since {new Date(resident.registeredDate).getFullYear()}</p>
            )}
            <div className="mt-3">
              {resident?.status === 'active' ? (
                <StatusPill tone="success">Verified resident</StatusPill>
              ) : (
                <StatusPill tone="warning">Waiting for verification</StatusPill>
              )}
            </div>
            {resident && (
              <dl className="mt-4 pt-1 border-t border-line-soft text-left text-meta">
                {[
                  ['Resident no.', resident.residentNumber],
                  ['Purok', resident.purok.split(' - ')[0]],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-2.5 border-b border-line-soft last:border-b-0">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-semibold whitespace-nowrap">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          {/* Preferences */}
          <Card>
            <h2 className="text-h3 font-semibold text-navy mb-1">Preferences</h2>
            <Checkbox
              label="Large text"
              description="Makes all text and buttons bigger."
              checked={largeTextMode}
              onChange={e => setLargeTextMode(e.target.checked)}
            />
            <Checkbox
              label="SMS updates"
              description="Get a text message when a request changes status."
              checked={smsUpdates}
              onChange={e => setSmsUpdates(e.target.checked)}
            />
          </Card>

          {/* Sign out */}
          <Card>
            {!confirmSignOut ? (
              <Button variant="secondary" fullWidth onClick={() => setConfirmSignOut(true)}>
                Sign out
              </Button>
            ) : (
              <div role="alert">
                <p className="font-semibold">Sign out of e-Kapitan?</p>
                <p className="text-meta text-muted mt-0.5">You will need to log in again to use barangay services.</p>
                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  <Button variant="secondary" onClick={() => setConfirmSignOut(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={() => setIsAuthenticated(false)}>
                    Sign out
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
