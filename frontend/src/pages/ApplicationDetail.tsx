import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApplication } from '../hooks/useApplication';
import { StatusBadge } from '../components/StatusBadge';
import { useLazyGetDocumentDownloadUrlQuery } from '../store/api';

function fmt(amount: number | undefined | null) {
  if (amount == null) return '—';
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">{title}</h2>;
}

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { application: app, isLoading, isFetching, error, refetch } = useApplication(id);
  const [copied, setCopied] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [fetchDownloadUrl] = useLazyGetDocumentDownloadUrlQuery();

  const handleDownload = async (docId: string, filename: string) => {
    if (!id) return;
    setDownloadingDocId(docId);
    try {
      const { data } = await fetchDownloadUrl({ applicationId: id, docId });
      if (data?.url) {
        const a = document.createElement('a');
        a.href = data.url;
        a.download = filename;
        a.click();
      }
    } finally {
      setDownloadingDocId(null);
    }
  };

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

  const totalDocs = app.documents?.length ?? 0;
  const completeDocs = app.documents?.filter((d) => d.status === 'COMPLETE').length ?? 0;

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
          <div className="flex items-center gap-2">
            {app.status !== 'PENDING_UPLOAD' && (
              <Link
                to={`/applications/${app.id}/profile`}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-secondary-700 hover:bg-secondary-800 text-white transition-all whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                See Profile
              </Link>
            )}
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
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </button>
            <StatusBadge status={app.status} />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-2 border-t-primary-500">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Requested Amount</p>
          <p className="text-xl font-semibold text-slate-900">{fmt(app.requestedAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-2 border-t-amber-400">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Docs Uploaded</p>
          <p className="text-xl font-semibold text-slate-900">{totalDocs === 0 ? '—' : totalDocs}</p>
        </div>
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-2 ${completeDocs === totalDocs && totalDocs > 0 ? 'border-t-primary-500' : 'border-t-slate-300'}`}>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Docs Processed</p>
          <p className="text-xl font-semibold text-slate-900">
            {totalDocs === 0 ? '—' : `${completeDocs} of ${totalDocs}`}
          </p>
          {app.minDocumentCount > 1 && totalDocs < app.minDocumentCount && (
            <p className="text-xs text-amber-600 mt-1">{app.minDocumentCount - totalDocs} more required</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-2 border-t-slate-300">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Created</p>
          <p className="text-xl font-semibold text-slate-900">
            {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
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
                    {doc.failureReason && (
                      <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                        {doc.failedAtStep && (
                          <span className="font-mono bg-red-50 border border-red-100 px-1 py-0.5 rounded text-red-400">
                            {doc.failedAtStep}
                          </span>
                        )}
                        {doc.failureReason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {doc.classificationConfidence != null && (
                    <span className="text-xs text-slate-400 tabular-nums">{Math.round(doc.classificationConfidence * 100)}% conf.</span>
                  )}
                  <StatusBadge status={doc.status} />
                  <button
                    onClick={() => handleDownload(doc.id, doc.originalFilename)}
                    disabled={downloadingDocId === doc.id}
                    title="Download original file"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all"
                  >
                    {downloadingDocId === doc.id ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
