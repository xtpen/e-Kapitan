import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'motion/react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { useT } from '../../i18n';

/*
 * Toasts (all roles). See DESIGN.md section 5.17.
 * Phones: they drop in from the top, like phone notifications, so they never cover the bottom
 * bar; swipe up or sideways to dismiss. Desktop: bottom right, slide in from the right.
 * A thin bar along the bottom shows the time left (toasts close after 4.5s).
 */

const LIFETIME_MS = 4500;

const TONE = {
  success: { icon: CheckCircle2, tile: 'bg-success-bg text-success-fg', bar: 'bg-success-fg', label: 'Success' },
  info: { icon: Info, tile: 'bg-info-bg text-info-fg', bar: 'bg-info-fg', label: 'Information' },
  warning: { icon: AlertTriangle, tile: 'bg-warning-bg text-warning-fg', bar: 'bg-warning-fg', label: 'Warning' },
  error: { icon: AlertCircle, tile: 'bg-danger-bg text-danger-fg', bar: 'bg-danger-fg', label: 'Error' },
} as const;

const usePhone = () => {
  const q = '(max-width: 767px)';
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useBarangay();
  const reduce = useReducedMotion();
  const phone = usePhone();
  const t = useT();

  // Spring for arrivals: quick, a touch of settle, no wobble.
  const spring = { type: 'spring' as const, stiffness: 520, damping: 38, mass: 0.9 };
  const enter = reduce ? { opacity: 0 } : phone ? { opacity: 0, y: -28, scale: 0.97 } : { opacity: 0, x: 40, scale: 0.98 };
  const leave = reduce ? { opacity: 0 } : phone ? { opacity: 0, y: -20, scale: 0.97 } : { opacity: 0, x: 48 };

  const onDragEnd = (id: string) => (_: unknown, info: PanInfo) => {
    const far = Math.abs(info.offset.x) > 80 || info.offset.y < -40;
    const fast = Math.abs(info.velocity.x) > 500 || info.velocity.y < -400;
    if (far || fast) removeToast(id);
  };

  return (
    <div
      role="region"
      aria-label="Notifications"
      data-no-gesture
      className="fixed z-[100] pointer-events-none left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))]
        md:top-auto md:left-auto md:right-6 md:bottom-6 md:w-[380px] flex flex-col md:flex-col-reverse gap-2.5"
    >
      <AnimatePresence initial={false}>
        {toasts.map(toast => {
          const tone = TONE[toast.type];
          const Icon = tone.icon;
          return (
            <motion.div
              key={toast.id}
              layout={!reduce}
              initial={enter}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1, transition: reduce ? { duration: 0.15 } : spring }}
              exit={{ ...leave, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
              drag={reduce ? false : phone ? true : 'x'}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={phone ? { top: 0.9, bottom: 0.05, left: 0.9, right: 0.9 } : 0.9}
              onDragEnd={onDragEnd(toast.id)}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto relative overflow-hidden flex items-start gap-3 bg-surface border border-line rounded-card shadow-float pl-3 pr-1 py-2.5 touch-pan-y cursor-grab active:cursor-grabbing"
            >
              <span aria-hidden="true" className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${tone.tile}`}>
                <Icon className="w-5 h-5" strokeWidth={1.9} />
              </span>
              {/* The whole message, wrapping inside the toast (never cut off). */}
              <div className="flex-1 min-w-0 py-0.5 break-words">
                <p className="font-semibold text-ink leading-snug">
                  <span className="sr-only">{tone.label}: </span>
                  {t(toast.title)}
                </p>
                {toast.description && <p className="text-meta text-muted leading-snug mt-0.5">{t(toast.description)}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label={t('Dismiss')}
                className="w-10 h-10 grid place-items-center rounded-control text-muted hover:text-ink hover:bg-surface-muted cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
              {/* Time left */}
              {!reduce && (
                <span
                  aria-hidden="true"
                  className={`absolute left-0 bottom-0 h-[3px] w-full origin-left opacity-60 ${tone.bar}`}
                  style={{ animation: `toast-timer ${LIFETIME_MS}ms linear forwards` }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
