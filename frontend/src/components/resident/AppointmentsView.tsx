import React, { useMemo, useState } from 'react';
import { CalendarDays, Check, CheckCircle2, ChevronDown, FileText, Handshake } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { Appointment } from '../../types';
import { Button, Calendar, StatusPill, appointmentStatus, formatPeso, toISODate, todayISO, type DayState } from '../ui';
import { Choice, EmptyState, FormActions, IconCircle, List, ListRow, Page, PageTitle, Section } from './kit';

/** Visit windows at the hall. */
const TIME_SLOTS = [
  '08:30 AM - 09:30 AM',
  '09:30 AM - 10:30 AM',
  '10:30 AM - 11:30 AM',
  '01:30 PM - 02:30 PM',
  '02:30 PM - 03:30 PM',
  '03:30 PM - 04:30 PM',
];

/** How far ahead residents can book a visit. */
const BOOKING_WINDOW_DAYS = 60;

/** Visits that are not about a document. The value is what staff see; the label is what residents read. */
const OTHER_SERVICES: { value: string; label: string }[] = [{ value: 'Lupon / Barangay mediation desk', label: 'Settle a dispute' }];

const parseISO = (iso: string) => new Date(`${iso}T00:00:00`);
const longDate = (iso: string) => parseISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const shortDate = (iso: string) => parseISO(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
/** The hall is open on weekdays only. */
const isWeekend = (iso: string) => {
  const day = parseISO(iso).getDay();
  return day === 0 || day === 6;
};

/** 24-hour start of "09:30 AM - 10:30 AM". */
const slotStartHour = (slot: string) => {
  const m = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  return (Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0) + Number(m[2]) / 60;
};
/** "09:30 AM - 10:30 AM" → "9:30 to 10:30 AM"; "11:30 AM - 12:30 PM" keeps both periods. */
const slotLabel = (slot: string) => {
  const [from, to] = slot.split(' - ').map(t => t.replace(/^0/, ''));
  if (!to) return slot;
  const [fromTime, fromPeriod] = from.split(' ');
  return to.endsWith(fromPeriod) ? `${fromTime} to ${to}` : `${from} to ${to}`;
};

type Errors = Partial<Record<'date' | 'slot', string>>;

/** Resident · Visit the hall: pick what you need, a day and a time. */
export const AppointmentsView: React.FC = () => {
  const { currentUser, residents, services, appointments, bookAppointment, setActiveTab } = useBarangay();
  const resident = residents.find(r => r.id === currentUser.residentId);

  const options = [...services.map(s => ({ value: s.title, label: s.title })), ...OTHER_SERVICES];
  const [service, setService] = useState<string>(options[0]?.value ?? '');
  const chosen = services.find(s => s.title === service);

  const today = todayISO();
  const lastDay = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + BOOKING_WINDOW_DAYS);
    return toISODate(d);
  }, []);

  const isTaken = (d: string, slot: string) =>
    appointments.some(a => a.date === d && a.timeSlot === slot && a.status !== 'cancelled' && a.status !== 'completed');
  const slotOpen = (d: string | null, slot: string) => {
    if (!d || d < today || isWeekend(d)) return false;
    if (isTaken(d, slot)) return false;
    if (d === today) {
      const now = new Date();
      if (now.getHours() + now.getMinutes() / 60 >= slotStartHour(slot)) return false;
    }
    return true;
  };
  const dayState = (iso: string): DayState => {
    if (iso < today || iso > lastDay) return 'past';
    if (isWeekend(iso)) return 'closed';
    return TIME_SLOTS.some(s => slotOpen(iso, s)) ? 'available' : 'booked';
  };

  /** Tomorrow if it has room, otherwise the first weekday that does. */
  const firstDay = useMemo(() => {
    const d = parseISO(today);
    for (let i = 1; i <= BOOKING_WINDOW_DAYS; i++) {
      d.setDate(d.getDate() + 1);
      const iso = toISODate(d);
      if (dayState(iso) === 'available') return iso;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [date, setDate] = useState<string | null>(firstDay);
  const [month, setMonthRaw] = useState(() => {
    const d = firstDay ? parseISO(firstDay) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const setMonth = (d: Date) => setMonthRaw(new Date(d.getFullYear(), d.getMonth(), 1));
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const canGoPrev = month > thisMonth;
  const canGoNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= parseISO(lastDay);

  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [justBooked, setJustBooked] = useState<Appointment | null>(null);

  const mine = appointments
    .filter(a => (!!currentUser.residentId && a.residentId === currentUser.residentId) || a.residentName === currentUser.name)
    .sort((a, b) => (a.date === b.date ? slotStartHour(a.timeSlot) - slotStartHour(b.timeSlot) : a.date.localeCompare(b.date)));
  const upcoming = mine.filter(a => a.date >= today && (a.status === 'confirmed' || a.status === 'rescheduled'));
  const past = mine.filter(a => !upcoming.includes(a)).reverse();

  const pickDate = (value: string) => {
    setDate(value);
    setTimeSlot(null);
    setErrors({});
    setJustBooked(null);
    // On phones the times sit below the calendar: bring them into view.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() =>
        document.getElementById('visit-time-title')?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (!date) errs.date = 'Pick a day.';
    else if (date < today) errs.date = 'Pick today or a later day.';
    else if (isWeekend(date)) errs.date = 'The hall is open Monday to Friday. Pick a weekday.';
    if (!timeSlot) errs.slot = 'Pick a time.';
    else if (date && !slotOpen(date, timeSlot)) errs.slot = 'That time was just taken. Pick another one.';
    setErrors(errs);
    if (Object.keys(errs).length || !timeSlot || !date) return;

    const created = bookAppointment({
      residentName: currentUser.name,
      residentId: currentUser.residentId ?? currentUser.id,
      contactNumber: resident?.contactNumber ?? '',
      serviceTitle: service,
      date,
      timeSlot,
      status: 'confirmed',
    });
    setJustBooked(created);
    setTimeSlot(null);
  };

  const labelFor = (value: string) => options.find(o => o.value === value)?.label ?? value;
  const openCount = date ? TIME_SLOTS.filter(s => slotOpen(date, s)).length : 0;

  const visitRow = (a: Appointment) => (
    <ListRow
      key={a.id}
      icon={
        <IconCircle>
          <CalendarDays />
        </IconCircle>
      }
      title={labelFor(a.serviceTitle)}
      sub={`${shortDate(a.date)}, ${slotLabel(a.timeSlot)}`}
      trailing={<StatusPill tone={appointmentStatus[a.status].tone}>{appointmentStatus[a.status].label}</StatusPill>}
    />
  );

  return (
    <Page>
      <PageTitle title="Visit the hall" sub="Book a time so you don't wait in line." />

      <Section title="What do you need?" id="visit-need-title">
        <div role="radiogroup" aria-labelledby="visit-need-title" className="grid gap-2">
          {options.map(o => {
            const Icon = services.some(s => s.title === o.value) ? FileText : Handshake;
            return <Choice key={o.value} selected={service === o.value} onSelect={() => setService(o.value)} label={o.label} icon={<Icon />} />;
          })}
        </div>

        <details className="group mt-3">
          <summary className="min-h-11 inline-flex items-center gap-1.5 cursor-pointer font-semibold text-meta text-navy-ink list-none [&::-webkit-details-marker]:hidden">
            What to bring
            <ChevronDown aria-hidden="true" className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="pt-1 text-meta text-ink grid gap-1.5">
            <ul className="grid gap-1.5">
              {(chosen ? chosen.requirements : ['A valid ID', 'Any papers about your concern']).map(req => (
                <li key={req} className="flex gap-2.5">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-success-fg" strokeWidth={2.2} aria-hidden="true" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
            {chosen && (
              <p className="text-muted">
                Fee: <b className="font-semibold text-ink">{chosen.fee > 0 ? `${formatPeso(chosen.fee)}, paid at the hall` : 'Free'}</b>
              </p>
            )}
            {chosen?.availableOnline && (
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className="justify-self-start min-h-11 font-semibold text-navy-ink hover:underline underline-offset-4 cursor-pointer"
              >
                Or request it online
              </button>
            )}
          </div>
        </details>
      </Section>

      <Section title="Pick a day">
        <Calendar
          month={month}
          onMonthChange={setMonth}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          dayState={dayState}
          selected={date}
          onSelect={pickDate}
        />
        {errors.date && <p className="text-meta text-danger-fg mt-2">{errors.date}</p>}
      </Section>

      <Section title={date ? longDate(date) : 'Pick a time'} id="visit-time-title" className="scroll-mt-24">
        <form noValidate onSubmit={submit}>
          {!date ? (
            <p className="text-muted">Pick a green day first.</p>
          ) : (
            <div
              role="radiogroup"
              aria-label="Time"
              aria-describedby={errors.slot ? 'visit-slot-error' : undefined}
              className="grid grid-cols-2 gap-2"
            >
              {TIME_SLOTS.map(s => {
                const open = slotOpen(date, s);
                return (
                  <Choice
                    key={s}
                    label={slotLabel(s)}
                    sub={open ? undefined : isTaken(date, s) ? 'Booked' : 'Closed'}
                    disabled={!open}
                    selected={timeSlot === s}
                    onSelect={() => {
                      setTimeSlot(s);
                      setErrors(e => ({ ...e, slot: undefined }));
                    }}
                  />
                );
              })}
            </div>
          )}
          {date && openCount === 0 && <p className="text-meta text-muted mt-2">No times left on this day.</p>}
          {errors.slot && (
            <p id="visit-slot-error" className="text-meta text-danger-fg mt-2">
              {errors.slot}
            </p>
          )}

          <FormActions>
            <Button type="submit" variant="brand" disabled={!date || openCount === 0}>
              Book my visit
            </Button>
          </FormActions>
        </form>
      </Section>

      {justBooked && (
        <Section tone="success">
          <div role="status" className="flex items-center gap-3">
            <IconCircle tone="green">
              <CheckCircle2 />
            </IconCircle>
            <p className="text-ink">
              <b className="font-semibold">You're booked.</b> {longDate(justBooked.date)}, {slotLabel(justBooked.timeSlot)}. Show tracking
              number <b className="font-semibold whitespace-nowrap">{justBooked.referenceNumber}</b> at the hall.
            </p>
          </div>
        </Section>
      )}

      <Section title="My visits" flush>
        {upcoming.length === 0 ? (
          <EmptyState icon={<CalendarDays />} title="Nothing booked yet" />
        ) : (
          <List>{upcoming.map(visitRow)}</List>
        )}
        {past.length > 0 && (
          <details className="border-t border-line-soft">
            <summary className="min-h-12 flex items-center px-4 sm:px-5 cursor-pointer font-semibold text-meta text-navy-ink">
              Past visits ({past.length})
            </summary>
            <List className="border-t border-line-soft">{past.map(visitRow)}</List>
          </details>
        )}
      </Section>
    </Page>
  );
};
