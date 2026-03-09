import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ApplicationStatus } from './enums/application.enums';
import { DocumentStatus } from '../documents/enums/document.enums';
import { LoanApplication } from './entities/loan-application.entity';
import { Document } from '../documents/entities/document.entity';
import { BorrowerProfile } from './entities/borrower-profile.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EncryptionService } from '../../common/crypto/encryption.service';
import { S3Service } from '../../common/s3/s3.service';
import { AppLogger } from '../../common/logger/app.logger';

@Injectable()
export class ApplicationsService {
  private readonly logger = new AppLogger(ApplicationsService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly appRepo: Repository<LoanApplication>,
    @InjectRepository(BorrowerProfile)
    private readonly profileRepo: Repository<BorrowerProfile>,
    private readonly notifications: NotificationsService,
    private readonly encryption: EncryptionService,
    private readonly s3: S3Service,
  ) {}

  async create(
    lenderEmail: string,
    dto: CreateApplicationDto,
  ): Promise<LoanApplication> {
    const existing = await this.appRepo.findOne({
      where: { lenderEmail, borrowerEmail: dto.borrowerEmail },
    });
    if (existing) {
      throw new ConflictException({
        error: 'APPLICATION_EXISTS',
        message: `There is already an application for ${dto.borrowerEmail}`,
      });
    }

    const uploadToken = uuidv4();
    const application = this.appRepo.create({
      lenderEmail,
      borrowerEmail: dto.borrowerEmail,
      borrowerName: dto.borrowerName,
      requestedAmount: dto.requestedAmount,
      notes: dto.notes,
      uploadToken,
      status: ApplicationStatus.PENDING_UPLOAD,
      minDocumentCount: dto.minDocumentCount ?? 5,
    });
    await this.appRepo.save(application);

    // L3: Send upload link to borrower
    await this.notifications.sendUploadInvitation(application);

    this.logger.log(
      `Application created: ${application.id}`,
      ApplicationsService.name,
    );
    return application;
  }

  async findAll(lenderEmail: string): Promise<LoanApplication[]> {
    return this.appRepo.find({
      where: { lenderEmail },
      relations: ['documents'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, lenderEmail: string): Promise<LoanApplication> {
    const app = await this.appRepo.findOne({
      where: { id, lenderEmail },
      relations: ['documents'],
    });
    if (!app)
      throw new NotFoundException({
        error: 'APPLICATION_NOT_FOUND',
        message: 'No application found for the given id',
      });
    return app;
  }

  async findByToken(token: string): Promise<LoanApplication> {
    const app = await this.appRepo.findOne({
      where: { uploadToken: token },
      relations: ['documents'],
    });
    if (!app)
      throw new NotFoundException({
        error: 'INVALID_UPLOAD_TOKEN',
        message: 'Upload token does not match any active application',
      });
    return app;
  }

  async getBorrowerProfile(
    applicationId: string,
    lenderEmail: string,
  ): Promise<BorrowerProfile | null> {
    const app = await this.findOne(applicationId, lenderEmail);
    const profile = await this.profileRepo.findOne({
      where: { applicationId: app.id },
      relations: ['incomeRecords', 'accountRecords'],
    });
    if (!profile) return null;

    // Decrypt PII fields before returning. Gracefully handles legacy plaintext rows
    // (stored before encryption was introduced) by returning the value as-is on failure.
    const dec = (v?: string) => {
      if (!v) return v;
      try {
        return this.encryption.decrypt(v);
      } catch {
        return v;
      }
    };
    profile.fullName = dec(profile.fullName);
    profile.coTaxpayerName = dec(profile.coTaxpayerName);
    profile.currentAddress = dec(profile.currentAddress);

    // Mask account numbers — decrypt then keep only last 4 digits
    for (const account of profile.accountRecords ?? []) {
      if (account.accountNumber) {
        const plain = dec(account.accountNumber) ?? '';
        const digits = plain.replace(/\D/g, '');
        account.accountNumber =
          digits.length >= 4 ? `••••${digits.slice(-4)}` : `••••`;
      }
    }

    return profile;
  }

  async getDocumentDownloadUrl(
    applicationId: string,
    documentId: string,
    lenderEmail: string,
  ): Promise<{ url: string }> {
    const app = await this.findOne(applicationId, lenderEmail);
    const doc = (app.documents ?? []).find((d) => d.id === documentId);
    if (!doc) {
      throw new NotFoundException({
        error: 'DOCUMENT_NOT_FOUND',
        message: 'Document not found for this application',
      });
    }
    const url = await this.s3.getSignedDownloadUrl(
      doc.s3Key,
      doc.originalFilename,
    );
    return { url };
  }

  async updateStatus(applicationId: string): Promise<void> {
    const app = await this.appRepo.findOne({
      where: { id: applicationId },
      relations: ['documents'],
    });
    if (!app) return;

    const docs = app.documents ?? [];
    if (docs.length === 0) return;

    const terminalStatuses = [DocumentStatus.COMPLETE, DocumentStatus.FAILED];
    const allSettled = docs.every((d: Document) =>
      terminalStatuses.includes(d.status),
    );
    const allComplete = docs.every(
      (d: Document) => d.status === DocumentStatus.COMPLETE,
    );
    const anyFailed = docs.some(
      (d: Document) => d.status === DocumentStatus.FAILED,
    );
    const minMet = docs.length >= (app.minDocumentCount ?? 5);

    if (allComplete && minMet) {
      app.status = ApplicationStatus.COMPLETE;
      await this.appRepo.save(app);
      const profile = await this.profileRepo.findOne({
        where: { applicationId: app.id },
      });
      await this.notifications.sendExtractionComplete(
        app,
        profile?.flags ?? [],
      );
    } else if (allSettled && anyFailed) {
      // Only mark the application FAILED once every document has finished —
      // a single failing doc mid-batch should not close the application to new uploads
      app.status = ApplicationStatus.FAILED;
      await this.appRepo.save(app);
    } else {
      app.status = ApplicationStatus.IN_REVIEW;
      await this.appRepo.save(app);
    }
  }
}
