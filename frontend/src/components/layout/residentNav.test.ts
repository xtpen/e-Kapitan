import { beforeEach, describe, expect, it } from 'vitest';
import {
  backMoveFor,
  backOf,
  canHistoryBack,
  depthOf,
  historyMoved,
  historyPush,
  historyStart,
  markBack,
  navMotion,
  neighbourPlace,
  peekBack,
  placeOf,
} from './residentNav';

describe('where pages sit', () => {
  it('knows places and inner pages', () => {
    expect(depthOf('home')).toBe(0);
    expect(depthOf('notifications')).toBe(1);
    expect(depthOf('request_wizard')).toBe(2);
    expect(placeOf('settings')).toBe('account');
    expect(backOf('request_wizard')).toBe('documents');
  });

  it('picks the right transition for a move', () => {
    expect(navMotion('home', 'notifications')).toBe('push');
    expect(navMotion('notifications', 'home')).toBe('pop');
    expect(navMotion('home', 'services')).toBe('left');
    expect(navMotion('account', 'tracking')).toBe('right');
    expect(navMotion('home', 'home')).toBe('none');
  });

  it('finds neighbouring places for swipes', () => {
    expect(neighbourPlace('home', 1)).toBe('services');
    expect(neighbourPlace('home', -1)).toBeNull();
    expect(neighbourPlace('account', 1)).toBeNull();
    expect(neighbourPlace('notifications', 1)).toBeNull();
  });
});

describe('history: Back returns to where you came from', () => {
  beforeEach(() => historyStart('home'));

  it('falls back to the parent when there is no earlier page', () => {
    expect(canHistoryBack()).toBe(false);
    expect(peekBack('home')).toBe('home');
  });

  it('remembers the page you came from, not the default parent', () => {
    historyPush('tracking');
    historyPush('notifications');
    expect(canHistoryBack()).toBe(true);
    // Notifications belongs to Home, but it was opened from Requests.
    expect(peekBack('notifications')).toBe('tracking');
  });

  it('marks a browser back move so the page slides away', () => {
    historyPush('tracking');
    historyPush('notifications');
    markBack('tracking');
    expect(historyMoved({ i: 1, tab: 'tracking' })).toBe('tracking');
    expect(backMoveFor('tracking')).toEqual({ to: 'tracking', instant: false });
  });

  it('ignores history entries that are not ours', () => {
    expect(historyMoved(null)).toBeNull();
    expect(historyMoved({})).toBeNull();
  });
});
