import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;

  constructor(private readonly config: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.config.get('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.config.get('MINIO_PORT', '9000'), 10),
      useSSL: false,
      accessKey: this.config.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.config.get('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async onModuleInit() {
    // Ensure buckets exist
    for (const bucket of ['fi-data', 'proofs']) {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket);
      }
    }
  }

  async putObject(bucket: string, key: string, data: string): Promise<void> {
    await this.client.putObject(bucket, key, Buffer.from(data));
  }

  async getObject(bucket: string, key: string): Promise<string> {
    const stream = await this.client.getObject(bucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.client.removeObject(bucket, key);
  }

  async objectExists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.client.statObject(bucket, key);
      return true;
    } catch {
      return false;
    }
  }
}
