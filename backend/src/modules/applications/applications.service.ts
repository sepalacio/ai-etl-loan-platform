import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  async create(
    lenderEmail: string,
    dto: CreateApplicationDto,
  ): Promise<LoanApplication> {
    const uploadToken = uuidv4();
    const application = this.appRepo.create({
      lenderEmail,
      borrowerEmail: dto.borrowerEmail,
      borrowerName: dto.borrowerName,
      requestedAmount: dto.requestedAmount,
      notes: dto.notes,
      uploadToken,
      status: ApplicationStatus.PENDING_UPLOAD,
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
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async findByToken(token: string): Promise<LoanApplication> {
    const app = await this.appRepo.findOne({
      where: { uploadToken: token },
      relations: ['documents'],
    });
    if (!app) throw new NotFoundException('Invalid or expired upload token');
    return app;
  }

  async getBorrowerProfile(
    applicationId: string,
    lenderEmail: string,
  ): Promise<BorrowerProfile | null> {
    const app = await this.findOne(applicationId, lenderEmail);
    return this.profileRepo.findOne({ where: { applicationId: app.id } });
  }

  async updateStatus(applicationId: string): Promise<void> {
    const app = await this.appRepo.findOne({
      where: { id: applicationId },
      relations: ['documents'],
    });
    if (!app) return;

    const docs = app.documents ?? [];
    if (docs.length === 0) return;

    const allComplete = docs.every(
      (d: Document) => d.status === DocumentStatus.COMPLETE,
    );
    const anyFailed = docs.some(
      (d: Document) => d.status === DocumentStatus.FAILED,
    );

    if (allComplete) {
      app.status = ApplicationStatus.COMPLETE;
      await this.appRepo.save(app);
      const profile = await this.profileRepo.findOne({
        where: { applicationId: app.id },
      });
      await this.notifications.sendExtractionComplete(
        app,
        profile?.flags ?? [],
      );
    } else if (anyFailed) {
      app.status = ApplicationStatus.FAILED;
      await this.appRepo.save(app);
    } else {
      app.status = ApplicationStatus.IN_REVIEW;
      await this.appRepo.save(app);
    }
  }
}
