import React from 'react';
import { StatusPill, type Tone } from './StatusPill';

export interface TimelineStage {
  label: string;
  /** Tone once reached. Unreached stages are always neutral. */
  tone: Tone;
  reached: boolean;
  /** Muted text after the pill: a date or who is handling it. */
  detail?: React.ReactNode;
  /** Optional longer note under the row. */
  note?: React.ReactNode;
}

/**
 * Vertical list of stages: a status pill per stage plus muted detail.
 * Reached stages use their tone, unreached are neutral. See DESIGN.md section 5.12.
 */
export const ProgressTimeline: React.FC<{ stages: TimelineStage[]; className?: string }> = ({ stages, className = '' }) => (
  <ol className={`grid gap-3 ${className}`}>
    {stages.map(s => (
      <li key={s.label}>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <StatusPill tone={s.reached ? s.tone : 'neutral'}>{s.label}</StatusPill>
          {s.detail && <span className="text-meta text-muted">{s.detail}</span>}
          <span className="sr-only">{s.reached ? '(reached)' : '(not yet)'}</span>
        </div>
        {s.note && <p className="text-meta text-ink mt-1.5 ml-1.5 pl-3 border-l-2 border-line-soft">{s.note}</p>}
      </li>
    ))}
  </ol>
);
