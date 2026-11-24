/**
 * "Sep 9, 8:30 AM" for tables (DESIGN.md section 7). Accepts the mixed date strings in the
 * mock data; returns the input unchanged if it can't be read.
 */
export const formatShortDateTime = (value: string) => {
  const m = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  let d: Date;
  if (m) {
    let h = Number(m[2]);
    if (m[4]) h = (h % 12) + (m[4].toUpperCase() === 'PM' ? 12 : 0);
    d = new Date(`${m[1]}T${String(h).padStart(2, '0')}:${m[3]}:00`);
  } else {
    d = new Date(value);
  }
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

/** ₱50.00 style. Use for every fee and cost. */
export const formatPeso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
