import React, { useEffect, useRef } from 'react';
import { MessageSquareText } from 'lucide-react';
import { FEATURES, Notice, PreviewFrame } from './features';

/*
 * Hero collage: several parts of eKapitan at once, layered like screens on a desk.
 *   Lead        Documents, in front
 *   Support     Court calendar (behind, top right) and Report progress (behind, bottom right), tilted
 *   Decoration  an Ask Kap reply and a text-message notice, floating on top
 *
 * Entrance is one wave on first load (front card first, then the cards behind, then the notes land).
 * While you scroll past, layers drift at different speeds (parallax, transforms written directly,
 * no React render per frame). Under reduced motion it is a still picture.
 */

const panel = (id: string) => FEATURES.find(f => f.id === id)!.Panel;
const Documents = panel('documents');
const Court = panel('court');
const Reports = panel('reports');

/** Entrance timing for one layer: delay and travel distance. */
const enter = (delay: number, rise: number): React.CSSProperties =>
  ({
    animation: `rise 680ms cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms both`,
    '--rise': `${rise}px`,
  }) as React.CSSProperties;

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-surface border border-hairline rounded-card shadow-float p-4 sm:p-5">{children}</div>
);

export const HeroCollage: React.FC = () => {
  const root = useRef<HTMLDivElement>(null);

  // Parallax: layers sit exactly where they're laid out when the collage is centred on screen,
  // and drift by (distance from centre) × depth as it scrolls past. Works wherever the collage is
  // on the page (top of the screen on desktop, below the copy on phones).
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layers = Array.from(el.querySelectorAll<HTMLElement>('[data-depth]'));
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // off screen: leave them be
      const fromCentre = Math.max(-400, Math.min(400, r.top + r.height / 2 - window.innerHeight / 2));
      for (const layer of layers) {
        const depth = Number(layer.dataset.depth);
        layer.style.transform = `translate3d(0, ${(fromCentre * depth).toFixed(1)}px, 0)`;
      }
    };
    const on = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);

  return (
    <div
      ref={root}
      role="img"
      aria-label="Preview of eKapitan: document requests, court booking, report tracking, Ask Kap and text updates"
      className="relative h-[530px] sm:h-[500px] lg:h-[540px] select-none"
    >
      {/* Backdrop */}
      <div aria-hidden="true" className="absolute inset-x-[4%] inset-y-[6%] rounded-banner bg-mist" />

      {/* Court: behind, top right */}
      <div data-depth="0.05" className="absolute top-0 right-0 w-[80%] sm:w-[58%] [zoom:0.92] will-change-transform" aria-hidden="true">
        <div className="rotate-3" style={enter(240, 28)}>
          <Card>
            <Court />
          </Card>
        </div>
      </div>

      {/* Report: behind, bottom right (desktop and tablet) */}
      <div data-depth="0.12" className="hidden sm:block absolute bottom-[4%] right-0 w-[56%] [zoom:0.92] will-change-transform" aria-hidden="true">
        <div className="-rotate-2" style={enter(320, 36)}>
          <Card>
            <Reports />
          </Card>
        </div>
      </div>

      {/* Documents: the lead, in front */}
      <div data-depth="0" className="absolute top-[64px] left-0 w-[92%] sm:top-[19%] sm:w-[76%] z-10" aria-hidden="true">
        <div style={enter(100, 40)}>
          <PreviewFrame>
            <Documents />
          </PreviewFrame>
        </div>
      </div>

      {/* Ask Kap reply: floating, top left (desktop and tablet) */}
      <div data-depth="-0.06" className="hidden sm:block absolute top-0 left-[2%] w-[42%] z-20 will-change-transform" aria-hidden="true">
        <div style={enter(560, 18)}>
          <div className="float-slower bg-surface border border-hairline rounded-tile shadow-float p-3">
            <span className="flex items-center gap-2 text-label font-semibold text-muted">
              <span className="w-6 h-6 rounded-full bg-navy text-white grid place-items-center">
                <MessageSquareText className="w-3.5 h-3.5" strokeWidth={2} />
              </span>
              Ask Kap
            </span>
            <p className="mt-2 rounded-tile rounded-tl-sm bg-mist text-meta text-ink px-3 py-2 leading-snug">
              <b className="font-semibold">₱50.00.</b> Bring a valid ID when you claim it.
            </p>
          </div>
        </div>
      </div>

      {/* Text message: floating, bottom left, under the front card */}
      <div data-depth="0.18" className="absolute bottom-0 right-0 sm:right-auto sm:-bottom-4 sm:left-[4%] z-20 will-change-transform" aria-hidden="true">
        <div style={enter(680, 16)}>
          <div className="float-slow">
            <Notice text="Your clearance is ready" />
          </div>
        </div>
      </div>
    </div>
  );
};
