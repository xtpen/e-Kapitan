import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/* jsdom lacks a few browser features the app uses; give it quiet stand-ins. */

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

class NoopObserver {
  observe(_el?: Element) {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
// Report everything as visible, so scroll-triggered content shows.
class VisibleObserver extends NoopObserver {
  private cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    super();
    this.cb = cb;
  }
  observe(el: Element) {
    this.cb([{ isIntersecting: true, target: el, boundingClientRect: el.getBoundingClientRect() } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}
vi.stubGlobal('IntersectionObserver', VisibleObserver);
vi.stubGlobal('ResizeObserver', NoopObserver);
window.scrollTo = (() => {}) as typeof window.scrollTo;
Element.prototype.scrollIntoView = () => {};
Element.prototype.scrollTo = (() => {}) as typeof Element.prototype.scrollTo;

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
