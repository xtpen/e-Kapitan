import React from 'react';
import { Bone } from '../ui';

/*
 * Resident portal skeletons. Each one copies its page's real layout with the same measurements
 * as the resident kit (components/resident/kit.tsx), so when the page arrives nothing jumps:
 *
 *   Page        720px column (wide: 1040px), 16px between blocks
 *   PageTitle   26/30px heading, optional one-line sub
 *   Section     18px corners, 1px border, soft shadow; flush = title row + 64px list rows
 *   ListRow     40px circle, title + one muted line, 16/20px side padding
 *
 * Keep a skeleton in step with its page: when a page's blocks change, change them here too.
 */

/* ---------- building blocks (kit measurements) ---------- */

export const Line: React.FC<{ w?: string; h?: string; className?: string }> = ({ w = 'w-full', h = 'h-3.5', className = '' }) => (
  <Bone className={`${h} ${w} max-w-full rounded-full ${className}`} />
);

const Circle: React.FC<{ size?: string; className?: string }> = ({ size = 'w-10 h-10', className = '' }) => (
  <Bone className={`${size} rounded-full shrink-0 ${className}`} />
);

/** Page column: same width and gap as kit Page. */
const Page: React.FC<{ wide?: boolean; children: React.ReactNode }> = ({ wide, children }) => (
  <div className={`mx-auto w-full ${wide ? 'max-w-[1040px]' : 'max-w-[720px]'} grid grid-cols-1 gap-4 content-start`}>{children}</div>
);

/** Kit PageTitle: heading, optional sub, optional round action on the right. */
const Title: React.FC<{ w?: string; sub?: string | false; action?: React.ReactNode }> = ({ w = 'w-40', sub = 'w-60', action }) => (
  <div className="flex items-end justify-between gap-3 pt-1">
    <div className="grid grid-cols-1 gap-2.5 min-w-0">
      <Line w={w} h="h-[1.625rem] sm:h-[1.875rem]" className="rounded-control" />
      {sub && <Line w={`${sub} max-w-full`} h="h-3.5" />}
    </div>
    {action}
  </div>
);

/** Kit Section shell. */
const Card: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`rounded-[18px] border border-line bg-surface shadow-[0_1px_2px_rgb(16_24_40/0.05)] ${className}`}>{children}</div>
);

/** Section heading inside a card (17px). */
const CardTitle: React.FC<{ w?: string; flush?: boolean; action?: boolean }> = ({ w = 'w-32', flush, action }) => (
  <div className={`flex items-center justify-between ${flush ? 'px-4 sm:px-5 pt-4 pb-1' : 'mb-3'}`}>
    <Line w={w} h="h-4" />
    {action && <Line w="w-14" h="h-3" />}
  </div>
);

/** Kit ListRow: circle, title, one muted line, chevron or pill. */
const Row: React.FC<{ title?: string; sub?: string | false; trailing?: 'chevron' | 'pill' | 'switch' | 'none'; circle?: boolean }> = ({
  title = 'w-3/5',
  sub = 'w-2/5',
  trailing = 'chevron',
  circle = true,
}) => (
  <div className="min-h-16 flex items-center gap-3 px-4 sm:px-5 py-3">
    {circle && <Circle />}
    <div className="flex-1 min-w-0 grid grid-cols-1 gap-2">
      <Line w={title} h="h-4" />
      {sub && <Line w={sub} h="h-3" />}
    </div>
    {trailing === 'chevron' && <Bone className="w-4 h-4 rounded shrink-0" />}
    {trailing === 'pill' && <Bone className="h-6 w-20 rounded-full shrink-0" />}
    {trailing === 'switch' && <Bone className="h-7 w-12 rounded-full shrink-0" />}
  </div>
);

/** Kit Section flush + List: optional title, then rows with dividers. */
const ListCard: React.FC<{ rows?: number; title?: string | false; trailing?: 'chevron' | 'pill' | 'switch' | 'none'; widths?: string[] }> = ({
  rows = 3,
  title = 'w-32',
  trailing = 'chevron',
  widths = ['w-3/5', 'w-1/2', 'w-2/3', 'w-2/5'],
}) => (
  <Card className="overflow-hidden">
    {title && <CardTitle w={title} flush />}
    <div className="divide-y divide-line-soft">
      {Array.from({ length: rows }, (_, i) => (
        <Row key={i} title={widths[i % widths.length]} trailing={trailing} />
      ))}
    </div>
  </Card>
);

