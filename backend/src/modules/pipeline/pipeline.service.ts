import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../common/s3/s3.service';
import Anthropic from '@anthropic-ai/sdk';
import { BorrowerFlag } from '../applications/enums/application.enums';
import {
  DocumentStatus,
  DocumentType,
  ParsePath,
} from '../documents/enums/document.enums';
import { IncomeType, AccountType } from './enums/pipeline.enums';
import { Document } from '../documents/entities/document.entity';
import { LoanApplication } from '../applications/entities/loan-application.entity';
import { BorrowerProfile } from '../applications/entities/borrower-profile.entity';
import { IncomeRecord } from './entities/income-record.entity';
import { AccountRecord } from './entities/account-record.entity';
import { AppLogger } from '../../common/logger/app.logger';
import { EncryptionService } from '../../common/crypto/encryption.service';
import { AnthropicRateLimiter } from '../../common/anthropic/anthropic-rate-limiter.service';
import {
  CLASSIFICATION_SYSTEM_PROMPT,
  EXTRACTION_SYSTEM_PROMPT,
} from './prompts/pipeline.prompts';
import { VISION_TYPES } from './types/pipeline.types';
import { EXTRACTION_TOOLS } from './schemas/extraction.schemas';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  buf: Buffer,
) => Promise<{ text: string }>;

