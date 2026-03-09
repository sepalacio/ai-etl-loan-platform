export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="var(--color-primary-600)" />
      <rect x="8" y="9" width="16" height="2" rx="1" fill="white" />
      <rect x="8" y="14" width="11" height="2" rx="1" fill="rgba(255,255,255,0.65)" />
      <rect x="8" y="19" width="14" height="2" rx="1" fill="rgba(255,255,255,0.65)" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={28} />
      <span className="text-base font-semibold tracking-tight">LoanPro</span>
    </span>
  );
}
