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
        port: parseInt(String(config.get('DB_PORT', 5433)), 10),
        username: config.get('DB_USER', 'klipyt_admin'),
        password: config.get('DB_PASS', 'klipyt_strong_password'),
        database: config.get('DB_NAME', 'klipyt_prod'),
        entities: [join(__dirname, '../../domain/entities/**/*.entity.{ts,js}')],
        migrations: [join(__dirname, './migrations/**/*.{ts,js}')],
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development',
        ssl:
          config.get('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
