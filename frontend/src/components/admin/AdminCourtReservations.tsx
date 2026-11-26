import React, { useEffect, useRef, useState } from 'react';
import { CalendarX2 } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { CourtReservation } from '../../types';
import {
  Button,
  Calendar,
  Card,
  CardHeader,
  Field,
  StatusPill,
  Textarea,
  courtStatus,
  dateTimeValue,
  formatShortDateTime,
  toISODate,
  type DayState,
} from '../ui';

const parseISO = (iso: string) => new Date(`${iso}T00:00:00`);
const shortDay = (iso: string) => parseISO(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const longDay = (iso: string) => parseISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const startHour = (slotId: string) => Number(slotId.split('-')[0]);

/** Live window width check, so the calendar can drop its event chips on phones. */
const useIsWide = () => {
  const query = '(min-width: 768px)';
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
};

/** Admin · Court Reservations. Mockups: "Admin · Court calendar" (desktop) and "Mobile Admin Court Approvals". */
export const AdminCourtReservations: React.FC = () => {
  const { courtReservations, courtSlots, courtClosures, updateCourtReservationStatus, closeCourtDate, reopenCourtDate } = useBarangay();
  const wide = useIsWide();
  const today = toISODate(new Date());

  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [day, setDay] = useState(today);
  const [declining, setDeclining] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [closing, setClosing] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [closeError, setCloseError] = useState<string | undefined>();
  const dayRef = useRef<HTMLDivElement>(null);

  const active = (r: CourtReservation) => r.status === 'pending' || r.status === 'approved';
  const onDay = (iso: string) =>
    courtReservations.filter(r => r.date === iso && active(r)).sort((a, b) => startHour(a.slotId) - startHour(b.slotId));
  const closure = (iso: string) => courtClosures.find(c => c.date === iso);
  const slotShort = (id: string) => courtSlots.find(s => s.id === id)?.short ?? id;
  const slotLabel = (id: string) => courtSlots.find(s => s.id === id)?.label ?? id;

  // First come, first served: the earliest request is reviewed first.
  const pending = courtReservations
    .filter(r => r.status === 'pending' && r.date >= today)
    .sort((a, b) => dateTimeValue(a.submittedAt) - dateTimeValue(b.submittedAt));

  const dayState = (iso: string): DayState => (iso < today ? 'past' : closure(iso) ? 'closed' : 'open');

  const maxMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1);

  const pickDay = (iso: string) => {
    setDay(iso);
    setClosing(false);
    setCloseReason('');
    setCloseError(undefined);
    if (!wide) requestAnimationFrame(() => dayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const decline = (r: CourtReservation) => {
    if (reason.trim().length < 5) {
      setReasonError('Tell the resident why, e.g. "The court is reserved for the barangay league."');
      return;
    }
    updateCourtReservationStatus(r.id, 'declined', reason.trim());
    setDeclining(null);
    setReason('');
    setReasonError(undefined);
  };

  const confirmClose = () => {
    if (closeReason.trim().length < 3) {
      setCloseError('Give a reason residents will see, e.g. "Barangay event".');
      return;
    }
    closeCourtDate(day, closeReason.trim());
    setClosing(false);
    setCloseReason('');
    setCloseError(undefined);
  };

  /* ---------- Pending requests (mobile mockup: "Court approvals") ---------- */
  const pendingCard = (
    <Card>
      <CardHeader
        title="Pending requests"
        action={<StatusPill tone={pending.length ? 'warning' : 'neutral'}>{pending.length} waiting</StatusPill>}
      />
      {pending.length > 1 && <p className="text-meta text-muted -mt-1 mb-1">First come, first served: oldest request first.</p>}
      {pending.length === 0 ? (
        <p className="text-meta text-muted">No requests waiting. New ones will appear here.</p>
      ) : (
        <ol>
          {pending.map((r, i) => (
            <li key={r.id} className="py-3 border-b border-line-soft last:border-b-0">
              <div className="flex justify-between items-start gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMonth(new Date(parseISO(r.date).getFullYear(), parseISO(r.date).getMonth(), 1));
                    pickDay(r.date);
                  }}
                  className="font-semibold text-left hover:underline underline-offset-4 cursor-pointer"
                >
                  {shortDay(r.date)}, {slotShort(r.slotId)}
                </button>
                <span className="text-caption text-muted whitespace-nowrap pt-0.5">{r.referenceNumber}</span>
              </div>
              <p className="text-meta text-muted">
                {r.activity}, {r.residentName}
              </p>
              <p className="text-caption text-muted mt-0.5">
                <span className="font-semibold text-ink">#{i + 1}</span> · Requested {formatShortDateTime(r.submittedAt)}
              </p>
              {declining === r.id ? (
                <div className="mt-2">
                  <Field label="Reason for declining" error={reasonError}>
                    {p => <Textarea {...p} autoFocus value={reason} onChange={e => setReason(e.target.value)} />}
                  </Field>
                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    <Button variant="secondary" size="sm" onClick={() => setDeclining(null)}>
                      Cancel
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => decline(r)}>
                      Decline
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                  <Button size="sm" onClick={() => updateCourtReservationStatus(r.id, 'approved')}>
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setDeclining(r.id);
                      setReason('');
                      setReasonError(undefined);
                    }}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );

  /* ---------- Selected day ---------- */
  const closed = closure(day);
  const isPast = day < today;
  const bookings = onDay(day);
  const dayCard = (
    <Card aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-h3 font-semibold text-navy-ink">{longDay(day)}</h2>
        {closed ? <StatusPill tone="danger">Closed</StatusPill> : isPast ? <StatusPill tone="neutral">Past</StatusPill> : null}
      </div>
      {closed && <p className="text-meta text-muted mt-0.5">Reason: {closed.reason}</p>}

      <ul className="mt-3">
        {courtSlots.map(s => {
          const b = bookings.find(x => x.slotId === s.id);
          return (
            <li key={s.id} className="flex items-start justify-between gap-3 py-2.5 border-b border-line-soft last:border-b-0">
              <span>
                <span className="block font-semibold">{s.label}</span>
                <span className="block text-meta text-muted">
                  {b ? `${b.activity}, ${b.residentName}` : closed ? 'Closed' : isPast ? 'No booking' : 'Open'}
                </span>
                {b && <span className="block text-caption text-muted">Requested {formatShortDateTime(b.submittedAt)}</span>}
              </span>
              {b && <StatusPill tone={courtStatus[b.status].tone}>{courtStatus[b.status].label}</StatusPill>}
            </li>
          );
        })}
      </ul>

      {!isPast &&
        (closed ? (
          <Button variant="secondary" fullWidth className="mt-4" onClick={() => reopenCourtDate(day)}>
            Reopen this day
          </Button>
        ) : closing ? (
          <div className="mt-4">
            <Field
              label="Why is the court closed?"
              error={closeError}
              help={
                bookings.length
                  ? `${bookings.length} booking${bookings.length === 1 ? '' : 's'} on this day will be cancelled, and the residents will see this reason.`
                  : 'Residents will see this reason.'
              }
            >
              {p => <Textarea {...p} autoFocus value={closeReason} onChange={e => setCloseReason(e.target.value)} />}
            </Field>
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <Button variant="secondary" onClick={() => setClosing(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmClose}>
                Close this day
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            fullWidth
            className="mt-4"
            icon={<CalendarX2 className="w-5 h-5" aria-hidden="true" />}
            onClick={() => setClosing(true)}
          >
            Close this day
          </Button>
        ))}
    </Card>
  );

  const chip = (tone: 'success' | 'warning' | 'danger', text: string, key: string) => {
    const cls = { success: 'bg-success-bg text-success-fg', warning: 'bg-warning-bg text-warning-fg', danger: 'bg-danger-bg text-danger-fg' }[tone];
    return (
      <span key={key} title={text} className={`block mt-1 rounded-md px-1.5 py-0.5 text-[0.75rem] font-semibold leading-tight truncate ${cls}`}>
        {text}
      </span>
    );
  };

  const legend = (
    <p className="flex flex-wrap gap-2 mt-4" aria-label="Legend">
      <StatusPill tone="success">Approved</StatusPill>
      <StatusPill tone="warning">Pending</StatusPill>
      <StatusPill tone="danger">Closed</StatusPill>
    </p>
  );

  return (
    <div className="max-w-[1200px]">
      <div className="md:hidden mb-4">
        <h1 className="text-2xl font-bold text-navy-ink">Court approvals</h1>
        <p className="text-meta text-muted mt-1">
          {pending.length} {pending.length === 1 ? 'request' : 'requests'} waiting
        </p>
      </div>
      <div className="hidden md:block">
        <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
          <div>
            <h1 className="text-h1 leading-tight font-bold text-navy-ink">Court Reservations</h1>
            <p className="text-meta text-muted mt-1">Approve requests and manage the court calendar.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<CalendarX2 className="w-5 h-5" aria-hidden="true" />}
            onClick={() => {
              if (day < today) setDay(today);
              setClosing(true);
              dayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }}
          >
            Close a date
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)] gap-5 items-start">
        {/* On phones the approvals come first (mobile mockup); on desktop the calendar leads. */}
        <div className="order-2 lg:order-1">
          <Card>
            <Calendar
              month={month}
              onMonthChange={setMonth}
              canGoNext={new Date(month.getFullYear(), month.getMonth() + 1, 1) <= maxMonth}
              dayState={dayState}
              selected={day}
              onSelect={pickDay}
              isSelectable={() => true}
              legend={legend}
              renderDayExtra={
                wide
                  ? iso => {
                      const c = closure(iso);
                      if (c) return chip('danger', 'Closed', 'closed');
                      return onDay(iso).map(r =>
                        chip(r.status === 'approved' ? 'success' : 'warning', `${r.activity} ${slotShort(r.slotId)}`, r.id),
                      );
                    }
                  : undefined
              }
            />
          </Card>
        </div>
        <div className="order-1 lg:order-2 grid gap-5">
          {pendingCard}
          <div ref={dayRef} className="scroll-mt-24">
            {dayCard}
          </div>
        </div>
      </div>
    </div>
  );
};
