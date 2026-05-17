import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AssetType } from '../enums/asset-type.enum';
import { Establishment } from './establishment.entity';
import { User } from './user.entity';

@Entity('unified_collections')
export class UnifiedCollection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => Establishment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'establishment_id' })
  establishment: Establishment;

  @Column({ type: 'uuid' })
  establishment_id: string;

  @Column({ type: 'varchar', length: 20 })
  asset_type: AssetType;

  @Index('idx_unified_collections_rate')
  @CreateDateColumn({ type: 'timestamptz' })
  collected_at: Date;
}
