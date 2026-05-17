import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  C6_DEFAULT_BASE_URL_PRODUCTION,
  C6_DEFAULT_BASE_URL_SANDBOX,
  C6_PIX_PATHS,
} from './c6-pix.constants';
import {
  PaymentGatewayPort,
  PixChargeInput,
  PixChargeResult,
  PixWithdrawInput,
  PixWithdrawResult,
  RegisterWebhookResult,
} from '../payment-gateway.port';

@Injectable()
export class C6PixGateway implements PaymentGatewayPort {
  private readonly logger = new Logger(C6PixGateway.name);

  constructor(private readonly config: ConfigService) {}

  get baseUrl(): string {
    return (
      this.config.get<string>('C6_API_BASE_URL') ||
      (this.config.get('NODE_ENV') === 'production'
        ? C6_DEFAULT_BASE_URL_PRODUCTION
        : C6_DEFAULT_BASE_URL_SANDBOX)
    );
  }

  private get accessToken(): string {
    return (
      this.config.get<string>('C6_ACCESS_TOKEN') ||
      this.config.get<string>('PIX_ACCESS_TOKEN') ||
      ''
    );
  }

  private get chavePix(): string {
    return this.config.get<string>('C6_PIX_KEY') || '';
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Cadastro WebHooks PIX — pix-collection.json
   * PUT {base}/v2/pix/webhook/{chave_pix}
   * Body: { "webhookUrl": "https://seu-dominio/api/v1/webhooks/pix" }
   */
  async registerWebhook(webhookUrl: string): Promise<RegisterWebhookResult> {
    const chave = this.chavePix;
    if (!chave) {
      throw new Error('C6_PIX_KEY não configurada no .env');
    }
    if (!this.accessToken) {
      throw new Error('C6_ACCESS_TOKEN não configurado (Bearer da API BaaS C6)');
    }

    const url = `${this.baseUrl}${C6_PIX_PATHS.webhookRegister(chave)}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ webhookUrl }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`C6 registerWebhook ${res.status}: ${body}`);
    }

    this.logger.log(`Webhook C6 registrado: ${webhookUrl} → chave ${chave}`);
    return { webhookUrl, chavePix: chave };
  }

  /** Cobrança imediata — PUT /v2/pix/cob/{txid} */
  async createCharge(input: PixChargeInput): Promise<PixChargeResult> {
    if (!this.accessToken || !this.chavePix) {
      this.logger.warn('C6 createCharge: credenciais ausentes — retornando payload de demonstração');
      const copyPaste = `00020126580014br.gov.bcb.pix0136${input.chargeId}520400005303986540${input.amountBrl.toFixed(2)}5802BR5925KLIPYT6009SAO PAULO62070503***6304C6XX`;
      return {
        chargeId: input.chargeId,
        pixCopyPaste: copyPaste,
        qrCodeBase64: Buffer.from(copyPaste).toString('base64'),
        expiresInSeconds: 600,
      };
    }

    const txid = input.chargeId.replace(/-/g, '').slice(0, 35);
    const url = `${this.baseUrl}${C6_PIX_PATHS.cob(txid)}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({
        calendario: { expiracao: 600 },
        valor: { original: input.amountBrl.toFixed(2) },
        chave: this.chavePix,
        solicitacaoPagador: input.description,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`C6 createCharge ${res.status}: ${body}`);
    }

    const data = (await res.json()) as { pixCopiaECola?: string; location?: string };
    const copyPaste = data.pixCopiaECola ?? '';
    return {
      chargeId: input.chargeId,
      pixCopyPaste: copyPaste,
      qrCodeBase64: Buffer.from(copyPaste).toString('base64'),
      expiresInSeconds: 600,
    };
  }

  /**
   * Saque outbound: não consta em pix-collection.json (cobrança + webhook de recebimento).
   * Implementar quando o C6 disponibilizar API de pagamento/transferência outbound no contrato BaaS.
   */
  async requestWithdraw(input: PixWithdrawInput): Promise<PixWithdrawResult> {
    this.logger.warn(
      `requestWithdraw mock — API de payout outbound não está em pix-collection.json. ` +
        `idempotency=${input.idempotencyKey} valor=${input.amountBrl}`,
    );
    return {
      externalId: `c6-pending-${input.idempotencyKey}`,
      status: 'PENDING',
    };
  }

  /** Consultar Pix recebido — GET /v2/pix/pix/{e2eid} */
  async getPixByEndToEndId(e2eid: string): Promise<unknown> {
    const url = `${this.baseUrl}${C6_PIX_PATHS.pixByE2eid(e2eid)}`;
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) {
      throw new Error(`C6 getPix ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }
}
