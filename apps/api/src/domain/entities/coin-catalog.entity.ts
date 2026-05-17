import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { Establishment } from './establishment.entity';
import { Rarity } from '../enums/rarity.enum';

@Entity('coin_catalogs')
export class CoinCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_coin_catalogs_campaign')
  @Column({ type: 'uuid', nullable: true })
  campaign_id: string | null;

  @ManyToOne(() => Campaign, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign | null;

  @Index('idx_coin_catalogs_establishment')
  @Column({ type: 'uuid' })
  establishment_id: string;

  @ManyToOne(() => Establishment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'establishment_id' })
  establishment: Establishment;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  face_value: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  budget_gross: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  budget_net: number;

  @Column({ type: 'int' })
  quantity_issued: number;

  @Column({ type: 'enum', enum: Rarity, default: Rarity.COMMON })
  rarity: Rarity;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
