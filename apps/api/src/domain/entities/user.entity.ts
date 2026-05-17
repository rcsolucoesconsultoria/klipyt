import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserStatus } from '../enums/user-status.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_users_email')
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string | null;

  @Index('idx_users_cpf', { where: '"cpf" IS NOT NULL' })
  @Column({ type: 'varchar', length: 11, unique: true, nullable: true })
  cpf: string | null;

  @Column({ type: 'date', nullable: true })
  birth_date: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pix_key: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  faixa_etaria: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0.0 })
  wallet_balance: number;

  @Column({
    type: 'enum',
    enum: UserStatus,
    enumName: 'user_status_enum',
    default: UserStatus.INCOMPLETE,
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false })
  fraud_flag: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
