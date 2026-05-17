import * as crypto from 'crypto';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AssetType } from '../../domain/enums/asset-type.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { TOKENS } from '../tokens';
import { IUserRepository } from '../auth/ports/user-repository.port';
import { IUnifiedCollectionRepository } from '../album/ports/unified-collection-repository.port';
import { IFinancialCoinCollectPort } from './ports/financial-coin-collect.port';

const GEO_TOLERANCE_METERS = 25;
const RATE_LIMIT_TTL = 86400;

export interface CollectCoinInput {
  userId: string;
  coinId: string;
  lat: number;
  lon: number;
  timestampMs: number;
  hmacSignature: string;
  videoTokenPresented: boolean;
}

export interface CollectCoinResult {
  credited: number;
  wallet_balance: number;
}

@Injectable()
export class CollectCoinUseCase {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(TOKENS.UNIFIED_COLLECTION_REPOSITORY)
    private readonly collections: IUnifiedCollectionRepository,
    @Inject('FINANCIAL_COIN_COLLECT') private readonly coinRepo: IFinancialCoinCollectPort,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async execute(input: CollectCoinInput): Promise<CollectCoinResult> {
    // Camada 2 (RN04): Validar assinatura HMAC do payload
    this.validateHmac(input.userId, input.coinId, input.timestampMs, input.hmacSignature);

    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.status !== UserStatus.VERIFIED) {
      throw new ForbiddenException('Ative seu perfil Pix Real para coletar moedas');
    }
    if (user.fraud_flag) {
      throw new ForbiddenException('Conta com flag de fraude — saques bloqueados');
    }

    const coin = await this.coinRepo.findById(input.coinId);
    if (!coin) throw new NotFoundException('Moeda não encontrada');
    if (coin.collected_by) {
      throw new HttpException('Moeda já coletada', HttpStatus.CONFLICT);
    }

    // Validar token de vídeo (RF07)
    const videoKey = `video:token:${input.userId}:${input.coinId}`;
    const videoToken = await this.redis.get(videoKey);
    if (!videoToken) {
      throw new ForbiddenException('Assistir o vídeo completo é obrigatório antes de capturar');
    }

    // Camada 3 (RN04): ST_Distance no PostGIS
    const distanceMeters = await this.coinRepo.distanceMeters(
      input.coinId,
      input.lat,
      input.lon,
    );
    if (distanceMeters > GEO_TOLERANCE_METERS) {
      await this.dataSource.query(
        `UPDATE users SET fraud_flag = true WHERE id = $1`,
        [input.userId],
      );
      throw new HttpException(
        `Localização inválida (distância: ${distanceMeters.toFixed(0)}m). Conta marcada para auditoria`,
        HttpStatus.FORBIDDEN,
      );
    }

    // RN03: Rate limit 1 coleta/CPF/filial/24h
    const establishmentId = await this.coinRepo.getEstablishmentIdByCoin(input.coinId);
    if (establishmentId) {
      const rateKey = `rate:cpf:${user.cpf ?? user.id}:est:${establishmentId}`;
      const rateVal = await this.redis.get(rateKey);
      if (rateVal && parseInt(rateVal) >= 1) {
        throw new HttpException(
          'Limite de 1 coleta por estabelecimento nas últimas 24h (RN03)',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Transação atômica: debitar + registrar
    const newBalance = await this.dataSource.transaction(async (em) => {
      await em.query(
        `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
        [coin.value, input.userId],
      );
      const [row] = await em.query(
        `SELECT wallet_balance FROM users WHERE id = $1`,
        [input.userId],
      );
      return Number(row.wallet_balance);
    });

    await this.coinRepo.markCollected(input.coinId, input.userId);
    await this.redis.del(videoKey);
    await this.redis.zrem('active_coins:geo', input.coinId);

    if (establishmentId) {
      const rateKey = `rate:cpf:${user.cpf ?? user.id}:est:${establishmentId}`;
      await this.redis.incrementWithExpiry(rateKey, RATE_LIMIT_TTL);
    }
    if (establishmentId) {
      await this.collections.register(input.userId, establishmentId, AssetType.FINANCIAL_COIN);
    }

    return { credited: coin.value, wallet_balance: newBalance };
  }

  private validateHmac(
    userId: string,
    coinId: string,
    timestampMs: number,
    provided: string,
  ) {
    const secret = this.config.get<string>('JWT_SECRET', 'changeme_in_production');
    const payload = `${userId}:${coinId}:${timestampMs}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (expected !== provided) {
      throw new UnauthorizedException('Assinatura de payload inválida (RN04)');
    }
  }
}
