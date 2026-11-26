import React from 'react';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional breadcrumb text, e.g. "Documents / Barangay Clearance". */
  breadcrumb?: React.ReactNode;
  /** Optional secondary action on the right. */
  action?: React.ReactNode;
}

/** Page title block. See DESIGN.md section 5.8. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, breadcrumb, action }) => (
  <div className="mb-6">
    {breadcrumb && <p className="text-meta text-muted mb-1.5">{breadcrumb}</p>}
    <div className="flex flex-wrap justify-between items-end gap-4">
      <div>
        <h1 className="text-2xl sm:text-h1 leading-tight font-bold text-navy-ink">{title}</h1>
        {description && <p className="text-meta text-muted mt-1">{description}</p>}
      </div>
      {action}
    </div>
  </div>
);
