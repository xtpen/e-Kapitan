import { useBarangay } from '../../context/BarangayContext';
import { setPendingAuthScreen, type AuthScreen } from '../public/publicNav';

/*
 * Guest mode: the same app as residents, with fewer features. Guests can report a problem, track
 * anything by its number, check a document, ask Kap, read announcements and officials, get help,
 * change Display & language, and read the legal pages. Everything below needs an account; opening
 * one shows a "Sign up to …" page (LockedView) instead.
 */
export const LOCKED_FOR_GUESTS = new Set([
  'documents',
  'request_wizard',
  'printing',
  'court',
  'appointments',
  'notifications',
  'profile',
  'account_security',
  'notify_settings',
]);

/** Old guest page names, still used by bookmarks and older links. */
export const GUEST_ALIAS: Record<string, string> = {
  guest_home: 'home',
  guest_announcements: 'announcements',
  file_report: 'complaints',
  report_status: 'tracking',
  guest_help: 'help',
};

export const useGuest = () => {
  const { currentRole, setIsAuthenticated } = useBarangay();
  const isGuest = currentRole === 'guest';
  /** Back to the welcome page with the sign-in / sign-up dialog open. */
  const openAuth = (screen: AuthScreen) => {
    setPendingAuthScreen(screen);
    setIsAuthenticated(false);
  };
  return {
    isGuest,
    signUp: () => openAuth('register'),
    signIn: () => openAuth('login'),
    /** Leave guest mode for the welcome page. */
    leave: () => setIsAuthenticated(false),
  };
};
