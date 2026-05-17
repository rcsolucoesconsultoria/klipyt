import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { TOKENS } from '../tokens';
import { IVirtualBillboardRepository } from './ports/virtual-billboard-repository.port';

const INTERACT_RADIUS_METERS = 50;

export interface InteractBillboardInput {
  userId: string;
  billboardId: string;
  lat: number;
  lon: number;
}

@Injectable()
export class InteractBillboardUseCase {
  constructor(
    @Inject(TOKENS.VIRTUAL_BILLBOARD_REPOSITORY)
    private readonly billboards: IVirtualBillboardRepository,
    private readonly redis: RedisService,
  ) {}

  async execute(input: InteractBillboardInput) {
    const billboard = await this.billboards.findById(input.billboardId);
    if (!billboard) throw new NotFoundException('Outdoor virtual não encontrado');

    const nearby = await this.billboards.findActiveNear(
      input.lat,
      input.lon,
      INTERACT_RADIUS_METERS,
    );
    const inRange = nearby.some((b) => b.id === input.billboardId);
    if (!inRange) {
      throw new ForbiddenException(
        `Aproxime-se do outdoor (máx. ${INTERACT_RADIUS_METERS}m) para interagir`,
      );
    }

    const impressionsKey = `billboard:${input.billboardId}:impressions`;
    const uniqueKey = `billboard:${input.billboardId}:unique:${input.userId}`;
    const total = await this.redis.incrementWithExpiry(impressionsKey, 86400 * 30);
    const isUnique = !(await this.redis.get(uniqueKey));
    if (isUnique) {
      await this.redis.set(uniqueKey, '1', 86400);
    }

    const creative = await this.redis.hgetall(`billboard:${input.billboardId}:creative`);
    const meta = await this.redis.hgetall(`billboard:${input.billboardId}:meta`);

    return {
      billboard_id: billboard.id,
      title: meta.title ?? billboard.title,
      model_glb_url: meta.model_glb_url ?? billboard.model_glb_url,
      creative_video_url:
        creative.video_url ?? billboard.creative_video_url ?? null,
      impressions_today: total,
      unique_view: isUnique,
    };
  }
}
