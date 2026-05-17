import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DensityTier } from '../enums/density-tier.enum';
import { Establishment } from './establishment.entity';

@Entity('virtual_billboards')
export class VirtualBillboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  establishment_id: string | null;

  @ManyToOne(() => Establishment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'establishment_id' })
  establishment: Establishment | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'enum', enum: DensityTier, default: DensityTier.PRATA })
  density_tier: DensityTier;

  @Column({ type: 'text' })
  model_glb_url: string;

  @Column({ type: 'text', nullable: true })
  creative_video_url: string | null;

  @Index('idx_virtual_billboards_geom', { spatial: true })
  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  geom: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
