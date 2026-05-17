import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CampaignStatus } from '../enums/campaign-status.enum';
import { Establishment } from './establishment.entity';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_campaigns_establishment')
  @ManyToOne(() => Establishment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'establishment_id' })
  establishment: Establishment;

  @Column({ type: 'uuid', nullable: true })
  establishment_id: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  budget_gross: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  budget_net: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 40.0 })
  app_margin_percent: number;

  @Column({ type: 'text' })
  video_url: string;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz' })
  end_time: Date;

  @Column({ type: 'int', nullable: true })
  age_restriction: number | null;

  @Index('idx_campaigns_status')
  @Column({
    type: 'enum',
    enum: CampaignStatus,
    enumName: 'campaign_status_enum',
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
