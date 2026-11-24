import React from 'react';
import type { RequestStatus, IncidentStatus, Appointment, PrintStatus, CourtReservationStatus } from '../../types';

export type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

const tones: Record<Tone, string> = {
  success: 'bg-success-bg text-success-fg',
  info: 'bg-info-bg text-info-fg',
  warning: 'bg-warning-bg text-warning-fg',
  danger: 'bg-danger-bg text-danger-fg',
  neutral: 'bg-neutral-bg text-neutral-fg',
};

export interface StatusPillProps {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}

/** Status pill with a dot. Always has words; never color alone. See DESIGN.md section 5.3. */
export const StatusPill: React.FC<StatusPillProps> = ({ tone, children, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold whitespace-nowrap ${tones[tone]} ${className}`}
  >
    <span aria-hidden="true" className="w-[7px] h-[7px] rounded-full bg-current shrink-0" />
    {children}
  </span>
);

export interface StatusInfo {
  label: string;
  tone: Tone;
}

/* Status vocabulary. Keep these in sync with DESIGN.md section 5.3. */

export const documentStatus: Record<RequestStatus, StatusInfo> = {
  submitted: { label: 'Pending', tone: 'warning' },
  under_review: { label: 'Under review', tone: 'info' },
  approved: { label: 'Approved', tone: 'success' },
  ready_for_release: { label: 'Ready for pickup', tone: 'success' },
  completed: { label: 'Completed', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'danger' },
  returned: { label: 'Returned for correction', tone: 'warning' },
};

export const incidentStatus: Record<IncidentStatus, StatusInfo> = {
  received: { label: 'Received', tone: 'warning' },
  assigned: { label: 'Under review', tone: 'info' },
  in_progress: { label: 'Action taken', tone: 'info' },
  hearing_scheduled: { label: 'Hearing scheduled', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
  dismissed: { label: 'Closed', tone: 'danger' },
};

export const printStatus: Record<PrintStatus, StatusInfo> = {
  pending: { label: 'Pending', tone: 'warning' },
  processing: { label: 'Processing', tone: 'info' },
  ready_for_pickup: { label: 'Ready for pickup', tone: 'success' },
  completed: { label: 'Completed', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

export const courtStatus: Record<CourtReservationStatus, StatusInfo> = {
  pending: { label: 'Pending approval', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  completed: { label: 'Completed', tone: 'neutral' },
};

export const appointmentStatus: Record<Appointment['status'], StatusInfo> = {
  confirmed: { label: 'Approved', tone: 'success' },
  rescheduled: { label: 'Pending', tone: 'warning' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};
