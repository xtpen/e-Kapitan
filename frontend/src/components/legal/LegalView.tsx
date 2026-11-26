import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageTitle, Section } from '../resident/kit';
import { LegalBody } from './LegalDocument';
import { LEGAL_DOCS, type LegalDocId } from './legalDocs';

/**
 * A legal document as its own page (Account → Legal). The text stays in English for now.
 * Long pages get a way back up: a round button that appears once you have scrolled down, and a
 * "Back to top" link at the end of the document.
 */
export const LegalView: React.FC<{ id: LegalDocId }> = ({ id }) => {
  const t = useT();
  const doc = LEGAL_DOCS[id];
  const reduce = useReducedMotion();
  const [far, setFar] = useState(false);

  useEffect(() => {
    const onScroll = () => setFar(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const calm = reduce || document.documentElement.classList.contains('reduce-motion');
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    // Put keyboard and screen-reader focus back at the start of the page too.
    document.querySelector<HTMLElement>('main h1 [tabindex="-1"]')?.focus({ preventScroll: true });
  };

  return (
    <Page>
      <PageTitle title={<span tabIndex={-1} className="outline-none">{t(doc.title)}</span>} sub={t(doc.summary)} />
      <Section>
        <LegalBody id={id} />
      </Section>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={toTop}
          className="group min-h-11 px-4 inline-flex items-center gap-2 rounded-full font-semibold text-meta text-navy-ink hover:bg-navy-tint cursor-pointer transition-colors"
        >
          <ArrowUp className="w-4 h-4 transition-transform duration-150 ease-out-strong group-hover:-translate-y-0.5" aria-hidden="true" />
          {t('Back to top')}
        </button>
      </div>

      {/* Floating shortcut once the top is out of reach. Outside the page so its slide can't move it. */}
      {createPortal(
        <AnimatePresence>
          {far && (
            <motion.button
              key="to-top"
              type="button"
              onClick={toTop}
              aria-label={t('Back to top')}
              title={t('Back to top')}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 520, damping: 34 } }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 12, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.9 }}
              className="fixed right-4 lg:right-8 z-30 w-12 h-12 grid place-items-center rounded-full bg-surface text-navy-ink border border-line cursor-pointer
                shadow-[0_8px_20px_-6px_rgb(18_48_79/0.35)] hover:bg-navy-tint bottom-[calc(80px+env(safe-area-inset-bottom))] lg:bottom-8"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.2} aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </Page>
  );
};
