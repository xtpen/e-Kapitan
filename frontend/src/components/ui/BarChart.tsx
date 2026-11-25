import React, { useState } from 'react';

export interface BarDatum {
  label: string;
  value: number;
  /** Optional click (e.g. open that service's list). */
  onSelect?: () => void;
}

export interface BarChartProps {
  data: BarDatum[];
  /** Unit for tooltips and the table, e.g. "requests". */
  unit: string;
  /** Short sentence describing the chart for screen readers. */
  summary: string;
  height?: number;
  /** Horizontal bars suit long category names (reports); vertical suits a few short ones. */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

/**
 * Single-series column chart (DESIGN.md section 5.15). One color (primary), thin columns
 * with a 4px rounded top, value on each cap, category under each column, a hover/focus
 * tooltip, and a visually hidden table so the numbers are never chart-only.
 */
export const BarChart: React.FC<BarChartProps> = ({ data, unit, summary, height = 200, orientation = 'vertical', className = '' }) => {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map(d => d.value));

  if (orientation === 'horizontal') {
    return (
      <div className={className}>
        <ul role="img" aria-label={summary} className="grid gap-2.5">
          {data.map(d => (
            <li key={d.label} className="grid grid-cols-[minmax(0,38%)_minmax(0,1fr)] items-center gap-3" aria-hidden="true">
              <span className="text-meta text-ink leading-tight">{d.label}</span>
              <span className="flex items-center gap-2 min-w-0" title={`${d.label}: ${d.value} ${unit}`}>
                <span
                  className="h-5 rounded-r-[4px] bg-primary shrink-0"
                  style={{ width: `calc(${(d.value / max) * 100}% - 2.5rem)`, minWidth: d.value > 0 ? 4 : 0 }}
                />
                <span className="text-meta font-semibold text-ink tabular-nums">{d.value.toLocaleString()}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="sr-only"><table>
          <caption>{summary}</caption>
          <tbody>
            {data.map(d => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td>
                  {d.value} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div role="img" aria-label={summary}>
        <div className="relative flex items-end gap-2 border-b border-line" style={{ height }} aria-hidden="true">
          {data.map((d, i) => {
            const pct = (d.value / max) * 100;
            const isActive = active === i;
            return (
              <div key={d.label} className="relative flex-1 min-w-0 h-full flex flex-col justify-end items-center">
                {/* Value on the cap, in text color (never the bar color). */}
                <span className="text-meta font-semibold text-ink mb-1 tabular-nums">{d.value.toLocaleString()}</span>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onClick={d.onSelect}
                  className={`w-full max-w-[24px] rounded-t-[4px] transition-colors ${d.onSelect ? 'cursor-pointer' : 'cursor-default'}
                    ${isActive ? 'bg-primary-strong' : 'bg-primary'}`}
                  style={{ height: `${Math.max(pct, d.value > 0 ? 2 : 0)}%` }}
                />
                {isActive && (
                  <div className="absolute bottom-full mb-1 z-10 whitespace-nowrap rounded-control bg-navy text-white text-caption font-semibold px-2.5 py-1.5 shadow-float pointer-events-none">
                    {d.label}: {d.value.toLocaleString()} {unit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2" aria-hidden="true">
          {data.map(d => (
            <span key={d.label} className="flex-1 min-w-0 text-center text-caption text-muted leading-tight [overflow-wrap:anywhere]">
              {d.label}
            </span>
          ))}
        </div>
      </div>

      {/* Keyboard + screen reader access to every value. */}
      <div className="sr-only"><table>
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map(d => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>
                {d.value} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
};
