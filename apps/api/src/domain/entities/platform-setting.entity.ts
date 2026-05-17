import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('platform_settings')
export class PlatformSetting {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  setting_key: string;

  @Column({ type: 'jsonb' })
  setting_value: any;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
