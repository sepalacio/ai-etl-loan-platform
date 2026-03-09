import { useEffect } from 'react';
import type { AppToast as AppToastType } from '../store/lenderSlice';

const AUTO_DISMISS_MS = 4000;

const VARIANTS = {
  success: {
    border: 'border-primary-200',
    icon_bg: 'bg-primary-50',
    icon_color: 'text-primary-600',
    bar: 'bg-primary-500',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    ),
  },
  error: {
    border: 'border-red-200',
    icon_bg: 'bg-red-50',
    icon_color: 'text-red-500',
    bar: 'bg-red-400',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    ),
  },
};

interface AppToastProps {
  toast: AppToastType;
  onDismiss: () => void;
}

export function AppToast({ toast, onDismiss }: AppToastProps) {
  const v = VARIANTS[toast.type];

  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 flex items-start gap-3 bg-white border ${v.border} shadow-lg rounded-xl px-4 py-3.5 max-w-sm w-full animate-[slide-in_0.2s_ease-out]`}
    >
      <div className={`w-8 h-8 rounded-lg ${v.icon_bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <svg className={`w-4 h-4 ${v.icon_color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          {v.icon}
        </svg>
      </div>

      <p className="flex-1 text-sm font-medium text-slate-800 mt-1">{toast.message}</p>

      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 mt-0.5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
        <div
          className={`h-full ${v.bar} origin-left`}
          style={{ animation: `shrink ${AUTO_DISMISS_MS}ms linear forwards` }}
        />
      </div>
    </div>
  );
}
