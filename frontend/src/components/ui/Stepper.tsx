import React from 'react';
import { Check } from 'lucide-react';

export interface StepperProps {
  steps: string[];
  /** 0-based index of the current step. */
  current: number;
  className?: string;
}

/**
 * Multi-step progress. See DESIGN.md section 5.9.
 * Done = green, current = navy, upcoming = line color. On phones it adds a
 * "Step 2 of 3: Your details" line and hides the connector rules.
 */
export const Stepper: React.FC<StepperProps> = ({ steps, current, className = '' }) => (
  <div className={className}>
    <p className="sm:hidden text-meta text-muted mb-2">
      Step {current + 1} of {steps.length}: {steps[current]}
    </p>
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="Progress">
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'upcoming';
        return (
          <li key={label} className="flex items-center gap-3" aria-current={state === 'current' ? 'step' : undefined}>
            {i > 0 && <span aria-hidden="true" className="hidden sm:block w-12 border-t-2 border-line" />}
            <span
              aria-hidden="true"
              className={`w-[34px] h-[34px] rounded-full grid place-items-center text-sm font-semibold shrink-0
                ${state === 'done' ? 'bg-primary text-white' : state === 'current' ? 'bg-navy text-white' : 'bg-line text-ink'}`}
            >
              {state === 'done' ? <Check className="w-4 h-4" strokeWidth={2.5} /> : i + 1}
            </span>
            <span className={`font-semibold ${state === 'upcoming' ? 'text-muted' : 'text-ink'} hidden sm:inline`}>
              {label}
              <span className="sr-only">{state === 'done' ? ' (done)' : state === 'current' ? ' (current step)' : ''}</span>
            </span>
          </li>
        );
      })}
    </ol>
  </div>
);
