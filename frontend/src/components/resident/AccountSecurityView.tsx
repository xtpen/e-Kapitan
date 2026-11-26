import React, { useState } from 'react';
import { ChevronDown, KeyRound, LockKeyhole, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { useT } from '../../i18n';
import { Button, Expand, Field, Input, PasswordInput, StatusPill, Switch } from '../ui';
import { FormActions, IconCircle, List, ListRow, Page, PageTitle, Section } from './kit';

const digits = (v: string) => v.replace(/\D/g, '');

/** "09171234567" → "0917 ••• 4567". */
const maskMobile = (v: string) => {
  const d = digits(v);
  return d.length >= 8 ? `${d.slice(0, 4)} ••• ${d.slice(-4)}` : '09XX ••• ••••';
};

/** A row that opens a panel under it. Looks exactly like a ListRow. */
const ExpandRow: React.FC<{
  icon: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  panelId: string;
  children: React.ReactNode;
}> = ({ icon, title, sub, open, onToggle, panelId, children }) => (
  <div>
    <button
      type="button"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onToggle}
      className="w-full min-h-16 flex items-center gap-3 px-4 sm:px-5 py-3 text-left cursor-pointer hover:bg-surface-muted transition-colors duration-150 active:bg-surface-muted"
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink leading-snug">{title}</span>
        {sub && <span className="block text-meta text-muted leading-snug mt-0.5">{sub}</span>}
      </span>
      <ChevronDown
        aria-hidden="true"
        className={`w-5 h-5 shrink-0 text-muted transition-transform duration-200 ease-out-strong ${open ? 'rotate-180' : ''}`}
      />
    </button>
    <Expand show={open}>
      <div id={panelId}>{children}</div>
    </Expand>
  </div>
);

type Flow = null | 'change' | 'forgot' | 'data';

