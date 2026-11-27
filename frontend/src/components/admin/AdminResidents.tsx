import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Search, UserPlus } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { DuplicateRecordFlag, Resident, ResidentStatus } from '../../types';
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
  Textarea,
  documentStatus,
  formatShortDateTime,
  type Tone,
  AttentionPanel,
} from '../ui';
import { PUROKS } from '../../data/reference';

type Group = 'all' | 'senior' | 'pwd' | 'voter' | 'head' | 'indigent';
type Panel = 'detail' | 'edit' | 'add' | 'duplicates';

const STATUS: Record<ResidentStatus, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'success' },
  transferred: { label: 'Moved out', tone: 'info' },
  archived: { label: 'Archived', tone: 'neutral' },
  deceased: { label: 'Deceased', tone: 'neutral' },
};

const fullName = (r: Resident) => [r.firstName, r.middleName, r.lastName, r.suffix].filter(Boolean).join(' ');
const age = (birth: string) => {
  const b = new Date(`${birth}T00:00:00`);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a -= 1;
  return a;
};
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const isMobileNo = (v: string) => /^09\d{9}$/.test(v.replace(/[\s-]/g, ''));

const tags = (r: Resident) =>
  [
    (r.isSenior || age(r.birthDate) >= 60) && 'Senior',
    r.isPWD && 'PWD',
    r.isIndigent && 'Indigent',
    r.isVoter && 'Voter',
    r.isHouseholdHead && 'Household head',
  ].filter(Boolean) as string[];

/** Turns the matcher's wording ("Exact Birthdate Match: ...") into plain words for staff. */
const plainMatch = (m: string) =>
  m
    .replace(/^high name similarity/i, 'Names look alike')
    .replace(/^exact birthdate match/i, 'Same birthdate')
    .replace(/^identical address/i, 'Same address')
    .replace(/^identical contact number/i, 'Same mobile number');

/** How sure the duplicate check is, in words instead of a percentage. */
const likelihood = (score: number) => (score >= 85 ? 'Very likely the same' : score >= 60 ? 'Possibly the same' : 'Probably different');

const statusPill = (r: Resident) => <StatusPill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</StatusPill>;

const blankForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  birthDate: '',
  gender: 'Female' as Resident['gender'],
  civilStatus: 'Single' as Resident['civilStatus'],
  address: '',
  purok: PUROKS[0],
  contactNumber: '',
  email: '',
  occupation: '',
  householdId: 'new',
  isPWD: false,
  isVoter: false,
  isIndigent: false,
};

/**
 * Admin · Residents. No mockup; follows the Admin list + detail pattern.
 * Resident data is personal data under the Data Privacy Act (RA 10173), so opening a record is logged.
 */
