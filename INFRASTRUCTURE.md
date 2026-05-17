# 🐳 Engenharia de Infraestrutura Local — Docker Compose

```yaml
version: '3.8'

services:
  postgres_db:
    image: postgis/postgis:15-3.3-alpine
    container_name: pixgo_db
    restart: always
    ports:
      - "5433:5432"   # 5433 no host se a 5432 já estiver ocupada
    environment:
      - POSTGRES_USER=pixgo_admin
      - POSTGRES_PASSWORD=pixgo_strong_password
      - POSTGRES_DB=pixgo_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis_cache:
    image: redis:7-alpine
    container_name: pixgo_redis
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

---

## Pix — C6 Bank BaaS

Referência Postman: [`pix-collection.json`](pix-collection.json).

| Ambiente | Base URL |
|----------|----------|
| Sandbox | `https://baas-api-sandbox.c6bank.info` |
| Produção | `https://baas-api.c6bank.info` |

### Webhook (importante)

A documentação C6 **não fornece** uma URL fixa para colocar no `.env`. O fluxo é o inverso:

1. Você define a URL **pública do Pix GO** em `PIX_WEBHOOK_URL` (ex.: `https://api.seudominio.com/api/v1/webhooks/pix`).
2. Cadastra no C6 com **Cadastro WebHooks PIX**:

```http
PUT {C6_API_BASE_URL}/v2/pix/webhook/{C6_PIX_KEY}
Authorization: Bearer {C6_ACCESS_TOKEN}
Content-Type: application/json

{ "webhookUrl": "https://api.seudominio.com/api/v1/webhooks/pix" }
```

3. O C6 passa a enviar notificações de Pix recebido para essa URL.

Em desenvolvimento local use túnel (ngrok, Cloudflare Tunnel) e atualize `PIX_WEBHOOK_URL` + `API_PUBLIC_URL`.

### Variáveis `.env`

Ver [`.env.example`](.env.example): `PIX_GATEWAY=c6`, `C6_API_BASE_URL`, `C6_PIX_KEY`, `C6_ACCESS_TOKEN`, `PIX_WEBHOOK_URL`, `PIX_WEBHOOK_SECRET`.

### Escopo da collection

- Cobrança imediata/vencimento (`/v2/pix/cob`, `/v2/pix/cobv`)
- Pix recebidos e devolução (`/v2/pix/pix`)
- Webhooks (`/v2/pix/webhook`)

Saque outbound (UC11) pode exigir outro produto/API C6 fora desta collection — o adapter em `apps/api/src/infrastructure/payment/c6/` documenta isso.