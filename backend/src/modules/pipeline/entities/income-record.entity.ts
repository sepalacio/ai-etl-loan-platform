import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IncomeType } from '../enums/pipeline.enums';
import { BorrowerProfile } from '../../applications/entities/borrower-profile.entity';
import { Document } from '../../documents/entities/document.entity';

@Entity('income_records')
export class IncomeRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BorrowerProfile, (profile) => profile.incomeRecords, {
    onDelete: 'CASCADE',
  })
  borrowerProfile!: BorrowerProfile;

  @Index('idx_income_records_borrower_profile_id')
  @Column()
  borrowerProfileId!: string;

  @ManyToOne(() => Document, (doc) => doc.incomeRecords, {
    onDelete: 'CASCADE',
  })
  sourceDocument!: Document;

  @Index('idx_income_records_source_document_id')
  @Column()
  sourceDocumentId!: string;

  @Column({ type: 'enum', enum: IncomeType })
  incomeType!: IncomeType;

  @Column({ type: 'int', nullable: true })
  taxYear?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  annualAmount!: number;

  /** Year-to-date gross — populated for pay stubs only */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  ytdAmount?: number;

  @Column({ nullable: true })
  employer?: string;

  @Column({ type: 'boolean', default: false })
  needsReview!: boolean;

  @Column({ type: 'float', nullable: true })
  confidence?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
