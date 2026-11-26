import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronRight, X } from 'lucide-react';
import { useT } from '../../i18n';

/*
 * Resident portal building blocks. Every resident page is made of these, so spacing,
 * alignment and type are the same everywhere (docs/RESIDENT_UX_BRIEF.md).
 *
 *   <Page>                       centred column, 16px between sections
 *     <PageTitle title sub action />
 *     <Section title action>     a card; `flush` for lists that run edge to edge
 *       <ListRow icon title sub trailing onClick />
 *     </Section>
 *   </Page>
 *
 * Measurements: card padding 16px (20px from sm), list rows 64px tall with 16px side padding,
 * icon circles 40px (20px icon) or 48px (24px icon). Titles: page 26/30px, section 17px.
 */

export type IconTone = 'navy' | 'green' | 'amber' | 'red' | 'blue' | 'gray';

const TONE: Record<IconTone, string> = {
  navy: 'bg-navy-tint text-navy-ink',
  green: 'bg-success-bg text-success-fg',
  amber: 'bg-warning-bg text-warning-fg',
  red: 'bg-danger-bg text-danger-fg',
  blue: 'bg-info-bg text-info-fg',
  gray: 'bg-surface-muted text-muted',
};

/** Round icon holder. md = 40px (list rows), lg = 48px (service buttons, empty states). */
export const IconCircle: React.FC<{ tone?: IconTone; size?: 'sm' | 'md' | 'lg'; children: React.ReactNode; className?: string }> = ({
  tone = 'navy',
  size = 'md',
  children,
  className = '',
}) => (
  <span
    aria-hidden="true"
    className={`shrink-0 rounded-full grid place-items-center [&_svg]:stroke-[1.9]
      ${size === 'lg' ? 'w-12 h-12 [&_svg]:w-6 [&_svg]:h-6' : size === 'sm' ? 'w-8 h-8 [&_svg]:w-4 [&_svg]:h-4' : 'w-10 h-10 [&_svg]:w-5 [&_svg]:h-5'}
      ${TONE[tone]} ${className}`}
  >
    {children}
  </span>
);

/** Page container. `wide` for pages that need a side panel on desktop. */
export const Page: React.FC<{ wide?: boolean; className?: string; children: React.ReactNode }> = ({ wide, className = '', children }) => (
  <div className={`mx-auto w-full ${wide ? 'max-w-[1040px]' : 'max-w-[720px]'} grid grid-cols-1 gap-4 content-start ${className}`}>{children}</div>
);

/** Page heading: one short title, at most one short line, an optional action on the right. */
export const PageTitle: React.FC<{ title: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode }> = ({ title, sub, action }) => (
  <header className="flex items-end justify-between gap-3 pt-1">
    <div className="min-w-0">
      <h1 className="font-display text-[1.625rem] sm:text-[1.875rem] font-bold text-ink leading-tight tracking-[-0.01em]">{title}</h1>
      {sub && <p className="text-muted mt-1">{sub}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </header>
);

/** A card. With a title it gets a header row; `flush` removes inner padding for ListRows. */
export const Section: React.FC<{
  title?: React.ReactNode;
  action?: React.ReactNode;
  flush?: boolean;
  tone?: 'default' | 'success' | 'warning';
  className?: string;
  id?: string;
  /** Marks the section for the guided tour (data-tour). */
  tour?: string;
  children: React.ReactNode;
}> = ({ title, action, flush, tone = 'default', className = '', id, tour, children }) => {
  const tones = {
    default: 'bg-surface border-line shadow-[0_1px_2px_rgb(16_24_40/0.05)]',
    success: 'bg-success-bg border-primary-tint-line',
    warning: 'bg-warning-bg border-transparent',
  };
  return (
    <section data-tour={tour} aria-labelledby={title && id ? id : undefined} className={`rounded-[18px] border ${tones[tone]} ${flush ? 'overflow-hidden' : 'p-4 sm:p-5'} ${className}`}>
      {title && (
        <div className={`flex items-center justify-between gap-3 ${flush ? 'px-4 sm:px-5 pt-4 pb-1' : 'mb-2'}`}>
          <h2 id={id} className="text-[1.0625rem] font-semibold text-ink leading-tight">
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
};

/** Small text link used as a section action ("See all"). */
export const SectionLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className="-my-2 -mr-2 min-h-11 px-2 font-semibold text-meta text-navy-ink hover:underline underline-offset-4 cursor-pointer">
    {children}
  </button>
);

/**
 * One row in a list: icon, title, one muted line, and something on the right (a status pill,
 * a value or a chevron). The whole row is the button. Rows in a flush Section get dividers.
 */
export const ListRow: React.FC<{
  icon?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  highlight?: boolean;
  className?: string;
}> = ({ icon, title, sub, trailing, onClick, chevron = !!onClick, highlight, className = '' }) => {
  const body = (
    <>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink leading-snug">{title}</span>
        {sub && <span className="block text-meta text-muted leading-snug mt-0.5">{sub}</span>}
      </span>
      {trailing && <span className="shrink-0 flex items-center">{trailing}</span>}
      {chevron && <ChevronRight className="w-5 h-5 shrink-0 text-muted" aria-hidden="true" />}
    </>
  );
  const base = `w-full min-h-16 flex items-center gap-3 px-4 sm:px-5 py-3 text-left ${highlight ? 'bg-navy-tint/60' : ''} ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} cursor-pointer hover:bg-surface-muted transition-colors duration-150 active:bg-surface-muted`}>
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  );
};

/** Divided list inside a flush Section. */
export const List: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`divide-y divide-line-soft ${className}`}>{children}</div>
);

