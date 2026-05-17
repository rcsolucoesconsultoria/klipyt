import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { join } from 'path';

import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';

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

import { GeoValidatorService } from './domain/services/geo-validator.service';
import { RarityRollerService } from './domain/services/rarity-roller.service';
import { SmartBlendingCalculatorService } from './domain/services/smart-blending-calculator.service';

import { UserRepository } from './infrastructure/database/repositories/user.repository';
import { StickerPackRepository } from './infrastructure/database/repositories/sticker-pack.repository';
import { StickerRepository } from './infrastructure/database/repositories/sticker.repository';
import { UserStickerRepository } from './infrastructure/database/repositories/user-sticker.repository';
import { UnifiedCollectionRepository } from './infrastructure/database/repositories/unified-collection.repository';
import { PlatformSettingRepository } from './infrastructure/database/repositories/platform-setting.repository';

import { GoogleStrategy } from './infrastructure/http/strategies/google.strategy';
import { JwtStrategy } from './infrastructure/http/strategies/jwt.strategy';

import { GoogleLoginUseCase } from './use-cases/auth/google-login.use-case';
import { OpenPackUseCase } from './use-cases/album/open-pack.use-case';
import { GenerateTradePinUseCase } from './use-cases/album/generate-trade-pin.use-case';
import { ConfirmTradePinUseCase } from './use-cases/album/confirm-trade-pin.use-case';
import { RedeemStickerCouponUseCase } from './use-cases/sticker/redeem-sticker-coupon.use-case';

import { HealthController } from './infrastructure/http/controllers/health.controller';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { UserController } from './infrastructure/http/controllers/user.controller';
import { AlbumController } from './infrastructure/http/controllers/album.controller';
import { StickerController } from './infrastructure/http/controllers/sticker.controller';
import { SettingsController } from './infrastructure/http/controllers/settings.controller';

import { TOKENS } from './use-cases/tokens';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '../../../../.env'),
    }),
    DatabaseModule,
    RedisModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'changeme_in_production',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
      }),
    }),
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
  controllers: [
    HealthController,
    AuthController,
    UserController,
    AlbumController,
    StickerController,
    SettingsController,
  ],
  providers: [
    // Domain services (pure)
    GeoValidatorService,
    RarityRollerService,
    SmartBlendingCalculatorService,

    // Repository implementations bound to port tokens
    { provide: TOKENS.USER_REPOSITORY, useClass: UserRepository },
    { provide: TOKENS.STICKER_PACK_REPOSITORY, useClass: StickerPackRepository },
    { provide: TOKENS.STICKER_REPOSITORY, useClass: StickerRepository },
    { provide: TOKENS.USER_STICKER_REPOSITORY, useClass: UserStickerRepository },
    { provide: TOKENS.UNIFIED_COLLECTION_REPOSITORY, useClass: UnifiedCollectionRepository },
    { provide: TOKENS.PLATFORM_SETTING_REPOSITORY, useClass: PlatformSettingRepository },

    // Strategies
    GoogleStrategy,
    JwtStrategy,

    // Use cases
    GoogleLoginUseCase,
    OpenPackUseCase,
    GenerateTradePinUseCase,
    ConfirmTradePinUseCase,
    RedeemStickerCouponUseCase,
  ],
})
export class AppModule {}
