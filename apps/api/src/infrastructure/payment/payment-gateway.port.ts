export interface PixWithdrawInput {
  amountBrl: number;
  pixKeyType: 'CPF';
  pixKeyValue: string;
  idempotencyKey: string;
  description?: string;
}

export interface PixWithdrawResult {
  externalId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  endToEndId?: string;
}

export interface RegisterWebhookResult {
  webhookUrl: string;
  chavePix: string;
}

export interface PixChargeInput {
  amountBrl: number;
  chargeId: string;
  description: string;
  payerUserId: string;
}

export interface PixChargeResult {
  chargeId: string;
  pixCopyPaste: string;
  qrCodeBase64: string;
  expiresInSeconds: number;
}

export interface PaymentGatewayPort {
  /** Saque Pix (UC11). Cobrança/recebimento usa APIs de cob no C6. */
  requestWithdraw(input: PixWithdrawInput): Promise<PixWithdrawResult>;

  /** Cobrança Pix imediata (marketplace UC08). */
  createCharge(input: PixChargeInput): Promise<PixChargeResult>;

  /** Cadastra URL do KLIPYT no C6 — PUT /v2/pix/webhook/{chave} */
  registerWebhook(webhookUrl: string): Promise<RegisterWebhookResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
