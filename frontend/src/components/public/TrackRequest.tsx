import React, { useEffect, useState } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import type { RequestStatus, PrintStatus, CourtReservationStatus } from '../../types';
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  ProgressTimeline,
  StatusPill,
  courtStatus,
  documentStatus,
  formatShortDateTime,
  incidentStatus,
  printStatus,
  type StatusInfo,
  type TimelineStage,
} from '../ui';
import { buildReportStages } from '../shared/reportStages';
import { takePendingReference } from './publicNav';

interface Found {
  reference: string;
  what: string;
  status: StatusInfo;
  updated?: string;
  stages: TimelineStage[];
  nextStep?: string;
}

const CLAIM_STEP = 'Claim it at the barangay hall, weekdays 1:00 PM to 4:00 PM. Bring your reference number and a valid ID.';

/** Stages for a simple forward-only flow. `order` lists statuses; anything else (rejected, declined…) ends it. */
const linearStages = <S extends string>(
  order: S[],
  current: S,
  map: Record<S, StatusInfo>,
  updated?: string,
): TimelineStage[] => {
  const at = order.indexOf(current);
  const stages: TimelineStage[] = order.map((s, i) => ({
    label: map[s].label,
    tone: map[s].tone,
    reached: at >= 0 && i <= at,
    detail: i === at ? updated : undefined,
  }));
  if (at < 0) stages.push({ label: map[current].label, tone: map[current].tone, reached: true, detail: updated });
  return stages;
};

/**
 * Public · Track your request. Reached from the homepage "Track your request" card and the
 * phone bottom nav ("My Requests"). Looks up any reference number and shows only its status:
 * never names or other personal details.
 */
export const TrackRequest: React.FC = () => {
  const { documentRequests, incidents, printRequests, courtReservations, courtSlots, setActiveTab } = useBarangay();
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<Found | null | undefined>(undefined);

  const lookup = (raw: string): Found | null => {
    const ref = raw.trim().toUpperCase();

    const doc = documentRequests.find(d => d.referenceNumber.toUpperCase() === ref);
    if (doc) {
      const updated = formatShortDateTime(doc.updatedAt);
      return {
        reference: doc.referenceNumber,
        what: doc.documentTitle,
        status: documentStatus[doc.status],
        updated,
        stages: linearStages<RequestStatus>(
          ['submitted', 'under_review', 'approved', 'ready_for_release', 'completed'],
          doc.status,
          documentStatus,
          updated,
        ),
        nextStep:
          doc.status === 'ready_for_release'
            ? CLAIM_STEP
            : doc.status === 'rejected'
              ? 'Visit the barangay hall or sign in to see why, then send a new request.'
              : undefined,
      };
    }

    const report = incidents.find(r => r.referenceNumber.toUpperCase() === ref);
    if (report) {
      const last = report.statusHistory[report.statusHistory.length - 1];
      return {
        reference: report.referenceNumber,
        what: `Report: ${report.category}`,
        status: incidentStatus[report.status],
        updated: last ? formatShortDateTime(last.updatedAt) : undefined,
        stages: buildReportStages(report),
      };
    }

    const print = printRequests.find(p => p.referenceNumber.toUpperCase() === ref);
    if (print) {
      const updated = formatShortDateTime(print.submittedAt);
      return {
        reference: print.referenceNumber,
        what: `Printing, ${print.pages * print.copies} ${print.pages * print.copies === 1 ? 'page' : 'pages'}`,
        status: printStatus[print.status],
        stages: linearStages<PrintStatus>(['pending', 'processing', 'ready_for_pickup', 'completed'], print.status, printStatus),
        updated,
        nextStep: print.status === 'ready_for_pickup' ? 'Pick it up at the barangay hall during office hours.' : undefined,
      };
    }

    const court = courtReservations.find(c => c.referenceNumber.toUpperCase() === ref);
    if (court) {
      const slot = courtSlots.find(s => s.id === court.slotId)?.label ?? '';
      const day = new Date(`${court.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        reference: court.referenceNumber,
        what: `Court reservation, ${day}${slot ? `, ${slot}` : ''}`,
        status: courtStatus[court.status],
        stages: linearStages<CourtReservationStatus>(['pending', 'approved', 'completed'], court.status, courtStatus),
      };
    }

    return null;
  };

  const search = (raw: string) => {
    if (!raw.trim()) {
      setError('Enter the reference number you received.');
      setResult(undefined);
      return;
    }
    setError(undefined);
    setResult(lookup(raw));
  };

  // Coming from the homepage card: run the search right away.
  useEffect(() => {
    const ref = takePendingReference();
    if (ref) {
      setReference(ref);
      search(ref);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reports use their own stage tones; show the pill of the last reached stage.
  const pill = (f: Found) => {
    const last = f.stages.filter(s => s.reached).pop();
    return <StatusPill tone={last?.tone ?? f.status.tone}>{last?.label ?? f.status.label}</StatusPill>;
  };

  return (
    <div>
      <PageHeader title="Track your request" description="Enter the reference number you received to see where your request is." />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <div className="grid gap-3 sm:gap-5">
          <Card padded="lg">
            <form
              noValidate
              onSubmit={e => {
                e.preventDefault();
                search(reference);
              }}
            >
              <Field
                label="Reference number"
                error={error}
                help="It starts with REQ, INC, PRT or CRT, for example REQ-2026-0819."
                className="[&>label]:mt-0"
              >
                {p => (
                  <Input
                    {...p}
                    autoComplete="off"
                    value={reference}
                    onChange={e => {
                      setReference(e.target.value);
                      setError(undefined);
                    }}
                  />
                )}
              </Field>
              <Button type="submit" className="mt-5 w-full sm:w-auto">
                Check status
              </Button>
            </form>
          </Card>

          <div aria-live="polite">
            {result === null && (
              <Card>
                <h2 className="text-h3 font-semibold text-navy-ink">We could not find that reference number</h2>
                <p className="text-meta text-muted mt-1">
                  Check that you typed it exactly as it appears on your receipt or text message, including the dashes.
                </p>
              </Card>
            )}
            {result && (
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-h3 font-semibold text-navy-ink">{result.reference}</h2>
                    <p className="text-meta text-muted">{result.what}</p>
                  </div>
                  {pill(result)}
                </div>
                {result.nextStep && (
                  <p className="mt-4 rounded-control bg-success-bg text-success-fg font-semibold px-4 py-3">{result.nextStep}</p>
                )}
                <h3 className="text-meta font-semibold text-ink mt-5 mb-3">Progress</h3>
                <ProgressTimeline stages={result.stages} />
                {result.updated && <p className="text-meta text-muted mt-4">Last update: {result.updated}</p>}
              </Card>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:gap-5">
          <Card tone="callout">
            <h2 className="text-h3 font-semibold text-navy-ink">Lost your reference number?</h2>
            <p className="text-meta text-ink mt-1">
              Visit the barangay hall with a valid ID, Monday to Friday, 8:00 AM to 5:00 PM. Staff can look it up for you.
            </p>
          </Card>
          <Card>
            <h2 className="text-h3 font-semibold text-navy-ink">Have a concern?</h2>
            <p className="text-meta text-muted mt-1 mb-4">File a report and you will get a tracking number right away.</p>
            <Button variant="secondary" onClick={() => setActiveTab('file_report')}>
              Report a concern
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
