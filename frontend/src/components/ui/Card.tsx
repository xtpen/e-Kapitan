import React from 'react';

type Tone = 'default' | 'callout' | 'navy';

const tones: Record<Tone, string> = {
  default: 'bg-surface border-line',
  callout: 'bg-primary-tint border-primary-tint-line',
  navy: 'bg-navy border-navy-ink text-white',
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  /** Larger padding for form cards. */
  padded?: 'md' | 'lg';
}

/** Shared card. See DESIGN.md section 5.2. */
export const Card: React.FC<CardProps> = ({ tone = 'default', padded = 'md', className = '', children, ...rest }) => (
  <div
    className={`border rounded-card ${padded === 'lg' ? 'p-5 sm:p-6' : 'p-4 sm:p-5'} ${tones[tone]} ${className}`}
    {...rest}
  >
    {children}
  </div>
);

export interface CardHeaderProps {
  title: React.ReactNode;
  /** Right side: a "View all" link, a pill, or a small button. */
  action?: React.ReactNode;
  className?: string;
}

/** Title row inside a card: h3 on the left, optional action on the right. */
export const CardHeader: React.FC<CardHeaderProps> = ({ title, action, className = '' }) => (
  <div className={`flex items-center justify-between gap-3 mb-3 ${className}`}>
    <h3 className="text-h3 font-semibold text-navy-ink">{title}</h3>
    {action}
  </div>
);

export interface TextLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/** In-app text link (e.g. "View all"). Rendered as a button because navigation is tab state. */
export const TextLink: React.FC<TextLinkProps> = ({ className = '', children, type = 'button', ...rest }) => (
  <button
    type={type}
    className={`text-meta font-semibold text-primary-strong hover:underline underline-offset-4 cursor-pointer min-h-11 ${className}`}
    {...rest}
  >
    {children}
  </button>
);
