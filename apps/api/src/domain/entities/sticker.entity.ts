import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Rarity } from '../enums/rarity.enum';
import { Establishment } from './establishment.entity';

@Entity('stickers')
export class Sticker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Establishment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'establishment_id' })
  establishment: Establishment;

  @Column({ type: 'uuid' })
  establishment_id: string;

  @Column({ type: 'int', unique: true })
  sticker_number: number;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'int' })
  page_number: number;

  @Column({
    type: 'enum',
    enum: Rarity,
    enumName: 'rarity_enum',
    default: Rarity.COMMON,
  })
  rarity: Rarity;

  @Column({ type: 'text' })
  image_url: string;

  @Column({ type: 'boolean', default: false })
  has_reward: boolean;

  @Column({ type: 'text', nullable: true })
  reward_description: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reward_code: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
