import React from 'react';

type Variant = 'primary' | 'secondary' | 'accent' | 'danger';
type Size = 'md' | 'sm';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white border-2 border-primary hover:bg-primary-strong hover:border-primary-strong',
  secondary: 'bg-surface text-navy border-2 border-navy hover:bg-navy-tint',
  accent: 'bg-gold text-navy border-2 border-gold hover:brightness-95',
  danger: 'bg-danger-fg text-white border-2 border-danger-fg hover:brightness-110',
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
    className={`inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors cursor-pointer
      disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted disabled:border-surface-muted
      ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    {...rest}
  >
    {icon}
    {children}
  </button>
);
