import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueLenderBorrowerEmail1773024009851 implements MigrationInterface {
  name = 'AddUniqueLenderBorrowerEmail1773024009851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan_applications" ADD CONSTRAINT "uq_applications_lender_borrower_email" UNIQUE ("lenderEmail", "borrowerEmail")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan_applications" DROP CONSTRAINT "uq_applications_lender_borrower_email"`,
    );
  }
}
