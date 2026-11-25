import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, X } from 'lucide-react';
import { Button, Checkbox, Field, FileUpload, Input, PasswordInput } from '../ui';
import type { AuthScreen } from '../public/publicNav';

export type Role = 'citizen' | 'staff' | 'official' | 'guest' | 'admin';

const MAX_ID_BYTES = 5 * 1024 * 1024;
const ID_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1];

const isMobile = (v: string) => /^09\d{9}$/.test(v.replace(/[\s-]/g, ''));
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const ErrorSummary: React.FC<{ show: boolean }> = ({ show }) =>
  show ? (
    <p role="alert" className="mt-4 rounded-control bg-danger-bg text-danger-fg font-semibold px-4 py-3">
      Please fix the fields marked below.
    </p>
  ) : null;

const TextButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...rest }) => (
  <button
    type="button"
    className={`font-semibold text-primary-strong hover:underline underline-offset-4 cursor-pointer min-h-11 ${className}`}
    {...rest}
  />
);

/** Phones get a bottom sheet, larger screens a centered dialog. */
const usePhoneLayout = () => {
  const query = '(max-width: 639px)';
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
};

export interface AuthDialogProps {
  /** Which tab is open; null closes the dialog. */
  screen: AuthScreen | null;
  onScreenChange: (s: AuthScreen) => void;
  onClose: () => void;
  /** Enter the app as a role (prototype sign-in). */
  onEnter: (role: Role) => void;
  busy: Role | null;
}

/**
 * Sign in / Sign up. A centered dialog on desktop and a bottom sheet on phones (docs/DESIGN.md).
 * Prototype auth: any sign-in works; an email containing "admin", "staff" or "captain"/"official"
 * opens that role for the demo.
 */
