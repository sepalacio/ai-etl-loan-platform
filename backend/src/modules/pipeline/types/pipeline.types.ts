import { DocumentType } from '../../documents/enums/document.enums';

/**
 * Document types that require vision-based parsing (base64 PDF → Anthropic)
 * rather than plain text extraction. Add new types here as they are supported.
 */
export const VISION_TYPES = new Set<DocumentType>([
  DocumentType.FORM_1040,
  DocumentType.CLOSING_DISCLOSURE,
  DocumentType.UUTS,
  DocumentType.PAY_STUB,
  DocumentType.W2,
]);
