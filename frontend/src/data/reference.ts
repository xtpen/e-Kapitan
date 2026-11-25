import type { IncidentCategory } from '../types';

/*
 * Fixed lists the forms choose from. One copy for every screen (resident, public and admin).
 * The purok names date from the Barangay 4A version and still need the barangay's real list
 * (docs/REDESIGN_NOTES.md).
 */

export const PUROKS = [
  'Purok 1 - Centro',
  'Purok 2 - Riverside',
  'Purok 3 - Bukidnon',
  'Purok 4 - Pag-asa',
  'Purok 5 - San Roque',
  'Purok 6 - Industrial Zone',
];

/** "Type of concern" options for complaints and reports. */
export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  'Noise Disturbance',
  'Neighbor Dispute',
  'Sanitation & Garbage',
  'Public Safety / Streetlight',
  'Stray Animal Concern',
  'Drainage / Flooding',
  'Other Community Concern',
];
