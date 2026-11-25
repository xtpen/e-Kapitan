import React, { useEffect, useRef, useState } from 'react';

/*
 * Two-way scroll reveal (docs/DESIGN.md section 8). The element rises in when it enters the
 * viewport, eases back out when it leaves, and comes in again on the way back:
 * leaving over the top it exits upward, so scrolling up brings it down from above.
 * Uses CSS transitions (.reveal in index.css), so fast scrolling reverses smoothly.
 * Under reduced motion it's simply visible.
 */

type Side = 'above' | 'below';

const useReveal = <T extends HTMLElement>(rootMargin: string) => {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  const [side, setSide] = useState<Side>('below');
  // true for one frame while the element is moved to the side it's entering from, without a transition.
  const [instant, setInstant] = useState(false);
  const sideRef = useRef<Side>('below');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        const above = entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0);
        const from: Side = above ? 'above' : 'below';
        cancelAnimationFrame(frame);
        if (!entry.isIntersecting) {
          // Leave toward the edge it went out of.
          sideRef.current = from;
          setSide(from);
          setShown(false);
          return;
        }
        if (from !== sideRef.current) {
          // It's coming in from the other side (e.g. after a jump to the top): snap there first, then rise in.
          sideRef.current = from;
          setInstant(true);
          setSide(from);
          frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => {
              setInstant(false);
              setShown(true);
            });
          });
        } else {
          setShown(true);
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, [rootMargin]);
  return { ref, shown, side, instant };
};

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render (div by default; use 'li' inside lists). */
  as?: 'div' | 'li' | 'section' | 'header' | 'p' | 'span';
  /** Delay when coming in, ms. Exits never wait. */
  delay?: number;
  /** Travel distance, px. The lead travels furthest. */
  y?: number;
  /** Shrinks the viewport edge so things reveal a little after they peek in. */
  rootMargin?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  as: Tag = 'div',
  delay = 0,
  y = 18,
  rootMargin = '0px 0px -10% 0px',
  className = '',
  style,
  children,
  ...rest
}) => {
  const { ref, shown, side, instant } = useReveal<HTMLElement>(rootMargin);
  const Comp = Tag as React.ElementType;
  return (
    <Comp
      ref={ref}
      data-shown={shown}
      data-side={side}
      data-instant={instant || undefined}
      className={`reveal ${className}`}
      style={{ '--reveal-delay': `${delay}ms`, '--reveal-y': `${y}px`, ...style } as React.CSSProperties}
      {...rest}
    >
      {children}
    </Comp>
  );
};
