import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Establishment } from './establishment.entity';

@Entity('sticker_packs')
export class StickerPack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Establishment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'establishment_id' })
  establishment: Establishment;

  @Column({ type: 'uuid' })
  establishment_id: string;

  @Index('idx_sticker_packs_geom', { spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  geom: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
