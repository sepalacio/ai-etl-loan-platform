import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './crypto/encryption.service';
import { S3Service } from './s3/s3.service';

@Global()
@Module({
  providers: [EncryptionService, S3Service],
  exports: [EncryptionService, S3Service],
})
export class CommonModule {}
