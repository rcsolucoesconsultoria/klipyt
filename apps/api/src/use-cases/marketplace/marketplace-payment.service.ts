import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MarketplaceStatus } from '../../domain/enums/marketplace-status.enum';
import {
  PAYMENT_GATEWAY,
  PaymentGatewayPort,
} from '../../infrastructure/payment/payment-gateway.port';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { TOKENS } from '../tokens';
import { IFinancialCoinRepository } from '../campaign/ports/financial-coin-repository.port';
import { IMarketplaceOrderRepository } from './ports/marketplace-order-repository.port';

export interface MarketplaceChargePayload {
  orderId: string;
  buyerId: string;
  sellerId: string;
  coinId: string;
  amount: number;
  sellerNet: number;
  platformFee: number;
  status: 'PENDING' | 'COMPLETED';
}

@Injectable()
export class MarketplacePaymentService {
  constructor(
    @Inject(TOKENS.MARKETPLACE_ORDER_REPOSITORY)
    private readonly orders: IMarketplaceOrderRepository,
    @Inject(TOKENS.FINANCIAL_COIN_REPOSITORY)
    private readonly coins: IFinancialCoinRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGatewayPort,
    private readonly redis: RedisService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  chargeKey(chargeId: string) {
    return `marketplace:charge:${chargeId}`;
  }

  lockKey(coinId: string) {
    return `marketplace:lock:${coinId}`;
  }

  async getCharge(chargeId: string): Promise<MarketplaceChargePayload | null> {
    const raw = await this.redis.get(this.chargeKey(chargeId));
    return raw ? (JSON.parse(raw) as MarketplaceChargePayload) : null;
  }

  async saveCharge(chargeId: string, payload: MarketplaceChargePayload, ttlSeconds: number) {
    await this.redis.set(this.chargeKey(chargeId), JSON.stringify(payload), ttlSeconds);
    await this.redis.set(this.lockKey(payload.coinId), chargeId, ttlSeconds);
  }

  async completePurchase(chargeId: string, payload: MarketplaceChargePayload) {
    const order = await this.orders.findById(payload.orderId);
    if (!order) throw new NotFoundException('Ordem não encontrada');
    if (order.status === MarketplaceStatus.COMPLETED) {
      return { already_completed: true, order_id: order.id };
    }

    await this.dataSource.transaction(async (em) => {
      await em.query(
        `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
        [payload.sellerNet, payload.sellerId],
      );
    });

    const transferred = await this.coins.transferOwner(
      payload.coinId,
      payload.sellerId,
      payload.buyerId,
    );
    if (!transferred) {
      throw new ConflictException('Falha na transferência de propriedade da moeda');
    }

    await this.orders.updateStatus(order.id, MarketplaceStatus.COMPLETED, payload.buyerId);
    payload.status = 'COMPLETED';
    await this.redis.set(this.chargeKey(chargeId), JSON.stringify(payload), 3600);
    await this.redis.del(this.lockKey(payload.coinId));

    return {
      order_id: order.id,
      coin_id: payload.coinId,
      paid: payload.amount,
      platform_fee: payload.platformFee,
      seller_received: payload.sellerNet,
      payment_method: 'pix',
    };
  }

  async completeWalletPurchase(
    orderId: string,
    buyerId: string,
    listPrice: number,
    sellerNet: number,
    sellerId: string,
    coinId: string,
    platformFee: number,
  ) {
    await this.dataSource.transaction(async (em) => {
      const [buyer] = await em.query(
        `SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE`,
        [buyerId],
      );
      if (!buyer) throw new NotFoundException('Comprador não encontrado');
      if (Number(buyer.wallet_balance) < listPrice) {
        const shortfall = Math.round((listPrice - Number(buyer.wallet_balance)) * 100) / 100;
        const err: any = new Error('INSUFFICIENT_BALANCE');
        err.shortfall = shortfall;
        err.wallet_balance = Number(buyer.wallet_balance);
        throw err;
      }

      await em.query(
        `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2`,
        [listPrice, buyerId],
      );
      await em.query(
        `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
        [sellerNet, sellerId],
      );
    });

    const transferred = await this.coins.transferOwner(coinId, sellerId, buyerId);
    if (!transferred) {
      throw new ConflictException('Falha na transferência de propriedade da moeda');
    }

    await this.orders.updateStatus(orderId, MarketplaceStatus.COMPLETED, buyerId);

    return {
      order_id: orderId,
      coin_id: coinId,
      paid: listPrice,
      platform_fee: platformFee,
      seller_received: sellerNet,
      payment_method: 'wallet',
    };
  }

  async initPixCharge(
    orderId: string,
    buyerId: string,
    listPrice: number,
    sellerNet: number,
    platformFee: number,
    sellerId: string,
    coinId: string,
  ) {
    const chargeId = uuidv4();
    const charge = await this.gateway.createCharge({
      amountBrl: listPrice,
      chargeId,
      description: `KLIPYT Marketplace — ordem ${orderId.slice(0, 8)}`,
      payerUserId: buyerId,
    });

    const payload: MarketplaceChargePayload = {
      orderId,
      buyerId,
      sellerId,
      coinId,
      amount: listPrice,
      sellerNet,
      platformFee,
      status: 'PENDING',
    };

    await this.saveCharge(chargeId, payload, charge.expiresInSeconds);

    return {
      payment_method: 'pix' as const,
      charge_id: chargeId,
      pix_copy_paste: charge.pixCopyPaste,
      qr_code_base64: charge.qrCodeBase64,
      amount: listPrice,
      expires_in_seconds: charge.expiresInSeconds,
    };
  }
}
