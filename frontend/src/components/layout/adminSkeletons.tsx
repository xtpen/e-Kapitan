import React from 'react';
import { Bone } from '../ui';

/*
 * Admin portal skeletons: one per page, built from the same measurements as the admin pages
 * (ui Card p-4 sm:p-5 with card corners, PageHeader 28px title + one line, 16px gaps, table rows
 * of about 44px), so the swap to the real page barely moves anything. Keep each in step with its
 * page: when a page's blocks change, change them here too.
 */

const Line: React.FC<{ w?: string; h?: string; className?: string }> = ({ w = 'w-full', h = 'h-3.5', className = '' }) => (
  <Bone className={`${h} ${w} max-w-full rounded-full ${className}`} />
);
const Card: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`min-w-0 bg-surface border border-line rounded-card p-4 sm:p-5 ${className}`}>{children}</div>
);
const CardTitle: React.FC<{ w?: string; pill?: boolean }> = ({ w = 'w-36', pill }) => (
  <div className="flex items-center justify-between gap-3 mb-3">
    <Line w={w} h="h-4" />
    {pill && <Bone className="h-6 w-20 rounded-full" />}
  </div>
);
const Header: React.FC<{ w?: string; sub?: string; actions?: number }> = ({ w = 'w-48', sub = 'w-80', actions = 1 }) => (
  <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
    <div className="grid gap-2 min-w-0">
      <Line w={w} h="h-7 sm:h-8" className="rounded-control" />
      <Line w={sub} h="h-3.5" />
    </div>
    {actions > 0 && (
      <div className="hidden md:flex gap-2">
        {Array.from({ length: actions }, (_, i) => (
          <Bone key={i} className={`h-10 ${i === actions - 1 ? 'w-36' : 'w-32'} rounded-control`} />
        ))}
      </div>
    )}
  </div>
);
const Field: React.FC<{ className?: string }> = ({ className = '' }) => <Bone className={`h-12 w-full rounded-control ${className}`} />;
const Chips: React.FC<{ n: number }> = ({ n }) => (
  <div className="flex gap-2 overflow-hidden">
    {Array.from({ length: n }, (_, i) => (
      <Bone key={i} className={`h-9 shrink-0 rounded-full ${['w-16', 'w-24', 'w-20', 'w-28'][i % 4]}`} />
    ))}
  </div>
);
/** Table: header line, then rows of `cols` cells; `twoLine` makes the first cell two lines. */
const Table: React.FC<{ rows?: number; cols?: number; twoLine?: boolean; pill?: boolean }> = ({ rows = 7, cols = 4, twoLine = true, pill = true }) => (
  <div>
    <div className="hidden md:flex gap-6 pb-2 border-b-2 border-line">
      {Array.from({ length: cols }, (_, i) => (
        <Line key={i} w={i === 0 ? 'w-24' : 'w-16'} h="h-2.5" className={i === 0 ? 'flex-[2]' : 'flex-1'} />
      ))}
    </div>
    {Array.from({ length: rows }, (_, r) => (
      <div key={r} className="flex items-center gap-6 py-2.5 border-b border-line-soft last:border-b-0">
        <div className="flex-[2] grid gap-1.5 min-w-0">
          <Line w={['w-40', 'w-32', 'w-44', 'w-36'][r % 4]} h="h-3.5" />
          {twoLine && <Line w="w-24" h="h-2.5" />}
        </div>
        {Array.from({ length: Math.max(0, cols - (pill ? 2 : 1)) }, (_, c) => (
          <Line key={c} w={['w-28', 'w-20', 'w-24'][(r + c) % 3]} className="flex-1 hidden md:block" />
        ))}
        {pill && <Bone className="h-6 w-20 rounded-full shrink-0" />}
      </div>
    ))}
  </div>
);
/** Label/value rows (detail panels). */
const Pairs: React.FC<{ n: number }> = ({ n }) => (
  <div className="divide-y divide-line-soft">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="flex justify-between gap-4 py-2.5">
        <Line w="w-20" h="h-3" />
        <Line w={['w-32', 'w-24', 'w-40'][i % 3]} h="h-3" />
      </div>
    ))}
  </div>
);
const Detail: React.FC<{ pairs?: number; extra?: React.ReactNode }> = ({ pairs = 6, extra }) => (
  <Card className="hidden lg:block">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="grid gap-2">
        <Line w="w-40" h="h-5" />
        <Line w="w-28" h="h-3" />
      </div>
      <Bone className="h-6 w-20 rounded-full" />
    </div>
    <Pairs n={pairs} />
    {extra}
    <Bone className="h-12 w-full rounded-control mt-4" />
    <div className="grid grid-cols-2 gap-2.5 mt-2.5">
      <Bone className="h-12 rounded-control" />
      <Bone className="h-12 rounded-control" />
    </div>
  </Card>
);
const Page: React.FC<{ max?: string; children: React.ReactNode }> = ({ max = 'max-w-[1200px]', children }) => <div className={`${max} w-full`}>{children}</div>;

