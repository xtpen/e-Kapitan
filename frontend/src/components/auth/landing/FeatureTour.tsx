import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { Reveal } from '../../ui';
import { FEATURES, Notice, PreviewFrame } from './features';

/*
 * Scroll-driven feature tour. Desktop: each feature's explanation scrolls past on the left while a
 * pinned preview on the right switches to match the block crossing the middle of the screen.
 * Phones and tablets: a row of feature chips and swipeable cards (copy + preview) that snap into
 * place, with dots that follow; tapping a chip or a dot scrolls to that card. Previews swap in sequence (old out fast,
 * then the new one's rows rise in one after another), and everything is still under reduced motion.
 */

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const Copy: React.FC<{ index: number }> = ({ index }) => {
  const f = FEATURES[index];
  const Icon = f.icon;
  return (
    <div>
      <Reveal y={10} className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-tile grid place-items-center bg-navy-tint text-navy-ink">
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </span>
        <span className="text-caption font-semibold uppercase tracking-[0.1em] text-muted">
          {String(index + 1).padStart(2, '0')} · {f.tab}
        </span>
      </Reveal>
      <Reveal delay={60} y={16}>
        <h3 className="mt-5 text-[1.75rem] sm:text-[2.25rem] lg:text-[2.625rem] leading-[1.1] font-semibold text-navy-ink tracking-[-0.01em] text-balance">{f.title}</h3>
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

/** Phones and tablets: chips + swipeable cards that snap, with dots. */
const MobileTour: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);

  // Which card is centred decides the active chip and dot.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const mid = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let dist = Infinity;
        cards.current.forEach((c, i) => {
          if (!c) return;
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
          if (d < dist) {
            dist = d;
            best = i;
          }
        });
        setActive(best);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Keep the active chip visible in its own row (never scrolls the page).
  useEffect(() => {
    const row = chips.current;
    const chip = row?.children[active] as HTMLElement | undefined;
    if (!row || !chip) return;
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [active, reduceMotion]);

  const goTo = (i: number) => {
    const el = track.current;
    const c = cards.current[i];
    if (!el || !c) return;
    el.scrollTo({ left: c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <Reveal y={16} className="lg:hidden mt-8">
      {/* Chips */}
      <div
        ref={chips}
        role="tablist"
        aria-label="Features"
        className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          const on = i === active;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => goTo(i)}
              className={`shrink-0 inline-flex items-center gap-2 min-h-11 pl-3 pr-4 rounded-full border font-semibold text-meta cursor-pointer
                transition-[background-color,color,border-color] duration-200
                ${on ? 'bg-navy text-white border-navy' : 'bg-surface text-navy-ink border-hairline'}`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.9} />
              {f.tab}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div
        ref={track}
        data-no-gesture
        className="mt-4 flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 scroll-px-4 sm:scroll-px-6 pb-2
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          const P = f.Panel;
          return (
            <article
              key={f.id}
              ref={el => {
                cards.current[i] = el;
              }}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${FEATURES.length}: ${f.tab}`}
              className={`snap-center shrink-0 w-[86%] sm:w-[62%] rounded-banner border border-hairline bg-mist p-4 sm:p-5 flex flex-col
                transition-[opacity,scale] duration-300 ease-out-strong ${i === active ? 'opacity-100 scale-100' : 'opacity-70 scale-[0.97]'}`}
            >
              <span className="flex items-center gap-2.5 text-caption font-semibold uppercase tracking-[0.1em] text-muted">
                <span className="w-9 h-9 rounded-full grid place-items-center bg-navy-tint text-navy-ink">
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
                </span>
                {f.tab}
              </span>
              <h3 className="mt-3 text-[1.375rem] leading-tight font-semibold text-navy-ink text-balance">{f.title}</h3>
              <p className="mt-2 text-muted leading-relaxed">{f.text}</p>
              <div className="pt-4">
                <PreviewFrame>
                  <P />
                </PreviewFrame>
              </div>
            </article>
          );
        })}
      </div>

      {/* Dots */}
      <ol className="mt-3 flex items-center justify-center gap-1" aria-label="Feature cards">
        {FEATURES.map((f, i) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${f.tab}${i === active ? ' (showing)' : ''}`}
              aria-current={i === active ? 'step' : undefined}
              className="p-2 cursor-pointer"
            >
              <span
                className={`block h-2 rounded-full transition-[width,background-color] duration-300 ease-out-strong
                  ${i === active ? 'w-6 bg-navy' : 'w-2 bg-hairline'}`}
              />
            </button>
          </li>
        ))}
      </ol>
    </Reveal>
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
    <>
    <MobileTour />
    <div className="hidden lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 xl:gap-16">
      {/* Explanations */}
      <div>
        {FEATURES.map((f, i) => {
          return (
            <div
              key={f.id}
              ref={el => {
                blocks.current[i] = el;
              }}
              data-index={i}
              className="min-h-[56vh] flex items-center"
            >
              <div className="w-full">
                <Copy index={i} />
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
          <ol className="mt-20 flex items-center justify-center gap-2" aria-label="Feature tour">
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
    </>
  );
};
