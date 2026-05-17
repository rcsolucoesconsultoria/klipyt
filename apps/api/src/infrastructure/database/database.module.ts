import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'pixgo_admin'),
        password: config.get('DB_PASS', 'pixgo_strong_password'),
        database: config.get('DB_NAME', 'pixgo_prod'),
        entities: [join(__dirname, '../../domain/entities/**/*.entity.{ts,js}')],
        migrations: [join(__dirname, './migrations/**/*.{ts,js}')],
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development',
        ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
