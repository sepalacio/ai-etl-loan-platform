import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './crypto/encryption.service';
import { S3Service } from './s3/s3.service';
import { AnthropicRateLimiter } from './anthropic/anthropic-rate-limiter.service';

@Global()
@Module({
  providers: [EncryptionService, S3Service, AnthropicRateLimiter],
  exports: [EncryptionService, S3Service, AnthropicRateLimiter],
})
export class CommonModule {}
