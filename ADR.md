# Architecture Decision Records

This document captures the key technical decisions made during the design and implementation of this system. Each record includes the context, the decision, the rationale, and the trade-offs considered.
---

## ADR-001: Document Corpus Selection — Loan Documents

**Date:** 2026-03-06
**Status:** Accepted

### Context

The assignment provided two document corpora to choose from:

- **Loan Documents** — 10 PDF files of varying types (tax returns, bank statements, and others). Each file has a distinct format, structure, and information density.
- **Zoning Meeting Minutes** — 6 PDF files from the same municipal board. Files share a consistent schema: meeting header, agenda items, variance cases, and vote records.

The assignment's stated goals are to handle *"variable formatting, mixed file types, and structured data embedded within unstructured text"* and to demonstrate an *"approach for handling document format variability."*

### Decision

The **Loan Documents** corpus was selected.

### Rationale

**Format variability is the core technical requirement.**
The loan corpus contains fundamentally heterogeneous document types — each with its own layout, field conventions, and noise characteristics. A robust system must apply different parsing strategies per document type and reconcile data across them. The zoning corpus, despite having 6 files, reduces to a single extraction template applied repeatedly. It does not exercise the variability the assignment is designed to evaluate.

**The extraction challenge is meaningfully harder.**
IRS Form 1040 PDFs, when parsed, produce severely scrambled text — field labels and values are interleaved, rows are out of sequence, and multi-column layouts collapse unpredictably. Structured extraction from this type of input requires LLM-based reasoning, not pattern matching. This is a more honest demonstration of the system's capabilities.

**Cross-document entity resolution is a first-class concern.**
The required output is a unified structured record per borrower, sourced from multiple document types. The system must perform entity resolution — determining that a name appearing on a Form 1040 refers to the same individual as on a bank statement — and produce a merged record with traceable provenance per field. This is a non-trivial pipeline design problem absent from the zoning option.

**PII handling demonstrates production-oriented design.**
The loan documents contain sensitive fields: names, Social Security Numbers, addresses, income figures, and account numbers. Designing extraction with explicit source attribution, field-level provenance, and awareness of data sensitivity reflects the production mindset the role requires. The provided sample documents use synthetic data and are explicitly marked *"For Demo Purposes Only"*, making this safe to implement.

### Trade-offs

The zoning corpus would have supported a richer temporal query interface — tracking votes and decisions per board member across meetings enables trend analysis and aggregation queries that are architecturally interesting. That interface is foregone here in favor of a system that better demonstrates the extraction and normalization challenges central to the assignment.

---

## ADR-002: Technology Stack

**Date:** 2026-03-06
**Status:** Accepted

### Context

The assignment grants full autonomy over the technology stack. The primary constraints are: delivery within 4–8 hours, production-minded design, and a full-stack implementation covering ingestion, extraction, storage, and a query interface.

### Decision

| Layer | Technology |
|---|---|
| Backend | NestJS + TypeScript |
| ORM | TypeORM |
| Database | PostgreSQL |
| File storage | AWS S3 |
| PDF text extraction | pdf-parse |
| PDF vision | Anthropic native PDF document API (base64) |
| LLM — classification | claude-haiku-4-5 |
| LLM — extraction | claude-sonnet-4-6 |
| Email | Resend |
| Frontend | React + Vite + TypeScript |
| Containerization | Docker + docker-compose |

### Rationale

**NestJS framework.**
NestJS provides a structured module system that maps cleanly to the pipeline stages (ingestion, extraction, resolution, query), enforces separation of concerns without boilerplate, and has first-class TypeScript support throughout.

**PostgreSQL + TypeORM.**
The output is highly relational: borrowers have many documents, documents produce many income records and account records, each record references its source document. A relational model with foreign keys and source attribution columns is the correct fit. TypeORM integrates natively with NestJS and supports schema migrations.

**AWS S3 for file storage.**
Original documents must be preserved independently of the extraction pipeline. S3 provides durable, scalable object storage decoupled from the processing layer. Files are written once on upload and never reprocessed — the extracted structured data lives in PostgreSQL.

