import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sticker } from '../../../domain/entities/sticker.entity';
import { Rarity } from '../../../domain/enums/rarity.enum';
import { IStickerRepository } from '../../../use-cases/album/ports/sticker-repository.port';

@Injectable()
export class StickerRepository implements IStickerRepository {
  constructor(
    @InjectRepository(Sticker)
    private readonly repo: Repository<Sticker>,
  ) {}

  async findRandomByEstablishmentAndRarity(
    establishmentId: string,
    rarity: Rarity,
  ): Promise<Sticker | null> {
    return this.repo
      .createQueryBuilder('s')
      .where('s.establishment_id = :establishmentId', { establishmentId })
      .andWhere('s.rarity = :rarity', { rarity })
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
  }

  async findFallback(establishmentId: string): Promise<Sticker | null> {
    return this.repo
      .createQueryBuilder('s')
      .where('s.establishment_id = :establishmentId', { establishmentId })
      .andWhere('s.rarity = :rarity', { rarity: Rarity.COMMON })
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
  }
}
