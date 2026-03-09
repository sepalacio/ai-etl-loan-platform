/**
 * All known error codes emitted by the backend GlobalExceptionFilter.
 * Each entry owns the user-facing copy — the backend message is never shown directly.
 */
export const API_ERROR_MESSAGES: Record<string, string> = {
  // Applications
  APPLICATION_EXISTS:
    'An application for this borrower already exists. Check the dashboard for the existing one.',
  APPLICATION_NOT_FOUND:
    'This application could not be found. It may have been deleted.',

  // Upload / Documents
  INVALID_UPLOAD_TOKEN:
    'This upload link is invalid or has already been used. Contact your lender to request a new one.',
  INVALID_FILE_TYPE:
    'Only PDF files are accepted. Please check your selection and try again.',
  NO_FILES:
    'No files were received. Please select at least one PDF and try again.',
  FILE_TOO_LARGE:
    'One or more files exceed the 25 MB size limit. Please reduce the file size and try again.',
  CORRUPTED_FILE:
    'One or more files could not be read as valid PDFs. Please check the files and try again.',
  APPLICATION_CLOSED:
    'This application is no longer accepting documents. Please contact your lender.',
  DUPLICATE_DOCUMENT:
    'One or more files have already been uploaded for this application.',

  // Auth / identity
  MISSING_LENDER_EMAIL:
    'Your session is missing a valid email. Please sign out and sign back in.',

  // Input / routing
  INVALID_UUID:
    'The requested resource identifier is invalid.',

  // Generic fallbacks
  INTERNAL_ERROR:
    'An unexpected error occurred on our end. Please try again in a moment.',
  NOT_FOUND:
    'The requested resource was not found.',
};

const FALLBACK_BY_STATUS: Record<number, string> = {
  400: 'The request could not be processed. Please review your input.',
  401: 'You are not authorised to perform this action.',
  403: 'Access denied.',
  404: API_ERROR_MESSAGES.NOT_FOUND,
  409: 'A conflict was detected. Please refresh and try again.',
  422: 'The submitted data is invalid. Please review the form.',
  500: API_ERROR_MESSAGES.INTERNAL_ERROR,
  503: 'The service is temporarily unavailable. Please try again shortly.',
};

/** Shape returned by the backend GlobalExceptionFilter */
interface BackendError {
  error?: { code?: string; message?: string };
}

interface RtkError {
  status?: number;
  data?: BackendError;
}

export interface ParsedApiError {
  code: string;
  status: number;
  message: string;
}

/** RTK Query rejection (err.data contains the backend body) */
export function parseApiError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): ParsedApiError {
  const e = err as RtkError;
  const status = e?.status ?? 500;
  const code = e?.data?.error?.code ?? 'INTERNAL_ERROR';
  const message = API_ERROR_MESSAGES[code] ?? FALLBACK_BY_STATUS[status] ?? fallback;
  return { code, status, message };
}

/** Axios rejection (err.response.data contains the backend body) */
export function parseAxiosError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): ParsedApiError {
  const e = err as { response?: { status?: number; data?: BackendError } };
  const status = e?.response?.status ?? 500;
  const code = e?.response?.data?.error?.code ?? 'INTERNAL_ERROR';
  const message = API_ERROR_MESSAGES[code] ?? FALLBACK_BY_STATUS[status] ?? fallback;
  return { code, status, message };
}
