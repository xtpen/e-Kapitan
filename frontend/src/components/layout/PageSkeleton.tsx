import React from 'react';
import { Bone } from '../ui';

/*
 * Page skeletons (docs/DESIGN.md section 5.17). Each one mirrors a real page layout from section 6,
 * using the same card shells and grids with shimmering bones for text and controls, so the swap to
 * the real page barely moves anything. Pick one with skeletonFor(tab).
 */

export type SkeletonKind =
  | 'dashboard'
  | 'adminOverview'
  | 'cards'
  | 'form'
  | 'listDetail'
  | 'table'
  | 'calendar'
  | 'profile'
  | 'feed'
  | 'chat'
  | 'publicHome';

/** Which skeleton each tab shows while it loads. Unknown tabs get the form layout. */
const BY_TAB: Record<string, SkeletonKind> = {
  // Resident
  home: 'dashboard',
  services: 'cards',
  request_wizard: 'form',
  tracking: 'listDetail',
  complaints: 'form',
  appointments: 'form',
  printing: 'form',
  court: 'calendar',
  profile: 'profile',
  notifications: 'feed',
  ai_assistant: 'chat',
  qr_verify: 'form',
  announcements: 'feed',
  officials_directory: 'cards',
  // Public site
  guest_home: 'publicHome',
  guest_announcements: 'feed',
  file_report: 'form',
  report_status: 'form',
  guest_help: 'cards',
  // Admin
  admin_overview: 'adminOverview',
  admin_documents: 'listDetail',
  admin_complaints: 'listDetail',
  admin_printing: 'listDetail',
  admin_court: 'calendar',
  admin_residents: 'listDetail',
  admin_personnel: 'listDetail',
  admin_services: 'cards',
  admin_chatbot: 'cards',
  admin_officials: 'cards',
  admin_reports: 'adminOverview',
  admin_audit: 'table',
  // Legacy staff / official
  dashboard: 'adminOverview',
  staff_dashboard: 'adminOverview',
  staff_documents: 'listDetail',
  staff_queue: 'adminOverview',
  staff_residents: 'table',
  staff_incidents: 'listDetail',
  staff_cashier: 'table',
  staff_announcements: 'feed',
  executive_dashboard: 'adminOverview',
  official_dashboard: 'adminOverview',
  official_blotter: 'listDetail',
  official_audit: 'table',
  official_announcements: 'feed',
  manage_officials: 'cards',
};

export const skeletonFor = (tab: string): SkeletonKind => BY_TAB[tab] ?? 'form';

/* ---------- building blocks ---------- */

const Line: React.FC<{ w?: string; h?: string; className?: string }> = ({ w = 'w-full', h = 'h-3.5', className = '' }) => (
  <Bone className={`${h} ${w} rounded-full ${className}`} />
);

