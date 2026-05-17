import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StickerPack } from '../../../domain/entities/sticker-pack.entity';
import { IStickerPackRepository } from '../../../use-cases/album/ports/sticker-pack-repository.port';

@Injectable()
export class StickerPackRepository implements IStickerPackRepository {
  constructor(
    @InjectRepository(StickerPack)
    private readonly repo: Repository<StickerPack>,
  ) {}

  async findById(id: string): Promise<StickerPack | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findActiveByEstablishment(establishmentId: string): Promise<StickerPack | null> {
    return this.repo.findOne({
      where: { establishment_id: establishmentId, is_active: true },
    });
  }
}