export const AdminResidents: React.FC = () => {
  const {
    residents,
    households,
    duplicateFlags,
    documentRequests,
    registerResident,
    updateResident,
    recordResidentAccess,
    resolveDuplicateFlag,
  } = useBarangay();

  const [query, setQuery] = useState('');
  const [purok, setPurok] = useState('all');
  const [group, setGroup] = useState<Group>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('detail');
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dupNotes, setDupNotes] = useState<Record<string, string>>({});
  const [dupError, setDupError] = useState<Record<string, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const pendingFlags = duplicateFlags.filter(f => f.status === 'pending_review');
  const byId = (id: string) => residents.find(r => r.id === id);

  const inGroupOf = (g: Group, r: Resident) =>
    g === 'all' ||
    (g === 'senior' && (r.isSenior || age(r.birthDate) >= 60)) ||
    (g === 'pwd' && r.isPWD) ||
    (g === 'voter' && r.isVoter) ||
    (g === 'head' && r.isHouseholdHead) ||
    (g === 'indigent' && !!r.isIndigent);
  const inGroup = (r: Resident) => inGroupOf(group, r);

  // "purok 2" / "p2" means exactly Purok 2; every other word must match somewhere
  // (name, number, street, occupation, mobile): "santos purok 2", "reyes rizal", "0412".
  const raw = query.trim().toLowerCase();
  const PUROK_WORD = /(?:^|\s)(?:purok\s*|p)(\d)(?=\s|$)/;
  const purokNo = raw.match(PUROK_WORD)?.[1];
  const words = raw.replace(PUROK_WORD, ' ').split(/\s+/).filter(Boolean);
  const matches = (r: Resident) => {
    if (purokNo && !r.purok.startsWith(`Purok ${purokNo}`)) return false;
    if (!words.length) return true;
    const hay = `${fullName(r)} ${r.residentNumber} ${r.address} ${r.occupation} ${r.contactNumber}`.toLowerCase();
    return words.every(w => hay.includes(w));
  };
  // Everything except the group chip, so each chip can show its own count.
  const base = residents.filter(r => (showInactive || r.status === 'active') && (purok === 'all' || r.purok === purok) && matches(r));
  const groupCount = (g: Group) => base.filter(r => inGroupOf(g, r)).length;
  const shown = base.filter(inGroup).sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
  const selected = shown.find(r => r.id === selectedId) ?? shown[0];

  // Data Privacy Act (RA 10173): opening a record is written to the audit log.
  useEffect(() => {
    if (selected && panel === 'detail') recordResidentAccess(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, panel]);

  const scrollToPanel = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const select = (r: Resident) => {
    setSelectedId(r.id);
    setPanel('detail');
    scrollToPanel();
  };

  const set = <K extends keyof typeof blankForm>(k: K, v: (typeof blankForm)[K]) => setForm(f => ({ ...f, [k]: v }));

  const startAdd = () => {
    setForm(blankForm);
    setErrors({});
    setPanel('add');
    scrollToPanel();
  };

  const startEdit = (r: Resident) => {
    setForm({
      ...blankForm,
      firstName: r.firstName,
      middleName: r.middleName ?? '',
      lastName: r.lastName,
      birthDate: r.birthDate,
      gender: r.gender,
      civilStatus: r.civilStatus,
      address: r.address,
      purok: r.purok,
      contactNumber: r.contactNumber,
      email: r.email ?? '',
      occupation: r.occupation,
      householdId: r.householdId,
      isPWD: r.isPWD,
      isVoter: r.isVoter,
      isIndigent: !!r.isIndigent,
    });
    setErrors({});
    setPanel('edit');
  };

  const validate = (adding: boolean) => {
    const e: Record<string, string> = {};
    if (adding) {
      if (!form.firstName.trim()) e.firstName = 'Enter the first name.';
      if (!form.lastName.trim()) e.lastName = 'Enter the last name.';
      if (!form.birthDate) e.birthDate = 'Enter the birthdate.';
      else if (form.birthDate > new Date().toISOString().slice(0, 10)) e.birthDate = 'The birthdate cannot be in the future.';
    }
    if (form.address.trim().length < 3) e.address = 'Enter the house number and street.';
    if (form.contactNumber && !isMobileNo(form.contactNumber)) e.contactNumber = 'Use an 11-digit number that starts with 09, or leave it blank.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveAdd = () => {
    if (!validate(true)) return;
    const created = registerResident({
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim() || undefined,
      lastName: form.lastName.trim(),
      birthDate: form.birthDate,
      gender: form.gender,
      civilStatus: form.civilStatus,
      address: form.address.trim(),
      purok: form.purok,
      householdId: form.householdId === 'new' ? `hh-${Date.now()}` : form.householdId,
      isHouseholdHead: form.householdId === 'new',
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim() || undefined,
      occupation: form.occupation.trim() || 'Not stated',
      isSenior: age(form.birthDate) >= 60,
      isPWD: form.isPWD,
      isIndigent: form.isIndigent,
      isVoter: form.isVoter,
      status: 'active',
    });
    setSelectedId(created.id);
    setQuery('');
    setGroup('all');
    setPurok('all');
    setPanel('detail');
  };

  const saveEdit = (r: Resident) => {
    if (!validate(false)) return;
    updateResident(r.id, {
      civilStatus: form.civilStatus,
      address: form.address.trim(),
      purok: form.purok,
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim() || undefined,
      occupation: form.occupation.trim() || 'Not stated',
      isPWD: form.isPWD,
      isVoter: form.isVoter,
      isIndigent: form.isIndigent,
    });
    setPanel('detail');
  };

  const resolve = (f: DuplicateRecordFlag, how: 'merge' | 'keep_separate' | 'false_positive') => {
    const note = (dupNotes[f.id] ?? '').trim();
    if (note.length < 5) {
      setDupError(e => ({ ...e, [f.id]: 'Write a short note on how you checked (e.g. "Same PhilSys ID").' }));
      return;
    }
    if (how === 'merge') {
      const keep = byId(f.matchedResidentId);
      updateResident(f.sourceResidentId, {
        status: 'archived',
        notes: `Merged into ${keep?.residentNumber ?? f.matchedResidentId}: ${note}`,
      });
    }
    resolveDuplicateFlag(f.id, how, note);
  };

  /* ---------- Right panel views ---------- */

  const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
    <div className="grid @[18rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 py-2 border-b border-line-soft last:border-b-0">
      <dt className="text-meta text-muted">{k}</dt>
      <dd className="text-meta font-semibold [overflow-wrap:anywhere]">{v}</dd>
    </div>
  );

  const detailView = (r: Resident) => {
    const household = households.find(h => h.id === r.householdId);
    const members = residents.filter(x => x.householdId === r.householdId && x.id !== r.id);
    const requests = documentRequests.filter(d => d.residentId === r.id);
    return (
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-h3 font-semibold text-navy-ink">{fullName(r)}</h2>
            <p className="text-meta text-muted">Resident no. {r.residentNumber}</p>
          </div>
          {statusPill(r)}
        </div>
        {tags(r).length > 0 && (
          <p className="flex flex-wrap gap-1.5 mt-3">
            {tags(r).map(t => (
              <StatusPill key={t} tone="info">
                {t}
              </StatusPill>
            ))}
          </p>
        )}
        <dl className="mt-3 @container">
          <Row k="Address" v={/purok/i.test(r.address) ? r.address : `${r.address}, ${r.purok}`} />
          <Row k="Birthdate" v={`${longDate(r.birthDate)} (${age(r.birthDate)} yrs)`} />
          <Row k="Sex" v={r.gender} />
          <Row k="Civil status" v={r.civilStatus} />
          <Row k="Mobile" v={r.contactNumber || 'None'} />
          <Row k="Email" v={r.email || 'None'} />
          <Row k="Occupation" v={r.occupation} />
          <Row k="Registered" v={longDate(r.registeredDate)} />
        </dl>

        <section className="mt-4">
          <h3 className="font-semibold text-ink">Household</h3>
          <p className="text-meta text-muted">
            {household ? `${household.householdNumber} · ` : ''}
            {r.isHouseholdHead ? 'Head of the household' : household ? `Head: ${household.headName}` : 'Member'}
          </p>
          {members.length > 0 && (
            <ul className="mt-0.5 text-meta flex flex-wrap gap-x-4">
              {members.map(m => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      // Make sure the member is visible in the list, then open them.
                      setQuery('');
                      setGroup('all');
                      setPurok('all');
                      if (m.status !== 'active') setShowInactive(true);
                      select(m);
                    }}
                    className="text-primary-strong font-semibold hover:underline underline-offset-4 cursor-pointer min-h-11"
                  >
                    {fullName(m)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-4">
          <h3 className="font-semibold text-ink">Document requests</h3>
          {requests.length === 0 ? (
            <p className="text-meta text-muted">None yet.</p>
          ) : (
            <ul className="mt-1.5 text-meta divide-y divide-line-soft">
              {requests.slice(0, 4).map(d => (
                <li key={d.id} className="flex items-start justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <span className="min-w-0">
                    {d.documentTitle}
                    <span className="block text-caption text-muted">
                      {d.referenceNumber} · {formatShortDateTime(d.submittedAt)}
                    </span>
                  </span>
                  <StatusPill tone={documentStatus[d.status].tone}>{documentStatus[d.status].label}</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </section>

        {r.notes && (
          <p className="mt-4 text-meta rounded-control bg-surface-muted px-3 py-2">
            <b className="font-semibold">Notes: </b>
            {r.notes}
          </p>
        )}

        <Button fullWidth className="mt-4" onClick={() => startEdit(r)}>
          Edit details
        </Button>
        {r.status === 'active' ? (
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <Button variant="secondary" size="sm" onClick={() => updateResident(r.id, { status: 'transferred' })}>
              Mark moved out
            </Button>
            <Button variant="secondary" size="sm" onClick={() => updateResident(r.id, { status: 'deceased' })}>
              Mark deceased
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" fullWidth className="mt-2.5" onClick={() => updateResident(r.id, { status: 'active' })}>
            Make active again
          </Button>
        )}
        <p className="text-caption text-muted mt-3">
          Each time a record is opened, it is noted in the activity log, as the Data Privacy Act requires.
        </p>
      </Card>
    );
  };

  const formFields = (adding: boolean) => (
    <>
      {adding && (
        <>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="First name" error={errors.firstName}>
              {p => <Input {...p} value={form.firstName} onChange={e => set('firstName', e.target.value)} />}
            </Field>
            <Field label="Middle name" optional>
              {p => <Input {...p} value={form.middleName} onChange={e => set('middleName', e.target.value)} />}
            </Field>
          </div>
          <Field label="Last name" error={errors.lastName}>
            {p => <Input {...p} value={form.lastName} onChange={e => set('lastName', e.target.value)} />}
          </Field>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Birthdate" error={errors.birthDate}>
              {p => <Input {...p} type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />}
            </Field>
            <Field label="Sex">
              {p => (
                <Select {...p} value={form.gender} onChange={e => set('gender', e.target.value as Resident['gender'])}>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </Select>
              )}
            </Field>
          </div>
        </>
      )}
      <Field label="Civil status">
        {p => (
          <Select {...p} value={form.civilStatus} onChange={e => set('civilStatus', e.target.value as Resident['civilStatus'])}>
            <option>Single</option>
            <option>Married</option>
            <option>Widowed</option>
            <option>Separated</option>
          </Select>
        )}
      </Field>
      <Field label="House number and street" error={errors.address}>
        {p => <Input {...p} value={form.address} onChange={e => set('address', e.target.value)} />}
      </Field>
      <Field label="Purok">
        {p => (
          <Select {...p} value={form.purok} onChange={e => set('purok', e.target.value)}>
            {PUROKS.map(x => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        )}
      </Field>
      {adding && (
        <Field label="Household">
          {p => (
            <Select {...p} value={form.householdId} onChange={e => set('householdId', e.target.value)}>
              <option value="new">New household (this person is the head)</option>
              {households.map(h => (
                <option key={h.id} value={h.id}>
                  {h.householdNumber}, head: {h.headName}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      <div className="grid sm:grid-cols-2 gap-x-4">
        <Field label="Mobile number" optional error={errors.contactNumber}>
          {p => <Input {...p} type="tel" inputMode="numeric" value={form.contactNumber} onChange={e => set('contactNumber', e.target.value)} />}
        </Field>
        <Field label="Email" optional>
          {p => <Input {...p} type="email" value={form.email} onChange={e => set('email', e.target.value)} />}
        </Field>
      </div>
      <Field label="Occupation" optional>
        {p => <Input {...p} value={form.occupation} onChange={e => set('occupation', e.target.value)} />}
      </Field>
      <div className="mt-3">
        <Checkbox label="Person with disability (PWD)" checked={form.isPWD} onChange={e => set('isPWD', e.target.checked)} />
        <Checkbox label="Registered voter" checked={form.isVoter} onChange={e => set('isVoter', e.target.checked)} />
        <Checkbox label="Indigent household" checked={form.isIndigent} onChange={e => set('isIndigent', e.target.checked)} />
      </div>
      {adding && <p className="text-meta text-muted mt-1">Senior citizen status is set from the birthdate (60 and above).</p>}
    </>
  );

  const addView = (
    <Card>
      <h2 className="text-h3 font-semibold text-navy-ink">Add resident</h2>
      <p className="text-meta text-muted">After saving, eKapitan checks if this person might already be listed. Nothing is merged unless you choose to.</p>
      {formFields(true)}
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <Button variant="secondary" onClick={() => setPanel('detail')}>
          Cancel
        </Button>
        <Button onClick={saveAdd}>Save resident</Button>
      </div>
    </Card>
  );

  const editView = (r: Resident) => (
    <Card>
      <h2 className="text-h3 font-semibold text-navy-ink">Edit {fullName(r)}</h2>
      <p className="text-meta text-muted">
        Name, birthdate and sex can't be changed here. To correct those, the resident brings a supporting document to the hall.
      </p>
      {formFields(false)}
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <Button variant="secondary" onClick={() => setPanel('detail')}>
          Cancel
        </Button>
        <Button onClick={() => saveEdit(r)}>Save changes</Button>
      </div>
    </Card>
  );

  const summary = (label: string, r?: Resident) => (
    <div className="rounded-control border border-line p-3 text-meta">
      <p className="text-caption font-semibold uppercase tracking-[0.06em] text-muted">{label}</p>
      {r ? (
        <>
          <p className="font-semibold mt-1">{fullName(r)}</p>
          <p className="text-muted">{r.residentNumber}</p>
          <p className="mt-1">{longDate(r.birthDate)}</p>
          <p>{r.address}</p>
          <p>{r.contactNumber || 'No mobile'}</p>
        </>
      ) : (
        <p className="text-muted mt-1">Record not found.</p>
      )}
    </div>
  );

  const duplicatesView = (
    <Card>
      <h2 className="text-h3 font-semibold text-navy-ink">Same person?</h2>
      <p className="text-meta text-muted">
        These records look alike. Check them against an ID or the paper records, then choose. eKapitan never merges records on its own.
      </p>
      {pendingFlags.length === 0 ? (
        <p className="mt-4">Nothing left to check.</p>
      ) : (
        pendingFlags.map(f => (
          <div key={f.id} className="mt-4 pt-4 border-t border-line-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Possible duplicate</p>
              <StatusPill tone="warning">{likelihood(f.matchScore)}</StatusPill>
            </div>
            {f.matchingFields.length > 0 && (
              <ul className="mt-2 text-meta text-muted list-disc pl-5 space-y-0.5">
                {f.matchingFields.map(m => (
                  <li key={m}>{plainMatch(m)}</li>
                ))}
              </ul>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5 mt-3">
              {summary('Kept if merged', byId(f.matchedResidentId))}
              {summary('Archived if merged', byId(f.sourceResidentId))}
            </div>
            <Field label="How did you check?" error={dupError[f.id]} help='For example: "Same PhilSys ID" or "Asked the resident".'>
              {p => (
                <Textarea
                  {...p}
                  value={dupNotes[f.id] ?? ''}
                  onChange={e => {
                    setDupNotes(n => ({ ...n, [f.id]: e.target.value }));
                    setDupError(x => ({ ...x, [f.id]: '' }));
                  }}
                />
              )}
            </Field>
            <div className="grid gap-2.5 mt-4">
              <Button onClick={() => resolve(f, 'merge')}>Merge: same person</Button>
              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="secondary" size="sm" onClick={() => resolve(f, 'keep_separate')}>
                  Keep both
                </Button>
                <Button variant="secondary" size="sm" onClick={() => resolve(f, 'false_positive')}>
                  Not a match
                </Button>
              </div>
            </div>
            <p className="text-caption text-muted mt-2.5">
              Merge archives the second record; nothing is deleted. Choose Keep both for different people, like relatives.
            </p>
          </div>
        ))
      )}
      <Button variant="secondary" fullWidth className="mt-4" onClick={() => setPanel('detail')}>
        Back to resident
      </Button>
    </Card>
  );

  const activeResidents = residents.filter(r => r.status === 'active');
  const householdTotal = new Set(activeResidents.map(r => r.householdId)).size;

  return (
    <div className="max-w-[1280px]">
      <PageHeader
        title="Residents"
        description={`${activeResidents.length.toLocaleString()} active residents in ${householdTotal.toLocaleString()} households.`}
        action={
          <Button size="sm" onClick={startAdd} icon={<UserPlus className="w-5 h-5" aria-hidden="true" />}>
            Add resident
          </Button>
        }
      />

      {pendingFlags.length > 0 && (
        <div role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-warning-bg bg-warning-bg/60 px-4 py-3">
          <AlertTriangle className="w-6 h-6 text-warning-fg shrink-0" strokeWidth={1.8} aria-hidden="true" />
          <p className="flex-1 min-w-[200px]">
            <b className="font-semibold">
              {pendingFlags.length === 1 ? '1 resident might be' : `${pendingFlags.length} residents might be`} listed twice.
            </b>{' '}
            <span className="text-meta">Check if it's the same person. Nothing is merged until you decide.</span>
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setPanel('duplicates');
              scrollToPanel();
            }}
          >
            Check now
          </Button>
        </div>
      )}

      <Card className="mb-4">
        <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-x-4 -mt-4">
          <Field label="Search">
            {p => (
              <div className="relative">
                <Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <Input
                  {...p}
                  type="search"
                  className="pl-11"
                  placeholder="Name, number, street or purok (e.g. santos purok 2)"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setSelectedId(null);
                  }}
                />
              </div>
            )}
          </Field>
          <Field label="Purok">
            {p => (
              <Select
                {...p}
                value={purok}
                onChange={e => {
                  setPurok(e.target.value);
                  setSelectedId(null);
                }}
              >
                <option value="all">All puroks</option>
                {PUROKS.map(x => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <div className="mt-3 flex flex-col gap-y-1 xl:flex-row xl:items-center xl:justify-between xl:gap-x-4">
          <FilterChips<Group>
            className="min-w-0"
            label="Group"
            value={group}
            onChange={g => {
              setGroup(g);
              setSelectedId(null);
            }}
            chips={(
              [
                ['all', 'Everyone'],
                ['senior', 'Senior citizens'],
                ['pwd', 'PWD'],
                ['indigent', 'Indigent'],
                ['voter', 'Voters'],
                ['head', 'Household heads'],
              ] as [Group, string][]
            ).map(([id, label]) => ({ id, label, count: groupCount(id) }))}
          />
          <Checkbox
            className="shrink-0"
            label="Also show moved out, archived and deceased"
            checked={showInactive}
            onChange={e => {
              setShowInactive(e.target.checked);
              setSelectedId(null);
            }}
          />
        </div>
      </Card>

      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] gap-4 items-start">
        <Card>
          <p className="text-meta text-muted mb-2" aria-live="polite">
            {shown.length.toLocaleString()} {shown.length === 1 ? 'resident' : 'residents'}
            {raw || purok !== 'all' || group !== 'all' ? ' match' : ''}
          </p>
          <DataTable<Resident>
            rows={shown}
            pageSize={25}
            dense
            itemLabel="residents"
            rowKey={r => r.id}
            onRowClick={select}
            isSelected={r => r.id === selected?.id && panel === 'detail'}
            rowLabel={r => `Open ${fullName(r)}`}
            defaultSort={{ header: 'Name', direction: 'asc' }}
            columns={[
              {
                header: 'Name',
                sortValue: r => `${r.lastName} ${r.firstName}`,
                cell: r => (
                  <>
                    <span className="font-semibold">
                      {r.lastName}, {r.firstName}
                    </span>
                    <span className="block text-caption text-muted whitespace-nowrap">{r.residentNumber}</span>
                  </>
                ),
              },
              { header: 'Purok', cell: r => r.purok.split(' - ')[0], className: 'whitespace-nowrap', sortValue: r => r.purok },
              { header: 'Age', cell: r => age(r.birthDate), className: 'tabular-nums', sortValue: r => age(r.birthDate) },
              { header: 'Status', cell: statusPill, sortValue: r => STATUS[r.status].label },
            ]}
            mobile={{
              title: r => `${r.lastName}, ${r.firstName}`,
              status: statusPill,
              meta: r => `${r.purok.split(' - ')[0]} · ${age(r.birthDate)} yrs · ${r.residentNumber}`,
            }}
            empty={
              <div className="py-6 text-center">
                <p className="font-semibold">No residents match.</p>
                <p className="text-meta text-muted mt-1">Try another group or purok, or clear the search.</p>
              </div>
            }
          />
        </Card>
        {/* Stays in view while scrolling a long list (desktop). */}
        <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-[96px] lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto lg:rounded-card">
          {panel === 'add'
            ? <AttentionPanel key="add">{addView}</AttentionPanel>
            : panel === 'duplicates'
              ? duplicatesView
              : selected
                ? panel === 'edit'
                  ? <AttentionPanel key="edit">{editView(selected)}</AttentionPanel>
                  : detailView(selected)
                : (
                  <Card>
                    <h2 className="text-h3 font-semibold text-navy-ink">Resident details</h2>
                    <p className="text-meta text-muted mt-1">Choose a resident from the list to see their record.</p>
                  </Card>
                )}
        </div>
      </div>
    </div>
  );
};
