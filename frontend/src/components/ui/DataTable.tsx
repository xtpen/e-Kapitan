import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Extra classes for the cells, e.g. "whitespace-nowrap". */
  className?: string;
  /** Makes the column sortable: the value to sort by (text sorts A to Z, numbers low to high). */
  sortValue?: (row: T) => string | number;
  /** Words for each direction, e.g. ['oldest first', 'newest first'] for dates. */
  sortLabels?: [string, string];
}

export type SortDirection = 'asc' | 'desc';

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Label read out for clickable rows, e.g. (row) => `Open ${row.reference}`. */
  rowLabel?: (row: T) => string;
  /** Highlights the selected row (navy tint). */
  isSelected?: (row: T) => boolean;
  /** Starting sort, by column header. Without it, rows keep the order they're given. */
  defaultSort?: { header: string; direction: SortDirection };
  /** Rows per page. Lists that can grow large (residents, requests) should set this, e.g. 25. */
  pageSize?: number;
  /** Tighter rows for long lists (residents). */
  dense?: boolean;
  /** Word for the rows in the page summary, e.g. "residents" → "Showing 1–25 of 312 residents". */
  itemLabel?: string;
  /** Phone layout: tables become stacked cards. See DESIGN.md section 5.7. */
  mobile: {
    title: (row: T) => React.ReactNode;
    status?: (row: T) => React.ReactNode;
    meta?: (row: T) => React.ReactNode;
  };
  empty?: React.ReactNode;
}

const compare = (a: string | number, b: string | number) =>
  typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });

