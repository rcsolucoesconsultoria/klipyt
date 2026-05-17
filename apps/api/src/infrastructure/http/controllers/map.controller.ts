import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { GetMapLayersUseCase } from '../../../use-cases/map/get-map-layers.use-case';

@Controller('map')
@UseGuards(JwtAuthGuard)
export class MapController {
  constructor(private readonly getMapLayers: GetMapLayersUseCase) {}

  @Get('layers')
  getLayers(
    @CurrentUser() user: { id: string; faixa_etaria?: string },
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    return this.getMapLayers.execute({
      userId: user.id,
      faixa_etaria: user.faixa_etaria ?? null,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    });
  }
}
