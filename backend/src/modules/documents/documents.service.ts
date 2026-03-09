import * as crypto from 'crypto';
import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ApplicationsService } from '../applications/applications.service';
import { PipelineService } from '../pipeline/pipeline.service';
import { Document } from './entities/document.entity';
import { DocumentStatus } from './enums/document.enums';
import { ApplicationStatus } from '../applications/enums/application.enums';
import { LoanApplication } from '../applications/entities/loan-application.entity';
import { DuplicateDocumentException } from './exceptions/duplicate-document.exception';
import { S3Service } from '../../common/s3/s3.service';
import { AppLogger } from '../../common/logger/app.logger';

const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

interface IngestResult {
  filename: string;
  documentId?: string;
  duplicate: boolean;
  existingId?: string;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new AppLogger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
    private readonly s3: S3Service,
    private readonly applicationsService: ApplicationsService,
    private readonly pipeline: PipelineService,
  ) {}

  async ingestFiles(
    token: string,
    files: Express.Multer.File[],
  ): Promise<IngestResult[]> {
    const application = await this.applicationsService.findByToken(token);

    if (
      application.status === ApplicationStatus.COMPLETE ||
      application.status === ApplicationStatus.FAILED
    ) {
      throw new UnprocessableEntityException({
        error: 'APPLICATION_CLOSED',
        message: `Application is already ${application.status.toLowerCase()} and no longer accepts uploads`,
      });
    }

    const results: IngestResult[] = [];

    for (const file of files) {
      try {
        const doc = await this.uploadToS3(
          application,
          file.buffer,
          file.originalname,
          file.mimetype,
        );

        results.push({
          filename: file.originalname,
          documentId: doc.id,
          duplicate: false,
        });

        // Fire-and-forget pipeline; errors are caught inside processDocument
        void this.pipeline
          .processDocument(doc.id)
          .catch((err: Error) =>
            this.logger.error(
              `Background pipeline error: ${err.message}`,
              DocumentsService.name,
            ),
          );
      } catch (err) {
        if (err instanceof DuplicateDocumentException) {
          const body = err.getResponse() as { existingId: string };
          results.push({
            filename: file.originalname,
            duplicate: true,
            existingId: body.existingId,
          });
        } else {
          throw err;
        }
      }
    }

    // Async status update after ingestion
    void this.applicationsService
      .updateStatus(application.id)
      .catch((err: Error) =>
        this.logger.error(
          `Status update error: ${err.message}`,
          DocumentsService.name,
        ),
      );

    return results;
  }

  // ─── E1: Upload to S3 ────────────────────────────────────────────────────

  private async uploadToS3(
    application: LoanApplication,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
  ): Promise<Document> {
    if (fileBuffer.length < 4 || !fileBuffer.slice(0, 4).equals(PDF_MAGIC)) {
      throw new BadRequestException({
        error: 'CORRUPTED_FILE',
        message: `File '${originalFilename}' does not appear to be a valid PDF`,
      });
    }

    const contentHash = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    const existing = await this.docRepo.findOne({
      where: { applicationId: application.id, contentHash },
    });
    if (existing) {
      throw new DuplicateDocumentException(existing.id);
    }

    const s3Key = `applications/${application.id}/${uuidv4()}-${originalFilename}`;
    const doc = this.docRepo.create({
      application,
      applicationId: application.id,
      originalFilename,
      s3Key,
      contentHash,
      status: DocumentStatus.UPLOADING,
    });
    await this.docRepo.save(doc);

    await this.s3.upload(s3Key, fileBuffer, mimeType);

    this.logger.log(
      `E1 complete: uploaded ${originalFilename} → ${s3Key}`,
      DocumentsService.name,
    );
    return doc;
  }
}
