import React from 'react';
import { Card, PageHeader, Button } from '../ui';
import { useBarangay } from '../../context/BarangayContext';

/** Placeholder for resident pages that are in the new nav but not built yet. */
export const ComingSoon: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  const { setActiveTab } = useBarangay();
  return (
    <div className="max-w-[1200px]">
      <PageHeader title={title} description={description} />
      <Card tone="callout">
        <h3 className="text-h3 font-semibold text-navy">This page is being redesigned</h3>
        <p className="text-meta text-muted mt-1">It will be available here soon. For now, go back to your dashboard.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => setActiveTab('home')}>
          Back to dashboard
        </Button>
      </Card>
    </div>
  );
};
