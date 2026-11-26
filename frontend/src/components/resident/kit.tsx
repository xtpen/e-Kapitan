import React from 'react';
import { ChevronRight } from 'lucide-react';

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
  children: React.ReactNode;
}> = ({ title, action, flush, tone = 'default', className = '', id, children }) => {
  const tones = {
    default: 'bg-surface border-line',
    success: 'bg-success-bg border-primary-tint-line',
    warning: 'bg-warning-bg border-transparent',
  };
  return (
    <section aria-labelledby={title && id ? id : undefined} className={`rounded-card border ${tones[tone]} ${flush ? 'overflow-hidden' : 'p-4 sm:p-5'} ${className}`}>
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
 */
export const Choice: React.FC<{
  selected: boolean;
  onSelect: () => void;
  label: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}> = ({ selected, onSelect, label, sub, icon, disabled }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    disabled={disabled}
    onClick={onSelect}
    className={`w-full min-h-12 flex items-center gap-3 px-3.5 py-2.5 rounded-control border-[1.5px] text-left cursor-pointer
      transition-[border-color,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-50
      ${selected ? 'border-navy-ink bg-navy-tint' : 'border-line bg-surface hover:border-field-line'}`}
  >
    {icon && <span className={`shrink-0 [&_svg]:w-5 [&_svg]:h-5 ${selected ? 'text-navy-ink' : 'text-muted'}`}>{icon}</span>}
    <span className="min-w-0 flex-1">
      <span className={`block font-semibold leading-snug ${selected ? 'text-navy-ink' : 'text-ink'}`}>{label}</span>
      {sub && <span className="block text-caption text-muted">{sub}</span>}
    </span>
    <span
      aria-hidden="true"
      className={`shrink-0 w-5 h-5 rounded-full border-2 grid place-items-center ${selected ? 'border-navy-ink' : 'border-field-line'}`}
    >
      {selected && <span className="w-2.5 h-2.5 rounded-full bg-navy-ink" />}
    </span>
  </button>
);

/** Bottom of a form: full-width buttons on phones (main one on top), right-aligned on wider screens. */
export const FormActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 [&>button]:w-full sm:[&>button]:w-auto">{children}</div>
);

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
