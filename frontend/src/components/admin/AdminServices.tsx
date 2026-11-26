import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { ServiceItem } from '../../types';
import { AttentionPanel, Button, Card, Checkbox, DataTable, Field, Input, PageHeader, Select, StatusPill, Textarea, formatPeso } from '../ui';

type Panel = 'detail' | 'edit' | 'add';
const CATEGORIES: ServiceItem['category'][] = ['Clearance', 'Certification', 'Permit', 'Social Service'];

const blank = {
  title: '',
  category: 'Certification' as ServiceItem['category'],
  description: '',
  fee: '0',
  isFreeForEligible: false,
  eligibleCriteria: '',
  processingTime: '',
  validityMonths: '6',
  requirements: '',
  availableOnline: true,
};

const pill = (s: ServiceItem) =>
  s.availableOnline ? <StatusPill tone="success">Open to residents</StatusPill> : <StatusPill tone="neutral">Hidden</StatusPill>;

/** Admin · Services: the documents residents can request, with fees and requirements. No mockup. */
export const AdminServices: React.FC = () => {
  const { services, documentRequests, addService, updateService } = useBarangay();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('detail');
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = services.find(s => s.id === selectedId) ?? services[0];
  const requestCount = (s: ServiceItem) => documentRequests.filter(d => d.documentType === s.id).length;

  const show = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const startEdit = (s: ServiceItem) => {
    setForm({
      title: s.title,
      category: s.category,
      description: s.description,
      fee: String(s.fee),
      isFreeForEligible: s.isFreeForEligible,
      eligibleCriteria: s.eligibleCriteria,
      processingTime: s.processingTime,
      validityMonths: String(s.validityMonths),
      requirements: s.requirements.join('\n'),
      availableOnline: s.availableOnline,
    });
    setErrors({});
    setPanel('edit');
  };

  const save = () => {
    const e: Record<string, string> = {};
    const fee = Number(form.fee);
    const validity = Number(form.validityMonths);
    const reqs = form.requirements.split('\n').map(r => r.trim()).filter(Boolean);
    if (form.title.trim().length < 4) e.title = 'Enter the document name.';
    if (form.description.trim().length < 10) e.description = 'Describe what the document is for, in a sentence.';
    if (form.fee === '' || Number.isNaN(fee) || fee < 0) e.fee = 'Enter the fee in pesos. Use 0 if it is free.';
    if (!form.processingTime.trim()) e.processingTime = 'Say how long it takes, e.g. "Same day".';
    if (!Number.isInteger(validity) || validity < 1 || validity > 60) e.validityMonths = 'Enter 1 to 60 months.';
    if (reqs.length === 0) e.requirements = 'List at least one requirement, one per line.';
    if (form.isFreeForEligible && fee > 0 && !form.eligibleCriteria.trim()) e.eligibleCriteria = 'Say who qualifies for the waiver.';
    setErrors(e);
    if (Object.keys(e).length) return;

    const data = {
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      fee,
      isFreeForEligible: form.isFreeForEligible,
      eligibleCriteria: form.eligibleCriteria.trim(),
      processingTime: form.processingTime.trim(),
      validityMonths: validity,
      requirements: reqs,
      availableOnline: form.availableOnline,
    };
    if (panel === 'add') setSelectedId(addService(data).id);
    else if (selected) updateService(selected.id, data);
    setPanel('detail');
  };

  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setForm(f => ({ ...f, [k]: v }));

  const detail = (s: ServiceItem) => (
    <Card aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-h3 font-semibold text-navy-ink">{s.title}</h2>
        {pill(s)}
      </div>
      <p className="text-meta text-muted">{s.category}</p>
      <p className="mt-3 text-meta">{s.description}</p>
      <dl className="mt-3 @container">
        {[
          ['Fee', s.fee === 0 ? 'Free' : `${formatPeso(s.fee)}, paid at the hall`],
          ['Fee waiver', s.isFreeForEligible && s.fee > 0 ? s.eligibleCriteria || 'Yes' : 'None'],
          ['Processing time', s.processingTime],
          ['Valid for', `${s.validityMonths} months`],
          ['Requests so far', String(requestCount(s))],
        ].map(([k, v]) => (
          <div key={k} className="grid @[18rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 py-2 border-b border-line-soft last:border-b-0">
            <dt className="text-meta text-muted">{k}</dt>
            <dd className="text-meta font-semibold [overflow-wrap:anywhere]">{v}</dd>
          </div>
        ))}
      </dl>
      <h3 className="font-semibold mt-4 mb-1">Requirements residents see</h3>
      <ul className="list-disc pl-5 text-meta space-y-0.5">
        {s.requirements.map(r => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <Button variant="secondary" fullWidth className="mt-5" onClick={() => startEdit(s)}>
        Edit service
      </Button>
      <Button variant="secondary" size="sm" fullWidth className="mt-2.5" onClick={() => updateService(s.id, { availableOnline: !s.availableOnline })}>
        {s.availableOnline ? 'Hide from residents' : 'Open to residents'}
      </Button>
      <p className="text-meta text-muted mt-2">
        Hiding stops new online requests. Requests already made are not affected.
      </p>
    </Card>
  );

  const formView = (
    <Card>
      <h2 className="text-h3 font-semibold text-navy-ink">{panel === 'add' ? 'Add service' : `Edit ${selected?.title}`}</h2>
      <p className="text-meta text-muted">Residents see this on the Documents page and in the request form.</p>
      <Field label="Document name" error={errors.title}>
        {p => <Input {...p} value={form.title} onChange={e => set('title', e.target.value)} />}
      </Field>
      <Field label="Category">
        {p => (
          <Select {...p} value={form.category} onChange={e => set('category', e.target.value as ServiceItem['category'])}>
            {CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Short description" error={errors.description}>
        {p => <Textarea {...p} value={form.description} onChange={e => set('description', e.target.value)} />}
      </Field>
      <div className="grid sm:grid-cols-2 gap-x-4">
        <Field label="Fee (₱)" error={errors.fee} help="0 means free.">
          {p => <Input {...p} type="number" min={0} inputMode="decimal" value={form.fee} onChange={e => set('fee', e.target.value)} />}
        </Field>
        <Field label="Valid for (months)" error={errors.validityMonths}>
          {p => <Input {...p} type="number" min={1} max={60} value={form.validityMonths} onChange={e => set('validityMonths', e.target.value)} />}
        </Field>
      </div>
      <Field label="Processing time" error={errors.processingTime} help='For example: "Same day" or "1 to 2 working days".'>
        {p => <Input {...p} value={form.processingTime} onChange={e => set('processingTime', e.target.value)} />}
      </Field>
      <div className="mt-3">
        <Checkbox label="Fee can be waived for some residents" checked={form.isFreeForEligible} onChange={e => set('isFreeForEligible', e.target.checked)} />
      </div>
      {form.isFreeForEligible && (
        <Field label="Who qualifies for the waiver?" error={errors.eligibleCriteria}>
          {p => <Input {...p} value={form.eligibleCriteria} onChange={e => set('eligibleCriteria', e.target.value)} />}
        </Field>
      )}
      <Field label="Requirements" error={errors.requirements} help="One per line.">
        {p => <Textarea {...p} value={form.requirements} onChange={e => set('requirements', e.target.value)} />}
      </Field>
      <div className="mt-3">
        <Checkbox label="Open to residents (can be requested online)" checked={form.availableOnline} onChange={e => set('availableOnline', e.target.checked)} />
      </div>
      <div className="grid grid-cols-2 gap-2.5 mt-5">
        <Button variant="secondary" onClick={() => setPanel('detail')}>
          Cancel
        </Button>
        <Button onClick={save}>{panel === 'add' ? 'Add service' : 'Save changes'}</Button>
      </div>
    </Card>
  );

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Services"
        description={`${services.filter(s => s.availableOnline).length} of ${services.length} documents can be requested online. Changes show to residents right away.`}
        action={
          <Button
            size="sm"
            icon={<Plus className="w-5 h-5" aria-hidden="true" />}
            onClick={() => {
              setForm(blank);
              setErrors({});
              setPanel('add');
              show();
            }}
          >
            Add service
          </Button>
        }
      />
      <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] gap-5 items-start">
        <Card>
          <DataTable<ServiceItem>
            rows={services}
            rowKey={s => s.id}
            onRowClick={s => {
              setSelectedId(s.id);
              setPanel('detail');
              show();
            }}
            isSelected={s => s.id === selected?.id && panel === 'detail'}
            rowLabel={s => `Open ${s.title}`}
            columns={[
              { header: 'Document', cell: s => <span className="font-semibold">{s.title}</span>, sortValue: s => s.title },
              { header: 'Category', cell: s => s.category, sortValue: s => s.category },
              { header: 'Fee', cell: s => (s.fee === 0 ? 'Free' : formatPeso(s.fee)), sortValue: s => s.fee, className: 'whitespace-nowrap' },
              { header: 'Status', cell: pill, sortValue: s => (s.availableOnline ? 0 : 1), sortLabels: ['open first', 'hidden first'] },
            ]}
            mobile={{ title: s => s.title, status: pill, meta: s => `${s.category} · ${s.fee === 0 ? 'Free' : formatPeso(s.fee)}` }}
          />
        </Card>
        <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-[96px] lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto lg:rounded-card">
          {panel !== 'detail' ? <AttentionPanel key={panel}>{formView}</AttentionPanel> : selected ? detail(selected) : null}
        </div>
      </div>
    </div>
  );
};
