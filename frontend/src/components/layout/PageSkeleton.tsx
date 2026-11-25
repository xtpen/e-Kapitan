import React from 'react';

/** One shimmering placeholder block in the design-system colors. */
const Bone: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-surface-muted border border-line rounded-card ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface/70 to-transparent motion-reduce:hidden" />
  </div>
);

/** Brief loading placeholder shown when switching pages. Shapes follow the common page layout. */
export const PageSkeleton: React.FC = () => (
  <div className="max-w-[1200px] w-full" role="status" aria-label="Loading">
    <Bone className="h-9 w-56 rounded-control mb-2" />
    <Bone className="h-5 w-80 max-w-full rounded-control mb-6" />
    <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
      <div className="grid gap-5">
        <Bone className="h-56" />
        <Bone className="h-40" />
      </div>
      <div className="grid gap-5 content-start">
        <Bone className="h-44" />
        <Bone className="h-28" />
      </div>
    </div>
  </div>
);
