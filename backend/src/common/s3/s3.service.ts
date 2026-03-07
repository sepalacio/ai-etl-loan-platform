import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket =
      this.config.get<string>('aws.s3Bucket') ?? 'loanpro-documents';
    this.client = new S3Client({
      region: this.config.get<string>('aws.region') ?? 'us-east-1',
      credentials: {
        accessKeyId: this.config.get<string>('aws.accessKeyId') ?? '',
        secretAccessKey: this.config.get<string>('aws.secretAccessKey') ?? '',
      },
    });
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      }),
    );
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as ArrayBuffer),
      );
    }
    return Buffer.concat(chunks);
  }
}