/** A labelled input (label line + 48px field). */
const Field: React.FC<{ label?: string; tall?: boolean }> = ({ label = 'w-28', tall }) => (
  <div className="grid grid-cols-1 gap-2">
    <Line w={label} h="h-3" />
    <Bone className={`${tall ? 'h-28' : 'h-12'} w-full rounded-control`} />
  </div>
);

/** A row of option boxes (kit Choice). */
const Choices: React.FC<{ n: number; cols: string; h?: string }> = ({ n, cols, h = 'h-12' }) => (
  <div className={`grid ${cols} gap-2`}>
    {Array.from({ length: n }, (_, i) => (
      <Bone key={i} className={`${h} rounded-control`} />
    ))}
  </div>
);

/** A switch row inside a padded card (kit Switch). */
const SwitchRow: React.FC<{ title?: string; sub?: string; icon?: boolean }> = ({ title = 'w-36', sub = 'w-56', icon }) => (
  <div className="min-h-14 flex items-center gap-4 py-3">
    {icon && <Circle />}
    <div className="flex-1 min-w-0 grid grid-cols-1 gap-2">
      <Line w={title} h="h-4" />
      <Line w={`${sub} max-w-full`} h="h-3" />
    </div>
    <Bone className="h-7 w-12 rounded-full shrink-0" />
  </div>
);

const Button: React.FC<{ className?: string }> = ({ className = 'w-full' }) => <Bone className={`h-12 rounded-control ${className}`} />;

export const ResidentSkeletonParts = { Page, Title, Card, CardTitle, Row, ListCard, Field, Choices, SwitchRow, Button, Circle, Line };

/* ---------- pages ---------- */

/** Services: search, four tiles (2 × 2, four across from sm), "More services" card, Ask Kap card. */
const Services = () => (
  <Page>
    <Title w="w-36" sub="w-64" />
    <Bone className="h-12 w-full rounded-control" />
    <div className="grid grid-cols-1 gap-2">
      <Line w="w-24" h="h-3" className="ml-1" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['w-24', 'w-28', 'w-24', 'w-20'].map((w, i) => (
          <Card key={i} className="min-h-[136px] min-w-0 p-4 grid grid-cols-1 content-start gap-3">
            <Circle size="w-12 h-12" />
            <div className="grid grid-cols-1 gap-2">
              <Line w={w} h="h-4" />
              <Line w="w-full" h="h-2.5" />
              <Line w="w-2/3" h="h-2.5" />
            </div>
          </Card>
        ))}
      </div>
    </div>
    <Card className="overflow-hidden">
      <CardTitle w="w-36" flush />
      {[1, 1, 2].map((n, g) => (
        <div key={g} className={g > 0 ? 'border-t border-line-soft' : ''}>
          <Line w="w-20" h="h-2.5" className="mx-4 sm:mx-5 mt-3.5 -mb-1" />
          <div className="divide-y divide-line-soft">
            {Array.from({ length: n }, (_, i) => (
              <Row key={i} title={['w-2/5', 'w-1/2'][i % 2]} sub="w-3/5" />
            ))}
          </div>
        </div>
      ))}
    </Card>
    <div className="rounded-[18px] bg-navy-tint p-4 sm:p-5 grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3">
      <Circle size="w-12 h-12" className="!bg-surface" />
      <div className="grid grid-cols-1 gap-2">
        <Line w="w-48" h="h-4" />
        <Line w="w-56 max-w-full" h="h-3" />
      </div>
      <Bone className="col-span-2 sm:col-span-1 h-11 sm:w-28 rounded-control" />
    </div>
  </Page>
);

/** One request row: icon, name, status pill + kind · age, step bar. */
const RequestRow: React.FC<{ name: string; bar?: boolean; note?: boolean }> = ({ name, bar = true, note }) => (
  <div className="flex items-start gap-3 px-4 sm:px-5 py-3.5">
    <Circle />
    <div className="flex-1 min-w-0 grid grid-cols-1 gap-2">
      <Line w={name} h="h-4" />
      <div className="flex items-center gap-2">
        <Bone className="h-5 w-24 rounded-full" />
        <Line w="w-28" h="h-2.5" />
      </div>
      {note && <Line w="w-11/12" h="h-3" />}
      {bar && (
        <div className="flex items-center gap-2.5 max-w-[260px]">
          <Bone className="h-1.5 flex-1 rounded-full" />
          <Line w="w-14" h="h-2.5" />
        </div>
      )}
    </div>
    <Bone className="mt-2.5 w-4 h-4 rounded shrink-0" />
  </div>
);

