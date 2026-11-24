import React from 'react';
import { StatusPill } from './StatusPill';

export interface TimeSlotProps {
  label: string;
  available: boolean;
  selected: boolean;
  onSelect: () => void;
  /** Pill text when not available. Defaults to "Booked". */
  unavailableText?: string;
}

/** Full-width slot button with a status pill. See DESIGN.md section 5.11. */
export const TimeSlot: React.FC<TimeSlotProps> = ({ label, available, selected, onSelect, unavailableText = 'Booked' }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    disabled={!available}
    onClick={onSelect}
    className={`flex flex-wrap justify-between items-center gap-x-3 gap-y-1.5 w-full min-h-[52px] px-4 py-3 mb-2.5 rounded-[12px] border-[1.5px] font-semibold text-meta text-left transition-colors
      ${!available ? 'bg-surface-muted text-muted border-line cursor-not-allowed' : selected ? 'border-navy bg-navy-tint text-ink cursor-pointer' : 'border-line bg-surface text-ink hover:border-navy cursor-pointer'}`}
  >
    <span className="flex items-center gap-3 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={`w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 ${selected ? 'border-navy' : 'border-field-line'} ${!available ? 'opacity-40' : ''}`}
      >
        {selected && <span className="w-2.5 h-2.5 rounded-full bg-navy" />}
      </span>
      {label}
    </span>
    {available ? <StatusPill tone="success">Available</StatusPill> : <StatusPill tone="danger">{unavailableText}</StatusPill>}
  </button>
);
