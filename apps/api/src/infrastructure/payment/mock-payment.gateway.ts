import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentGatewayPort,
  PixChargeInput,
  PixChargeResult,
  PixWithdrawInput,
  PixWithdrawResult,
  RegisterWebhookResult,
} from './payment-gateway.port';

@Injectable()
export class MockPaymentGateway implements PaymentGatewayPort {
  private readonly logger = new Logger(MockPaymentGateway.name);

  constructor(private readonly config: ConfigService) {}

  async registerWebhook(webhookUrl: string): Promise<RegisterWebhookResult> {
    const chave = this.config.get<string>('C6_PIX_KEY', 'mock-chave');
    this.logger.log(`[mock] Webhook registrado: ${webhookUrl}`);
    return { webhookUrl, chavePix: chave };
  }

  async createCharge(input: PixChargeInput): Promise<PixChargeResult> {
    const amount = input.amountBrl.toFixed(2);
    const copyPaste = `00020126580014br.gov.bcb.pix0136${input.chargeId}520400005303986540${amount}5802BR5925KLIPYT MARKETPLACE6009SAO PAULO62070503***6304MOCK`;
    this.logger.log(`[mock] Cobrança Pix R$ ${amount} — charge ${input.chargeId}`);
    return {
      chargeId: input.chargeId,
      pixCopyPaste: copyPaste,
      qrCodeBase64: Buffer.from(copyPaste).toString('base64'),
      expiresInSeconds: 600,
    };
  }

  async requestWithdraw(input: PixWithdrawInput): Promise<PixWithdrawResult> {
    this.logger.log(`[mock] Saque Pix R$ ${input.amountBrl} → ${input.pixKeyValue}`);
    return {
      externalId: `mock-${input.idempotencyKey}`,
      status: 'PENDING',
      endToEndId: `E${Date.now()}`,
    };
  }
}