/** Requests: status tabs + filter, "Needs you", then "This week". Round + floats on phones. */
const Requests = () => (
  <Page>
    <Title w="w-36" sub={false} action={<Circle size="w-11 h-11" className="hidden lg:block" />} />
    <div className="flex items-end gap-2 border-b border-line">
      <div className="flex-1 flex gap-5 px-3 pb-3.5 pt-2">
        {['w-6', 'w-16', 'w-14', 'w-10'].map((w, i) => (
          <Line key={i} w={w} h="h-4" />
        ))}
      </div>
      <Bone className="mb-1.5 h-10 w-10 sm:w-24 rounded-full" />
    </div>
    <Card className="overflow-hidden">
      <CardTitle w="w-28" flush />
      <div className="divide-y divide-line-soft">
        <RequestRow name="w-3/5" bar={false} note />
        <RequestRow name="w-2/5" bar={false} note />
      </div>
    </Card>
    <Card className="overflow-hidden">
      <CardTitle w="w-24" flush />
      <div className="divide-y divide-line-soft">
        <RequestRow name="w-1/2" />
        <RequestRow name="w-2/3" />
        <RequestRow name="w-2/5" />
      </div>
    </Card>
  </Page>
);

/** Account: you (avatar, name, address, badge + three counts), then four cards of rows, sign out. */
const Account = () => (
  <Page>
    <Title w="w-32" sub={false} />
    <Card className="overflow-hidden">
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <Circle size="w-16 h-16" />
        <div className="flex-1 min-w-0 grid grid-cols-1 gap-2">
          <Line w="w-48" h="h-5" />
          <Line w="w-40" h="h-3" />
          <Bone className="h-6 w-32 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-line-soft divide-x divide-line-soft">
        {[0, 1, 2].map(i => (
          <div key={i} className="min-h-16 py-3 grid grid-cols-1 content-center justify-items-center gap-2">
            <Line w="w-6" h="h-5" className="rounded-md" />
            <Line w="w-16" h="h-2.5" />
          </div>
        ))}
      </div>
    </Card>
    <ListCard rows={2} title="w-28" />
    <ListCard rows={2} title="w-20" />
    <ListCard rows={2} title="w-14" />
    <ListCard rows={3} title="w-14" />
    <Button />
  </Page>
);

/** Display & language: language pair, display (appearance, text size, preview, bold), accessibility. */
const DisplaySettings = () => (
  <Page>
    <Title w="w-56" sub="w-52" />
    <Card className="p-4 sm:p-5">
      <CardTitle w="w-24" />
      <Choices n={2} cols="grid-cols-2" h="h-[52px]" />
    </Card>
    <Card className="p-4 sm:p-5">
      <CardTitle w="w-20" />
      <Line w="w-24" h="h-3" className="mb-2" />
      <Choices n={3} cols="grid-cols-1 sm:grid-cols-3" h="h-12 sm:h-[84px]" />
      <Line w="w-20" h="h-3" className="mt-5 mb-2" />
      <Choices n={3} cols="grid-cols-1 sm:grid-cols-3" h="h-12 sm:h-[84px]" />
      <Bone className="mt-3 h-12 w-full rounded-control" />
      <SwitchRow title="w-24" sub="w-60" />
    </Card>
    <Card className="p-4 sm:p-5">
      <CardTitle w="w-28" />
      <div className="divide-y divide-line-soft">
        <SwitchRow title="w-32" sub="w-48" />
        <SwitchRow title="w-36" sub="w-40" />
      </div>
    </Card>
  </Page>
);

/** Notifications settings: send to (two switches with icons), send me (three switches). */
const NotifySettings = () => (
  <Page>
    <Title w="w-44" sub="w-72" />
    <Card className="p-4 sm:p-5">
      <CardTitle w="w-16" />
      <div className="divide-y divide-line-soft">
        <SwitchRow icon title="w-28" sub="w-32" />
        <SwitchRow icon title="w-16" sub="w-44" />
      </div>
    </Card>
    <Card className="p-4 sm:p-5">
      <CardTitle w="w-20" />
      <div className="divide-y divide-line-soft">
        <SwitchRow title="w-32" sub="w-64" />
        <SwitchRow title="w-24" sub="w-56" />
        <SwitchRow title="w-32" sub="w-52" />
      </div>
    </Card>
  </Page>
);