@Injectable()
export class PipelineService {
  private readonly logger = new AppLogger(PipelineService.name);
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
    @InjectRepository(LoanApplication)
    private readonly appRepo: Repository<LoanApplication>,
    @InjectRepository(BorrowerProfile)
    private readonly profileRepo: Repository<BorrowerProfile>,
    @InjectRepository(IncomeRecord)
    private readonly incomeRepo: Repository<IncomeRecord>,
    @InjectRepository(AccountRecord)
    private readonly accountRepo: Repository<AccountRecord>,
    private readonly config: ConfigService,
    private readonly s3: S3Service,
    private readonly encryption: EncryptionService,
    private readonly rateLimiter: AnthropicRateLimiter,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('anthropic.apiKey') ?? '',
    });
  }

  // ─── Full pipeline: E2 → L2 ──────────────────────────────────────────────
  async processDocument(docId: string): Promise<void> {
    const doc = await this.docRepo.findOneOrFail({ where: { id: docId } });
    doc.lastAttemptedAt = new Date();
    await this.docRepo.save(doc);

    try {
      await this.stepClassify(doc);
      await this.stepParse(doc);
      await this.stepExtract(doc);
      await this.stepValidate(doc);
      await this.stepResolveAndLoad(doc);

      doc.status = DocumentStatus.COMPLETE;
      await this.docRepo.save(doc);
      await this.updateCompletionPct(doc.applicationId);
      this.logger.log(
        `Pipeline complete for document ${docId}`,
        PipelineService.name,
      );
    } catch (err) {
      const error = err as Error;
      doc.status = DocumentStatus.FAILED;
      doc.failureReason = error.message;
      await this.docRepo.save(doc);
      this.logger.error(
        `Pipeline failed for document ${docId}: ${error.message}`,
        PipelineService.name,
      );
      throw err;
    }
  }

  // ─── E2: Classify ────────────────────────────────────────────────────────

  private async stepClassify(doc: Document): Promise<void> {
    doc.status = DocumentStatus.CLASSIFYING;
    doc.failedAtStep = 'CLASSIFYING';
    await this.docRepo.save(doc);

    const fileBuffer = await this.s3.download(doc.s3Key);
    let textSample = '';
    try {
      const parsed = await pdfParse(fileBuffer);
      textSample = parsed.text.substring(0, 2000);
    } catch {
      textSample = '[binary PDF - vision required]';
    }

    const classificationModel =
      this.config.get<string>('anthropic.classificationModel') ??
      'claude-haiku-4-5-20251001';

    await this.rateLimiter.throttle();
    const response = await this.anthropic.messages.create({
      model: classificationModel,
      max_tokens: 256,
      system: CLASSIFICATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Classify this document. Filename: ${doc.originalFilename}\n\nText sample:\n${textSample}`,
        },
      ],
    });

    const raw = (response.content[0] as { type: string; text: string }).text;
    const result = JSON.parse(raw) as {
      documentType: string;
      confidence: number;
    };

    doc.documentType =
      (result.documentType as DocumentType) ?? DocumentType.UNKNOWN;
    doc.classificationConfidence = result.confidence;
    doc.parsePath = VISION_TYPES.has(doc.documentType)
      ? ParsePath.VISION
      : ParsePath.TEXT;

    this.logger.log(
      `E2 classified: ${doc.documentType} (${Math.round(result.confidence * 100)}%) via ${doc.parsePath}`,
      PipelineService.name,
    );
  }

  // ─── E3: Parse ───────────────────────────────────────────────────────────

  private async stepParse(doc: Document): Promise<void> {
    doc.status = DocumentStatus.PARSING;
    await this.docRepo.save(doc);

    if (doc.parsePath === ParsePath.TEXT) {
      const fileBuffer = await this.s3.download(doc.s3Key);
      const parsed = await pdfParse(fileBuffer);
      doc.rawText = parsed.text;
    }
    // VISION path: raw bytes passed directly to Anthropic in T1 step
    this.logger.log(
      `E3 parse complete via ${doc.parsePath}`,
      PipelineService.name,
    );
  }

  // ─── T1: Extract ─────────────────────────────────────────────────────────

  private async stepExtract(doc: Document): Promise<void> {
    doc.status = DocumentStatus.EXTRACTING;
    await this.docRepo.save(doc);

    const extractionModel =
      this.config.get<string>('anthropic.extractionModel') ??
      'claude-sonnet-4-6';

    const tool = EXTRACTION_TOOLS[doc.documentType ?? DocumentType.UNKNOWN];

    let messageContent: Anthropic.MessageParam['content'];

    if (doc.parsePath === ParsePath.TEXT && doc.rawText) {
      messageContent = [
        {
          type: 'text',
          text: `Document type: ${doc.documentType}\n\n${doc.rawText}`,
        },
      ];
    } else {
      const fileBuffer = await this.s3.download(doc.s3Key);
      const base64 = fileBuffer.toString('base64');
      messageContent = [
        { type: 'text', text: `Document type: ${doc.documentType}` },
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        } as unknown as Anthropic.TextBlockParam,
      ];
    }

    await this.rateLimiter.throttle();
    const response = await this.anthropic.messages.create({
      model: extractionModel,
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      tools: [tool],
      tool_choice: { type: 'tool', name: tool.name },
      messages: [{ role: 'user', content: messageContent }],
    });

    const toolUseBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );

    // toolUseBlock.input is already a parsed object — no JSON.parse needed
    doc.rawLlmJson = (toolUseBlock?.input ?? {}) as Record<string, unknown>;

    await this.docRepo.save(doc);
    this.logger.log(
      `T1 extraction complete for ${doc.documentType} via tool ${tool.name}`,
      PipelineService.name,
    );
  }

  // ─── T2: Validate ────────────────────────────────────────────────────────

  private async stepValidate(doc: Document): Promise<void> {
    doc.status = DocumentStatus.VALIDATING;
    await this.docRepo.save(doc);

    const flags: string[] = [];

    // Classification confidence check
    const classificationConfidence = doc.classificationConfidence ?? 0;
    if (classificationConfidence < 0.75) {
      flags.push(
        `LOW_CLASSIFICATION_CONFIDENCE:${classificationConfidence.toFixed(2)}`,
      );
    } else if (classificationConfidence < 0.9) {
      flags.push(
        `REVIEW_CLASSIFICATION_CONFIDENCE:${classificationConfidence.toFixed(2)}`,
      );
    }

    // Extraction confidence check (returned by the model via the tool schema)
    const extractionConfidence = Number(
      doc.rawLlmJson?.['extractionConfidence'] ?? 0,
    );
    if (extractionConfidence < 0.75) {
      flags.push(
        `LOW_EXTRACTION_CONFIDENCE:${extractionConfidence.toFixed(2)}`,
      );
    } else if (extractionConfidence < 0.9) {
      flags.push(
        `REVIEW_EXTRACTION_CONFIDENCE:${extractionConfidence.toFixed(2)}`,
      );
    }

    if (!doc.rawLlmJson || Object.keys(doc.rawLlmJson).length === 0) {
      flags.push('EMPTY_EXTRACTION');
    }

    doc.extractedData = {
      ...doc.rawLlmJson,
      _validationFlags: flags,
      _validatedAt: new Date().toISOString(),
    };

    this.logger.log(
      `T2 validation: ${flags.length} flag(s), extractionConfidence=${extractionConfidence.toFixed(2)}`,
      PipelineService.name,
    );
  }

  // ─── T3 + L1: Entity Resolve & Load ──────────────────────────────────────

  private async stepResolveAndLoad(doc: Document): Promise<void> {
    doc.status = DocumentStatus.RESOLVING;
    await this.docRepo.save(doc);

    const extracted = doc.extractedData ?? {};
    let profile = await this.profileRepo.findOne({
      where: { applicationId: doc.applicationId },
    });

    if (!profile) {
      profile = this.profileRepo.create({
        applicationId: doc.applicationId,
        flags: [],
        addressDiscrepancies: [],
        isJointApplication: false,
      });
    }

    this.mergeIdentityFields(profile, doc, extracted);

    doc.status = DocumentStatus.LOADING;
    await this.docRepo.save(doc);
    await this.profileRepo.save(profile);

    await this.saveIncomeRecord(profile, doc, extracted);
    await this.saveAccountRecord(profile, doc, extracted);

    this.logger.log(
      `L1 loaded borrower profile for application ${doc.applicationId}`,
      PipelineService.name,
    );
  }

  private mergeIdentityFields(
    profile: BorrowerProfile,
    doc: Document,
    extracted: Record<string, unknown>,
  ): void {
    // Each schema uses a different field name for the borrower — check known variants
    const borrowerName =
      extracted['borrowerName'] ??
      extracted['taxpayerName'] ??
      extracted['employeeName'] ??
      extracted['accountHolderName'] ??
      extracted['buyerName'];
    if (!profile.fullName && borrowerName) {
      profile.fullName = borrowerName as string;
    }

    if (!profile.coTaxpayerName && extracted['coTaxpayerName']) {
      profile.coTaxpayerName = extracted['coTaxpayerName'] as string;
    }

    if (!profile.ssn && extracted['ssn']) {
      profile.ssn = this.encryption.encrypt(extracted['ssn'] as string);
    }

    if (!profile.dob && extracted['dateOfBirth']) {
      profile.dob = this.encryption.encrypt(extracted['dateOfBirth'] as string);
    }

    if (extracted['address']) {
      const addr = extracted['address'] as string;
      if (!profile.currentAddress) {
        profile.currentAddress = addr;
      } else if (profile.currentAddress !== addr) {
        profile.addressDiscrepancies = [
          ...(profile.addressDiscrepancies ?? []),
          `${doc.documentType}: ${addr}`,
        ];
        if (!profile.flags?.includes(BorrowerFlag.ADDRESS_DISCREPANCY)) {
          profile.flags = [
            ...(profile.flags ?? []),
            BorrowerFlag.ADDRESS_DISCREPANCY,
          ];
        }
      }
    }

    if (
      extracted['coborrowerId'] ||
      extracted['coborrowerName'] ||
      extracted['jointFiling'] === true
    ) {
      profile.isJointApplication = true;
      profile.flags = [
        ...(profile.flags ?? []),
        BorrowerFlag.JOINT_APPLICATION_DETECTED,
      ];
    }
  }

  private async saveIncomeRecord(
    profile: BorrowerProfile,
    doc: Document,
    extracted: Record<string, unknown>,
  ): Promise<void> {
    // Field names are now guaranteed by the per-type tool schema
    const amount = Number(
      extracted['adjustedGrossIncome'] ?? // FORM_1040
        extracted['annualSalary'] ?? // VOI
        extracted['wagesAndTips'] ?? // W2
        extracted['grossPay'] ?? // PAY_STUB
        0,
    );
    if (!amount) return;

    const ytdAmount =
      extracted['ytdEarnings'] ?? // VOI
      extracted['ytdGross']; // PAY_STUB

    const employer = extracted['employerName'] as string | undefined; // VOI, PAY_STUB, W2

    const record = this.incomeRepo.create({
      borrowerProfileId: profile.id,
      sourceDocumentId: doc.id,
      incomeType: this.mapIncomeType(doc.documentType),
      taxYear: extracted['taxYear'] ? Number(extracted['taxYear']) : undefined,
      annualAmount: amount,
      ytdAmount: ytdAmount ? Number(ytdAmount) : undefined,
      employer,
    });
    await this.incomeRepo.save(record);

    const all = await this.incomeRepo.find({
      where: { borrowerProfileId: profile.id },
    });
    profile.totalAnnualIncome = all.reduce(
      (sum, r) => sum + Number(r.annualAmount),
      0,
    );
    await this.profileRepo.save(profile);
  }

  private async saveAccountRecord(
    profile: BorrowerProfile,
    doc: Document,
    extracted: Record<string, unknown>,
  ): Promise<void> {
    // endingBalance is the guaranteed field name in the BANK_STATEMENT schema
    const balance = Number(extracted['endingBalance'] ?? 0);
    if (!balance) return;

    const rawAccountNumber = extracted['accountNumber'] as string | undefined;
    const record = this.accountRepo.create({
      borrowerProfileId: profile.id,
      sourceDocumentId: doc.id,
      institution: extracted['bankName'] as string | undefined,
      accountType: this.mapAccountType(
        extracted['accountType'] as string | undefined,
      ),
      accountNumber: rawAccountNumber
        ? this.encryption.encrypt(rawAccountNumber)
        : undefined,
      balance,
    });
    await this.accountRepo.save(record);

    const all = await this.accountRepo.find({
      where: { borrowerProfileId: profile.id },
    });
    profile.totalAssets = all.reduce((sum, r) => sum + Number(r.balance), 0);
    await this.profileRepo.save(profile);
  }

  private mapIncomeType(docType: DocumentType | undefined): IncomeType {
    switch (docType) {
      case DocumentType.W2:
      case DocumentType.FORM_1040:
      case DocumentType.VOI:
      case DocumentType.PAY_STUB:
        return IncomeType.W2;
      default:
        return IncomeType.OTHER;
    }
  }

  private mapAccountType(accountType: string | undefined): AccountType {
    if (!accountType) return AccountType.OTHER;
    const upper = accountType.toUpperCase();
    if (upper.includes('CHECKING')) return AccountType.CHECKING;
    if (upper.includes('SAVINGS')) return AccountType.SAVINGS;
    if (upper.includes('INVEST')) return AccountType.INVESTMENT;
    if (
      upper.includes('RETIRE') ||
      upper.includes('401K') ||
      upper.includes('IRA')
    )
      return AccountType.RETIREMENT;
    return AccountType.OTHER;
  }

  // ─── L2: Update application completion percentage ────────────────────────

  private async updateCompletionPct(applicationId: string): Promise<void> {
    const allDocs = await this.docRepo.find({ where: { applicationId } });
    if (allDocs.length === 0) return;
    const completedCount = allDocs.filter(
      (d) => d.status === DocumentStatus.COMPLETE,
    ).length;
    const pct = Math.round((completedCount / allDocs.length) * 100);
    await this.appRepo.update({ id: applicationId }, { completionPct: pct });
    this.logger.log(
      `L2 completionPct updated: ${pct}% (${completedCount}/${allDocs.length}) for application ${applicationId}`,
      PipelineService.name,
    );
  }

  // ─── Retry (called by cron) ───────────────────────────────────────────────

  async retryFailedDocument(docId: string): Promise<void> {
    const doc = await this.docRepo.findOne({
      where: { id: docId, status: DocumentStatus.FAILED },
    });
    if (!doc || doc.retryCount >= 3) return;

    doc.retryCount += 1;
    doc.lastAttemptedAt = new Date();
    doc.status = DocumentStatus.PENDING;
    doc.failureReason = undefined;
    await this.docRepo.save(doc);

    await this.processDocument(docId);
  }
}
