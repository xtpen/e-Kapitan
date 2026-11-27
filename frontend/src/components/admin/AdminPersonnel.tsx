import React, { useRef, useState } from 'react';
import { Check, Search, UserPlus, X } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { ROLE_ACCESS } from '../../data/mockData';
import type { AccessArea, Personnel, StaffRole } from '../../types';
import {
  Button,
  Card,
  Checkbox,
  DataTable,
  Field,
  FilterChips,
  Input,
  PageHeader,
  Select,
  StatusPill,
  dateTimeValue,
  formatShortDateTime,
  type Tone,
  AttentionPanel,
} from '../ui';

type Filter = 'active' | 'on_leave' | 'deactivated' | 'all';
type Panel = 'detail' | 'edit' | 'add';

const ROLE_LABEL: Record<StaffRole, string> = {
  super_admin: 'Super administrator',
  administrator: 'Administrator',
  records: 'Records',
  desk: 'Front desk',
  peace_order: 'Peace and order',
  health: 'Health worker',
  viewer: 'View only',
};

/** What each role can see and do, in plain words. */
const ROLE_HELP: Record<StaffRole, string> = {
  super_admin: 'Everything, including adding staff and choosing what each person can use.',
  administrator: 'Everything except staff accounts.',
  records: 'Document and print requests, and resident records.',
  desk: 'Walk-in work: document, complaint, print and court requests.',
  peace_order: 'Complaints only. For tanods and the Lupon.',
  health: 'Resident records only. For health workers.',
  viewer: 'Can look at reports but not change anything. For officials.',
};

const AREAS: { id: AccessArea; label: string }[] = [
  { id: 'documents', label: 'Document requests' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'printing', label: 'Printing requests' },
  { id: 'court', label: 'Court bookings' },
  { id: 'residents', label: 'Resident records' },
  { id: 'management', label: 'Services, officials and chatbot' },
  { id: 'reports', label: 'Reports and audit logs' },
  { id: 'users', label: 'Staff accounts (super admins only)' },
];

const STATUS: Record<Personnel['status'], { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'success' },
  on_leave: { label: 'On leave', tone: 'warning' },
  deactivated: { label: 'Deactivated', tone: 'neutral' },
};

const POSITIONS = [
  'Barangay Secretary',
  'Barangay Treasurer',
  'Records Clerk',
  'Front Desk Officer',
  'Tanod Commander',
  'Barangay Tanod',
  'Lupon Member',
  'Barangay Health Worker',
];

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isMobile = (v: string) => /^09\d{9}$/.test(v.replace(/[\s-]/g, ''));

const blank = { name: '', position: '', role: 'desk' as StaffRole, access: ROLE_ACCESS.desk, email: '', mobile: '' };

const pill = (p: Personnel) => <StatusPill tone={STATUS[p.status].tone}>{STATUS[p.status].label}</StatusPill>;

const smooth = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion') ? 'auto' : 'smooth';

/**
 * Super admin · Users & permissions: staff accounts, their role (super admin, admin, records…)
 * and which areas each person can use. Only super admins open this page (App.tsx). The last
 * active super admin can't be removed or downgraded, so someone can always manage users.
 */
