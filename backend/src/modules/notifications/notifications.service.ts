import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { LoanApplication } from '../applications/entities/loan-application.entity';
import { BorrowerFlag } from '../applications/enums/application.enums';
import { AppLogger } from '../../common/logger/app.logger';
import { uploadInvitationHtml } from './templates/upload-invitation.template';
import { extractionCompleteHtml } from './templates/extraction-complete.template';

@Injectable()
export class NotificationsService {
  private readonly logger = new AppLogger(NotificationsService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('email.resendApiKey'));
    this.from =
      this.config.get<string>('email.from') ??
      'LoanPro <onboarding@resend.dev>';
  }

  async sendUploadInvitation(application: LoanApplication): Promise<void> {
    const appUrl = this.config.get<string>('appUrl');
    const uploadUrl = `${appUrl}/upload/${application.uploadToken}`;

    try {
      await this.resend.emails.send({
        from: this.from,
        to: application.borrowerEmail,
        subject: 'Action Required: Upload Your Loan Documents',
        html: uploadInvitationHtml({
          borrowerName: application.borrowerName ?? 'there',
          requestedAmount: Number(application.requestedAmount ?? 0),
          uploadUrl,
        }),
      });
      this.logger.log(
        `Upload invitation sent to ${application.borrowerEmail} for application ${application.id}`,
        NotificationsService.name,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send upload invitation: ${(err as Error).message}`,
        NotificationsService.name,
      );
    }
  }

  async sendExtractionComplete(
    application: LoanApplication,
    flags: BorrowerFlag[],
  ): Promise<void> {
    const appUrl = this.config.get<string>('appUrl');
    const reviewUrl = `${appUrl}/applications/${application.id}`;

    try {
      await this.resend.emails.send({
        from: this.from,
        to: application.lenderEmail,
        subject: `Application Ready for Review — ${application.borrowerName ?? application.id}`,
        html: extractionCompleteHtml({
          borrowerName: application.borrowerName ?? 'your borrower',
          applicationId: application.id,
          flags,
          reviewUrl,
        }),
      });
      this.logger.log(
        `Extraction complete notification sent to ${application.lenderEmail} for application ${application.id}`,
        NotificationsService.name,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send extraction complete email: ${(err as Error).message}`,
        NotificationsService.name,
      );
    }
  }
}
