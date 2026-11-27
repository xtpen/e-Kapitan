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
import { BarangayProvider, useBarangay } from './context/BarangayContext';
import { PreferencesProvider } from './context/PreferencesContext';
// Loaded at startup: data, login, the two shells and app chrome.
import { AppShell } from './components/layout/AppShell';
import { GUEST_ALIAS, LOCKED_FOR_GUESTS } from './components/guest/access';
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
import { adminBottomNav, adminNavFor } from './components/admin/adminNav';
import { useAdminNotifications } from './components/admin/adminNotices';

/*
 * Screens load on demand, one chunk per area (see manualChunks in vite.config.ts), so a guest
 * on a phone never downloads admin or staff code. PageSkeleton shows while a chunk loads.
 */
const lazyNamed = <M extends Record<K, React.ComponentType<any>>, K extends keyof M>(load: () => Promise<M>, name: K) =>
  lazy(() => load().then(m => ({ default: m[name] })));


// Shared by several roles
const OfficialDocumentTemplate = lazyNamed(() => import('./components/shared/OfficialDocumentTemplate'), 'OfficialDocumentTemplate');
const OfficialsDirectory = lazyNamed(() => import('./components/shared/OfficialsDirectory'), 'OfficialsDirectory');
const KaBarangayAI = lazyNamed(() => import('./components/shared/KaBarangayAI'), 'KaBarangayAI');
const DocumentVerification = lazyNamed(() => import('./components/shared/DocumentVerification'), 'DocumentVerification');

// Guests: the resident app with fewer features (components/guest/access.ts)
const GuestHome = lazyNamed(() => import('./components/guest/GuestHome'), 'GuestHome');
const GuestTrack = lazyNamed(() => import('./components/guest/GuestTrack'), 'GuestTrack');
const GuestAccount = lazyNamed(() => import('./components/guest/GuestAccount'), 'GuestAccount');
const LockedView = lazyNamed(() => import('./components/guest/LockedView'), 'LockedView');

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
const AdminAnnouncements = lazyNamed(() => import('./components/admin/AdminAnnouncements'), 'AdminAnnouncements');
const AdminNotifications = lazyNamed(() => import('./components/admin/AdminNotifications'), 'AdminNotifications');
const AdminAccount = lazyNamed(() => import('./components/admin/AdminAccount'), 'AdminAccount');
const AdminSettings = lazyNamed(() => import('./components/admin/AdminSettings'), 'AdminSettings');

// Announcements page (residents and guests)
const OfficialAnnouncementsManager = lazyNamed(() => import('./components/official/OfficialAnnouncementsManager'), 'OfficialAnnouncementsManager');
const SuperAdminOnly = lazyNamed(() => import('./components/admin/SuperAdminOnly'), 'SuperAdminOnly');


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
  const { unreadCount: adminUnread } = useAdminNotifications();

  // Old guest page names (bookmarks, older links) open the page that replaced them.
  useEffect(() => {
    if (currentRole === 'guest' && GUEST_ALIAS[activeTab]) setActiveTab(GUEST_ALIAS[activeTab]);
  }, [currentRole, activeTab, setActiveTab]);

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

  const renderCurrentView = () => (isPageLoading ? <PageSkeleton kind={skeletonFor(activeTab, currentRole)} /> : renderView(activeTab));

  const renderView = (tab: string) => {
    // Guests: their own Home, Track and Account; resident-only pages ask them to sign up.
    if (currentRole === 'guest') {
      if (tab === 'home') return <GuestHome />;
      if (tab === 'tracking') return <GuestTrack />;
      if (tab === 'account') return <GuestAccount />;
      if (LOCKED_FOR_GUESTS.has(tab)) return <LockedView tab={tab} />;
    }
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
        // User accounts and permissions: super admins only.
        return currentRole === 'superadmin' ? <AdminPersonnel /> : <SuperAdminOnly />;
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
      case 'admin_notifications':
        return <AdminNotifications />;
      case 'admin_announcements':
        return <AdminAnnouncements />;
      case 'admin_account':
        return <AdminAccount />;
      case 'admin_settings':
        return <AdminSettings />;

      default:
        return currentRole === 'guest' ? <GuestHome /> : currentRole === 'citizen' ? <ResidentDashboard /> : <AdminOverview />;
    }
  };

  // The login check is now handled in MainAppWrapper

  /*
   * Page swaps (docs/DESIGN.md section 8): two full pages are too busy to cross-fade, so the old
   * view leaves quickly (100ms) and the next one (skeleton or page) fades in. The wrapper only fades;
   * the page's own sections rise in with a short stagger (.page-enter), one entrance, not two.
   */
  // Admin portal: a work tool opened many times a day, so a page change is one quick fade (no waiting
  // for the old page to leave, no slide, no staggered rise). The skeleton shows only on a first visit.
  const pageTransition = (
    <div key={`${activeTab}-${currentRole}-${isPageLoading ? 's' : 'p'}`} className="animate-fade-quick">
      {/* The skeleton also covers the moment a screen's code is still downloading. */}
      <Suspense fallback={<PageSkeleton kind={skeletonFor(activeTab, currentRole)} />}>{renderCurrentView()}</Suspense>
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
              <Suspense fallback={<PageSkeleton kind={skeletonFor(activeTab, currentRole)} />}>{renderCurrentView()}</Suspense>
            </div>
          </LeavingInert>
        </motion.div>
      </AnimatePresence>
      </div>
      {(currentRole === 'citizen' || currentRole === 'guest') && (
        <GuidedTour page={activeTab} ready={!isPageLoading && edgeX === 0} guest={currentRole === 'guest'} />
      )}
    </div>
  );

  const printModal = selectedDocumentForPrint && (
    <Suspense fallback={null}>
      <OfficialDocumentTemplate document={selectedDocumentForPrint} onClose={() => setSelectedDocumentForPrint(null)} />
    </Suspense>
  );

  // Guests: the resident app frame and page stack, with guest places and fewer features.
  if (currentRole === 'guest') {
    return (
      <>
        <ToastContainer />
        <ResidentShell guest>{residentStack}</ResidentShell>
      </>
    );
  }

  // Admin and super admin: the admin portal. Super admins also get Users & permissions.
  if (currentRole === 'admin' || currentRole === 'superadmin') {
    return (
      <>
        <ToastContainer />
        <AppShell
          groups={adminNavFor(currentRole, adminUnread)}
          bottomNav={adminBottomNav}
          notificationsTab="admin_notifications"
          unreadCount={adminUnread}
          accountTab="admin_account"
          settingsTab="admin_settings"
          mobileBrand={{ title: 'eKapitan Admin', subtitle: currentRole === 'superadmin' ? 'Super administrator' : 'Administrator portal' }}
        >
          {pageTransition}
        </AppShell>
        <GuidedTour page={activeTab} ready={!isPageLoading} admin />
        {printModal}
      </>
    );
  }

  // Residents.
  {
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
