import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateApplicationMutation } from '../store/api';
import { FieldError } from '../components/FieldError';
import { useAppDispatch } from '../store';
import { showToast } from '../store/lenderSlice';
import { parseApiError } from '../lib/apiError';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const labelClass = 'block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide';

function inputClass(hasError: boolean) {
  return `w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-shadow ${
    hasError ? 'border-red-400 bg-red-50' : 'border-slate-300'
  }`;
}

type FieldErrors = Partial<Record<'borrowerName' | 'borrowerEmail' | 'requestedAmount', string>>;

type ActionState =
  | { status: 'idle' }
  | { status: 'fieldError'; errors: FieldErrors }
  | { status: 'apiError'; message: string };

function validate(formData: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const name = (formData.get('borrowerName') as string).trim();
  const email = (formData.get('borrowerEmail') as string).trim();
  const amount = Number(formData.get('requestedAmount'));

  if (!name) errors.borrowerName = 'Borrower name is required.';
  if (!email) {
    errors.borrowerEmail = 'Email is required.';
  } else if (!EMAIL_RE.test(email)) {
    errors.borrowerEmail = 'Enter a valid email address.';
  }
  if (!formData.get('requestedAmount') || amount <= 0) {
    errors.requestedAmount = 'Enter a loan amount greater than 0.';
  }
  return errors;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-primary-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary-800 active:scale-[0.97] disabled:opacity-50 transition-all"
    >
      {pending ? 'Creating…' : 'Create Application'}
    </button>
  );
}

export function CreateApplication() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [createApplication] = useCreateApplicationMutation();

  const [state, formAction] = useActionState<ActionState, FormData>(
    async (_, formData) => {
      const errors = validate(formData);
      if (Object.keys(errors).length > 0) return { status: 'fieldError', errors };

      try {
        const app = await createApplication({
          borrowerName: (formData.get('borrowerName') as string).trim(),
          borrowerEmail: (formData.get('borrowerEmail') as string).trim(),
          requestedAmount: Number(formData.get('requestedAmount')),
          notes: (formData.get('notes') as string).trim() || undefined,
        }).unwrap();

        dispatch(showToast({ type: 'success', message: `Application created for ${app.borrowerName ?? app.borrowerEmail}` }));
        navigate(`/applications/${app.id}`);
        return { status: 'idle' };
      } catch (err: unknown) {
        const { status, message } = parseApiError(err);
        if (status === 409) {
          return { status: 'fieldError', errors: { borrowerEmail: message } };
        }
        return { status: 'apiError', message };
      }
    },
    { status: 'idle' },
  );

  const fe = state.status === 'fieldError' ? state.errors : {};

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Applications
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">New Application</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Create a loan application and share the upload link with the borrower.
        </p>
      </div>

      <form action={formAction} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 space-y-5">
        <div>
          <label className={labelClass}>Borrower Name</label>
          <input
            type="text"
            name="borrowerName"
            placeholder="Jane Smith"
            className={inputClass(!!fe.borrowerName)}
          />
          {fe.borrowerName && <FieldError message={fe.borrowerName} />}
        </div>

        <div>
          <label className={labelClass}>Borrower Email</label>
          <input
            type="text"
            name="borrowerEmail"
            placeholder="borrower@email.com"
            className={inputClass(!!fe.borrowerEmail)}
          />
          {fe.borrowerEmail && <FieldError message={fe.borrowerEmail} />}
        </div>

        <div>
          <label className={labelClass}>Requested Loan Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
            <input
              type="number"
              name="requestedAmount"
              placeholder="500,000"
              className={`${inputClass(!!fe.requestedAmount)} pl-7`}
            />
          </div>
          {fe.requestedAmount && <FieldError message={fe.requestedAmount} />}
        </div>

        <div>
          <label className={labelClass}>
            Notes{' '}
            <span className="text-slate-400 normal-case font-normal tracking-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any relevant context for this application…"
            className={`${inputClass(false)} resize-none`}
          />
        </div>

        {state.status === 'apiError' && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
            {state.message}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <SubmitButton />
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-slate-600 text-sm px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
