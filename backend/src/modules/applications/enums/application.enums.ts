export enum ApplicationStatus {
  PENDING_UPLOAD = 'PENDING_UPLOAD',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export enum BorrowerFlag {
  /** Form 1040 joint filing detected — co-taxpayer name populated */
  JOINT_APPLICATION_DETECTED = 'JOINT_APPLICATION_DETECTED',
  /** Conflicting addresses found across documents — see addressDiscrepancies */
  ADDRESS_DISCREPANCY = 'ADDRESS_DISCREPANCY',
  /** Same income appears with different amounts across documents */
  INCOME_VARIANCE = 'INCOME_VARIANCE',
  /** One or more extracted fields had confidence below 0.75 */
  LOW_EXTRACTION_CONFIDENCE = 'LOW_EXTRACTION_CONFIDENCE',
  /** SSN was not found in any submitted document */
  MISSING_SSN = 'MISSING_SSN',
}
