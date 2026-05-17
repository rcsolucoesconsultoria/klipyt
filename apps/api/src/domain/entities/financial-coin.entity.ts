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
import { User } from './user.entity';

@Entity('financial_coins')
export class FinancialCoin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_financial_coins_campaign')
  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ type: 'uuid', nullable: true })
  campaign_id: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'boolean', default: false })
  is_qualified: boolean;

  @Index('idx_financial_coins_geom', { spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  geom: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'collected_by' })
  collected_by_user: User | null;

  @Column({ type: 'uuid', nullable: true })
  collected_by: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  collected_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
