import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';

@Controller('')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

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
          cb(new BadRequestException('Only PDF files are accepted'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    }),
  )
  async upload(
    @Param('token') token: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
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
