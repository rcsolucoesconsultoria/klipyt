import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { IStorageService } from '../../use-cases/campaign/upload-campaign-video.use-case';

@Injectable()
export class CloudflareR2Service implements IStorageService {
  private readonly logger = new Logger(CloudflareR2Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const accountId = config.get<string>('R2_ACCOUNT_ID', '');
    this.bucket = config.get<string>('R2_BUCKET', 'klipyt-dev');
    this.publicUrl = config.get<string>('R2_PUBLIC_URL', 'http://localhost:9000');

    this.client = new S3Client({
      region: 'auto',
      endpoint: accountId
        ? `https://${accountId}.r2.cloudflarestorage.com`
        : 'http://localhost:9000',
      credentials: {
        accessKeyId: config.get<string>('R2_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: config.get<string>('R2_SECRET_KEY', 'minioadmin'),
      },
    });
  }

  async upload(filePath: string, key: string, mimeType: string): Promise<string> {
    const stream = createReadStream(filePath);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        ContentType: mimeType,
      }),
    );
    return `${this.publicUrl}/${key}`;
  }

  async delete(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch {
      // ignore
    }
  }
}
