import type { Announcement } from '../../types';
import type { Tone } from '../ui';

/** Display helpers for announcements on the public homepage and Announcements page. */

/** "2026-09-09" → "September 9, 2026" */
export const longAnnouncementDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

/** Pill tone: urgent or emergency → danger, health → success, everything else → info. */
export const announcementTone = (a: Announcement): Tone =>
  a.isUrgent || a.category === 'Emergency' ? 'danger' : a.category === 'Health' ? 'success' : 'info';

/** Newest first. */
export const sortAnnouncements = (list: Announcement[]) => [...list].sort((a, b) => b.date.localeCompare(a.date));
