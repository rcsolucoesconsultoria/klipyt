# PROMPT FASE 2 — Pix Real (monetização, mapa de moedas, antifraude)

> **Pré-requisito:** Fase 1 completa (álbum, pacotes, PIN, cupom).  
> **Próxima fase:** `PROMPT_FASE_03_B2B.md`  
> **Referências:** `@BRD.md` (RF01–04, RF06–10, RN01–02) `@USE_CASES.md` (UC02, UC04–07)

---

## Objetivo

Ativar monetização real: usuário completa CPF, vê moedas Pix no mapa, assiste vídeo rewarded, coleta com antifraude (geofence + device fingerprint), Smart Blending de margem.  
`fase_monetizacao_ativa = true` remove teasers e habilita fluxos financeiros.

---

## UCs desta fase

| UC | RF/RN | Descrição |
|----|-------|-----------|
| UC02 | RF01 | Upgrade `INCOMPLETE` → `ACTIVE` com CPF válido |
| UC04 | RF06 | Vídeo rewarded (AdMob/simulado) antes da coleta |
| UC05 | RF07, RN02 | Campanha B2B + Smart Blending (margem dinâmica) |
| UC06 | RF08 | Mapa de moedas `financial_coins` via Redis geo |
| UC07 | RF09–10, RN01 | Coleta antifraude (25m, fingerprint, rate limit) |

---

## Backend

### Novos use cases

| Arquivo | Responsabilidade |
|---------|------------------|
| `user/upgrade-cpf.use-case.ts` | Valida CPF (dígitos verificadores), `status=ACTIVE`, `cpf_hash` |
| `campaign/get-active-campaign.use-case.ts` | Campanha `ACTIVE` do establishment |
| `campaign/watch-rewarded-video.use-case.ts` | Registra view; token one-time para coleta |
| `coin/list-nearby-coins.use-case.ts` | `GEOSEARCH active_coins:geo` + join DB |
| `coin/collect-coin.use-case.ts` | Geofence, fingerprint, vídeo token, credita `wallet_balance`, `wallet_transactions` |

### Domínio

- `SmartBlendingCalculatorService` (já pode existir):  
  `reward = coin_value * (1 - global_margin) * campaign_multiplier`  
  Ler `global_margin` de `platform_settings`.
- `DeviceFingerprintService` ou validação em use case: hash estável (user-agent + canvas stub + IP subnet opcional) em Redis `device:{hash}:collects` rate limit.

### Redis

- `active_coins:geo` — GEOADD ao criar/ativar `financial_coins`
- `video:token:{userId}:{coinId}` — TTL 300s após vídeo
- `collect:rate:{cpf_hash}:{coinId}` — 1 coleta por moeda

### Controllers

| Rota | Método |
|------|--------|
| `/user/upgrade-cpf` | POST `{ cpf }` |
| `/campaigns/:establishmentId/active` | GET |
| `/campaigns/rewarded-video/complete` | POST `{ coin_id, ad_session_id }` |
| `/coins/nearby` | GET `?lat=&lon=&radius_km=5` |
| `/coins/:id/collect` | POST `{ lat, lon, video_token, device_fingerprint }` |

### Seeds

- `financial_coins` com `geom`, `value_brl`, `campaign_id`
- `campaigns` com `status=ACTIVE`, `reward_multiplier`
- Atualizar seed: `fase_monetizacao_ativa = true` (flag de dev; produção via admin Fase 6)

### Testes

- UC02: CPF inválido → 400; duplicado `cpf_hash` → 409
- UC07: coleta a 300m → 403; sem video_token → 403; segunda coleta mesma moeda → 409
- Smart Blending: margem 0.40 → reward esperado em teste unitário

---

## PWA

| Tela | Mudanças |
|------|----------|
| `MapPage` | Camada moedas (ícone diferente de pacotes); modal coleta |
| `OnboardingCpfPage` | Form CPF mascarado → `POST /user/upgrade-cpf` |
| `WalletPage` | Saldo real de `GET /user/me` (`wallet_balance`) |
| `RewardedVideoModal` | Simula AdMob (timer 15s ou SDK stub) → token |
| Remover/ocultar `TeaserBanner` quando `fase_monetizacao_ativa=true` |

### Fluxo coleta (ordem)

1. Usuário `ACTIVE` toca moeda
2. Se campanha exige vídeo → `RewardedVideoModal` → `complete` → token
3. `POST /coins/:id/collect` com GPS + fingerprint
4. Atualizar wallet na UI

---

## Regras (valores exatos)

- Geofence coleta: **25m**
- Margem global default: **0.40** (`platform_settings.global_margin`)
- Status coleta: `wallet_transactions.status = COMPLETED` na Fase 2 (saque na Fase 4)
- Usuário `INCOMPLETE` não coleta moedas → **403**

---

## Critérios de aceite

- [ ] `upgrade-cpf` ativa conta e persiste hash
- [ ] Mapa exibe moedas e pacotes simultaneamente
- [ ] Coleta só com vídeo quando campanha exige
- [ ] `wallet_balance` incrementa corretamente
- [ ] Smart Blending reflete margem + multiplier
- [ ] Antifraude bloqueia GPS spoof óbvio (distância)
- [ ] Teasers desligados com flag true
- [ ] Testes UC02, UC04–07 verdes

---

## NÃO implementar

- UC03 CNPJ produção (Fase 3)
- UC11 saque Pix (Fase 4)
- UC12 analytics dashboard (Fase 3)
- Portal PJ completo (Fase 3)
- Admin CMS (Fase 6)

---

## Comando Cursor

```
Implemente integralmente @prompts/PROMPT_FASE_02_PIX_REAL.md.
Não avance para Fase 3.
```
