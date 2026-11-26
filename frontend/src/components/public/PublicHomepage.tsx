import React, { useEffect, useState } from 'react';
import { CircleDot, FileText, Landmark, MessageSquareText, Printer, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { Official } from '../../types';
import { Button, Card, Field, IconTile, Input, Reveal, StatusPill, TextLink, type IconTileTone, initialsOf } from '../ui';
import { BARANGAY } from '../../config/barangay';
import { announcementTone, longAnnouncementDate, sortAnnouncements } from './announcements';
import { scrollToSection, setPendingAuthScreen, setPendingReference, takePendingSection } from './publicNav';

/** "Barangay Kagawad" + "Committee on Health and Sanitation" → "Kagawad, Health and Sanitation" */
const roleLine = (o: Official) =>
  o.position === 'Barangay Kagawad' ? `Kagawad, ${o.committee.replace(/^Committee on\s+/i, '')}` : o.position;

/** Public homepage for guests. Mockups: "Public homepage" (desktop) and "Public · Homepage (mobile)". */
export const PublicHomepage: React.FC = () => {
  const { announcements, officials, setActiveTab, setIsAuthenticated } = useBarangay();
  const [reference, setReference] = useState('');
  const [refError, setRefError] = useState<string>();

  // Arriving from "Services" in the nav: scroll to that section once the page is on screen.
  useEffect(() => {
    const id = takePendingSection();
    if (id) requestAnimationFrame(() => scrollToSection(id));
  }, []);

  const toLogin = () => {
    setPendingAuthScreen('login');
    setIsAuthenticated(false);
  };

  const track = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = reference.trim().toUpperCase();
    if (!ref) {
      setRefError('Enter the reference number you received.');
      return;
    }
    setPendingReference(ref);
    setActiveTab('report_status');
  };

  const services: {
    title: string;
    short: string;
    text: string;
    link: string;
    tone: IconTileTone;
    icon: React.ReactNode;
    onOpen: () => void;
  }[] = [
    {
      title: 'Document Services',
      short: 'Documents',
      text: 'Residency, Indigency, Barangay Clearance and other certificates.',
      link: 'Start a request',
      tone: 'green',
      icon: <FileText strokeWidth={1.8} />,
      onOpen: toLogin,
    },
    {
      title: 'Complaints & Reports',
      short: 'Reports',
      text: 'File a concern and follow it with a tracking number.',
      link: 'File a report',
      tone: 'warning',
      icon: <TriangleAlert strokeWidth={1.8} />,
      onOpen: () => setActiveTab('file_report'),
    },
    {
      title: 'Printing Services',
      short: 'Printing',
      text: 'Upload your files, pick your options, and pick them up at the hall. Free for residents.',
      link: 'Send a print job',
      tone: 'info',
      icon: <Printer strokeWidth={1.8} />,
      onOpen: toLogin,
    },
    {
      title: 'Court Reservation',
      short: 'Court',
      text: 'Check open schedules and request a slot.',
      link: 'Reserve the court',
      tone: 'green',
      icon: <CircleDot strokeWidth={1.8} />,
      onOpen: toLogin,
    },
    {
      title: 'Barangay Officials',
      short: 'Officials',
      text: 'Meet your officials and their committees.',
      link: 'View directory',
      tone: 'info',
      icon: <Landmark strokeWidth={1.8} />,
      onOpen: () => setActiveTab('officials_directory'),
    },
    {
      title: 'Ask Kap',
      short: 'Ask Kap',
      text: 'Quick answers on requirements and office procedures.',
      link: 'Start chatting',
      tone: 'warning',
      icon: <MessageSquareText strokeWidth={1.8} />,
      onOpen: () => setActiveTab('ai_assistant'),
    },
  ];

  const news = sortAnnouncements(announcements);
  const [featured, ...others] = news;

  const active = officials.filter(o => o.status === 'Active (Incumbent)');
  const leaders = [
    active.find(o => o.position === 'Barangay Captain'),
    ...active.filter(o => o.position === 'Barangay Kagawad').slice(0, 2),
    active.find(o => o.position === 'Barangay Secretary'),
  ].filter((o): o is Official => !!o);

  const sectionHead = (eyebrow: string, title: string, link: string, onClick: () => void) => (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <p className="text-caption font-semibold uppercase tracking-[0.08em] text-primary-strong mb-2">{eyebrow}</p>
        <h2 className="text-[1.375rem] sm:text-h2 leading-tight font-semibold text-navy-ink">{title}</h2>
      </div>
      <TextLink onClick={onClick}>{link}</TextLink>
    </div>
  );

  return (
    <div>
      {/* ================= Phone ================= */}
      <div className="md:hidden">
        <section className="bg-primary-tint px-4 py-5">
          <h1 className="text-h2 leading-tight font-bold text-navy-ink">Barangay services, now online</h1>
          <p className="text-meta text-muted mt-2 mb-3.5">Request certificates, file reports and book the court from your phone.</p>
          <Button fullWidth onClick={toLogin}>
            Request a document
          </Button>
        </section>

        <section id="services" className="px-4 pt-4 scroll-mt-20" aria-labelledby="services-title-m">
          <h2 id="services-title-m" className="text-h3 font-semibold text-navy-ink mb-2.5">
            Our services
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {services.slice(0, 4).map(s => (
              <button
                key={s.short}
                type="button"
                onClick={s.onOpen}
                className="text-left bg-surface border border-line rounded-tile p-3.5 font-semibold cursor-pointer hover:border-navy-ink transition-colors"
              >
                <IconTile tone={s.tone} size="sm" className="mb-2 [&_svg]:w-[22px] [&_svg]:h-[22px]">
                  {s.icon}
                </IconTile>
                {s.short}
              </button>
            ))}
          </div>

          {featured && (
            <button
              type="button"
              onClick={() => setActiveTab('guest_announcements')}
              className="w-full text-left mt-2.5 bg-surface border border-line rounded-tile p-3.5 cursor-pointer hover:border-navy-ink transition-colors"
            >
              <span className="block text-meta text-muted">{longAnnouncementDate(featured.date)}</span>
              <b className="font-semibold">{featured.title}</b>
            </button>
          )}
          <TextLink onClick={() => setActiveTab('guest_announcements')} className="mt-1">
            See all announcements
          </TextLink>
        </section>

        {/* Floating chat button, above the bottom nav */}
        <button
          type="button"
          onClick={() => setActiveTab('ai_assistant')}
          className="fixed right-4 bottom-[84px] z-30 h-13 px-[18px] rounded-full bg-navy text-white font-semibold shadow-float inline-flex items-center gap-2 cursor-pointer"
        >
          <MessageSquareText className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />
          Ask Kap
        </button>
      </div>

      {/* ================= Tablet / desktop ================= */}
      <div className="hidden md:block">
        {/* Hero */}
        <section className="bg-navy text-white pt-16 pb-32">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-10 grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center">
            <div>
              <p className="text-caption font-semibold uppercase tracking-[0.08em] text-gold mb-2">Barangay {BARANGAY}</p>
              <h1 className="text-[2.5rem] lg:text-hero leading-[1.12] font-bold text-white">Your barangay hall, open online</h1>
              <p className="text-h3 font-normal text-on-navy mt-4 mb-7 max-w-[520px]">
                Request certificates, file reports, print documents and book the court. Simple steps, no long lines.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="accent" onClick={toLogin}>
                  Request a document
                </Button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guest_help')}
                  className="inline-flex items-center justify-center min-h-12 px-6 rounded-control border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  How it works
                </button>
              </div>
            </div>

            <Card className="shadow-float text-ink">
              <h2 className="text-h3 font-semibold text-navy-ink">Track your request</h2>
              <p className="text-meta text-muted mt-1">Enter the reference number you received.</p>
              <form noValidate onSubmit={track}>
                <Field label="Reference number" error={refError}>
                  {p => (
                    <Input
                      {...p}
                      placeholder="Example: REQ-2026-0819"
                      autoComplete="off"
                      value={reference}
                      onChange={e => {
                        setReference(e.target.value);
                        setRefError(undefined);
                      }}
                    />
                  )}
                </Field>
                <Button type="submit" fullWidth className="mt-4">
                  Check status
                </Button>
              </form>
            </Card>
          </div>
        </section>

        {/* Services, overlapping the hero */}
        <section id="services" aria-label="Our services" className="max-w-[1200px] mx-auto px-6 lg:px-10 -mt-18 scroll-mt-28">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={[0, 70, 120, 160, 190, 210][i]} y={20} rootMargin="0px">
              <Card className="shadow-float flex flex-col items-start h-full">
                <IconTile tone={s.tone} className="mb-3.5">
                  {s.icon}
                </IconTile>
                <h3 className="text-h3 font-semibold text-navy-ink">{s.title}</h3>
                <p className="text-meta text-muted mt-1.5 mb-2 flex-1">{s.text}</p>
                <TextLink onClick={s.onOpen} className="text-base">
                  {s.link}
                </TextLink>
              </Card>
              </Reveal>
            ))}
          </div>
          <p className="text-meta text-muted mt-4">
            Document requests, printing and court bookings are for registered residents. You will be asked to sign in.
          </p>
        </section>

        {/* Announcements */}
        {featured && (
          <section className="max-w-[1200px] mx-auto px-6 lg:px-10 pt-16 lg:pt-18" aria-label="Latest announcements">
            {sectionHead('News', 'Latest announcements', 'View all', () => setActiveTab('guest_announcements'))}
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
              <Reveal y={20}>
              <Card padded="lg">
                <StatusPill tone={announcementTone(featured)}>{featured.category}</StatusPill>
                <h3 className="text-[1.375rem] lg:text-h2 leading-tight font-semibold text-navy-ink mt-3.5 mb-2">{featured.title}</h3>
                <p className="text-meta text-muted line-clamp-4 whitespace-pre-line">{featured.content}</p>
                <p className="text-meta text-muted mt-4">{longAnnouncementDate(featured.date)}</p>
              </Card>
              </Reveal>
              <ul className="grid gap-5">
                {others.slice(0, 3).map((a, i) => (
                  <Reveal as="li" key={a.id} delay={80 + i * 60} y={16}>
                    <Card>
                      <span className="text-meta text-muted">{longAnnouncementDate(a.date)}</span>
                      <h3 className="text-h3 font-semibold text-navy-ink">{a.title}</h3>
                    </Card>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Officials */}
        {leaders.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-6 lg:px-10 pt-16 lg:pt-18" aria-label="Barangay officials">
            {sectionHead('Your leaders', 'Barangay officials', 'Meet all officials', () => setActiveTab('officials_directory'))}
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {leaders.map((o, i) => (
                <Reveal as="li" key={o.id} delay={[0, 70, 120, 160][i] ?? 160} y={18}>
                  <Card className="text-center h-full">
                    <div
                      aria-hidden="true"
                      className="w-21 h-21 rounded-full mx-auto mb-3.5 grid place-items-center bg-primary-tint text-primary-strong font-display font-semibold text-[1.625rem]"
                    >
                      {initialsOf(o.name)}
                    </div>
                    <h3 className="text-h3 font-semibold text-navy-ink">{o.name}</h3>
                    <p className="text-meta text-muted">{roleLine(o)}</p>
                  </Card>
                </Reveal>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};
