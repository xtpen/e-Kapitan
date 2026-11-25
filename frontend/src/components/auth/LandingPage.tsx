import React, { useCallback, useState } from 'react';
import { ArrowRight, Bell, Check, CircleDot, FileText, Printer, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, Card, IconTile, ProgressTimeline, StatusPill, type IconTileTone } from '../ui';
import { takePendingAuthScreen, type AuthScreen } from '../public/publicNav';
import { AuthDialog, type Role } from './AuthDialog';

/*
 * Landing page: the first thing everyone sees. No barangay is named here, only the product.
 * Header (Guest mode / Sign in / Sign up) → hero with an example request → services → how it works
 * → closing call to action → footer. Sign in and Sign up open AuthDialog.
 */

const SERVICES: { title: string; text: string; tone: IconTileTone; icon: React.ReactNode }[] = [
  { title: 'Documents', text: 'Clearance, residency, indigency and other certificates.', tone: 'green', icon: <FileText strokeWidth={1.8} /> },
  { title: 'Complaints & reports', text: 'Report a concern and follow it with a tracking number.', tone: 'warning', icon: <TriangleAlert strokeWidth={1.8} /> },
  { title: 'Printing', text: 'Send a file and pick up the printout at the hall.', tone: 'info', icon: <Printer strokeWidth={1.8} /> },
  { title: 'Court reservation', text: 'See open schedules and request a time slot.', tone: 'green', icon: <CircleDot strokeWidth={1.8} /> },
];

const STEPS = [
  { title: 'Create your account', text: 'Sign up with your name, mobile number, address and a photo of a valid ID.' },
  { title: 'Send your request', text: 'Pick a service and fill in a short form. You get a reference number right away.' },
  { title: 'Claim it at the hall', text: 'We text you when it is ready. Bring your reference number and a valid ID.' },
];

const PROMISES = ['No app to install', 'Works on any phone', 'Staff-verified accounts'];

/** The e-Kapitan mark. The icon file has a wide white margin, so it's cropped in to read at small sizes. */
const Logo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <span
    aria-hidden="true"
    className="shrink-0 overflow-hidden rounded-control bg-surface border border-line grid place-items-center"
    style={{ width: size, height: size }}
  >
    <img src="/favicon.jpg" alt="" width={size} height={size} className="scale-[1.55]" />
  </span>
);

/** Staggered first-view entrance. Decorative, never blocks input, and off under reduced motion. */
const rise = (delayMs: number): React.CSSProperties => ({ animationDelay: `${delayMs}ms` });

