import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Bell, Check, CheckCircle2, CircleAlert, ClipboardList, FileCheck2, ShieldCheck, X } from 'lucide-react';
import { Button, Checkbox, Expand, Field, FileUpload, Input, LogoMark, PasswordInput } from '../ui';
import { TAGLINE } from '../../config/brand';
import type { AuthScreen } from '../public/publicNav';
import { LegalSheet } from '../legal/LegalSheet';
import type { LegalDocId } from '../legal/legalDocs';

export type Role = 'citizen' | 'admin' | 'superadmin' | 'guest';

const MAX_ID_BYTES = 5 * 1024 * 1024;
const ID_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1];
const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];

const isMobile = (v: string) => /^09\d{9}$/.test(v.replace(/[\s-]/g, ''));
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const ErrorSummary: React.FC<{ show: boolean }> = ({ show }) => (
  <Expand show={show}>
    <p role="alert" className="mt-5 flex items-center gap-2 rounded-control bg-danger-bg text-danger-fg text-meta font-semibold px-4 py-3">
      {show && (
        <>
          <CircleAlert className="w-4 h-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          Please fix the fields marked below.
        </>
      )}
    </p>
  </Expand>
);

const TextButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...rest }) => (
  <button
    type="button"
    className={`font-semibold text-navy-ink hover:underline underline-offset-4 cursor-pointer min-h-11 disabled:text-muted ${className}`}
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

/* ---------- Brand side (tablets and up) ---------- */

const SIGN_IN_POINTS = [
  { icon: ClipboardList, text: 'See where every request stands' },
  { icon: Bell, text: 'Get a text when something is ready' },
  { icon: FileCheck2, text: 'Keep your documents and bookings in one place' },
];

const SIGN_UP_STEPS = ['Tell us about you', 'Set a password and add your ID', 'Staff verify your account'];

const BrandSide: React.FC<{ screen: AuthScreen; step: number }> = ({ screen, step }) => {
  const reduceMotion = useReducedMotion();
  return (
  <aside className="hidden md:flex flex-col w-[42%] shrink-0 bg-navy text-white p-9 lg:p-10" aria-hidden="true">
    <div className="flex items-center gap-2.5">
      <LogoMark size={34} tone="white" />
      <span className="font-display text-lg font-bold">eKapitan</span>
    </div>
    <p className="mt-10 font-display text-[1.625rem] leading-[1.15] font-semibold tracking-[-0.01em] text-balance">{TAGLINE}</p>

    <AnimatePresence mode="wait" initial={false}>
    {screen === 'login' ? (
      <motion.ul
        key="login"
        className="mt-8 grid gap-4"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(8px)' }}
        animate={{ opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.3, ease: EASE_OUT } }}
        exit={{ opacity: 0, transition: { duration: 0.14, ease: EASE_IN } }}
      >
        {SIGN_IN_POINTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-meta text-on-navy">
            <span className="w-9 h-9 shrink-0 rounded-lg grid place-items-center bg-white/10 text-white">
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </span>
            {text}
          </li>
        ))}
      </motion.ul>
    ) : (
      <motion.ol
        key="register"
        className="mt-8 grid gap-1"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(8px)' }}
        animate={{ opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.3, ease: EASE_OUT } }}
        exit={{ opacity: 0, transition: { duration: 0.14, ease: EASE_IN } }}
      >
        {SIGN_UP_STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={s} className="flex items-center gap-3 py-2">
              <span
                className={`w-8 h-8 shrink-0 rounded-full grid place-items-center text-label font-bold transition-colors duration-300
                  ${done ? 'bg-white text-navy-ink' : current ? 'bg-white/15 text-white ring-2 ring-white' : 'bg-white/10 text-white/60'}`}
              >
                {done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={`text-meta transition-colors duration-300 ${current ? 'text-white font-semibold' : done ? 'text-on-navy' : 'text-white/60'}`}>
                {s}
              </span>
            </li>
          );
        })}
      </motion.ol>
    )}
    </AnimatePresence>

    <p className="mt-auto pt-10 flex gap-2.5 text-label text-on-navy leading-relaxed">
      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.8} />
      Your details are used only for your requests, as the Data Privacy Act of 2012 requires.
    </p>
  </aside>
  );
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
 * Sign in / Sign up (docs/DESIGN.md). Tablets and desktop: a two-part dialog, navy brand side on
 * the left (what you get, or the sign-up steps with your progress), form on the right. Phones: a
 * bottom sheet with the form only. Sign up is two short steps, so the form never becomes a long
 * scroll. Prototype auth (no backend yet), any password works with the seed accounts:
 *   resident     maria@email.ph (or any other email / mobile number)
 *   admin        admin@ekapitan.local
 *   super admin  superadmin@ekapitan.local
 */
