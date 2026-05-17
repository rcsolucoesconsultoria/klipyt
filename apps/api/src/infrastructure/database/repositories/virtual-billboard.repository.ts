import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VirtualBillboard } from '../../../domain/entities/virtual-billboard.entity';
import { IVirtualBillboardRepository } from '../../../use-cases/billboard/ports/virtual-billboard-repository.port';

@Injectable()
export class VirtualBillboardRepository implements IVirtualBillboardRepository {
  constructor(
    @InjectRepository(VirtualBillboard)
    private readonly repo: Repository<VirtualBillboard>,
  ) {}

  findById(id: string): Promise<VirtualBillboard | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findActiveNear(lat: number, lon: number, radiusMeters: number): Promise<VirtualBillboard[]> {
    const rows = await this.repo.query(
      `SELECT vb.* FROM virtual_billboards vb
       WHERE vb.is_active = true
         AND ST_DWithin(
           vb.geom::geography,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           $3
         )`,
      [lon, lat, radiusMeters],
    );
    return rows;
  }

  save(billboard: Partial<VirtualBillboard>): Promise<VirtualBillboard> {
    return this.repo.save(this.repo.create(billboard));
  }
}
