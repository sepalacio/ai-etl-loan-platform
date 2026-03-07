import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountType } from '../enums/pipeline.enums';
import { BorrowerProfile } from '../../applications/entities/borrower-profile.entity';
import { Document } from '../../documents/entities/document.entity';

@Entity('account_records')
export class AccountRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BorrowerProfile, (profile) => profile.accountRecords, {
    onDelete: 'CASCADE',
  })
  borrowerProfile!: BorrowerProfile;

  @Index('idx_account_records_borrower_profile_id')
  @Column()
  borrowerProfileId!: string;

  @ManyToOne(() => Document, (doc) => doc.accountRecords, {
    onDelete: 'CASCADE',
  })
  sourceDocument!: Document;

  @Index('idx_account_records_source_document_id')
  @Column()
  sourceDocumentId!: string;

  @Column({ nullable: true })
  institution?: string;

  @Column({ type: 'enum', enum: AccountType })
  accountType!: AccountType;

  /** Masked account number — stored encrypted via EncryptionService */
  @Column({ nullable: true })
  accountNumber?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  balance?: number;

  @Column({ type: 'date', nullable: true })
  statementDate?: Date;

  @Column({ type: 'date', nullable: true })
  statementPeriodStart?: Date;

  @Column({ type: 'date', nullable: true })
  statementPeriodEnd?: Date;

  @Column({ type: 'boolean', default: false })
  needsReview!: boolean;

  @Column({ type: 'float', nullable: true })
  confidence?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
