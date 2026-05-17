import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { resolveEnvPath } from './config/resolve-env-path';

import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { PaymentModule } from './infrastructure/payment/payment.module';

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
import { EstablishmentRepository } from './infrastructure/database/repositories/establishment.repository';
import { CampaignRepository } from './infrastructure/database/repositories/campaign.repository';
import { FinancialCoinRepository } from './infrastructure/database/repositories/financial-coin.repository';
import { MerchantWalletRepository } from './infrastructure/database/repositories/merchant-wallet.repository';
import { WalletTransactionRepository } from './infrastructure/database/repositories/wallet-transaction.repository';

import { BureauApiService } from './infrastructure/external/bureau-api.service';
import { CnpjApiService } from './infrastructure/external/cnpj-api.service';
import { GeocodingApiService } from './infrastructure/external/geocoding-api.service';
import { FfprobeService } from './infrastructure/video/ffprobe.service';
import { CloudflareR2Service } from './infrastructure/storage/cloudflare-r2.service';

import { GoogleStrategy } from './infrastructure/http/strategies/google.strategy';
import { JwtStrategy } from './infrastructure/http/strategies/jwt.strategy';

import { GoogleLoginUseCase } from './use-cases/auth/google-login.use-case';
import { UpgradeAccountUseCase } from './use-cases/user/upgrade-account.use-case';
import { OpenPackUseCase } from './use-cases/album/open-pack.use-case';
import { GenerateTradePinUseCase } from './use-cases/album/generate-trade-pin.use-case';
import { ConfirmTradePinUseCase } from './use-cases/album/confirm-trade-pin.use-case';
import { RedeemStickerCouponUseCase } from './use-cases/sticker/redeem-sticker-coupon.use-case';
import { CreateCampaignUseCase } from './use-cases/campaign/create-campaign.use-case';
import { UploadCampaignVideoUseCase } from './use-cases/campaign/upload-campaign-video.use-case';
import { GetCampaignAnalyticsUseCase } from './use-cases/campaign/get-campaign-analytics.use-case';
import { GetMapLayersUseCase } from './use-cases/map/get-map-layers.use-case';
import { CollectCoinUseCase } from './use-cases/collect/collect-coin.use-case';
import { ImportCnpjBranchesUseCase } from './use-cases/establishment/import-cnpj-branches.use-case';
import { WithdrawPixUseCase } from './use-cases/wallet/withdraw-pix.use-case';

import { HealthController } from './infrastructure/http/controllers/health.controller';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { UserController } from './infrastructure/http/controllers/user.controller';
import { AlbumController } from './infrastructure/http/controllers/album.controller';
import { StickerController } from './infrastructure/http/controllers/sticker.controller';
import { SettingsController } from './infrastructure/http/controllers/settings.controller';
import { MapController } from './infrastructure/http/controllers/map.controller';
import { CampaignController } from './infrastructure/http/controllers/campaign.controller';
import { CollectController } from './infrastructure/http/controllers/collect.controller';
import { WalletController } from './infrastructure/http/controllers/wallet.controller';
import { WebhookController } from './infrastructure/http/controllers/webhook.controller';
import { AdminController } from './infrastructure/http/controllers/admin.controller';

import { TOKENS } from './use-cases/tokens';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: resolveEnvPath() }),
    DatabaseModule,
    RedisModule,
    PaymentModule,
    PassportModule,
    MulterModule.register({ dest: '/tmp/uploads' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'changeme_in_production',
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
    }),
    TypeOrmModule.forFeature([
      User, Establishment, MerchantWallet, Campaign, FinancialCoin,
      StickerPack, Sticker, UserSticker, UnifiedCollection, WalletTransaction, PlatformSetting,
    ]),
  ],
  controllers: [
    HealthController, AuthController, UserController, AlbumController,
    StickerController, SettingsController, MapController, CampaignController,
    CollectController, WalletController, WebhookController, AdminController,
  ],
  providers: [
    GeoValidatorService, RarityRollerService, SmartBlendingCalculatorService,

    { provide: TOKENS.USER_REPOSITORY, useClass: UserRepository },
    { provide: TOKENS.STICKER_PACK_REPOSITORY, useClass: StickerPackRepository },
    { provide: TOKENS.STICKER_REPOSITORY, useClass: StickerRepository },
    { provide: TOKENS.USER_STICKER_REPOSITORY, useClass: UserStickerRepository },
    { provide: TOKENS.UNIFIED_COLLECTION_REPOSITORY, useClass: UnifiedCollectionRepository },
    { provide: TOKENS.PLATFORM_SETTING_REPOSITORY, useClass: PlatformSettingRepository },
    { provide: TOKENS.ESTABLISHMENT_REPOSITORY, useClass: EstablishmentRepository },
    { provide: TOKENS.CAMPAIGN_REPOSITORY, useClass: CampaignRepository },
    { provide: TOKENS.FINANCIAL_COIN_REPOSITORY, useClass: FinancialCoinRepository },
    { provide: 'FINANCIAL_COIN_COLLECT', useClass: FinancialCoinRepository },
    { provide: TOKENS.MERCHANT_WALLET_REPOSITORY, useClass: MerchantWalletRepository },
    { provide: TOKENS.WALLET_TRANSACTION_REPOSITORY, useClass: WalletTransactionRepository },

    { provide: TOKENS.BUREAU_API, useClass: BureauApiService },
    { provide: TOKENS.CNPJ_API, useClass: CnpjApiService },
    { provide: TOKENS.GEOCODING_API, useClass: GeocodingApiService },
    { provide: TOKENS.FFPROBE_SERVICE, useClass: FfprobeService },
    { provide: TOKENS.STORAGE_SERVICE, useClass: CloudflareR2Service },

    GoogleStrategy, JwtStrategy,

    GoogleLoginUseCase, UpgradeAccountUseCase, OpenPackUseCase,
    GenerateTradePinUseCase, ConfirmTradePinUseCase, RedeemStickerCouponUseCase,
    CreateCampaignUseCase, UploadCampaignVideoUseCase, GetCampaignAnalyticsUseCase,
    GetMapLayersUseCase, CollectCoinUseCase, ImportCnpjBranchesUseCase, WithdrawPixUseCase,
  ],
})
export class AppModule {}
