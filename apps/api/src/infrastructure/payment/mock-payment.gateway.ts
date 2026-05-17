import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentGatewayPort,
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

  async requestWithdraw(input: PixWithdrawInput): Promise<PixWithdrawResult> {
    this.logger.log(`[mock] Saque Pix R$ ${input.amountBrl} → ${input.pixKeyValue}`);
    return {
      externalId: `mock-${input.idempotencyKey}`,
      status: 'PENDING',
      endToEndId: `E${Date.now()}`,
    };
  }
}
