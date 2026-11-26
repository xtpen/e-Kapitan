/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useIsPresent } from 'motion/react';
import type { ReactNode } from 'react';

/** A page that is sliding away is hidden from screen readers and can't take focus. */
function LeavingInert({ children }: { children: ReactNode }) {
  const present = useIsPresent();
  return (
    <div aria-hidden={present ? undefined : true} inert={!present || undefined}>
      {children}
    </div>
  );
}
import {
  ArrowLeft,
  ClipboardList,
  DollarSign,
  FileText,
  LayoutDashboard,
  Megaphone,
  PieChart,
  ShieldCheck,
  Users,
  Users2,
} from 'lucide-react';
import { BarangayProvider, useBarangay } from './context/BarangayContext';
import { PreferencesProvider } from './context/PreferencesContext';
// Loaded at startup: data, login, the two shells and app chrome.
import { AppShell } from './components/layout/AppShell';
import { PublicShell } from './components/layout/PublicShell';
import { ToastContainer } from './components/layout/ToastContainer';
import { PageSkeleton, skeletonFor } from './components/layout/PageSkeleton';
import { LandingPage } from './components/auth/LandingPage';
import { ResidentShell } from './components/layout/ResidentShell';
import { GuidedTour } from './components/resident/GuidedTour';
import { backMoveFor, isPlace, navMotion, peekBack, type NavMotion } from './components/layout/residentNav';

type Bezier = [number, number, number, number];
const EASE_OUT: Bezier = [0.23, 1, 0.32, 1];
const EASE_IN: Bezier = [0.4, 0, 1, 1];
const EASE_DRAWER: Bezier = [0.32, 0.72, 0, 1];
import { useResidentActivity } from './components/resident/useResidentActivity';
import { adminBottomNav, adminNavGroups } from './components/admin/adminNav';

/*
 * Screens load on demand, one chunk per area (see manualChunks in vite.config.ts), so a guest
 * on a phone never downloads admin or staff code. PageSkeleton shows while a chunk loads.
 */
const lazyNamed = <M extends Record<K, React.ComponentType<any>>, K extends keyof M>(load: () => Promise<M>, name: K) =>
  lazy(() => load().then(m => ({ default: m[name] })));

const Header = lazyNamed(() => import('./components/layout/Header'), 'Header');

// Shared by several roles
const OfficialDocumentTemplate = lazyNamed(() => import('./components/shared/OfficialDocumentTemplate'), 'OfficialDocumentTemplate');
const OfficialsDirectory = lazyNamed(() => import('./components/shared/OfficialsDirectory'), 'OfficialsDirectory');
const KaBarangayAI = lazyNamed(() => import('./components/shared/KaBarangayAI'), 'KaBarangayAI');
const DocumentVerification = lazyNamed(() => import('./components/shared/DocumentVerification'), 'DocumentVerification');

// Public site (guests)
const PublicHomepage = lazyNamed(() => import('./components/public/PublicHomepage'), 'PublicHomepage');
const PublicAnnouncements = lazyNamed(() => import('./components/public/PublicAnnouncements'), 'PublicAnnouncements');
const ReportConcern = lazyNamed(() => import('./components/public/ReportConcern'), 'ReportConcern');
const TrackRequest = lazyNamed(() => import('./components/public/TrackRequest'), 'TrackRequest');
const HowItWorks = lazyNamed(() => import('./components/public/HowItWorks'), 'HowItWorks');

