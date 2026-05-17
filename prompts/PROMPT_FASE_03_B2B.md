# PROMPT FASE 3 — Portal B2B (CNPJ, campanhas, pacotes, analytics)

> **Pré-requisito:** Fase 2 (Pix real, wallet, moedas).  
> **Próxima fase:** `PROMPT_FASE_04_SAQUE.md`  
> **Referências:** `@USE_CASES.md` (UC03, UC05, UC08 parcial B2B, UC12) `@DATABASE_BLUEPRINT.md` (`establishments`, `campaigns`, `merchant_wallets`)

---

## Objetivo

Estabelecimentos (PJ) cadastram CNPJ, criam campanhas e pacotes de figurinhas, financiam saldo merchant e acompanham métricas. Integração Casa dos Dados ou validação local de CNPJ.

---

## UCs desta fase

| UC | Descrição |
|----|-----------|
| UC03 | Onboarding CNPJ → `establishments` + `merchant_wallets` |
| UC05 | CRUD campanhas (Smart Blending preview) |
| UC08-B2B | CRUD `sticker_packs` + sync Redis `active_packs:geo` |
| UC12 | Analytics: coletas, aberturas, ROI estimado |

---

## Pacote novo: `packages/portal-pj`

Stack: React + Vite (ou Next.js) — **separado** do PWA consumidor.

### Rotas portal

| Rota | Função |
|------|--------|
| `/login` | OAuth Google vinculado a `merchant_users` (criar tabela se necessário: `establishment_id`, `user_id`, `role`) |
| `/onboarding/cnpj` | UC03 |
| `/dashboard` | UC12 KPIs |
| `/campaigns` | Lista + criar/editar/pausar |
| `/packs` | CRUD pacotes + mapa preview |
| `/wallet` | Saldo `merchant_wallets`, recarga (mock ou Pix entrada Fase 4) |

---

## Backend

### Migrations adicionais (se faltar)

```sql
CREATE TABLE merchant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID REFERENCES establishments(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'ADMIN',
  UNIQUE(establishment_id, user_id)
);
```

### Use cases

| Arquivo | Responsabilidade |
|---------|------------------|
| `merchant/register-cnpj.use-case.ts` | Valida CNPJ (Receita/Casa dos Dados MCP), cria establishment + wallet |
| `merchant/create-campaign.use-case.ts` | `DRAFT` → `ACTIVE`, valida saldo merchant |
| `merchant/update-campaign.use-case.ts` | Pausar, editar multiplier |
| `merchant/create-sticker-pack.use-case.ts` | Geo point, `GEOADD active_packs:geo` |
| `merchant/get-analytics.use-case.ts` | Agregações: coletas/dia, packs abertos, spend vs reward |

### Guards

- `MerchantAuthGuard` — JWT com claim `establishment_id`
- Separar rotas `/api/v1/merchant/*` do consumidor

### Controllers (`/api/v1/merchant/`)

| Rota | Método |
|------|--------|
| `/register-cnpj` | POST |
| `/campaigns` | GET, POST |
| `/campaigns/:id` | PATCH |
| `/sticker-packs` | GET, POST |
| `/analytics/overview` | GET `?from=&to=` |
| `/wallet` | GET |

### Integração CNPJ

- Usar MCP **Casa dos Dados** se disponível no ambiente Cursor
- Fallback: algoritmo dígitos verificadores + tabela `cnpj_root` única em `establishments`

---

## Analytics (UC12) — métricas mínimas

- Total `wallet_transactions` por `establishment_id` (via `financial_coins.campaign_id`)
- Contagem `unified_collections` onde `asset_type=STICKER_PACK`
- Taxa conversão vídeo → coleta
- Export CSV opcional `GET /merchant/analytics/export`

---

## Docker / infra

- Adicionar serviço `portal-pj` no `docker-compose.yml` (porta 5174) — ver `INFRASTRUCTURE.md` seção portal
- Nginx reverse proxy paths `/` → PWA, `/merchant` → portal (documentar em README)

---

## Critérios de aceite

- [ ] PJ registra CNPJ único; duplicata → 409
- [ ] Campanha ACTIVE só com saldo merchant > threshold
- [ ] Novo pacote aparece no PWA mapa após GEOADD
- [ ] Dashboard mostra números coerentes com seeds + coletas Fase 2
- [ ] Consumidor não acessa rotas `/merchant/*` sem role
- [ ] Portal builda e roda em dev

---

## NÃO implementar

- UC11 saque Pix usuário final (Fase 4)
- Webhook bancário produção (Fase 4)
- Admin global temas (Fase 6)
- Hardening antifraude avançado (Fase 5)

---

## Comando Cursor

```
Implemente integralmente @prompts/PROMPT_FASE_03_B2B.md incluindo packages/portal-pj.
Não avance para Fase 4.
```
