import React from 'react';

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Extra classes for the cells, e.g. "whitespace-nowrap". */
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Label read out for clickable rows, e.g. (row) => `Open ${row.reference}`. */
  rowLabel?: (row: T) => string;
  /** Highlights the selected row (navy tint). */
  isSelected?: (row: T) => boolean;
  /** Phone layout: tables become stacked cards. See DESIGN.md section 5.7. */
  mobile: {
    title: (row: T) => React.ReactNode;
    status?: (row: T) => React.ReactNode;
    meta?: (row: T) => React.ReactNode;
  };
  empty?: React.ReactNode;
}

/** Table on tablet/desktop, stacked cards on phones. Status pill goes in the last column. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, rowLabel, isSelected, mobile, empty }: DataTableProps<T>) {
  if (rows.length === 0) return <>{empty ?? <p className="text-meta text-muted py-4">Nothing here yet.</p>}</>;

  return (
    <>
      <table className="hidden md:table w-full border-collapse">
        <thead>
          <tr>
            {columns.map(c => (
              <th
                key={c.header}
                scope="col"
                className="text-left text-label uppercase tracking-[0.06em] font-semibold text-muted py-2.5 px-2 border-b-2 border-line"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
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
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
              aria-current={isSelected?.(row) ? 'true' : undefined}
              className={`border-b border-line-soft last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-navy-tint focus-visible:bg-navy-tint' : ''} ${isSelected?.(row) ? 'bg-navy-tint' : ''}`}
            >
              {columns.map(c => (
                <td key={c.header} className={`py-3.5 px-2 text-meta ${c.className ?? ''}`}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="md:hidden grid gap-2.5">
        {rows.map(row => {
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
                  className={`w-full text-left border rounded-tile p-3.5 cursor-pointer hover:border-navy transition-colors ${isSelected?.(row) ? 'bg-navy-tint border-navy' : 'bg-surface border-line'}`}
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
    </>
  );
}
