import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { LogoIcon } from '../components/Logo';
import { parseAxiosError } from '../lib/apiError';

const ACCEPTED_TYPES = [
  { label: 'Form 1040', sub: 'US Individual Income Tax Return' },
  { label: 'Bank Statement', sub: 'Checking, savings, or investment accounts' },
  { label: 'W-2', sub: 'Wage and Tax Statement' },
  { label: 'Pay Stub', sub: 'Most recent pay period' },
  { label: 'Verification of Income', sub: 'VOI letter from employer' },
  { label: 'Closing Disclosure', sub: 'TRID CD form' },
  { label: 'Letter of Explanation', sub: 'LOE for credit inquiries or gaps' },
  { label: 'ALTA Settlement Statement', sub: 'Title or settlement documentation' },
  { label: 'Form 1008', sub: 'Uniform Underwriting & Transmittal Summary' },
];

function FileIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

type TokenState = 'loading' | 'valid' | 'invalid';

export function BorrowerUpload() {
  const { token } = useParams<{ token: string }>();
  const [tokenState, setTokenState] = useState<TokenState>('loading');
  const [borrowerName, setBorrowerName] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) { setTokenState('invalid'); return; }
    axios.get<{ borrowerName: string }>(`/upload/${token}`)
      .then((res) => {
        setBorrowerName(res.data.borrowerName);
        setTokenState('valid');
      })
      .catch(() => setTokenState('invalid'));
  }, [token]);

  const MAX_FILES = 10;
  const MAX_FILE_SIZE_MB = 20;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;

    const pdfs = Array.from(incoming).filter(
      (f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'),
    );

    const oversized = pdfs.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      setError(`Files must be under ${MAX_FILE_SIZE_MB} MB: ${oversized.map((f) => f.name).join(', ')}`);
      return;
    }

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const toAdd = pdfs.filter((f) => !existing.has(f.name));
      if (prev.length + toAdd.length > MAX_FILES) {
        setError(`You can upload a maximum of ${MAX_FILES} files at once.`);
        return prev;
      }
      return [...prev, ...toAdd];
    });
  };

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleUpload = async () => {
    if (!files.length || !token) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      await axios.post(`/upload/${token}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploaded(true);
    } catch (err: unknown) {
      setError(parseAxiosError(err).message);
    } finally {
      setUploading(false);
    }
  };

  if (tokenState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Invalid upload link</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            This link is invalid or has already been used. Please contact your lender to request a new one.
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-6 flex items-center gap-1.5">
          <LogoIcon size={16} />
          Secured by LoanPro
        </p>
      </div>
    );
  }

  if (uploaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Documents received
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Your documents have been securely submitted. Your lender will be
            notified and will follow up with next steps. You can close this page.
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-6 flex items-center gap-1.5">
          <LogoIcon size={16} />
          Secured by LoanPro
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoIcon size={26} />
          <span className="text-sm font-semibold text-slate-900 tracking-tight">LoanPro</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-full">
          <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
          Secure upload
        </span>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-2xl">
          {/* Hero text */}
          <div className="mb-8">

            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              {borrowerName ? `Hi ${borrowerName.split(' ')[0]}, your lender needs a few documents` : 'Upload your loan documents'}
            </h1>
            <p className="text-slate-500 text-sm">
              Your lender has requested the documents listed below. Upload PDF
              files using the area below — your information is encrypted in transit
              and at rest.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Upload panel */}
            <div className="lg:col-span-3 space-y-4">
              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 bg-white'
                }`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Drop PDFs here or{' '}
                  <span className="text-primary-700 hover:underline">browse files</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF files only · Multiple files accepted</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>

              {/* File list */}
              {files.length > 0 && (
                <ul className="space-y-2">
                  {files.map((f) => (
                    <li
                      key={f.name}
                      className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm"
                    >
                      <FileIcon />
                      <span className="text-sm text-slate-700 flex-1 truncate">{f.name}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {(f.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        onClick={() => removeFile(f.name)}
                        className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 ml-1"
                        aria-label="Remove file"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="w-full bg-primary-700 text-white text-sm font-medium py-3 rounded-xl hover:bg-primary-800 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Uploading…
                  </span>
                ) : files.length > 0 ? (
                  `Submit ${files.length} file${files.length > 1 ? 's' : ''}`
                ) : (
                  'Select files to upload'
                )}
              </button>

              {/* Security note */}
              <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Files are encrypted with AES-256 and stored securely
              </p>
            </div>

            {/* Accepted documents sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Accepted Documents
                </p>
                <ul className="space-y-3">
                  {ACCEPTED_TYPES.map((t) => (
                    <li key={t.label} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">{t.label}</p>
                        <p className="text-xs text-slate-400">{t.sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
