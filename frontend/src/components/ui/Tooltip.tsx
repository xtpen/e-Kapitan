import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/*
 * Tooltip for navigation: the page name and one short line about what's there, shown beside the
 * item on hover (after a short pause) or keyboard focus. Mouse and keyboard only; touch screens
 * don't get it (no hover). Drawn in a portal so scrolling sidebars can't clip it.
 *
 * Once one tooltip has shown, the next one appears at once while the pointer moves along a menu
 * ("warm" for 400ms), so running down the sidebar doesn't stutter.
 */

type Side = 'right' | 'bottom' | 'left';

const DELAY = 350;
let warmUntil = 0;

const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export const Tooltip: React.FC<{
  label: React.ReactNode;
  hint?: React.ReactNode;
  side?: Side;
  /** Skip the tooltip (e.g. when the label is already fully visible and there's no hint). */
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ label, hint, side = 'right', disabled, className = '', children }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const place = useCallback(() => {
    const el = ref.current?.firstElementChild ?? ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (side === 'right') setPos({ x: r.right + 10, y: r.top + r.height / 2 });
    else if (side === 'left') setPos({ x: r.left - 10, y: r.top + r.height / 2 });
    else setPos({ x: r.left + r.width / 2, y: r.bottom + 8 });
  }, [side]);

  const show = (instant = false) => {
    if (disabled) return;
    window.clearTimeout(timer.current);
    if (instant || performance.now() < warmUntil) place();
    else timer.current = window.setTimeout(place, DELAY);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    if (pos) warmUntil = performance.now() + 400;
    setPos(null);
  };

  useEffect(() => {
    if (!pos) return;
    const off = () => setPos(null);
    window.addEventListener('scroll', off, true);
    window.addEventListener('resize', off);
    return () => {
      window.removeEventListener('scroll', off, true);
      window.removeEventListener('resize', off);
    };
  }, [pos]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const transform =
    side === 'right' ? 'translate(0, -50%)' : side === 'left' ? 'translate(-100%, -50%)' : 'translate(-50%, 0)';

  return (
    <span
      ref={ref}
      className={`contents ${className}`}
      onPointerEnter={e => e.pointerType === 'mouse' && canHover() && show()}
      onPointerLeave={hide}
      onFocus={e => (e.target as HTMLElement).matches(':focus-visible') && show(true)}
      onBlur={hide}
      onClick={hide}
    >
      {children}
      {pos &&
        createPortal(
          <span
            role="tooltip"
            className="tooltip-pop pointer-events-none fixed z-[80] max-w-[260px] rounded-control bg-ink text-surface px-3 py-2 shadow-float"
            style={{ left: pos.x, top: pos.y, transform }}
          >
            <span className="block text-meta font-semibold leading-snug">{label}</span>
            {hint && <span className="block text-caption leading-snug opacity-80 mt-0.5">{hint}</span>}
          </span>,
          document.body,
        )}
    </span>
  );
};
