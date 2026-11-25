import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { Reveal } from '../../ui';
import { FEATURES, Notice, PreviewFrame } from './features';

/*
 * Scroll-driven feature tour. Desktop: each feature's explanation scrolls past on the left while a
 * pinned preview on the right switches to match the block crossing the middle of the screen.
 * Phones: each explanation is followed by its own preview. Previews swap in sequence (old out fast,
 * then the new one's rows rise in one after another), and everything is still under reduced motion.
 */

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const Copy: React.FC<{ index: number }> = ({ index }) => {
  const f = FEATURES[index];
  const Icon = f.icon;
  return (
    <div>
      <Reveal y={10} className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-tile grid place-items-center bg-navy-tint text-navy">
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </span>
        <span className="text-caption font-semibold uppercase tracking-[0.1em] text-muted">
          {String(index + 1).padStart(2, '0')} · {f.tab}
        </span>
      </Reveal>
      <Reveal delay={60} y={16}>
        <h3 className="mt-5 text-[1.75rem] sm:text-[2.25rem] lg:text-[2.625rem] leading-[1.1] font-semibold text-navy tracking-[-0.01em] text-balance">{f.title}</h3>
      </Reveal>
      <Reveal as="p" delay={120} y={12} className="mt-4 text-muted text-[1.125rem] lg:text-[1.1875rem] leading-relaxed max-w-[34rem]">
        {f.text}
      </Reveal>
      <ul className="mt-6 grid gap-3 max-w-[34rem]">
        {f.points.map((p, i) => (
          <Reveal as="li" key={p} delay={180 + i * 60} y={8} className="flex gap-3 text-[1rem] lg:text-[1.0625rem] leading-snug text-ink">
            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full grid place-items-center bg-navy text-white">
              <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
            </span>
            {p}
          </Reveal>
        ))}
      </ul>
    </div>
  );
};

export const FeatureTour: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const blocks = useRef<(HTMLDivElement | null)[]>([]);

  // The block crossing the middle band of the viewport decides which preview is pinned.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    blocks.current.forEach(b => b && io.observe(b));
    return () => io.disconnect();
  }, []);

  const feature = FEATURES[active];
  const Panel = feature.Panel;
  const goTo = (i: number) => blocks.current[i]?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });

  return (
    <div className="lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 xl:gap-16">
      {/* Explanations */}
      <div>
        {FEATURES.map((f, i) => {
          const P = f.Panel;
          return (
            <div
              key={f.id}
              ref={el => {
                blocks.current[i] = el;
              }}
              data-index={i}
              className="py-10 lg:py-0 lg:min-h-[68vh] lg:flex lg:items-center border-b border-hairline last:border-b-0 lg:border-b-0"
            >
              <div className="w-full">
                <Copy index={i} />
                {/* Phones and tablets: the preview sits under its explanation */}
                <Reveal y={0} delay={80} className="lg:hidden mt-8">
                  <PreviewFrame>
                    <div className="panel-stagger-reveal">
                      <P />
                    </div>
                  </PreviewFrame>
                </Reveal>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: pinned preview that follows the explanation in view */}
      <div className="hidden lg:block">
        <div className="sticky top-[calc(50vh-230px)]">
          <div className="relative">
            <PreviewFrame className="[zoom:1.08] xl:[zoom:1.14]">
              <div className="min-h-[318px]" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={feature.id}
                    className={reduceMotion ? undefined : 'panel-stagger'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  >
                    <Panel />
                  </motion.div>
                </AnimatePresence>
              </div>
            </PreviewFrame>
            <div className="absolute -bottom-12 -left-8 z-10 pointer-events-none" aria-hidden="true">
              <AnimatePresence mode="wait">
                {feature.notice && (
                  <motion.div
                    key={feature.notice}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(12px) scale(0.97)' }}
                    animate={{ opacity: 1, transform: 'translateY(0px) scale(1)', transition: { duration: 0.36, ease: EASE_OUT, delay: 0.35 } }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  >
                    <Notice text={feature.notice} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Where you are in the tour; click to jump */}
          <ol className="mt-12 flex items-center justify-center gap-2" aria-label="Feature tour">
            {FEATURES.map((f, i) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${f.tab}${i === active ? ' (showing)' : ''}`}
                  aria-current={i === active ? 'step' : undefined}
                  className="group p-2 cursor-pointer"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out-strong
                      ${i === active ? 'w-8 bg-navy' : 'w-1.5 bg-hairline group-hover:bg-navy/40'}`}
                  />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