export const AuthDialog: React.FC<AuthDialogProps> = ({ screen, onScreenChange, onClose, onEnter, busy }) => {
  const phone = usePhoneLayout();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const open = screen !== null;

  /* ---------- Sign in ---------- */
  const [loginMode, setLoginMode] = useState<'login' | 'forgot' | 'code'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [code, setCode] = useState('');
  const [loginErrors, setLoginErrors] = useState<Partial<Record<'identifier' | 'password' | 'code', string>>>({});

  /* ---------- Sign up ---------- */
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regId, setRegId] = useState<File | null>(null);
  const [regErrors, setRegErrors] = useState<Partial<Record<'name' | 'mobile' | 'address' | 'password' | 'id', string>>>({});
  const [registered, setRegistered] = useState<string | null>(null);

  // While open: lock page scroll, close on Escape, and give focus back to the trigger afterwards.
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    // Focus the panel, not the first field: on phones that would pop the keyboard over the sheet.
    requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => {
      html.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      trigger?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  // Switching tabs starts that tab fresh: clear errors and leave password recovery.
  const switchTo = (s: AuthScreen) => {
    setLoginErrors({});
    setRegErrors({});
    setLoginMode('login');
    onScreenChange(s);
  };

  const validIdentifier = (v: string) => isEmail(v) || isMobile(v);

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof loginErrors = {};
    if (!identifier.trim()) errs.identifier = 'Enter your email or mobile number.';
    else if (!validIdentifier(identifier)) errs.identifier = 'Enter a valid email, or a mobile number that starts with 09.';
    if (!password) errs.password = 'Enter your password.';
    setLoginErrors(errs);
    if (Object.keys(errs).length) return;

    const id = identifier.toLowerCase();
    let role: Role = 'citizen';
    if (id.includes('staff')) role = 'staff';
    if (id.includes('captain') || id.includes('official')) role = 'official';
    if (id.includes('admin')) role = 'admin';
    onEnter(role);
  };

  const submitForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'forgot') {
      if (!validIdentifier(identifier)) {
        setLoginErrors({ identifier: 'Enter the email or mobile number on your account.' });
        return;
      }
      setLoginErrors({});
      setLoginMode('code');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setLoginErrors({ code: 'Enter the 6-digit code we sent you.' });
      return;
    }
    onEnter('citizen');
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof regErrors = {};
    if (regName.trim().split(/\s+/).length < 2) errs.name = 'Enter your first and last name.';
    if (!isMobile(regMobile)) errs.mobile = 'Enter an 11-digit mobile number that starts with 09.';
    if (regAddress.trim().length < 5) errs.address = 'Enter your house number and street.';
    if (regPassword.length < 8) errs.password = 'Use at least 8 characters.';
    if (!regId) errs.id = 'Upload a photo or scan of a valid ID.';
    else if (!ID_TYPES.includes(regId.type)) errs.id = 'Upload a JPG, PNG or PDF file.';
    else if (regId.size > MAX_ID_BYTES) errs.id = 'Upload a file that is 5 MB or smaller.';
    setRegErrors(errs);
    if (Object.keys(errs).length) return;
    setRegistered(regName.trim().split(/\s+/)[0]);
  };

  const resetRegistration = () => {
    setRegistered(null);
    setRegName('');
    setRegMobile('');
    setRegAddress('');
    setRegPassword('');
    setRegId(null);
    switchTo('login');
  };

  const showTabs = !(screen === 'login' && loginMode !== 'login') && !(screen === 'register' && registered);
  const title =
    screen === 'register'
      ? registered
        ? `Thank you, ${registered}`
        : 'Create your account'
      : loginMode === 'login'
        ? 'Welcome back'
        : 'Reset your password';

  // Motion: phones slide the sheet up (drawer curve), desktop fades and scales from 0.96. Exit is faster.
  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : phone
      ? {
          initial: { transform: 'translateY(100%)' },
          animate: { transform: 'translateY(0%)', transition: { duration: 0.42, ease: EASE_DRAWER } },
          exit: { transform: 'translateY(100%)', transition: { duration: 0.26, ease: EASE_DRAWER } },
        }
      : {
          initial: { opacity: 0, transform: 'scale(0.96)' },
          animate: { opacity: 1, transform: 'scale(1)', transition: { duration: 0.24, ease: EASE_OUT } },
          exit: { opacity: 0, transform: 'scale(0.98)', transition: { duration: 0.15, ease: EASE_OUT } },
        };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="auth" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-navy/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.24 } }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            {...panelMotion}
            className="relative w-full sm:max-w-[480px] max-h-[92dvh] sm:max-h-[calc(100dvh-48px)] overflow-y-auto overscroll-contain
              bg-surface rounded-t-banner sm:rounded-card shadow-float outline-none
              px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8"
          >
            {/* Title row */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pt-1.5">
                <h2 id={titleId} className="text-h3-lg font-semibold text-navy leading-tight">
                  {title}
                </h2>
                {showTabs && (
                  <p className="text-meta text-muted mt-1">
                    {screen === 'login' ? 'Sign in to request and track barangay services.' : 'For residents. Staff check every account.'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-11 h-11 -mr-2 shrink-0 grid place-items-center rounded-control text-muted hover:bg-surface-muted hover:text-navy cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Sign in | Sign up */}
            {showTabs && (
              <div role="tablist" aria-label="Account" className="grid grid-cols-2 gap-1 p-1 mt-5 rounded-control bg-surface-muted">
                {(['login', 'register'] as const).map(s => {
                  const selected = screen === s;
                  return (
                    <button
                      key={s}
                      role="tab"
                      type="button"
                      aria-selected={selected}
                      onClick={() => switchTo(s)}
                      className={`min-h-11 rounded-lg font-semibold cursor-pointer transition-[background-color,color,box-shadow] duration-150
                        ${selected ? 'bg-surface text-navy shadow-[0_1px_2px_rgb(18_48_79/0.12)]' : 'text-muted hover:text-navy'}`}
                    >
                      {s === 'login' ? 'Sign in' : 'Sign up'}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ---------- Sign in ---------- */}
            {screen === 'login' && loginMode === 'login' && (
              <form noValidate onSubmit={submitLogin} role="tabpanel">
                <ErrorSummary show={Object.keys(loginErrors).length > 0} />
                <Field label="Email or mobile number" error={loginErrors.identifier}>
                  {p => (
                    <Input
                      {...p}
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      inputMode="email"
                      placeholder="name@email.com or 09XX XXX XXXX"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Password" error={loginErrors.password}>
                  {p => (
                    <PasswordInput
                      {...p}
                      autoComplete="current-password"
                      enterKeyHint="go"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  )}
                </Field>
                <div className="flex flex-wrap items-center justify-between gap-x-4 mt-2 mb-4">
                  <Checkbox label="Remember me" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  <TextButton
                    onClick={() => {
                      setLoginErrors({});
                      setLoginMode('forgot');
                    }}
                  >
                    Forgot password?
                  </TextButton>
                </div>
                <Button type="submit" fullWidth disabled={!!busy}>
                  {busy && busy !== 'guest' ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            )}

            {/* ---------- Forgot password ---------- */}
            {screen === 'login' && loginMode !== 'login' && (
              <form noValidate onSubmit={submitForgot}>
                <p className="text-meta text-muted mt-1">
                  {loginMode === 'forgot'
                    ? 'We will send a 6-digit code to your email or mobile number.'
                    : `Enter the 6-digit code we sent to ${identifier}.`}
                </p>
                <ErrorSummary show={Object.keys(loginErrors).length > 0} />
                {loginMode === 'forgot' ? (
                  <Field label="Email or mobile number" error={loginErrors.identifier}>
                    {p => (
                      <Input
                        {...p}
                        autoComplete="username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                      />
                    )}
                  </Field>
                ) : (
                  <Field label="6-digit code" error={loginErrors.code}>
                    {p => (
                      <Input
                        {...p}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        enterKeyHint="done"
                        maxLength={6}
                        className="tracking-[0.4em] font-semibold"
                        value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                      />
                    )}
                  </Field>
                )}
                <div className="grid grid-cols-2 gap-2.5 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setLoginErrors({});
                      setCode('');
                      setLoginMode('login');
                    }}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={!!busy}>
                    {loginMode === 'forgot' ? 'Send code' : 'Verify'}
                  </Button>
                </div>
                {loginMode === 'code' && (
                  <TextButton className="mt-3" onClick={() => setCode('')}>
                    Send a new code
                  </TextButton>
                )}
              </form>
            )}

            {/* ---------- Sign up ---------- */}
            {screen === 'register' && !registered && (
              <form noValidate onSubmit={submitRegister} role="tabpanel">
                <ErrorSummary show={Object.keys(regErrors).length > 0} />
                <Field label="Full name" error={regErrors.name}>
                  {p => <Input {...p} autoComplete="name" value={regName} onChange={e => setRegName(e.target.value)} />}
                </Field>
                <Field label="Mobile number" error={regErrors.mobile} help="We send updates and your account approval by SMS.">
                  {p => (
                    <Input
                      {...p}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="09XX XXX XXXX"
                      value={regMobile}
                      onChange={e => setRegMobile(e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Home address" error={regErrors.address} help="House number, street and purok.">
                  {p => <Input {...p} autoComplete="street-address" value={regAddress} onChange={e => setRegAddress(e.target.value)} />}
                </Field>
                <Field label="Create a password" error={regErrors.password} help="At least 8 characters.">
                  {p => (
                    <PasswordInput {...p} autoComplete="new-password" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                  )}
                </Field>
                <Field label="Valid ID" error={regErrors.id} help="JPG, PNG or PDF, up to 5 MB.">
                  {p => (
                    <FileUpload
                      {...p}
                      accept=".jpg,.jpeg,.png,.pdf"
                      hint="or choose a photo or scan of your ID"
                      files={regId ? [regId] : []}
                      onChange={fs => setRegId(fs[0] ?? null)}
                    />
                  )}
                </Field>
                <p className="text-meta text-muted mt-4 mb-5">Staff verify your details before your account opens.</p>
                <Button type="submit" fullWidth>
                  Create account
                </Button>
              </form>
            )}

            {/* ---------- Sign up done ---------- */}
            {screen === 'register' && registered && (
              <div role="status" className="mt-4">
                <div className="w-13 h-13 rounded-tile grid place-items-center bg-primary-tint text-primary-strong mb-4" aria-hidden="true">
                  <CheckCircle2 className="w-7 h-7" strokeWidth={1.8} />
                </div>
                <p>
                  We received your registration. Staff will check your details and ID, then send an SMS to{' '}
                  <b className="font-semibold whitespace-nowrap">{regMobile}</b> once your account is active.
                </p>
                <Button variant="secondary" fullWidth className="mt-6" onClick={resetRegistration}>
                  Back to sign in
                </Button>
              </div>
            )}

            {/* Guest way out, always one tap away */}
            {showTabs && (
              <p className="text-center text-meta mt-6 pt-5 border-t border-line-soft">
                <span className="text-muted">Not a resident? </span>
                <TextButton onClick={() => onEnter('guest')} disabled={!!busy}>
                  {busy === 'guest' ? 'Opening…' : 'Continue as guest'}
                </TextButton>
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
