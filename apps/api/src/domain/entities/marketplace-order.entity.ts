import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MarketplaceStatus } from '../enums/marketplace-status.enum';
import { FinancialCoin } from './financial-coin.entity';
import { User } from './user.entity';

@Entity('marketplace_orders')
export class MarketplaceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_marketplace_orders_seller')
  @Column({ type: 'uuid' })
  seller_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Index('idx_marketplace_orders_buyer')
  @Column({ type: 'uuid', nullable: true })
  buyer_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User | null;

  @Index('idx_marketplace_orders_coin')
  @Column({ type: 'uuid' })
  coin_id: string;

  @ManyToOne(() => FinancialCoin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coin_id' })
  coin: FinancialCoin;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  list_price: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  platform_fee: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  seller_net: number;

  @Column({ type: 'enum', enum: MarketplaceStatus, default: MarketplaceStatus.LISTED })
  status: MarketplaceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
