import React from 'react';
import { Clock, FileText } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { DocumentRequest, ServiceItem } from '../../types';
import {
  Button,
  Card,
  CardHeader,
  DataTable,
  IconTile,
  PageHeader,
  StatusPill,
  documentStatus,
  formatPeso,
  formatShortDateTime,
} from '../ui';

interface ServicesDirectoryProps {
  onSelectService?: (service: ServiceItem) => void;
}

/**
 * Resident · Documents (step 1 "Choose" of the request flow).
 * Mockup: "Resident · Document request". See DESIGN.md.
 */
export const ServicesDirectory: React.FC<ServicesDirectoryProps> = ({ onSelectService }) => {
  const { services, documentRequests, currentUser, setActiveTab } = useBarangay();

  const available = services.filter(s => s.availableOnline);
  const myRequests = documentRequests.filter(
    r => (!!currentUser.residentId && r.residentId === currentUser.residentId) || r.residentName === currentUser.name,
  );

  const start = (service: ServiceItem) => {
    onSelectService?.(service);
    setActiveTab('request_wizard');
  };

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title="Documents"
        description="Choose the document you need. You will get a reference number to track it."
      />

      <h2 className="sr-only">Available documents</h2>
      <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
        {available.map(service => (
          <li key={service.id}>
            <Card className="h-full flex flex-col">
              <IconTile className="mb-3.5 [&_svg]:w-6 [&_svg]:h-6">
                <FileText strokeWidth={1.8} />
              </IconTile>
              <h3 className="text-h3 font-semibold text-navy leading-snug">{service.title}</h3>
              <p className="text-meta text-muted mt-1 line-clamp-3">{service.description}</p>

              <dl className="mt-4 pt-3 border-t border-line-soft grid grid-cols-2 gap-3 text-meta">
                <div>
                  <dt className="text-muted">Fee</dt>
                  <dd className="font-semibold">
                    {service.fee === 0 ? 'Free' : formatPeso(service.fee)}
                    {service.fee > 0 && service.isFreeForEligible && (
                      <span className="block font-normal text-muted">Waiver available</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted flex items-center gap-1">
                    <Clock className="w-4 h-4" aria-hidden="true" /> Processing
                  </dt>
                  <dd className="font-semibold">{service.processingTime}</dd>
                </div>
              </dl>

              <div className="mt-auto pt-4">
                <Button fullWidth onClick={() => start(service)} aria-label={`Request ${service.title}`}>
                  Request
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-5 items-start mt-5">
        <Card>
          <CardHeader title="My document requests" />
          <DataTable<DocumentRequest>
            rows={myRequests}
            rowKey={r => r.id}
            onRowClick={() => setActiveTab('tracking')}
            rowLabel={r => `Open ${r.referenceNumber}, ${r.documentTitle}`}
            columns={[
              { header: 'Reference', cell: r => r.referenceNumber, className: 'whitespace-nowrap' },
              { header: 'Document', cell: r => r.documentTitle },
              { header: 'Submitted', cell: r => formatShortDateTime(r.submittedAt), className: 'whitespace-nowrap text-muted' },
              {
                header: 'Status',
                cell: r => <StatusPill tone={documentStatus[r.status].tone}>{documentStatus[r.status].label}</StatusPill>,
              },
            ]}
            mobile={{
              title: r => r.documentTitle,
              status: r => <StatusPill tone={documentStatus[r.status].tone}>{documentStatus[r.status].label}</StatusPill>,
              meta: r => r.referenceNumber,
            }}
            empty={<p className="text-meta text-muted py-2">You have not requested any documents yet.</p>}
          />
        </Card>

        <Card tone="callout">
          <h3 className="text-h3 font-semibold text-navy">How to claim</h3>
          <p className="text-meta text-muted mt-1.5">
            Bring your reference number and a valid ID to the barangay hall, 1:00 PM to 4:00 PM on weekdays. Any fee is
            paid at the hall.
          </p>
        </Card>
      </div>
    </div>
  );
};