/** Your profile: header (avatar, name, badge), personal details rows, contact rows. */
const Profile = () => (
  <Page>
    <Title w="w-36" sub={false} />
    <Card className="p-4 sm:p-5 flex items-center gap-4">
      <Circle size="w-12 h-12 sm:w-14 sm:h-14" />
      <div className="grid grid-cols-1 gap-2 flex-1 min-w-0">
        <Line w="w-56 max-w-full" h="h-4" />
        <Bone className="h-6 w-20 rounded-full" />
      </div>
    </Card>
    {[{ title: 'w-36', n: 6 }, { title: 'w-20', n: 2, action: true }].map((s, g) => (
      <Card key={g} className="overflow-hidden">
        <CardTitle w={s.title} flush action={s.action} />
        <div className="divide-y divide-line-soft">
          {Array.from({ length: s.n }, (_, i) => (
            <div key={i} className="min-h-16 px-4 sm:px-5 py-3 grid grid-cols-1 content-center gap-2">
              <Line w="w-20" h="h-2.5" />
              <Line w={['w-40', 'w-28', 'w-56', 'w-32', 'w-24', 'w-36'][i % 6]} h="h-4" />
            </div>
          ))}
        </div>
      </Card>
    ))}
  </Page>
);

/** Legal document: title + summary, one card of numbered headings and paragraphs, back to top. */
const Legal = () => (
  <Page>
    <Title w="w-52" sub="w-72" />
    <Card className="p-4 sm:p-5 grid grid-cols-1 gap-6">
      <Line w="w-36" h="h-3" />
      {[3, 4, 2, 3].map((n, i) => (
        <div key={i} className="grid grid-cols-1 gap-2.5">
          <Line w={['w-32', 'w-40', 'w-28', 'w-36'][i]} h="h-4" />
          {Array.from({ length: n }, (_, j) => (
            <Line key={j} w={j === n - 1 ? 'w-3/5' : 'w-full'} h="h-3" />
          ))}
        </div>
      ))}
    </Card>
    <div className="flex justify-center">
      <Bone className="h-11 w-32 rounded-full" />
    </div>
  </Page>
);

/** Home: greeting, highlight banner, four quick actions, in progress, from the barangay, Ask Kap. */
const Home = () => (
  <Page wide>
    <div className="grid grid-cols-1 gap-2.5 pt-1 min-w-0">
      <Line w="w-28" h="h-3.5" />
      <Line w="w-36" h="h-7 sm:h-8" className="rounded-control" />
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="grid grid-cols-1 gap-4 min-w-0">
        <Bone className="h-[84px] w-full rounded-[18px]" />
        <div className="grid grid-cols-4 gap-2">
          {['w-16', 'w-12', 'w-16', 'w-10'].map((w, i) => (
            <div key={i} className="grid grid-cols-1 justify-items-center gap-2 py-2">
              <Circle size="w-12 h-12" />
              <Line w={w} h="h-3" />
            </div>
          ))}
        </div>
        <ListCard rows={2} title="w-24" trailing="pill" widths={['w-1/2', 'w-3/5']} />
      </div>
      <ListCard rows={3} title="w-36" trailing="none" widths={['w-4/5', 'w-2/3', 'w-3/4']} />
    </div>
    <div className="lg:max-w-[calc(100%-356px)] rounded-[18px] border-[1.5px] border-dashed border-line p-4 flex items-center gap-3">
      <Circle />
      <div className="flex-1 min-w-0 grid grid-cols-1 gap-2">
        <Line w="w-32" h="h-4" />
        <Line w="w-52 max-w-full" h="h-3" />
      </div>
    </div>
  </Page>
);

/** Documents: search, one card of services (fee · ready in). */
const Documents = () => (
  <Page>
    <Title w="w-40" sub="w-64" />
    <Bone className="h-12 w-full rounded-control" />
    <ListCard rows={6} title={false} widths={['w-1/2', 'w-3/5', 'w-2/5', 'w-2/3', 'w-1/2', 'w-3/5']} />
  </Page>
);

