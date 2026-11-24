import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';

/*
 * Toast pop-ups (all roles). See DESIGN.md section 5.17.
 * White card with a tone-colored icon and a matching left edge on the icon tile,
 * bottom-right on desktop, above the bottom nav on phones.
 */

const TONE = {
  success: { icon: CheckCircle2, tile: 'bg-success-bg text-success-fg', bar: 'bg-success-fg', label: 'Success' },
  info: { icon: Info, tile: 'bg-info-bg text-info-fg', bar: 'bg-info-fg', label: 'Information' },
  warning: { icon: AlertTriangle, tile: 'bg-warning-bg text-warning-fg', bar: 'bg-warning-fg', label: 'Warning' },
  error: { icon: AlertCircle, tile: 'bg-danger-bg text-danger-fg', bar: 'bg-danger-fg', label: 'Error' },
} as const;

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useBarangay();
  const reduce = useReducedMotion();

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed z-[100] pointer-events-none left-4 right-4 bottom-[84px] md:left-auto md:right-6 md:bottom-6 md:w-[380px] flex flex-col gap-2.5"
    >
      <AnimatePresence initial={false}>
        {toasts.map(toast => {
          const tone = TONE[toast.type];
          const Icon = tone.icon;
          return (
            <motion.div
              key={toast.id}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto relative overflow-hidden flex items-start gap-3 bg-surface border border-line rounded-card shadow-float pl-4 pr-1.5 py-3"
            >
              <span aria-hidden="true" className={`absolute left-0 inset-y-0 w-1 ${tone.bar}`} />
              <span aria-hidden="true" className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${tone.tile}`}>
                <Icon className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-semibold text-ink leading-snug">
                  <span className="sr-only">{tone.label}: </span>
                  {toast.title}
                </p>
                {toast.description && <p className="text-meta text-muted mt-0.5 leading-snug">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss"
                className="w-11 h-11 -my-1 grid place-items-center rounded-control text-muted hover:text-ink hover:bg-surface-muted cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