// Resident portal
const ResidentDashboard = lazyNamed(() => import('./components/resident/ResidentDashboard'), 'ResidentDashboard');
const ServicesDirectory = lazyNamed(() => import('./components/resident/ServicesDirectory'), 'ServicesDirectory');
const DocumentRequestWizard = lazyNamed(() => import('./components/resident/DocumentRequestWizard'), 'DocumentRequestWizard');
const MyRequestsTracker = lazyNamed(() => import('./components/resident/MyRequestsTracker'), 'MyRequestsTracker');
const ComplaintsView = lazyNamed(() => import('./components/resident/ComplaintsView'), 'ComplaintsView');
const AppointmentsView = lazyNamed(() => import('./components/resident/AppointmentsView'), 'AppointmentsView');
const PrintingView = lazyNamed(() => import('./components/resident/PrintingView'), 'PrintingView');
const CourtReservationView = lazyNamed(() => import('./components/resident/CourtReservationView'), 'CourtReservationView');
const ProfileView = lazyNamed(() => import('./components/resident/ProfileView'), 'ProfileView');
const NotificationsView = lazyNamed(() => import('./components/resident/NotificationsView'), 'NotificationsView');
const SettingsView = lazyNamed(() => import('./components/resident/SettingsView'), 'SettingsView');
const ServicesHub = lazyNamed(() => import('./components/resident/ServicesHub'), 'ServicesHub');
const AccountView = lazyNamed(() => import('./components/resident/AccountView'), 'AccountView');
const AccountSecurityView = lazyNamed(() => import('./components/resident/AccountSecurityView'), 'AccountSecurityView');
const HelpView = lazyNamed(() => import('./components/resident/HelpView'), 'HelpView');
const NotificationSettingsView = lazyNamed(() => import('./components/resident/NotificationSettingsView'), 'NotificationSettingsView');
const LegalView = lazyNamed(() => import('./components/legal/LegalView'), 'LegalView');

// Admin portal
const AdminOverview = lazyNamed(() => import('./components/admin/AdminOverview'), 'AdminOverview');
const AdminDocumentRequests = lazyNamed(() => import('./components/admin/AdminDocumentRequests'), 'AdminDocumentRequests');
const AdminComplaints = lazyNamed(() => import('./components/admin/AdminComplaints'), 'AdminComplaints');
const AdminPrintingRequests = lazyNamed(() => import('./components/admin/AdminPrintingRequests'), 'AdminPrintingRequests');
const AdminCourtReservations = lazyNamed(() => import('./components/admin/AdminCourtReservations'), 'AdminCourtReservations');
const AdminResidents = lazyNamed(() => import('./components/admin/AdminResidents'), 'AdminResidents');
const AdminPersonnel = lazyNamed(() => import('./components/admin/AdminPersonnel'), 'AdminPersonnel');
const AdminServices = lazyNamed(() => import('./components/admin/AdminServices'), 'AdminServices');
const AdminOfficials = lazyNamed(() => import('./components/admin/AdminOfficials'), 'AdminOfficials');
const AdminChatbotKnowledge = lazyNamed(() => import('./components/admin/AdminChatbotKnowledge'), 'AdminChatbotKnowledge');
const AdminReports = lazyNamed(() => import('./components/admin/AdminReports'), 'AdminReports');
const AdminAuditLogs = lazyNamed(() => import('./components/admin/AdminAuditLogs'), 'AdminAuditLogs');

// Legacy Staff and Official roles (old design)
const StaffDashboard = lazyNamed(() => import('./components/staff/StaffDashboard'), 'StaffDashboard');
const DocumentProcessingQueue = lazyNamed(() => import('./components/staff/DocumentProcessingQueue'), 'DocumentProcessingQueue');
const SmartQueueManagement = lazyNamed(() => import('./components/staff/SmartQueueManagement'), 'SmartQueueManagement');
const ResidentRecordsDirectory = lazyNamed(() => import('./components/staff/ResidentRecordsDirectory'), 'ResidentRecordsDirectory');
const IncidentBlotterDesk = lazyNamed(() => import('./components/staff/IncidentBlotterDesk'), 'IncidentBlotterDesk');
const CashierRevenueDesk = lazyNamed(() => import('./components/staff/CashierRevenueDesk'), 'CashierRevenueDesk');
const ExecutiveDashboard = lazyNamed(() => import('./components/official/ExecutiveDashboard'), 'ExecutiveDashboard');
const AuditTrailViewer = lazyNamed(() => import('./components/official/AuditTrailViewer'), 'AuditTrailViewer');
const OfficialAnnouncementsManager = lazyNamed(() => import('./components/official/OfficialAnnouncementsManager'), 'OfficialAnnouncementsManager');
const ManageOfficials = lazyNamed(() => import('./components/official/ManageOfficials'), 'ManageOfficials');


