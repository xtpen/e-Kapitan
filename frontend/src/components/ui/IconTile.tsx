import React from 'react';

export type IconTileTone = 'green' | 'info' | 'warning' | 'danger';

const tones: Record<IconTileTone, string> = {
  green: 'bg-primary-tint text-primary-strong',
  info: 'bg-info-bg text-info-fg',
  warning: 'bg-warning-bg text-warning-fg',
  danger: 'bg-danger-tile text-danger-fg',
};

export interface IconTileProps {
  tone?: IconTileTone;
  size?: 'md' | 'sm';
  className?: string;
  children: React.ReactNode;
}

/** Rounded square holding a 24px icon. See DESIGN.md section 5.5. */
export const IconTile: React.FC<IconTileProps> = ({ tone = 'green', size = 'md', className = '', children }) => (
  <div
    aria-hidden="true"
    className={`${size === 'md' ? 'w-13 h-13' : 'w-10 h-10'} rounded-tile grid place-items-center shrink-0 ${tones[tone]} ${className}`}
  >
    {children}
  </div>
);
