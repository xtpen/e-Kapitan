import React, { useState } from 'react';
import { Check, KeyRound, LogOut, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { AccessArea } from '../../types';
import { Button, Card, CardHeader, Field, PageHeader, PasswordInput, StatusPill, initialsOf } from '../ui';

const AREA_LABEL: Record<AccessArea, string> = {
  documents: 'Document requests',
  complaints: 'Complaints',
  printing: 'Printing requests',
  court: 'Court bookings',
  residents: 'Resident records',
  management: 'Services, officials and chatbot',
  reports: 'Reports and audit logs',
  users: 'Staff accounts',
};

const formatDay = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not recorded';

/**
 * Admin · My account: who you are, what you can use, your password, and sign out.
 * Details come from your staff account (Users & permissions); only a super admin changes access.
 * Desktop: two even columns (each row of cards matches in height). Phones: one column in the same order.
 */
export const AdminAccount: React.FC = () => {
  const { currentUser, currentRole, personnel, setActiveTab, setIsAuthenticated, addToast } = useBarangay();
  const me = personnel.find(p => p.email.toLowerCase() === currentUser.email.toLowerCase());
  const isSuper = currentRole === 'superadmin';

  const [editingPw, setEditingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [confirmOut, setConfirmOut] = useState(false);

  const closePw = () => {
    setEditingPw(false);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setErrors({});
  };

  const savePw = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!currentPw) errs.current = 'Enter your current password.';
    if (newPw.length < 8) errs.next = 'Use at least 8 characters.';
    else if (newPw === currentPw) errs.next = 'Use a different password from your current one.';
    if (confirmPw !== newPw) errs.confirm = 'The passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    closePw();
    addToast('Password changed', 'Use your new password the next time you sign in.', 'success');
  };

  const rows: [string, React.ReactNode][] = [
    ['Position', me?.position ?? currentUser.roleTitle],
    ['Email', currentUser.email],
    ['Mobile', me?.mobile ?? 'Not set'],
    ['Account since', formatDay(me?.addedOn)],
  ];
  const access = me?.access ?? [];

  return (
    <div className="max-w-[1100px]">
      <PageHeader title="My account" description="Your details, what you can use, your password, and signing out." />

      {/* Two columns on desktop; cards in the same row stretch to the same height. */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card data-tour="admin-me" className="min-w-0 flex flex-col">
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="w-14 h-14 shrink-0 rounded-full bg-navy text-gold grid place-items-center font-display font-bold text-lg">
              {initialsOf(currentUser.name)}
            </span>
            <div className="min-w-0">
              <p className="text-h3 font-semibold text-ink leading-tight">{currentUser.name}</p>
              <p className="text-meta text-muted truncate">{currentUser.roleTitle}</p>
              <span className="mt-1.5 inline-flex">
                <StatusPill tone={isSuper ? 'info' : 'success'}>{isSuper ? 'Super administrator' : 'Administrator'}</StatusPill>
              </span>
            </div>
          </div>
          <dl className="mt-4 @container border-t border-line-soft">
            {rows.map(([k, v]) => (
              <div key={k} className="grid @[22rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 py-2.5 border-b border-line-soft last:border-b-0 text-meta">
                <dt className="text-muted">{k}</dt>
                <dd className="font-semibold text-ink [overflow-wrap:anywhere]">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="min-w-0 flex flex-col">
          <CardHeader title="What you can use" />
          {access.length ? (
            <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-2">
              {access.map(a => (
                <li key={a} className="flex items-start gap-2 text-meta text-ink">
                  <Check className="w-4 h-4 mt-0.5 text-success-fg shrink-0" strokeWidth={2.4} aria-hidden="true" /> {AREA_LABEL[a]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-meta text-muted">Your account isn't linked to a staff record yet. Ask a super administrator to set it up.</p>
          )}
          <div className="mt-auto pt-4">
            {isSuper ? (
              <Button variant="secondary" size="sm" onClick={() => setActiveTab('admin_personnel')} icon={<ShieldCheck className="w-4 h-4" aria-hidden="true" />}>
                Manage users & permissions
              </Button>
            ) : (
              <p className="text-meta text-muted">Need something else? A super administrator can change what you can use.</p>
            )}
          </div>
        </Card>

        <Card className="min-w-0 flex flex-col">
          <CardHeader title="Password" />
          {!editingPw ? (
            <>
              <p className="flex items-center gap-2 text-meta text-muted">
                <KeyRound className="w-4 h-4 shrink-0" aria-hidden="true" /> Change it if you think someone else knows it.
              </p>
              <div className="mt-auto pt-4">
                <Button variant="secondary" size="sm" onClick={() => setEditingPw(true)}>
                  Change password
                </Button>
              </div>
            </>
          ) : (
            <form noValidate onSubmit={savePw}>
              <Field label="Current password" error={errors.current} className="[&>label]:mt-0">
                {p => <PasswordInput {...p} autoComplete="current-password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />}
              </Field>
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Field label="New password" error={errors.next} help="At least 8 characters.">
                  {p => <PasswordInput {...p} autoComplete="new-password" value={newPw} onChange={e => setNewPw(e.target.value)} />}
                </Field>
                <Field label="New password again" error={errors.confirm}>
                  {p => <PasswordInput {...p} autoComplete="new-password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />}
                </Field>
              </div>
              <div className="mt-4 flex justify-end gap-2.5">
                <Button variant="secondary" size="sm" onClick={closePw}>
                  Cancel
                </Button>
                <Button size="sm" type="submit">
                  Save password
                </Button>
              </div>
            </form>
          )}
        </Card>

        <Card className="min-w-0 flex flex-col">
          <CardHeader title="Where you're signed in" />
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full bg-success-bg text-success-fg grid place-items-center">
              <MonitorSmartphone className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0 font-semibold text-ink">This computer</span>
            <StatusPill tone="success">Active now</StatusPill>
          </div>
          <div className="mt-auto pt-4">
            <div className="pt-4 border-t border-line-soft">
              {!confirmOut ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-meta text-muted">On a shared computer, always sign out when you're done.</p>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmOut(true)} icon={<LogOut className="w-4 h-4" aria-hidden="true" />}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <div role="alert" className="flex flex-wrap items-center gap-2.5">
                  <span className="text-meta text-ink mr-auto">Sign out of eKapitan now?</span>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmOut(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setIsAuthenticated(false)}>
                    Sign out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
