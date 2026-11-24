import React from 'react';

export interface FilterChip<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export interface FilterChipsProps<T extends string> {
  chips: FilterChip<T>[];
  value: T;
  onChange: (id: T) => void;
  label?: string;
  className?: string;
}

/**
 * Pill-shaped filter buttons with optional counts. Active = navy.
 * Wraps on tablet/desktop, swipes sideways on phones.
 */
export function FilterChips<T extends string>({ chips, value, onChange, label = 'Show', className = '' }: FilterChipsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex gap-2 -mx-1 px-1 pb-1 overflow-x-auto [scrollbar-width:none] sm:flex-wrap sm:overflow-visible ${className}`}
    >
      {chips.map(c => {
        const on = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(c.id)}
            className={`shrink-0 inline-flex items-center gap-2 min-h-11 px-4 rounded-full border-[1.5px] font-semibold text-meta cursor-pointer transition-colors
              ${on ? 'bg-navy border-navy text-white' : 'bg-surface border-line text-ink hover:border-navy'}`}
          >
            {c.label}
            {c.count !== undefined && (
              <span className={`min-w-6 px-1.5 rounded-full text-caption ${on ? 'bg-white/20 text-white' : 'bg-surface-muted text-muted'}`}>
                {c.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
