import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  DocumentStatus,
  DocumentType,
  ParsePath,
} from '../enums/document.enums';
import { LoanApplication } from '../../applications/entities/loan-application.entity';
import { IncomeRecord } from '../../pipeline/entities/income-record.entity';
import { AccountRecord } from '../../pipeline/entities/account-record.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => LoanApplication, (app) => app.documents, {
    onDelete: 'CASCADE',
  })
  application!: LoanApplication;

  @Index('idx_documents_application_id')
  @Column()
  applicationId!: string;

  @Column()
  originalFilename!: string;

  @Column()
  s3Key!: string;

  /** SHA-256 of the file content — required for duplicate detection.
   *  Always set at E1 (upload) before any pipeline step runs. */
  @Index('idx_documents_content_hash')
  @Column()
  contentHash!: string;

  @Index('idx_documents_status')
  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status!: DocumentStatus;

  @Column({ type: 'enum', enum: DocumentType, nullable: true })
  documentType?: DocumentType;

  @Column({ type: 'enum', enum: ParsePath, nullable: true })
  parsePath?: ParsePath;

  @Column({ type: 'float', nullable: true })
  classificationConfidence?: number;

  @Column({ type: 'text', nullable: true })
  rawText?: string;

  /** Raw JSON from the LLM — stored before L1 to allow replay without re-calling the LLM */
  @Column({ type: 'jsonb', nullable: true })
  rawLlmJson?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  extractedData?: Record<string, unknown>;

  @Column({ nullable: true })
  failureReason?: string;

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  /** Pipeline step at which the document failed (e.g. 'CLASSIFYING', 'EXTRACTING') */
  @Column({ nullable: true })
  failedAtStep?: string;

  /** Timestamp of the last retry attempt — used by the cron to avoid hammering a stuck document */
  @Column({ type: 'timestamptz', nullable: true })
  lastAttemptedAt?: Date;

  @OneToMany(() => IncomeRecord, (record) => record.sourceDocument)
  incomeRecords!: IncomeRecord[];

  @OneToMany(() => AccountRecord, (record) => record.sourceDocument)
  accountRecords!: AccountRecord[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
