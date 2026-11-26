import { useEffect, useState } from 'react';

/**
 * The value, but only after it has stopped changing for `delay` ms. An empty value comes through
 * at once, so clearing a search box resets the list immediately.
 */
export const useDebouncedValue = <T,>(value: T, delay = 200): T => {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (value === '' || value === null || value === undefined) {
      setSettled(value);
      return;
    }
    const t = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return settled;
};
