import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RentalStatus } from '../enums/rental-status.enum';
import { VirtualBillboard } from './virtual-billboard.entity';

@Entity('billboard_rentals')
export class BillboardRental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_billboard_rentals_billboard')
  @Column({ type: 'uuid' })
  billboard_id: string;

  @ManyToOne(() => VirtualBillboard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'billboard_id' })
  billboard: VirtualBillboard;

  @Column({ type: 'varchar', length: 14 })
  merchant_cnpj_root: string;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz' })
  end_time: Date;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price_paid: number;

  @Column({ type: 'enum', enum: RentalStatus, default: RentalStatus.RESERVED })
  status: RentalStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
