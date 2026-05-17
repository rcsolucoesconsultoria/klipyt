/**
 * Endpoints extraídos de pix-collection.json (API Pix C6 Bank BaaS).
 * Sandbox: https://baas-api-sandbox.c6bank.info
 * Produção: https://baas-api.c6bank.info
 */
export const C6_PIX_PATHS = {
  cob: (txid: string) => `/v2/pix/cob/${txid}`,
  cobList: '/v2/pix/cob',
  pixByE2eid: (e2eid: string) => `/v2/pix/pix/${e2eid}`,
  pixList: '/v2/pix/pix',
  webhookRegister: (chavePix: string) => `/v2/pix/webhook/${encodeURIComponent(chavePix)}`,
  webhookList: '/v2/pix/webhook',
} as const;

export const C6_DEFAULT_BASE_URL_SANDBOX = 'https://baas-api-sandbox.c6bank.info';
export const C6_DEFAULT_BASE_URL_PRODUCTION = 'https://baas-api.c6bank.info';
