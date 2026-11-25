import React from 'react';

/*
 * eKapitan mark: a roof (the barangay hall) over a dot with a ripple (a tap).
 * "Your barangay, a tap away." in one shape. Navy only; works from 16px up.
 * The same geometry is in public/favicon.svg — keep them in sync.
 */

export interface LogoMarkProps {
  size?: number;
  /** navy tile with white lines (default), or white tile with navy lines for navy headers. */
  tone?: 'navy' | 'white';
  /** Draw itself in once (landing header). Static under reduced motion. */
  animate?: boolean;
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ size = 36, tone = 'navy', animate = false, className = '' }) => {
  const tile = tone === 'navy' ? 'var(--color-navy)' : '#FFFFFF';
  const ink = tone === 'navy' ? '#FFFFFF' : 'var(--color-navy)';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={`shrink-0 ${animate ? 'logo-animate' : ''} ${className}`}
    >
      <rect width="64" height="64" rx="16" fill={tile} />
      {/* Ripple */}
      <circle className="logo-ring" cx="32" cy="40" r="11" fill="none" stroke={ink} strokeOpacity="0.35" strokeWidth="2.5" />
      {/* Roof */}
      <path
        className="logo-roof"
        d="M17 31.5 32 18.5l15 13"
        fill="none"
        stroke={ink}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
      {/* Tap */}
      <circle className="logo-dot" cx="32" cy="40" r="5.5" fill={ink} />
    </svg>
  );
};

/** Mark + "eKapitan". Use in headers and footers instead of typing the name next to an image. */
export const Wordmark: React.FC<LogoMarkProps & { textClassName?: string }> = ({ textClassName = 'text-xl text-navy', ...mark }) => (
  <span className="inline-flex items-center gap-2.5">
    <LogoMark {...mark} />
    <span className={`font-display font-bold leading-none ${textClassName}`}>eKapitan</span>
  </span>
);
