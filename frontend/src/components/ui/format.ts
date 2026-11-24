/**
 * Reads the mixed date strings in the mock data ("2026-09-09 08:30 AM", "2026-09-08 17:00",
 * "2026-09-09 10:15:22", "Sep 9, 2026, 08:30 AM", "2026-09-09") as a local date.
 * Returns null if it can't be read.
 */
export const parseDateTime = (value: string): Date | null => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
  const m = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  let d: Date;
  if (m) {
    let h = Number(m[2]);
    if (m[5]) h = (h % 12) + (m[5].toUpperCase() === 'PM' ? 12 : 0);
    d = new Date(`${m[1]}T${String(h).padStart(2, '0')}:${m[3]}:${m[4] ?? '00'}`);
  } else {
    d = new Date(value);
  }
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Milliseconds for sorting; unreadable dates sort first (0). */
export const dateTimeValue = (value: string) => parseDateTime(value)?.getTime() ?? 0;

/**
 * "Sep 9, 8:30 AM" for tables (DESIGN.md section 7). Date-only values show just "Sep 9".
 * Returns the input unchanged if it can't be read.
 */
export const formatShortDateTime = (value: string) => {
  const d = parseDateTime(value);
  if (!d) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

/** ₱50.00 style. Use for every fee and cost. */
export const formatPeso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
