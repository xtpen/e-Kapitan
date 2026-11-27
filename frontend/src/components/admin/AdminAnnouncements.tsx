import React, { useRef, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { Announcement } from '../../types';
import { Button, Card, CardHeader, Checkbox, Field, FilterChips, Input, PageHeader, Select, StatusPill, Textarea, type Tone } from '../ui';
import { PUROKS } from '../../data/reference';

type Category = Announcement['category'];
type Filter = 'all' | 'urgent' | Category;

const CATEGORIES: { id: Category; hint: string; tone: Tone }[] = [
  { id: 'Advisory', hint: 'Notices, reminders, schedule changes', tone: 'warning' },
  { id: 'Health', hint: 'Check-ups, vaccinations, health center news', tone: 'success' },
  { id: 'Event', hint: 'Assemblies, clean-ups, celebrations', tone: 'info' },
  { id: 'Program', hint: 'Aid, scholarships, livelihood programs', tone: 'info' },
  { id: 'Emergency', hint: 'Weather, floods, fire, safety', tone: 'danger' },
];
const toneOf = (c: Category) => CATEGORIES.find(x => x.id === c)?.tone ?? 'neutral';

const ALL_PUROKS = 'All Puroks';
const PAGE = 10;

/** Dates come as "2026-09-09" (sample data) or "Sep 9, 2026" (new posts). */
const dateValue = (d: string) => {
  const t = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00` : d);
  return Number.isNaN(t) ? 0 : t;
};
const showDate = (d: string) => {
  const t = dateValue(d);
  return t ? new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : d;
};
const audience = (a: Announcement) => (!a.targetPurok || /^all\b/i.test(a.targetPurok) ? 'All puroks' : a.targetPurok);

const blank = { title: '', category: 'Advisory' as Category, content: '', targetPurok: ALL_PUROKS, isUrgent: false };

/**
 * Admin · Announcements. Staff post news and alerts; residents read them on their home page
 * and guests on the public page. No mockup; list + side form, like the other admin record pages.
 */
export const AdminAnnouncements: React.FC = () => {
  const { announcements, createAnnouncement } = useBarangay();
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(PAGE);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Newest first. Posts made today share a date, so ties keep the context order (newest is added first).
  const sorted = announcements
    .map((a, i) => ({ a, i }))
    .sort((x, y) => dateValue(y.a.date) - dateValue(x.a.date) || x.i - y.i)
    .map(x => x.a);
  const matchesFilter = (f: Filter, a: Announcement) => f === 'all' || (f === 'urgent' ? a.isUrgent : a.category === f);
  const shown = sorted.filter(a => matchesFilter(filter, a));
  const urgentCount = announcements.filter(a => a.isUrgent).length;

  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setForm(f => ({ ...f, [k]: v }));

  const startNew = () => {
    setComposing(true);
    requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      formRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      titleRef.current?.focus({ preventScroll: true });
    });
  };

  const close = () => {
    setForm(blank);
    setErrors({});
    setComposing(false);
  };

  const post = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.title.trim().length < 5) err.title = 'Enter a short title residents will understand.';
    if (form.content.trim().length < 20) err.content = 'Write the details: what, when, where, and what residents should do.';
    setErrors(err);
    if (Object.keys(err).length) return;
    createAnnouncement({
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      targetPurok: form.targetPurok,
      isUrgent: form.isUrgent,
    });
    setFilter('all');
    close();
  };

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chips = [
    { id: 'all' as Filter, label: 'All', count: announcements.length },
    { id: 'urgent' as Filter, label: 'Urgent', count: urgentCount },
    ...CATEGORIES.map(c => ({ id: c.id as Filter, label: c.id, count: announcements.filter(a => a.category === c.id).length })).filter(
      c => c.count > 0,
    ),
  ];

  const formCard = (
    <Card>
      <h2 className="text-h3 font-semibold text-navy-ink">New announcement</h2>
      <p className="text-meta text-muted">Residents see it on their home page as soon as you post it.</p>
      <form onSubmit={post} noValidate>
        <Field label="Title" required error={errors.title}>
          {p => (
            <Input
              {...p}
              ref={titleRef}
              placeholder='e.g. "Free check-up for seniors on Friday"'
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-x-4">
          <Field label="Category">
            {p => (
              <Select {...p} value={form.category} onChange={e => set('category', e.target.value as Category)}>
                {CATEGORIES.map(c => (
                  <option key={c.id}>{c.id}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="For">
            {p => (
              <Select {...p} value={form.targetPurok} onChange={e => set('targetPurok', e.target.value)}>
                <option value={ALL_PUROKS}>All puroks</option>
                {PUROKS.map(x => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <p className="text-meta text-muted mt-1.5">{CATEGORIES.find(c => c.id === form.category)?.hint}.</p>
        <Field label="Message" required error={errors.content} help="Say what, when and where, and what residents should do or bring.">
          {p => <Textarea {...p} value={form.content} onChange={e => set('content', e.target.value)} />}
        </Field>
        <Checkbox
          className="mt-3"
          label="Mark as urgent"
          description="Shown with a red alert. Use only for safety, weather or emergencies."
          checked={form.isUrgent}
          onChange={e => set('isUrgent', e.target.checked)}
        />
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit">Post</Button>
        </div>
      </form>
    </Card>
  );

  return (
    <div className="max-w-[1280px]">
      <PageHeader
        title="Announcements"
        description="Post news and alerts for residents. They show on the resident home page and the public page."
        action={
          <Button size="sm" icon={<Megaphone className="w-5 h-5" aria-hidden="true" />} onClick={startNew}>
            New announcement
          </Button>
        }
      />
      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-4 items-start">
        {/* On phones the form only shows after "New announcement", above the list. On desktop it is always there. */}
        <div
          ref={formRef}
          className={`scroll-mt-24 lg:order-last lg:sticky lg:top-[96px] lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto lg:rounded-card lg:block ${
            composing ? '' : 'hidden'
          }`}
        >
          {formCard}
        </div>
        <Card>
          <CardHeader
            title="Posted"
            action={
              <span className="text-meta text-muted" aria-live="polite">
                {shown.length} {shown.length === 1 ? 'announcement' : 'announcements'}
              </span>
            }
          />
          <FilterChips<Filter>
            label="Show"
            value={filter}
            onChange={f => {
              setFilter(f);
              setLimit(PAGE);
            }}
            chips={chips}
          />
          {shown.length === 0 ? (
            <div className="py-6 text-center">
              <p className="font-semibold">Nothing posted here yet.</p>
              <p className="text-meta text-muted mt-1">Choose another category, or post a new announcement.</p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line-soft">
              {shown.slice(0, limit).map(a => {
                const long = a.content.length > 220;
                const open = expanded.has(a.id);
                return (
                  <li key={a.id} className="py-3.5 first:pt-1 last:pb-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {a.isUrgent && <StatusPill tone="danger">Urgent</StatusPill>}
                      <StatusPill tone={toneOf(a.category)}>{a.category}</StatusPill>
                      <span className="text-caption text-muted ml-auto whitespace-nowrap">{showDate(a.date)}</span>
                    </div>
                    <h3 className="font-semibold text-ink mt-2">{a.title}</h3>
                    <p className={`text-meta mt-1 whitespace-pre-line ${long && !open ? 'line-clamp-3' : ''}`}>{a.content}</p>
                    {long && (
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => toggle(a.id)}
                        className="text-meta font-semibold text-primary-strong hover:underline underline-offset-4 cursor-pointer min-h-11"
                      >
                        {open ? 'Show less' : 'Read all'}
                      </button>
                    )}
                    <p className={`text-caption text-muted ${long ? '' : 'mt-1.5'}`}>
                      For {audience(a)} · Posted by {a.author}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          {shown.length > limit && (
            <Button variant="secondary" size="sm" fullWidth className="mt-4" onClick={() => setLimit(l => l + PAGE)}>
              Show more ({shown.length - limit} left)
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
};
