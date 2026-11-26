import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { CourtReservation } from '../../types';
import { Button, Calendar, Field, Input, StatusPill, courtStatus, toISODate, type DayState } from '../ui';
import { Choice, EmptyState, FormActions, IconCircle, List, ListRow, Page, PageTitle, Section } from './kit';

/** How far ahead residents can book. Placeholder; the barangay decides. */
const BOOKING_WINDOW_DAYS = 60;

const parseISO = (iso: string) => new Date(`${iso}T00:00:00`);
const longDate = (iso: string) => parseISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const shortDate = (iso: string) => parseISO(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const slotStartHour = (slotId: string) => Number(slotId.split('-')[0]);
const isPhone = () => window.matchMedia('(max-width: 1023px)').matches;
const scrollToSection = (headingId: string) =>
  requestAnimationFrame(() => document.getElementById(headingId)?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

/** Resident · Book the court. Pick a day, pick a time, say what it's for, send. */
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

  const upcoming = mine
    .filter(r => r.date >= today && (r.status === 'pending' || r.status === 'approved'))
    .sort((a, b) => (a.date === b.date ? slotStartHour(a.slotId) - slotStartHour(b.slotId) : a.date.localeCompare(b.date)));
  const past = mine.filter(r => !upcoming.includes(r));

  const slotLabel = (id: string) => courtSlots.find(s => s.id === id)?.label ?? id;
  const openSlots = date ? courtSlots.filter(s => slotOpen(date, s.id)).length : 0;

  const selectDate = (iso: string) => {
    setDate(iso);
    setSlotId(null);
    setErrors({});
    setJustSent(null);
    // On phones and tablets the times sit below the calendar: bring them into view.
    if (isPhone()) scrollToSection('court-time-title');
  };

  const showDate = (iso: string) => {
    setMonth(parseISO(iso));
    selectDate(iso);
    if (!isPhone()) scrollToSection('court-day-title');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    const errs: typeof errors = {};
    if (!slotId) errs.slot = 'Pick a time.';
    if (activity.trim().length < 3) errs.activity = 'Tell us what it is for, like basketball practice.';
    setErrors(errs);
    if (Object.keys(errs).length || !slotId) return;
    const created = createCourtReservation({ date, slotId, activity: activity.trim() });
    setJustSent(created);
    setSlotId(null);
    setActivity('');
  };

  const bookingRow = (r: CourtReservation, tappable: boolean) => (
    <ListRow
      key={r.id}
      icon={
        <IconCircle>
          <CalendarDays />
        </IconCircle>
      }
      title={r.activity}
      sub={
        <>
          {shortDate(r.date)}, {slotLabel(r.slotId)}
          {r.status === 'declined' && r.notes && <span className="block break-words">{r.notes}</span>}
        </>
      }
      trailing={<StatusPill tone={courtStatus[r.status].tone}>{courtStatus[r.status].label}</StatusPill>}
      onClick={tappable ? () => showDate(r.date) : undefined}
    />
  );

  return (
    <Page wide>
      <PageTitle title="Book the court" />

      <div className="grid gap-4 items-start lg:grid-cols-2">
        <Section title="Pick a day" id="court-day-title" className="scroll-mt-24">
          <Calendar
            month={month}
            onMonthChange={setMonth}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            dayState={dayState}
            selected={date}
            onSelect={selectDate}
          />
        </Section>

        <Section title={date ? longDate(date) : 'Pick a time'} id="court-time-title" className="scroll-mt-24">
          {!date ? (
            <p className="text-muted">Pick a green day first.</p>
          ) : (
            <form noValidate onSubmit={submit}>
              <div
                role="radiogroup"
                aria-label="Time"
                aria-describedby={errors.slot ? 'court-slot-error' : undefined}
                className="grid sm:grid-cols-2 lg:grid-cols-1 gap-2"
              >
                {courtSlots.map(s => {
                  const open = slotOpen(date, s.id);
                  return (
                    <Choice
                      key={s.id}
                      label={s.label}
                      sub={open ? undefined : isTaken(date, s.id) ? 'Booked' : 'Closed'}
                      disabled={!open}
                      selected={slotId === s.id}
                      onSelect={() => {
                        setSlotId(s.id);
                        setErrors(e => ({ ...e, slot: undefined }));
                      }}
                    />
                  );
                })}
              </div>
              {openSlots === 0 && <p className="text-meta text-muted mt-2">No times left on this day.</p>}
              {errors.slot && (
                <p id="court-slot-error" className="text-meta text-danger-fg mt-2">
                  {errors.slot}
                </p>
              )}

              <Field label="What is it for?" error={errors.activity}>
                {p => <Input {...p} placeholder="Example: Basketball practice" value={activity} onChange={e => setActivity(e.target.value)} />}
              </Field>

              <FormActions>
                <Button type="submit" variant="brand" disabled={openSlots === 0}>
                  Send request
                </Button>
              </FormActions>
            </form>
          )}
        </Section>
      </div>

      {justSent && (
        <Section tone="success">
          <div role="status" className="flex items-center gap-3">
            <IconCircle tone="green">
              <CheckCircle2 />
            </IconCircle>
            <p className="text-ink">
              <b className="font-semibold">Request sent.</b> Tracking number{' '}
              <b className="font-semibold whitespace-nowrap">{justSent.referenceNumber}</b>. We'll tell you when it's approved.
            </p>
          </div>
        </Section>
      )}

      <Section title="My bookings" flush>
        {mine.length === 0 ? (
          <EmptyState icon={<CalendarDays />} title="No bookings yet" />
        ) : (
          <>
            {upcoming.length === 0 ? (
              <p className="px-4 sm:px-5 pb-4 text-meta text-muted">Nothing coming up.</p>
            ) : (
              <List>{upcoming.map(r => bookingRow(r, true))}</List>
            )}
            {past.length > 0 && (
              <details className="border-t border-line-soft">
                <summary className="min-h-12 flex items-center px-4 sm:px-5 cursor-pointer font-semibold text-meta text-navy-ink">
                  Past bookings ({past.length})
                </summary>
                <List className="border-t border-line-soft">{past.map(r => bookingRow(r, false))}</List>
              </details>
            )}
          </>
        )}
      </Section>
    </Page>
  );
};
