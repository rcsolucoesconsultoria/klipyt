import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { HealthController } from './infrastructure/http/controllers/health.controller';

import { User } from './domain/entities/user.entity';
import { Establishment } from './domain/entities/establishment.entity';
import { MerchantWallet } from './domain/entities/merchant-wallet.entity';
import { Campaign } from './domain/entities/campaign.entity';
import { FinancialCoin } from './domain/entities/financial-coin.entity';
import { StickerPack } from './domain/entities/sticker-pack.entity';
import { Sticker } from './domain/entities/sticker.entity';
import { UserSticker } from './domain/entities/user-sticker.entity';
import { UnifiedCollection } from './domain/entities/unified-collection.entity';
import { WalletTransaction } from './domain/entities/wallet-transaction.entity';
import { PlatformSetting } from './domain/entities/platform-setting.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '../../../../.env'),
    }),
    DatabaseModule,
    RedisModule,
    TypeOrmModule.forFeature([
      User,
      Establishment,
      MerchantWallet,
      Campaign,
      FinancialCoin,
      StickerPack,
      Sticker,
      UserSticker,
      UnifiedCollection,
      WalletTransaction,
      PlatformSetting,
    ]),
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
