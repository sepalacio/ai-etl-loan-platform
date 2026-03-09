import { useState } from 'react';
import { useAppDispatch } from '../store';
import { setEmail } from '../store/lenderSlice';
import { Logo } from './Logo';
import { FieldError } from './FieldError';
import ilustration from '../assets/ilustration.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LenderEmailPrompt() {
  const dispatch = useAppDispatch();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!value.trim()) {
      setError('Email is required.');
      return;
    }
    if (!EMAIL_RE.test(value.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    dispatch(setEmail(value.trim()));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — 65% — illustration */}
      <div className="hidden lg:flex w-[65%] bg-linear-to-br from-nav via-primary-900 to-nav-800 items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(52,211,153,0.12),transparent_65%)]" />

        <div className="relative z-10 flex flex-col items-center gap-10 max-w-lg w-full">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-white leading-snug">LoanPro</h1>
            <p className="text-primary-300/80 text-sm mt-3 leading-relaxed">
              AI-powered loan document<br />extraction
            </p>
          </div>

          <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-2xl ring-1 ring-white/10">
            <img src={ilustration} alt="Financial document processing illustration" className="w-full rounded-2xl" />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {['Document classification', 'Structured extraction', 'Borrower profiling', 'Flag detection'].map((f) => (
              <span key={f} className="text-xs text-primary-200 bg-primary-900/60 border border-primary-700/50 px-3 py-1.5 rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — 35% — form */}
      <div className="flex-1 lg:w-[35%] flex flex-col bg-white px-8">
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-xs animate-[fade-up_0.35s_ease-out]">
            <div className="mb-8">
              <Logo className="text-slate-900 mb-6" />
              <h2 className="text-lg font-semibold text-slate-900">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to manage loan applications.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                  Work Email
                </label>
                <input
                  type="text"
                  autoFocus
                  className={`w-full border rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-shadow ${
                    error ? 'border-red-400 bg-red-50' : 'border-slate-300'
                  }`}
                  placeholder="you@company.com"
                  value={value}
                  onChange={(e) => { setValue(e.target.value); if (error) setError(''); }}
                />
                {error && <FieldError message={error} />}
              </div>

              <button
                type="submit"
                className="w-full bg-primary-700 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-800 active:scale-[0.97] transition-all"
              >
                Continue
              </button>
            </form>
          </div>
        </div>

        <div className="pb-8 flex justify-center">
          <p className="text-xs text-slate-300">LoanPro · AI-powered loan document extraction</p>
        </div>
      </div>
    </div>
  );
}
