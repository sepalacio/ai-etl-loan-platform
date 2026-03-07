import { ConflictException } from '@nestjs/common';

export class DuplicateDocumentException extends ConflictException {
  constructor(existingId: string) {
    super({
      code: 'DUPLICATE_DOCUMENT',
      existingId,
      message:
        'A document with identical content has already been uploaded for this application.',
    });
  }
}
