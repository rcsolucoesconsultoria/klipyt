import { ConfigService } from '@nestjs/config';

/**
 * URL que o C6 chamará (webhookUrl no cadastro PUT /v2/pix/webhook/{chave}).
 * Não é URL do C6 — é endpoint público do Pix GO.
 */
export function resolvePixWebhookUrl(config: ConfigService): string {
  const explicit = config.get<string>('PIX_WEBHOOK_URL')?.trim();
  if (explicit) return explicit;

  const apiPublic = config.get<string>('API_PUBLIC_URL', 'http://localhost:3000').replace(/\/$/, '');
  return `${apiPublic}/api/v1/webhooks/pix`;
}
