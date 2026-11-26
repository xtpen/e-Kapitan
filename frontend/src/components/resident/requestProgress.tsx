import React from 'react';
import { ClipboardList, FileText, Printer, TriangleAlert, CircleDot, CalendarDays } from 'lucide-react';
import type { Appointment, CourtReservation, DocumentRequest, IncidentReport, PrintRequest, RequestStatus } from '../../types';
import { parseDateTime, type Tone } from '../ui';
import type { ActivityKind, ActivityRow } from './useResidentActivity';
import { translate, useT } from '../../i18n';

type Lang = 'en' | 'fil';

/*
 * Shared by Home, Requests and Notifications: office facts, "how far along is it" in plain
 * words, and the small progress bar. Wording follows docs/RESIDENT_UX_BRIEF.md (pick up, not claim).
 */

/** Where and when residents pick things up. */
export const CLAIM_HOURS = 'Weekdays, 1:00 PM to 4:00 PM';
export const CLAIM_PLACE = 'Barangay hall';
/** Same hours, for use mid-sentence. */
export const CLAIM_HOURS_INLINE = 'weekdays, 1:00 PM to 4:00 PM';

export interface RequestProgress {
  step: number;
  total: number;
  /** One short, plain sentence: what is happening or what to do next. */
  next: string;
  tone: Tone;
}

export interface ProgressSources {
  documentRequests: DocumentRequest[];
  incidents: IncidentReport[];
  printRequests: PrintRequest[];
  courtReservations: CourtReservation[];
  appointments: Appointment[];
}

const locale = (lang: Lang) => (lang === 'fil' ? 'fil-PH' : 'en-US');

const longDate = (iso: string, lang: Lang = 'en') =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(locale(lang), { weekday: 'long', month: 'long', day: 'numeric' });

/** How far along a request is, and what happens next, for every kind of request. */
export const requestProgress = (r: ActivityRow, src: ProgressSources, lang: Lang = 'en'): RequestProgress | null => {
  const tr = (text: string, vars?: Record<string, string | number>) => translate(lang, text, vars);
  if (r.kind === 'document') {
    const d = src.documentRequests.find(x => x.id === r.id);
    if (!d) return null;
    const map: Record<RequestStatus, Omit<RequestProgress, 'total'>> = {
      submitted: { step: 1, tone: 'warning', next: tr('Sent. Waiting for the barangay to check it.') },
      under_review: { step: 2, tone: 'info', next: tr('The barangay is checking your details.') },
      approved: { step: 3, tone: 'success', next: tr('Approved. They are preparing it now.') },
      ready_for_release: {
        step: 4,
        tone: 'success',
        next: d.appointmentDate
          ? tr('Ready! Pick it up on {date}, 1 to 4 PM.', { date: longDate(d.appointmentDate, lang) })
          : tr('Ready! Pick it up at the barangay hall. Bring a valid ID.'),
      },
      completed: { step: 5, tone: 'success', next: tr('Picked up. All done.') },
      returned: { step: 2, tone: 'warning', next: tr('Needs a fix from you. Open it to see what to change.') },
      rejected: { step: 5, tone: 'danger', next: tr('Not approved. Open it to see why.') },
    };
    return { ...map[d.status], total: 5 };
  }
  if (r.kind === 'report') {
    const i = src.incidents.find(x => x.id === r.id);
    if (!i) return null;
    const map: Record<IncidentReport['status'], Omit<RequestProgress, 'total'>> = {
      received: { step: 1, tone: 'warning', next: tr('Sent. The barangay will look at it soon.') },
      assigned: { step: 2, tone: 'info', next: tr('Someone from the barangay is on it.') },
      in_progress: { step: 3, tone: 'info', next: tr('The barangay is working on it.') },
      hearing_scheduled: { step: 3, tone: 'info', next: tr('A meeting has been set. Watch for a notice.') },
      resolved: { step: 4, tone: 'success', next: tr('Fixed. All done.') },
      dismissed: { step: 4, tone: 'danger', next: tr('Closed by the barangay.') },
    };
    return { ...map[i.status], total: 4 };
  }
  if (r.kind === 'printing') {
    const p = src.printRequests.find(x => x.id === r.id);
    if (!p) return null;
    const map: Record<PrintRequest['status'], Omit<RequestProgress, 'total'>> = {
      pending: { step: 1, tone: 'warning', next: tr('Sent. Waiting for the barangay to accept it.') },
      processing: { step: 2, tone: 'info', next: tr('Printing now.') },
      ready_for_pickup: { step: 3, tone: 'success', next: tr('Ready! Pick it up at the barangay hall.') },
      completed: { step: 4, tone: 'success', next: tr('Picked up. All done.') },
      rejected: { step: 4, tone: 'danger', next: tr('Not accepted. Open it to see why.') },
    };
    return { ...map[p.status], total: 4 };
  }
  if (r.kind === 'court') {
    const c = src.courtReservations.find(x => x.id === r.id);
    if (!c) return null;
    const map: Record<CourtReservation['status'], Omit<RequestProgress, 'total'>> = {
      pending: { step: 1, tone: 'warning', next: tr('Sent. Waiting for the barangay to say yes.') },
      approved: { step: 2, tone: 'success', next: tr('Booked for {date}.', { date: longDate(c.date, lang) }) },
      completed: { step: 3, tone: 'success', next: tr('Done. Thanks for using the court.') },
      declined: { step: 3, tone: 'danger', next: tr('Not approved. Open it to see why.') },
      cancelled: { step: 3, tone: 'danger', next: tr('Cancelled.') },
    };
    return { ...map[c.status], total: 3 };
  }
  const a = src.appointments.find(x => x.id === r.id);
  if (!a) return null;
  const map: Record<Appointment['status'], Omit<RequestProgress, 'total'>> = {
    rescheduled: { step: 1, tone: 'warning', next: tr('Waiting for the barangay to confirm the new time.') },
    confirmed: { step: 2, tone: 'success', next: tr('See you on {date}, {time}.', { date: longDate(a.date, lang), time: a.timeSlot }) },
    completed: { step: 3, tone: 'success', next: tr('Done.') },
    cancelled: { step: 3, tone: 'danger', next: tr('Cancelled.') },
  };
  return { ...map[a.status], total: 3 };
};