export const AdminPersonnel: React.FC = () => {
  const { personnel, addPersonnel, updatePersonnel } = useBarangay();

  const [filter, setFilter] = useState<Filter>('active');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('detail');
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const count = (f: Filter) => personnel.filter(p => f === 'all' || p.status === f).length;
  const q = query.trim().toLowerCase();
  const shown = personnel
    .filter(p => (filter === 'all' || p.status === filter) && (!q || `${p.name} ${p.position} ${ROLE_LABEL[p.role]} ${p.email}`.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selected = shown.find(p => p.id === selectedId) ?? shown[0];

  const activeSupers = personnel.filter(p => p.status === 'active' && p.role === 'super_admin');
  const isLastAdmin = (p: Personnel) => p.role === 'super_admin' && p.status === 'active' && activeSupers.length <= 1;

  const show = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: smooth(), block: 'start' }));
    }
  };

  const select = (p: Personnel) => {
    setSelectedId(p.id);
    setPanel('detail');
    setConfirmDeactivate(false);
    show();
  };

  const startAdd = () => {
    setForm(blank);
    setErrors({});
    setPanel('add');
    show();
  };

  const startEdit = (p: Personnel) => {
    setForm({ name: p.name, position: p.position, role: p.role, access: p.access, email: p.email, mobile: p.mobile });
    setErrors({});
    setPanel('edit');
  };

  const validate = (editing?: Personnel) => {
    const e: Record<string, string> = {};
    if (form.name.trim().split(/\s+/).length < 2) e.name = 'Enter the first and last name.';
    if (!form.position.trim()) e.position = 'Enter their position, e.g. Records Clerk.';
    if (!isEmail(form.email)) e.email = 'Enter a valid email. Sign-in details are sent there.';
    else if (personnel.some(p => p.email.toLowerCase() === form.email.trim().toLowerCase() && p.id !== editing?.id))
      e.email = 'Another staff account already uses this email.';
    if (!isMobile(form.mobile)) e.mobile = 'Enter an 11-digit number that starts with 09.';
    if (form.access.length === 0) e.access = 'Tick at least one, or deactivate the account instead.';
    if (editing && isLastAdmin(editing) && (form.role !== 'super_admin' || !form.access.includes('users')))
      e.role = 'This is the only active super administrator. Make someone else a super administrator first.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    const data = {
      name: form.name.trim(),
      position: form.position.trim(),
      role: form.role,
      access: form.access,
      email: form.email.trim(),
      mobile: form.mobile.replace(/[\s-]/g, ''),
    };
    if (panel === 'add') {
      if (!validate()) return;
      const created = addPersonnel({ ...data, status: 'active' });
      setFilter('active');
      setQuery('');
      setSelectedId(created.id);
    } else if (selected) {
      if (!validate(selected)) return;
      updatePersonnel(selected.id, data);
    }
    setPanel('detail');
  };

  const toggleArea = (a: AccessArea, on: boolean) =>
    setForm(f => ({ ...f, access: on ? [...f.access, a] : f.access.filter(x => x !== a) }));

  /* ---------- Views ---------- */

  const detailView = (p: Personnel) => (
    <Card aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-h3 font-semibold text-navy-ink">{p.name}</h2>
          <p className="text-meta text-muted">{p.position}</p>
        </div>
        {pill(p)}
      </div>

      {/* Role first, in plain words: the main thing a super admin checks here. */}
      <div className="mt-4 rounded-control bg-surface-muted px-4 py-3">
        <p className="text-caption font-semibold text-muted">Role</p>
        <p className="font-semibold text-ink">{ROLE_LABEL[p.role]}</p>
        <p className="text-meta text-ink mt-0.5">
          <span className="font-semibold">Can see and do:</span> {ROLE_HELP[p.role]}
        </p>
      </div>

      <h3 className="font-semibold mt-4 mb-1.5">What they can use</h3>
      <div className="@container">
      <ul className="grid @[22rem]:grid-cols-2 gap-x-4 gap-y-1.5" aria-label="What they can use">
        {AREAS.map(a => {
          const has = p.access.includes(a.id);
          return (
            <li key={a.id} className={`flex items-start gap-2 text-meta ${has ? 'text-ink' : 'text-muted'}`}>
              {has ? (
                <Check className="w-5 h-5 shrink-0 text-success-fg" strokeWidth={2} aria-hidden="true" />
              ) : (
                <X className="w-5 h-5 shrink-0 text-muted" strokeWidth={2} aria-hidden="true" />
              )}
              <span>
                {a.label}
                <span className="sr-only">{has ? ': allowed' : ': not allowed'}</span>
              </span>
            </li>
          );
        })}
      </ul>
      </div>

      <dl className="mt-4 @container border-t border-line-soft">
        {[
          ['Email', p.email],
          ['Mobile', p.mobile],
          ['Last active', p.lastActive ? formatShortDateTime(p.lastActive) : 'Not yet'],
          ['Added', new Date(`${p.addedOn}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
        ].map(([k, v]) => (
          <div key={k} className="grid @[18rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 py-2 border-b border-line-soft last:border-b-0">
            <dt className="text-meta text-muted">{k}</dt>
            <dd className="text-meta font-semibold [overflow-wrap:anywhere]">{v}</dd>
          </div>
        ))}
      </dl>

      {p.status === 'deactivated' ? (
        <div className="grid gap-2.5 mt-4">
          <Button fullWidth onClick={() => updatePersonnel(p.id, { status: 'active' })}>
            Reactivate account
          </Button>
          <Button variant="secondary" fullWidth onClick={() => startEdit(p)}>
            Edit account
          </Button>
        </div>
      ) : (
        <>
          <Button fullWidth className="mt-4" onClick={() => startEdit(p)}>
            Edit account
          </Button>
          {confirmDeactivate ? (
            <div role="alert" className="mt-3 rounded-control bg-danger-bg px-4 py-3">
              <p className="font-semibold text-danger-fg">Deactivate {p.name}?</p>
              <p className="text-meta mt-0.5">They won't be able to sign in or be given work. What they did before stays in the audit log.</p>
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                <Button variant="secondary" size="sm" onClick={() => setConfirmDeactivate(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    updatePersonnel(p.id, { status: 'deactivated' });
                    setConfirmDeactivate(false);
                  }}
                >
                  Deactivate
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updatePersonnel(p.id, { status: p.status === 'on_leave' ? 'active' : 'on_leave' })}
                disabled={p.status === 'active' && isLastAdmin(p)}
              >
                {p.status === 'on_leave' ? 'Back from leave' : 'Mark on leave'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDeactivate(true)} disabled={isLastAdmin(p)}>
                Deactivate
              </Button>
            </div>
          )}
        </>
      )}
      {isLastAdmin(p) && (
        <p className="text-meta text-muted mt-2">This is the only active super administrator, so it can't be put on leave or deactivated.</p>
      )}
      {p.status === 'on_leave' && <p className="text-meta text-muted mt-2">While on leave they aren't offered in "Assigned to" lists.</p>}
    </Card>
  );

  const formView = (
    <Card>
      <h2 className="text-h3 font-semibold text-navy-ink">{panel === 'add' ? 'Add staff' : `Edit ${selected?.name}`}</h2>
      <p className="text-meta text-muted">Give each person only what their job needs.</p>
      <Field label="Full name" error={errors.name}>
        {p => <Input {...p} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />}
      </Field>
      <Field label="Position" error={errors.position} help="Pick a common one or type another.">
        {p => (
          <>
            <Input {...p} list="positions" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
            <datalist id="positions">
              {POSITIONS.map(x => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      <Field label="Role" error={errors.role} help={`Can see and do: ${ROLE_HELP[form.role]}`}>
        {p => (
          <Select
            {...p}
            value={form.role}
            onChange={e => {
              const role = e.target.value as StaffRole;
              setForm(f => ({ ...f, role, access: ROLE_ACCESS[role] }));
            }}
          >
            {(Object.keys(ROLE_LABEL) as StaffRole[]).map(r => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <fieldset className="mt-4">
        <legend className="font-semibold text-meta">What they can use</legend>
        <p className="text-meta text-muted">The role ticks these for you. Change single ones if needed.</p>
        <div className="grid sm:grid-cols-2 gap-x-4">
          {AREAS.map(a => (
            <Checkbox key={a.id} label={a.label} checked={form.access.includes(a.id)} onChange={e => toggleArea(a.id, e.target.checked)} />
          ))}
        </div>
        {errors.access && <p className="text-meta text-danger-fg">{errors.access}</p>}
      </fieldset>
      <div className="grid sm:grid-cols-2 gap-x-4">
        <Field label="Email" error={errors.email}>
          {p => <Input {...p} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />}
        </Field>
        <Field label="Mobile number" error={errors.mobile}>
          {p => <Input {...p} type="tel" inputMode="numeric" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <Button variant="secondary" onClick={() => setPanel('detail')}>
          Cancel
        </Button>
        <Button onClick={save}>{panel === 'add' ? 'Add staff' : 'Save changes'}</Button>
      </div>
    </Card>
  );

  return (
    <div className="max-w-[1280px]">
      <PageHeader
        title="Users & permissions"
        description={`Staff accounts and what each person can use. ${count('active')} active.`}
        action={
          <Button size="sm" onClick={startAdd} icon={<UserPlus className="w-5 h-5" aria-hidden="true" />}>
            Add staff
          </Button>
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] gap-4 items-start">
        <Card className="min-w-0">
          <div className="relative">
            <Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search staff"
              className="pl-11"
              placeholder="Search by name, position, role or email"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSelectedId(null);
              }}
            />
          </div>
          <FilterChips<Filter>
            className="mt-3 mb-4"
            label="Status"
            value={filter}
            onChange={f => {
              setFilter(f);
              setSelectedId(null);
              setPanel('detail');
            }}
            chips={[
              { id: 'active', label: 'Active', count: count('active') },
              { id: 'on_leave', label: 'On leave', count: count('on_leave') },
              { id: 'deactivated', label: 'Deactivated', count: count('deactivated') },
              { id: 'all', label: 'All', count: count('all') },
            ]}
          />
          <DataTable<Personnel>
            rows={shown}
            rowKey={p => p.id}
            onRowClick={select}
            isSelected={p => p.id === selected?.id && panel === 'detail'}
            rowLabel={p => `Open ${p.name}`}
            pageSize={25}
            itemLabel="staff"
            defaultSort={{ header: 'Name', direction: 'asc' }}
            columns={[
              {
                header: 'Name',
                sortValue: p => p.name,
                cell: p => (
                  <>
                    <span className="font-semibold">{p.name}</span>
                    <span className="block text-muted">{p.position}</span>
                  </>
                ),
              },
              { header: 'Role', cell: p => ROLE_LABEL[p.role], sortValue: p => ROLE_LABEL[p.role] },
              {
                header: 'Last active',
                cell: p => (p.lastActive ? formatShortDateTime(p.lastActive) : 'Not yet'),
                className: 'whitespace-nowrap text-muted',
                sortValue: p => (p.lastActive ? dateTimeValue(p.lastActive) : 0),
                sortLabels: ['longest ago first', 'most recent first'],
              },
              { header: 'Status', cell: pill, sortValue: p => STATUS[p.status].label },
            ]}
            mobile={{ title: p => p.name, status: pill, meta: p => `${p.position} · ${ROLE_LABEL[p.role]}` }}
            empty={
              <div className="py-6 text-center">
                <p className="font-semibold">No staff here.</p>
                <p className="text-meta text-muted mt-1">Try another filter or clear the search.</p>
              </div>
            }
          />
        </Card>
        <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-[96px] lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto lg:rounded-card">
          {panel !== 'detail' ? (
            <AttentionPanel key={panel}>{formView}</AttentionPanel>
          ) : selected ? (
            detailView(selected)
          ) : (
            <Card>
              <h2 className="text-h3 font-semibold text-navy-ink">Staff details</h2>
              <p className="text-meta text-muted mt-1">Choose a person to see their role and what they can use.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
