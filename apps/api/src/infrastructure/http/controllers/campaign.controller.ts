import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateCampaignUseCase } from '../../../use-cases/campaign/create-campaign.use-case';
import { UploadCampaignVideoUseCase } from '../../../use-cases/campaign/upload-campaign-video.use-case';
import { GetCampaignAnalyticsUseCase } from '../../../use-cases/campaign/get-campaign-analytics.use-case';
import { ImportCnpjBranchesUseCase } from '../../../use-cases/establishment/import-cnpj-branches.use-case';
import { CreateCampaignDto, ImportCnpjDto } from '../dto/campaign.dto';

const tmpStorage = diskStorage({
  destination: '/tmp/uploads',
  filename: (_req, file, cb) =>
    cb(null, `${uuidv4()}${extname(file.originalname)}`),
});

@Controller()
@UseGuards(JwtAuthGuard)
export class CampaignController {
  constructor(
    private readonly createCampaign: CreateCampaignUseCase,
    private readonly uploadVideo: UploadCampaignVideoUseCase,
    private readonly analytics: GetCampaignAnalyticsUseCase,
    private readonly importCnpj: ImportCnpjBranchesUseCase,
  ) {}

  @Post(['campaign/upload-video', 'campaigns/upload-video'])
  @UseInterceptors(FileInterceptor('video', { storage: tmpStorage }))
  uploadVideoHandler(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { error: 'Nenhum arquivo enviado' };
    return this.uploadVideo.execute({
      tempFilePath: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
  }

  @Post('campaigns')
  createCampaignHandler(@Body() dto: CreateCampaignDto) {
    return this.createCampaign.execute({
      establishmentId: dto.establishment_id,
      budgetGross: dto.budget_gross,
      videoUrl: dto.video_url,
      startTime: new Date(dto.start_time),
      endTime: new Date(dto.end_time),
      ageRestriction: dto.age_restriction,
    });
  }

  @Get('campaigns/:id/analytics')
  getAnalyticsHandler(@Param('id') id: string) {
    return this.analytics.execute(id);
  }

  @Post('merchant/establishments/import-cnpj')
  importCnpjHandler(@Body() dto: ImportCnpjDto) {
    return this.importCnpj.execute({
      cnpjMatrix: dto.cnpj,
      selectedCnpjs: dto.selected_cnpjs,
    });
  }
}
