import { Establishment } from '../../../domain/entities/establishment.entity';

export interface IEstablishmentRepository {
  findById(id: string): Promise<Establishment | null>;
  findByCnpjRoot(cnpjRoot: string): Promise<Establishment[]>;
  save(data: Partial<Establishment>): Promise<Establishment>;
}
