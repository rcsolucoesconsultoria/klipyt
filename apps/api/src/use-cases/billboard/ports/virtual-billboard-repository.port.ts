import { VirtualBillboard } from '../../../domain/entities/virtual-billboard.entity';

export interface IVirtualBillboardRepository {
  findById(id: string): Promise<VirtualBillboard | null>;
  findActiveNear(lat: number, lon: number, radiusMeters: number): Promise<VirtualBillboard[]>;
  save(billboard: Partial<VirtualBillboard>): Promise<VirtualBillboard>;
}
