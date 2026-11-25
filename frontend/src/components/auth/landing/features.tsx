import React from 'react';
import {
  Bell,
  Check,
  CircleDot,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Lock,
  MessageSquareText,
  Printer,
  Search,
  TriangleAlert,
} from 'lucide-react';

/*
 * The landing page's feature content: one entry per part of eKapitan, each with copy for the
 * scroll tour and a miniature of the real screen. Miniatures are illustrative (marked "Preview"),
 * use only the landing palette (navy on white/mist; green only for "ready"), and never go below 12px.
 */

export interface Feature {
  id: string;
  /** Short tab label */
  tab: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Scroll-tour heading and copy */
  title: string;
  text: string;
  points: string[];
  /** The text message that pops up over the preview, if any */
  notice?: string;
  Panel: React.FC;
}

/* ---------- tiny shared pieces ---------- */

const Pill: React.FC<{ tone?: 'navy' | 'ready' | 'quiet'; children: React.ReactNode }> = ({ tone = 'navy', children }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label font-semibold whitespace-nowrap
      ${tone === 'ready' ? 'bg-success-bg text-success-fg' : tone === 'quiet' ? 'bg-mist text-muted' : 'bg-navy-tint text-navy'}`}
  >
    <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
    {children}
  </span>
);

const ScreenHeader: React.FC<{ icon: React.ReactNode; title: string; right?: React.ReactNode }> = ({ icon, title, right }) => (
  <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-hairline">
    <span className="w-8 h-8 rounded-lg grid place-items-center bg-navy-tint text-navy [&_svg]:w-4 [&_svg]:h-4">{icon}</span>
    <b className="font-display text-navy">{title}</b>
    <span className="ml-auto">{right}</span>
  </div>
);

const Row: React.FC<{ title: string; meta: string; right: React.ReactNode }> = ({ title, meta, right }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-hairline last:border-b-0">
    <div className="min-w-0">
      <b className="block text-meta font-semibold text-ink truncate">{title}</b>
      <span className="text-label text-muted">{meta}</span>
    </div>
    <span className="ml-auto shrink-0">{right}</span>
  </div>
);

/* ---------- panels ---------- */

const DocumentsPanel: React.FC = () => (
  <div>
    <ScreenHeader icon={<FileText strokeWidth={1.8} />} title="Documents" right={<Search className="w-4 h-4 text-muted" aria-hidden="true" />} />
    <Row title="Barangay Clearance" meta="₱50.00 · claim 1:00–4:00 PM" right={<Pill tone="ready">Ready for pickup</Pill>} />
    <Row title="Certificate of Residency" meta="₱30.00 · REQ-2026-0820" right={<Pill>Under review</Pill>} />
    <Row title="Certificate of Indigency" meta="Free · REQ-2026-0822" right={<Pill tone="quiet">Pending</Pill>} />
    <div className="mt-4 h-11 rounded-control bg-navy text-white grid place-items-center text-meta font-semibold">Request a document</div>
  </div>
);

const ReportsPanel: React.FC = () => {
  const stages = ['Received', 'Under review', 'Action taken', 'Resolved'];
  return (
    <div>
      <ScreenHeader icon={<TriangleAlert strokeWidth={1.8} />} title="Report a concern" right={<span className="text-label text-muted">RPT-2026-0034</span>} />
      <b className="block text-meta font-semibold text-ink">Streetlight out near the chapel</b>
      <span className="text-label text-muted">Public safety · Rizal St.</span>
      <div className="mt-3 h-16 rounded-control bg-mist border border-hairline grid place-items-center text-muted">
        <ImageIcon className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <ol className="mt-4 grid grid-cols-4 gap-1.5" aria-label="Report progress">
        {stages.map((s, i) => (
          <li key={s} className="grid gap-1.5">
            <span className={`h-1.5 rounded-full ${i <= 1 ? 'bg-navy' : i === 2 ? 'bg-navy/30' : 'bg-hairline'}`} />
            <span className={`text-label leading-tight ${i <= 1 ? 'text-ink font-semibold' : 'text-muted'}`}>{s}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 flex items-center gap-2 text-label text-muted">
        <Lock className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" /> Your name is hidden from the person you report.
      </p>
    </div>
  );
};

const CourtPanel: React.FC = () => {
  // 0 past · 1 open · 2 booked · 3 selected
  const days = [0, 0, 1, 2, 1, 3, 1, 1, 2, 1, 1, 1, 2, 1];
  return (
    <div>
      <ScreenHeader icon={<CircleDot strokeWidth={1.8} />} title="Court reservation" right={<span className="text-label text-muted">November</span>} />
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-label text-muted font-semibold">
            {d}
          </span>
        ))}
        {days.map((s, i) => (
          <span
            key={i}
            className={`h-8 rounded-lg grid place-items-center text-label font-semibold
              ${s === 3 ? 'bg-navy text-white' : s === 1 ? 'bg-navy-tint text-navy' : s === 2 ? 'bg-mist text-muted line-through' : 'text-muted/60'}`}
          >
            {((i + 20) % 30) + 1}
          </span>
        ))}
      </div>
      <div className="mt-3 grid gap-2">
        <div className="flex items-center justify-between rounded-control border-2 border-navy bg-navy-tint px-3 py-2">
          <span className="text-meta font-semibold text-navy">4:00 PM to 6:00 PM</span>
          <Pill tone="ready">Available</Pill>
        </div>
        <div className="flex items-center justify-between rounded-control border border-hairline bg-mist px-3 py-2">
          <span className="text-meta text-muted">6:00 PM to 8:00 PM</span>
          <Pill tone="quiet">Booked</Pill>
        </div>
      </div>
    </div>
  );
};

const PrintingPanel: React.FC = () => (
  <div>
    <ScreenHeader icon={<Printer strokeWidth={1.8} />} title="Printing" right={<Pill tone="ready">Free</Pill>} />
    <div className="flex items-center gap-3 rounded-control border border-hairline p-3">
      <span className="w-9 h-11 rounded-md bg-navy-tint text-navy grid place-items-center text-label font-bold">PDF</span>
      <div>
        <b className="block text-meta font-semibold text-ink">Scholarship-form.pdf</b>
        <span className="text-label text-muted">We counted 4 pages</span>
      </div>
      <Check className="ml-auto w-4 h-4 text-primary" strokeWidth={2.5} aria-hidden="true" />
    </div>
    <div className="mt-3 flex flex-wrap gap-1.5">
      {['A4', 'Black and white', 'Two-sided', '2 copies'].map(o => (
        <span key={o} className="rounded-full border border-hairline px-2.5 py-1 text-label font-semibold text-navy">
          {o}
        </span>
      ))}
    </div>
    <div className="mt-4 rounded-control bg-navy text-white p-4">
      <span className="text-label text-on-navy">Your request</span>
      <b className="block font-display text-h3">8 pages to print</b>
      <span className="text-label text-on-navy">Pick it up at the hall when we text you.</span>
    </div>
  </div>
);

const AskKapPanel: React.FC = () => (
  <div>
    <ScreenHeader icon={<MessageSquareText strokeWidth={1.8} />} title="Ask Kap" right={<span className="text-label text-muted">Ka-Barangay AI</span>} />
    <div className="grid gap-2.5">
      <p className="justify-self-end max-w-[80%] rounded-tile rounded-tr-sm bg-navy text-white text-meta px-3 py-2">Magkano ang barangay clearance?</p>
      <p className="max-w-[88%] rounded-tile rounded-tl-sm border border-hairline bg-surface text-meta text-ink px-3 py-2">
        <b className="font-semibold">₱50.00.</b> Libre para sa first-time jobseekers. Bring a valid ID when you claim it.
      </p>
      <p className="justify-self-end max-w-[80%] rounded-tile rounded-tr-sm bg-navy text-white text-meta px-3 py-2">What time is the hall open?</p>
      <span className="inline-flex gap-1 rounded-tile border border-hairline px-3 py-3 w-16" aria-label="Kap is typing">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse" style={{ animationDelay: `${i * 160}ms` }} />
        ))}
      </span>
    </div>
  </div>
);

const StaffPanel: React.FC = () => (
  <div>
    <ScreenHeader icon={<LayoutDashboard strokeWidth={1.8} />} title="Staff desk" right={<span className="text-label text-muted">Today</span>} />
    <div className="grid grid-cols-3 gap-2">
      {[
        ['Pending', '12'],
        ['Ready', '5'],
        ['Reports', '3'],
      ].map(([l, n]) => (
        <div key={l} className="rounded-control bg-mist px-3 py-2">
          <span className="text-label text-muted">{l}</span>
          <b className="block font-display text-h3 text-navy leading-tight">{n}</b>
        </div>
      ))}
    </div>
    <div className="mt-3">
      <Row title="Juan Dela Cruz" meta="Barangay Clearance · 9:12 AM" right={<span className="rounded-lg bg-navy text-white text-label font-semibold px-2.5 py-1">Approve</span>} />
      <Row title="Ana Reyes" meta="Court · Nov 26, 4:00 PM" right={<span className="rounded-lg border border-navy text-navy text-label font-semibold px-2.5 py-1">Review</span>} />
      <Row title="Pedro Garcia" meta="Printing · 8 pages" right={<Pill tone="ready">Ready</Pill>} />
    </div>
  </div>
);

export const FEATURES: Feature[] = [
  {
    id: 'documents',
    tab: 'Documents',
    icon: FileText,
    title: 'Request certificates without the trip',
    text: 'Choose the document you need, fill in a short form and upload a photo of your ID. Staff review it, and you get a text when it is ready to claim.',
    points: [
      'Clearance, residency, indigency, business clearance, first-time jobseeker and good moral certificates',
      'Fees shown up front and paid at the hall; fee waivers for those who qualify',
      'Claim it on weekdays, 1:00 PM to 4:00 PM, with your reference number and a valid ID',
    ],
    notice: 'Your clearance is ready',
    Panel: DocumentsPanel,
  },
  {
    id: 'reports',
    tab: 'Reports',
    icon: TriangleAlert,
    title: 'Report a concern and see it handled',
    text: 'Tell the barangay about noise, garbage, flooding, a broken streetlight or a dispute. Add a photo, and follow the report from received to resolved.',
    points: [
      'Every report gets a tracking number',
      'Hide your name from the person you are reporting; only authorized staff see it',
      'See each step: received, under review, action taken, resolved, or a scheduled hearing',
    ],
    notice: 'RPT-2026-0034 is under review',
    Panel: ReportsPanel,
  },
  {
    id: 'court',
    tab: 'Court',
    icon: CircleDot,
    title: 'Book the court in a few taps',
    text: 'See which days and time slots are open, pick one and say what it is for. The barangay approves it and you get notified.',
    points: ['A calendar of open, booked and closed days', 'Time slots marked available or booked', 'Your reservation history in one place'],
    notice: 'Court booking approved',
    Panel: CourtPanel,
  },
  {
    id: 'printing',
    tab: 'Printing',
    icon: Printer,
    title: 'Send a print job from home',
    text: 'Upload a PDF or Word file, choose paper size, color, sides and copies, and pick up the printout at the hall. Free for residents.',
    points: ['Page count filled in for you on most PDFs', 'A summary of exactly what will be printed', 'A text when your printout is ready'],
    notice: 'Your printout is ready',
    Panel: PrintingPanel,
  },
  {
    id: 'ask-kap',
    tab: 'Ask Kap',
    icon: MessageSquareText,
    title: 'Ask Kap, any time',
    text: 'Ka-Barangay AI answers questions about requirements, fees and office hours in English, Tagalog or Taglish, day or night.',
    points: ['Answers come from the barangay’s own information', 'Suggested questions to get you started', 'Points you to the right service when you are ready'],
    Panel: AskKapPanel,
  },
  {
    id: 'staff',
    tab: 'Staff desk',
    icon: LayoutDashboard,
    title: 'One desk for barangay staff',
    text: 'Staff see every request in one queue, oldest first, and move each one along: approve, return for correction or reject, then mark it ready and claimed.',
    points: [
      'Documents, complaints, printing and court requests in one place',
      'Resident records with duplicate checks, staff accounts and access levels',
      'An overview of the day, exports for reports, and an audit log of every action',
    ],
    notice: '3 new requests today',
    Panel: StaffPanel,
  },
];

/** Small floating text message shown over a preview. */
export const Notice: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center gap-3 bg-surface border border-hairline rounded-tile shadow-float pl-3 pr-4 py-2.5">
    <span className="relative w-8 h-8 rounded-full grid place-items-center bg-navy text-white shrink-0">
      <span className="absolute inset-0 rounded-full border-2 border-navy ripple-once" />
      <Bell className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
    </span>
    <span>
      <b className="block text-meta font-semibold text-ink leading-tight">{text}</b>
      <span className="text-label text-muted">SMS · just now</span>
    </span>
  </div>
);

/** Device-style frame that every preview sits in. */
export const PreviewFrame: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-surface border border-hairline rounded-card shadow-float overflow-hidden ${className}`}>
    <div className="flex items-center gap-1.5 px-4 h-9 border-b border-hairline bg-mist" aria-hidden="true">
      <span className="w-2.5 h-2.5 rounded-full bg-hairline" />
      <span className="w-2.5 h-2.5 rounded-full bg-hairline" />
      <span className="w-2.5 h-2.5 rounded-full bg-hairline" />
      <span className="ml-auto text-label font-semibold text-muted">Preview</span>
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </div>
);
