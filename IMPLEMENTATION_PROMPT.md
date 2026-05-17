# 🎯 Prompt Mestre de Implementação — KLIPYT

> **Como usar no Cursor:** Para implementação incremental, use os prompts **por fase** em [`prompts/INDEX.md`](prompts/INDEX.md) (`PROMPT_FASE_00` … `PROMPT_FASE_06`). Este arquivo é a visão mestre; cada prompt de fase é autocontido e proíbe avançar para a fase seguinte. Referencie também `@BRD.md`, `@USE_CASES.md`, `@DATABASE_BLUEPRINT.md` e `@INFRASTRUCTURE.md`.

---

## 1. Contexto do Produto

O **KLIPYT** ([klipyt.com](https://klipyt.com)) é uma **rede social urbana georreferenciada** que combina:

- **PWA** com mapa georreferenciado em tempo real
- **WebAR** (Three.js) para captura de recompensas e outdoors virtuais
- **Play-to-Earn** com liquidação via **Pix** (Banco Central / C6 BaaS)
- **B2B:** lojistas, campanhas, emissão de moedas e locação de outdoors DOOH
- **B2C Fase 1:** álbum digital de figurinhas gratuito para aquisição viral
- **B2C Fase 2+:** moedas colecionáveis, marketplace P2P (10%) e saque mínimo **R$ 6,00**

---

## 2. Documentos Fonte (Leitura Obrigatória)

| Arquivo | Função |
|---------|--------|
| `BRD.md` | Regras de negócio: RN01–04, RF01–14 |
| `USE_CASES.md` | 12 casos de uso com fluxos e Gherkin |
| `DATABASE_BLUEPRINT.md` | DDL PostgreSQL + PostGIS + Redis |
| `INFRASTRUCTURE.md` | Docker Compose local |

**Regra:** Toda implementação deve rastrear um ID (`RNxx`, `RFxx`, `UCxx`). Se não existir no BRD/UC, não implemente.

---

## 3. Stack Tecnológica Homologada

| Camada | Tecnologia | Observação |
|--------|------------|------------|
| **PWA** | React + Vite + PWA manifest | Mobile-first, GPS obrigatório |
| **Mapa** | Leaflet ou Mapbox GL | Consumir `GET /api/v1/map/layers` |
| **WebAR** | Three.js + `getUserMedia` | Moeda 3D flutuante pós-vídeo |
| **Backend** | **NestJS (TypeScript)** preferencial | Clean Architecture + DDD |
| **Banco** | PostgreSQL 15 + **PostGIS** | Coordenadas WGS84, `ST_Distance` |
| **Cache** | Redis 7 | GEO, Hash, TTL, rate limits |
| **Vídeo** | FFmpeg (`ffprobe`) na VPS | Validação 15–30s, max 15MB |
| **Storage** | Cloudflare R2 (S3-compatible) | Vídeos promocionais |
| **Auth PF** | Google OAuth 2.0 + JWT | Status `INCOMPLETE` / `VERIFIED` |
| **Auth PJ** | JWT separado (tenant lojista) | Portal B2B |
| **Pix** | API C6 Bank BaaS (`pix-collection.json`) | Webhook assíncrono, TLS 1.3 |
| **CNPJ/CPF** | API Receita + Bureau cadastral | Geocoding OSM/Google |
| **Infra local** | Docker Compose (`INFRASTRUCTURE.md`) | PostGIS + Redis |
| **Produção** | VPS Hetzner (citado na spec) | Upload temporário `/tmp/uploads` |

---

## 4. Arquitetura de Software (Obrigatória)

Aplicar **Clean Architecture + DDD** rigorosamente. A camada de **Domínio** não importa NestJS, TypeORM, Redis nem HTTP.

```
klipyt/
├── apps/
│   ├── api/                          # NestJS — backend principal
│   └── pwa/                          # React PWA — usuário final
├── packages/
│   └── portal-pj/                    # React — painel lojista (pode ser app separado)
├── docker-compose.yml                # Espelhar INFRASTRUCTURE.md
├── BRD.md
├── USE_CASES.md
├── DATABASE_BLUEPRINT.md
└── IMPLEMENTATION_PROMPT.md
```

### Estrutura interna do backend (`apps/api/src/`)

```
src/
├── domain/
│   ├── entities/           # User, Campaign, FinancialCoin, Sticker, Establishment
│   ├── value-objects/      # Cpf, Cnpj, GeoPoint, Money, PinCode
│   ├── enums/              # user_status, rarity, campaign_status, tx_status
│   └── services/           # SmartBlendingCalculator, RarityRoller, GeoValidator
├── use-cases/
│   ├── auth/               # UC01 — google-login
│   ├── user/               # UC02 — upgrade-account
│   ├── establishment/      # UC03 — import-cnpj-branches
│   ├── campaign/           # UC04 upload-video, UC05 create-campaign, UC12 analytics
│   ├── map/                # UC06 — get-map-layers
│   ├── collect/            # UC07 — validate-and-collect-coin
│   ├── album/              # UC08 open-pack, UC10 trade-pin
│   ├── sticker/            # UC09 — redeem-coupon
│   └── wallet/             # UC11 — withdraw-pix
├── infrastructure/
│   ├── database/           # TypeORM/Prisma + migrations PostGIS
│   ├── redis/              # GeoRepository, PinTradeGateway, RateLimitStore
│   ├── storage/            # CloudflareR2Adapter
│   ├── video/              # FfmpegProbeService
│   ├── payment/            # PixGateway C6 (pix-collection.json)
│   ├── external/           # ReceitaFederalApi, BureauApi, GeocodingApi
│   └── http/               # Controllers, DTOs, guards, filters
└── main.ts
```

### Regras de dependência

- `use-cases` → depende apenas de `domain` + **ports** (interfaces)
- `infrastructure` → implementa ports; nunca é importada por `domain`
- Controllers apenas orquestram: `DTO → UseCase → Response`

---

## 5. Modelo de Dados e Redis (Resumo Executivo)

Implementar **exatamente** o DDL de `DATABASE_BLUEPRINT.md`:

| Tabela | Fase | Uso principal |
|--------|------|---------------|
| `platform_settings` | 0 | `global_margin`, `fase_monetizacao_ativa`, `tema_ativo` |
| `users` | 1+ | OAuth, `wallet_balance`, `fraud_flag` |
| `establishments` | 1+ | `cnpj_root` + `cnpj` filial + `geom` GIST |
| `merchant_wallets` | 2+ | Crédito PJ pós-campanha |
| `campaigns` | 2+ | Orçamento, vídeo, janela 6h |
| `financial_coins` | 2+ | Moedas 60/40 + GIST |
| `sticker_packs` | 1 | Pontos de pacote no mapa |
| `stickers` | 1 | Catálogo 70/25/5 |
| `user_stickers` | 1 | Inventário + `qr_token` |
| `unified_collections` | 1+ | Rate limit 24h |
| `wallet_transactions` | 2+ | Saques Pix |

### Chaves Redis obrigatórias

| Chave | Comando | UC |
|-------|---------|-----|
| `active_coins:geo` | GEOADD / GEOSEARCH 5km | UC05, UC06, UC07 |
| `active_packs:geo` | GEOADD / GEOSEARCH 5km | UC08 |
| `campaign:{id}:coins` | HSET metadados | UC06 |
| `trade:pin:{pin}` | HSET + EXPIRE 120 | UC10 |
| `video:token:{user}:{coin}` | SET EX 300 | UC07 |
| `rate:cpf:{cpf}:est:{id}` | SET EX 86400 | UC07 |
| `rate:cpf:{cpf}:pack:{id}` | SET EX 86400 | UC08 |

---

## 6. Catálogo de APIs REST (`/api/v1`)

Implementar controllers finos; lógica nos use-cases.

### Auth e usuário (Fase 1–2)

| Método | Rota | UC | Descrição |
|--------|------|-----|-----------|
| POST | `/auth/google` | UC01 | OAuth callback → JWT |
| POST | `/user/upgrade` | UC02 | CPF + Pix → `VERIFIED` |
| GET | `/user/me` | — | Perfil + saldo + status |

### Mapa e álbum (Fase 1)

| Método | Rota | UC | Descrição |
|--------|------|-----|-----------|
| GET | `/map/layers?lat=&lon=` | UC06 | Moedas + pacotes filtrados por perfil |
| POST | `/album/open-pack` | UC08 | Sorteio 3 cards 70/25/5 |
| POST | `/album/trade/generate-pin` | UC10 | Gera PIN 4 dígitos |
| POST | `/album/trade/confirm-pin` | UC10 | Confirma troca local |
| POST | `/stickers/redeem` | UC09 | Queima cupom PDV |

### Portal B2B (Fase 2–3)

| Método | Rota | UC | Descrição |
|--------|------|-----|-----------|
| POST | `/merchant/establishments/import-cnpj` | UC03 | Importa filiais |
| POST | `/campaign/upload-video` | UC04 | FFmpeg + R2 |
| POST | `/campaigns` | UC05 | Smart Blending + Redis |
| GET | `/campaigns/{id}/analytics` | UC12 | Relatório pós-campanha |

### Monetização PF (Fase 2)

| Método | Rota | UC | Descrição |
|--------|------|-----|-----------|
| POST | `/campaigns/collect` | UC07 | Coleta antifraude tripla |
| POST | `/wallet/withdraw` | UC11 | Saque Pix |
| POST | `/webhooks/pix` | UC11 | Confirma `COMPLETED` |

### Admin Master

| Método | Rota | RF | Descrição |
|--------|------|-----|-----------|
| PATCH | `/admin/settings/global-margin` | RN01 | Altera take rate |
| PATCH | `/admin/settings/fase-monetizacao` | RF14 | Liga Pix Real no PWA |
| PATCH | `/admin/settings/tema` | RF10 | Tema sazonal |

---

## 7. Fases de Implementação (Ordem Estrita)

### FASE 0 — Fundação e Infraestrutura (Sprint 0)

**Objetivo:** Ambiente reproduzível e esqueleto arquitetural.

**Tarefas:**

1. Subir `docker-compose` conforme `INFRASTRUCTURE.md` (PostGIS + Redis).
2. Criar monorepo NestJS + React PWA com estrutura de pastas da seção 4.
3. Rodar migration inicial com **todo** o DDL de `DATABASE_BLUEPRINT.md`.
4. Seed `platform_settings`:
   - `global_margin` → `0.40`
   - `fase_monetizacao_ativa` → `false`
   - `tema_ativo` → `"COPA"`
5. Configurar módulos: `ConfigModule`, `TypeORM/Prisma + PostGIS`, `RedisModule`, health checks.
6. Implementar `GeoValidator` de domínio: `ST_Distance <= 25m` usando geography.
7. Pipeline CI: lint, testes unitários, migration up/down.

**Entregável:** API sobe em `localhost:3000`, banco migrado, Redis conectado.

**Não implementar ainda:** OAuth, mapa, Pix.

---

### FASE 1 — MVP Viral: Álbum da Copa (B2C sem dinheiro real)

**Objetivo:** Usuários entram com Google, caçam pacotes no mapa, abrem figurinhas, trocam por PIN e queimam cupom no PDV. **Sem** moedas financeiras visíveis (`fase_monetizacao_ativa = false`).

**Regras ativas:** RF11, RF12, RF13, RF14 (banners teaser), RN03 (2 pacotes/dia/filial).

| Ordem | UC | Backend | PWA |
|-------|-----|---------|-----|
| 1.1 | UC01 | `GoogleLoginUseCase`, JWT, tabela `users` | Tela login Google, guard de rotas |
| 1.2 | UC03 (parcial) | Import manual ou mock de 3 `establishments` + `sticker_packs` + seed `stickers` | — |
| 1.3 | UC08 | `OpenPackUseCase`, `RarityRoller` (70/25/5), `unified_collections` | Mapa pacotes, animação "rasgar pacote" |
| 1.4 | UC09 | `RedeemCouponUseCase`, QR assinado | Tela cupom + QR |
| 1.5 | UC10 | `GeneratePinUseCase`, `ConfirmPinUseCase`, Redis TTL 120s | UI troca local |
| — | RF14 | Endpoint settings → PWA lê banners | Teasers "Em breve Pix Real" no mapa e carteira demo |

**PWA — requisitos de UI (Fase 1):**

- Mapa com ícones de **pacotes** (`active_packs:geo`).
- Álbum 3D com folheamento (CSS/Three.js leve ou biblioteca de flip).
- Slots vazios com silhueta neon numerada.
- Cards: Common estático; Rare metalizado (giroscópio); Legendary holográfico + vídeo 3s.
- Carteira em **modo demonstração** (saldo fake ou oculto).

**Testes obrigatórios:** Cenários Gherkin UC01, UC08 (2), UC09 (2), UC10 (2) em `.feature` ou e2e.

**Gate para Fase 2:** Todos os testes da Fase 1 verdes + demo com 1 loja parceira no mapa.

---

### FASE 2 — Onboarding Financeiro e Mapa de Moedas (Pix Real)

**Objetivo:** Ativar monetização. Usuário faz upgrade (CPF/Bureau), vê moedas no mapa, assiste vídeo, captura com antifraude, acumula saldo.

**Pré-requisito:** `fase_monetizacao_ativa = true` no admin (RF14).

| Ordem | UC | Implementação |
|-------|-----|---------------|
| 2.1 | UC02 | Bureau API, validação +18, `faixa_etaria`, chave Pix = CPF |
| 2.2 | UC04 | Upload multipart, `/tmp`, ffprobe 15–30s, stream R2 |
| 2.3 | UC05 | `CreateCampaignUseCase`: RN01 retenção 40%, RF03 split 60/40, persist `financial_coins`, `GEOADD active_coins:geo` |
| 2.4 | UC06 | `GetMapLayersUseCase`: filtro por `faixa_etaria`, ocultar `is_qualified` para jovens |
| 2.5 | UC07 | Player vídeo sem skip; token Redis; hash HMAC; `ST_Distance`; credita `wallet_balance` |

**PWA — requisitos adicionais:**

- Bloqueio se `navigator.geolocation` reportar mock.
- Moedas **Bronze** vs **Baú de Ouro** (sprites distintos).
- Fluxo: aproximar → desbloquear → vídeo fullscreen → WebAR → toque captura.
- Carteira real com saldo e botão sacar **bloqueado** até R$ 6,00.

**Domínio crítico — `SmartBlendingCalculator`:**

```
budget_net = budget_gross * (1 - global_margin)
qualified_pool = budget_net * 0.60  → N moedas alto valor (interno PDV)
volume_pool    = budget_net * 0.40  → M moedas baixo valor (calçada)
```

**Testes:** Gherkin UC02, UC04 (2), UC05, UC06, UC07 (3 cenários).

---

### FASE 3 — Portal B2B Completo (Lojista)

**Objetivo:** Lojista autônomo: CNPJ → filiais → campanha → analytics.

| Ordem | UC | Implementação |
|-------|-----|---------------|
| 3.1 | UC03 | Integração API Receita real + geocoding em lote |
| 3.2 | UC04/05 | Wizard campanha no Portal PJ (orçamento, vídeo, segmentação, horário max 6h) |
| 3.3 | UC12 | Job pós `end_time`: agrega métricas RF04, credita `merchant_wallets` |
| 3.4 | UC09 | Scanner QR no Portal PJ (câmera desktop) |

**Portal PJ — telas:**

- Dashboard campanhas ativas/encerradas.
- Importador CNPJ com mapa de filiais.
- Relatório CPV, retenção vídeo, permanência média.
- Validador de cupom.

---

### FASE 4 — Liquidação Pix e Webhooks (Wallet)

**Objetivo:** Saque automático sem taxa por transação (RN02).

| Ordem | UC | Implementação |
|-------|-----|---------------|
| 4.1 | UC11 | `WithdrawPixUseCase`: valida saldo >= 6, debita, `wallet_transactions PENDING` |
| 4.2 | — | Cliente HTTP Pix C6 BaaS, idempotency key |
| 4.3 | — | `POST /webhooks/pix`: atualiza `COMPLETED` + `end_to_end_id`; em falha → `FAILED` + estorno `wallet_balance` |

**Regras:**

- Chave Pix **somente CPF** vinculado ao CPF validado (RF05).
- Usuário com `fraud_flag = true` → bloquear saque.
- Transação SQL isolada no débito (evitar double-spend).

**Testes:** Gherkin UC11 (2 cenários) + teste integração webhook mock.

---

### FASE 5 — Segurança, Antifraude e Hardening

**Objetivo:** Produção-ready.

1. **RN03:** Middleware rate limit Redis + fallback SQL `unified_collections`.
2. **RN04 camada 1:** Guard no PWA (mock GPS).
3. **RN04 camada 2:** Validação HMAC no `CollectCoinUseCase`.
4. **RN04 camada 3:** `ST_Distance` + auditoria `fraud_flag`.
5. JWT blacklist Redis para logout/revogação.
6. Rate limiting global por IP nas rotas de coleta.
7. Logs estruturados (sem vazar CPF completo — mascarar).
8. Testes de carga no `GEOSEARCH` (simular 5k usuários no raio).

---

### FASE 6 — Admin Master, Temas Sazonais e Polimento

**Objetivo:** Operação da plataforma sem deploy de código.

1. **RF10:** Endpoints de tema → PWA altera ícones (corações, bolas, etc.) e sons.
2. **RN01:** Painel altera `global_margin` (só campanhas novas).
3. **RF14:** Toggle `fase_monetizacao_ativa` remove banners teaser.
4. CMS simples para textos dos banners (RF14).
5. Métricas internas: take rate acumulado, fraudes bloqueadas, pacotes abertos/dia.

---

## 8. Matriz de Rastreabilidade (RF → UC → Código)

| RF/RN | UC | Use Case (arquivo sugerido) |
|-------|-----|----------------------------|
| RF05 Fase 1 | UC01 | `google-login.use-case.ts` |
| RF05 Fase 2 | UC02 | `upgrade-account.use-case.ts` |
| RF01 | UC03 | `import-cnpj-branches.use-case.ts` |
| RF02 | UC04 | `upload-campaign-video.use-case.ts` |
| RF03 + RN01 | UC05 | `create-campaign.use-case.ts` + `smart-blending.calculator.ts` |
| RF06 | UC06 | `get-map-layers.use-case.ts` |
| RF07 + RN04 | UC07 | `collect-coin.use-case.ts` |
| RF11 | UC08 | `open-pack.use-case.ts` + `rarity-roller.service.ts` |
| RF12 | UC09 | `redeem-sticker-coupon.use-case.ts` |
| RF13 | UC10 | `generate-trade-pin.use-case.ts` + `confirm-trade-pin.use-case.ts` |
| RF08 + RN02 | UC11 | `withdraw-pix.use-case.ts` |
| RF04 | UC12 | `get-campaign-analytics.use-case.ts` |
| RN03 | UC07, UC08 | `rate-limit.service.ts` |
| RF14 | Fase 1 PWA | `TeaserBanner.tsx` + settings guard |
| RF10 | Fase 6 | `theme.service.ts` |

---

## 9. Regras de Implementação para o Cursor (Não Negociáveis)

1. **Não resuma** regras do BRD. Implemente os valores exatos (40%, 60/40, 25m, R$ 6,00, 70/25/5, 120s PIN).
2. **Não use placeholders** tipo `// TODO implementar`. Entregue código compilável por fase.
3. **Toda rota** citada em `USE_CASES.md` deve existir com DTO validado (`class-validator`).
4. **PostGIS:** use `::geography` em `ST_Distance` para metros reais.
5. **Transações:** coleta de moeda e saque Pix devem ser atômicos (`@Transactional`).
6. **Redis + Postgres:** Postgres é fonte da verdade; Redis é cache/consulta rápida — sincronize na criação de campanha (UC05).
7. **Segredos:** `.env` para OAuth, R2, Pix, Bureau — nunca commitar.
8. **Testes:** para cada UC, pelo menos 1 teste unitário do use-case + 1 e2e do Gherkin principal.
9. **PWA offline:** cache de assets; mapa exige online (GPS).
10. Ao conflitar conversa antiga com `BRD.md` v2.0.0, **prevalece o BRD.md do repositório**.

---

## 10. Variáveis de Ambiente (`.env.example`)

```env
# App
NODE_ENV=development
API_PORT=3000
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://klipyt_admin:klipyt_strong_password@localhost:5432/klipyt_prod

# Redis
REDIS_URL=redis://localhost:6379

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# External APIs
RECEITA_FEDERAL_API_KEY=
BUREAU_API_KEY=
GEOCODING_API_KEY=

# Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# Pix — C6 Bank (ver pix-collection.json e INFRASTRUCTURE.md)
PIX_GATEWAY=c6
C6_API_BASE_URL=https://baas-api-sandbox.c6bank.info
C6_ACCESS_TOKEN=
C6_PIX_KEY=
PIX_WEBHOOK_URL=http://localhost:3000/api/v1/webhooks/pix
PIX_WEBHOOK_SECRET=

# Platform defaults
GLOBAL_MARGIN=0.40
FASE_MONETIZACAO_ATIVA=false
```

---

## 11. Critérios de Aceite por Fase (Checklist)

### Fase 1 ✅
- [ ] Login Google cria `INCOMPLETE` sem CPF
- [ ] Mapa mostra pacotes em raio 5km
- [ ] Abertura de pacote sorteia 3 cards com pesos corretos
- [ ] Limite 2 pacotes/dia/filial funciona (429)
- [ ] Cupom QR queima uma vez (409 na segunda)
- [ ] Troca PIN expira em 120s (410)
- [ ] Banners "Em breve Pix Real" visíveis com monetização desligada

### Fase 2 ✅
- [ ] Upgrade bloqueia menor de 18
- [ ] Vídeo >30s rejeitado (400)
- [ ] Campanha R$1000 gera 120+480 moedas com margem 40%
- [ ] Usuário 20 anos não vê baús qualificados 35+
- [ ] Coleta credita saldo só dentro de 25m
- [ ] Mock GPS bloqueia mapa no cliente

### Fase 3 ✅
- [ ] CNPJ matriz importa N filiais com geom
- [ ] Relatório pós-campanha devolve saldo não consumido à carteira PJ

### Fase 4 ✅
- [ ] Saque bloqueado abaixo de R$ 6,00
- [ ] Webhook Pix confirma `COMPLETED`
- [ ] `fraud_flag` impede saque

---

## 12. Comando Inicial Sugerido para o Cursor

**Recomendado:** abra o prompt da fase em `prompts/` (ver [INDEX.md](prompts/INDEX.md)) e cole o bloco "Comando Cursor" do final do arquivo.

Exemplo Fase 2:

```
Implemente integralmente @prompts/PROMPT_FASE_02_PIX_REAL.md
Leia também: @BRD.md @USE_CASES.md @DATABASE_BLUEPRINT.md @INFRASTRUCTURE.md
Não avance para a próxima fase.
```

| Fase | Arquivo |
|------|---------|
| 0 | `prompts/PROMPT_FASE_00_FUNDACAO.md` |
| 1 | `prompts/PROMPT_FASE_01_ALBUM.md` |
| 2 | `prompts/PROMPT_FASE_02_PIX_REAL.md` |
| 3 | `prompts/PROMPT_FASE_03_B2B.md` |
| 4 | `prompts/PROMPT_FASE_04_SAQUE.md` |
| 5 | `prompts/PROMPT_FASE_05_HARDENING.md` |
| 6 | `prompts/PROMPT_FASE_06_ADMIN.md` — **aplicação completa** |

---

## 13. Visão de Roadmap (Produto)

```text
Fase 1 (Álbum)     → Aquisição viral, prova de tráfego para lojistas
       ↓
Fase 2 (Pix Real)  → Monetização B2C + campanhas pagas
       ↓
Fase 3 (Portal PJ) → Self-service B2B + analytics
       ↓
Fase 4 (Pix out)   → Liquidação e receita recorrente
       ↓
Fase 5–6           → Escala, antifraude, temas sazonais
```

---

**Versão deste prompt:** 1.0.0  
**Alinhado a:** BRD v2.0.0, 12 UCs, conversa Gemini ([link compartilhado](https://gemini.google.com/share/9a9a8c1ba55c))  
**Última atualização:** Maio/2026