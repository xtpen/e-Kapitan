import React, { useEffect, useRef, useState } from 'react';

export interface LinePoint {
  label: string;
  value: number;
}

/**
 * Single-series line over time (DESIGN.md charts): a 2px line on a soft area, recessive grid, the
 * latest value labelled, and a crosshair + tooltip on hover or arrow keys. Sizes itself to its
 * container. One series, so no legend: the card title names it. A hidden table carries the values.
 */
export const LineChart: React.FC<{
  data: LinePoint[];
  /** e.g. "requests" */
  unit: string;
  /** Tooltip heading for a point, e.g. (p) => `Week of ${p.label}`. */
  pointLabel?: (p: LinePoint) => string;
  summary: string;
  height?: number;
  className?: string;
}> = ({ data, unit, pointLabel = p => p.label, summary, height = 200, className = '' }) => {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(240, el.clientWidth));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = { top: 18, right: 16, bottom: 26, left: 28 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const rawMax = Math.max(1, ...data.map(d => d.value));
  const step = rawMax <= 4 ? 1 : rawMax <= 10 ? 2 : rawMax <= 25 ? 5 : 10;
  const max = Math.ceil(rawMax / step) * step;
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  const x = (i: number) => pad.left + (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w);
  const y = (v: number) => pad.top + h - (v / max) * h;

  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${pad.top + h} L${x(0).toFixed(1)},${pad.top + h} Z`;
  const last = data.length - 1;
  const shown = active ?? null;

  const nearest = (clientX: number) => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r || data.length === 0) return null;
    const px = clientX - r.left - pad.left;
    return Math.max(0, Math.min(last, Math.round((px / w) * last)));
  };

  return (
    <div className={className}>
      <div
        ref={wrap}
        role="img"
        aria-label={summary}
        tabIndex={0}
        className="relative outline-none focus-visible:ring-[3px] focus-visible:ring-navy-ink/30 rounded-control"
        onPointerMove={e => setActive(nearest(e.clientX))}
        onPointerLeave={() => setActive(null)}
        onKeyDown={e => {
          if (e.key === 'ArrowRight') setActive(a => Math.min(last, (a ?? -1) + 1));
          if (e.key === 'ArrowLeft') setActive(a => Math.max(0, (a ?? last + 1) - 1));
          if (e.key === 'Escape') setActive(null);
        }}
        onBlur={() => setActive(null)}
      >
        <svg width={width} height={height} aria-hidden="true" className="block overflow-visible">
          {ticks.map(tk => (
            <g key={tk}>
              <line x1={pad.left} x2={pad.left + w} y1={y(tk)} y2={y(tk)} className="stroke-line-soft" strokeWidth={1} />
              <text x={pad.left - 8} y={y(tk)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                {tk}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % Math.ceil(data.length / 8) === 0 || i === last ? (
              <text key={d.label} x={x(i)} y={height - 6} textAnchor="middle" className="fill-muted text-[11px]">
                {d.label}
              </text>
            ) : null,
          )}
          <path d={area} className="fill-primary/10" />
          <path d={line} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* Latest value, labelled */}
          {last >= 0 && shown === null && (
            <g>
              <circle cx={x(last)} cy={y(data[last].value)} r={4} className="fill-primary stroke-surface" strokeWidth={2} />
              <text x={x(last)} y={y(data[last].value) - 10} textAnchor="end" className="fill-ink text-[12px] font-semibold tabular-nums">
                {data[last].value}
              </text>
            </g>
          )}
          {shown !== null && (
            <g>
              <line x1={x(shown)} x2={x(shown)} y1={pad.top} y2={pad.top + h} className="stroke-muted" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={x(shown)} cy={y(data[shown].value)} r={5} className="fill-primary stroke-surface" strokeWidth={2} />
            </g>
          )}
        </svg>
        {shown !== null && (
          <div
            className="pointer-events-none absolute z-10 rounded-control bg-ink text-surface px-2.5 py-1.5 text-caption shadow-float whitespace-nowrap"
            style={{
              left: Math.min(Math.max(x(shown), 70), width - 70),
              top: Math.max(0, y(data[shown].value) - 46),
              transform: 'translateX(-50%)',
            }}
          >
            <b className="font-semibold">{pointLabel(data[shown])}</b>: {data[shown].value} {unit}
          </div>
        )}
      </div>
      <div className="sr-only">
        <table>
          <caption>{summary}</caption>
          <tbody>
            {data.map(d => (
              <tr key={d.label}>
                <th scope="row">{pointLabel(d)}</th>
                <td>
                  {d.value} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