/** Request form, step 1: service title + fee line, "About you" card with three fields and two buttons. */
const RequestForm = () => (
  <Page>
    <Title w="w-64 max-w-full" sub="w-44" />
    <Card className="p-4 sm:p-5">
      <CardTitle w="w-24" />
      <div className="grid grid-cols-1 gap-4">
        <Field label="w-20" />
        <Field label="w-28" />
        <Field label="w-14" />
      </div>
      <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
        <Button className="w-full sm:w-24" />
        <Button className="w-full sm:w-32" />
      </div>
    </Card>
  </Page>
);

/** Report a problem: seven kinds (2 columns), details form, my reports. */
const Report = () => (
  <Page>
    <Title w="w-52" sub="w-64" />
    <Card className="p-4 sm:p-5">
      <CardTitle w="w-40" />
      <Choices n={7} cols="grid-cols-2" />
    </Card>
    <Card className="p-4 sm:p-5 grid grid-cols-1 gap-4">
      <CardTitle w="w-16" />
      <div className="grid sm:grid-cols-2 gap-4 -mt-3">
        <Field label="w-14" />
        <Field label="w-32" />
      </div>
      <Field label="w-12" />
      <Field label="w-36" tall />
      <Bone className="h-24 w-full rounded-control" />
      <div className="border-t border-line-soft pt-1">
        <SwitchRow icon title="w-28" sub="w-56" />
      </div>
      <Button className="w-full sm:w-36 sm:justify-self-end" />
    </Card>
    <ListCard rows={2} title="w-24" trailing="pill" />
  </Page>
);

/** Kit Calendar: month + prev/next, weekday row, five weeks of days, legend. */
const CalendarBlock = () => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <Line w="w-32" h="h-5" />
      <div className="flex gap-2">
        <Bone className="h-10 w-10 rounded-control" />
        <Bone className="h-10 w-10 rounded-control" />
      </div>
    </div>
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 7 }, (_, i) => (
        <Line key={`w${i}`} w="w-6" h="h-2.5" className="justify-self-center my-1" />
      ))}
      {Array.from({ length: 35 }, (_, i) => (
        <Bone key={i} className="h-11 sm:h-[52px] rounded-control" />
      ))}
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
      {['w-16', 'w-20', 'w-14', 'w-16'].map((w, i) => (
        <Line key={i} w={w} h="h-2.5" />
      ))}
    </div>
  </div>
);

/** Visit the hall: what you need (list of choices), calendar, time slots, my visits. */
const Visit = () => (
  <Page>
    <Title w="w-40" sub="w-60" />
    <Card className="p-4 sm:p-5">
      <CardTitle w="w-40" />
      <Choices n={5} cols="grid-cols-1" />
      <Line w="w-28" h="h-3.5" className="mt-4" />
    </Card>
    <Card className="p-4 sm:p-5">
      <CardTitle w="w-24" />
      <CalendarBlock />
    </Card>
    <Card className="p-4 sm:p-5">
      <CardTitle w="w-24" />
      <Line w="w-3/4" h="h-3.5" />
    </Card>
    <ListCard rows={1} title="w-20" trailing="pill" />
  </Page>
);

/** Printing: your file (drop box, pages, copies), print options (three groups), my prints. */
const Printing = () => (
  <Page>
    <Title w="w-32" sub="w-56" />
    <Card className="p-4 sm:p-5 grid grid-cols-1 gap-4">
      <CardTitle w="w-20" />
      <Bone className="-mt-3 h-28 w-full rounded-control" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="w-12" />
        <Field label="w-14" />
      </div>
    </Card>
    <Card className="p-4 sm:p-5">
      <CardTitle w="w-28" />
      <Line w="w-20" h="h-3" className="mb-2" />
      <Choices n={3} cols="grid-cols-1 sm:grid-cols-3" h="h-14" />
      <Line w="w-12" h="h-3" className="mt-5 mb-2" />
      <Choices n={2} cols="grid-cols-2" />
      <Line w="w-16" h="h-3" className="mt-5 mb-2" />
      <Choices n={2} cols="grid-cols-2" />
      <div className="mt-5 pt-4 border-t border-line-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Line w="w-48" h="h-3.5" />
        <Button className="w-full sm:w-36" />
      </div>
    </Card>
    <ListCard rows={2} title="w-20" trailing="pill" />
  </Page>
);

