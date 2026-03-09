import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApplications } from '../hooks/useApplications';
import { StatusBadge } from '../components/StatusBadge';

function StatCard({
  label,
  value,
  accent,
  delay = 0,
}: {
  label: string;
  value: number;
  accent: string;
  delay?: number;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-2 ${accent} animate-[fade-up_0.3s_ease-out_both]`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function AnimatedBar({ pct }: { pct: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="h-1.5 w-24 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-primary-500 transition-[width] duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function LenderDashboard() {
  const { applications: apps, isLoading, error } = useApplications();

  const stats = {
    total: apps.length,
    pendingUpload: apps.filter((a) => a.status === 'PENDING_UPLOAD').length,
    inReview: apps.filter((a) => a.status === 'IN_REVIEW').length,
    complete: apps.filter((a) => a.status === 'COMPLETE').length,
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage loan applications and borrower documents</p>
        </div>
        <Link
          to="/applications/new"
          className="bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-800 active:scale-[0.97] transition-all"
        >
          + New Application
        </Link>
      </div>

      {/* Stats */}
      {!isLoading && !error && apps.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Total" value={stats.total} accent="border-t-slate-300" delay={0} />
          <StatCard label="Pending Upload" value={stats.pendingUpload} accent="border-t-slate-400" delay={60} />
          <StatCard label="In Review" value={stats.inReview} accent="border-t-review-500" delay={120} />
          <StatCard label="Complete" value={stats.complete} accent="border-t-primary-500" delay={180} />
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-12 justify-center">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading applications…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {!isLoading && !error && apps.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm py-16 text-center">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-600 text-sm font-medium">No applications yet</p>
          <p className="text-slate-400 text-xs mt-1 mb-4">Create your first application to get started</p>
          <Link to="/applications/new" className="text-sm text-primary-700 font-medium hover:underline">
            Create application
          </Link>
        </div>
      )}

      {apps.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Borrower</th>
                <th className="px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Loan Amount</th>
                <th className="px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Progress</th>
                <th className="px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Created</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((app, i) => (
                <tr
                  key={app.id}
                  className="hover:bg-slate-50 transition-colors animate-[fade-up_0.25s_ease-out_both]"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{app.borrowerName ?? '—'}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{app.borrowerEmail}</p>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-900 tabular-nums">
                    {app.requestedAmount != null ? `$${Number(app.requestedAmount).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <AnimatedBar pct={app.completionPct} />
                      <span className="text-slate-500 text-xs tabular-nums w-7">{app.completionPct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs tabular-nums">
                    {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link to={`/applications/${app.id}`} className="text-primary-700 hover:text-primary-900 text-xs font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
