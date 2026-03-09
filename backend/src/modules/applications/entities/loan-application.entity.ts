import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicationStatus } from '../enums/application.enums';
import { Document } from '../../documents/entities/document.entity';

@Entity('loan_applications')
@Unique('uq_applications_lender_borrower_email', [
  'lenderEmail',
  'borrowerEmail',
])
export class LoanApplication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Unique token scoped to the borrower upload portal URL */
  @Column({ unique: true })
  uploadToken!: string;

  /** Email of the lender (sales rep) who created the application.
   *  Stored as a plain string — there is no User entity in this implementation.
   *  Natural extension: replace with a lenderId FK once an auth layer is added. */
  @Index('idx_applications_lender_email')
  @Column()
  lenderEmail!: string;

  /** Borrower email — PII, encrypted at the service layer */
  @Column()
  borrowerEmail!: string;

  @Column({ nullable: true })
  borrowerName?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  requestedAmount?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Index('idx_applications_status')
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING_UPLOAD,
  })
  status!: ApplicationStatus;

  /** Minimum number of documents the lender requires before the application
   *  can be automatically marked COMPLETE.  Defaults to 1 (any single completed
   *  document triggers completion) but should be set by the lender at creation. */
  @Column({ type: 'int', default: 5 })
  minDocumentCount!: number;

  /** Ratio of COMPLETE documents to total expected types (0.0 – 1.0).
   *  Recalculated at pipeline step L2 after each document completes. */
  @Column({ type: 'float', default: 0 })
  completionPct!: number;

  @OneToMany(() => Document, (doc) => doc.application, { cascade: true })
  documents!: Document[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