/** Book the court: calendar and times side by side on desktop, then my bookings. */
const Court = () => (
  <Page wide>
    <Title w="w-44" sub={false} />
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <Card className="p-4 sm:p-5">
        <CardTitle w="w-24" />
        <CalendarBlock />
      </Card>
      <Card className="p-4 sm:p-5">
        <CardTitle w="w-24" />
        <Line w="w-3/4" h="h-3.5" />
      </Card>
    </div>
    <ListCard rows={2} title="w-28" trailing="pill" />
  </Page>
);

/** Notifications: "New" (tinted rows with a dot) and "Earlier". */
const Notifications = () => (
  <Page>
    <Title w="w-44" sub="w-24" action={<Bone className="h-10 w-32 rounded-control" />} />
    <Card className="overflow-hidden">
      <CardTitle w="w-12" flush />
      <div className="divide-y divide-line-soft">
        {['w-3/4', 'w-2/3'].map((w, i) => (
          <div key={i} className="bg-navy-tint/40">
            <Row title={w} sub="w-1/3" trailing="none" />
          </div>
        ))}
      </div>
    </Card>
    <ListCard rows={4} title="w-16" trailing="none" widths={['w-4/5', 'w-3/5', 'w-2/3', 'w-1/2']} />
  </Page>
);

/** Help: search, common questions (text rows with a chevron), get help. */
const Help = () => (
  <Page>
    <Title w="w-20" sub={false} />
    <Bone className="h-12 w-full rounded-control" />
    <Card className="overflow-hidden">
      <CardTitle w="w-40" flush />
      <div className="divide-y divide-line-soft">
        {['w-4/5', 'w-3/5', 'w-2/3', 'w-3/4', 'w-1/2', 'w-4/5', 'w-2/3', 'w-3/5'].map((w, i) => (
          <Row key={i} title={w} sub={false} circle={false} />
        ))}
      </div>
    </Card>
    <ListCard rows={3} title="w-20" />
  </Page>
);

/** Ask Kap: title, one chat card (greeting bubble, suggestions, input bar). */
const Chat = () => (
  <Page>
    <Title w="w-28" sub="w-64" />
    <Card className="overflow-hidden flex flex-col h-[calc(100dvh-270px)] lg:h-[calc(100dvh-240px)] min-h-[400px] lg:max-h-[820px]">
      <div className="flex-1 p-4 grid grid-cols-1 content-start gap-3">
        <div className="flex gap-2">
          <Circle size="w-8 h-8" />
          <div className="grid grid-cols-1 gap-1.5 min-w-0 flex-1">
            <Bone className="h-16 w-64 max-w-full rounded-[18px]" />
            <Line w="w-10" h="h-2.5" />
          </div>
        </div>
        <div className="pl-10 flex flex-wrap gap-2">
          {['w-40', 'w-32', 'w-44', 'w-36'].map((w, i) => (
            <Bone key={i} className={`h-9 ${w} rounded-full`} />
          ))}
        </div>
      </div>
      <div className="p-3 flex gap-2 border-t border-line">
        <Bone className="flex-1 h-12 rounded-full" />
        <Circle size="w-12 h-12" />
      </div>
    </Card>
  </Page>
);

/** Check a document: one card with a field and two buttons. */
const Verify = () => (
  <Page>
    <Title w="w-52" sub="w-64" />
    <Card className="p-4 sm:p-5">
      <Field label="w-32" />
      <Line w="w-56 max-w-full" h="h-3" className="mt-2" />
      <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
        <Button className="w-full sm:w-32" />
        <Button className="w-full sm:w-24" />
      </div>
    </Card>
  </Page>
);

/** Password & security: password (two rows), devices (row + button), privacy (switch + row). */
const Security = () => (
  <Page>
    <Title w="w-56" sub={false} />
    <Card className="overflow-hidden">
      <CardTitle w="w-20" flush />
      <div className="divide-y divide-line-soft">
        <Row title="w-2/5" sub={false} />
        <Row title="w-1/2" sub={false} />
      </div>
    </Card>
    <Card className="overflow-hidden">
      <CardTitle w="w-40" flush />
      <Row title="w-1/2" sub={false} trailing="pill" />
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">
        <Bone className="h-10 w-48 rounded-control" />
      </div>
    </Card>
    <Card className="overflow-hidden">
      <CardTitle w="w-16" flush />
      <div className="px-4 sm:px-5">
        <SwitchRow title="w-56" sub="w-60" />
      </div>
      <div className="border-t border-line-soft">
        <Row title="w-2/5" sub={false} />
      </div>
    </Card>
  </Page>
);

