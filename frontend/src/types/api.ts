export type ApplicationStatus = 'PENDING_UPLOAD' | 'IN_REVIEW' | 'COMPLETE' | 'FAILED';

export type DocumentStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'CLASSIFYING'
  | 'PARSING'
  | 'EXTRACTING'
  | 'VALIDATING'
  | 'RESOLVING'
  | 'LOADING'
  | 'COMPLETE'
  | 'FAILED';

export type DocumentType =
  | 'FORM_1040'
  | 'BANK_STATEMENT'
  | 'CLOSING_DISCLOSURE'
  | 'UUTS'
  | 'VOI'
  | 'LETTER_OF_EXPLANATION'
  | 'PAY_STUB'
  | 'ALTA_TITLE'
  | 'W2'
  | 'UNKNOWN';

export type BorrowerFlag =
  | 'JOINT_APPLICATION_DETECTED'
  | 'ADDRESS_DISCREPANCY'
  | 'INCOME_VARIANCE'
  | 'LOW_EXTRACTION_CONFIDENCE'
  | 'MISSING_SSN';

export interface LoanDocument {
  id: string;
  applicationId: string;
  originalFilename: string;
  status: DocumentStatus;
  documentType?: DocumentType;
  classificationConfidence?: number;
  extractedData?: Record<string, unknown>;
  failureReason?: string;
  retryCount: number;
  failedAtStep?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanApplication {
  id: string;
  uploadToken: string;
  lenderEmail: string;
  borrowerEmail: string;
  borrowerName?: string;
  requestedAmount?: number;
  notes?: string;
  status: ApplicationStatus;
  completionPct: number;
  documents?: LoanDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface IncomeRecord {
  id: string;
  borrowerProfileId: string;
  sourceDocumentId: string;
  incomeType: string;
  annualAmount: number;
  ytdAmount?: number;
  employer?: string;
  taxYear?: number;
  createdAt: string;
}

export interface AccountRecord {
  id: string;
  borrowerProfileId: string;
  sourceDocumentId: string;
  institution?: string;
  accountType: string;
  balance: number;
  createdAt: string;
}

export interface BorrowerProfile {
  id: string;
  applicationId: string;
  fullName?: string;
  coTaxpayerName?: string;
  currentAddress?: string;
  totalAnnualIncome?: number;
  totalAssets?: number;
  isJointApplication: boolean;
  addressDiscrepancies?: string[];
  flags?: BorrowerFlag[];
  incomeRecords?: IncomeRecord[];
  accountRecords?: AccountRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationDto {
  borrowerName: string;
  borrowerEmail: string;
  requestedAmount: number;
  notes?: string;
}
