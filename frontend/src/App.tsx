/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
// Loaded at startup: data, login, the two shells and app chrome.
import { AppShell } from './components/layout/AppShell';
import { PublicShell } from './components/layout/PublicShell';
import { ToastContainer } from './components/layout/ToastContainer';
import { PageSkeleton, skeletonFor } from './components/layout/PageSkeleton';
import { LandingPage } from './components/auth/LandingPage';
import { residentBottomNav, residentNavGroups } from './components/resident/residentNav';
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
    largeTextMode 
  } = useBarangay();

  const [selectedServiceForWizard, setSelectedServiceForWizard] = useState<any | null>(null);
  // Starts true: the first paint is the page's skeleton, never page → skeleton → page.
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { unreadCount: residentUnread } = useResidentActivity();

  // Large text mode scales the root font size, so every rem-based size grows with it.
  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeTextMode);
  }, [largeTextMode]);

  // New page: start at the top (instantly, so it doesn't fight the transition) and show that
  // page's skeleton briefly, standing in for a real data fetch.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setIsPageLoading(true);
    const timer = setTimeout(() => setIsPageLoading(false), 450);
    return () => clearTimeout(timer);
  }, [activeTab, currentRole]);

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

  const renderCurrentView = () => {
    if (isPageLoading) {
      return <PageSkeleton kind={skeletonFor(activeTab)} />;
    }

    switch (activeTab) {
      // Citizen Views
      case 'home':
        return <ResidentDashboard />;
      case 'services':
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
          key={`${activeTab}-${currentRole}-${isPageLoading ? 'skeleton' : 'loaded'}`}
          className={isPageLoading ? undefined : 'page-enter'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          {/* The skeleton also covers the moment a screen's code is still downloading. */}
          <Suspense fallback={<PageSkeleton kind={skeletonFor(activeTab)} />}>{renderCurrentView()}</Suspense>
        </motion.div>
      </AnimatePresence>
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
        <AppShell
          groups={residentNavGroups}
          bottomNav={residentBottomNav}
          notificationsTab="notifications"
          unreadCount={residentUnread}
        >
          {pageTransition}
        </AppShell>
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
 ?'text-navy bg-info-bg'
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

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.div
          key="login"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="min-h-screen bg-canvas"
        >
          <LandingPage />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
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
      <MainAppWrapper />
    </BarangayProvider>
  );
}
