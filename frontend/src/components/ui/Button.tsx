import React from 'react';

type Variant = 'primary' | 'secondary' | 'accent' | 'danger' | 'brand' | 'outline' | 'inverse' | 'inverse-outline';
type Size = 'md' | 'sm';

/*
 * Hover must be unmistakable (docs/DESIGN.md section 5.1): filled buttons lift 1px, deepen and cast a
 * soft shadow; outlined buttons fill with a tint and darken their border. Tailwind's hover: only applies
 * on devices that can hover, so phones keep just the press feedback.
 */
const LIFT = 'hover:-translate-y-px';
const SHADOW_NAVY = 'hover:shadow-[0_6px_16px_-4px_rgb(18_48_79/0.35)]';
const SHADOW_SOFT = 'hover:shadow-[0_4px_12px_-4px_rgb(18_48_79/0.22)]';

const variants: Record<Variant, string> = {
  primary: `bg-primary text-white border-2 border-primary hover:bg-primary-strong hover:border-primary-strong ${LIFT} hover:shadow-[0_6px_16px_-4px_rgb(20_96_74/0.4)]`,
  secondary: `bg-surface text-navy border-2 border-navy hover:bg-navy-tint ${LIFT} ${SHADOW_SOFT}`,
  accent: `bg-gold text-navy border-2 border-gold hover:brightness-95 ${LIFT} hover:shadow-[0_6px_16px_-4px_rgb(106_74_0/0.35)]`,
  danger: `bg-danger-fg text-white border-2 border-danger-fg hover:brightness-110 ${LIFT} hover:shadow-[0_6px_16px_-4px_rgb(139_36_24/0.4)]`,
  // Landing page (navy on white)
  brand: `bg-navy text-white border-2 border-navy hover:bg-navy-deep hover:border-navy-deep ${LIFT} ${SHADOW_NAVY}`,
  outline: `bg-surface text-navy border-2 border-hairline hover:border-navy hover:bg-navy-tint ${LIFT} ${SHADOW_SOFT}`,
  inverse: `bg-surface text-navy border-2 border-surface hover:bg-navy-tint hover:border-navy-tint ${LIFT} hover:shadow-[0_6px_16px_-4px_rgb(0_0_0/0.35)]`,
  'inverse-outline': `bg-transparent text-white border-2 border-white/40 hover:border-white hover:bg-white/15 ${LIFT}`,
};

const sizes: Record<Size, string> = {
  md: 'min-h-12 px-6 text-base',
  sm: 'min-h-11 px-[18px] text-meta',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

/** Shared button. See DESIGN.md section 5.1. One primary (green) action per card. */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  className = '',
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 rounded-control font-semibold cursor-pointer
      transition-[color,background-color,border-color,box-shadow,translate,scale] duration-200 ease-out-strong
      active:scale-[0.97] active:translate-y-0 active:shadow-none
      disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted disabled:border-surface-muted
      disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:bg-surface-muted disabled:hover:border-surface-muted disabled:active:scale-100
      ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    {...rest}
  >
    {icon}
    {children}
  </button>
);
