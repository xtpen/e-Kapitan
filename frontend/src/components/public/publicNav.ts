/*
 * Small hand-offs for the public (guest) site, where navigation is tab state, not URLs.
 * Each value is read once by the screen that needs it, then cleared.
 */

/** Homepage section to scroll to after the homepage mounts ("services", "contact"). */
let pendingSection: string | null = null;
export const setPendingSection = (id: string | null) => {
  pendingSection = id;
};
export const takePendingSection = () => {
  const id = pendingSection;
  pendingSection = null;
  return id;
};

/** Reference number typed into the homepage "Track your request" card. */
let pendingReference = '';
export const setPendingReference = (ref: string) => {
  pendingReference = ref;
};
export const takePendingReference = () => {
  const ref = pendingReference;
  pendingReference = '';
  return ref;
};

/** Which tab the sign-in dialog opens on when a guest taps "Sign in" or "Sign up" on the public site. */
export type AuthScreen = 'login' | 'register';
/** null = just show the landing page; otherwise open the sign-in dialog on that tab. */
let pendingAuthScreen: AuthScreen | null = null;
export const setPendingAuthScreen = (s: AuthScreen) => {
  pendingAuthScreen = s;
};
export const takePendingAuthScreen = (): AuthScreen | null => {
  const s = pendingAuthScreen;
  pendingAuthScreen = null;
  return s;
};

/** Smoothly scroll to an element by id, leaving room for the sticky header. */
export const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
};
