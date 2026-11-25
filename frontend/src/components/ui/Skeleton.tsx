import React from 'react';

/**
 * One shimmering placeholder block (docs/DESIGN.md section 5.17). Size and shape come from className,
 * e.g. <Bone className="h-4 w-40 rounded-full" />. The shimmer is off under reduced motion.
 */
export const Bone: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <span aria-hidden="true" className={`bone block ${className}`} style={style} />
);
