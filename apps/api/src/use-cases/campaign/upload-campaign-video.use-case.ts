import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TOKENS } from '../tokens';

export interface IFfprobeService {
  getDurationSeconds(filePath: string): Promise<number>;
}

export interface IStorageService {
  upload(filePath: string, key: string, mimeType: string): Promise<string>;
  delete(filePath: string): Promise<void>;
}

export interface UploadVideoInput {
  tempFilePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadVideoResult {
  video_url: string;
  duration_seconds: number;
}

const MAX_SIZE_BYTES = 15 * 1024 * 1024;
const MIN_DURATION = 15;
const MAX_DURATION = 30;

@Injectable()
export class UploadCampaignVideoUseCase {
  constructor(
    @Inject(TOKENS.FFPROBE_SERVICE) private readonly ffprobe: IFfprobeService,
    @Inject(TOKENS.STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async execute(input: UploadVideoInput): Promise<UploadVideoResult> {
    if (input.sizeBytes > MAX_SIZE_BYTES) {
      await this.storage.delete(input.tempFilePath);
      throw new BadRequestException('O vídeo não pode ultrapassar 15MB');
    }

    let duration: number;
    try {
      duration = await this.ffprobe.getDurationSeconds(input.tempFilePath);
    } catch (err) {
      await this.storage.delete(input.tempFilePath);
      throw new BadRequestException('Não foi possível analisar o vídeo enviado');
    }

    if (duration < MIN_DURATION) {
      await this.storage.delete(input.tempFilePath);
      throw new BadRequestException(
        `O vídeo precisa ter no mínimo ${MIN_DURATION} segundos`,
      );
    }
    if (duration > MAX_DURATION) {
      await this.storage.delete(input.tempFilePath);
      throw new BadRequestException(
        `O vídeo não pode ter mais de ${MAX_DURATION} segundos`,
      );
    }

    const key = `campaigns/${Date.now()}-${input.originalName}`;
    const video_url = await this.storage.upload(
      input.tempFilePath,
      key,
      input.mimeType,
    );
    await this.storage.delete(input.tempFilePath);

    return { video_url, duration_seconds: duration };
  }
}
