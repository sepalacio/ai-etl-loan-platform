import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { ApplicationsService } from '../applications/applications.service';

const MAX_FILE_SIZE_MB = 25 * 1024 * 1024; // 25 MB

@Controller('')
export class DocumentsController {
  constructor(
    private readonly service: DocumentsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  /**
   * Validates an upload token and returns basic application info.
   * Called by the borrower upload page on mount to confirm the token is valid.
   */
  @Get('upload/:token')
  async validateToken(@Param('token') token: string) {
    const app = await this.applicationsService.findByToken(token);
    return { borrowerName: app.borrowerName, status: app.status };
  }

  /**
   * Borrower uploads documents via their token-scoped URL.
   * Accepts up to 10 PDF files per request.
   */
  @Post('upload/:token')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          cb(
            new BadRequestException({
              error: 'INVALID_FILE_TYPE',
              message: `File '${file.originalname}' is not a PDF`,
            }),
            false,
          );
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: MAX_FILE_SIZE_MB },
    }),
  )
  async upload(
    @Param('token') token: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException({
        error: 'NO_FILES',
        message: 'Request contained no files',
      });
    }

    const results = await this.service.ingestFiles(token, files);
    const duplicates = results.filter((r) => r.duplicate);
    const accepted = results.filter((r) => !r.duplicate);

    return {
      accepted: accepted.map((r) => ({
        id: r.documentId,
        filename: r.filename,
      })),
      duplicates: duplicates.map((r) => ({
        filename: r.filename,
        existingId: r.existingId,
      })),
      message: `${accepted.length} document(s) queued for processing.`,
    };
  }
}
