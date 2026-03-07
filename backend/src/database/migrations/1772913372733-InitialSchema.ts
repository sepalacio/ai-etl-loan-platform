import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1772913372733 implements MigrationInterface {
  name = 'InitialSchema1772913372733';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."account_records_accounttype_enum" AS ENUM('CHECKING', 'SAVINGS', 'INVESTMENT', 'RETIREMENT', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "account_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "borrowerProfileId" uuid NOT NULL, "sourceDocumentId" uuid NOT NULL, "institution" character varying, "accountType" "public"."account_records_accounttype_enum" NOT NULL, "accountNumber" character varying, "balance" numeric(15,2), "statementDate" date, "statementPeriodStart" date, "statementPeriodEnd" date, "needsReview" boolean NOT NULL DEFAULT false, "confidence" double precision, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1c5eaa583cfe891092b67a2703e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_account_records_borrower_profile_id" ON "account_records" ("borrowerProfileId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_account_records_source_document_id" ON "account_records" ("sourceDocumentId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."income_records_incometype_enum" AS ENUM('W2', 'SELF_EMPLOYMENT', 'RENTAL', 'PENSION', 'SOCIAL_SECURITY', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "income_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "borrowerProfileId" uuid NOT NULL, "sourceDocumentId" uuid NOT NULL, "incomeType" "public"."income_records_incometype_enum" NOT NULL, "taxYear" integer, "annualAmount" numeric(15,2) NOT NULL, "ytdAmount" numeric(15,2), "employer" character varying, "needsReview" boolean NOT NULL DEFAULT false, "confidence" double precision, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4ac197a85317ab0af01c7fa19e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_income_records_borrower_profile_id" ON "income_records" ("borrowerProfileId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_income_records_source_document_id" ON "income_records" ("sourceDocumentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP COLUMN "lastFailedStep"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" DROP COLUMN "ssnEncrypted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" DROP COLUMN "dobEncrypted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" DROP COLUMN "primaryAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" DROP COLUMN "incomeSources"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" DROP COLUMN "bankAccounts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "failedAtStep" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "lastAttemptedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_applications" ADD "completionPct" double precision NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" ADD "coTaxpayerName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" ADD "ssn" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" ADD "dob" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" ADD "currentAddress" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "contentHash" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_documents_application_id" ON "documents" ("applicationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_documents_content_hash" ON "documents" ("contentHash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_documents_status" ON "documents" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_applications_lender_email" ON "loan_applications" ("lenderEmail") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_applications_status" ON "loan_applications" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_borrower_profiles_application_id" ON "borrower_profiles" ("applicationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "account_records" ADD CONSTRAINT "FK_e701816651671144a9911279cff" FOREIGN KEY ("borrowerProfileId") REFERENCES "borrower_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_records" ADD CONSTRAINT "FK_c77a0971e05f0b18f67f64cb3db" FOREIGN KEY ("sourceDocumentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_records" ADD CONSTRAINT "FK_f29cc79734c4324dab40ff9d11e" FOREIGN KEY ("borrowerProfileId") REFERENCES "borrower_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_records" ADD CONSTRAINT "FK_0dc255961883b0bb41d18bce7f4" FOREIGN KEY ("sourceDocumentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "income_records" DROP CONSTRAINT "FK_0dc255961883b0bb41d18bce7f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "income_records" DROP CONSTRAINT "FK_f29cc79734c4324dab40ff9d11e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_records" DROP CONSTRAINT "FK_c77a0971e05f0b18f67f64cb3db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_records" DROP CONSTRAINT "FK_e701816651671144a9911279cff"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_borrower_profiles_application_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_applications_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_applications_lender_email"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_documents_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_documents_content_hash"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_documents_application_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "contentHash" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" DROP COLUMN "currentAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" DROP COLUMN "dob"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" DROP COLUMN "ssn"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" DROP COLUMN "coTaxpayerName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_applications" DROP COLUMN "completionPct"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP COLUMN "lastAttemptedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP COLUMN "failedAtStep"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" ADD "bankAccounts" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" ADD "incomeSources" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" ADD "primaryAddress" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" ADD "dobEncrypted" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrower_profiles" ADD "ssnEncrypted" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD "lastFailedStep" character varying`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_income_records_source_document_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_income_records_borrower_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "income_records"`);
    await queryRunner.query(
      `DROP TYPE "public"."income_records_incometype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_account_records_source_document_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_account_records_borrower_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "account_records"`);
    await queryRunner.query(
      `DROP TYPE "public"."account_records_accounttype_enum"`,
    );
  }
}