/**
 * Table on tablet/desktop, stacked cards on phones. Status pill goes in the last column.
 * Columns with `sortValue` get clickable headers (and a "Sort by" menu on phones).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowLabel,
  isSelected,
  defaultSort,
  pageSize,
  dense,
  itemLabel = 'items',
  mobile,
  empty,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ header: string; direction: SortDirection } | null>(defaultSort ?? null);
  const sortable = columns.filter(c => c.sortValue);

  const sorted = useMemo(() => {
    const col = sort && columns.find(c => c.header === sort.header && c.sortValue);
    if (!col || !col.sortValue) return rows;
    const get = col.sortValue;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => compare(get(a), get(b)) * dir);
  }, [rows, columns, sort]);

  // Back to page 1 when the filtered list or the sort changes (not on every re-render).
  const listKey = rows.length ? `${rows.length}:${rowKey(rows[0])}:${rowKey(rows[rows.length - 1])}` : '0';
  useEffect(() => setPage(0), [listKey, sort?.header, sort?.direction]);

  const pages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const current = Math.min(page, pages - 1);
  const visible = pageSize ? sorted.slice(current * pageSize, current * pageSize + pageSize) : sorted;

  if (rows.length === 0) return <>{empty ?? <p className="text-meta text-muted py-4">Nothing here yet.</p>}</>;

  const toggle = (header: string) =>
    setSort(s => (s?.header === header ? { header, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { header, direction: 'asc' }));

  // Words for the phone menu: "Age, lowest first" / "Name, A to Z".
  const isNumeric = (c: Column<T>) => typeof c.sortValue?.(rows[0]) === 'number';
  const dirWords = (c: Column<T>, d: SortDirection) =>
    c.sortLabels
      ? c.sortLabels[d === 'asc' ? 0 : 1]
      : isNumeric(c) ? (d === 'asc' ? 'lowest first' : 'highest first') : d === 'asc' ? 'A to Z' : 'Z to A';

  return (
    <>
      <table className="hidden md:table w-full border-collapse">
        <thead>
          <tr>
            {columns.map(c => {
              const active = sort?.header === c.header;
              const Icon = !active ? ArrowUpDown : sort?.direction === 'asc' ? ArrowUp : ArrowDown;
              return (
                <th
                  key={c.header}
                  scope="col"
                  aria-sort={active ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : c.sortValue ? 'none' : undefined}
                  className="text-left text-label uppercase tracking-[0.06em] font-semibold text-muted py-2 px-2 border-b-2 border-line"
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggle(c.header)}
                      className={`inline-flex items-center gap-1 uppercase tracking-[0.06em] font-semibold cursor-pointer min-h-8 -mx-1 px-1 rounded hover:text-navy-ink ${active ? 'text-navy-ink' : ''}`}
                    >
                      {c.header}
                      <Icon className={`w-3.5 h-3.5 ${active ? '' : 'opacity-50'}`} aria-hidden="true" />
                      <span className="sr-only">
                        {active ? `, sorted ${dirWords(c, sort!.direction)}. Click to reverse.` : ', click to sort'}
                      </span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {visible.map(row => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row);
                      }
                      // Arrow keys move through the list and open each row, for fast browsing.
                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        const i = visible.indexOf(row) + (e.key === 'ArrowDown' ? 1 : -1);
                        const target = visible[i];
                        if (target) {
                          onRowClick(target);
                          const next = (e.currentTarget.parentElement?.children[i] as HTMLElement | undefined);
                          next?.focus();
                        }
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
              aria-current={isSelected?.(row) ? 'true' : undefined}
              className={`border-b border-line-soft last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-navy-tint focus-visible:bg-navy-tint' : ''} ${isSelected?.(row) ? 'bg-navy-tint' : ''}`}
            >
              {columns.map(c => (
                <td key={c.header} className={`${dense ? 'py-2' : 'py-2.5'} px-2 text-meta ${c.className ?? ''}`}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="md:hidden">
        {sortable.length > 0 && (
          <label className="flex items-center justify-end gap-2 mb-2.5 text-meta">
            <span className="text-muted">Sort by</span>
            <select
              value={sort ? `${sort.header}|${sort.direction}` : ''}
              onChange={e => {
                const [header, direction] = e.target.value.split('|');
                setSort(header ? { header, direction: direction as SortDirection } : null);
              }}
              className="min-h-11 px-3 rounded-control border-[1.5px] border-field-line bg-surface text-ink font-semibold cursor-pointer"
            >
              {!defaultSort && <option value="">Default order</option>}
              {sortable.flatMap(c =>
                (['asc', 'desc'] as SortDirection[]).map(d => (
                  <option key={`${c.header}|${d}`} value={`${c.header}|${d}`}>
                    {c.header.charAt(0) + c.header.slice(1).toLowerCase()}, {dirWords(c, d)}
                  </option>
                )),
              )}
            </select>
          </label>
        )}
        <ul className="grid gap-2.5">
          {visible.map(row => {
            const body = (
              <>
                <span className="flex justify-between items-start gap-2">
                  <b className="font-semibold">{mobile.title(row)}</b>
                  {mobile.status?.(row)}
                </span>
                {mobile.meta && <span className="block text-meta text-muted mt-0.5">{mobile.meta(row)}</span>}
              </>
            );
            return (
              <li key={rowKey(row)}>
                {onRowClick ? (
                  <button
                    type="button"
                    onClick={() => onRowClick(row)}
                    aria-current={isSelected?.(row) ? 'true' : undefined}
                    className={`w-full text-left border rounded-tile p-3.5 cursor-pointer hover:border-navy-ink transition-colors ${isSelected?.(row) ? 'bg-navy-tint border-navy-ink' : 'bg-surface border-line'}`}
                  >
                    {body}
                  </button>
                ) : (
                  <div className="bg-surface border border-line rounded-tile p-3.5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {pageSize && sorted.length > pageSize && (
        <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-line-soft">
          <p className="text-meta text-muted" aria-live="polite">
            Showing {current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} of {sorted.length.toLocaleString()} {itemLabel}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              aria-label="Previous page"
              className="w-11 h-11 grid place-items-center rounded-control border-[1.5px] border-line text-navy-ink cursor-pointer hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <label className="flex items-center gap-2 text-meta">
              <span className="text-muted">Page</span>
              <select
                value={current}
                onChange={e => setPage(Number(e.target.value))}
                className="min-h-11 px-2.5 rounded-control border-[1.5px] border-field-line bg-surface font-semibold cursor-pointer"
              >
                {Array.from({ length: pages }, (_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <span className="text-muted">of {pages}</span>
            </label>
            <button
              type="button"
              onClick={() => setPage(current + 1)}
              disabled={current >= pages - 1}
              aria-label="Next page"
              className="w-11 h-11 grid place-items-center rounded-control border-[1.5px] border-line text-navy-ink cursor-pointer hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
