import React, { useEffect, useRef } from 'react';

/**
 * Wrap a form that opens in a side panel (Add / Edit). When it appears it slides in with a
 * short navy glow, scrolls into view if needed, and puts the cursor in the first field,
 * so people see where to type. Respects "reduce motion" (see index.css).
 */
export const AttentionPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    el.querySelector<HTMLElement>('input:not([type=hidden]):not([type=checkbox]), select, textarea')?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} className="attention-panel rounded-card">
      {children}
    </div>
  );
};
