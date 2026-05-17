import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { IFfprobeService } from '../../use-cases/campaign/upload-campaign-video.use-case';

const execFileAsync = promisify(execFile);

@Injectable()
export class FfprobeService implements IFfprobeService {
  async getDurationSeconds(filePath: string): Promise<number> {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      filePath,
    ]);
    const data = JSON.parse(stdout);
    return parseFloat(data.format.duration);
  }
}
