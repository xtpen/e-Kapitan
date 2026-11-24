import React from 'react';
import {
  CalendarDays,
  ChartColumn,
  CircleDot,
  FileText,
  IdCard,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Menu,
  MessageSquareText,
  Printer,
  ScrollText,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { OPEN_MENU, type NavGroup, type NavItem } from '../layout/AppShell';

const icon = (Icon: React.ComponentType<{ strokeWidth?: number; 'aria-hidden'?: boolean }>) => (
  <Icon strokeWidth={1.8} aria-hidden={true} />
);

/*
 * Admin navigation (DESIGN.md section 4.2), matching the "Admin · Overview" mockup.
 * Admin teammates own these screens: replace the placeholder for your tab id in App.tsx
 * (look for `admin_`) with your redesigned component.
 */
export const adminNavGroups: NavGroup[] = [
  {
    title: 'Processing',
    items: [
      { id: 'admin_overview', label: 'Overview', icon: icon(LayoutDashboard) },
      { id: 'admin_documents', label: 'Document Requests', icon: icon(FileText) },
      { id: 'admin_complaints', label: 'Complaints', icon: icon(TriangleAlert) },
      { id: 'admin_printing', label: 'Printing Requests', icon: icon(Printer) },
      { id: 'admin_court', label: 'Court Reservations', icon: icon(CircleDot) },
    ],
  },
  {
    title: 'Management',
    items: [
      { id: 'admin_residents', label: 'Residents', icon: icon(Users) },
      { id: 'admin_personnel', label: 'Personnel', icon: icon(IdCard) },
      { id: 'admin_services', label: 'Services', icon: icon(LayoutGrid) },
      { id: 'admin_officials', label: 'Officials', icon: icon(Landmark) },
      { id: 'admin_chatbot', label: 'Chatbot Knowledge', icon: icon(MessageSquareText) },
    ],
  },
  {
    title: 'Insights',
    items: [
      { id: 'admin_reports', label: 'Reports', icon: icon(ChartColumn) },
      { id: 'admin_audit', label: 'Audit Logs', icon: icon(ScrollText) },
    ],
  },
];

/** Mobile bottom nav from the admin mobile mockups: Overview · Requests · Calendar · More. */
export const adminBottomNav: NavItem[] = [
  { id: 'admin_overview', label: 'Overview', icon: icon(LayoutDashboard) },
  { id: 'admin_documents', label: 'Requests', icon: icon(FileText), alsoActiveFor: ['admin_complaints', 'admin_printing'] },
  { id: 'admin_court', label: 'Calendar', icon: icon(CalendarDays) },
  { id: OPEN_MENU, label: 'More', icon: icon(Menu) },
];
