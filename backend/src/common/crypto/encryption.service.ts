import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

@Injectable()
export class EncryptionService implements OnModuleInit {
  private key!: Buffer;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const rawKey = this.config.get<string>('encryption.key') ?? '';
    if (!rawKey) {
      // derive a deterministic key from a fixed salt for dev; prod must set ENCRYPTION_KEY
      this.key = crypto.scryptSync('dev-only-insecure', 'salt', 32);
    } else {
      this.key = Buffer.from(rawKey, 'hex');
    }
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    // format: iv(12) + tag(16) + encrypted payload — base64 encoded
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decrypt(ciphertext: string): string {
    const buf = Buffer.from(ciphertext, 'base64');
    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
  }
}
