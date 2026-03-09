import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApplication } from '../hooks/useApplication';
import type { BorrowerProfile } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';

const FLAG_LABELS: Record<string, string> = {
  JOINT_APPLICATION_DETECTED: 'Joint application detected — co-taxpayer name has been populated',
  ADDRESS_DISCREPANCY: 'Conflicting addresses found across submitted documents',
  INCOME_VARIANCE: 'Income amounts vary across documents — manual review recommended',
  LOW_EXTRACTION_CONFIDENCE: 'Low AI extraction confidence on one or more documents',
  MISSING_SSN: 'SSN was not found in any submitted document',
};

function fmt(amount: number | undefined | null) {
  if (amount == null) return '—';
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">{title}</h2>;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function BorrowerProfileSection({ profile }: { profile: BorrowerProfile }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <SectionHeader title="Borrower Profile" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5 mb-6">
        <Field label="Full Name" value={profile.fullName ?? '—'} />
        <Field label="Current Address" value={profile.currentAddress ?? '—'} />
        <Field label="Joint Application" value={profile.isJointApplication ? 'Yes' : 'No'} />
        <Field label="Total Annual Income" value={<span className="text-primary-700">{fmt(profile.totalAnnualIncome)}</span>} />
        <Field label="Total Assets" value={<span className="text-primary-700">{fmt(profile.totalAssets)}</span>} />
        {profile.coTaxpayerName && <Field label="Co-Taxpayer" value={profile.coTaxpayerName} />}
      </div>

      {profile.addressDiscrepancies && profile.addressDiscrepancies.length > 0 && (
        <div className="mb-6 pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">Address Discrepancies</p>
          <ul className="space-y-1">
            {profile.addressDiscrepancies.map((d, i) => (
              <li key={i} className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">{d}</li>
            ))}
          </ul>
        </div>
      )}

      {profile.incomeRecords && profile.incomeRecords.length > 0 && (
        <div className="mb-6 pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-3">Income Records</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Employer</th>
                <th className="pb-2 font-medium text-right">Annual</th>
                <th className="pb-2 font-medium text-right">YTD</th>
                <th className="pb-2 font-medium text-right">Tax Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {profile.incomeRecords.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 text-slate-500">{r.incomeType}</td>
                  <td className="py-2 text-slate-700">{r.employer ?? '—'}</td>
                  <td className="py-2 text-slate-900 font-semibold text-right tabular-nums">{fmt(r.annualAmount)}</td>
                  <td className="py-2 text-slate-600 text-right tabular-nums">{r.ytdAmount != null ? fmt(r.ytdAmount) : '—'}</td>
                  <td className="py-2 text-slate-500 text-right tabular-nums">{r.taxYear ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {profile.accountRecords && profile.accountRecords.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-3">Account Records</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-medium">Institution</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {profile.accountRecords.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 text-slate-700">{r.institution ?? '—'}</td>
                  <td className="py-2 text-slate-500 capitalize">{r.accountType.toLowerCase()}</td>
                  <td className="py-2 text-slate-900 font-semibold text-right tabular-nums">{fmt(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { application: app, profile, isLoading, error } = useApplication(id);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (!app) return;
    const url = `${window.location.origin}/upload/${app.uploadToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm py-12 justify-center">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading…
      </div>
    );
  }
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>;
  if (!app) return null;

  const uploadUrl = `${window.location.origin}/upload/${app.uploadToken}`;
  const flags = profile?.flags ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Applications
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{app.borrowerName ?? 'Unnamed Borrower'}</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {app.borrowerEmail}
              <span className="mx-2 text-slate-300">·</span>
              <span className="font-mono text-xs">{app.id.slice(0, 8)}…</span>
            </p>
          </div>
          <StatusBadge status={app.status} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Requested Amount', value: fmt(app.requestedAmount), accent: 'border-t-primary-500' },
          {
            label: 'Documents Processed',
            value: `${app.completionPct}%`,
            accent: app.completionPct === 100 ? 'border-t-primary-500' : 'border-t-amber-400',
          },
          {
            label: 'Created',
            value: new Date(app.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            accent: 'border-t-slate-300',
          },
        ].map(({ label, value, accent }) => (
          <div key={label} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-2 ${accent}`}>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
            <p className="text-xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Upload link */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 mb-0.5">Borrower Upload Link</p>
          <p className="text-sm text-slate-700 truncate font-mono">{uploadUrl}</p>
        </div>
        <button
          onClick={copyLink}
          className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all shrink-0 ${
            copied ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Review Flags</p>
          {flags.map((flag) => (
            <div key={flag} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span className="text-sm text-amber-800">{FLAG_LABELS[flag] ?? flag}</span>
            </div>
          ))}
        </div>
      )}

      {profile && <BorrowerProfileSection profile={profile} />}

      {/* Documents */}
      {app.documents && app.documents.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <SectionHeader title={`Documents (${app.documents.length})`} />
          <div className="divide-y divide-slate-100">
            {app.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{doc.originalFilename}</p>
                    {doc.documentType && <p className="text-xs text-slate-400 mt-0.5">{doc.documentType.replace(/_/g, ' ')}</p>}
                    {doc.failureReason && <p className="text-xs text-red-500 mt-0.5">{doc.failureReason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  {doc.classificationConfidence != null && (
                    <span className="text-xs text-slate-400 tabular-nums">{Math.round(doc.classificationConfidence * 100)}% conf.</span>
                  )}
                  <StatusBadge status={doc.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
