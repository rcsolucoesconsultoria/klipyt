import { UploadCampaignVideoUseCase } from './upload-campaign-video.use-case';
import { BadRequestException } from '@nestjs/common';

const mockFfprobe = { getDurationSeconds: jest.fn() };
const mockStorage = { upload: jest.fn(), delete: jest.fn() };

describe('UploadCampaignVideoUseCase (UC04)', () => {
  let useCase: UploadCampaignVideoUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.delete.mockResolvedValue(undefined);
    useCase = new UploadCampaignVideoUseCase(mockFfprobe as any, mockStorage as any);
  });

  it('rejeita vídeo com 45 segundos (>30s)', async () => {
    mockFfprobe.getDurationSeconds.mockResolvedValue(45.2);

    await expect(
      useCase.execute({ tempFilePath: '/tmp/x.mp4', originalName: 'test.mp4', mimeType: 'video/mp4', sizeBytes: 1000 }),
    ).rejects.toThrow(BadRequestException);
    expect(mockStorage.delete).toHaveBeenCalled();
  });

  it('rejeita vídeo com 10 segundos (<15s)', async () => {
    mockFfprobe.getDurationSeconds.mockResolvedValue(10);

    await expect(
      useCase.execute({ tempFilePath: '/tmp/x.mp4', originalName: 'test.mp4', mimeType: 'video/mp4', sizeBytes: 1000 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('aceita e faz upload de vídeo de 20 segundos', async () => {
    mockFfprobe.getDurationSeconds.mockResolvedValue(20);
    mockStorage.upload.mockResolvedValue('https://r2.example.com/campaigns/video.mp4');

    const result = await useCase.execute({
      tempFilePath: '/tmp/x.mp4',
      originalName: 'ad.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 5 * 1024 * 1024,
    });

    expect(result.video_url).toContain('r2.example.com');
    expect(result.duration_seconds).toBe(20);
    expect(mockStorage.delete).toHaveBeenCalled();
  });
});
