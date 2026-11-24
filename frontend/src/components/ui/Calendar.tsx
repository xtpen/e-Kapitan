import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export type DayState = 'past' | 'available' | 'booked' | 'closed';

export interface CalendarProps {
  /** Any date inside the month to show. */
  month: Date;
  onMonthChange: (month: Date) => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  /** State for each YYYY-MM-DD in the month. */
  dayState: (iso: string) => DayState;
  selected?: string | null;
  onSelect: (iso: string) => void;
  /** Optional extra content inside a day cell (admin calendar: event chips). */
  renderDayExtra?: (iso: string) => React.ReactNode;
  className?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const toISODate = (d: Date) => {
  const c = new Date(d);
  c.setMinutes(c.getMinutes() - c.getTimezoneOffset());
  return c.toISOString().slice(0, 10);
};

const stateClass: Record<DayState, string> = {
  past: 'bg-neutral-bg text-neutral-fg border-line',
  available: 'bg-success-bg text-success-fg border-success-bg hover:border-success-fg cursor-pointer',
  booked: 'bg-danger-bg text-danger-fg border-danger-bg',
  closed: 'bg-danger-bg text-danger-fg border-danger-bg',
};

const stateWord: Record<DayState, string> = {
  past: 'not available',
  available: 'available',
  booked: 'fully booked',
  closed: 'closed',
};

/** Month calendar with day states and a legend. See DESIGN.md section 5.10. */
export const Calendar: React.FC<CalendarProps> = ({
  month,
  onMonthChange,
  canGoPrev = true,
  canGoNext = true,
  dayState,
  selected,
  onSelect,
  renderDayExtra,
  className = '',
}) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const title = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shift = (n: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-h3 font-semibold text-navy" aria-live="polite">
          {title}
        </h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => shift(-1)} disabled={!canGoPrev} aria-label="Previous month" className="px-3 sm:px-[18px]">
            <ChevronLeft className="w-5 h-5 sm:hidden" aria-hidden="true" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => shift(1)} disabled={!canGoNext} aria-label="Next month" className="px-3 sm:px-[18px]">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5 sm:hidden" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
        <div className="contents">
          {WEEKDAYS.map(d => (
            <div key={d} aria-hidden="true" className="text-caption sm:text-meta font-semibold text-muted py-1">
              <span className="sm:hidden" aria-hidden="true">{d.slice(0, 2)}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>
        <div className="contents">
          {Array.from({ length: first.getDay() }, (_, i) => (
            <div key={`blank-${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
            const iso = toISODate(date);
            const state = dayState(iso);
            const isSelected = selected === iso;
            const selectable = state === 'available';
            const label = `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${stateWord[state]}`;
            return (
              <div key={iso}>
                <button
                  type="button"
                  disabled={!selectable}
                  onClick={() => onSelect(iso)}
                  aria-label={label}
                  aria-pressed={isSelected}
                  className={`w-full ${renderDayExtra ? 'min-h-[92px] text-left p-2 block' : 'h-11 sm:h-[52px] grid place-items-center'}
                    rounded-control border font-semibold transition-colors disabled:cursor-not-allowed
                    ${isSelected ? 'bg-navy text-white border-navy outline-3 outline-navy outline-offset-1' : stateClass[state]}`}
                >
                  {i + 1}
                  {renderDayExtra?.(iso)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-meta" aria-label="Legend">
        {[
          ['bg-success-bg border-success-fg/30', 'Available'],
          ['bg-danger-bg border-danger-fg/30', 'Booked or closed'],
          ['bg-navy border-navy', 'Selected'],
          ['bg-neutral-bg border-line', 'Past'],
        ].map(([cls, text]) => (
          <li key={text} className="flex items-center gap-2">
            <span aria-hidden="true" className={`w-4 h-4 rounded border ${cls}`} />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
};
