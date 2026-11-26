/*
 * Where every resident page sits, shared by the frame (tabs, back, swipes) and the page
 * transitions (which way a page slides).
 *
 *   Main places (left to right): Home · Services · Ask Kap · Requests · Account
 *   Inner pages stack on top of their place; the document form stacks on top of Documents.
 */

export const PLACE_IDS = ['home', 'services', 'ai_assistant', 'tracking', 'account'] as const;

/** Which place an inner page belongs to. */
export const PARENT: Record<string, string> = {
  documents: 'services',
  request_wizard: 'services',
  complaints: 'services',
  printing: 'services',
  court: 'services',
  appointments: 'services',
  qr_verify: 'services',
  announcements: 'home',
  notifications: 'home',
  officials_directory: 'account',
  profile: 'account',
  settings: 'account',
  account_security: 'account',
  help: 'account',
  notify_settings: 'account',
  privacy_policy: 'account',
  terms: 'account',
  privacy_notice: 'account',
};

/** Where Back goes when it isn't the place itself. */
export const BACK_TO: Record<string, string> = { request_wizard: 'documents' };

export const isPlace = (tab: string) => (PLACE_IDS as readonly string[]).includes(tab);
export const placeOf = (tab: string) => (isPlace(tab) ? tab : PARENT[tab] ?? 'home');
export const backOf = (tab: string) => BACK_TO[tab] ?? PARENT[tab] ?? 'home';

/** 0 for a place, 1 for an inner page, 2 for a page on top of an inner page. */
export const depthOf = (tab: string): number => (isPlace(tab) ? 0 : BACK_TO[tab] ? 2 : 1);

/**
 * How a move from one page to another should look:
 *   push  the new page slides in on top        pop   the top page slides away, the one below returns
 *   left  next place to the right (content moves left)     right  previous place
 *   none  no relation (first load, other roles)
 */
export type NavMotion = 'push' | 'pop' | 'left' | 'right' | 'instant' | 'none';

export const navMotion = (from: string, to: string): NavMotion => {
  if (from === to) return 'none';
  const a = depthOf(from);
  const b = depthOf(to);
  if (b > a) return 'push';
  if (b < a) return 'pop';
  if (a === 0) {
    const i = PLACE_IDS.indexOf(from as (typeof PLACE_IDS)[number]);
    const j = PLACE_IDS.indexOf(to as (typeof PLACE_IDS)[number]);
    return j > i ? 'left' : 'right';
  }
  // Between two inner pages of different places: treat as a new page on top.
  return 'push';
};

/* ------------------------------------------------------------------ */
/* History: Back returns to the page you actually came from             */
/* ------------------------------------------------------------------ */

/*
 * Every page you open is also a browser history entry, so the in-app Back, the phone's back
 * button / back gesture and the edge swipe all do the same thing: return to the previous page.
 * `trail` mirrors the history entries this session created (trail[index] is the current page).
 */
let trail: string[] = [];
let index = 0;
/** Set just before a Back move so the page transition can play it as one. */
let backMove: { to: string; instant: boolean } | null = null;

export const historyStart = (tab: string) => {
  trail = [tab];
  index = 0;
  history.replaceState({ ek: true, i: 0, tab }, '');
};

/** A forward move (tapping something). */
export const historyPush = (tab: string) => {
  if (trail[index] === tab) return;
  trail = trail.slice(0, index + 1).concat(tab);
  index = trail.length - 1;
  history.pushState({ ek: true, i: index, tab }, '');
  backMove = null;
};

/** The browser moved (back or forward): bring the trail in line. */
export const historyMoved = (state: { i?: number; tab?: string } | null) => {
  if (!state || typeof state.i !== 'number' || !state.tab) return null;
  const goingBack = state.i < index;
  index = state.i;
  trail[index] = state.tab;
  if (goingBack) backMove = { to: state.tab, instant: backMove?.instant ?? false };
  return state.tab;
};

/** Where Back from `tab` leads: the previous page in this session, else the page's parent. */
export const peekBack = (tab: string) => (index > 0 && trail[index] === tab ? trail[index - 1] : backOf(tab));

/** True when Back can use the browser history (there is an earlier page in this session). */
export const canHistoryBack = () => index > 0;

/** Mark the next change as a Back move (instant = the page was already dragged away). */
export const markBack = (to: string, instant = false) => {
  backMove = { to, instant };
};

/** How the page transition should treat arriving at `to`. */
export const backMoveFor = (to: string) => (backMove && backMove.to === to ? backMove : null);

/** The place to the left (-1) or right (+1) of a place, if any. */
export const neighbourPlace = (tab: string, step: -1 | 1): string | null => {
  const i = PLACE_IDS.indexOf(tab as (typeof PLACE_IDS)[number]);
  if (i < 0) return null;
  return PLACE_IDS[i + step] ?? null;
};
