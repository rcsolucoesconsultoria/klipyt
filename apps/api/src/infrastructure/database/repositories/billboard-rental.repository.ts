import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillboardRental } from '../../../domain/entities/billboard-rental.entity';
import { RentalStatus } from '../../../domain/enums/rental-status.enum';
import { IBillboardRentalRepository } from '../../../use-cases/billboard/ports/billboard-rental-repository.port';

@Injectable()
export class BillboardRentalRepository implements IBillboardRentalRepository {
  constructor(
    @InjectRepository(BillboardRental)
    private readonly repo: Repository<BillboardRental>,
  ) {}

  save(rental: Partial<BillboardRental>): Promise<BillboardRental> {
    return this.repo.save(this.repo.create(rental));
  }

  findActiveByBillboard(billboardId: string, at: Date): Promise<BillboardRental | null> {
    return this.repo
      .createQueryBuilder('r')
      .where('r.billboard_id = :billboardId', { billboardId })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [RentalStatus.RESERVED, RentalStatus.ACTIVE],
      })
      .andWhere('r.start_time <= :at', { at })
      .andWhere('r.end_time >= :at', { at })
      .getOne();
  }
}