**Dual PDF parsing strategy.**
Two extraction paths are used based on document complexity, determined at classification time:
- `pdf-parse` (text extraction) for documents with clean, linear text (bank statements, letters, simple forms). Fast, zero LLM cost at the parsing stage.
- Anthropic native PDF document API for complex, multi-column, or form-based documents (IRS Form 1040, W-2). The PDF is sent as a base64-encoded document directly to Claude, which reads it visually without intermediate image conversion. This eliminates the need for system-level dependencies (Ghostscript, ImageMagick) and produces more accurate results on heavily formatted inputs.

**LLM model tiering — Haiku for classification, Sonnet for extraction.**
Classification is a low-complexity routing decision (identify document type from limited content). `claude-haiku-4-5` handles this accurately at significantly lower cost and latency. Structured extraction requires reasoning over noisy, complex layouts; `claude-sonnet-4-6` is used here for accuracy. This tiering reduces LLM cost without sacrificing extraction quality.

**Anthropic prompt caching over file-persistence APIs.**
An alternative considered was using OpenAI's Assistants API with file storage to avoid "re-sending tokens on every prompt." This pattern is optimized for repeated queries over the same document (RAG-style retrieval). In this system, each document is processed exactly once — upload, extract, store results, never re-query the LLM. There is no repeated token cost to avoid. Anthropic's prompt caching is used instead to cache system prompts and extraction schemas across calls of the same document type, reducing cost on the portions of the prompt that are static.

**React + Vite (no Next.js) for the frontend.**
The frontend is a single-page application with two views: the lender dashboard and the borrower upload portal. There are no server-rendering, SEO, or API-route requirements that would justify Next.js. Vite provides a faster development build cycle and a simpler configuration surface.

### LLM Provider Cost Analysis

Pricing as of March 2026. All prices in USD per million tokens.

#### Base model pricing

| Model | Provider | Input | Output | Best for |
|---|---|---|---|---|
| claude-haiku-4-5 | Anthropic | $1.00 | $5.00 | Classification (our choice) |
| claude-sonnet-4-6 | Anthropic | $3.00 | $15.00 | Extraction (our choice) |
| claude-opus-4-6 | Anthropic | $5.00 | $25.00 | (not used) |
| gpt-4o-mini | OpenAI | $0.15 | $0.60 | Classification alternative |
| gpt-4.1-mini | OpenAI | $0.40 | $1.60 | Classification alternative |
| gpt-4o | OpenAI | $2.50 | $10.00 | Extraction alternative |
| gpt-4.1 | OpenAI | $2.00 | $8.00 | Extraction alternative |

#### Prompt caching pricing

| Provider | Cache write | Cache read | Mechanism |
|---|---|---|---|
| Anthropic (Haiku) | $1.25/M (1.25× input) | $0.10/M (0.1× input) | Explicit breakpoints, 5-min or 1-hour TTL |
| Anthropic (Sonnet) | $3.75/M (1.25× input) | $0.30/M (0.1× input) | Explicit breakpoints, 5-min or 1-hour TTL |
| OpenAI (gpt-4o-mini) | No charge | $0.075/M | Automatic, no developer control |
| OpenAI (gpt-4o) | No charge | $1.25/M | Automatic, no developer control |
| OpenAI (gpt-4.1) | No charge | $0.50/M | Automatic, no developer control |

#### Batch API (async, 50% discount both providers)

| Model | Batch Input | Batch Output |
|---|---|---|
| claude-haiku-4-5 | $0.50/M | $2.50/M |
| claude-sonnet-4-6 | $1.50/M | $7.50/M |
| gpt-4o-mini | $0.075/M | $0.30/M |
| gpt-4o | $1.25/M | $5.00/M |
| gpt-4.1 | $1.00/M | $4.00/M |

#### Estimated cost per 10-document loan application

Token assumptions per document: Classification ~1,500 input + 100 output. Extraction (text path) ~3,000 input + 700 output. Extraction (vision/PDF path) ~7,000 input + 800 output. Mixed average ~5,000 input + 750 output.

| Stack | Classification (10 docs) | Extraction (10 docs) | Total / application | With prompt caching |
|---|---|---|---|---|
| **Haiku + Sonnet (our choice)** | $0.016 | $0.263 | **$0.279** | **~$0.19** |
| gpt-4o-mini + gpt-4o | $0.002 | $0.200 | $0.202 | ~$0.16 |
| gpt-4o-mini + gpt-4.1 | $0.002 | $0.160 | $0.162 | ~$0.13 |
| Haiku + Sonnet (Batch API) | $0.008 | $0.131 | $0.139 | — |