/** A link inside the consent checkbox's label: opens the document without ticking the box. */
const LegalLink: React.FC<{ onOpen: () => void; children: React.ReactNode }> = ({ onOpen, children }) => (
  <button
    type="button"
    onClick={e => {
      e.preventDefault();
      e.stopPropagation();
      onOpen();
    }}
    className="font-semibold text-navy-ink underline underline-offset-2 hover:no-underline cursor-pointer"
  >
    {children}
  </button>
);

export const AuthDialog: React.FC<AuthDialogProps> = ({ screen, onScreenChange, onClose, onEnter, busy }) => {
  const phone = usePhoneLayout();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const open = screen !== null;
  /** Direction of the last move (1 forward, -1 back), so content slides the way you went. */
  const [dir, setDir] = useState(1);

  /* ---------- Sign in ---------- */
  const [loginMode, setLoginMode] = useState<'login' | 'forgot' | 'code'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [code, setCode] = useState('');
  const [loginErrors, setLoginErrors] = useState<Partial<Record<'identifier' | 'password' | 'code', string>>>({});

  /* ---------- Sign up ---------- */
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regId, setRegId] = useState<File | null>(null);
  const [regErrors, setRegErrors] = useState<Partial<Record<'name' | 'mobile' | 'address' | 'password' | 'id' | 'agree', string>>>({});
  const [regAgree, setRegAgree] = useState(false);
  // A legal document read on top of the form; Escape closes it first, not the whole dialog.
  const [legal, setLegal] = useState<LegalDocId | null>(null);
  const legalOpen = useRef(false);
  legalOpen.current = !!legal;
  const [registered, setRegistered] = useState<string | null>(null);

  // While open: lock page scroll, close on Escape, and give focus back to the trigger afterwards.
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !legalOpen.current && onClose();
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
    if (s === screen) return;
    setDir(s === 'register' ? 1 : -1);
    setLoginErrors({});
    setRegErrors({});
    setLoginMode('login');
    onScreenChange(s);
  };

  const setMode = (m: typeof loginMode, d: number) => {
    setDir(d);
    setLoginErrors({});
    setLoginMode(m);
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
    const role: Role = /super.?admin/.test(id) ? 'superadmin' : id.includes('admin') ? 'admin' : 'citizen';
    onEnter(role);
  };

  const submitForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'forgot') {
      if (!validIdentifier(identifier)) {
        setLoginErrors({ identifier: 'Enter the email or mobile number on your account.' });
        return;
      }
      setMode('code', 1);
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setLoginErrors({ code: 'Enter the 6-digit code we sent you.' });
      return;
    }
    onEnter('citizen');
  };

  /** Step 1: who you are. Step 2: password and ID. Each step checks only its own fields. */
  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof regErrors = {};
    if (regStep === 1) {
      if (regName.trim().split(/\s+/).length < 2) errs.name = 'Enter your first and last name.';
      if (!isMobile(regMobile)) errs.mobile = 'Enter an 11-digit mobile number that starts with 09.';
      if (regAddress.trim().length < 5) errs.address = 'Enter your house number and street.';
      setRegErrors(errs);
      if (Object.keys(errs).length) return;
      setDir(1);
      setRegStep(2);
      return;
    }
    if (regPassword.length < 8) errs.password = 'Use at least 8 characters.';
    if (!regId) errs.id = 'Upload a photo or scan of a valid ID.';
    else if (!ID_TYPES.includes(regId.type)) errs.id = 'Upload a JPG, PNG or PDF file.';
    else if (regId.size > MAX_ID_BYTES) errs.id = 'Upload a file that is 5 MB or smaller.';
    if (!regAgree) errs.agree = 'Agree to the terms and the privacy notice to continue.';
    setRegErrors(errs);
    if (Object.keys(errs).length) return;
    setDir(1);
    setRegistered(regName.trim().split(/\s+/)[0]);
  };

  const resetRegistration = () => {
    setRegistered(null);
    setRegStep(1);
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
  const subtitle =
    screen === 'register'
      ? registered
        ? 'Your registration is in.'
        : 'For residents of the barangay. It takes about five minutes.'
      : loginMode === 'login'
        ? 'Sign in to request and track barangay services.'
        : loginMode === 'forgot'
          ? 'We will send a 6-digit code to your email or mobile number.'
          : `Enter the 6-digit code we sent to ${identifier}.`;

  // Brand side progress: 0, 1 while filling in, 2 once sent (staff verification is next).
  const brandStep = registered ? 2 : regStep - 1;

  // Motion: phones slide the sheet up (drawer curve), larger screens rise 16px while scaling from 0.96.
  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : phone
      ? {
          initial: { transform: 'translateY(100%)' },
          animate: { transform: 'translateY(0%)', transition: { duration: 0.42, ease: EASE_DRAWER } },
          exit: { transform: 'translateY(100%)', transition: { duration: 0.26, ease: EASE_DRAWER } },
        }
      : {
          initial: { opacity: 0, transform: 'translateY(16px) scale(0.96)' },
          animate: { opacity: 1, transform: 'translateY(0px) scale(1)', transition: { duration: 0.34, ease: EASE_OUT } },
          exit: { opacity: 0, transform: 'translateY(8px) scale(0.98)', transition: { duration: 0.18, ease: EASE_IN } },
        };

  // Content swaps (tab, step, recovery): old view leaves fast, new one slides in from the side you moved to.
  const swap = {
    initial: (d: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, transform: `translateX(${d * 24}px)` }),
    animate: { opacity: 1, transform: 'translateX(0px)', transition: { duration: 0.3, ease: EASE_OUT } },
    exit: (d: number) =>
      reduceMotion
        ? { opacity: 0, transition: { duration: 0.12 } }
        : { opacity: 0, transform: `translateX(${d * -24}px)`, transition: { duration: 0.14, ease: EASE_IN } },
  };
  const viewKey = `${screen}-${loginMode}-${regStep}-${registered ? 'done' : 'form'}`;

  return createPortal(
    <>
    <AnimatePresence>
      {open && screen && (
        <div key="auth" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-scrim/40 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            {...panelMotion}
            className="relative w-full sm:max-w-[500px] md:max-w-[900px] h-[min(92dvh,720px)] sm:h-[min(700px,calc(100dvh-48px))] flex
              bg-surface rounded-t-banner sm:rounded-banner shadow-[0_24px_64px_rgb(18_48_79/0.28)] outline-none overflow-hidden"
          >
            <BrandSide screen={screen} step={brandStep} />

            <div className="relative flex-1 min-w-0 flex flex-col overflow-y-auto overscroll-contain px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-9 sm:pt-8 sm:pb-8">
              {/* Sheet handle (phones) */}
              <span aria-hidden="true" className="sm:hidden block mx-auto mb-4 w-10 h-1 rounded-full bg-hairline" />

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-2 right-2 sm:top-4 sm:right-4 w-11 h-11 grid place-items-center rounded-control text-muted hover:bg-mist hover:text-navy-ink cursor-pointer
                  transition-[background-color,color,scale] duration-150 ease-out-strong active:scale-[0.94]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Sign in | Sign up, with an indicator that slides between them */}
              {showTabs && (
                <div role="tablist" aria-label="Account" className="grid grid-cols-2 p-1 mr-12 sm:mr-10 max-w-[320px] rounded-control bg-mist">
                  {(['login', 'register'] as const).map(s => {
                    const selected = screen === s;
                    return (
                      <button
                        key={s}
                        role="tab"
                        type="button"
                        aria-selected={selected}
                        onClick={() => switchTo(s)}
                        className={`relative min-h-10 rounded-lg text-meta font-semibold cursor-pointer transition-colors duration-200
                          ${selected ? 'text-navy-ink' : 'text-muted hover:text-navy-ink'}`}
                      >
                        {selected && (
                          <motion.span
                            layoutId="auth-tab"
                            aria-hidden="true"
                            className="absolute inset-0 rounded-lg bg-surface shadow-[0_1px_3px_rgb(18_48_79/0.14)]"
                            transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                          />
                        )}
                        <span className="relative">{s === 'login' ? 'Sign in' : 'Sign up'}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.div key={viewKey} custom={dir} variants={swap} initial="initial" animate="animate" exit="exit" className="pb-7">
                  {/* Title */}
                  <div className={showTabs ? 'mt-7' : 'mt-2 pr-12'}>
                    {screen === 'login' && loginMode !== 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setCode('');
                          setMode(loginMode === 'code' ? 'forgot' : 'login', -1);
                        }}
                        className="group -ml-1 mb-3 inline-flex items-center gap-1.5 min-h-10 px-1 text-meta font-semibold text-muted hover:text-navy-ink cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 transition-transform duration-150 ease-out-strong group-hover:-translate-x-0.5" aria-hidden="true" />
                        Back
                      </button>
                    )}
                    <h2 id={titleId} className="text-[1.625rem] sm:text-[1.875rem] font-semibold text-navy-ink leading-tight tracking-[-0.01em]">
                      {title}
                    </h2>
                    <p className="text-muted mt-1.5">{subtitle}</p>
                  </div>

                  {/* ---------- Sign in ---------- */}
                  {screen === 'login' && loginMode === 'login' && (
                    <form noValidate onSubmit={submitLogin} role="tabpanel" className="mt-2">
                      <ErrorSummary show={Object.keys(loginErrors).length > 0} />
                      <Field label="Email or mobile number" required error={loginErrors.identifier}>
                        {p => (
                          <Input
                            {...p}
                            autoComplete="username"
                            autoCapitalize="none"
                            autoCorrect="off"
                            inputMode="email"
                            placeholder="e.g. juan@email.com or 0917 123 4567"
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                          />
                        )}
                      </Field>
                      <Field label="Password" required error={loginErrors.password}>
                        {p => (
                          <PasswordInput
                            {...p}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            enterKeyHint="go"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                          />
                        )}
                      </Field>
                      <div className="flex flex-wrap items-center justify-between gap-x-4 mt-2 mb-5">
                        <Checkbox label="Remember me" checked={remember} onChange={e => setRemember(e.target.checked)} />
                        <TextButton className="text-meta" onClick={() => setMode('forgot', 1)}>
                          Forgot password?
                        </TextButton>
                      </div>
                      <Button variant="brand" type="submit" fullWidth disabled={!!busy}>
                        {busy && busy !== 'guest' ? 'Signing in…' : 'Sign in'}
                      </Button>
                    </form>
                  )}

                  {/* ---------- Forgot password ---------- */}
                  {screen === 'login' && loginMode !== 'login' && (
                    <form noValidate onSubmit={submitForgot} className="mt-2">
                      <ErrorSummary show={Object.keys(loginErrors).length > 0} />
                      {loginMode === 'forgot' ? (
                        <Field label="Email or mobile number" required error={loginErrors.identifier}>
                          {p => (
                            <Input
                              {...p}
                              placeholder="The one on your account"
                              autoComplete="username"
                              autoCapitalize="none"
                              autoCorrect="off"
                              value={identifier}
                              onChange={e => setIdentifier(e.target.value)}
                            />
                          )}
                        </Field>
                      ) : (
                        <Field label="6-digit code" required error={loginErrors.code}>
                          {p => (
                            <Input
                              {...p}
                              placeholder="000000"
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
                      <Button variant="brand" type="submit" fullWidth className="mt-6" disabled={!!busy}>
                        {loginMode === 'forgot' ? 'Send code' : 'Verify and sign in'}
                      </Button>
                      {loginMode === 'code' && (
                        <p className="mt-3 text-center text-meta text-muted">
                          Didn’t get it? <TextButton onClick={() => setCode('')}>Send a new code</TextButton>
                        </p>
                      )}
                    </form>
                  )}

                  {/* ---------- Sign up ---------- */}
                  {screen === 'register' && !registered && (
                    <form noValidate onSubmit={submitRegister} role="tabpanel" className="mt-5">
                      {/* Step progress */}
                      <div className="flex items-center gap-3">
                        <span className="text-label font-semibold uppercase tracking-[0.08em] text-muted whitespace-nowrap">
                          Step {regStep} of 2 · {regStep === 1 ? 'About you' : 'Password and ID'}
                        </span>
                        <span className="flex-1 grid grid-cols-2 gap-1.5" aria-hidden="true">
                          <span className="h-1.5 rounded-full bg-navy" />
                          <span className={`h-1.5 rounded-full transition-colors duration-300 ${regStep === 2 ? 'bg-navy' : 'bg-hairline'}`} />
                        </span>
                      </div>
                      <p className="mt-2 text-label text-muted">
                        <span className="text-danger-fg" aria-hidden="true">
                          *
                        </span>{' '}
                        Required
                      </p>
                      <ErrorSummary show={Object.keys(regErrors).length > 0} />

                      {regStep === 1 ? (
                        <>
                          <Field label="Full name" required error={regErrors.name}>
                            {p => (
                              <Input
                                {...p}
                                autoComplete="name"
                                placeholder="e.g. Juan Dela Cruz"
                                value={regName}
                                onChange={e => setRegName(e.target.value)}
                              />
                            )}
                          </Field>
                          <Field label="Mobile number" required error={regErrors.mobile} help="We send updates and your account approval by SMS.">
                            {p => (
                              <Input
                                {...p}
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                placeholder="e.g. 0917 123 4567"
                                value={regMobile}
                                onChange={e => setRegMobile(e.target.value)}
                              />
                            )}
                          </Field>
                          <Field label="Home address" required error={regErrors.address} help="House number, street and purok.">
                            {p => (
                              <Input
                                {...p}
                                autoComplete="street-address"
                                placeholder="e.g. 12 Rizal St., Purok 3"
                                value={regAddress}
                                onChange={e => setRegAddress(e.target.value)}
                              />
                            )}
                          </Field>
                          <Button variant="brand" type="submit" fullWidth className="mt-6">
                            Continue
                          </Button>
                        </>
                      ) : (
                        <>
                          <Field label="Create a password" required error={regErrors.password} help="At least 8 characters. Mix letters and numbers to make it stronger.">
                            {p => (
                              <PasswordInput
                                {...p}
                                placeholder="At least 8 characters"
                                autoComplete="new-password"
                                value={regPassword}
                                onChange={e => setRegPassword(e.target.value)}
                              />
                            )}
                          </Field>
                          <Field label="Valid ID" required error={regErrors.id} help="JPG, PNG or PDF, up to 5 MB. Staff use it to verify you.">
                            {p => (
                              <FileUpload
                                {...p}
                                tone="navy"
                                accept=".jpg,.jpeg,.png,.pdf"
                                hint="or choose a photo or scan of your ID"
                                files={regId ? [regId] : []}
                                onChange={fs => setRegId(fs[0] ?? null)}
                              />
                            )}
                          </Field>
                          <Checkbox
                            className="mt-4"
                            checked={regAgree}
                            onChange={e => setRegAgree(e.target.checked)}
                            error={regErrors.agree}
                            label={
                              <span className="font-normal text-ink">
                                I agree to the <LegalLink onOpen={() => setLegal('terms')}>Terms and Conditions</LegalLink> and the{' '}
                                <LegalLink onOpen={() => setLegal('privacy_notice')}>Data Privacy Notice</LegalLink>.
                              </span>
                            }
                            description={
                              <>
                                See how we protect your information in the <LegalLink onOpen={() => setLegal('privacy_policy')}>Privacy Policy</LegalLink>.
                              </>
                            }
                          />
                          <div className="grid grid-cols-[auto_1fr] gap-3 mt-6">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setRegErrors({});
                                setDir(-1);
                                setRegStep(1);
                              }}
                            >
                              Back
                            </Button>
                            <Button variant="brand" type="submit">
                              Create account
                            </Button>
                          </div>
                        </>
                      )}
                    </form>
                  )}

                  {/* ---------- Sign up done ---------- */}
                  {screen === 'register' && registered && (
                    <div role="status" className="mt-6">
                      <span className="w-14 h-14 rounded-full grid place-items-center bg-success-bg text-success-fg animate-pop" aria-hidden="true">
                        <CheckCircle2 className="w-7 h-7" strokeWidth={1.8} />
                      </span>
                      <p className="mt-5">
                        Staff will check your details and ID. We will text{' '}
                        <b className="font-semibold whitespace-nowrap">{regMobile}</b> once your account is active.
                      </p>
                      <ol className="mt-6 grid gap-3 border-t border-hairline pt-5">
                        {['Staff check your details and ID', 'You get a text when your account is active', 'Sign in and send your first request'].map(
                          (s, i) => (
                            <li key={s} className="flex items-center gap-3 text-meta text-ink">
                              <span className="w-7 h-7 shrink-0 rounded-full grid place-items-center bg-navy-tint text-navy-ink text-label font-bold">{i + 1}</span>
                              {s}
                            </li>
                          ),
                        )}
                      </ol>
                      <Button variant="brand" fullWidth className="mt-7" onClick={resetRegistration}>
                        Back to sign in
                      </Button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Guest way out, always one tap away */}
              {showTabs && (
                <p className="text-center text-meta mt-auto pt-5 border-t border-hairline">
                  <span className="text-muted">Not a resident? </span>
                  <TextButton onClick={() => onEnter('guest')} disabled={!!busy}>
                    {busy === 'guest' ? 'Opening…' : 'Continue as guest'}
                  </TextButton>
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    <LegalSheet id={open ? legal : null} onClose={() => setLegal(null)} />
    </>,
    document.body,
  );
};