const MainAppContent: React.FC = () => {
  const { 
    isAuthenticated,
    activeTab, 
    setActiveTab, 
    currentRole, 
    selectedDocumentForPrint, 
    setSelectedDocumentForPrint,
    addToast,
    largeTextMode 
  } = useBarangay();

  const [selectedServiceForWizard, setSelectedServiceForWizard] = useState<any | null>(null);
  // Starts true: the first paint is the page's skeleton, never page → skeleton → page.
  // Each page shows its skeleton the first time it opens in this session (standing in for the
  // first data fetch). Coming back to a page shows it straight away; pull to refresh shows it again.
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [refreshing, setRefreshing] = useState(false);
  const pageKey = `${currentRole}:${activeTab}`;
  const isPageLoading = refreshing || !visited.has(pageKey);
  const reduceMotion = useReducedMotion();
  const { unreadCount: residentUnread, readyCount: residentReady } = useResidentActivity();

  // Large text mode scales the root font size, so every rem-based size grows with it.
  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeTextMode);
  }, [largeTextMode]);

  // New page: start at the top (instantly, so it doesn't fight the transition) and show that
  // page's skeleton briefly, standing in for a real data fetch.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (visited.has(pageKey)) return;
    const timer = setTimeout(() => setVisited(prev => new Set(prev).add(pageKey)), 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  // Pull to refresh (resident shell): show the page's skeleton again, then confirm.
  useEffect(() => {
    let t = 0;
    const onRefresh = () => {
      setRefreshing(true);
      t = window.setTimeout(() => {
        setRefreshing(false);
        addToast('Up to date', 'Showing the latest from the barangay.', 'success');
      }, 700);
    };
    window.addEventListener('ekapitan:refresh', onRefresh);
    return () => {
      window.removeEventListener('ekapitan:refresh', onRefresh);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Old header + tab bar, used only by the legacy Staff and Official roles.
  const staffTabs = [
    { id: 'dashboard', label: 'Operations Desk', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'staff_documents', label: 'Document Queue', icon: <FileText className="w-5 h-5" /> },
    { id: 'staff_queue', label: 'Smart Queue', icon: <Users className="w-5 h-5" /> },
    { id: 'staff_residents', label: 'Masterlist', icon: <Users2 className="w-5 h-5" /> },
    { id: 'staff_incidents', label: 'Blotter & Lupon', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'staff_cashier', label: 'Treasury', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'staff_announcements', label: 'Advisories', icon: <Megaphone className="w-5 h-5" /> },
  ];

  const officialTabs = [
    { id: 'executive_dashboard', label: 'Intelligence', icon: <PieChart className="w-5 h-5" /> },
    { id: 'official_blotter', label: 'Blotter', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'official_audit', label: 'Audit Trail', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'official_announcements', label: 'Advisories', icon: <Megaphone className="w-5 h-5" /> },
    { id: 'manage_officials', label: 'Manage Officials', icon: <Users2 className="w-5 h-5" /> },
  ];

  const currentTabs = currentRole === 'staff' ? staffTabs : currentRole === 'official' ? officialTabs : [];

  const renderCurrentView = () => (isPageLoading ? <PageSkeleton kind={skeletonFor(activeTab)} /> : renderView(activeTab));

  const renderView = (tab: string) => {
    switch (tab) {
      // Citizen Views
      case 'home':
        return <ResidentDashboard />;
      case 'services':
        return <ServicesHub />;
      case 'account':
        return <AccountView />;
      case 'account_security':
        return <AccountSecurityView />;
      case 'help':
        return <HelpView />;
      case 'documents':
        return (
          <ServicesDirectory 
            onSelectService={(service) => {
              setSelectedServiceForWizard(service);
              setActiveTab('request_wizard');
            }} 
          />
        );
      case 'request_wizard':
        return <DocumentRequestWizard initialServiceId={selectedServiceForWizard?.id} />;
      case 'tracking':
        return <MyRequestsTracker />;
      case 'complaints':
        return <ComplaintsView />;
      case 'ai_assistant':
        return <KaBarangayAI />;
      case 'qr_verify':
        return <DocumentVerification />;
      case 'appointments':
        return <AppointmentsView />;
      case 'announcements':
        return <OfficialAnnouncementsManager />;
      case 'officials_directory':
        return <OfficialsDirectory />;
      case 'printing':
        return <PrintingView />;
      case 'court':
        return <CourtReservationView />;
      case 'profile':
        return <ProfileView />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      case 'notify_settings':
        return <NotificationSettingsView />;
      case 'privacy_policy':
      case 'terms':
      case 'privacy_notice':
        return <LegalView id={tab} />;

      // Staff Views
      case 'dashboard':
      case 'staff_dashboard':
        return <StaffDashboard />;
      case 'staff_documents':
        return <DocumentProcessingQueue />;
      case 'staff_queue':
        return <SmartQueueManagement />;
      case 'staff_residents':
        return <ResidentRecordsDirectory />;
      case 'staff_incidents':
        return <IncidentBlotterDesk />;
      case 'staff_cashier':
        return <CashierRevenueDesk />;
      case 'staff_announcements':
        return <OfficialAnnouncementsManager />;

      // Official Views
      case 'executive_dashboard':
      case 'official_dashboard':
      case 'official_analytics':
        return <ExecutiveDashboard />;
      case 'official_blotter':
        return <IncidentBlotterDesk />;
      case 'official_audit':
        return <AuditTrailViewer />;
      case 'official_announcements':
        return <OfficialAnnouncementsManager />;
      case 'manage_officials':
        return <ManageOfficials />;

      // Admin Views (demo admin, redesigned shell). Old screens show until the Admin team redesigns them.
      case 'admin_overview':
        return <AdminOverview />;
      case 'admin_documents':
        return <AdminDocumentRequests />;
      case 'admin_complaints':
        return <AdminComplaints />;
      case 'admin_printing':
        return <AdminPrintingRequests />;
      case 'admin_court':
        return <AdminCourtReservations />;
      case 'admin_residents':
        return <AdminResidents />;
      case 'admin_personnel':
        return <AdminPersonnel />;
      case 'admin_services':
        return <AdminServices />;
      case 'admin_officials':
        return <AdminOfficials />;
      case 'admin_chatbot':
        return <AdminChatbotKnowledge />;
      case 'admin_reports':
        return <AdminReports />;
      case 'admin_audit':
        return <AdminAuditLogs />;

      // Guest Views (added explicitly here for clarity, though qr_verify/ai_assistant fall through to Citizen if no exact match, we should handle them explicitly here if we want to ensure separation)
      case 'guest_home':
        return <PublicHomepage />;
      case 'guest_announcements':
        return <PublicAnnouncements />;
      case 'file_report':
        return <ReportConcern />;
      case 'report_status':
        return <TrackRequest />;
      case 'guest_help':
        return <HowItWorks />;

      default:
        return currentRole === 'citizen' 
          ? <ResidentDashboard /> 
          : currentRole === 'staff' 
          ? <StaffDashboard /> 
          : currentRole === 'guest'
          ? <PublicHomepage />
          : <ExecutiveDashboard />;
    }
  };

  // The login check is now handled in MainAppWrapper

  /*
   * Page swaps (docs/DESIGN.md section 8): two full pages are too busy to cross-fade, so the old
   * view leaves quickly (100ms) and the next one (skeleton or page) fades in. The wrapper only fades;
   * the page's own sections rise in with a short stagger (.page-enter), one entrance, not two.
   */
  const pageTransition = (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${activeTab}-${currentRole}`}
          initial={{ opacity: 0, transform: 'translateY(8px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.28, ease: EASE_OUT } }}
          exit={{ opacity: 0, transform: 'translateY(-4px)', transition: { duration: 0.12, ease: EASE_IN } }}
        >
          <div key={isPageLoading ? 'skeleton' : 'loaded'} className={isPageLoading ? 'animate-fade' : 'page-enter'}>
            {/* The skeleton also covers the moment a screen's code is still downloading. */}
            <Suspense fallback={<PageSkeleton kind={skeletonFor(activeTab)} />}>{renderCurrentView()}</Suspense>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  /*
   * Residents on phones: pages stack like screens in a phone app.
   *   push  the new page slides in from the right on top; the old one slides back a little and dims
   *   pop   the top page slides off to the right, revealing the page underneath
   *   left / right  moving between places slides sideways, matching the swipe
   * Both pages are on screen during the move (popLayout), each with its own opaque background.
   */
  const navRef = useRef<{ tab: string; motion: NavMotion }>({ tab: activeTab, motion: 'none' });
  if (navRef.current.tab !== activeTab) {
    const from = navRef.current.tab;
    const back = backMoveFor(activeTab);
    const motionKind: NavMotion = back
      ? back.instant
        ? 'instant'
        : isPlace(from) && isPlace(activeTab)
          ? navMotion(from, activeTab)
          : 'pop'
      : navMotion(from, activeTab);
    navRef.current = { tab: activeTab, motion: motionKind };
  }
  const stackMotion = navRef.current.motion;

  /*
   * Drag from the left edge (phones): the page follows the finger and the page you came from shows
   * underneath, sliding into place. Let go past a third of the screen and it finishes the slide and
   * goes back; otherwise it springs back. The frame sends the drag as 'ekapitan:edge' events.
   */
  const [edgeX, setEdgeX] = useState(0);
  const [edgeDragging, setEdgeDragging] = useState(false);
  useEffect(() => {
    const onEdge = (e: Event) => {
      const { phase, x } = (e as CustomEvent<{ phase: 'move' | 'commit' | 'cancel'; x: number }>).detail;
      if (phase === 'move') {
        setEdgeDragging(true);
        setEdgeX(x);
      } else {
        setEdgeDragging(false);
        setEdgeX(phase === 'commit' ? window.innerWidth : 0);
      }
    };
    window.addEventListener('ekapitan:edge', onEdge);
    return () => window.removeEventListener('ekapitan:edge', onEdge);
  }, []);
  // New page: drop any drag offset at once (no transition), then let later drags animate again.
  useEffect(() => {
    setEdgeDragging(true);
    setEdgeX(0);
    const f = requestAnimationFrame(() => requestAnimationFrame(() => setEdgeDragging(false)));
    return () => cancelAnimationFrame(f);
  }, [activeTab]);
  const edgeProgress = Math.min(edgeX / Math.max(1, typeof window === 'undefined' ? 1 : window.innerWidth), 1);
  const underTab = edgeX > 0 ? peekBack(activeTab) : null;
  const stackVariants = {
    enter: (m: NavMotion) =>
      reduceMotion
        ? { opacity: 0 }
        : m === 'push'
          ? { x: '100%', zIndex: 2, boxShadow: '-16px 0 32px rgb(0 0 0 / 0.12)' }
          : m === 'pop'
            ? { x: '-24%', opacity: 0.6, zIndex: 1 }
            : m === 'left'
              ? { x: '28%', opacity: 0, zIndex: 1 }
              : m === 'right'
                ? { x: '-28%', opacity: 0, zIndex: 1 }
                : m === 'instant'
                  ? { opacity: 1, x: 0, zIndex: 1 }
                  : { opacity: 0, zIndex: 1 },
    center: (m: NavMotion) => ({
      x: 0,
      opacity: 1,
      boxShadow: '0 0 0 rgb(0 0 0 / 0)',
      transition: reduceMotion
        ? { duration: 0.15 }
        : m === 'instant'
          ? { duration: 0 }
          : m === 'push' || m === 'pop'
          ? { duration: 0.38, ease: EASE_DRAWER }
          : { duration: 0.3, ease: EASE_OUT },
    }),
    exit: (m: NavMotion) =>
      reduceMotion
        ? { opacity: 0, transition: { duration: 0.1 } }
        : m === 'push'
          ? { x: '-24%', opacity: 0.6, zIndex: 1, transition: { duration: 0.38, ease: EASE_DRAWER } }
          : m === 'pop'
            ? { x: '100%', zIndex: 2, boxShadow: '-16px 0 32px rgb(0 0 0 / 0.12)', transition: { duration: 0.34, ease: EASE_DRAWER } }
            : m === 'left'
              ? { x: '-28%', opacity: 0, transition: { duration: 0.24, ease: EASE_IN } }
              : m === 'right'
                ? { x: '28%', opacity: 0, transition: { duration: 0.24, ease: EASE_IN } }
                : m === 'instant'
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, transition: { duration: 0.12 } },
  };
  const pagePad = 'px-4 sm:px-6 pt-4 lg:pt-6 pb-8 lg:pb-12';
  const residentStack = (
    <div className="relative">
      {/* The page underneath, while the top one is being dragged away */}
      {underTab && (
        <div aria-hidden="true" className="fixed inset-x-0 top-14 bottom-0 z-0 overflow-hidden bg-canvas pointer-events-none">
          <div className={pagePad} style={{ transform: `translateX(${-24 * (1 - edgeProgress)}%)` }}>
            <Suspense fallback={null}>{renderView(underTab)}</Suspense>
          </div>
          <div className="absolute inset-0 bg-scrim" style={{ opacity: 0.18 * (1 - edgeProgress) }} />
        </div>
      )}
      <div
        className="relative z-[1]"
        style={
          edgeX > 0
            ? {
                transform: `translateX(${edgeX}px)`,
                transition: edgeDragging ? 'none' : 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)',
                boxShadow: '-16px 0 32px rgb(0 0 0 / 0.14)',
              }
            : { transition: 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)' }
        }
      >
      <AnimatePresence mode="popLayout" initial={false} custom={stackMotion}>
        <motion.div
          key={`${activeTab}-${currentRole}`}
          custom={stackMotion}
          variants={stackVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className={`relative bg-canvas min-h-[calc(100svh-120px)] lg:min-h-[calc(100svh-64px)] ${pagePad}`}
        >
          <LeavingInert>
            <div key={isPageLoading ? 'skeleton' : 'loaded'} className={isPageLoading ? 'animate-fade' : 'page-enter'}>
              <Suspense fallback={<PageSkeleton kind={skeletonFor(activeTab)} />}>{renderCurrentView()}</Suspense>
            </div>
          </LeavingInert>
        </motion.div>
      </AnimatePresence>
      </div>
      <GuidedTour page={activeTab} ready={!isPageLoading && edgeX === 0} />
    </div>
  );

  const printModal = selectedDocumentForPrint && (
    <Suspense fallback={null}>
      <OfficialDocumentTemplate document={selectedDocumentForPrint} onClose={() => setSelectedDocumentForPrint(null)} />
    </Suspense>
  );

  // Public website for guests. Mockups: "Public homepage" (desktop + mobile).
  if (currentRole === 'guest') {
    return (
      <>
        <ToastContainer />
        <PublicShell>{pageTransition}</PublicShell>
      </>
    );
  }

  // Redesigned shell (DESIGN.md). Residents first; other roles move over as they are redesigned.
  if (currentRole === 'admin') {
    return (
      <>
        <ToastContainer />
        <AppShell
          groups={adminNavGroups}
          bottomNav={adminBottomNav}
          mobileBrand={{ title: 'eKapitan Admin', subtitle: 'Administrator portal' }}
        >
          {pageTransition}
        </AppShell>
        {printModal}
      </>
    );
  }

  if (currentRole === 'citizen') {
    return (
      <>
        <ToastContainer />
        <ResidentShell unreadCount={residentUnread} readyCount={residentReady}>
          {residentStack}
        </ResidentShell>
        {printModal}
      </>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans bg-surface-muted text-ink ${
 largeTextMode ?'text-lg':'text-base'
 }`}>
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Global Civic Header (legacy roles only, so it loads with their screens) */}
      <Suspense fallback={<div className="h-16 sm:h-20 bg-surface border-b border-line" />}>
        <Header />
      </Suspense>

      {/* Bottom Navigation Bar */}
      {currentTabs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-line z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
          <div className="flex items-center justify-around w-full overflow-x-auto scrollbar-none px-2 py-2 gap-2">
            {currentTabs.map((tab) => {
              const isActive = activeTab === tab.id || (tab.id === 'dashboard' && activeTab === 'staff_dashboard') || (tab.id === 'executive_dashboard' && activeTab === 'official_dashboard') || (tab.id === 'guest_home' && activeTab === 'guest_home');
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  className={`flex flex-col items-center justify-center p-3 min-w-[64px] transition-colors rounded-control ${
 isActive
 ? currentRole ==='staff'
 ?'text-info-fg bg-info-bg'
 : currentRole ==='official'
 ?'text-navy-ink bg-info-bg'
 :'text-ink bg-surface-muted'// Guest active state
 :'text-muted hover:text-ink hover:bg-surface-muted'
 }`}
                  id={`bottomnav-${tab.id}`}
                >
                  <div className={`transition-transform duration-200 ${isActive ?'scale-110':''}`}>
                    {tab.icon}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop Sidebar / Sub-Navbar Navigation */}
      {currentTabs.length > 0 && (
        <div className="hidden md:block bg-surface border-b border-line sticky top-16 sm:top-20 z-30 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 sm:gap-2 py-2.5">
              <span className="text-label font-bold uppercase tracking-wider text-muted mr-2 hidden md:inline">
                Navigation:
              </span>
              {currentTabs.map((tab) => {
                const isActive = activeTab === tab.id || (tab.id === 'dashboard' && activeTab === 'staff_dashboard') || (tab.id === 'executive_dashboard' && activeTab === 'official_dashboard') || (tab.id === 'guest_home' && activeTab === 'guest_home');
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-control text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
 isActive
 ? currentRole ==='staff'
 ?'bg-navy text-white'
 : currentRole ==='official'
 ?'bg-navy-deep text-white'
 :'bg-navy text-white'// Guest active state
 :'text-muted hover:text-ink hover:bg-surface-muted'
 }`}
                    id={`subnav-${tab.id}`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden pb-24 md:pb-8 relative">
        {!currentTabs.some(tab => tab.id === activeTab) && (
          <button 
            onClick={() => setActiveTab(currentRole === 'staff' ? 'staff_dashboard' : currentRole === 'official' ? 'official_dashboard' : 'home')}
            className="flex items-center gap-2 text-muted hover:text-primary-strong mb-6 font-bold text-sm transition-colors w-fit cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center group-hover:bg-primary-tint transition-colors">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
            Back
          </button>
        )}
        {pageTransition}
      </main>

      {/* Printable Official Certificate Modal Overlay */}
      {printModal}

      {/* Clean Civic Footer */}
      <footer className="no-print bg-surface border-t border-line mt-auto py-6 text-center text-muted text-xs">
        © 2026 eKapitan Civic Platform. All rights reserved.
      </footer>
    </div>
  );
};

const MainAppWrapper: React.FC = () => {
  const { isAuthenticated } = useBarangay();

  // Fade only: a transform here would turn every position:fixed bar inside into position:absolute.
  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="min-h-screen bg-canvas"
        >
          <LandingPage />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <MainAppContent />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <BarangayProvider>
      <PreferencesProvider>
        <MainAppWrapper />
      </PreferencesProvider>
    </BarangayProvider>
  );
}