const Shell: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-surface border border-line rounded-card p-4 sm:p-6 ${className}`}>{children}</div>
);

const Header: React.FC<{ action?: boolean }> = ({ action }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
    <div className="grid gap-2.5">
      <Line w="w-52 sm:w-64" h="h-7 sm:h-8" className="rounded-control" />
      <Line w="w-72 sm:w-96 max-w-full" h="h-3.5" />
    </div>
    {action && <Bone className="h-11 w-36 rounded-control" />}
  </div>
);

const Field: React.FC = () => (
  <div className="grid gap-2 mt-4">
    <Line w="w-28" h="h-3" />
    <Bone className="h-12 w-full rounded-control" />
  </div>
);

const Rows: React.FC<{ n?: number; cols?: number }> = ({ n = 5, cols = 3 }) => (
  <div className="grid">
    <div className="flex gap-6 pb-3 border-b-2 border-line">
      {Array.from({ length: cols }).map((_, i) => (
        <Line key={i} w={i === 0 ? 'w-20' : 'w-16'} h="h-3" />
      ))}
    </div>
    {Array.from({ length: n }).map((_, r) => (
      <div key={r} className="flex items-center gap-6 py-3.5 border-b border-line-soft last:border-b-0">
        <Line w="w-24" />
        <Line w={['w-40', 'w-32', 'w-44', 'w-36'][r % 4]} className="hidden sm:block" />
        <Bone className="h-6 w-24 rounded-full ml-auto" />
      </div>
    ))}
  </div>
);

const Stat: React.FC<{ icon?: boolean }> = ({ icon }) => (
  <Shell>
    {icon && <Bone className="h-11 w-11 rounded-tile mb-3" />}
    <Line w="w-28" h="h-3" />
    <Line w="w-14" h="h-8" className="mt-3 rounded-control" />
  </Shell>
);

/* ---------- page layouts ---------- */

const Dashboard = () => (
  <>
    <Bone className="h-24 sm:h-28 w-full rounded-banner" />
    <div className="grid grid-cols-3 gap-3 sm:gap-5 my-5">
      <Stat />
      <Stat />
      <Stat />
    </div>
    <div className="grid lg:grid-cols-[1.7fr_1fr] gap-5 items-start">
      <Shell>
        <div className="flex justify-between mb-4">
          <Line w="w-40" h="h-4" />
          <Line w="w-14" h="h-3.5" />
        </div>
        <Rows n={4} />
      </Shell>
      <div className="grid gap-5">
        <Shell>
          <Line w="w-32" h="h-4" />
          {[0, 1, 2].map(i => (
            <div key={i} className="grid gap-2 mt-4">
              <Line w="w-44" />
              <Line w="w-32" h="h-3" />
            </div>
          ))}
        </Shell>
        <Bone className="h-24 w-full rounded-card" />
      </div>
    </div>
  </>
);

const AdminOverview = () => (
  <>
    <Header action />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-5">
      <Stat icon />
      <Stat icon />
      <Stat icon />
      <Stat icon />
    </div>
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5 items-start">
      <Shell>
        <Line w="w-48" h="h-4" />
        <div className="flex items-end gap-4 h-44 mt-6">
          {[60, 85, 45, 70, 95, 55, 75].map((h, i) => (
            <Bone key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
          ))}
        </div>
      </Shell>
      <Shell>
        <Line w="w-36" h="h-4" />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 mt-4">
            <Bone className="h-10 w-10 rounded-tile" />
            <div className="grid gap-2 flex-1">
              <Line w="w-3/4" />
              <Line w="w-1/2" h="h-3" />
            </div>
          </div>
        ))}
      </Shell>
    </div>
  </>
);

const Cards = () => (
  <>
    <Header />
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Shell key={i}>
          <Bone className="h-12 w-12 rounded-tile" />
          <Line w="w-40" h="h-4" className="mt-4" />
          <Line className="mt-3" />
          <Line w="w-4/5" className="mt-2" />
          <Bone className="h-11 w-full rounded-control mt-5" />
        </Shell>
      ))}
    </div>
  </>
);

const Form = () => (
  <>
    <Header />
    <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
      <Shell className="sm:p-8">
        <Line w="w-48" h="h-5" />
        <div className="grid sm:grid-cols-2 gap-x-5">
          <Field />
          <Field />
          <Field />
          <Field />
        </div>
        <Field />
        <Bone className="h-28 w-full rounded-control mt-4" />
        <Bone className="h-12 w-full rounded-control mt-6" />
      </Shell>
      <div className="grid gap-5">
        <Shell>
          <Line w="w-32" h="h-4" />
          <Line className="mt-4" />
          <Line w="w-5/6" className="mt-2" />
          <Line w="w-2/3" className="mt-2" />
        </Shell>
        <Bone className="h-28 w-full rounded-card" />
      </div>
    </div>
  </>
);

const ListDetail = () => (
  <>
    <Header action />
    <Shell className="mb-5">
      <div className="grid sm:grid-cols-[2fr_1fr_1fr] gap-4">
        <Field />
        <Field />
        <Field />
      </div>
    </Shell>
    <div className="grid lg:grid-cols-[1.7fr_1fr] gap-5 items-start">
      <Shell>
        <Rows n={6} cols={4} />
      </Shell>
      <Shell>
        <div className="flex justify-between">
          <Line w="w-36" h="h-5" />
          <Bone className="h-6 w-24 rounded-full" />
        </div>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="grid grid-cols-[2fr_3fr] gap-3 py-3 border-b border-line-soft">
            <Line w="w-20" h="h-3" />
            <Line w="w-full" />
          </div>
        ))}
        <Bone className="h-12 w-full rounded-control mt-5" />
        <div className="grid grid-cols-2 gap-2.5 mt-2.5">
          <Bone className="h-12 rounded-control" />
          <Bone className="h-12 rounded-control" />
        </div>
      </Shell>
    </div>
  </>
);

const Table = () => (
  <>
    <Header action />
    <Shell>
      <Rows n={8} cols={4} />
    </Shell>
  </>
);

const Calendar = () => (
  <>
    <Header />
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
      <Shell>
        <div className="flex justify-between items-center mb-5">
          <Line w="w-36" h="h-5" />
          <div className="flex gap-2">
            <Bone className="h-11 w-24 rounded-control" />
            <Bone className="h-11 w-20 rounded-control" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Bone key={i} className="h-11 sm:h-[52px] rounded-control" />
          ))}
        </div>
      </Shell>
      <Shell>
        <Line w="w-48" h="h-5" />
        <Line w="w-32" h="h-3" className="mt-3 mb-4" />
        {[0, 1, 2].map(i => (
          <Bone key={i} className="h-[52px] w-full rounded-[12px] mb-2.5" />
        ))}
        <Field />
        <Bone className="h-12 w-full rounded-control mt-5" />
      </Shell>
    </div>
  </>
);

const Profile = () => (
  <>
    <Header />
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5 items-start">
      <Shell className="text-center">
        <Bone className="h-20 w-20 rounded-full mx-auto" />
        <Line w="w-40" h="h-5" className="mx-auto mt-4" />
        <Line w="w-28" h="h-3" className="mx-auto mt-2" />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="grid grid-cols-[2fr_3fr] gap-3 py-3 border-b border-line-soft text-left mt-1">
            <Line w="w-20" h="h-3" />
            <Line />
          </div>
        ))}
      </Shell>
      <div className="grid gap-5">
        <Shell>
          <Line w="w-40" h="h-5" />
          <div className="grid sm:grid-cols-2 gap-x-5">
            <Field />
            <Field />
          </div>
          <Bone className="h-12 w-40 rounded-control mt-6" />
        </Shell>
        <Shell>
          <Line w="w-36" h="h-5" />
          <Field />
          <Field />
        </Shell>
      </div>
    </div>
  </>
);

const Feed = () => (
  <div className="max-w-[860px]">
    <Header />
    <div className="flex gap-2 mb-5 overflow-hidden">
      {['w-16', 'w-24', 'w-20', 'w-28'].map((w, i) => (
        <Bone key={i} className={`h-11 ${w} rounded-full shrink-0`} />
      ))}
    </div>
    <div className="grid gap-3">
      {[0, 1, 2, 3, 4].map(i => (
        <Shell key={i} className="flex gap-4">
          <Bone className="h-10 w-10 rounded-tile shrink-0" />
          <div className="grid gap-2 flex-1">
            <div className="flex justify-between gap-4">
              <Line w={['w-56', 'w-44', 'w-64', 'w-40', 'w-52'][i]} h="h-4" />
              <Line w="w-16" h="h-3" />
            </div>
            <Line w="w-4/5" />
          </div>
        </Shell>
      ))}
    </div>
  </div>
);

const Chat = () => (
  <>
    <Header />
    <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
      <div className="bg-surface border border-line rounded-card flex flex-col h-[calc(100dvh-260px)] min-h-[440px] lg:h-[620px]">
        <div className="flex-1 p-4 sm:p-6 grid content-start gap-5">
          {[false, true, false, true].map((mine, i) => (
            <div key={i} className={`flex gap-2.5 ${mine ? 'justify-end' : ''}`}>
              {!mine && <Bone className="h-9 w-9 rounded-full shrink-0" />}
              <Bone className={`rounded-tile ${mine ? 'h-12 w-48' : i === 0 ? 'h-28 w-72 max-w-[75%]' : 'h-20 w-64 max-w-[75%]'}`} />
            </div>
          ))}
        </div>
        <div className="border-t border-line p-3 sm:p-4 flex gap-2.5">
          <Bone className="h-12 flex-1 rounded-control" />
          <Bone className="h-12 w-24 rounded-control" />
        </div>
      </div>
      <div className="hidden lg:grid gap-5">
        <Shell>
          <Line w="w-28" h="h-4" />
          {[0, 1, 2, 3, 4].map(i => (
            <Bone key={i} className="h-11 w-full rounded-control mt-2.5" />
          ))}
        </Shell>
        <Bone className="h-28 w-full rounded-card" />
      </div>
    </div>
  </>
);

const PublicHome = () => (
  <>
    <div className="md:hidden">
      <div className="bg-primary-tint px-4 py-5 grid gap-3">
        <Line w="w-56" h="h-7" className="rounded-control" />
        <Line w="w-64" />
        <Bone className="h-12 w-full rounded-control mt-2" />
      </div>
      <div className="px-4 pt-4 grid grid-cols-2 gap-2.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-surface border border-line rounded-tile p-3.5">
            <Bone className="h-10 w-10 rounded-tile mb-2" />
            <Line w="w-20" />
          </div>
        ))}
      </div>
    </div>
    <div className="hidden md:block">
      <div className="bg-navy pt-16 pb-32">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 grid lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
          <div className="grid gap-4">
            <span className="block h-3 w-32 rounded-full bg-white/15" />
            <span className="block h-12 w-4/5 rounded-control bg-white/15" />
            <span className="block h-4 w-full rounded-full bg-white/10" />
            <span className="block h-4 w-2/3 rounded-full bg-white/10" />
          </div>
          <div className="bg-surface rounded-card p-6 grid gap-3">
            <Line w="w-40" h="h-5" />
            <Field />
            <Bone className="h-12 w-full rounded-control" />
          </div>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 -mt-18 grid grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2].map(i => (
          <Shell key={i}>
            <Bone className="h-12 w-12 rounded-tile" />
            <Line w="w-40" h="h-4" className="mt-4" />
            <Line className="mt-3" />
          </Shell>
        ))}
      </div>
    </div>
  </>
);

const LAYOUTS: Record<SkeletonKind, React.FC> = {
  dashboard: Dashboard,
  adminOverview: AdminOverview,
  cards: Cards,
  form: Form,
  listDetail: ListDetail,
  table: Table,
  calendar: Calendar,
  profile: Profile,
  feed: Feed,
  chat: Chat,
  publicHome: PublicHome,
};

/** Loading placeholder shaped like the page that's coming. */
export const PageSkeleton: React.FC<{ kind?: SkeletonKind }> = ({ kind = 'form' }) => {
  const Layout = LAYOUTS[kind];
  return (
    <div className={kind === 'publicHome' ? 'w-full' : 'max-w-[1200px] w-full'} role="status" aria-label="Loading page" aria-busy="true">
      <Layout />
    </div>
  );
};
