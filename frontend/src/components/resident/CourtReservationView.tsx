import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { CourtReservation } from '../../types';
import {
  Button,
  Calendar,
  Card,
  CardHeader,
  DataTable,
  Field,
  Input,
  PageHeader,
  StatusPill,
  TimeSlot,
  courtStatus,
  toISODate,
  type DayState,
} from '../ui';

/** How far ahead residents can book. Placeholder; the barangay decides. */
const BOOKING_WINDOW_DAYS = 60;

const parseISO = (iso: string) => new Date(`${iso}T00:00:00`);
const longDate = (iso: string) => parseISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const shortDate = (iso: string) => parseISO(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const slotStartHour = (slotId: string) => Number(slotId.split('-')[0]);

/** Resident · Court Reservation. Mockup: "Resident · Court reservation" (desktop + mobile). See DESIGN.md. */
export const CourtReservationView: React.FC = () => {
  const { courtSlots, courtReservations, courtClosures, createCourtReservation, currentUser } = useBarangay();

  const today = toISODate(new Date());
  const lastDay = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + BOOKING_WINDOW_DAYS);
    return toISODate(d);
  }, []);

  const active = courtReservations.filter(r => r.status === 'pending' || r.status === 'approved');
  const isTaken = (date: string, slotId: string) => active.some(r => r.date === date && r.slotId === slotId);
  const closure = (date: string) => courtClosures.find(c => c.date === date);
  const slotOpen = (date: string, slotId: string) => {
    if (isTaken(date, slotId)) return false;
    if (date === today && new Date().getHours() >= slotStartHour(slotId)) return false;
    return true;
  };

  const dayState = (iso: string): DayState => {
    if (iso < today || iso > lastDay) return 'past';
    if (closure(iso)) return 'closed';
    return courtSlots.some(s => slotOpen(iso, s.id)) ? 'available' : 'booked';
  };

  const firstAvailable = useMemo(() => {
    const d = new Date();
    for (let i = 0; i <= BOOKING_WINDOW_DAYS; i++) {
      const iso = toISODate(d);
      if (dayState(iso) === 'available') return iso;
      d.setDate(d.getDate() + 1);
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [month, setMonthRaw] = useState(() => {
    const d = firstAvailable ? parseISO(firstAvailable) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const setMonth = (d: Date) => setMonthRaw(new Date(d.getFullYear(), d.getMonth(), 1));
  const [date, setDate] = useState<string | null>(firstAvailable);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [activity, setActivity] = useState('');
  const [errors, setErrors] = useState<{ slot?: string; activity?: string }>({});
  const [justSent, setJustSent] = useState<CourtReservation | null>(null);

  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const canGoPrev = month > thisMonth;
  const canGoNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= parseISO(lastDay);

  const mine = courtReservations
    .filter(r => (!!currentUser.residentId && r.residentId === currentUser.residentId) || r.residentName === currentUser.name)
    .sort((a, b) => (a.date === b.date ? slotStartHour(b.slotId) - slotStartHour(a.slotId) : b.date.localeCompare(a.date)));

  const slotLabel = (id: string) => courtSlots.find(s => s.id === id)?.label ?? id;

  const slotsRef = useRef<HTMLDivElement>(null);

  const selectDate = (iso: string) => {
    setDate(iso);
    setSlotId(null);
    setErrors({});
    setJustSent(null);
    // On phones and tablets the slots sit below the calendar: bring them into view.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => slotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    const errs: typeof errors = {};
    if (!slotId) errs.slot = 'Choose a time slot.';
    if (activity.trim().length < 3) errs.activity = 'Tell us what the court is for, e.g. basketball practice.';
    setErrors(errs);
    if (Object.keys(errs).length || !slotId) return;
    const created = createCourtReservation({ date, slotId, activity: activity.trim() });
    setJustSent(created);
    setSlotId(null);
    setActivity('');
  };

  const pill = (r: CourtReservation) => <StatusPill tone={courtStatus[r.status].tone}>{courtStatus[r.status].label}</StatusPill>;

  return (
    <div className="max-w-[1200px]">
      <PageHeader title="Court Reservation" description="Pick a date, choose a time slot, then submit your request." />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <Card>
          <Calendar
            month={month}
            onMonthChange={setMonth}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            dayState={dayState}
            selected={date}
            onSelect={selectDate}
          />
        </Card>

        <div ref={slotsRef} className="scroll-mt-24">
        <Card>
          {!date ? (
            <>
              <h3 className="text-h3 font-semibold text-navy">Choose a date</h3>
              <p className="text-meta text-muted mt-1">Pick a green day on the calendar to see its time slots.</p>
            </>
          ) : (
            <form noValidate onSubmit={submit}>
              <h3 className="text-h3 font-semibold text-navy" aria-live="polite">
                {longDate(date)}
              </h3>

              {justSent && justSent.date === date && (
                <div role="status" className="mt-3 flex gap-3 rounded-control bg-success-bg text-success-fg px-4 py-3">
                  <CheckCircle2 className="w-6 h-6 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                  <p>
                    <b className="font-semibold">Request sent.</b> Reference{' '}
                    <b className="font-semibold whitespace-nowrap">{justSent.referenceNumber}</b> for{' '}
                    {slotLabel(justSent.slotId)}. We will notify you once the barangay approves it.
                  </p>
                </div>
              )}

              <p id="slot-help" className="text-meta text-muted mt-1 mb-3.5">
                Choose a time slot
              </p>
              <div role="radiogroup" aria-labelledby="slot-help" aria-describedby={errors.slot ? 'slot-error' : undefined}>
                {courtSlots.map(s => {
                  const open = slotOpen(date, s.id);
                  return (
                    <TimeSlot
                      key={s.id}
                      label={s.label}
                      available={open}
                      unavailableText={isTaken(date, s.id) ? 'Booked' : 'Not available'}
                      selected={slotId === s.id}
                      onSelect={() => {
                        setSlotId(s.id);
                        setErrors(e => ({ ...e, slot: undefined }));
                      }}
                    />
                  );
                })}
              </div>
              {errors.slot && (
                <p id="slot-error" className="text-meta text-danger-fg">
                  {errors.slot}
                </p>
              )}

              <Field label="Activity or event" error={errors.activity}>
                {p => (
                  <Input
                    {...p}
                    placeholder="Example: Basketball practice"
                    value={activity}
                    onChange={e => setActivity(e.target.value)}
                  />
                )}
              </Field>
              <Button type="submit" fullWidth className="mt-5">
                Submit request
              </Button>
              <p className="text-meta text-muted mt-2.5">You will be notified once the barangay approves it.</p>
            </form>
          )}
        </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader title="My reservation history" />
        <DataTable<CourtReservation>
          rows={mine}
          rowKey={r => r.id}
          columns={[
            { header: 'Reference', cell: r => r.referenceNumber, className: 'whitespace-nowrap' },
            {
              header: 'Date and time',
              cell: r => `${shortDate(r.date)}, ${slotLabel(r.slotId).split(' to ')[0]}`,
              className: 'whitespace-nowrap',
            },
            { header: 'Activity', cell: r => r.activity },
            { header: 'Status', cell: pill },
          ]}
          mobile={{
            title: r => `${shortDate(r.date)}, ${slotLabel(r.slotId).split(' to ')[0]}`,
            status: pill,
            meta: r => `${r.activity} · ${r.referenceNumber}`,
          }}
          empty={<p className="text-meta text-muted py-2">You have no reservations yet.</p>}
        />
      </Card>
    </div>
  );
};
