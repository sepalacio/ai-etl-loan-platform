import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1772913372733 implements MigrationInterface {
  name = 'InitialSchema1772913372733';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Enums ────────────────────────────────────────────────────────────────

    await queryRunner.query(
      `CREATE TYPE "public"."loan_applications_status_enum" AS ENUM('PENDING_UPLOAD', 'IN_REVIEW', 'COMPLETE', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_status_enum" AS ENUM('PENDING', 'UPLOADING', 'CLASSIFYING', 'PARSING', 'EXTRACTING', 'VALIDATING', 'RESOLVING', 'LOADING', 'COMPLETE', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_documenttype_enum" AS ENUM('FORM_1040', 'BANK_STATEMENT', 'CLOSING_DISCLOSURE', 'UUTS', 'VOI', 'LETTER_OF_EXPLANATION', 'PAY_STUB', 'ALTA_TITLE', 'W2', 'UNKNOWN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documents_parsepath_enum" AS ENUM('TEXT', 'VISION')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."account_records_accounttype_enum" AS ENUM('CHECKING', 'SAVINGS', 'INVESTMENT', 'RETIREMENT', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."income_records_incometype_enum" AS ENUM('W2', 'SELF_EMPLOYMENT', 'RENTAL', 'PENSION', 'SOCIAL_SECURITY', 'OTHER')`,
    );

    // ── Tables (dependency order) ─────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "loan_applications" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "uploadToken"      character varying NOT NULL,
        "lenderEmail"      character varying NOT NULL,
        "borrowerEmail"    character varying NOT NULL,
        "borrowerName"     character varying,
        "requestedAmount"  numeric(15,2),
        "notes"            text,
        "status"           "public"."loan_applications_status_enum" NOT NULL DEFAULT 'PENDING_UPLOAD',
        "minDocumentCount" integer NOT NULL DEFAULT 5,
        "completionPct"    double precision NOT NULL DEFAULT 0,
        "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_loan_applications_upload_token" UNIQUE ("uploadToken"),
        CONSTRAINT "PK_loan_applications" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_applications_lender_email" ON "loan_applications" ("lenderEmail")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_applications_status" ON "loan_applications" ("status")`,
    );

    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id"                       uuid NOT NULL DEFAULT uuid_generate_v4(),
        "applicationId"            uuid NOT NULL,
        "originalFilename"         character varying NOT NULL,
        "s3Key"                    character varying NOT NULL,
        "contentHash"              character varying NOT NULL,
        "status"                   "public"."documents_status_enum" NOT NULL DEFAULT 'PENDING',
        "documentType"             "public"."documents_documenttype_enum",
        "parsePath"                "public"."documents_parsepath_enum",
        "classificationConfidence" double precision,
        "rawText"                  text,
        "rawLlmJson"               jsonb,
        "extractedData"            jsonb,
        "failureReason"            character varying,
        "retryCount"               integer NOT NULL DEFAULT 0,
        "failedAtStep"             character varying,
        "lastAttemptedAt"          TIMESTAMP WITH TIME ZONE,
        "createdAt"                TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"                TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_documents_application_id" ON "documents" ("applicationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_documents_content_hash" ON "documents" ("contentHash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_documents_status" ON "documents" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_documents_application" FOREIGN KEY ("applicationId") REFERENCES "loan_applications"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(`
      CREATE TABLE "borrower_profiles" (
        "id"                   uuid NOT NULL DEFAULT uuid_generate_v4(),
        "applicationId"        uuid NOT NULL,
        "fullName"             character varying,
        "coTaxpayerName"       character varying,
        "ssn"                  character varying,
        "dob"                  character varying,
        "currentAddress"       character varying,
        "totalAnnualIncome"    numeric(15,2),
        "totalAssets"          numeric(15,2),
        "isJointApplication"   boolean NOT NULL DEFAULT false,
        "addressDiscrepancies" jsonb,
        "flags"                jsonb,
        "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_borrower_profiles" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_borrower_profiles_application_id" ON "borrower_profiles" ("applicationId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" ADD CONSTRAINT "FK_borrower_profiles_application" FOREIGN KEY ("applicationId") REFERENCES "loan_applications"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(`
      CREATE TABLE "account_records" (
        "id"                   uuid NOT NULL DEFAULT uuid_generate_v4(),
        "borrowerProfileId"    uuid NOT NULL,
        "sourceDocumentId"     uuid NOT NULL,
        "institution"          character varying,
        "accountType"          "public"."account_records_accounttype_enum" NOT NULL,
        "accountNumber"        character varying,
        "balance"              numeric(15,2),
        "statementDate"        date,
        "statementPeriodStart" date,
        "statementPeriodEnd"   date,
        "needsReview"          boolean NOT NULL DEFAULT false,
        "confidence"           double precision,
        "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_account_records" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_account_records_borrower_profile_id" ON "account_records" ("borrowerProfileId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_account_records_source_document_id" ON "account_records" ("sourceDocumentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_records" ADD CONSTRAINT "FK_account_records_borrower_profile" FOREIGN KEY ("borrowerProfileId") REFERENCES "borrower_profiles"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_records" ADD CONSTRAINT "FK_account_records_source_document" FOREIGN KEY ("sourceDocumentId") REFERENCES "documents"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(`
      CREATE TABLE "income_records" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "borrowerProfileId" uuid NOT NULL,
        "sourceDocumentId"  uuid NOT NULL,
        "incomeType"        "public"."income_records_incometype_enum" NOT NULL,
        "taxYear"           integer,
        "annualAmount"      numeric(15,2) NOT NULL,
        "ytdAmount"         numeric(15,2),
        "employer"          character varying,
        "needsReview"       boolean NOT NULL DEFAULT false,
        "confidence"        double precision,
        "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_income_records" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_income_records_borrower_profile_id" ON "income_records" ("borrowerProfileId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_income_records_source_document_id" ON "income_records" ("sourceDocumentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_records" ADD CONSTRAINT "FK_income_records_borrower_profile" FOREIGN KEY ("borrowerProfileId") REFERENCES "borrower_profiles"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_records" ADD CONSTRAINT "FK_income_records_source_document" FOREIGN KEY ("sourceDocumentId") REFERENCES "documents"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "income_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "account_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "borrower_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "loan_applications"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."income_records_incometype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."account_records_accounttype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."documents_parsepath_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."documents_documenttype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."documents_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."loan_applications_status_enum"`);
  }
}
