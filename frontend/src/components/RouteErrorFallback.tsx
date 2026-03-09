interface Props {
  error: Error;
}

export function RouteErrorFallback({ error }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-10 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary-800 active:scale-[0.97] transition-all"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