/* ---------- pages ---------- */

/** Overview: header, 4 stat tiles, then insights + trend + two bar cards | waiting + stages, then activity. */
const Overview = () => (
  <Page max="max-w-[1280px]">
    <Header w="w-40" sub="w-72" actions={2} />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {[0, 1, 2, 3].map(i => (
        <Card key={i} className="!p-3.5 sm:!p-4 flex items-center gap-3">
          <Bone className="w-11 h-11 rounded-tile shrink-0" />
          <div className="grid gap-1.5 flex-1">
            <Line w="w-10" h="h-6" className="rounded-md" />
            <Line w="w-28" h="h-3" />
            <Line w="w-16" h="h-2.5" />
          </div>
        </Card>
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-3 items-start mt-4">
      <div className="lg:col-span-2 grid gap-4 min-w-0">
        <Card>
          <CardTitle w="w-36" />
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Bone className="w-8 h-8 rounded-full shrink-0" />
                <div className="grid gap-1.5 flex-1 pt-1">
                  <Line h="h-3" />
                  <Line w="w-2/3" h="h-3" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle w="w-48" />
          <Bone className="h-[200px] w-full rounded-control" />
        </Card>
        <div className="hidden md:grid sm:grid-cols-2 gap-4">
          {[0, 1].map(c => (
            <Card key={c}>
              <CardTitle w="w-40" />
              <div className="grid gap-2.5">
                {[90, 70, 55, 40, 25].map(w => (
                  <div key={w} className="grid grid-cols-[38%_1fr] items-center gap-3">
                    <Line w="w-20" h="h-3" />
                    <Bone className="h-5 rounded-r-[4px]" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
      <div className="grid gap-4 min-w-0">
        <Card>
          <CardTitle w="w-32" pill />
          <Table rows={7} cols={2} />
        </Card>
        <Card className="hidden md:block">
          <CardTitle w="w-48" />
          <div className="grid gap-2.5">
            {[80, 60, 45, 30].map(w => (
              <div key={w} className="grid grid-cols-[38%_1fr] items-center gap-3">
                <Line w="w-20" h="h-3" />
                <Bone className="h-5 rounded-r-[4px]" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </Page>
);

/** Requests pages: header, then list card (filters inside) | sticky detail. */
const RequestList: React.FC<{ filters: 'row' | 'chips'; ratio: string; pairs?: number; actions?: number; extra?: React.ReactNode }> = ({ filters, ratio, pairs = 6, actions = 1, extra }) => (
  <Page>
    <Header w="w-56" sub="w-96" actions={actions} />
    <div className={`grid gap-4 items-start ${ratio}`}>
        <Card>
          {filters === 'row' ? (
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr] gap-3 mb-4">
              <Field />
              <Field />
              <Field />
            </div>
          ) : (
            <div className="hidden md:grid gap-3 mb-4">
              <Field />
              <Chips n={6} />
            </div>
          )}
          <div className="md:hidden grid gap-3 mb-3">
            <Field />
            <Chips n={4} />
          </div>
          <Table rows={8} />
        </Card>
        <Detail pairs={pairs} extra={extra} />
    </div>
  </Page>
);

const Documents = () => (
  <RequestList
    filters="row"
    ratio="lg:grid-cols-[1.7fr_minmax(320px,1fr)]"
    extra={
      <div className="grid gap-2 mt-3">
        <Line w="w-28" h="h-3.5" />
        <Line w="w-48" h="h-3" />
        <Line w="w-40" h="h-3" />
        <Bone className="h-12 w-full rounded-control mt-1" />
      </div>
    }
  />
);
const Complaints = () => (
  <RequestList
    filters="row"
    ratio="lg:grid-cols-[1.6fr_minmax(320px,1fr)]"
    pairs={4}
    extra={
      <div className="grid gap-2 mt-3">
        <Line w="w-32" h="h-3.5" />
        <Line h="h-3" />
        <Line w="w-4/5" h="h-3" />
      </div>
    }
  />
);
const Printing = () => (
  <RequestList
    filters="chips"
    ratio="lg:grid-cols-[1.6fr_minmax(320px,1fr)]"
    actions={0}
    pairs={0}
    extra={
      <div className="grid gap-3 mt-1">
        <Bone className="h-14 w-full rounded-control" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <Bone key={i} className="h-16 rounded-control" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map(i => (
            <Bone key={i} className="h-12 rounded-control" />
          ))}
        </div>
      </div>
    }
  />
);

/** Court: header, calendar card | waiting card + day card. */
const Court = () => (
  <Page>
    <Header w="w-48" sub="w-96" />
    <div className="grid gap-4 lg:grid-cols-[1.8fr_minmax(320px,1fr)] items-start">
      <Card className="order-last lg:order-none">
        <div className="flex justify-between items-center mb-4">
          <Line w="w-36" h="h-5" />
          <div className="flex gap-2">
            <Bone className="h-10 w-10 rounded-control" />
            <Bone className="h-10 w-10 rounded-control" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 7 }, (_, i) => (
            <Line key={`w${i}`} w="w-8" h="h-2.5" className="justify-self-center mb-1" />
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <Bone key={i} className="h-12 sm:h-[76px] rounded-control" />
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          {[0, 1, 2].map(i => (
            <Bone key={i} className="h-6 w-28 rounded-full" />
          ))}
        </div>
      </Card>
      <div className="grid gap-4">
        <Card>
          <CardTitle w="w-44" pill />
          <Line w="w-56" h="h-3" className="mb-3" />
          {[0, 1].map(i => (
            <div key={i} className="grid gap-1.5 py-3 border-t border-line-soft">
              <Line w="w-40" h="h-3.5" />
              <Line w="w-48" h="h-3" />
              <Line w="w-32" h="h-3" />
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <Bone className="h-10 rounded-control" />
                <Bone className="h-10 rounded-control" />
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <CardTitle w="w-48" pill />
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center py-2.5 border-t border-line-soft">
              <div className="grid gap-1.5">
                <Line w="w-32" h="h-3.5" />
                <Line w="w-20" h="h-2.5" />
              </div>
              {i % 2 === 0 && <Bone className="h-6 w-20 rounded-full" />}
            </div>
          ))}
          <Bone className="h-11 w-full rounded-control mt-3" />
        </Card>
      </div>
    </div>
  </Page>
);

/** Audit logs / Users & permissions: list card (search + chips inside) | sticky detail. */
const SearchListDetail: React.FC<{ ratio: string; chips: number; pairs: number; actionW?: boolean; extra?: React.ReactNode }> = ({ ratio, chips, pairs, extra }) => (
  <Page>
    <Header w="w-52" sub="w-80" />
    <div className={`grid gap-4 items-start ${ratio}`}>
      <Card>
        <div className="grid gap-3 mb-4">
          <Field />
          <Chips n={chips} />
        </div>
        <Table rows={9} />
      </Card>
      <Detail pairs={pairs} extra={extra} />
    </div>
  </Page>
);
const Audit = () => <SearchListDetail ratio="lg:grid-cols-[1.6fr_minmax(320px,1fr)]" chips={6} pairs={3} />;
const Personnel = () => (
  <SearchListDetail
    ratio="lg:grid-cols-[1.5fr_minmax(320px,1fr)]"
    chips={4}
    pairs={4}
    extra={
      <div className="mt-3 grid gap-2">
        <Bone className="h-16 w-full rounded-control" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Line key={i} w={['w-28', 'w-24', 'w-32'][i % 3]} h="h-3" />
          ))}
        </div>
      </div>
    }
  />
);

/** Notifications: chips, day groups | "Waiting for you". */
const Notifications = () => (
  <Page>
    <Header w="w-44" sub="w-56" />
    <div className="grid gap-4 items-start lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
      <div className="grid gap-4 min-w-0">
        <Chips n={6} />
        <Card className="!p-0 overflow-hidden">
          {[3, 2].map((n, g) => (
            <div key={g}>
              <div className="px-4 sm:px-5 py-2.5 bg-surface-muted flex justify-between">
                <Line w="w-36" h="h-3" />
                <Line w="w-10" h="h-3" />
              </div>
              {Array.from({ length: n }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 sm:px-5 py-3 border-t border-line-soft">
                  <Bone className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 grid gap-1.5">
                    <Line w="w-64" h="h-3.5" />
                    <Line w="w-40" h="h-3" />
                  </div>
                  <Line w="w-12" h="h-3" className="hidden sm:block" />
                </div>
              ))}
            </div>
          ))}
        </Card>
      </div>
      <Card>
        <CardTitle w="w-32" />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-t border-line-soft">
            <Bone className="w-8 h-8 rounded-full shrink-0" />
            <Line w="w-32" h="h-3.5" className="flex-1" />
            <Line w="w-6" h="h-4" />
          </div>
        ))}
      </Card>
    </div>
  </Page>
);

/** My account: 2 × 2 cards of even height. */
const Account = () => (
  <Page max="max-w-[1100px]">
    <Header w="w-40" sub="w-80" actions={0} />
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <div className="flex items-center gap-4 mb-3">
          <Bone className="w-14 h-14 rounded-full shrink-0" />
          <div className="grid gap-2">
            <Line w="w-44" h="h-4" />
            <Line w="w-56" h="h-3" />
            <Bone className="h-6 w-32 rounded-full" />
          </div>
        </div>
        <Pairs n={4} />
      </Card>
      <Card>
        <CardTitle w="w-36" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {Array.from({ length: 8 }, (_, i) => (
            <Line key={i} w={['w-32', 'w-24', 'w-28'][i % 3]} h="h-3" />
          ))}
        </div>
        <Bone className="h-10 w-56 rounded-control mt-4" />
      </Card>
      {[0, 1].map(i => (
        <Card key={i}>
          <CardTitle w="w-40" />
          <Line w="w-64" h="h-3" />
          <Bone className="h-10 w-40 rounded-control mt-6" />
        </Card>
      ))}
    </div>
  </Page>
);

/** Settings: Display | Accessibility + Guided tour, then Developer (dev). */
const Settings = () => (
  <Page max="max-w-[1100px]">
    <Header w="w-32" sub="w-48" />
    <div className="grid lg:grid-cols-2 gap-4 items-stretch">
      <Card>
        <CardTitle w="w-20" />
        {[0, 1].map(g => (
          <div key={g} className={g ? 'mt-4' : ''}>
            <Line w="w-24" h="h-3" className="mb-2" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map(i => (
                <Bone key={i} className="h-20 rounded-control" />
              ))}
            </div>
          </div>
        ))}
        <div className="mt-4 pt-3 border-t border-line-soft flex justify-between items-center">
          <div className="grid gap-1.5">
            <Line w="w-24" h="h-3.5" />
            <Line w="w-56" h="h-3" />
          </div>
          <Bone className="h-7 w-12 rounded-full" />
        </div>
      </Card>
      <div className="grid gap-4">
        <Card>
          <CardTitle w="w-32" />
          {[0, 1].map(i => (
            <div key={i} className="flex justify-between items-center py-3 border-t border-line-soft first:border-0">
              <div className="grid gap-1.5">
                <Line w="w-28" h="h-3.5" />
                <Line w="w-44" h="h-3" />
              </div>
              <Bone className="h-7 w-12 rounded-full" />
            </div>
          ))}
        </Card>
        <Card>
          <CardTitle w="w-28" />
          <Line w="w-64" h="h-3" />
          <Bone className="h-10 w-44 rounded-control mt-6" />
        </Card>
      </div>
    </div>
  </Page>
);

/** Reports: settings card | preview, then four quick summaries. */
const Reports = () => (
  <Page max="max-w-[1280px]">
    <Header w="w-32" sub="w-80" actions={0} />
    <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-4 items-start">
      <Card>
        <CardTitle w="w-32" />
        <Line w="w-12" h="h-3" className="mb-2" />
        <div className="grid gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <Bone key={i} className="h-[52px] rounded-control" />
          ))}
        </div>
        <Line w="w-14" h="h-3" className="mt-4 mb-2" />
        <Field />
      </Card>
      <Card>
        <div className="flex flex-wrap justify-between gap-3 pb-3 border-b border-line">
          <div className="grid gap-2">
            <Line w="w-14" h="h-2.5" />
            <Line w="w-52" h="h-5" />
            <Line w="w-64" h="h-3" />
          </div>
          <div className="flex gap-2">
            <Bone className="h-10 w-44 rounded-control" />
            <Bone className="h-10 w-48 rounded-control" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          {[0, 1, 2, 3].map(i => (
            <Bone key={i} className="h-[62px] rounded-control" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-5 mt-5">
          {[0, 1, 2].map(t => (
            <div key={t} className="grid gap-2">
              <Line w="w-28" h="h-3.5" />
              {[0, 1, 2, 3].map(r => (
                <div key={r} className="flex justify-between py-1 border-b border-line-soft">
                  <Line w="w-32" h="h-3" />
                  <Line w="w-10" h="h-3" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  </Page>
);

/** Records and public-info pages: header, chips or a filter row, list card | sticky detail. */
const RecordList: React.FC<{ filters: 'row' | 'chips'; pairs: number; extra?: React.ReactNode }> = ({ filters, pairs, extra }) => (
  <Page max="max-w-[1280px]">
    <Header w="w-40" sub="w-96" />
    {filters === 'row' ? (
      <Card className="mb-4">
        <div className="grid md:grid-cols-[2fr_1fr] gap-3">
          <Field />
          <Field />
        </div>
      </Card>
    ) : (
      <div className="mb-4">
        <Chips n={3} />
      </div>
    )}
    <div className="grid gap-4 items-start lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
      <Card>
        <Line w="w-32" h="h-3" className="mb-3" />
        <Table rows={9} />
      </Card>
      <Detail pairs={pairs} extra={extra} />
    </div>
  </Page>
);
const Residents = () => (
  <RecordList
    filters="row"
    pairs={8}
    extra={
      <div className="flex gap-2 mt-3">
        {[0, 1, 2].map(i => (
          <Bone key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>
    }
  />
);
const Officials = () => (
  <RecordList
    filters="chips"
    pairs={2}
    extra={
      <div className="grid gap-2 mt-3">
        <Line w="w-40" h="h-3.5" />
        <Line w="w-28" h="h-3" />
        <Line w="w-28" h="h-3" />
      </div>
    }
  />
);
const Services = () => (
  <RecordList
    filters="chips"
    pairs={5}
    extra={
      <div className="grid gap-2 mt-3">
        <Line w="w-48" h="h-3.5" />
        {[0, 1, 2].map(i => (
          <Line key={i} w={['w-56', 'w-44', 'w-52'][i]} h="h-3" />
        ))}
      </div>
    }
  />
);
const Chatbot = () => (
  <RecordList
    filters="row"
    pairs={0}
    extra={
      <div className="grid gap-2">
        <Line w="w-56" h="h-5" />
        <Bone className="h-28 w-full rounded-control mt-2" />
        <div className="flex gap-2 mt-1">
          {[0, 1, 2, 3].map(i => (
            <Bone key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>
    }
  />
);
/** Announcements: posted list | sticky "New announcement" form. */
const Announcements = () => (
  <Page max="max-w-[1280px]">
    <Header w="w-48" sub="w-80" />
    <div className="grid gap-4 items-start lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
      <Card>
        <CardTitle w="w-20" />
        <Chips n={5} />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="grid gap-2 py-4 border-b border-line-soft last:border-0">
            <div className="flex gap-2">
              <Bone className="h-6 w-20 rounded-full" />
              <Line w="w-24" h="h-3" className="self-center" />
            </div>
            <Line w="w-3/4" h="h-4" />
            <Line h="h-3" />
            <Line w="w-4/5" h="h-3" />
          </div>
        ))}
      </Card>
      <Card className="hidden lg:block">
        <CardTitle w="w-44" />
        <div className="grid gap-3">
          <Field />
          <div className="grid grid-cols-2 gap-3">
            <Field />
            <Field />
          </div>
          <Bone className="h-28 w-full rounded-control" />
          <div className="flex justify-end gap-2.5">
            <Bone className="h-11 w-24 rounded-control" />
            <Bone className="h-11 w-24 rounded-control" />
          </div>
        </div>
      </Card>
    </div>
  </Page>
);

export const ADMIN_SKELETONS = {
  aResidents: Residents,
  aOfficials: Officials,
  aServices: Services,
  aChatbot: Chatbot,
  aAnnouncements: Announcements,
  aOverview: Overview,
  aDocuments: Documents,
  aComplaints: Complaints,
  aPrinting: Printing,
  aCourt: Court,
  aAudit: Audit,
  aPersonnel: Personnel,
  aNotifications: Notifications,
  aAccount: Account,
  aSettings: Settings,
  aReports: Reports,
} satisfies Record<string, React.FC>;

export const AdminSkeletonParts = { Page, Header, Card, CardTitle, Line, Field, Chips, Table, Pairs, Detail };
