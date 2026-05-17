import { BillboardRental } from '../../../domain/entities/billboard-rental.entity';

export interface IBillboardRentalRepository {
  save(rental: Partial<BillboardRental>): Promise<BillboardRental>;
  findActiveByBillboard(billboardId: string, at: Date): Promise<BillboardRental | null>;
}