/** Announcements (older design): banner card, then cards in two columns from md. */
const Announcements = () => (
  <div className="space-y-6">
    <Card className="p-6 grid grid-cols-1 gap-3">
      <Line w="w-40" h="h-3" />
      <Line w="w-4/5" h="h-6" className="rounded-control" />
      <Line w="w-3/5" h="h-3.5" />
    </Card>
    <div className="grid md:grid-cols-2 gap-6">
      {[4, 3, 5, 3].map((n, i) => (
        <Card key={i} className="p-6 grid grid-cols-1 gap-3">
          <div className="flex justify-between">
            <Bone className="h-6 w-24 rounded-full" />
            <Line w="w-20" h="h-3" />
          </div>
          <Line w="w-3/4" h="h-5" />
          {Array.from({ length: n }, (_, j) => (
            <Line key={j} w={j === n - 1 ? 'w-1/2' : 'w-full'} h="h-3" />
          ))}
          <div className="pt-3 mt-1 border-t border-line-soft flex justify-between">
            <Line w="w-28" h="h-3" />
            <Line w="w-16" h="h-3" />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

/** Officials (older design): heading, search card, officials in 1 / 2 / 3 columns. */
const Officials = () => (
  <div className="max-w-[1200px] grid grid-cols-1 gap-5">
    <div className="grid grid-cols-1 gap-2.5">
      <Line w="w-60" h="h-7 sm:h-8" className="rounded-control" />
      <Line w="w-80 max-w-full" h="h-3.5" />
    </div>
    <Card className="p-4 sm:p-5">
      <Field label="w-32" />
    </Card>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-center gap-4">
            <Circle size="w-16 h-16" />
            <div className="grid grid-cols-1 gap-2 flex-1 min-w-0">
              <Line w="w-3/4" h="h-4" />
              <Line w="w-1/2" h="h-3" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-line-soft grid grid-cols-1 gap-3">
            {[0, 1].map(j => (
              <div key={j} className="grid grid-cols-1 gap-1.5">
                <Line w="w-16" h="h-2.5" />
                <Line w="w-2/3" h="h-3.5" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  </div>
);

/** Guest · Track: tracking number form, then "Need help?" rows. */
const GuestTrack = () => (
  <Page>
    <Title w="w-44" sub="w-72" />
    <Card className="p-4 sm:p-5">
      <Field label="w-28" />
      <Line w="w-64" h="h-3" className="mt-2" />
      <div className="mt-5 flex sm:justify-end">
        <Button className="w-full sm:w-36" />
      </div>
    </Card>
    <ListCard rows={2} title="w-24" widths={['w-1/2', 'w-2/5']} />
  </Page>
);

/** Guest · a page that needs an account: centred icon, title, text, two buttons, then "do now" rows. */
const Locked = () => (
  <Page>
    <Card className="p-4 sm:p-5">
      <div className="grid grid-cols-1 justify-items-center gap-2.5 py-4">
        <Circle size="w-16 h-16" />
        <Line w="w-56" h="h-6" className="mt-3 rounded-control" />
        <Line w="w-64" h="h-3.5" />
        <Line w="w-52" h="h-3.5" />
        <div className="mt-4 w-full max-w-[320px] grid grid-cols-1 gap-2.5">
          <Button />
          <Button />
        </div>
      </div>
    </Card>
    <ListCard rows={4} title="w-40" />
  </Page>
);

export const RESIDENT_SKELETONS = {
  rGuestTrack: GuestTrack,
  rLocked: Locked,
  rHome: Home,
  rDocuments: Documents,
  rRequestForm: RequestForm,
  rReport: Report,
  rVisit: Visit,
  rPrinting: Printing,
  rCourt: Court,
  rNotifications: Notifications,
  rHelp: Help,
  rChat: Chat,
  rVerify: Verify,
  rSecurity: Security,
  rAnnouncements: Announcements,
  rOfficials: Officials,
  rServices: Services,
  rRequests: Requests,
  rAccount: Account,
  rDisplay: DisplaySettings,
  rNotify: NotifySettings,
  rProfile: Profile,
  rLegal: Legal,
} satisfies Record<string, React.FC>;
