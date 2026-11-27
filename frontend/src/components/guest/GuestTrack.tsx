import React, { useEffect, useState } from 'react';
import { CircleHelp, ScanSearch, SearchX, TriangleAlert } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import type { CourtReservationStatus, PrintStatus, RequestStatus } from '../../types';
import { useT } from '../../i18n';
import {
  Button,
  Field,
  Input,
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
import { takePendingReference } from '../public/publicNav';
import { EmptyState, FormActions, IconCircle, List, ListRow, Page, PageTitle, Section } from '../resident/kit';

/*
 * Track (guests): the guest's "Requests". Type any tracking number to see where it stands; only
 * the status is shown, never names or other personal details. Numbers checked or reports sent in
 * this visit stay in "Recently checked" so they are one tap away.
 */

interface Found {
  reference: string;
  what: string;
  status: StatusInfo;
  updated?: string;
  stages: TimelineStage[];
  nextStep?: string;
}

const RECENT_KEY = 'ekapitan:guest-tracked';

/** Tracking numbers this visit (newest first). Reports a guest sends are added here too. */
export const rememberTracked = (ref: string) => {
  try {
    const list: string[] = JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? '[]');
    sessionStorage.setItem(RECENT_KEY, JSON.stringify([ref, ...list.filter(r => r !== ref)].slice(0, 6)));
  } catch {
    /* storage blocked: nothing remembered */
  }
};
const readTracked = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
};

/** Steps for a simple forward-only flow; anything off the path (rejected, declined) ends it. */
const linearStages = <S extends string>(order: S[], current: S, map: Record<S, StatusInfo>, t: (s: string) => string, updated?: string): TimelineStage[] => {
  const at = order.indexOf(current);
  const stages: TimelineStage[] = order.map((s, i) => ({
    label: t(map[s].label),
    tone: map[s].tone,
    reached: at >= 0 && i <= at,
    detail: i === at ? updated : undefined,
  }));
  if (at < 0) stages.push({ label: t(map[current].label), tone: map[current].tone, reached: true, detail: updated });
  return stages;
};

