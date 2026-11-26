import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, Card, PageHeader } from '../ui';
import { setPendingAuthScreen } from './publicNav';

const STEPS = [
  {
    title: 'Create your account',
    text: 'Sign up with your name, mobile number, address and a photo of a valid ID. Staff check your details before your account opens.',
  },
  {
    title: 'Send your request',
    text: 'Choose a document, print job or court time and fill in a short form. You get a reference number right away.',
  },
  {
    title: 'Claim it at the hall',
    text: 'We tell you when it is ready. Bring your reference number and a valid ID, weekdays 1:00 PM to 4:00 PM. Any fee is paid at the hall.',
  },
];

const FAQS = [
  {
    q: 'Can I report a concern without an account?',
    a: 'Yes. Anyone can file a report. You get a tracking number to check its progress. Adding your name and mobile number is optional.',
  },
  {
    q: 'Can I request a barangay clearance without an account?',
    a: 'No. Documents, printing and court bookings are only for registered residents of the barangay, so staff can confirm who you are.',
  },
  {
    q: 'How do I check if a barangay document is real?',
    a: 'Use "Verify a barangay document" at the bottom of any page and enter the code printed on the document.',
  },
  {
    q: 'I lost my reference number. What do I do?',
    a: 'Visit the barangay hall with a valid ID, Monday to Friday, 8:00 AM to 5:00 PM. Staff can look it up for you.',
  },
];

/** Public · How it works (the homepage hero's "How it works" button). No mockup; built from DESIGN.md patterns. */
export const HowItWorks: React.FC = () => {
  const { setIsAuthenticated, setActiveTab } = useBarangay();

  const register = () => {
    setPendingAuthScreen('register');
    setIsAuthenticated(false);
  };

  return (
    <div>
      <PageHeader title="How it works" description="Barangay services online in three steps. No long lines." />

      <ol className="grid md:grid-cols-3 gap-3 sm:gap-5">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <Card className="h-full">
              <span
                aria-hidden="true"
                className="w-[34px] h-[34px] rounded-full grid place-items-center bg-navy text-white text-sm font-semibold mb-3"
              >
                {i + 1}
              </span>
              <h2 className="text-h3 font-semibold text-navy-ink">{s.title}</h2>
              <p className="text-meta text-muted mt-1.5">{s.text}</p>
            </Card>
          </li>
        ))}
      </ol>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 items-start mt-5">
        <Card>
          <h2 className="text-h3 font-semibold text-navy-ink mb-2">Common questions</h2>
          <div className="divide-y divide-line-soft">
            {FAQS.map(f => (
              <details key={f.q} className="group py-1">
                <summary className="flex items-center justify-between gap-3 min-h-12 py-2 font-semibold cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="w-5 h-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="text-meta text-muted pb-3">{f.a}</p>
              </details>
            ))}
          </div>
        </Card>

        <div className="grid gap-3 sm:gap-5">
          <Card tone="callout">
            <h2 className="text-h3 font-semibold text-navy-ink">Ready to start?</h2>
            <p className="text-meta text-ink mt-1 mb-4">Residents of the barangay can register in about 5 minutes.</p>
            <Button fullWidth onClick={register}>
              Sign up
            </Button>
          </Card>
          <Card>
            <h2 className="text-h3 font-semibold text-navy-ink">Not a resident?</h2>
            <p className="text-meta text-muted mt-1 mb-4">You can still report a concern and track it.</p>
            <Button variant="secondary" fullWidth onClick={() => setActiveTab('file_report')}>
              Report a concern
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
