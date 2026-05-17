import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RentBillboardUseCase } from '../../../use-cases/billboard/rent-billboard.use-case';
import { InteractBillboardUseCase } from '../../../use-cases/billboard/interact-billboard.use-case';
import { InteractBillboardDto, RentBillboardDto } from '../dto/billboard.dto';

@Controller('billboards')
@UseGuards(JwtAuthGuard)
export class BillboardController {
  constructor(
    private readonly rentBillboard: RentBillboardUseCase,
    private readonly interactBillboard: InteractBillboardUseCase,
  ) {}

  @Post('rent')
  rentHandler(@Body() dto: RentBillboardDto) {
    return this.rentBillboard.execute({
      billboardId: dto.billboard_id,
      merchantCnpjRoot: dto.merchant_cnpj_root,
      startTime: new Date(dto.start_time),
      endTime: new Date(dto.end_time),
      creativeVideoUrl: dto.creative_video_url,
    });
  }

  @Post('interact')
  interactHandler(
    @CurrentUser() user: { id: string },
    @Body() dto: InteractBillboardDto,
  ) {
    return this.interactBillboard.execute({
      userId: user.id,
      billboardId: dto.billboard_id,
      lat: dto.lat,
      lon: dto.lon,
    });
  }
}
