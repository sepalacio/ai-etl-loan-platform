import { useEffect } from 'react';

const AUTO_DISMISS_MS = 5000;

interface WelcomeToastProps {
  email: string;
  onDismiss: () => void;
}

export function WelcomeToast({ email, onDismiss }: WelcomeToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex items-start gap-3 bg-white border border-secondary-200 shadow-lg rounded-xl px-4 py-3.5 max-w-sm w-full animate-[slide-in_0.2s_ease-out]"
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-secondary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg
          className="w-4 h-4 text-secondary-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">Welcome back!</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">Signed in as {email}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 mt-0.5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
        <div
          className="h-full bg-secondary-500 origin-left"
          style={{ animation: `shrink ${AUTO_DISMISS_MS}ms linear forwards` }}
        />
      </div>
    </div>
  );
}