#### Why Anthropic over OpenAI despite higher base price

**Native PDF document support.** Claude accepts PDFs as a first-class document type — the full file is sent directly and Claude reads it visually. OpenAI's vision API requires converting PDF pages to images first, adding a pre-processing step, system dependencies (Ghostscript), and additional tokens per image. For our 10-document corpus with 4 complex form types (1040, W-2, pay stub, closing disclosure), this is a meaningful implementation difference.

**Extraction accuracy on complex financial forms.** Claude Sonnet consistently outperforms GPT-4o on structured extraction from multi-column, form-based documents (IRS forms, mortgage disclosures) in independent benchmarks. For a system where extraction accuracy directly determines data quality, the per-application cost premium (~$0.08 over gpt-4o-mini + gpt-4.1) is justified.

**Explicit prompt caching control.** Anthropic's caching requires explicit cache breakpoints, which means we control exactly what is cached (system prompts, extraction schemas) and for how long. OpenAI's automatic caching gives no developer control over what is cached or evicted.

**Single-provider dependency.** Using one provider for both classification and extraction simplifies credential management, rate limit handling, error handling, and future model upgrades.

### Trade-offs

| Volume | Our stack (Haiku + Sonnet) | OpenAI (mini + 4.1) | Delta |
|---|---|---|---|
| 100 applications | $27.90 | $16.20 | +$11.70 |
| 1,000 applications | $279 | $162 | +$117 |
| 10,000 applications | $2,790 | $1,620 | +$1,170 |
---

At 10,000 applications/month the delta is $1,170/month; well within acceptable range for a B2B SaaS with per-application pricing. Switching to Anthropic Batch API at scale reduces our cost to $1,390/month, narrowing the gap further.

---

## ADR-003: Product Workflow — Two-Sided Loan Application Model

**Date:** 2026-03-06
**Status:** Accepted

### Context

The assignment requires a document ingestion pipeline and a query interface. The minimal interpretation is a file upload endpoint and a retrieval API. A more complete interpretation models how these documents actually flow in practice.

### Decision

The system is designed as a two-sided workflow:

- **Lender side (dashboard):** A sales representative creates a loan application, captures the borrower's email address, and monitors application status and extracted data.
- **Borrower side (upload portal):** The borrower receives an email with a unique upload link (token-scoped URL), uploads their documents through a dedicated portal, and sees upload progress.

The organizing entity is the **Application**, not the Document. A loan application has a borrower, a set of documents, a status, and a completion percentage.

### Rationale

In practice, loan document packages are not submitted by lenders — they are collected from borrowers across multiple touchpoints. Modeling this as a two-sided workflow reflects the real operational context, demonstrates understanding of multi-party document coordination (directly relevant to the role), and produces a more meaningful demo than a single-sided upload API.

Email delivery is implemented with Resend (transactional email API). Short URLs are implemented as UUID-scoped routes (`/upload/:token`). Authentication and multi-tenancy are noted as natural extensions in the system design document.

### Trade-offs

The two-sided model adds scope to the frontend and API layers. This is managed by keeping both portals intentionally simple — the borrower portal is a single upload screen, and the lender dashboard focuses on status and extracted data rather than case management features.

---

## ADR-004: ETL Pipeline Design

**Date:** 2026-03-06
**Status:** Accepted

### Decision

The pipeline consists of eight sequential steps executed per document upon upload:

| Step | Name | Tool | Description |
|---|---|---|---|
| E1 | Upload | `@aws-sdk/client-s3` | File stored in S3. Document record created in PostgreSQL with S3 key, filename, and application reference. |
| E2 | Classify | `claude-haiku-4-5` | First page content sent to LLM. Returns `document_type` (`form_1040`, `w2`, `bank_statement`, `pay_stub`, etc.) and confidence score. |
| E3A | Parse — text | `pdf-parse` | Applied to simple, linear documents. Extracts raw text for LLM input. |
| E3B | Parse — vision | Anthropic PDF document API | Applied to complex, structured forms. PDF sent as base64 document. Claude reads the layout visually. |
| T1 | Extract | `claude-sonnet-4-6` | Type-specific extraction prompt with JSON schema output. Returns structured fields, values, and per-field confidence scores. |
| T2 | Validate | Custom NestJS service | Field-level validation rules (SSN format, income > 0, required fields, date plausibility). Low-confidence or invalid fields are flagged, not discarded. |
| T3 | Resolve | PostgreSQL + TypeORM | Borrower identity matched across documents using name + address + SSN last 4. Existing borrower updated or new borrower created. |
| L1 | Load | TypeORM | Structured data written to `borrowers`, `income_records`, `account_records`. Every field carries a `source_document_id` for full provenance. |
| L2 | Status update | NestJS service | Application `completion_pct` recalculated. Status advanced (`pending` → `uploading` → `processing` → `complete`). |
| L3 | Notify | Resend | Completion notification sent to lender rep when pipeline finishes. |

