import { useParams, Link } from 'react-router-dom';
import { useApplication } from '../hooks/useApplication';
import type { BorrowerProfile, IncomeRecord, AccountRecord, BorrowerFlag } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';

// ─── Constants ──────────────────────────────────────────────────────────────

const FLAG_LABELS: Record<BorrowerFlag, string> = {
  JOINT_APPLICATION_DETECTED: 'Joint application detected — co-taxpayer name has been populated',
  ADDRESS_DISCREPANCY: 'Conflicting addresses found across submitted documents',
  INCOME_VARIANCE: 'Income amounts vary across documents — manual review recommended',
  LOW_EXTRACTION_CONFIDENCE: 'Low AI extraction confidence on one or more documents',
  MISSING_SSN: 'SSN was not found in any submitted document',
  NAME_DISCREPANCY: 'Borrower name differs across documents — possible mixed-person upload, manual review required',
};

const ACCOUNT_TYPE_COLORS: Record<string, { stroke: string; label: string; dot: string }> = {
  CHECKING:   { stroke: '#16a34a', label: 'Checking',   dot: 'bg-primary-600'  },
  SAVINGS:    { stroke: '#2563eb', label: 'Savings',    dot: 'bg-blue-600'     },
  INVESTMENT: { stroke: '#7c3aed', label: 'Investment', dot: 'bg-purple-600'   },
  RETIREMENT: { stroke: '#d97706', label: 'Retirement', dot: 'bg-amber-600'    },
  OTHER:      { stroke: '#64748b', label: 'Other',      dot: 'bg-slate-500'    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number | undefined | null): string {
  if (v == null) return '—';
  return `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

function fmtNumber(v: number | undefined | null): string {
  if (v == null) return '—';
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`bg-slate-100 animate-pulse rounded-lg ${className ?? ''}`}
    />
  );
}

function SkeletonPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <SkeletonBlock className="h-4 w-64" />

      {/* Header */}
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-72" />
        <SkeletonBlock className="h-4 w-48" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-7 w-32" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <SkeletonBlock className="h-4 w-36" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-6 rounded-md" style={{ width: `${60 + i * 15}%` }} />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-6">
          <SkeletonBlock className="w-28 h-28 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            {[...Array(4)].map((_, i) => (
              <SkeletonBlock key={i} className="h-4" />
            ))}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
        <SkeletonBlock className="h-4 w-36" />
        {[...Array(3)].map((_, i) => (
          <SkeletonBlock key={i} className="h-8" />
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string; // border-t-* class
  iconPath: string;
  iconBg: string;
  iconColor: string;
}

function KpiCard({ label, value, sub, accent, iconPath, iconBg, iconColor }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-2 ${accent} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
        <span className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <svg className={`w-3.5 h-3.5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Flag Card ─────────────────────────────────────────────────────────────────

function FlagCard({ flag }: { flag: BorrowerFlag }) {
  const label = FLAG_LABELS[flag] ?? flag;
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
      <svg
        className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">
          {flag.replace(/_/g, ' ')}
        </p>
        <p className="text-sm text-amber-800">{label}</p>
      </div>
    </div>
  );
}

// ─── Income Bar Chart ─────────────────────────────────────────────────────────

function IncomeBarChart({ records }: { records: IncomeRecord[] }) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic py-4 text-center">No income records available.</p>
    );
  }

  const maxAmount = Math.max(...records.map((r) => Number(r.annualAmount)), 1);

  return (
    <div className="space-y-4">
      {records.map((record) => {
        const widthPct = (Number(record.annualAmount) / maxAmount) * 100;
        return (
          <div key={record.id}>
            <div className="flex items-baseline justify-between mb-1.5 gap-4">
              <div className="min-w-0">
                <span className="text-sm font-medium text-slate-800 truncate block">
                  {record.employer ?? record.incomeType}
                </span>
                <span className="text-xs text-slate-400">
                  {record.incomeType}
                  {record.taxYear ? ` · ${record.taxYear}` : ''}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-900 tabular-nums flex-shrink-0">
                {fmt(record.annualAmount)}
              </span>
            </div>
            <div className="relative h-6 bg-slate-100 rounded-md overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary-500 rounded-md transition-all duration-500"
                style={{ width: `${widthPct}%` }}
              />
              {record.ytdAmount != null && (
                <div
                  className="absolute inset-y-0 left-0 border-r-2 border-primary-800 opacity-40"
                  style={{ width: `${(Number(record.ytdAmount) / maxAmount) * 100}%` }}
                  title={`YTD: ${fmt(record.ytdAmount)}`}
                />
              )}
            </div>
            {record.ytdAmount != null && (
              <p className="text-xs text-slate-400 mt-0.5">YTD: {fmt(record.ytdAmount)}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Assets Donut Chart ───────────────────────────────────────────────────────

interface DonutSegment {
  accountType: string;
  total: number;
  color: string;
  label: string;
  dot: string;
}

function buildDonutSegments(records: AccountRecord[]): DonutSegment[] {
  const totals: Record<string, number> = {};
  for (const r of records) {
    totals[r.accountType] = (totals[r.accountType] ?? 0) + Number(r.balance);
  }
  return Object.entries(totals).map(([type, total]) => {
    const cfg = ACCOUNT_TYPE_COLORS[type] ?? ACCOUNT_TYPE_COLORS['OTHER'];
    return { accountType: type, total, color: cfg.stroke, label: cfg.label, dot: cfg.dot };
  });
}

function AssetsDonutChart({ records }: { records: AccountRecord[] }) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic py-4 text-center">No account records available.</p>
    );
  }

  const segments = buildDonutSegments(records);
  const grandTotal = segments.reduce((s, seg) => s + seg.total, 0);

  // SVG donut params
  const cx = 60;
  const cy = 60;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const gap = 2; // degrees gap between segments

  // Build stroke-dasharray paths
  let cumulativePct = 0;
  const paths = segments.map((seg) => {
    const pct = grandTotal > 0 ? seg.total / grandTotal : 0;
    const dashLength = pct * circumference - (gap / 360) * circumference;
    const offsetStart = cumulativePct * circumference;
    cumulativePct += pct;
    return { ...seg, pct, dashLength: Math.max(dashLength, 0), offsetStart };
  });

  return (
    <div className="flex items-center gap-6">
      {/* SVG donut */}
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 120 120" width={120} height={120} className="rotate-[-90deg]">
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={16}
          />
          {paths.map((seg, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={16}
              strokeDasharray={`${seg.dashLength} ${circumference}`}
              strokeDashoffset={-seg.offsetStart}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs font-semibold text-slate-900 tabular-nums leading-none">
            {fmt(grandTotal)}
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2.5 min-w-0">
        {paths.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-xs font-medium text-slate-700 truncate">{seg.label}</span>
                <span className="text-xs font-semibold text-slate-900 tabular-nums flex-shrink-0">
                  {fmt(seg.total)}
                </span>
              </div>
              <div className="mt-0.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${grandTotal > 0 ? (seg.total / grandTotal) * 100 : 0}%`, backgroundColor: seg.color }}
                />
              </div>
              <span className="text-[10px] text-slate-400">
                {grandTotal > 0 ? ((seg.total / grandTotal) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Address Discrepancies ─────────────────────────────────────────────────────

function AddressDiscrepancies({ items }: { items: string[] }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Address Discrepancies</p>
      </div>
      <p className="text-xs text-amber-600 mb-3">
        The following addresses were found across submitted documents and do not match:
      </p>
      <ul className="space-y-1.5">
        {items.map((addr, i) => (
          <li
            key={i}
            className="flex items-start gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2"
          >
            <span className="text-xs font-mono text-amber-500 flex-shrink-0 pt-px">#{i + 1}</span>
            <span className="text-xs text-slate-700">{addr}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Income Records Table ─────────────────────────────────────────────────────

function IncomeTable({ records }: { records: IncomeRecord[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">
              Income Type
            </th>
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">
              Employer
            </th>
            <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">
              Annual Amount
            </th>
            <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">
              YTD Amount
            </th>
            <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3">
              Tax Year
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {records.map((r) => (
            <tr key={r.id} className="group hover:bg-slate-50 transition-colors">
              <td className="py-3.5 pr-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-xs font-medium">
                  {r.incomeType}
                </span>
              </td>
              <td className="py-3.5 pr-4 text-slate-700 font-medium">
                {r.employer ?? <span className="text-slate-300">—</span>}
              </td>
              <td className="py-3.5 pr-4 text-right text-slate-900 font-bold tabular-nums">
                {fmt(r.annualAmount)}
              </td>
              <td className="py-3.5 pr-4 text-right text-slate-600 tabular-nums">
                {r.ytdAmount != null ? fmt(r.ytdAmount) : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-3.5 text-right text-slate-500 tabular-nums">
                {r.taxYear ?? <span className="text-slate-300">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-slate-200">
          <tr>
            <td colSpan={2} className="pt-3 text-xs text-slate-400 font-semibold uppercase tracking-wide">
              Total ({records.length} source{records.length !== 1 ? 's' : ''})
            </td>
            <td className="pt-3 text-right font-bold text-slate-900 tabular-nums">
              {fmt(records.reduce((s, r) => s + Number(r.annualAmount), 0))}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Account Records Table ────────────────────────────────────────────────────

function AccountTable({ records }: { records: AccountRecord[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">
              Institution
            </th>
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">
              Account Type
            </th>
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">
              Account
            </th>
            <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3">
              Balance
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {records.map((r) => {
            const typeCfg = ACCOUNT_TYPE_COLORS[r.accountType] ?? ACCOUNT_TYPE_COLORS['OTHER'];
            return (
              <tr key={r.id} className="group hover:bg-slate-50 transition-colors">
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: typeCfg.stroke }}
                    />
                    <span className="text-slate-700 font-medium">
                      {r.institution ?? <span className="text-slate-300 font-normal">Unknown</span>}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 pr-4">
                  <span className="text-xs font-medium text-slate-600 capitalize">
                    {typeCfg.label}
                  </span>
                </td>
                <td className="py-3.5 pr-4">
                  {r.accountNumber
                    ? <span className="font-mono text-xs text-slate-500">{r.accountNumber}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="py-3.5 text-right font-bold text-slate-900 tabular-nums">
                  {fmt(r.balance)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t border-slate-200">
          <tr>
            <td colSpan={3} className="pt-3 text-xs text-slate-400 font-semibold uppercase tracking-wide">
              Total ({records.length} account{records.length !== 1 ? 's' : ''})
            </td>
            <td className="pt-3 text-right font-bold text-slate-900 tabular-nums">
              {fmt(records.reduce((s, r) => s + Number(r.balance), 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ title, children, count }: { title: string; children: React.ReactNode; count?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</h2>
        {count != null && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Profile Content ──────────────────────────────────────────────────────────

function ProfileContent({ profile }: { profile: BorrowerProfile }) {
  const incomeRecords = profile.incomeRecords ?? [];
  const accountRecords = profile.accountRecords ?? [];
  const flags = profile.flags ?? [];
  const discrepancies = profile.addressDiscrepancies ?? [];

  const totalIncome = Number(profile.totalAnnualIncome);
  const totalAssets = Number(profile.totalAssets);
  const monthsCoverage =
    profile.totalAssets != null && profile.totalAnnualIncome != null && totalIncome > 0
      ? totalAssets / (totalIncome / 12)
      : null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Annual Income"
          value={fmt(profile.totalAnnualIncome)}
          sub={incomeRecords.length > 0 ? `${incomeRecords.length} source${incomeRecords.length !== 1 ? 's' : ''}` : undefined}
          accent="border-t-primary-500"
          iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          iconBg="bg-primary-50"
          iconColor="text-primary-600"
        />
        <KpiCard
          label="Total Assets"
          value={fmt(profile.totalAssets)}
          sub={accountRecords.length > 0 ? `${accountRecords.length} account${accountRecords.length !== 1 ? 's' : ''}` : undefined}
          accent="border-t-blue-500"
          iconPath="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KpiCard
          label="Months Coverage"
          value={monthsCoverage != null ? fmtNumber(monthsCoverage) : '—'}
          sub="Assets ÷ (Income / 12)"
          accent={
            monthsCoverage == null
              ? 'border-t-slate-300'
              : monthsCoverage >= 24
              ? 'border-t-primary-500'
              : monthsCoverage >= 12
              ? 'border-t-amber-400'
              : 'border-t-red-400'
          }
          iconPath="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          iconBg="bg-slate-50"
          iconColor="text-slate-500"
        />
        <KpiCard
          label="Income Sources"
          value={String(incomeRecords.length)}
          sub={flags.length > 0 ? `${flags.length} flag${flags.length !== 1 ? 's' : ''} raised` : 'No flags'}
          accent="border-t-amber-400"
          iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Review Flags ({flags.length})
          </h2>
          <div className="space-y-2">
            {flags.map((flag) => (
              <FlagCard key={flag} flag={flag} />
            ))}
          </div>
        </div>
      )}

      {/* Address Discrepancies */}
      {discrepancies.length > 0 && (
        <AddressDiscrepancies items={discrepancies} />
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Income Breakdown" count={incomeRecords.length}>
          <IncomeBarChart records={incomeRecords} />
        </Section>

        <Section title="Assets Breakdown" count={accountRecords.length}>
          <AssetsDonutChart records={accountRecords} />
        </Section>
      </div>

      {/* Income Records Table */}
      {incomeRecords.length > 0 && (
        <Section title="Income Records" count={incomeRecords.length}>
          <IncomeTable records={incomeRecords} />
        </Section>
      )}

      {/* Account Records Table */}
      {accountRecords.length > 0 && (
        <Section title="Account Records" count={accountRecords.length}>
          <AccountTable records={accountRecords} />
        </Section>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function BorrowerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { application: app, profile, isLoading, isFetching, error, refetch } = useApplication(id);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="h-4 bg-slate-100 animate-pulse rounded w-72" />
        <SkeletonPage />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </div>
    );
  }

  if (!app) return null;

  // ── Computed ───────────────────────────────────────────────────────────────
  const displayName = profile?.fullName ?? app.borrowerName ?? 'Unknown Borrower';
  const displayAddress = profile?.currentAddress;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
          <Link
            to="/"
            className="hover:text-slate-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Applications
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            to={`/applications/${id}`}
            className="hover:text-slate-600 transition-colors"
          >
            Application Detail
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-medium">Borrower Profile</span>
        </nav>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 truncate">{displayName}</h1>
              {profile?.isJointApplication && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Joint Application
                </span>
              )}
            </div>
            {displayAddress && (
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {displayAddress}
              </p>
            )}
            {profile?.coTaxpayerName && (
              <p className="text-xs text-slate-400 mt-0.5">
                Co-Taxpayer: <span className="font-medium text-slate-600">{profile.coTaxpayerName}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={refetch}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg
                className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </button>
            <StatusBadge status={app.status} />
            <Link
              to={`/applications/${id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all"
            >
              View Application
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Profile body or empty state */}
      {profile ? (
        <ProfileContent profile={profile} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No profile available yet</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            The borrower profile will be generated automatically once documents have been processed. Upload and process documents to see extraction results here.
          </p>
          <Link
            to={`/applications/${id}`}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Go to Application
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
