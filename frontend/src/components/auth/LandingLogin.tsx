import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, Card, Checkbox, Field, FileUpload, Input, PasswordInput } from '../ui';

const BARANGAY = 'Sto. Angel';
const MAX_ID_BYTES = 5 * 1024 * 1024;
const ID_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const isMobile = (v: string) => /^09\d{9}$/.test(v.replace(/[\s-]/g, ''));
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

type Role = 'citizen' | 'staff' | 'official' | 'guest' | 'admin';

const ErrorSummary: React.FC<{ show: boolean }> = ({ show }) =>
  show ? (
    <p role="alert" className="mt-4 rounded-control bg-danger-bg text-danger-fg font-semibold px-4 py-3">
      Please fix the fields marked below.
    </p>
  ) : null;

/**
 * Login and registration. Mockup: "Login and registration". See DESIGN.md.
 * Prototype auth: any login works; an email containing "staff", "captain"/"official"
 * or "admin" opens those roles for the demo.
 */
export const LandingLogin: React.FC = () => {
  const { setIsAuthenticated, switchUserRole } = useBarangay();
  const [busy, setBusy] = useState<Role | null>(null);
  const [screen, setScreen] = useState<'login' | 'register'>('login');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // When switching between Log in and Create account, move focus to the new card's heading.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    headingRef.current?.focus({ preventScroll: true });
  }, [screen]);

  /* ---------- Log in ---------- */
  const [loginMode, setLoginMode] = useState<'login' | 'forgot' | 'code'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [code, setCode] = useState('');
  const [loginErrors, setLoginErrors] = useState<Partial<Record<'identifier' | 'password' | 'code', string>>>({});

  /* ---------- Register ---------- */
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regId, setRegId] = useState<File | null>(null);
  const [regErrors, setRegErrors] = useState<Partial<Record<'name' | 'mobile' | 'address' | 'password' | 'id', string>>>({});
  const [registered, setRegistered] = useState<string | null>(null);

  const enter = (role: Role) => {
    setBusy(role);
    setTimeout(() => {
      switchUserRole(role);
      setIsAuthenticated(true);
      setBusy(null);
    }, 500);
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
    enter(role);
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
    enter('citizen');
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof regErrors = {};
    if (regName.trim().split(/\s+/).length < 2) errs.name = 'Enter your first and last name.';
    if (!isMobile(regMobile)) errs.mobile = 'Enter an 11-digit mobile number that starts with 09.';
    if (regAddress.trim().length < 5) errs.address = `Enter your house number and street in ${BARANGAY}.`;
    if (regPassword.length < 8) errs.password = 'Use at least 8 characters.';
    if (!regId) errs.id = 'Upload a photo or scan of a valid ID.';
    else if (!ID_TYPES.includes(regId.type)) errs.id = 'Upload a JPG, PNG or PDF file.';
    else if (regId.size > MAX_ID_BYTES) errs.id = 'Upload a file that is 5 MB or smaller.';
    setRegErrors(errs);
    if (Object.keys(errs).length) return;
    setRegistered(regName.trim().split(/\s+/)[0]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Top bar */}
      <header className="bg-surface border-b border-line px-4 sm:px-10 py-3.5 flex items-center gap-3.5">
        <div
          aria-hidden="true"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full grid place-items-center shrink-0 bg-navy text-gold font-display font-bold"
        >
          SA
        </div>
        <div className="min-w-0">
          <b className="block font-display text-xl leading-tight font-bold text-navy">e-Kapitan</b>
          <span className="block text-caption text-muted truncate">Barangay {BARANGAY}, San Pablo City</span>
        </div>
        <span className="flex-1" />
        <span className="hidden sm:block">
          <Button variant="secondary" size="sm" onClick={() => enter('guest')} disabled={!!busy}>
            {busy === 'guest' ? 'Opening…' : 'Continue as guest'}
          </Button>
        </span>
      </header>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-10 pt-8 sm:pt-12 pb-12">
        <div className="text-center mb-7 sm:mb-8">
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-primary-strong mb-2">Resident access</p>
          <h1 className="text-2xl sm:text-h2 leading-tight font-semibold text-navy">Welcome to e-Kapitan</h1>
          <p className="text-meta text-muted mt-1">
            {screen === 'login' ? 'Log in to use barangay services.' : 'Create an account to use barangay services.'}
          </p>
        </div>

        <div className="max-w-[560px] mx-auto">
          {/* ---------- Log in / forgot password ---------- */}
          {screen === 'login' && (
          <Card padded="lg" className="shadow-float">
            {loginMode === 'login' ? (
              <form noValidate onSubmit={submitLogin}>
                <h2 ref={headingRef} tabIndex={-1} className="text-h3-lg font-semibold text-navy outline-none">Log in</h2>
                <ErrorSummary show={Object.keys(loginErrors).length > 0} />
                <Field label="Email or mobile number" error={loginErrors.identifier}>
                  {p => (
                    <Input
                      {...p}
                      autoComplete="username"
                      placeholder="name@email.com"
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
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  )}
                </Field>
                <div className="flex flex-wrap items-center justify-between gap-x-4 mt-3 mb-5">
                  <Checkbox label="Remember me" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  <button
                    type="button"
                    onClick={() => {
                      setLoginErrors({});
                      setLoginMode('forgot');
                    }}
                    className="font-semibold text-primary-strong hover:underline underline-offset-4 cursor-pointer min-h-11"
                  >
                    Forgot your password?
                  </button>
                </div>
                <Button type="submit" fullWidth disabled={!!busy}>
                  {busy && busy !== 'guest' ? 'Logging in…' : 'Log in'}
                </Button>

                <div className="flex items-center gap-3 my-6" aria-hidden="true">
                  <span className="flex-1 border-t border-line" />
                  <span className="text-meta text-muted">New to e-Kapitan?</span>
                  <span className="flex-1 border-t border-line" />
                </div>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setLoginErrors({});
                    setScreen('register');
                  }}
                >
                  Create an account
                </Button>
              </form>
            ) : (
              <form noValidate onSubmit={submitForgot}>
                <h2 className="text-h3-lg font-semibold text-navy">Reset your password</h2>
                <p className="text-meta text-muted mt-1">
                  {loginMode === 'forgot'
                    ? 'We will send a 6-digit code to your email or mobile number.'
                    : `Enter the 6-digit code we sent to ${identifier}.`}
                </p>
                <ErrorSummary show={Object.keys(loginErrors).length > 0} />
                {loginMode === 'forgot' ? (
                  <Field label="Email or mobile number" error={loginErrors.identifier}>
                    {p => <Input {...p} autoComplete="username" value={identifier} onChange={e => setIdentifier(e.target.value)} />}
                  </Field>
                ) : (
                  <Field label="6-digit code" error={loginErrors.code}>
                    {p => (
                      <Input
                        {...p}
                        inputMode="numeric"
                        autoComplete="one-time-code"
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
                    {loginMode === 'forgot' ? 'Send code' : 'Verify and log in'}
                  </Button>
                </div>
                {loginMode === 'code' && (
                  <button
                    type="button"
                    onClick={() => setCode('')}
                    className="mt-3 font-semibold text-primary-strong hover:underline underline-offset-4 cursor-pointer min-h-11"
                  >
                    Send a new code
                  </button>
                )}
              </form>
            )}
          </Card>
          )}

          {/* ---------- Create account ---------- */}
          {screen === 'register' && (
          <Card padded="lg" className="shadow-float">
            {registered ? (
              <div role="status">
                <div className="w-13 h-13 rounded-tile grid place-items-center bg-primary-tint text-primary-strong mb-4" aria-hidden="true">
                  <CheckCircle2 className="w-7 h-7" strokeWidth={1.8} />
                </div>
                <h2 ref={headingRef} tabIndex={-1} className="text-h3-lg font-semibold text-navy outline-none">Thank you, {registered}</h2>
                <p className="mt-2">
                  We received your registration. Barangay staff will check your details and ID, then send an SMS to{' '}
                  <b className="font-semibold whitespace-nowrap">{regMobile}</b> once your account is active.
                </p>
                <Button
                  variant="secondary"
                  fullWidth
                  className="mt-6"
                  onClick={() => {
                    setRegistered(null);
                    setRegName('');
                    setRegMobile('');
                    setRegAddress('');
                    setRegPassword('');
                    setRegId(null);
                    setScreen('login');
                  }}
                >
                  Back to log in
                </Button>
              </div>
            ) : (
              <form noValidate onSubmit={submitRegister}>
                <h2 ref={headingRef} tabIndex={-1} className="text-h3-lg font-semibold text-navy outline-none">
                  Create a resident account
                </h2>
                <p className="text-meta text-muted mt-1">For residents of Barangay {BARANGAY}.</p>
                <ErrorSummary show={Object.keys(regErrors).length > 0} />
                <div className="grid sm:grid-cols-2 gap-x-4">
                  <Field label="Full name" error={regErrors.name}>
                    {p => <Input {...p} autoComplete="name" value={regName} onChange={e => setRegName(e.target.value)} />}
                  </Field>
                  <Field label="Mobile number" error={regErrors.mobile}>
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
                </div>
                <Field label={`Home address in ${BARANGAY}`} error={regErrors.address} help="House number, street and purok.">
                  {p => (
                    <Input {...p} autoComplete="street-address" value={regAddress} onChange={e => setRegAddress(e.target.value)} />
                  )}
                </Field>
                <Field label="Create a password" error={regErrors.password} help="At least 8 characters.">
                  {p => (
                    <PasswordInput
                      {...p}
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Valid ID for verification" error={regErrors.id} help="JPG, PNG or PDF, up to 5 MB.">
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
                <p className="text-meta text-muted mt-4 mb-5">
                  Staff will verify your details before activating your account.
                </p>
                <Button type="submit" fullWidth>
                  Create account
                </Button>
                <p className="text-center mt-4">
                  <span className="text-muted">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRegErrors({});
                      setScreen('login');
                    }}
                    className="font-semibold text-primary-strong hover:underline underline-offset-4 cursor-pointer min-h-11"
                  >
                    Log in
                  </button>
                </p>
              </form>
            )}
          </Card>
          )}
        </div>

        <p className="text-center mt-8">
          <span className="text-muted">Not a resident? </span>
          <button
            type="button"
            onClick={() => enter('guest')}
            disabled={!!busy}
            className="font-semibold text-primary-strong hover:underline underline-offset-4 cursor-pointer min-h-11"
          >
            Continue as guest
          </button>
          <span className="text-muted"> to report a concern or see public information.</span>
        </p>
      </main>

      <footer className="text-center text-caption text-muted pb-6">© {new Date().getFullYear()} e-Kapitan</footer>
    </div>
  );
};
