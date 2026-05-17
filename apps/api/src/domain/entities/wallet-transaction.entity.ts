import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TxStatus } from '../enums/tx-status.enum';
import { User } from './user.entity';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_wallet_transactions_user')
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Index('idx_wallet_transactions_status')
  @Column({
    type: 'enum',
    enum: TxStatus,
    enumName: 'tx_status_enum',
    default: TxStatus.PENDING,
  })
  status: TxStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  end_to_end_id: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  processed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
