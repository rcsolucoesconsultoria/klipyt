import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('merchant_wallets')
export class MerchantWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 14, unique: true })
  cnpj_root: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0.0 })
  balance: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