/**
 * One option in a group of choices (paper size, kind of problem, time slot). Render inside
 * <div role="radiogroup" aria-label="…" className="grid grid-cols-2 gap-2">.
 *
 * `group`: a name shared by the options of one group. The selected outline then slides from the
 * old choice to the new one (and its dot follows), instead of one switching off and another on.
 */
export const Choice: React.FC<{
  selected: boolean;
  onSelect: () => void;
  label: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  group?: string;
  /** Icon and circle on top, words below: for three-across rows, so long words never collide. */
  tile?: boolean;
}> = ({ selected, onSelect, label, sub, icon, disabled, group, tile }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    disabled={disabled}
    onClick={onSelect}
    className={`relative isolate w-full min-h-12 rounded-control border-[1.5px] text-left cursor-pointer grid items-center gap-x-3 px-3.5 py-2.5
      ${icon ? 'grid-cols-[auto_1fr_auto] [grid-template-areas:"icon_label_radio"]' : 'grid-cols-[1fr_auto] [grid-template-areas:"label_radio"]'}
      ${tile ? 'sm:grid-cols-[1fr_auto] sm:gap-y-2 sm:py-3 sm:[grid-template-areas:"icon_radio""label_label"]' : ''}
      transition-[border-color,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-50
      ${group ? 'border-line bg-surface hover:border-field-line' : selected ? 'border-navy-ink bg-navy-tint' : 'border-line bg-surface hover:border-field-line'}`}
  >
    {group && selected && (
      <motion.span
        aria-hidden="true"
        layoutId={`choice-${group}`}
        transition={CHOICE_SPRING}
        className="absolute -inset-[1.5px] -z-10 rounded-control border-[1.5px] border-navy-ink bg-navy-tint"
      />
    )}
    {icon && <span className={`[grid-area:icon] [&_svg]:w-5 [&_svg]:h-5 transition-colors duration-200 ${selected ? 'text-navy-ink' : 'text-muted'}`}>{icon}</span>}
    <span className="[grid-area:label] min-w-0">
      <span className={`block font-semibold leading-snug transition-colors duration-200 ${selected ? 'text-navy-ink' : 'text-ink'}`}>{label}</span>
      {sub && <span className="block text-caption text-muted">{sub}</span>}
    </span>
    <span
      aria-hidden="true"
      className={`[grid-area:radio] justify-self-end w-5 h-5 rounded-full border-2 grid place-items-center transition-colors duration-200 ${selected ? 'border-navy-ink' : 'border-field-line'}`}
    >
      {selected &&
        (group ? (
          <motion.span layoutId={`choice-dot-${group}`} transition={CHOICE_SPRING} className="w-2.5 h-2.5 rounded-full bg-navy-ink" />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-navy-ink" />
        ))}
    </span>
  </button>
);

/** Firm, quick spring with no wobble: the selection glides and settles. */
const CHOICE_SPRING = { type: 'spring', stiffness: 520, damping: 42, mass: 0.9 } as const;

/** Bottom of a form: full-width buttons on phones (main one on top), right-aligned on wider screens. */
export const FormActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 [&>button]:w-full sm:[&>button]:w-auto">{children}</div>
);

/**
 * Bottom sheet on phones (drag the handle or the sheet down to close), centred dialog on wider
 * screens. Escape and the backdrop close it. Content scrolls inside; `footer` stays pinned.
 */
export const Sheet: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, title, footer, children }) => {
  const reduce = useReducedMotion();
  const t = useT();
  const titleId = React.useId();
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      html.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="sheet" className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6" data-no-gesture>
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-scrim/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.22 } }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full sm:max-w-[480px] max-h-[88dvh] flex flex-col bg-surface rounded-t-banner sm:rounded-card shadow-float"
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0, transition: { type: 'spring', stiffness: 420, damping: 40 } }}
            exit={reduce ? { opacity: 0 } : { y: '100%', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
            drag={reduce ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <span aria-hidden="true" className="mx-auto mt-2.5 mb-1 w-10 h-1.5 rounded-full bg-line cursor-grab sm:hidden" />
            <div className="flex items-center justify-between gap-3 px-5 pt-2 sm:pt-5 pb-2">
              <h2 id={titleId} className="text-[1.1875rem] font-semibold text-ink">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('Close')}
                className="-mr-2 w-11 h-11 grid place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
            {footer && <div className="px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-line-soft">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

/** Nothing to show yet: icon, one line, one action. */
export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; sub?: string; action?: React.ReactNode }> = ({ icon, title, sub, action }) => (
  <div className="px-4 py-8 text-center grid justify-items-center gap-1">
    <IconCircle tone="gray" size="lg">
      {icon}
    </IconCircle>
    <p className="mt-2 font-semibold text-ink">{title}</p>
    {sub && <p className="text-meta text-muted max-w-[32ch]">{sub}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);