export const GuestTrack: React.FC = () => {
  const { documentRequests, incidents, printRequests, courtReservations, courtSlots, setActiveTab } = useBarangay();
  const t = useT();
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<Found | null | undefined>(undefined);
  const [recent, setRecent] = useState<string[]>(readTracked);

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
        stages: linearStages<RequestStatus>(['submitted', 'under_review', 'approved', 'ready_for_release', 'completed'], doc.status, documentStatus, t, updated),
        nextStep:
          doc.status === 'ready_for_release'
            ? t('Pick it up at the barangay hall, weekdays 1:00 PM to 4:00 PM. Bring a valid ID.')
            : doc.status === 'rejected'
              ? t('Ask at the barangay hall why, then send a new request.')
              : undefined,
      };
    }

    const report = incidents.find(r => r.referenceNumber.toUpperCase() === ref);
    if (report) {
      const last = report.statusHistory[report.statusHistory.length - 1];
      return {
        reference: report.referenceNumber,
        what: t('Problem report'),
        status: incidentStatus[report.status],
        updated: last ? formatShortDateTime(last.updatedAt) : undefined,
        stages: buildReportStages(report),
      };
    }

    const print = printRequests.find(p => p.referenceNumber.toUpperCase() === ref);
    if (print) {
      return {
        reference: print.referenceNumber,
        what: t('Printing'),
        status: printStatus[print.status],
        updated: formatShortDateTime(print.submittedAt),
        stages: linearStages<PrintStatus>(['pending', 'processing', 'ready_for_pickup', 'completed'], print.status, printStatus, t),
        nextStep: print.status === 'ready_for_pickup' ? t('Pick it up at the barangay hall during office hours.') : undefined,
      };
    }

    const court = courtReservations.find(c => c.referenceNumber.toUpperCase() === ref);
    if (court) {
      const slot = courtSlots.find(s => s.id === court.slotId)?.label ?? '';
      const day = new Date(`${court.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        reference: court.referenceNumber,
        what: `${t('Court booking')}, ${day}${slot ? `, ${slot}` : ''}`,
        status: courtStatus[court.status],
        stages: linearStages<CourtReservationStatus>(['pending', 'approved', 'completed'], court.status, courtStatus, t),
      };
    }
    return null;
  };

  const search = (raw: string) => {
    if (!raw.trim()) {
      setError(t('Enter the tracking number you got.'));
      setResult(undefined);
      return;
    }
    setError(undefined);
    const found = lookup(raw);
    setResult(found);
    if (found) {
      rememberTracked(found.reference);
      setRecent(readTracked());
    }
  };

  // Arriving from a just-sent report or the welcome page: look it up right away.
  useEffect(() => {
    const ref = takePendingReference();
    if (ref) {
      setReference(ref);
      search(ref);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pill = (f: Found) => {
    const last = f.stages.filter(s => s.reached).pop();
    return <StatusPill tone={last?.tone ?? f.status.tone}>{last?.label ?? t(f.status.label)}</StatusPill>;
  };

  const recentFound = recent.map(r => lookup(r)).filter((f): f is Found => !!f && f.reference !== result?.reference);

  return (
    <Page>
      <PageTitle title={t('Track a request')} sub={t('Type the tracking number you got to see where it is.')} />

      <Section tour="track-form">
        <form
          noValidate
          onSubmit={e => {
            e.preventDefault();
            search(reference);
          }}
        >
          <Field label={t('Tracking number')} error={error} help={t('It starts with REQ, INC, PRT or CRT, like REQ-2026-0819.')} className="[&>label]:mt-0">
            {p => (
              <Input
                {...p}
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="REQ-2026-0819"
                value={reference}
                onChange={e => {
                  setReference(e.target.value);
                  setError(undefined);
                }}
              />
            )}
          </Field>
          <FormActions>
            <Button type="submit" variant="brand">
              {t('Check status')}
            </Button>
          </FormActions>
        </form>
      </Section>

      <div aria-live="polite" className="grid grid-cols-1 gap-4 empty:hidden">
        {result === null && (
          <Section>
            <EmptyState icon={<SearchX />} title={t('We could not find that number')} sub={t('Check that you typed it exactly, with the dashes.')} />
          </Section>
        )}
        {result && (
          <Section>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-[1.0625rem] font-semibold text-ink">{result.what}</h2>
                <p className="text-meta text-muted">
                  {t('Tracking no.')} <b className="font-semibold text-ink">{result.reference}</b>
                </p>
              </div>
              {pill(result)}
            </div>
            {result.nextStep && <p className="mt-4 rounded-control bg-success-bg text-success-fg text-meta font-semibold px-3 py-2.5">{result.nextStep}</p>}
            <div className="mt-5">
              <ProgressTimeline stages={result.stages} />
            </div>
            {result.updated && <p className="text-meta text-muted mt-4">{t('Last update: {when}', { when: result.updated })}</p>}
          </Section>
        )}
      </div>

      {recentFound.length > 0 && (
        <Section flush title={t('Recently checked')} id="track-recent">
          <List>
            {recentFound.map(f => (
              <ListRow
                key={f.reference}
                icon={
                  <IconCircle tone="blue">
                    <ScanSearch />
                  </IconCircle>
                }
                title={f.what}
                sub={f.reference}
                trailing={pill(f)}
                onClick={() => {
                  setReference(f.reference);
                  search(f.reference);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </List>
        </Section>
      )}

      <Section flush title={t('Need help?')} id="track-help">
        <List>
          <ListRow
            icon={<IconCircle tone="gray"><CircleHelp /></IconCircle>}
            title={t('Lost your tracking number?')}
            sub={t('Visit the barangay hall with a valid ID. Staff can look it up.')}
          />
          <ListRow
            icon={<IconCircle tone="red"><TriangleAlert /></IconCircle>}
            title={t('Report a problem')}
            sub={t('You get a tracking number right away.')}
            onClick={() => setActiveTab('complaints')}
          />
        </List>
      </Section>
    </Page>
  );
};
