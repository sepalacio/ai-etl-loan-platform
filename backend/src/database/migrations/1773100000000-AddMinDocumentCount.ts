import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMinDocumentCount1773100000000 implements MigrationInterface {
  name = 'AddMinDocumentCount1773100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan_applications" ADD COLUMN IF NOT EXISTS "minDocumentCount" integer NOT NULL DEFAULT 5`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan_applications" DROP COLUMN IF EXISTS "minDocumentCount"`,
    );
  }
}
