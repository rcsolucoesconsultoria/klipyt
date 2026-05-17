import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Establishment } from '../../../domain/entities/establishment.entity';
import { IEstablishmentRepository } from '../../../use-cases/campaign/ports/establishment-repository.port';

@Injectable()
export class EstablishmentRepository implements IEstablishmentRepository {
  constructor(
    @InjectRepository(Establishment)
    private readonly repo: Repository<Establishment>,
  ) {}

  async findById(id: string): Promise<Establishment | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByCnpjRoot(cnpjRoot: string): Promise<Establishment[]> {
    return this.repo.find({ where: { cnpj_root: cnpjRoot } });
  }

  async save(data: Partial<Establishment>): Promise<Establishment> {
    return this.repo.save(this.repo.create(data));
  }
}