/** An example of what residents get: one request and its progress. Purely illustrative. */
const ExampleRequest: React.FC = () => (
  <div className="relative">
    <Card padded="lg" className="shadow-float">
      <div className="flex items-center justify-between gap-3">
        <span className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">Your request</span>
        <span className="text-label font-semibold text-muted border border-line rounded-full px-2.5 py-0.5">Example</span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2 mt-3">
        <div>
          <h3 className="text-h3-lg font-semibold text-navy leading-tight">Barangay Clearance</h3>
          <p className="text-meta text-muted">REQ-2026-0819</p>
        </div>
        <StatusPill tone="success">Ready for pickup</StatusPill>
      </div>
      <ProgressTimeline
        className="mt-5"
        stages={[
          { label: 'Pending', tone: 'warning', reached: true, detail: 'Monday, 9:12 AM' },
          { label: 'Under review', tone: 'info', reached: true, detail: 'Monday, 2:40 PM' },
          { label: 'Approved', tone: 'success', reached: true, detail: 'Tuesday, 10:05 AM' },
          { label: 'Ready for pickup', tone: 'success', reached: true, detail: 'Tuesday, 1:30 PM' },
        ]}
      />
      <p className="mt-5 rounded-control bg-primary-tint text-ink text-meta px-4 py-3">
        Claim it on weekdays, 1:00 PM to 4:00 PM. Bring your reference number and a valid ID.
      </p>
    </Card>

    {/* The text message that comes with it */}
    <div
      aria-hidden="true"
      className="hidden sm:flex absolute -bottom-7 -left-3 lg:-left-10 items-center gap-3 bg-surface border border-line rounded-tile shadow-float pl-3 pr-4 py-3 animate-rise"
      style={rise(420)}
    >
      <span className="w-9 h-9 rounded-full grid place-items-center bg-navy text-white">
        <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
      </span>
      <span>
        <b className="block text-meta font-semibold text-ink leading-tight">Your clearance is ready</b>
        <span className="text-label text-muted">SMS · just now</span>
      </span>
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const { setIsAuthenticated, switchUserRole } = useBarangay();
  const [busy, setBusy] = useState<Role | null>(null);
  // Arriving from the public site's Sign in / Sign up opens the dialog on that tab.
  const [auth, setAuth] = useState<AuthScreen | null>(takePendingAuthScreen);
  const closeAuth = useCallback(() => setAuth(null), []);

  const enter = (role: Role) => {
    setBusy(role);
    setTimeout(() => {
      switchUserRole(role);
      setIsAuthenticated(true);
      setBusy(null);
    }, 500);
  };

  const guestLabel = busy === 'guest' ? 'Opening…' : 'Guest mode';

  return (
    <>
      <div className="min-h-svh flex flex-col bg-canvas text-ink" inert={auth !== null}>
        {/* ---------- Header ---------- */}
        <header className="sticky top-0 z-30 bg-surface border-b border-line">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-[72px] flex items-center gap-3">
            <a href="#top" className="flex items-center gap-2.5 min-h-11 rounded-control" aria-label="e-Kapitan, back to top">
              <Logo />
              <span className="font-display text-xl font-bold text-navy">e-Kapitan</span>
            </a>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => enter('guest')}
              disabled={!!busy}
              className="hidden sm:inline-flex items-center min-h-11 px-3 rounded-control font-semibold text-navy hover:bg-surface-muted cursor-pointer transition-colors disabled:text-muted"
            >
              {guestLabel}
            </button>
            <Button variant="secondary" size="sm" onClick={() => setAuth('login')}>
              Sign in
            </Button>
            <span className="hidden sm:block">
              <Button size="sm" onClick={() => setAuth('register')}>
                Sign up
              </Button>
            </span>
          </div>
        </header>

        <main id="top" className="flex-1">
          {/* ---------- Hero ---------- */}
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-14 sm:pt-16 lg:pt-20 lg:pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
            <div>
              <p
                className="inline-flex items-center gap-2 rounded-full bg-primary-tint text-primary-strong text-caption font-semibold px-3 py-1 animate-rise"
                style={rise(0)}
              >
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-primary" />
                Barangay services, online
              </p>
              <h1
                className="mt-4 text-[2.25rem] sm:text-[2.625rem] lg:text-hero leading-[1.1] font-bold text-navy tracking-[-0.01em] animate-rise"
                style={rise(60)}
              >
                Skip the line at the barangay hall.
              </h1>
              <p className="mt-5 text-h3 font-normal text-muted max-w-[34rem] animate-rise" style={rise(110)}>
                Request certificates, report concerns, book the court and send print jobs from your phone. Every request gets a
                reference number you can track.
              </p>

              <div className="mt-8 grid sm:flex gap-3 animate-rise" style={rise(160)}>
                <Button onClick={() => setAuth('register')}>Create an account</Button>
                <Button variant="secondary" onClick={() => setAuth('login')}>
                  Sign in
                </Button>
              </div>

              <p className="mt-5 animate-rise" style={rise(200)}>
                <span className="text-muted">Just visiting? </span>
                <button
                  type="button"
                  onClick={() => enter('guest')}
                  disabled={!!busy}
                  className="group inline-flex items-center gap-1 min-h-11 font-semibold text-primary-strong cursor-pointer disabled:text-muted"
                >
                  {busy === 'guest' ? 'Opening…' : 'Continue in guest mode'}
                  <ArrowRight
                    className="w-4 h-4 transition-transform duration-150 ease-out-strong group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </p>

              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-meta text-muted animate-rise" style={rise(240)}>
                {PROMISES.map(p => (
                  <li key={p} className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" strokeWidth={2.5} aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:px-6 lg:px-0 animate-rise" style={rise(140)}>
              <ExampleRequest />
            </div>
          </section>

          {/* ---------- Services ---------- */}
          <section className="bg-surface border-y border-line" aria-labelledby="services-title">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-14 lg:py-20">
              <p className="text-caption font-semibold uppercase tracking-[0.08em] text-primary-strong">What you can do</p>
              <h2 id="services-title" className="mt-2 text-[1.5rem] sm:text-h2 leading-tight font-semibold text-navy max-w-[30rem]">
                The services you line up for, in one place
              </h2>
              <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {SERVICES.map(s => (
                  <li key={s.title} className="rounded-card border border-line bg-canvas p-5 sm:p-6">
                    <IconTile tone={s.tone} className="mb-4">
                      {s.icon}
                    </IconTile>
                    <h3 className="text-h3 font-semibold text-navy">{s.title}</h3>
                    <p className="text-meta text-muted mt-1.5">{s.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ---------- How it works ---------- */}
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-14 lg:py-20" aria-labelledby="steps-title">
            <p className="text-caption font-semibold uppercase tracking-[0.08em] text-primary-strong">How it works</p>
            <h2 id="steps-title" className="mt-2 text-[1.5rem] sm:text-h2 leading-tight font-semibold text-navy">
              Three steps, no long lines
            </h2>
            <ol className="mt-8 grid md:grid-cols-3 gap-6 md:gap-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative flex md:block gap-4">
                  <div className="flex md:items-center md:mb-4">
                    <span
                      aria-hidden="true"
                      className="w-10 h-10 shrink-0 rounded-full grid place-items-center bg-navy text-white font-display font-semibold"
                    >
                      {i + 1}
                    </span>
                    {i < STEPS.length - 1 && <span aria-hidden="true" className="hidden md:block flex-1 ml-4 border-t-2 border-dashed border-line" />}
                  </div>
                  <div>
                    <h3 className="text-h3 font-semibold text-navy">{s.title}</h3>
                    <p className="text-meta text-muted mt-1">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ---------- Closing call to action ---------- */}
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 pb-14 lg:pb-20">
            <div className="bg-navy text-white rounded-banner px-6 py-10 sm:px-10 sm:py-12 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
              <div>
                <h2 className="text-[1.5rem] sm:text-h2 leading-tight font-semibold text-white">Ready when you are</h2>
                <p className="text-on-navy mt-2 max-w-[36rem]">
                  Sign up in about five minutes. Once staff verify your account, you can send your first request.
                </p>
              </div>
              <div className="grid sm:flex gap-3">
                <Button variant="accent" onClick={() => setAuth('register')}>
                  Create an account
                </Button>
                <button
                  type="button"
                  onClick={() => enter('guest')}
                  disabled={!!busy}
                  className="inline-flex items-center justify-center min-h-12 px-6 rounded-control border-2 border-white/80 text-white font-semibold
                    hover:bg-white/10 cursor-pointer transition-[background-color,transform] duration-150 ease-out-strong active:scale-[0.97]"
                >
                  {busy === 'guest' ? 'Opening…' : 'Continue as guest'}
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* ---------- Footer ---------- */}
        <footer className="bg-surface border-t border-line">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-8 grid gap-6 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Logo size={32} />
              <div>
                <b className="block font-display font-bold text-navy leading-tight">e-Kapitan</b>
                <span className="text-caption text-muted">Barangay services, online</span>
              </div>
            </div>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-2 gap-y-1 -mx-3">
              {[
                { label: 'Sign in', onClick: () => setAuth('login') },
                { label: 'Sign up', onClick: () => setAuth('register') },
                { label: guestLabel, onClick: () => enter('guest') },
              ].map(l => (
                <button
                  key={l.label}
                  type="button"
                  onClick={l.onClick}
                  disabled={!!busy}
                  className="min-h-11 px-3 rounded-control text-meta font-semibold text-navy hover:bg-surface-muted cursor-pointer transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="border-t border-line-soft">
            <p className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-4 text-caption text-muted">
              © {new Date().getFullYear()} e-Kapitan
            </p>
          </div>
        </footer>
      </div>

      <AuthDialog screen={auth} onScreenChange={setAuth} onClose={closeAuth} onEnter={enter} busy={busy} />
    </>
  );
};