/** Resident · Account & security. */
export const AccountSecurityView: React.FC = () => {
  const { currentUser, residents, addToast } = useBarangay();
  const resident = residents.find(r => r.id === currentUser.residentId);
  const t = useT();

  const mobileNow = resident?.contactNumber ?? '';

  // Only one flow open at a time keeps the screen short and leaves one main button.
  const [open, setOpen] = useState<Flow>(null);
  const toggle = (f: Exclude<Flow, null>) => setOpen(o => (o === f ? null : f));

  /* Change password */
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwErrors, setPwErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});

  const resetChange = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setPwErrors({});
  };

  const changePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof pwErrors = {};
    if (!currentPw) errs.current = t('Enter your current password.');
    if (newPw.length < 8) errs.next = t('Use at least 8 characters.');
    else if (newPw === currentPw) errs.next = t('Use a different password from your current one.');
    if (confirmPw !== newPw) errs.confirm = t('The passwords do not match.');
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    resetChange();
    setOpen(null);
    addToast(t('Password changed'), t('Use your new password the next time you sign in.'), 'success');
  };

  /* Forgot password */
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [resetPw, setResetPw] = useState('');
  const [resetErrors, setResetErrors] = useState<{ code?: string; next?: string }>({});

  const resetForgot = () => {
    setCodeSent(false);
    setCode('');
    setResetPw('');
    setResetErrors({});
  };

  const sendCode = () => {
    setCodeSent(true);
    addToast(t('Code sent'), t('Check your messages on {mobile}.', { mobile: maskMobile(mobileNow) }), 'info');
  };

  const setNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof resetErrors = {};
    if (!/^\d{6}$/.test(code.trim())) errs.code = t('Enter the 6-digit code from your messages.');
    if (resetPw.length < 8) errs.next = t('Use at least 8 characters.');
    setResetErrors(errs);
    if (Object.keys(errs).length) return;
    resetForgot();
    setOpen(null);
    addToast(t('Password changed'), t('Use your new password the next time you sign in.'), 'success');
  };

  /* Privacy */
  const [showName, setShowName] = useState(false);

  return (
    <Page>
      <PageTitle title={t('Password & security')} />

      <Section flush title={t('Password')} id="as-password">
        <List>
          <ExpandRow
            icon={
              <IconCircle>
                <LockKeyhole />
              </IconCircle>
            }
            title={t('Change password')}
            open={open === 'change'}
            onToggle={() => {
              resetChange();
              toggle('change');
            }}
            panelId="as-change-pw"
          >
            <form noValidate onSubmit={changePassword} className="px-4 sm:px-5 pb-4 sm:pb-5">
              <Field label={t('Current password')} error={pwErrors.current}>
                {p => <PasswordInput {...p} autoComplete="current-password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />}
              </Field>
              <Field label={t('New password')} error={pwErrors.next} help={t('At least 8 characters.')}>
                {p => <PasswordInput {...p} autoComplete="new-password" value={newPw} onChange={e => setNewPw(e.target.value)} />}
              </Field>
              <Field label={t('New password again')} error={pwErrors.confirm}>
                {p => <PasswordInput {...p} autoComplete="new-password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />}
              </Field>
              <FormActions>
                <Button variant="secondary" onClick={() => setOpen(null)}>
                  {t('Cancel')}
                </Button>
                <Button variant="brand" type="submit">
                  {t('Save')}
                </Button>
              </FormActions>
            </form>
          </ExpandRow>
          <ExpandRow
            icon={
              <IconCircle tone="gray">
                <KeyRound />
              </IconCircle>
            }
            title={t('Forgot your password?')}
            open={open === 'forgot'}
            onToggle={() => {
              resetForgot();
              toggle('forgot');
            }}
            panelId="as-forgot-pw"
          >
            {!codeSent ? (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                <p className="text-ink">{t("We'll send a 6-digit code to {mobile}.", { mobile: maskMobile(mobileNow) })}</p>
                <FormActions>
                  <Button variant="secondary" onClick={() => setOpen(null)}>
                    {t('Cancel')}
                  </Button>
                  <Button variant="brand" onClick={sendCode}>
                    {t('Send code')}
                  </Button>
                </FormActions>
              </div>
            ) : (
              <form noValidate onSubmit={setNewPassword} className="px-4 sm:px-5 pb-4 sm:pb-5">
                <p className="text-muted">{t('We sent a code to {mobile}.', { mobile: maskMobile(mobileNow) })}</p>
                <Field label={t('6-digit code')} error={resetErrors.code}>
                  {p => (
                    <Input
                      {...p}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={e => setCode(digits(e.target.value))}
                    />
                  )}
                </Field>
                <Field label={t('New password')} error={resetErrors.next} help={t('At least 8 characters.')}>
                  {p => <PasswordInput {...p} autoComplete="new-password" value={resetPw} onChange={e => setResetPw(e.target.value)} />}
                </Field>
                <FormActions>
                  <Button variant="secondary" onClick={sendCode}>
                    {t('Send again')}
                  </Button>
                  <Button variant="brand" type="submit">
                    {t('Save')}
                  </Button>
                </FormActions>
              </form>
            )}
          </ExpandRow>
        </List>
      </Section>

      <Section flush title={t("Where you're signed in")} id="as-devices">
        <List>
          <ListRow
            icon={
              <IconCircle tone="green">
                <MonitorSmartphone />
              </IconCircle>
            }
            title={t('This phone or computer')}
            trailing={<StatusPill tone="success">{t('Active now')}</StatusPill>}
          />
        </List>
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">
          <Button variant="outline" size="sm" onClick={() => addToast(t('Signed out'), t('Your other devices are signed out.'), 'success')}>
            {t('Sign out of other devices')}
          </Button>
        </div>
      </Section>

      <Section flush title={t('Privacy')} id="as-privacy">
        <div className="px-4 sm:px-5 divide-y divide-line-soft">
          <Switch
            label={t('Show my name on public reports')}
            description={t('When off, others see “A resident” instead of your name.')}
            checked={showName}
            onChange={setShowName}
          />
        </div>
        <div className="border-t border-line-soft">
          <ExpandRow
            icon={
              <IconCircle tone="blue">
                <ShieldCheck />
              </IconCircle>
            }
            title={t('How we use your data')}
            open={open === 'data'}
            onToggle={() => toggle('data')}
            panelId="as-data"
          >
            <ul className="px-4 sm:px-5 pb-4 sm:pb-5 grid gap-1.5 text-ink list-disc pl-9 sm:pl-10">
              <li>{t('We use your details only for your requests.')}</li>
              <li>{t('Only barangay staff can see them.')}</li>
              <li>{t('To correct or remove them, ask at the barangay hall.')}</li>
            </ul>
          </ExpandRow>
        </div>
      </Section>
    </Page>
  );
};
