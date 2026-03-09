import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Not, Repository } from 'typeorm';
import { DocumentStatus } from '../documents/enums/document.enums';
import { Document } from '../documents/entities/document.entity';
import { PipelineService } from './pipeline.service';
import { AppLogger } from '../../common/logger/app.logger';

const TERMINAL_STATUSES = [DocumentStatus.COMPLETE, DocumentStatus.FAILED];

const MAX_RETRIES = 3;

@Injectable()
export class PipelineScheduler {
  private readonly logger = new AppLogger(PipelineScheduler.name);

  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
    private readonly pipeline: PipelineService,
  ) {}

  /**
   * Every 5 minutes: pick up two classes of documents and re-run the pipeline:
   *  1. FAILED documents with retries remaining (explicit failures).
   *  2. Stuck in-progress documents — status is not terminal but lastAttemptedAt
   *     is older than 5 minutes (process died mid-pipeline or timed out).
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedDocuments(): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const candidates = await this.docRepo.find({
      where: [
        // Explicit failures with retries remaining
        { status: DocumentStatus.FAILED, lastAttemptedAt: IsNull() },
        {
          status: DocumentStatus.FAILED,
          lastAttemptedAt: LessThan(fiveMinutesAgo),
        },
        // Stuck in-progress documents
        {
          status: Not(In(TERMINAL_STATUSES)),
          lastAttemptedAt: LessThan(fiveMinutesAgo),
        },
      ],
    });

    const eligible = candidates.filter((d) => d.retryCount < MAX_RETRIES);
    if (eligible.length === 0) return;

    this.logger.log(
      `Cron: retrying ${eligible.length} failed document(s)`,
      PipelineScheduler.name,
    );

    await Promise.allSettled(
      eligible.map((doc) =>
        this.pipeline
          .retryFailedDocument(doc.id)
          .catch((err: Error) =>
            this.logger.error(
              `Retry failed for ${doc.id}: ${err.message}`,
              PipelineScheduler.name,
            ),
          ),
      ),
    );
  }
}
