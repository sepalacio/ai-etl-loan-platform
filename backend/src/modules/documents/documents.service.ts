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

    if (application.status === ApplicationStatus.COMPLETE) {
      throw new UnprocessableEntityException({
        error: 'APPLICATION_CLOSED',
        message:
          'Application is already complete and no longer accepts uploads',
      });
    }

    const results: IngestResult[] = [];
    const acceptedDocs: Document[] = [];

    // Phase 1 — upload all files to S3 synchronously before starting any pipeline.
    // This keeps the HTTP response fast and gives us the full list of docs to sequence.
    for (const file of files) {
      try {
        const doc = await this.uploadToS3(
          application,
          file.buffer,
          file.originalname,
          file.mimetype,
        );
        acceptedDocs.push(doc);
        results.push({
          filename: file.originalname,
          documentId: doc.id,
          duplicate: false,
        });
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

    // Phase 2 — run pipelines sequentially in the background, one document at a time.
    // Sequential processing avoids bursting Anthropic API rate limits when multiple
    // documents are uploaded in a single request.
    void acceptedDocs
      .reduce<
        Promise<void>
      >((chain, doc) => chain.then(() => this.pipeline.processDocument(doc.id).catch((err: Error) => this.logger.error(`Background pipeline error for ${doc.id}: ${err.message}`, DocumentsService.name))), Promise.resolve())
      .then(() =>
        this.applicationsService
          .updateStatus(application.id)
          .catch((err: Error) =>
            this.logger.error(
              `Status update error: ${err.message}`,
              DocumentsService.name,
            ),
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
      if (existing.status === DocumentStatus.FAILED) {
        // Reset and reprocess rather than rejecting — borrower is re-submitting a failed doc
        existing.status = DocumentStatus.PENDING;
        existing.failureReason = undefined;
        existing.failedAtStep = undefined;
        existing.retryCount = 0;
        existing.lastAttemptedAt = undefined as unknown as Date;
        await this.docRepo.save(existing);
        return existing;
      }
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
