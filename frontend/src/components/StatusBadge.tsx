import type { ApplicationStatus, DocumentStatus } from '../types/api';

type BadgeConfig = { bg: string; text: string; dot: string; label: string; pulse?: boolean };

const STATUS: Partial<Record<ApplicationStatus | DocumentStatus, BadgeConfig>> = {
  PENDING_UPLOAD: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    label: 'Pending Upload',
  },
  IN_REVIEW: {
    bg: 'bg-review-50',
    text: 'text-review-700',
    dot: 'bg-review-500',
    label: 'In Review',
  },
  COMPLETE: {
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    dot: 'bg-primary-500',
    label: 'Complete',
  },
  FAILED: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Failed',
  },
  PENDING: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    label: 'Pending',
  },
  UPLOADING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    label: 'Uploading',
    pulse: true,
  },
  CLASSIFYING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    label: 'Classifying',
    pulse: true,
  },
  PARSING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    label: 'Parsing',
    pulse: true,
  },
  EXTRACTING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    label: 'Extracting',
    pulse: true,
  },
  VALIDATING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    label: 'Validating',
    pulse: true,
  },
  RESOLVING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    label: 'Resolving',
    pulse: true,
  },
  LOADING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    label: 'Loading',
    pulse: true,
  },
};

const FALLBACK: BadgeConfig = {
  bg: 'bg-slate-100',
  text: 'text-slate-600',
  dot: 'bg-slate-400',
  label: '',
};

export function StatusBadge({ status }: { status: ApplicationStatus | DocumentStatus }) {
  const cfg = STATUS[status] ?? { ...FALLBACK, label: status };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-[status-pulse_1.5s_ease-in-out_infinite]' : ''}`}
      />
      {cfg.label}
    </span>
  );
}
