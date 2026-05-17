# KLIPYT — Rede de Mídia e Engajamento Urbano

**Domínio:** [klipyt.com](https://klipyt.com)  
**Stack:** NestJS + TypeORM + PostGIS + Redis | React PWA + Vite + Leaflet | Docker Compose

Rede social urbana georreferenciada que combina **álbum digital (Fase 1)**, **moedas com Pix real (Fase 2+)**, **marketplace P2P**, **outdoors virtuais DOOH** e **portal B2B** para lojistas.

---

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [BRD.md](BRD.md) | Regras de negócio (RN01–04, RF01–14) |
| [USE_CASES.md](USE_CASES.md) | 12 casos de uso + Gherkin |
| [DATABASE_BLUEPRINT.md](DATABASE_BLUEPRINT.md) | DDL PostgreSQL/PostGIS + Redis |
| [INFRASTRUCTURE.md](INFRASTRUCTURE.md) | Docker Compose local |
| [IMPLEMENTATION_PROMPT.md](IMPLEMENTATION_PROMPT.md) | Prompt mestre para o Cursor (fases, APIs, DDD) |
| [prompts/INDEX.md](prompts/INDEX.md) | **Prompts por fase** (00→06) — execute na ordem para app completa |

Gerar/atualizar os `.md` a partir do script:

```bash
python gerar_docs.py
```

---

## Pré-requisitos

- Node.js >= 20
- Docker Desktop (PostgreSQL + PostGIS + Redis)
- npm >= 10

---

## Setup Inicial

PostgreSQL do Docker usa a porta **5433** no host (a 5432 costuma estar ocupada por outro Postgres no Windows).

```powershell
# 1. Variáveis de ambiente (raiz do repo)
Copy-Item .env.example .env
# Preencher GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.

# 2. Banco e Redis
docker compose up -d

# 3. API
cd apps\api
npm install
npm run migration:run
npm run db:seed
npm run dev
# http://localhost:3000/api/v1/health
```

> **PowerShell:** use `;` em vez de `&&` para encadear comandos, ou rode um `npm run` por linha.

### PWA

```powershell
cd apps\pwa
npm install
npm run dev
# http://localhost:5173
```

### Testes

```powershell
cd apps\api
npm run test
npm run test:cov
npm run test:e2e
```

---

## Estrutura do Repositório

```
klipyt/
├── apps/
│   ├── api/                    # NestJS (porta 3000)
│   └── pwa/                    # React PWA (porta 5173)
├── packages/
│   └── portal-pj/              # Portal lojista (a partir da Fase 3)
├── docker-compose.yml
├── prompts/                  # PROMPT_FASE_00 … 06 (ver INDEX.md)
├── gerar_docs.py
├── BRD.md
├── USE_CASES.md
├── DATABASE_BLUEPRINT.md
├── INFRASTRUCTURE.md
└── IMPLEMENTATION_PROMPT.md
```

---

## Status da implementação

**Última revisão:** maio/2026 · Commits: `4a20c31` (Fase 0), `43e9055` (Fase 1 API/PWA MVP) · Prompts: [`prompts/INDEX.md`](prompts/INDEX.md)

| Fase | Nome | API | PWA E2E | Situação |
|------|------|-----|---------|----------|
| **0** | Fundação | ✅ | — | Concluída |
| **1** | Álbum da Copa | ✅ | ⚠️ | **API entregue**; integração mapa/álbum pendente |
| **2** | Pix Real | ⏳ | ⏳ | Próxima (`@prompts/PROMPT_FASE_02_PIX_REAL.md`) |
| **3** | Portal B2B | ⏳ | ⏳ | Não iniciada |
| **4** | Saque Pix | ⏳ | ⏳ | Não iniciada |
| **5** | Hardening | ⏳ | ⏳ | Não iniciada |
| **6** | Admin / temas | ⏳ | ⏳ | Não iniciada |

**Testes:** `18/18` passando em `apps/api` (`npx jest --no-coverage`).

### Fase 0 — ✅ Concluída (`feat(fase-0)`)

| Item | Status |
|------|--------|
| `docker-compose.yml` (PostGIS **:5433**, Redis **:6379**) | ✅ |
| Migration `InitialSchema` (DDL completo + PostGIS) | ✅ |
| Seeds: `platform_settings`, 3 estabelecimentos, pacotes, figurinhas | ✅ |
| Entidades TypeORM (11 tabelas) | ✅ |
| `GeoValidatorService` + testes unitários | ✅ |
| `GET /api/v1/health` (Postgres + Redis) | ✅ |
| Clean Architecture (`domain` / `use-cases` / `infrastructure`) | ✅ |
| CI GitHub Actions | ❌ |

### Fase 1 — ✅ API completa · ⚠️ PWA (fechamento E2E)

Entregue no commit `feat(fase-1): MVP Álbum da Copa` — use cases e componentes abaixo **existem e compilam**; o fluxo completo no celular ainda exige ligar mapa/álbum à API.

#### O que foi implementado (confirmado no código)

| UC | Escopo | API | PWA |
|----|--------|-----|-----|
| **UC01** | Google OAuth → JWT, `status=INCOMPLETE` | ✅ `GoogleStrategy`, `JwtStrategy`, `GoogleLoginUseCase`, `/auth/google` + callback | ✅ `LoginPage`, `AuthCallbackPage` (token → `localStorage` → `/mapa`) |
| **UC08** | Abrir pacote: 25 m, 2/dia/filial, sorteio 70/25/5, `qr_token` Rara/Lendária | ✅ `POST /album/open-pack`, `RarityRoller`, rate limit Redis | ⚠️ `openPack()` em `api.ts`; **mapa não chama** |
| **UC09** | Cupom PDV: `NOT_REDEEMED` → `REDEEMED`, 409/404 | ✅ `POST /stickers/redeem` + testes | ⚠️ `StickerCard` + `redeemCoupon`; **álbum não lista figurinhas** |
| **UC10** | PIN 4 dígitos, TTL 120 s, proximidade 25 m | ✅ `generate-pin` / `confirm-pin` + testes (410/403) | ✅ `TradePinModal` |
| **RF14** | Teasers com `fase_monetizacao_ativa=false` | ✅ `GET /settings/public` | ⚠️ `TeaserBanner` + `useSettings` existem; mapa/carteira usam banner **estático** |
| **Demo** | Seeds SP | ✅ 3 estabelecimentos + **30 figurinhas** (10 jogadores × 3 lojas) | — |

**Componentes PWA adicionais:** `StickerCard` (visual Bronze/Prata/Ouro), `useAuth`, rotas `/auth/callback`, nav inferior no álbum.

#### Pendências para “Fase 1 E2E 100%” (antes da Fase 2)

| Item | Motivo |
|------|--------|
| `GET /album/packs/nearby` + `GEOADD active_packs:geo` no seed | Mapa sem marcadores de pacote |
| `GET /user/stickers` (ou incluir no `/user/me`) | `AlbumPage` ainda com placeholder |
| `MapPage` consumir API + modal “Rasgar pacote” | UC08 só testável via API/Postman hoje |
| Usar `TeaserBanner` + `useSettings` no mapa/carteira | RF14 dinâmico conforme settings |

### Fases 2–6 — ⏳ Não iniciadas

| Fase | O que falta (visão geral) |
|------|---------------------------|
| **2** | UC02 upgrade CPF, UC04 vídeo, UC05 campanhas + `active_coins:geo`, UC06/07 mapa de moedas e coleta, carteira real |
| **3** | `packages/portal-pj`, UC03 CNPJ, CRUD campanhas/pacotes PJ, UC12 analytics |
| **4** | UC11 saque Pix ≥ R$ 6,00, gateway + webhook |
| **5** | Throttle, CI, observabilidade, antifraude reforçado, PWA offline |
| **6** | `packages/admin`, temas/CMS, WebAR mínimo, go-live |

**Já no código (preparação para fases futuras, sem fluxo de negócio):** entidades `Campaign`, `FinancialCoin`, `MerchantWallet`; `SmartBlendingCalculatorService` + teste unitário; `RedisService.geoSearch` (não usado em use case ainda).

---

## Fases de Implementação

Ordem **obrigatória** (detalhes em [IMPLEMENTATION_PROMPT.md](IMPLEMENTATION_PROMPT.md) e prompts em [`prompts/`](prompts/INDEX.md)).  
**Nota:** “Fase 2” no roadmap de implementação = sprint **Pix Real** (UC02–07). No BRD, “Fase 2 do usuário” = upgrade CPF/Pix (UC02), incluída nesse sprint.

| Fase | Nome | UCs / RF | Status |
|------|------|----------|--------|
| **0** | Fundação | Migrations, Redis, DDD, `GeoValidator` | ✅ |
| **1** | Álbum da Copa | UC01, UC08, UC09, UC10, RF14 | ✅ API · ⚠️ PWA E2E |
| **2** | Pix Real (mapa + coleta) | UC02, UC04, UC05, UC06, UC07 | ⏳ **próxima** |
| **3** | Portal B2B | UC03, UC12, wizard UC04/05, scanner UC09 | ⏳ |
| **4** | Saque Pix | UC11, webhook banco | ⏳ |
| **5** | Antifraude (hardening) | RN03, RN04 (reforço produção) | ⏳ |
| **6** | Admin / temas | RF10, RN01, RF14, CMS banners | ⏳ |

---

### Fase 0 — Fundação

- Docker PostGIS + Redis (`INFRASTRUCTURE.md`)
- Migration com DDL completo (`DATABASE_BLUEPRINT.md`)
- Seed `platform_settings`: `global_margin=0.40`, `fase_monetizacao_ativa=false`, `tema_ativo=COPA`
- Esqueleto Clean Architecture (`domain` / `use-cases` / `infrastructure`)

**Entregável:** API + health check; banco migrado.

---

### Fase 1 — Álbum da Copa (sem Pix real)

**Objetivo:** Aquisição viral — pacotes no mapa, figurinhas 70/25/5, cupom PDV, troca por PIN.  
**Flag:** `fase_monetizacao_ativa = false` → banners “Em breve Pix Real”.

| UC | Escopo |
|----|--------|
| UC01 | Login Google → `users.status = INCOMPLETE` |
| UC08 | Abrir pacote (2/dia/filial), sorteio 70/25/5 |
| UC09 | Queima cupom QR no caixa |
| UC10 | Troca local PIN (Redis TTL 120s) |
| RF14 | Teasers no mapa e carteira demo |

**Gate para Fase 2:** API Fase 1 verde (✅) + opcional fechar integração PWA (mapa/álbum) ou seguir para Pix Real em paralelo.

---

### Iniciar Fase 2 — Pix Real

```
Implemente integralmente @prompts/PROMPT_FASE_02_PIX_REAL.md

Leia também: @BRD.md @USE_CASES.md @DATABASE_BLUEPRINT.md
```

**Escopo Fase 2:** UC02 (CPF/Bureau), UC04 (vídeo), UC05 (campanha Smart Blending + `active_coins:geo`), UC06 (mapa por faixa etária), UC07 (coleta + antifraude + `wallet_balance`).

**Subir ambiente (PowerShell):**

```powershell
docker compose up -d
cd apps\api
npm run migration:run
npm run db:seed
npm run dev
```

---

### Fase 2 — Onboarding financeiro e mapa de moedas (Pix Real)

**Objetivo:** Monetização B2C — upgrade CPF, campanhas, moedas Bronze/Baú, vídeo + WebAR, saldo em carteira.  
**Pré-requisito:** `fase_monetizacao_ativa = true`.

| Ordem | UC | Escopo |
|-------|-----|--------|
| 2.1 | UC02 | Bureau +18 anos, `faixa_etaria`, Pix chave CPF → `VERIFIED` |
| 2.2 | UC04 | Upload vídeo 15–30s, 15MB, FFmpeg + Cloudflare R2 |
| 2.3 | UC05 | Smart Blending 60/40, take rate 40%, `financial_coins` + `active_coins:geo` |
| 2.4 | UC06 | Mapa filtra baús 35+ para usuários jovens |
| 2.5 | UC07 | Vídeo rewarded + WebAR + antifraude triplo + `wallet_balance` |

**PWA:** mock GPS bloqueado; sacar **bloqueado** até R$ 6,00 (saque na Fase 4).

**Smart Blending:**

```
budget_net = budget_gross × (1 - global_margin)
qualified_pool = budget_net × 0.60   # moedas altas (interno PDV)
volume_pool    = budget_net × 0.40   # moedas baixas (calçada)
```

**Checklist Fase 2:**

- [ ] Upgrade bloqueia menor de 18
- [ ] Vídeo >30s → HTTP 400
- [ ] Campanha R$ 1.000 → 120×R$3 + 480×R$0,50 (margem 40%)
- [ ] Usuário 20 anos não vê moedas qualificadas 35+
- [ ] Coleta só com `ST_Distance` ≤ 25 m
- [ ] Mock GPS bloqueia mapa no cliente

---

### Fase 3 — Portal B2B (lojista)

| UC | Escopo |
|----|--------|
| UC03 | Import CNPJ matriz → filiais + geocoding PostGIS |
| UC04/05 | Wizard campanha (orçamento, vídeo, segmentação, janela ≤ 6h) |
| UC12 | Analytics pós-campanha, CPV, crédito `merchant_wallets` |
| UC09 | Scanner QR cupom no painel PJ |

---

### Fase 4 — Saque Pix

| UC | Escopo |
|----|--------|
| UC11 | Saque ≥ R$ 6,00, API C6 BaaS, webhook → `COMPLETED` |

- Chave Pix somente CPF validado
- `fraud_flag` bloqueia saque

---

### Fase 5 — Antifraude (produção)

Reforço de RN03/RN04: rate limit Redis, HMAC payload, auditoria, JWT blacklist, testes de carga `GEOSEARCH`.

---

### Fase 6 — Admin master

RF10 temas sazonais, RN01 `global_margin`, RF14 toggle monetização, CMS de banners.

---

## Roadmap (produto)

```text
Fase 1 (Álbum)     → Tráfego viral, isca para lojistas
       ↓
Fase 2 (Pix Real)  → Moedas, campanhas, coleta, carteira
       ↓
Fase 3 (Portal PJ) → CNPJ, campanhas self-service, analytics
       ↓
Fase 4 (Pix out)   → Liquidação automática
       ↓
Fase 5–6           → Escala, antifraude, temas, admin
```

---

## Cursor — implementar fase a fase

Use os prompts autocontidos em [`prompts/`](prompts/INDEX.md), **na ordem 00 → 06**. Exemplo Fase 1:

```
Implemente integralmente @prompts/PROMPT_FASE_01_ALBUM.md

Leia também: @BRD.md @USE_CASES.md @DATABASE_BLUEPRINT.md @INFRASTRUCTURE.md

Não avance para a próxima fase. Não invente regras fora dos documentos.
```

Visão geral de todas as fases: `@IMPLEMENTATION_PROMPT.md`. Após a **Fase 6**, a aplicação deve estar completa (PWA + API + Portal PJ + Admin).

**Atalho Fase 2:** no Composer, peça `continue fase 2` referenciando `@prompts/PROMPT_FASE_02_PIX_REAL.md`.
