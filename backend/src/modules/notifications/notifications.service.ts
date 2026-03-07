/**
 * NotificationsService — transactional email via nodemailer + SMTP.
 *
 * Production note: for a production application, replace nodemailer with a
 * dedicated email delivery platform (e.g. Mailchimp Transactional / Mandrill,
 * SendGrid, Postmark, or AWS SES). These services provide:
 *   - Deliverability infrastructure (SPF/DKIM/DMARC, dedicated IPs)
 *   - Bounce / complaint handling and suppression lists
 *   - Template management and A/B testing
 *   - Open / click tracking and analytics
 *   - Scalable throughput without managing an SMTP relay
 */
import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoanApplication } from '../applications/entities/loan-application.entity';
import { BorrowerFlag } from '../applications/enums/application.enums';
import { AppLogger } from '../../common/logger/app.logger';
import { uploadInvitationHtml } from './templates/upload-invitation.template';
import { extractionCompleteHtml } from './templates/extraction-complete.template';

@Injectable()
export class NotificationsService {
  private readonly logger = new AppLogger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('email.host'),
      port: this.config.get<number>('email.port'),
      auth: {
        user: this.config.get<string>('email.user'),
        pass: this.config.get<string>('email.pass'),
      },
    });
  }

  async sendUploadInvitation(application: LoanApplication): Promise<void> {
    const appUrl = this.config.get<string>('appUrl');
    const from = this.config.get<string>('email.from');
    const uploadUrl = `${appUrl}/upload/${application.uploadToken}`;

    try {
      await this.transporter.sendMail({
        from,
        to: application.borrowerEmail,
        subject: 'Action Required: Upload Your Loan Documents',
        html: uploadInvitationHtml({
          borrowerName: application.borrowerName ?? 'there',
          requestedAmount: Number(application.requestedAmount ?? 0),
          uploadUrl,
        }),
      });
      this.logger.log(
        `Upload invitation sent to borrower for application ${application.id}`,
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
    const from = this.config.get<string>('email.from');
    const reviewUrl = `${appUrl}/applications/${application.id}`;

    try {
      await this.transporter.sendMail({
        from,
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
        `Extraction complete notification sent to lender for application ${application.id}`,
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
