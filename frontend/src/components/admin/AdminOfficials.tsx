import React, { useRef, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { Official } from '../../types';
import { AttentionPanel, Button, Card, DataTable, Field, FilterChips, Input, PageHeader, Select, StatusPill, type Tone } from '../ui';

type Filter = 'current' | 'former' | 'all';
type Panel = 'detail' | 'edit' | 'add';

const POSITIONS = ['Barangay Captain', 'Barangay Kagawad', 'SK Chairperson', 'Barangay Secretary', 'Barangay Treasurer'];
const POSITION_ORDER = (p: string) => {
  const i = POSITIONS.indexOf(p);
  return i === -1 ? POSITIONS.length : i;
};

const STATUS: Record<Official['status'], { label: string; tone: Tone }> = {
  'Active (Incumbent)': { label: 'In office', tone: 'success' },
  'On Leave (Absent)': { label: 'On leave', tone: 'warning' },
  Suspended: { label: 'Suspended', tone: 'danger' },
  'Inactive (Former)': { label: 'Former', tone: 'neutral' },
};

const isCurrent = (o: Official) => o.status !== 'Inactive (Former)';
const blank = { name: '', position: 'Barangay Kagawad', committee: '', contactDetails: '', status: 'Active (Incumbent)' as Official['status'] };
const pill = (o: Official) => <StatusPill tone={STATUS[o.status].tone}>{STATUS[o.status].label}</StatusPill>;

/** Admin · Officials. No mockup; Admin list + detail pattern. Feeds the certificate council column and the public directory. */
export const AdminOfficials: React.FC = () => {
  const { officials, addOfficial, updateOfficial } = useBarangay();
  const [filter, setFilter] = useState<Filter>('current');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('detail');
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const count = (f: Filter) => officials.filter(o => f === 'all' || (f === 'current' ? isCurrent(o) : !isCurrent(o))).length;
  const shown = officials.filter(o => filter === 'all' || (filter === 'current' ? isCurrent(o) : !isCurrent(o)));
  const selected = shown.find(o => o.id === selectedId) ?? shown[0];
  const captains = officials.filter(o => o.position === 'Barangay Captain' && o.status === 'Active (Incumbent)');

  const show = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().split(/\s+/).length < 2) e.name = 'Enter the full name, e.g. "Hon. Maria T. Santos".';
    if (!form.committee.trim()) e.committee = 'Enter the committee or office, e.g. "Committee on Health".';
    const otherCaptain = captains.find(c => c.id !== (panel === 'edit' ? selected?.id : undefined));
    if (form.position === 'Barangay Captain' && form.status === 'Active (Incumbent)' && otherCaptain)
      e.position = `${otherCaptain.name} is the Barangay Captain in office. Mark them as former first.`;
    setErrors(e);
    if (Object.keys(e).length) return;
    const data = { ...form, name: form.name.trim(), committee: form.committee.trim(), contactDetails: form.contactDetails.trim() };
    if (panel === 'add') {
      const created = addOfficial(data);
      setFilter('current');
      setSelectedId(created.id);
    } else if (selected) updateOfficial(selected.id, data);
    setPanel('detail');
  };

  const detail = (o: Official) => (
    <Card aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-h3 font-semibold text-navy">{o.name}</h2>
        {pill(o)}
      </div>
      <p className="text-meta text-muted">{o.position}</p>
      <dl className="mt-3 @container">
        {[
          ['Committee or office', o.committee],
          ['Contact', o.contactDetails || 'None'],
        ].map(([k, v]) => (
          <div key={k} className="grid @[18rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 py-2 border-b border-line-soft last:border-b-0">
            <dt className="text-meta text-muted">{k}</dt>
            <dd className="text-meta font-semibold [overflow-wrap:anywhere]">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-meta text-muted mt-3">
        {isCurrent(o) && o.status !== 'Suspended'
          ? 'Shown on every certificate (council list) and in the public Officials directory.'
          : 'Not shown on certificates while ' + STATUS[o.status].label.toLowerCase() + '.'}
      </p>
      <Button
        variant="secondary"
        fullWidth
        className="mt-4"
        onClick={() => {
          setForm({ name: o.name, position: o.position, committee: o.committee, contactDetails: o.contactDetails, status: o.status });
          setErrors({});
          setPanel('edit');
        }}
      >
        Edit official
      </Button>
      {isCurrent(o) && (
        <Button variant="secondary" size="sm" fullWidth className="mt-2.5" onClick={() => updateOfficial(o.id, { status: 'Inactive (Former)' })}>
          Mark as former (term ended)
        </Button>
      )}
    </Card>
  );

  const formView = (
    <Card>
      <h2 className="text-h3 font-semibold text-navy">{panel === 'add' ? 'Add official' : `Edit ${selected?.name}`}</h2>
      <Field label="Full name" error={errors.name}>
        {p => <Input {...p} value={form.name} onChange={e => set('name', e.target.value)} />}
      </Field>
      <Field label="Position" error={errors.position}>
        {p => (
          <Select {...p} value={form.position} onChange={e => set('position', e.target.value)}>
            {POSITIONS.map(x => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Committee or office" error={errors.committee}>
        {p => <Input {...p} value={form.committee} onChange={e => set('committee', e.target.value)} />}
      </Field>
      <Field label="Public contact" optional help="Shown in the public directory. Use an office email or number, not a personal one.">
        {p => <Input {...p} value={form.contactDetails} onChange={e => set('contactDetails', e.target.value)} />}
      </Field>
      <Field label="Status">
        {p => (
          <Select {...p} value={form.status} onChange={e => set('status', e.target.value as Official['status'])}>
            {(Object.keys(STATUS) as Official['status'][]).map(s => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-2.5 mt-5">
        <Button variant="secondary" onClick={() => setPanel('detail')}>
          Cancel
        </Button>
        <Button onClick={save}>{panel === 'add' ? 'Add official' : 'Save changes'}</Button>
      </div>
    </Card>
  );

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Officials"
        description="The Punong Barangay, Sangguniang Barangay and office holders. Used on certificates and the public directory."
        action={
          <Button size="sm" icon={<UserPlus className="w-5 h-5" aria-hidden="true" />} onClick={() => { setForm(blank); setErrors({}); setPanel('add'); show(); }}>
            Add official
          </Button>
        }
      />
      <FilterChips<Filter>
        className="mb-4"
        value={filter}
        onChange={f => { setFilter(f); setSelectedId(null); setPanel('detail'); }}
        chips={[
          { id: 'current', label: 'In office', count: count('current') },
          { id: 'former', label: 'Former', count: count('former') },
          { id: 'all', label: 'All', count: count('all') },
        ]}
      />
      <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] gap-5 items-start">
        <Card>
          <DataTable<Official>
            rows={shown}
            rowKey={o => o.id}
            onRowClick={o => { setSelectedId(o.id); setPanel('detail'); show(); }}
            isSelected={o => o.id === selected?.id && panel === 'detail'}
            rowLabel={o => `Open ${o.name}`}
            defaultSort={{ header: 'Position', direction: 'asc' }}
            columns={[
              { header: 'Name', cell: o => <span className="font-semibold">{o.name}</span>, sortValue: o => o.name.replace(/^Hon\.\s*/, '') },
              { header: 'Position', cell: o => o.position, sortValue: o => POSITION_ORDER(o.position), sortLabels: ['by rank', 'by rank, reversed'] },
              { header: 'Committee', cell: o => o.committee, sortValue: o => o.committee },
              { header: 'Status', cell: pill, sortValue: o => STATUS[o.status].label },
            ]}
            mobile={{ title: o => o.name, status: pill, meta: o => `${o.position} · ${o.committee}` }}
            empty={<p className="text-meta text-muted py-4">No officials here.</p>}
          />
        </Card>
        <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-[96px]">
          {panel !== 'detail' ? <AttentionPanel key={panel}>{formView}</AttentionPanel> : selected ? detail(selected) : null}
        </div>
      </div>
    </div>
  );
};
