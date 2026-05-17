import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RentalStatus } from '../../domain/enums/rental-status.enum';
import { DensityTier } from '../../domain/enums/density-tier.enum';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { TOKENS } from '../tokens';
import { IBillboardRentalRepository } from './ports/billboard-rental-repository.port';
import { IVirtualBillboardRepository } from './ports/virtual-billboard-repository.port';

const TIER_PRICES: Record<DensityTier, number> = {
  [DensityTier.OURO]: 500,
  [DensityTier.PRATA]: 250,
  [DensityTier.BRONZE]: 100,
};

export interface RentBillboardInput {
  billboardId: string;
  merchantCnpjRoot: string;
  startTime: Date;
  endTime: Date;
  creativeVideoUrl?: string;
}

@Injectable()
export class RentBillboardUseCase {
  constructor(
    @Inject(TOKENS.VIRTUAL_BILLBOARD_REPOSITORY)
    private readonly billboards: IVirtualBillboardRepository,
    @Inject(TOKENS.BILLBOARD_RENTAL_REPOSITORY)
    private readonly rentals: IBillboardRentalRepository,
    private readonly redis: RedisService,
  ) {}

  async execute(input: RentBillboardInput) {
    const billboard = await this.billboards.findById(input.billboardId);
    if (!billboard) throw new NotFoundException('Outdoor virtual não encontrado');
    if (!billboard.is_active) throw new BadRequestException('Outdoor inativo');

    if (input.endTime <= input.startTime) {
      throw new BadRequestException('Período de locação inválido');
    }

    const conflict = await this.rentals.findActiveByBillboard(
      input.billboardId,
      input.startTime,
    );
    if (conflict) {
      throw new ConflictException('Outdoor já reservado neste período');
    }

    const pricePaid = TIER_PRICES[billboard.density_tier] ?? TIER_PRICES[DensityTier.PRATA];
    const rental = await this.rentals.save({
      billboard_id: input.billboardId,
      merchant_cnpj_root: input.merchantCnpjRoot.replace(/\D/g, '').slice(0, 8),
      start_time: input.startTime,
      end_time: input.endTime,
      price_paid: pricePaid,
      status: RentalStatus.ACTIVE,
    });

    if (input.creativeVideoUrl) {
      await this.redis.hset(`billboard:${billboard.id}:creative`, {
        video_url: input.creativeVideoUrl,
        rental_id: rental.id,
      });
    }

    const coords = this.parseGeom(billboard.geom as unknown as string);
    await this.redis.geoadd('billboards:geo', coords.lon, coords.lat, billboard.id);
    await this.redis.hset(`billboard:${billboard.id}:meta`, {
      title: billboard.title,
      density_tier: billboard.density_tier,
      model_glb_url: billboard.model_glb_url,
    });

    return {
      rental_id: rental.id,
      billboard_id: billboard.id,
      price_paid: pricePaid,
      status: rental.status,
    };
  }

  private parseGeom(geom: string): { lat: number; lon: number } {
    const m = String(geom).match(/POINT\(([^\s]+)\s+([^\s)]+)\)/i);
    if (m) return { lon: parseFloat(m[1]), lat: parseFloat(m[2]) };
    try {
      const obj = JSON.parse(geom);
      if (obj?.coordinates) return { lon: obj.coordinates[0], lat: obj.coordinates[1] };
    } catch {
      /* ignore */
    }
    return { lat: -23.55, lon: -46.63 };
  }
}
