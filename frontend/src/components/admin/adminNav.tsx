import React from 'react';
import {
  Bell,
  CalendarDays,
  ChartColumn,
  CircleDot,
  CircleUserRound,
  FileText,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Menu,
  MessageSquareText,
  Printer,
  ScrollText,
  Settings,
  ShieldCheck,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { OPEN_MENU, type NavGroup, type NavItem } from '../layout/AppShell';

const icon = (Icon: React.ComponentType<{ strokeWidth?: number; 'aria-hidden'?: boolean }>) => (
  <Icon strokeWidth={1.8} aria-hidden={true} />
);

/*
 * Admin navigation (DESIGN.md section 4.2), grouped by what the work is:
 *   Dashboard  what's happening now          Requests  what residents sent in
 *   Records    people the barangay keeps     Public info  what residents read and use
 *   Insights   numbers and history           Administration  users and permissions (super admin)
 *   You        your account and settings
 * Admin and super admin share it; only super admins get Administration (adminNavFor).
 * Admin teammates own these screens: replace the screen for your tab id in App.tsx (look for `admin_`).
 */
export const adminNavGroups: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { id: 'admin_overview', label: 'Overview', icon: icon(LayoutDashboard), hint: "Today's numbers, charts and what needs attention" },
      { id: 'admin_notifications', label: 'Notifications', icon: icon(Bell), hint: "New requests, reports and bookings" },
    ],
  },
  {
    title: 'Requests',
    items: [
      { id: 'admin_documents', label: 'Document requests', icon: icon(FileText), hint: "Check, approve and release certificates" },
      { id: 'admin_complaints', label: 'Complaints', icon: icon(TriangleAlert), hint: "Problems residents reported" },
      { id: 'admin_printing', label: 'Printing', icon: icon(Printer), hint: "Files residents sent to print" },
      { id: 'admin_court', label: 'Court bookings', icon: icon(CircleDot), hint: "Approve bookings and close the court" },
    ],
  },
  {
    title: 'Records',
    items: [
      { id: 'admin_residents', label: 'Residents', icon: icon(Users), hint: "Everyone registered in the barangay" },
      { id: 'admin_officials', label: 'Officials', icon: icon(Landmark), hint: "Who leads the barangay" },
    ],
  },
  {
    title: 'Public info',
    items: [
      { id: 'admin_announcements', label: 'Announcements', icon: icon(Megaphone), hint: "News residents see on their Home page" },
      { id: 'admin_services', label: 'Services', icon: icon(LayoutGrid), hint: "Documents residents can request, with fees" },
      { id: 'admin_chatbot', label: 'Chatbot knowledge', icon: icon(MessageSquareText), hint: "What Ask Kap answers" },
    ],
  },
  {
    title: 'Insights',
    items: [
      { id: 'admin_reports', label: 'Reports', icon: icon(ChartColumn), hint: "Make and export reports" },
      { id: 'admin_audit', label: 'Audit logs', icon: icon(ScrollText), hint: "Who did what, and when" },
    ],
  },
];

/** Super admins only: who can sign in and what each person can use. */
const superAdminGroup: NavGroup = {
  title: 'Administration',
  items: [{ id: 'admin_personnel', label: 'Users & permissions', icon: icon(ShieldCheck), hint: "Staff accounts and what each can use" }],
};

const youGroup: NavGroup = {
  title: 'You',
  items: [
    { id: 'admin_account', label: 'My account', icon: icon(CircleUserRound), hint: "Your details and password" },
    { id: 'admin_settings', label: 'Settings', icon: icon(Settings), hint: "Display, accessibility and the tour" },
  ],
};

/** The admin sidebar for a role. Super admins also get Administration; `unread` badges Notifications. */
export const adminNavFor = (role: string, unread = 0): NavGroup[] =>
  [...adminNavGroups, ...(role === 'superadmin' ? [superAdminGroup] : []), youGroup].map(g => ({
    ...g,
    items: g.items.map(i => (i.id === 'admin_notifications' && unread ? { ...i, badge: unread } : i)),
  }));

/** Mobile bottom nav from the admin mobile mockups: Overview · Requests · Calendar · More. */
export const adminBottomNav: NavItem[] = [
  { id: 'admin_overview', label: 'Overview', icon: icon(LayoutDashboard) },
  { id: 'admin_documents', label: 'Requests', icon: icon(FileText), alsoActiveFor: ['admin_complaints', 'admin_printing'] },
  { id: 'admin_court', label: 'Calendar', icon: icon(CalendarDays) },
  { id: OPEN_MENU, label: 'More', icon: icon(Menu) },
];
