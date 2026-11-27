import React from 'react';
import { Card, PageHeader } from '../ui';

/** Placeholder for Admin screens that a teammate hasn't redesigned yet. */
export const AdminPlaceholder: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="max-w-[1280px]">
    <PageHeader title={title} description={description} />
    <Card tone="callout">
      <h2 className="text-h3 font-semibold text-navy-ink">Not built yet</h2>
      <p className="text-meta text-muted mt-1">
        This Admin screen is assigned to the Admin team. Follow <b className="font-semibold">DESIGN.md</b> and the matching
        mockup, then replace this placeholder in <code className="font-mono">App.tsx</code>.
      </p>
    </Card>
  </div>
);
