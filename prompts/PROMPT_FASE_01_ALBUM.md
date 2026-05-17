# PROMPT FASE 1 — Álbum da Copa (MVP viral, sem Pix real)

> **Pré-requisito:** Fase 0 concluída (`health` OK, migrations, Redis).  
> **Próxima fase:** `PROMPT_FASE_02_PIX_REAL.md`  
> **Referências:** `@BRD.md` (RF11–14, RN03 pacotes) `@USE_CASES.md` (UC01, UC08–10) `@DATABASE_BLUEPRINT.md`

---

## Objetivo

Usuário entra com Google, vê mapa com **pacotes** de figurinhas, abre pacotes (70/25/5), coleção no álbum, queima cupom no PDV e troca repetidas por PIN.  
`fase_monetizacao_ativa = false` → banners teaser RF14. **Sem** moedas financeiras nem saque real.

---

## UCs desta fase

| UC | RF/RN | Descrição |
|----|-------|-----------|
| UC01 | RF05 Fase 1 | Login Google → `INCOMPLETE` |
| UC08 | RF11, RN03 | Abrir pacote georreferenciado |
| UC09 | RF12 | Queima cupom QR no caixa |
| UC10 | RF13 | Troca local PIN (Redis 120s) |
| — | RF14 | Teasers "Em breve Pix Real" |

---

## Backend — implementar/completar

### Use cases (`apps/api/src/use-cases/`)

| Arquivo | Responsabilidade |
|---------|------------------|
| `auth/google-login.use-case.ts` | OAuth payload → upsert user `INCOMPLETE`, JWT |
| `album/open-pack.use-case.ts` | Rate 2/dia/filial, geofence 25m, 3× RarityRoller, `unified_collections` |
| `album/generate-trade-pin.use-case.ts` | PIN 4 dígitos, `trade:pin:{pin}` Hash TTL 120 |
| `album/confirm-trade-pin.use-case.ts` | HGETALL, proximidade 25m, transfer `user_stickers` |
| `sticker/redeem-sticker-coupon.use-case.ts` | Valida inventário, `NOT_REDEEMED` → `REDEEMED` |

### Ports + repositories

- `USER_REPOSITORY`, `STICKER_PACK_REPOSITORY`, `STICKER_REPOSITORY`, `USER_STICKER_REPOSITORY`, `UNIFIED_COLLECTION_REPOSITORY`, `PLATFORM_SETTING_REPOSITORY`
- `StickerPackRepository.findNearby(lat, lon, radiusKm)` via PostGIS ou Redis `GEOSEARCH active_packs:geo`
- Ao seed/startup: `GEOADD active_packs:geo` para cada `sticker_packs` ativo

### Controllers

| Rota | Método | Handler |
|------|--------|---------|
| `/auth/google` | GET | Redirect OAuth |
| `/auth/google/callback` | GET | Callback → JWT → redirect PWA |
| `/user/me` | GET | Perfil JWT |
| `/album/open-pack` | POST | `{ pack_id, lat, lon }` |
| `/album/trade/generate-pin` | POST | `{ sticker_id, lat, lon }` |
| `/album/trade/confirm-pin` | POST | `{ pin, lat, lon }` |
| `/stickers/redeem` | POST | `{ qr_token }` (operador PJ pode usar mesma rota na Fase 3) |
| `/settings/public` | GET | `{ fase_monetizacao_ativa, tema_ativo }` |

### Domínio

- `RarityRollerService`: 70% COMMON, 25% RARE, 5% LEGENDARY
- `GeoValidatorService`: reutilizar da Fase 0

### Seeds obrigatórios

- 3+ `establishments` com `geom` (São Paulo ou Brasília)
- `sticker_packs` por establishment
- 20+ `stickers` (mix raridades, alguns `has_reward=true`)
- Popular Redis `active_packs:geo`

### Testes (obrigatórios)

- Unit: `google-login`, `open-pack` (rate limit 429), `rarity-roller`, `confirm-trade-pin` (410 expirado)
- E2E ou integração: fluxo open-pack → user_stickers incrementado
- Gherkin de `USE_CASES.md` UC01, UC08 (2), UC09 (2), UC10 (2) como spec files em `apps/api/test/`

---

## PWA — implementar/completar (`apps/pwa/`)

| Tela / componente | Função |
|-------------------|--------|
| `LoginPage` | Botão Google OAuth |
| `AuthCallbackPage` | Salva JWT localStorage |
| `MapPage` | Leaflet + GPS; **GET packs nearby**; botão "Rasgar pacote"; `TeaserBanner` se `!fase_monetizacao_ativa` |
| `AlbumPage` | Grid figurinhas, repetidas, abrir cupom, `TradePinModal` |
| `WalletPage` | Modo demo (saldo fictício ou bloqueado) + teaser RF14 |
| `hooks/useAuth.ts` | JWT, redirect se não logado |
| `hooks/useSettings.ts` | Poll `/settings/public` |
| `services/api.ts` | Axios/fetch com Bearer |

**MapPage deve:**

1. Chamar API listando pacotes em 5km (criar `GET /album/packs/nearby?lat=&lon=` se não existir).
2. Marcadores clicáveis → modal confirma → `POST /album/open-pack`.
3. Exibir cards recebidos com animação simples.

---

## Regras de negócio (valores exatos)

- Pacotes: **máx. 2** por CPF + `establishment_id` + dia (`unified_collections`, `asset_type=STICKER_PACK`)
- Geofence: **25 metros** até o ponto do pacote
- PIN: **4 dígitos**, TTL **120 segundos**, proximidade **25m** entre A e B
- Cupom: QR único; segunda leitura → **HTTP 409**

---

## Critérios de aceite

- [ ] Login Google cria `users.status = INCOMPLETE`, CPF null
- [ ] Mapa mostra pacotes reais da API (não só mapa vazio)
- [ ] Abertura retorna 3 figurinhas com raridades válidas
- [ ] Terceiro pacote no mesmo dia/filial → 429
- [ ] Cupom queima uma vez; segunda vez → 409
- [ ] PIN expira após 120s → 410
- [ ] Banner teaser visível com `fase_monetizacao_ativa=false`
- [ ] `npm run test` verde nos módulos da fase

---

## NÃO implementar nesta fase

- UC02 upgrade CPF, UC04–07, UC11–12
- Moedas `financial_coins` no mapa
- `active_coins:geo`
- Portal PJ (`packages/portal-pj`)
- WebAR, vídeo rewarded, saque Pix

---

## Comando Cursor

```
Implemente integralmente @prompts/PROMPT_FASE_01_ALBUM.md com @USE_CASES.md e @BRD.md.
Complete integração PWA↔API do mapa de pacotes. Não avance para Fase 2.
```
