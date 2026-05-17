import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { EmitCoinsUseCase } from '../../../use-cases/coin/emit-coins.use-case';
import { EmitCoinsDto } from '../dto/coin.dto';

@Controller('coins')
@UseGuards(JwtAuthGuard)
export class CoinController {
  constructor(private readonly emitCoins: EmitCoinsUseCase) {}

  @Post('emit')
  emitHandler(@Body() dto: EmitCoinsDto) {
    return this.emitCoins.execute({
      establishmentId: dto.establishment_id,
      title: dto.title,
      budgetGross: dto.budget_gross,
      videoUrl: dto.video_url,
      startTime: new Date(dto.start_time),
      endTime: new Date(dto.end_time),
      ageRestriction: dto.age_restriction,
    });
  }
}
