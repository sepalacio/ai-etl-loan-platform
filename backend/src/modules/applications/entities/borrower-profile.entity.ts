import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BorrowerFlag } from '../enums/application.enums';
import { LoanApplication } from './loan-application.entity';
import { IncomeRecord } from '../../pipeline/entities/income-record.entity';
import { AccountRecord } from '../../pipeline/entities/account-record.entity';

/**
 * Unified borrower record assembled across all processed documents.
 * PII fields (ssn, dob, currentAddress) are encrypted at rest via AES-256-GCM
 * (see EncryptionService). Encryption/decryption is handled in the service layer.
 *
 * Income and account data live in their own tables (income_records, account_records)
 * with per-row source_document_id for full provenance tracing.
 */
@Entity('borrower_profiles')
export class BorrowerProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => LoanApplication, { onDelete: 'CASCADE' })
  @JoinColumn()
  application!: LoanApplication;

  @Index('idx_borrower_profiles_application_id')
  @Column()
  applicationId!: string;

  // ─── Identity (PII — encrypted at service layer) ──────────────────────────

  @Column({ nullable: true })
  fullName?: string;

  /** Co-taxpayer name from joint Form 1040 filings */
  @Column({ nullable: true })
  coTaxpayerName?: string;

  /** Social Security Number — stored encrypted */
  @Column({ nullable: true })
  ssn?: string;

  /** Date of birth — stored encrypted */
  @Column({ nullable: true })
  dob?: string;

  /** Borrower's current residential address — extracted from personal identity documents */
  @Column({ nullable: true })
  currentAddress?: string;

  // ─── Financial summaries (plaintext — required for SQL-level aggregations) ─

  /** Sum of all income_records.annual_amount for this borrower */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalAnnualIncome?: number;

  /** Sum of all account_records.balance for this borrower */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalAssets?: number;

  // ─── Flags and discrepancies ──────────────────────────────────────────────

  @Column({ type: 'boolean', default: false })
  isJointApplication!: boolean;

  /** Addresses found across documents that differ from currentAddress */
  @Column({ type: 'jsonb', nullable: true })
  addressDiscrepancies?: string[];

  /** Pipeline-generated semantic flags about the borrower record */
  @Column({ type: 'jsonb', nullable: true })
  flags?: BorrowerFlag[];

  // ─── Relations ────────────────────────────────────────────────────────────

  @OneToMany(() => IncomeRecord, (record) => record.borrowerProfile)
  incomeRecords!: IncomeRecord[];

  @OneToMany(() => AccountRecord, (record) => record.borrowerProfile)
  accountRecords!: AccountRecord[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