### Rationale

The pipeline is deliberately linear per document to keep failure isolation clean — if extraction fails on one document, it does not affect others. Validation flags rather than rejects uncertain extractions, preserving partial data with an audit trail. Entity resolution runs after extraction (not before) because borrower identity is derived from document content, not pre-declared.

---

## ADR-005: File Validation, Document Relevance, and Error Handling

**Date:** 2026-03-06
**Status:** Accepted

### Context

The borrower upload portal accepts files from an end user with no assumed technical sophistication. The backend processes those files through S3, an LLM, and a database. The system must handle invalid inputs, irrelevant documents, and internal failures without leaking implementation details or producing inconsistent error shapes.

### Decision

**Validation is applied in two layers:**

**Layer 1 — Frontend (UX gate, not a security boundary)**
- File type check: MIME type and extension must be `application/pdf` / `.pdf`
- File size check: maximum 25 MB enforced before upload begins
- At least one file selected before form submission is allowed
- Errors displayed inline; upload never begins if validation fails

**Layer 2 — Backend (authoritative gate)**
- Magic bytes verification: file content must begin with `%PDF-` — MIME type from the client is not trusted
- File size re-enforced server-side (cannot be bypassed by the client)
- SHA-256 content hash computed on receipt; checked against existing documents in the same application. A matching hash returns `409 DUPLICATE_DOCUMENT` and halts the pipeline before any S3 write or LLM call
- Files passing all checks are written to S3 before pipeline execution begins

**Document relevance validation (post-classification)**

After the LLM classifier runs (step E2), two paths:
- `confidence >= 0.75` and `document_type` is in the supported list → pipeline continues to extraction
- `confidence < 0.75` or `document_type = 'unknown'` → document stored in S3, status set to `UNRECOGNIZED`, flagged in the lender dashboard as requiring attention, not counted toward application `completion_pct`

This is a soft gate. The document is preserved; the borrower is not blocked from completing their upload. The lender is responsible for resolving unrecognized documents.

**Supported document types:** `form_1040`, `w2`, `bank_statement`, `pay_stub`, `closing_disclosure`, `verification_of_income`, `letter_of_explanation`, `title_insurance`, `underwriting_summary`

**Standardized error envelope**

Every error response from the API conforms to a single shape:

```json
{
  "error": {
    "code": "DUPLICATE_DOCUMENT",
    "message": "This document has already been uploaded to this application.",
    "details": {}
  }
}
```

`code` is a stable, machine-readable string. `message` is safe to display to end users. `details` is optional and contains only safe, structured context (e.g., `existing_document_id`). Stack traces, database query text, S3 bucket names, LLM API errors, and internal file paths are never included in responses.

**Error codes:**

| Code | HTTP Status | Trigger |
|---|---|---|
| `UNSUPPORTED_FILE_TYPE` | 400 | File is not a PDF (magic bytes or extension) |
| `FILE_TOO_LARGE` | 413 | File exceeds 25 MB |
| `CORRUPTED_FILE` | 400 | PDF header present but file cannot be parsed |
| `DUPLICATE_DOCUMENT` | 409 | SHA-256 hash matches existing document in same application |
| `UNRECOGNIZED_DOCUMENT` | 422 | Valid PDF, classifier returned unknown type or low confidence |
| `APPLICATION_NOT_FOUND` | 404 | Application ID does not exist |
| `INVALID_UPLOAD_TOKEN` | 401 | Upload token expired or not found |
| `APPLICATION_CLOSED` | 409 | Application has already been processed and closed |
| `EXTRACTION_FAILED` | 422 | LLM completed but could not produce usable structured output |
| `VALIDATION_ERROR` | 400 | Request body failed schema validation (field names safe to expose) |
| `INTERNAL_ERROR` | 500 | All unhandled exceptions — no internal detail exposed |

