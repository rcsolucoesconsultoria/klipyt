import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { RewardStatus } from '../enums/reward-status.enum';
import { Sticker } from './sticker.entity';
import { User } from './user.entity';

@Entity('user_stickers')
@Unique('uniq_user_sticker', ['user_id', 'sticker_id'])
export class UserSticker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => Sticker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sticker_id' })
  sticker: Sticker;

  @Column({ type: 'uuid' })
  sticker_id: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'boolean', default: false })
  is_glued: boolean;

  @Column({
    type: 'enum',
    enum: RewardStatus,
    enumName: 'reward_status_enum',
    default: RewardStatus.NOT_REDEEMED,
  })
  reward_status: RewardStatus;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  qr_token: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
