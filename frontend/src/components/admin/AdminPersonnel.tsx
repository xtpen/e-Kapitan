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
  administrator: 'Administrator',
  records: 'Records staff',
  desk: 'Front desk',
  peace_order: 'Peace and order',
  health: 'Health worker',
  viewer: 'View only',
};

const ROLE_HELP: Record<StaffRole, string> = {
  administrator: 'Everything, including staff accounts and settings.',
  records: 'Document and print requests, resident records.',
  desk: 'Document, complaint, print and court requests.',
  peace_order: 'Complaints only (Tanod, Lupon).',
  health: 'Resident records only (health workers).',
  viewer: 'Reports only (officials who review, not process).',
};

const AREAS: { id: AccessArea; label: string }[] = [
  { id: 'documents', label: 'Document requests' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'printing', label: 'Printing requests' },
  { id: 'court', label: 'Court reservations' },
  { id: 'residents', label: 'Resident records' },
  { id: 'management', label: 'Management (personnel, services, officials, chatbot)' },
  { id: 'reports', label: 'Reports and audit logs' },
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

/** Admin · Personnel (staff accounts and what each person can use). No mockup; Admin list + detail pattern. */
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

  const activeAdmins = personnel.filter(p => p.status === 'active' && p.role === 'administrator');
  const isLastAdmin = (p: Personnel) => p.role === 'administrator' && p.status === 'active' && activeAdmins.length <= 1;

  const show = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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
    if (form.access.length === 0) e.access = 'Give at least one area, or deactivate the account instead.';
    if (editing && isLastAdmin(editing) && (form.role !== 'administrator' || !form.access.includes('management')))
      e.role = 'This is the only active administrator. Make someone else an administrator first.';
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
        <h2 className="text-h3 font-semibold text-navy-ink">{p.name}</h2>
        {pill(p)}
      </div>
      <p className="text-meta text-muted">{p.position}</p>

      <dl className="mt-3 @container">
        {[
          ['Role', ROLE_LABEL[p.role]],
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

      <h3 className="font-semibold mt-4 mb-1.5">Can use</h3>
      <ul className="space-y-1.5" aria-label="Access">
        {AREAS.map(a => {
          const has = p.access.includes(a.id);
          return (
            <li key={a.id} className={`flex items-start gap-2 text-meta ${has ? '' : 'text-muted'}`}>
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

      <Button variant="secondary" fullWidth className="mt-5" onClick={() => startEdit(p)}>
        Edit account
      </Button>

      {p.status === 'deactivated' ? (
        <Button fullWidth className="mt-2.5" onClick={() => updatePersonnel(p.id, { status: 'active' })}>
          Reactivate account
        </Button>
      ) : confirmDeactivate ? (
        <div role="alert" className="mt-3 rounded-control bg-danger-bg px-4 py-3">
          <p className="font-semibold text-danger-fg">Deactivate {p.name}?</p>
          <p className="text-meta mt-0.5">
            They won't be able to sign in or be assigned work. Their past actions stay in the audit log.
          </p>
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
      {isLastAdmin(p) && (
        <p className="text-meta text-muted mt-2">This is the only active administrator, so it can't be put on leave or deactivated.</p>
      )}
      {p.status === 'on_leave' && <p className="text-meta text-muted mt-2">While on leave they aren't offered in "Assigned to" lists.</p>}
    </Card>
  );

  const formView = (
    <Card>
      <h2 className="text-h3 font-semibold text-navy-ink">{panel === 'add' ? 'Add staff' : `Edit ${selected?.name}`}</h2>
      <p className="text-meta text-muted">Give each person only the areas their job needs.</p>
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
      <Field label="Role" error={errors.role} help={ROLE_HELP[form.role]}>
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
        <legend className="font-semibold text-meta">Can use</legend>
        <p className="text-meta text-muted">Set by the role. Adjust single areas if needed.</p>
        {AREAS.map(a => (
          <Checkbox key={a.id} label={a.label} checked={form.access.includes(a.id)} onChange={e => toggleArea(a.id, e.target.checked)} />
        ))}
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
      <div className="grid grid-cols-2 gap-2.5 mt-5">
        <Button variant="secondary" onClick={() => setPanel('detail')}>
          Cancel
        </Button>
        <Button onClick={save}>{panel === 'add' ? 'Add staff' : 'Save changes'}</Button>
      </div>
    </Card>
  );

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Personnel"
        description={`${count('active')} active staff accounts. Each person sees only the areas they're given.`}
        action={
          <Button size="sm" onClick={startAdd} icon={<UserPlus className="w-5 h-5" aria-hidden="true" />}>
            Add staff
          </Button>
        }
      />

      <Card className="mb-5">
        <div className="-mt-4">
          <Field label="Search">
            {p => (
              <div className="relative">
                <Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <Input
                  {...p}
                  type="search"
                  className="pl-11"
                  placeholder="Name, position, role or email"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setSelectedId(null);
                  }}
                />
              </div>
            )}
          </Field>
        </div>
        <FilterChips<Filter>
          className="mt-3"
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
      </Card>

      <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] gap-5 items-start">
        <Card>
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
              <p className="text-meta text-muted mt-1">Choose a person to see what they can use.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
