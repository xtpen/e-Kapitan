import React, { useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { KnowledgeBaseItem } from '../../types';
import { AttentionPanel, Button, Card, DataTable, Field, FilterChips, Input, PageHeader, StatusPill, Textarea, formatShortDateTime } from '../ui';

type Panel = 'detail' | 'edit' | 'add';
const blank = { category: '', question: '', answer: '', keywords: '' };

/**
 * Admin · Chatbot Knowledge. Ka-Barangay AI only answers from these entries (PRODUCT.md),
 * so staff control exactly what residents are told. No mockup; Admin list + detail pattern.
 */
export const AdminChatbotKnowledge: React.FC = () => {
  const { knowledgeBase, addKnowledgeItem, updateKnowledgeItem, removeKnowledgeItem } = useBarangay();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('detail');
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmRemove, setConfirmRemove] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const categories = Array.from(new Set(knowledgeBase.map(k => k.category))).sort();
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = knowledgeBase.filter(
    k =>
      (category === 'all' || k.category === category) &&
      words.every(w => `${k.question} ${k.answer} ${k.keywords.join(' ')}`.toLowerCase().includes(w)),
  );
  const selected = shown.find(k => k.id === selectedId) ?? shown[0];

  const show = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (!form.category.trim()) e.category = 'Enter a topic, e.g. "Clearance" or "Office hours".';
    if (form.question.trim().length < 8) e.question = 'Write the question the way a resident would ask it.';
    if (form.answer.trim().length < 20) e.answer = 'Write a complete answer residents can act on.';
    setErrors(e);
    if (Object.keys(e).length) return;
    // Reuse an existing topic's spelling ("office hours" → "Office Hours") so topics don't split.
    const typed = form.category.trim();
    const data = {
      category: categories.find(c => c.toLowerCase() === typed.toLowerCase()) ?? typed,
      question: form.question.trim(),
      answer: form.answer.trim(),
      keywords: form.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean),
    };
    if (panel === 'add') {
      addKnowledgeItem(data);
      setCategory('all');
      setQuery('');
      setSelectedId(null);
    } else if (selected) updateKnowledgeItem(selected.id, data);
    setPanel('detail');
  };

  const detail = (k: KnowledgeBaseItem) => (
    <Card aria-live="polite">
      <StatusPill tone="info">{k.category}</StatusPill>
      <h2 className="text-h3 font-semibold text-navy-ink mt-2">{k.question}</h2>
      <p className="mt-3 whitespace-pre-line">{k.answer}</p>
      {k.keywords.length > 0 && (
        <p className="flex flex-wrap gap-1.5 mt-3" aria-label="Keywords">
          {k.keywords.map(w => (
            <span key={w} className="rounded-full bg-surface-muted px-2.5 py-0.5 text-caption font-semibold text-muted">
              {w}
            </span>
          ))}
        </p>
      )}
      <p className="text-caption text-muted mt-3">Last updated {formatShortDateTime(k.lastUpdated)}</p>
      <Button
        variant="secondary"
        fullWidth
        className="mt-4"
        onClick={() => {
          setForm({ category: k.category, question: k.question, answer: k.answer, keywords: k.keywords.join(', ') });
          setErrors({});
          setPanel('edit');
        }}
      >
        Edit answer
      </Button>
      {confirmRemove ? (
        <div role="alert" className="mt-3 rounded-control bg-danger-bg px-4 py-3">
          <p className="font-semibold text-danger-fg">Remove this answer?</p>
          <p className="text-meta mt-0.5">Ka-Barangay AI will stop using it and will say it doesn't know instead.</p>
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <Button variant="secondary" size="sm" onClick={() => setConfirmRemove(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={() => { removeKnowledgeItem(k.id); setConfirmRemove(false); setSelectedId(null); }}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" fullWidth className="mt-2.5" onClick={() => setConfirmRemove(true)}>
          Remove answer
        </Button>
      )}
    </Card>
  );

  const formView = (
    <Card>
      <h2 className="text-h3 font-semibold text-navy-ink">{panel === 'add' ? 'Add answer' : 'Edit answer'}</h2>
      <p className="text-meta text-muted">Write in plain language. Include fees, hours and what to bring when they apply.</p>
      <Field label="Topic" error={errors.category} help="Pick one already used, or type a new one.">
        {p => (
          <>
            <Input {...p} list="kb-topics" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <datalist id="kb-topics">
              {categories.map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      <Field label="Question" error={errors.question}>
        {p => <Input {...p} value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />}
      </Field>
      <Field label="Answer" error={errors.answer}>
        {p => <Textarea {...p} className="min-h-[180px]" value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} />}
      </Field>
      <Field label="Keywords" optional help="Comma separated, English and Filipino, e.g. clearance, trabaho, cedula.">
        {p => <Input {...p} value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} />}
      </Field>
      <div className="grid grid-cols-2 gap-2.5 mt-5">
        <Button variant="secondary" onClick={() => setPanel('detail')}>
          Cancel
        </Button>
        <Button onClick={save}>{panel === 'add' ? 'Add answer' : 'Save changes'}</Button>
      </div>
    </Card>
  );

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Chatbot Knowledge"
        description="Ka-Barangay AI only answers from these entries. If a question isn't covered, it tells residents to ask the hall."
        action={
          <Button size="sm" icon={<Plus className="w-5 h-5" aria-hidden="true" />} onClick={() => { setForm(blank); setErrors({}); setPanel('add'); show(); }}>
            Add answer
          </Button>
        }
      />
      <Card className="mb-5">
        <div className="-mt-4">
          <Field label="Search">
            {p => (
              <div className="relative">
                <Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <Input {...p} type="search" className="pl-11" placeholder="Words in the question, answer or keywords" value={query} onChange={e => { setQuery(e.target.value); setSelectedId(null); }} />
              </div>
            )}
          </Field>
        </div>
        <FilterChips<string>
          className="mt-3"
          label="Topic"
          value={category}
          onChange={c => { setCategory(c); setSelectedId(null); setPanel('detail'); }}
          chips={[
            { id: 'all', label: 'All topics', count: knowledgeBase.length },
            ...categories.map(c => ({ id: c, label: c, count: knowledgeBase.filter(k => k.category === c).length })),
          ]}
        />
      </Card>
      <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)] gap-5 items-start">
        <Card>
          <DataTable<KnowledgeBaseItem>
            rows={shown}
            rowKey={k => k.id}
            onRowClick={k => { setSelectedId(k.id); setPanel('detail'); setConfirmRemove(false); show(); }}
            isSelected={k => k.id === selected?.id && panel === 'detail'}
            rowLabel={k => `Open: ${k.question}`}
            columns={[
              { header: 'Question', cell: k => <span className="font-semibold">{k.question}</span>, sortValue: k => k.question },
              { header: 'Topic', cell: k => k.category, sortValue: k => k.category },
              { header: 'Updated', cell: k => formatShortDateTime(k.lastUpdated), className: 'whitespace-nowrap text-muted', sortValue: k => k.lastUpdated, sortLabels: ['oldest first', 'newest first'] },
            ]}
            mobile={{ title: k => k.question, meta: k => `${k.category} · updated ${formatShortDateTime(k.lastUpdated)}` }}
            empty={<p className="text-meta text-muted py-4">No answers match. Add one so Ka-Barangay AI can help with it.</p>}
          />
        </Card>
        <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-[96px] lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto lg:rounded-card">
          {panel !== 'detail' ? <AttentionPanel key={panel}>{formView}</AttentionPanel> : selected ? detail(selected) : null}
        </div>
      </div>
    </div>
  );
};
