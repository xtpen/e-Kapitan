import React from 'react';
import {
  Bell,
  CalendarDays,
  CircleDot,
  FileCheck2,
  FileText,
  Home,
  Landmark,
  LayoutGrid,
  ListChecks,
  Megaphone,
  MessageSquareText,
  Printer,
  TriangleAlert,
  User,
} from 'lucide-react';
import type { NavGroup, NavItem } from '../layout/AppShell';

const icon = (Icon: React.ComponentType<{ strokeWidth?: number; 'aria-hidden'?: boolean }>) => (
  <Icon strokeWidth={1.8} aria-hidden={true} />
);

/** Resident navigation (DESIGN.md section 4.2). */
export const residentNavGroups: NavGroup[] = [
  {
    title: 'Services',
    items: [
      { id: 'home', label: 'Dashboard', icon: icon(Home) },
      { id: 'services', label: 'Documents', icon: icon(FileText), alsoActiveFor: ['request_wizard'] },
      { id: 'complaints', label: 'Complaints & Reports', icon: icon(TriangleAlert) },
      { id: 'printing', label: 'Printing', icon: icon(Printer) },
      { id: 'court', label: 'Court Reservation', icon: icon(CircleDot) },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'profile', label: 'My Profile', icon: icon(User) },
      { id: 'notifications', label: 'Notifications', icon: icon(Bell) },
    ],
  },
  /*
   * TEMPORARY: existing resident features that are not in the new nav yet.
   * Kept reachable until the team decides where they live. Remove once placed.
   */
  {
    title: 'More',
    items: [
      { id: 'tracking', label: 'My Requests', icon: icon(ListChecks) },
      { id: 'ai_assistant', label: 'Ka-Barangay AI', icon: icon(MessageSquareText) },
      { id: 'appointments', label: 'Appointments', icon: icon(CalendarDays) },
      { id: 'qr_verify', label: 'Verify a Document', icon: icon(FileCheck2) },
      { id: 'announcements', label: 'Advisories', icon: icon(Megaphone) },
      { id: 'officials_directory', label: 'Officials', icon: icon(Landmark) },
    ],
  },
];

/** Mobile bottom nav: Home · Services · My Requests · Account. */
export const residentBottomNav: NavItem[] = [
  { id: 'home', label: 'Home', icon: icon(Home) },
  { id: 'services', label: 'Services', icon: icon(LayoutGrid), alsoActiveFor: ['request_wizard', 'complaints', 'printing', 'court'] },
  { id: 'tracking', label: 'My Requests', icon: icon(ListChecks) },
  { id: 'profile', label: 'Account', icon: icon(User), alsoActiveFor: ['notifications'] },
];
