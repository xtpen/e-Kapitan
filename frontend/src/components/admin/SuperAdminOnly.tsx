import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, Card } from '../ui';

/** Shown to an admin who opens Users & permissions: only super admins manage user accounts. */
export const SuperAdminOnly: React.FC = () => {
  const { setActiveTab } = useBarangay();
  return (
    <div className="max-w-[560px]">
      <Card>
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="w-12 h-12 shrink-0 rounded-full bg-navy-tint text-navy-ink grid place-items-center">
            <ShieldCheck className="w-6 h-6" strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="text-h3-lg font-semibold text-navy-ink">Super admins only</h1>
            <p className="text-muted mt-1">
              Only a super administrator can add staff accounts or change what someone can use. Ask yours if you need a change.
            </p>
            <Button className="mt-4" variant="secondary" onClick={() => setActiveTab('admin_overview')}>
              Back to overview
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