**Implementation: single global exception filter in NestJS**

A single `@Catch()` filter intercepts all exceptions before they reach the response. Known business exceptions (custom classes) are passed through with their code and message. `HttpException` instances are mapped to the standard envelope. All other exceptions are logged internally with full context and returned to the client as `INTERNAL_ERROR` with no detail.

### Rationale

A consistent error envelope means the frontend can be written with a single error handler rather than per-endpoint parsing logic. Separating `code` (machine-readable) from `message` (human-readable) allows the frontend to branch on error type without string matching. Suppressing internal detail from 500 responses prevents information disclosure without requiring per-handler sanitization — the filter handles it unconditionally.

The soft gate on unrecognized documents (store but flag, do not block) reflects real-world behavior: borrowers sometimes upload the wrong file. Blocking the upload entirely would require them to contact support to proceed. Flagging and continuing keeps the borrower portal functional while alerting the lender to resolve the issue.

### Trade-offs

Content hashing adds a DB read on every upload. At the scale of this system (single application, handful of documents) this is negligible. At 100x scale, the hash index on the documents table keeps this O(1).

---

## ADR-006: PII Encryption at the Field Level

**Date:** 2026-03-06
**Status:** Accepted

### Context

The system extracts and stores personally identifiable information from loan documents: full names, Social Security Numbers (masked), addresses, phone numbers, email addresses, and financial account numbers. This data is stored in PostgreSQL. A database backup, snapshot, or misconfigured read replica would expose all of this data in plaintext without an additional protection layer.

### Decision

All PII fields are encrypted at the application layer before being written to the database, using **AES-256-GCM** with a per-value random IV. Encryption is applied explicitly in the service layer via an injected `EncryptionService`. The database stores only ciphertext for PII columns.

**Implementation note:** TypeORM `ValueTransformer` was considered for transparent encryption at the ORM layer but not used. Transformers are static decoration metadata with no access to the NestJS DI container — they cannot inject `EncryptionService`, which holds the encryption key via `ConfigService`. The production path is a TypeORM `@EventSubscriber` hooking into `beforeInsert`, `beforeUpdate`, and `afterLoad` lifecycle events, which has full DI access and enforces encryption transparently without per-call-site responsibility.

**Encrypted fields:**

| Table | Fields |
|---|---|
| `borrower_profiles` | `ssn`, `dob` |
| `applications` | `borrower_email` |
| `account_records` | `account_number` |
| `documents` | `rawLlmJson` (may contain PII from LLM response) |

**Key management:** `PII_ENCRYPTION_KEY` environment variable in development. AWS KMS-derived data encryption key in production.

**Logger redaction:** The NestJS logger is replaced with a custom logger that applies pattern-based redaction (SSN, email, phone) and key-based redaction (known PII field names) before any log entry is written. Raw LLM responses are never logged. This ensures application logs are safe to forward to third-party aggregators without PII exposure.

### Rationale

**Application-level over database-level encryption.** PostgreSQL's `pgcrypto` extension encrypts at the query layer, which means the key must be passed with every query and is visible in query logs. Application-level encryption keeps the key entirely outside the database and its logs.

**Field-level over full-disk encryption.** Full-disk or tablespace encryption (Transparent Data Encryption) protects against physical disk theft but not against application-level access or DB credential compromise. Field-level encryption ensures that even with direct database access, PII remains unreadable without the application key.

**AES-256-GCM over AES-256-CBC.** GCM mode provides authenticated encryption — the integrity of the ciphertext is verified on decryption. Tampered ciphertext is rejected rather than silently decrypted into garbage data.

**Plaintext fields.** Income amounts, balances, dates, and tax years are stored in plaintext. These are required for SQL-level range queries and aggregations. Encrypting them would force full-table decryption in application memory before filtering — incompatible with efficient queries at any scale. These fields carry financial sensitivity but not direct personal identifiability.

### Trade-offs

Encrypted fields cannot be searched or indexed directly. Borrower lookup by name requires either decrypting all rows (not acceptable at scale) or maintaining a separate deterministic HMAC of the name for lookup purposes. In this system, all lookups are by `borrower_id` or `application_id`, so this limitation does not affect the current query interface. If name-based search is required in a future version, an HMAC index column can be added without changing the encryption scheme.

---
