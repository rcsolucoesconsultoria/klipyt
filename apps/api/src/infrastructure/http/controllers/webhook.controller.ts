import { Body, Controller, HttpCode, Inject, Logger, Post, Headers, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TxStatus } from '../../../domain/enums/tx-status.enum';
import { TOKENS } from '../../../use-cases/tokens';
import { IWalletTransactionRepository } from '../../../use-cases/wallet/ports/wallet-transaction-repository.port';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    @Inject(TOKENS.WALLET_TRANSACTION_REPOSITORY)
    private readonly txRepo: IWalletTransactionRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  @Post('pix')
  @HttpCode(200)
  async pixWebhook(
    @Headers('x-webhook-signature') signature: string,
    @Body() body: any,
  ) {
    this.validateSignature(body, signature);

    const pix = body?.pix?.[0];
    if (!pix?.endToEndId) return { ok: true };

    const tx = await this.txRepo.findByEndToEndId(pix.endToEndId);
    if (!tx) {
      this.logger.warn(`Webhook Pix: endToEndId ${pix.endToEndId} não encontrado`);
      return { ok: true };
    }

    if (pix.status === 'DEVOLVIDA' || body.status === 'error') {
      await this.txRepo.updateStatus(tx.id, TxStatus.FAILED, pix.endToEndId);
      // Estornar saldo
      await this.dataSource.query(
        `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
        [tx.amount, tx.user_id],
      );
      this.logger.log(`Pix ${pix.endToEndId} falhou — saldo estornado para user ${tx.user_id}`);
    } else {
      await this.txRepo.updateStatus(tx.id, TxStatus.COMPLETED, pix.endToEndId);
      this.logger.log(`Pix ${pix.endToEndId} liquidado — user ${tx.user_id}`);
    }

    return { ok: true };
  }

  private validateSignature(body: any, signature: string) {
    const secret = this.config.get<string>('PIX_WEBHOOK_SECRET');
    if (!secret) return;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');
    if (expected !== signature) {
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }
  }
}