const BAR_TONE: Record<Tone, string> = {
  success: 'bg-primary',
  info: 'bg-info-fg',
  warning: 'bg-warning-fg',
  danger: 'bg-danger-fg',
  neutral: 'bg-neutral-fg',
};

/** Thin progress bar with "Step 2 of 5". The words carry the meaning; the bar is decoration. */
export const ProgressBar: React.FC<{ progress: RequestProgress; className?: string }> = ({ progress, className = '' }) => {
  const t = useT();
  return (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <span aria-hidden="true" className="h-1.5 flex-1 min-w-12 rounded-full bg-line overflow-hidden">
      <span
        className={`block h-full rounded-full ${BAR_TONE[progress.tone]} transition-[width] duration-500 ease-out-strong`}
        style={{ width: `${Math.round((progress.step / progress.total) * 100)}%` }}
      />
    </span>
    <span className="text-caption text-muted whitespace-nowrap tabular-nums">
      {t('Step {step} of {total}', { step: progress.step, total: progress.total })}
    </span>
  </div>
  );
};

/** "Just now", "3h", "Yesterday", "Nov 24": how feeds show time. Falls back to the raw text. */
export const timeAgo = (value: string, now = Date.now(), lang: Lang = 'en') => {
  const d = parseDateTime(value);
  if (!d) return value;
  const mins = Math.round((now - d.getTime()) / 60000);
  if (mins < 1) return translate(lang, 'Just now');
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days === 1) return translate(lang, 'Yesterday');
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString(locale(lang), { month: 'short', day: 'numeric' });
};

/** Friendly names and icons per kind of request (English; show with kindName() or t(KIND_NAME[kind])). */
export const KIND_NAME: Record<ActivityKind, string> = {
  document: 'Document',
  report: 'Problem report',
  printing: 'Printing',
  court: 'Court booking',
  appointment: 'Hall visit',
};

/** KIND_NAME in the given language. */
export const kindName = (kind: ActivityKind, lang: Lang = 'en') => translate(lang, KIND_NAME[kind]);

const KIND_ICON: Record<ActivityKind, React.ReactNode> = {
  document: <FileText />,
  report: <TriangleAlert />,
  printing: <Printer />,
  court: <CircleDot />,
  appointment: <CalendarDays />,
};

/** Round icon for a kind of request (the "avatar" of a request row). */
export const KindIcon: React.FC<{ kind: ActivityKind; ready?: boolean; size?: 'md' | 'lg' }> = ({ kind, ready, size = 'md' }) => (
  <span
    aria-hidden="true"
    className={`shrink-0 rounded-full grid place-items-center [&_svg]:stroke-[1.8]
      ${size === 'lg' ? 'w-12 h-12 [&_svg]:w-6 [&_svg]:h-6' : 'w-10 h-10 [&_svg]:w-5 [&_svg]:h-5'}
      ${ready ? 'bg-success-bg text-success-fg' : 'bg-navy-tint text-navy-ink'}`}
  >
    {KIND_ICON[kind] ?? <ClipboardList />}
  </span>
);
